import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: any) => {
  try {
    const userId = event.queryStringParameters?.userId;
    const limit = parseInt(event.queryStringParameters?.limit || "10");
    const lastEvaluatedKey = event.queryStringParameters?.lastEvaluatedKey;

    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ message: "userId is required" }) };
    }

    const params: any = {
      TableName: process.env.DYNAMO_TABLE!,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": userId },
      Limit: limit,
      ScanIndexForward: false
    };

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastEvaluatedKey));
    }

    const data = await ddb.send(new QueryCommand(params));

    return {
      statusCode: 200,
      body: JSON.stringify({
        items: data.Items,
        lastEvaluatedKey: data.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(data.LastEvaluatedKey)) : null
      }),
    };
  } catch (error: any) {
    console.error("List Error:", error);
    return { statusCode: 500, body: JSON.stringify({ message: "Error listing transcriptions" }) };
  }
};
