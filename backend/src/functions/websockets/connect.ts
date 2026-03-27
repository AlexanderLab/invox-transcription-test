import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: any) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const userId = event.queryStringParameters?.userId || "anonymous";

    await ddb.send(new PutCommand({
      TableName: process.env.CONNECTIONS_TABLE!,
      Item: {
        connectionId,
        userId,
        createdAt: new Date().toISOString()
      }
    }));

    return { statusCode: 200 };
  } catch (error) {
    console.error("WebSocket Connect Error:", error);
    return { statusCode: 500 };
  }
};
