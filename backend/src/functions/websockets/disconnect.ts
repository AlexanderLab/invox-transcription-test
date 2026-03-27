import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: any) => {
  try {
    const connectionId = event.requestContext.connectionId;

    await ddb.send(new DeleteCommand({
      TableName: process.env.CONNECTIONS_TABLE!,
      Key: { connectionId }
    }));

    return { statusCode: 200 };
  } catch (error) {
    console.error("WebSocket Disconnect Error:", error);
    return { statusCode: 500 };
  }
};
