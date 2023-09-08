import { describe, expect, it } from 'vitest';
import { createReadStream } from 'node:fs';
import { elDelete, elIndexFile, elLoadById } from '../../../src/database/engine';
import { ADMIN_USER, testContext } from '../../utils/testQuery';
import { deleteFile, getFileContent, upload } from '../../../src/database/file-storage';
import { INDEX_FILES } from '../../../src/database/utils';

const testFileIndexing = async (file, documentId) => {
  // upload file in minio
  const uploadedFile = await upload(testContext, ADMIN_USER, 'import/global', file, {});

  // get file content in base64
  const fileContent = await getFileContent(uploadedFile.id, 'base64');

  // index file content
  await elIndexFile(documentId, fileContent, uploadedFile.id);

  // load file document
  const document = await elLoadById(testContext, ADMIN_USER, documentId, { indices: INDEX_FILES });

  // Assertions
  expect(document.attachment).not.toBeNull();
  expect(document.attachment.content_type.includes(file.mimetype)).toBeTruthy();

  // cleanup : delete file in minio and elastic
  await deleteFile(testContext, ADMIN_USER, uploadedFile.id);
  await elDelete(INDEX_FILES, documentId);
};

describe('Indexing file test', () => {
  it('Should index small pdf file', async () => {
    const file = {
      createReadStream: () => createReadStream('./tests/data/test-report-to-index.pdf'),
      filename: 'test-report-to-index.pdf',
      mimetype: 'application/pdf',
    };
    await testFileIndexing(file, 'TEST_FILE_1');
  });
  it('Should index large pdf file', async () => {
    // upload file in minio
    const file = {
      createReadStream: () => createReadStream('./tests/data/test-large-report-to-index.pdf'),
      filename: 'test-large-report-to-index.pdf',
      mimetype: 'application/pdf',
    };
    await testFileIndexing(file, 'TEST_FILE_2');
  });
  it('Should index txt file', async () => {
    // upload file in minio
    const file = {
      createReadStream: () => createReadStream('./tests/data/test-file-to-index.txt'),
      filename: 'test-file-to-index.txt',
      mimetype: 'text/plain',
    };
    await testFileIndexing(file, 'TEST_FILE_3');
  });
  it('Should index csv file', async () => {
    // upload file in minio
    const file = {
      createReadStream: () => createReadStream('./tests/data/test-file-to-index.csv'),
      filename: 'test-file-to-index.csv',
      mimetype: 'text/plain',
    };
    await testFileIndexing(file, 'TEST_FILE_4');
  });
  it('Should index xls file', async () => {
    // upload file in minio
    const file = {
      createReadStream: () => createReadStream('./tests/data/test-file-to-index.xls'),
      filename: 'test-file-to-index.xls',
      mimetype: 'application/vnd.ms-excel',
    };
    await testFileIndexing(file, 'TEST_FILE_5');
  });
  it('Should find document by search query', () => {
    // imlement test
  });
});
