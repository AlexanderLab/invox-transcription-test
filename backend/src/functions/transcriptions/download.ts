import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: any) => {
  try {
    const id = event.pathParameters?.id;
    const userId = event.queryStringParameters?.userId;

    if (!id || !userId) {
      return { statusCode: 400, body: JSON.stringify({ message: "id and userId required" }) };
    }

    const data = await ddb.send(new GetCommand({
      TableName: process.env.DYNAMO_TABLE!,
      Key: { userId, id }
    }));

    if (!data.Item) {
      return { statusCode: 404, body: JSON.stringify({ message: "Not found" }) };
    }

    const text = data.Item.text;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="transcription-${id}.txt"`
      },
      body: text,
    };
  } catch (error) {
    console.error("Download Error:", error);
    return { statusCode: 500, body: JSON.stringify({ message: "Error downloading" }) };
  }
};
