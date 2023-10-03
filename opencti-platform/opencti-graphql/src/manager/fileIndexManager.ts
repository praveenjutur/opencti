import { clearIntervalAsync, setIntervalAsync, type SetIntervalAsyncTimer } from 'set-interval-async/fixed';
import { Promise as BluePromise } from 'bluebird';
import moment from 'moment';
import type { BasicStoreSettings } from '../types/settings';
import { isNotEmptyField } from '../database/utils';
import conf, { ENABLED_FILE_INDEX_MANAGER, logApp } from '../config/conf';
import {
  lockResource,
} from '../database/redis';
import { executionContext, SYSTEM_USER } from '../utils/access';
import { getEntityFromCache } from '../database/cache';
import { ENTITY_TYPE_SETTINGS } from '../schema/internalObject';
import { elBulkIndexFiles, elSearchFiles, isAttachmentProcessorEnabled } from '../database/engine';
import { getFileContent, rawFilesListing } from '../database/file-storage';
import type { AuthContext } from '../types/user';
import { generateInternalId } from '../schema/identifier';

const FILE_INDEX_MANAGER_KEY = conf.get('file_index_manager:lock_key');
const SCHEDULE_TIME = conf.get('file_index_manager:interval') || 300000; // 5 minutes
const MAX_FILE_SIZE: number = conf.get('file_index_manager:max_file_size') || 5242880; // 5 mb
const defaultMimeTypes = ['application/pdf', 'text/plain', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
const ACCEPT_MIME_TYPES: string[] = conf.get('file_index_manager:accept_mime_types') || defaultMimeTypes;

// TODO use configuration entity for parameters
const indexImportedFiles = async (
  context: AuthContext,
  fromDate: Date | null = null,
  path = 'import/', // or '/import/global'
  // limit = 1000,
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
  }); // TODO add data (like entity_id, mimeType) ?
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

const initFileIndexManager = () => {
  let scheduler: SetIntervalAsyncTimer<[]>;
  // let streamProcessor: StreamProcessor;
  let running = false;
  const context = executionContext('file_index_manager');
  const fileIndexHandler = async () => {
    const settings = await getEntityFromCache<BasicStoreSettings>(context, SYSTEM_USER, ENTITY_TYPE_SETTINGS);
    const enterpriseEditionEnabled = isNotEmptyField(settings?.enterprise_edition);
    if (enterpriseEditionEnabled) {
      let lock;
      try {
        // Lock the manager
        lock = await lockResource([FILE_INDEX_MANAGER_KEY], { retryCount: 0 });
        running = true;
        logApp.info('[OPENCTI-MODULE] Running file index manager');
        const lastFiles = await elSearchFiles(context, SYSTEM_USER, { first: 1, connectionFormat: false });
        const lastIndexedDate = lastFiles?.length > 0 ? moment(lastFiles[0].indexed_at).toDate() : null;
        logApp.info('[OPENCTI-MODULE] Index imported files since', { lastIndexedDate });
        await indexImportedFiles(context, lastIndexedDate);
        // TODO handle lock ?
        logApp.info('[OPENCTI-MODULE] End of file index manager processing');
      } finally {
        running = false;
        // if (streamProcessor) await streamProcessor.shutdown();
        if (lock) await lock.unlock();
      }
    }
  };

  return {
    start: async () => {
      scheduler = setIntervalAsync(async () => {
        await fileIndexHandler();
      }, SCHEDULE_TIME);
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
      if (scheduler) {
        await clearIntervalAsync(scheduler);
      }
      return true;
    },
  };
};

const fileIndexManager = initFileIndexManager();
export default fileIndexManager;
