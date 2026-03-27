import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: any) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { userId, text } = body;

    if (!userId || !text) {
      return { statusCode: 400, body: JSON.stringify({ message: "userId and text required" }) };
    }

    const id = uuidv4();

    await ddb.send(new PutCommand({
      TableName: process.env.DYNAMO_TABLE!,
      Item: {
        userId,
        id,
        text,
        createdAt: new Date().toISOString(),
        type: "live"
      }
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ id, message: "Saved successfully" }),
    };
  } catch (error) {
    console.error("Save Live Error:", error);
    return { statusCode: 500, body: JSON.stringify({ message: "Error saving live transcription" }) };
  }
};
