import { clearIntervalAsync, setIntervalAsync, type SetIntervalAsyncTimer } from 'set-interval-async/fixed';
import type { BasicStoreSettings } from '../types/settings';
import { isNotEmptyField, READ_INDEX_FILES } from '../database/utils';
import conf, { logApp } from '../config/conf';
import { createStreamProcessor, FILE_INDEX_STREAM_NAME, lockResource, type StreamProcessor } from '../database/redis';
import { executionContext, SYSTEM_USER } from '../utils/access';
import type { SseEvent, StreamFileIndexEvent } from '../types/event';
import { getEntityFromCache } from '../database/cache';
import { ENTITY_TYPE_SETTINGS } from '../schema/internalObject';
import { elCount } from '../database/engine';

const FILE_INDEX_MANAGER_KEY = conf.get('file_index_manager:lock_key');
const SCHEDULE_TIME = conf.get('file_index_manager:interval') || 60000;

const fileIndexStreamHandler = async (streamEvents: Array<SseEvent<StreamFileIndexEvent>>) => {
  // TODO handle events
};

const initFileIndexManager = () => {
  const WAIT_TIME_ACTION = 2000; // TODO why 2000 ?
  let scheduler: SetIntervalAsyncTimer<[]>;
  let streamProcessor: StreamProcessor;
  let running = false;
  let shutdown = false;
  const context = executionContext('file_index_manager');
  const wait = (ms: number) => { // TODO duplicated method
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };
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
        const streamOpts = { streamName: FILE_INDEX_STREAM_NAME };
        streamProcessor = createStreamProcessor(SYSTEM_USER, 'File Index manager', fileIndexStreamHandler, streamOpts);
        await streamProcessor.start('live');
        while (!shutdown && streamProcessor.running()) {
          await wait(WAIT_TIME_ACTION);
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
      shutdown = false;
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
      shutdown = true;
      if (scheduler) {
        await clearIntervalAsync(scheduler);
      }
      return true;
    },
  };
};

const fileIndexManager = initFileIndexManager();
export default fileIndexManager;
