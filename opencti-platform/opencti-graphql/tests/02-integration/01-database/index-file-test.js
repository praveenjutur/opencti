import { describe, expect, it } from 'vitest';
import { createReadStream } from 'node:fs';
import { elDelete, elIndexFile, elLoadById } from '../../../src/database/engine';
import { ADMIN_USER, testContext } from '../../utils/testQuery';
import { deleteFile, getFileContent, upload } from '../../../src/database/file-storage';
import { INDEX_FILES } from '../../../src/database/utils';

describe('Indexing file test', () => {
  it('should ingest correct', async () => {
    // upload file in minio
    const file = {
      createReadStream: () => createReadStream('./tests/data/test-report-to-index.pdf'),
      filename: 'test-report-to-index.pdf',
      mimetype: 'application/pdf',
    };
    const uploadedFile = upload(testContext, ADMIN_USER, 'import/global', file, {});
    // get file content in base64
    const fileContent = getFileContent(uploadedFile.id, 'base64');
    // index file content
    const documentId = 'TEST_FILE_1';
    const result = await elIndexFile(fileContent, documentId);
    console.log('result', result);
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
    // load file document
    const document = await elLoadById(testContext, ADMIN_USER, documentId);
    console.log('document', document);
    // Assertions
    expect(document._source.attachment).not.toBeNull();
    expect(document._source.attachment.title.toEqual('What is Elasticsearch?'));

    // cleanup : delete file in minio and elastic
    await deleteFile(testContext, ADMIN_USER, uploadedFile.id);
    await elDelete(INDEX_FILES, documentId);
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
