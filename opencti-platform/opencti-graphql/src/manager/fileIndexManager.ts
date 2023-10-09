import { clearIntervalAsync, setIntervalAsync, type SetIntervalAsyncTimer } from 'set-interval-async/fixed';
import { Promise as BluePromise } from 'bluebird';
import moment from 'moment';
import type { BasicStoreSettings } from '../types/settings';
import { EVENT_TYPE_UPDATE, isNotEmptyField } from '../database/utils';
import conf, { ENABLED_FILE_INDEX_MANAGER, logApp } from '../config/conf';
import {
  createStreamProcessor,
  lockResource,
  type StreamProcessor,
} from '../database/redis';
import { executionContext, SYSTEM_USER } from '../utils/access';
import { getEntityFromCache } from '../database/cache';
import { ENTITY_TYPE_SETTINGS } from '../schema/internalObject';
import {
  elBulkIndexFiles,
  elLoadById,
  elSearchFiles,
  elUpdateFilesWithEntityRestrictions,
  isAttachmentProcessorEnabled
} from '../database/engine';
import { getFileContent, rawFilesListing } from '../database/file-storage';
import type { AuthContext } from '../types/user';
import { generateInternalId } from '../schema/identifier';
import { TYPE_LOCK_ERROR } from '../config/errors';
import type { SseEvent, StreamDataEvent, UpdateEvent } from '../types/event';
import { STIX_EXT_OCTI } from '../types/stix-extensions';
import { getLastIndexedDate, saveFileIndexStatus } from '../domain/file';

const FILE_INDEX_MANAGER_KEY = conf.get('file_index_manager:lock_key');
const SCHEDULE_TIME = conf.get('file_index_manager:interval') || 300000; // 5 minutes
const STREAM_SCHEDULE_TIME = 10000;
const FILE_INDEX_MANAGER_STREAM_KEY = conf.get('file_index_manager:stream_lock_key');

const MAX_FILE_SIZE: number = conf.get('file_index_manager:max_file_size') || 5242880; // 5 mb
const defaultMimeTypes = ['application/pdf', 'text/plain', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
const ACCEPT_MIME_TYPES: string[] = conf.get('file_index_manager:accept_mime_types') || defaultMimeTypes;

// TODO add limit for number of files ?
const indexImportedFiles = async (
  context: AuthContext,
  fromDate: Date | null = null,
  path = 'import/',
  maxFileSize = MAX_FILE_SIZE,
  mimeTypes = ACCEPT_MIME_TYPES,
) => {
  const fileListingOpts = { modifiedSince: fromDate, excludePath: 'import/pending/' };
  let files = await rawFilesListing(context, SYSTEM_USER, path, true, fileListingOpts);
  if (mimeTypes?.length > 0) {
    files = files.filter((file) => {
      return maxFileSize >= (file.size || 0) && file.metaData?.mimetype && mimeTypes.includes(file.metaData.mimetype);
    });
  }
  if (files.length === 0) {
    return;
  }
  // search documents by file id (to update if already indexed)
  const searchOptions = {
    first: files.length, // TODO maybe we should paginate ?
    connectionFormat: false,
    highlight: false,
    fileIds: files.map((f) => f.id),
    fields: ['internal_id', 'file_id'],
  };
  const existingFiles = await elSearchFiles(context, SYSTEM_USER, searchOptions);
  const filesToLoad = files.map((file) => {
    const existingFile = existingFiles.find((e: { file_id: string, internal_id: string }) => e.file_id === file.id);
    const internalId = existingFile ? existingFile.internal_id : generateInternalId();
    const entityId = file.metaData.entity_id;
    return {
      id: file.id,
      internalId,
      entityId,
      name: file.name,
      uploaded_at: file.lastModified,
    };
  });
  const loadFilesToIndex = async (file: { id: string, internalId: string, entityId: string | null, name: string, uploaded_at: Date | undefined }) => {
    const content = await getFileContent(file.id, 'base64');
    // TODO test content is not null
    return {
      internal_id: file.internalId,
      file_id: file.id,
      file_data: content,
      entity_id: file.entityId,
      name: file.name,
      uploaded_at: file.uploaded_at,
    };
  };
  const filesToIndex = await BluePromise.map(filesToLoad, loadFilesToIndex, { concurrency: 5 });
  await elBulkIndexFiles(context, SYSTEM_USER, filesToIndex);
};

const handleStreamEvents = async (streamEvents: Array<SseEvent<StreamDataEvent>>) => {
  try {
    if (streamEvents.length === 0) {
      return;
    }
    const context = executionContext('file_index_manager');
    for (let index = 0; index < streamEvents.length; index += 1) {
      const event = streamEvents[index];
      if (event.data.type === EVENT_TYPE_UPDATE) {
        const updateEvent: UpdateEvent = event.data as UpdateEvent;
        const stix = updateEvent.data;
        const entityId = stix.extensions[STIX_EXT_OCTI].id;
        const stixFiles = stix.extensions[STIX_EXT_OCTI].files;
        // test if markings or organization sharing or authorized members or authorities have been updated
        const isDataRestrictionsUpdate = updateEvent.context?.patch && updateEvent.context.patch
          .map((op) => op.path && (op.path.includes('granted_refs') || op.path.includes('object_marking_refs')));
        if (stixFiles?.length > 0 && isDataRestrictionsUpdate) {
          // update all indexed files for this entity
          const entity = await elLoadById(context, SYSTEM_USER, entityId);
          await elUpdateFilesWithEntityRestrictions(entity);
        }
      }
    }
  } catch (e) {
    logApp.error('[OPENCTI-MODULE] Error executing file index manager stream handler', { error: e });
  }
};

const initFileIndexManager = () => {
  const WAIT_TIME_ACTION = 2000;
  let scheduler: SetIntervalAsyncTimer<[]>;
  let streamScheduler: SetIntervalAsyncTimer<[]>;
  let streamProcessor: StreamProcessor;
  let running = false;
  let shutdown = false;
  const wait = (ms: number) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };
  const fileIndexHandler = async () => {
    const context = executionContext('file_index_manager');
    const settings = await getEntityFromCache<BasicStoreSettings>(context, SYSTEM_USER, ENTITY_TYPE_SETTINGS);
    const enterpriseEditionEnabled = isNotEmptyField(settings?.enterprise_edition);
    if (enterpriseEditionEnabled) {
      let lock;
      try {
        // Lock the manager
        lock = await lockResource([FILE_INDEX_MANAGER_KEY], { retryCount: 0 });
        running = true;
        logApp.info('[OPENCTI-MODULE] Running file index manager');
        const lastIndexedDate = await getLastIndexedDate(context, SYSTEM_USER);
        const indexFromDate = lastIndexedDate ? moment(lastIndexedDate).toDate() : null;
        logApp.info('[OPENCTI-MODULE] Index imported files since', { lastIndexedDate });
        await indexImportedFiles(context, indexFromDate);
        await saveFileIndexStatus(context, SYSTEM_USER);
        logApp.info('[OPENCTI-MODULE] End of file index manager processing');
      } finally {
        running = false;
        if (lock) await lock.unlock();
      }
    }
  };
  const fileIndexStreamHandler = async () => {
    let lock;
    try {
      // Lock the manager
      lock = await lockResource([FILE_INDEX_MANAGER_STREAM_KEY], { retryCount: 0 });
      running = true;
      logApp.info('[OPENCTI-MODULE] Running file index manager stream handler');
      streamProcessor = createStreamProcessor(SYSTEM_USER, 'File index manager', handleStreamEvents);
      await streamProcessor.start('live');
      while (!shutdown && streamProcessor.running()) {
        await wait(WAIT_TIME_ACTION);
      }
      logApp.info('[OPENCTI-MODULE] End of file index manager stream handler');
    } catch (e: any) {
      if (e.name === TYPE_LOCK_ERROR) {
        logApp.debug('[OPENCTI-MODULE] File index manager stream handler already started by another API');
      } else {
        logApp.error('[OPENCTI-MODULE] File index manager stream handler failed to start', { error: e });
      }
    } finally {
      if (streamProcessor) await streamProcessor.shutdown();
      if (lock) await lock.unlock();
    }
  };

  return {
    start: async () => {
      scheduler = setIntervalAsync(async () => {
        await fileIndexHandler();
      }, SCHEDULE_TIME);
      // stream to index updates on entities
      streamScheduler = setIntervalAsync(async () => {
        await fileIndexStreamHandler();
      }, STREAM_SCHEDULE_TIME);
    },
    status: (settings?: BasicStoreSettings) => {
      return {
        id: 'FILE_INDEX_MANAGER',
        enable: ENABLED_FILE_INDEX_MANAGER && isAttachmentProcessorEnabled() && isNotEmptyField(settings?.enterprise_edition),
        running,
      };
    },
    shutdown: async () => {
      logApp.info('[OPENCTI-MODULE] Stopping file index manager');
      shutdown = true;
      if (scheduler) await clearIntervalAsync(scheduler);
      if (streamScheduler) await clearIntervalAsync(streamScheduler);
      return true;
    },
  };
};

const fileIndexManager = initFileIndexManager();
export default fileIndexManager;
