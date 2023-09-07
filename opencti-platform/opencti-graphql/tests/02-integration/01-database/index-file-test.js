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
    const uploadedFile = await upload(testContext, ADMIN_USER, 'import/global', file, {});

    // get file content in base64
    const fileContent = await getFileContent(uploadedFile.id, 'base64');
    // index file content
    const documentId = 'TEST_FILE_1';
    await elIndexFile(fileContent, documentId);

    // load file document
    const document = await elLoadById(testContext, ADMIN_USER, documentId, { indices: INDEX_FILES });
    console.log('document', document);

    // Assertions
    expect(document.attachment).not.toBeNull();
    expect(document.attachment.content_type).toEqual('application/pdf');

    // cleanup : delete file in minio and elastic
    await deleteFile(testContext, ADMIN_USER, uploadedFile.id);
    await elDelete(INDEX_FILES, documentId);
  });
});
