import { clearIntervalAsync, setIntervalAsync, type SetIntervalAsyncTimer } from 'set-interval-async/fixed';
import { Promise as BluePromise } from 'bluebird';
import type { BasicStoreSettings } from '../types/settings';
import { isNotEmptyField, READ_INDEX_FILES } from '../database/utils';
import conf, { logApp } from '../config/conf';
import {
  lockResource,
  type StreamProcessor
} from '../database/redis';
import { executionContext, SYSTEM_USER } from '../utils/access';
import { getEntityFromCache } from '../database/cache';
import { ENTITY_TYPE_SETTINGS } from '../schema/internalObject';
import { elBulkIndexFiles, elCount } from '../database/engine';
import { getFileContent, rawFilesListing } from '../database/file-storage';
import type { AuthContext } from '../types/user';
import { generateInternalId } from '../schema/identifier';

const FILE_INDEX_MANAGER_KEY = conf.get('file_index_manager:lock_key');
const SCHEDULE_TIME = conf.get('file_index_manager:interval') || 60000;

// TODO use configuration entity for parameters
const indexImportedFiles = async (
  context: AuthContext,
  // limit = 1000,
  maxFileSize = 5242880, // 5 mb
  mimeTypes = ['application/pdf', 'text/plain', 'text/csv'],
  path = '/import', // or '/import/global'
  // fromDate = null,
) => {
  // TODO how can we exclude import/pending bucket ?
  let files = await rawFilesListing(context, SYSTEM_USER, path, true);
  if (mimeTypes?.length > 0) {
    files = files.filter((file) => {
      return maxFileSize >= (file.size || 0) && file.metaData?.mimetype && mimeTypes.includes(file.metaData.mimetype);
    });
  }
  const filesToLoad = files.map((file) => ({ id: file.id })); // TODO add data (like entity_id, mimeType) ?
  // TODO search documents by file id (to update if already indexed)
  const loadFilesToIndex = async (file: { id: string }) => {
    const content = await getFileContent(file.id, 'base64');
    // TODO test content is not null
    return { internal_id: generateInternalId(), file_id: file.id, file_data: content };
  };
  const filesToIndex = await BluePromise.map(filesToLoad, loadFilesToIndex, { concurrency: 5 });
  await elBulkIndexFiles(filesToIndex);
};

const initFileIndexManager = () => {
  let scheduler: SetIntervalAsyncTimer<[]>;
  let streamProcessor: StreamProcessor;
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
        const filesCount = await elCount(context, SYSTEM_USER, READ_INDEX_FILES);
        if (filesCount === 0) {
          logApp.info('[OPENCTI-MODULE] file index empty, run first indexation');
          await indexImportedFiles(context);
        }
        // TODO handle lock ?
        logApp.info('[OPENCTI-MODULE] End of file index manager processing');
      } finally {
        running = false;
        if (streamProcessor) await streamProcessor.shutdown();
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
        enable: isNotEmptyField(settings?.enterprise_edition),
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
