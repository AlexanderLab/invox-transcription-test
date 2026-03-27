import { describe, it, expect, beforeEach } from '@jest/globals';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { handler as listHandler } from '../src/functions/transcriptions/list';
import { handler as saveLiveHandler } from '../src/functions/transcriptions/saveLive';

const ddbMock = mockClient(DynamoDBDocumentClient);
const s3Mock = mockClient(S3Client);

jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid'
}));

describe('Transcriptions Functions', () => {
  beforeEach(() => {
    ddbMock.reset();
    s3Mock.reset();
    process.env.DYNAMO_TABLE = 'test-table';
    process.env.S3_BUCKET = 'test-bucket';
  });

  describe('List Transcriptions', () => {
    it('should list user transcriptions successfully', async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [
          { id: '1', userId: 'user-1', text: 'hello' }
        ],
        LastEvaluatedKey: { id: '1' }
      });

      const event = {
        queryStringParameters: { userId: 'user-1' }
      } as any;

      const response = await listHandler(event);
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.items.length).toBe(1);
      expect(body.lastEvaluatedKey).toEqual('%7B%22id%22%3A%221%22%7D');
    });

    it('should return 400 if userId is missing', async () => {
      const event = {
        queryStringParameters: {}
      } as any;
      const response = await listHandler(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('Save Live Transcription', () => {
    it('should save real-time transcription successfully', async () => {
      ddbMock.on(PutCommand).resolves({});

      const event = {
        body: JSON.stringify({ userId: 'user-1', text: 'live transcription' })
      } as any;

      const response = await saveLiveHandler(event);
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).message).toBe('Saved successfully');
    });
  });
});
