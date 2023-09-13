import { clearIntervalAsync, setIntervalAsync, type SetIntervalAsyncTimer } from 'set-interval-async/fixed';
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
import { elCount } from '../database/engine';

const FILE_INDEX_MANAGER_KEY = conf.get('file_index_manager:lock_key');
const SCHEDULE_TIME = conf.get('file_index_manager:interval') || 60000;

const initFileIndexManager = () => {
  let scheduler: SetIntervalAsyncTimer<[]>;
  let streamProcessor: StreamProcessor;
  let running = false;
  const context = executionContext('file_index_manager');
  const fileIndexHandler = async () => {
    const settings = await getEntityFromCache<BasicStoreSettings>(context, SYSTEM_USER, ENTITY_TYPE_SETTINGS);
    const enterpriseEditionEnabled = isNotEmptyField(settings?.enterprise_edition);
    if (enterpriseEditionEnabled) { // TODO start only if enterprise_edition enabled ?
      let lock;
      try {
        // Lock the manager
        lock = await lockResource([FILE_INDEX_MANAGER_KEY], { retryCount: 0 });
        running = true;
        logApp.info('[OPENCTI-MODULE] Running file index manager');
        const filesCount = await elCount(context, SYSTEM_USER, READ_INDEX_FILES);
        if (filesCount === 0) {
          logApp.info('[OPENCTI-MODULE] file index empty, run first indexation');
          // TODO first indexation => send to stream ? or run here ? might be long
        }
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
