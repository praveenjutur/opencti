import { afterAll, describe, expect, it } from 'vitest';
import { createReadStream } from 'node:fs';
import { elDelete, elIndexFile, elLoadById, elSearchFiles } from '../../../src/database/engine';
import { ADMIN_USER, testContext } from '../../utils/testQuery';
import { deleteFile, getFileContent, upload } from '../../../src/database/file-storage';
import { INDEX_FILES } from '../../../src/database/utils';

const testFileIndexing = async (fileName, mimetype, documentId) => {
  const file = {
    createReadStream: () => createReadStream(`./tests/data/${fileName}`),
    filename: fileName,
    mimetype,
  };
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
  expect(document.attachment.content).not.toBeNull();
  expect(document.attachment.content_type.includes(file.mimetype)).toBeTruthy();
  expect(document.file_id).toEqual(uploadedFile.id);

  // cleanup : delete file in minio
  await deleteFile(testContext, ADMIN_USER, uploadedFile.id);

  //TODO method should return document each test should assert specificly on it
};

const testFilesSearching = async (search, expectedFilesIds) => {
  const data = await elSearchFiles(testContext, ADMIN_USER, { search });
  expect(data).not.toBeNull();
  expect(data.edges.length).toEqual(expectedFilesIds.length);
  const resultIds = data.edges.map((edge) => edge.node.id);
  expect(resultIds).toEqual(expectedFilesIds);
};

const filesIds = ['TEST_FILE_1', 'TEST_FILE_2', 'TEST_FILE_3', 'TEST_FILE_4', 'TEST_FILE_5'];
describe('Indexing file test', () => {
  afterAll(async () => {
    // cleanup : delete file in elastic
    await Promise.all(filesIds.map((fileId) => elDelete(INDEX_FILES, fileId)));
  });
  it('Should index small pdf file', async () => {
    await testFileIndexing('test-report-to-index.pdf', 'application/pdf', 'TEST_FILE_1');
  });
  it('Should index large pdf file', async () => {
    await testFileIndexing('test-large-report-to-index.pdf', 'application/pdf', 'TEST_FILE_2');
  });
  it('Should index txt file', async () => {
    await testFileIndexing('test-file-to-index.txt', 'text/plain', 'TEST_FILE_3');
  });
  it('Should index csv file', async () => {
    await testFileIndexing('test-file-to-index.csv', 'text/plain', 'TEST_FILE_4');
  });
  it('Should index xls file', async () => {
    await testFileIndexing('test-file-to-index.xls', 'application/vnd.ms-excel', 'TEST_FILE_5');
  });
  it('Should find document by search query', async () => {
    await testFilesSearching('elastic', ['TEST_FILE_1']);
    await testFilesSearching('control', ['TEST_FILE_4', 'TEST_FILE_2']);
  });
});
