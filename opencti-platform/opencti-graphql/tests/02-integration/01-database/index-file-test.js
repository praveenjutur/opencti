import { describe, expect, it } from 'vitest';
import { createReadStream } from 'node:fs';
import { elLoadById } from '../../../src/database/engine';
import { ADMIN_USER, testContext } from '../../utils/testQuery';
import {getFileContent, upload} from '../../../src/database/file-storage';

describe('Indexing file test', () => {
  it('should ingest correct', async () => {

    // upload du file dans minio
    const file = {
      createReadStream: () => createReadStream('./tests/data/test-report-to-index.pdf'),
      filename: 'test-report-to-index.pdf',
      mimetype: 'application/pdf',
    };
    const uploadedFile = upload(testContext, ADMIN_USER, 'import/global', file, {});
    const fileContent = getFileContent(uploadedFile.id);

    /*    const queryResult = {
      "_index": "my-index-000001",
        "_id": "my_id2",
        "_version": 4,
        "result": "updated",
        "_shards": {
        "total": 2,
          "successful": 1,
          "failed": 0
      },
      "_seq_no": 4,
        "_primary_term": 3
    } */

    // const fileId = queryResult._id;

    // query result
    const result = await elLoadById(testContext, ADMIN_USER, fileId);

    // Assertions
    expect(result.source.attachment.title.toEqual('How did Clop get its hands on the MOVEit zero day?'));
  });
});

/* const result = {
  _index: 'my-index-000001',
  _id: 'my_id2',
  _version: 3,
  _seq_no: 3,
  _primary_term: 1,
  found: true,
  _source: {
    attachment: {
      date: '2023-08-31T09:36:43Z',
      content_type: 'application/pdf',
      author: 'Eitan',
      format: 'application/pdf; version=1.3',
      modified: '2023-08-31T09:36:43Z',
      language: 'en',
      title: 'How did Clop get its hands on the MOVEit zero day?',
      creator_tool: 'Safari',
      content: 'SOME CONTENT',
      content_length: 17530
    }
  }
}; */
