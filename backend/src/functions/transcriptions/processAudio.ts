import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import axios from "axios";

const s3 = new S3Client({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const wsClient = new ApiGatewayManagementApiClient({ endpoint: process.env.WS_ENDPOINT });

export const handler = async (event: any) => {
  console.log("=== processAudio START ===");
  console.log("Event:", JSON.stringify(event));

  try {
    const record = event.Records[0];
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    console.log(`[1] S3 trigger: bucket=${bucket} key=${key}`);

    const parts = key.split("/");
    const userId = parts[1];
    const filename = parts[2];
    const fileId = filename.split(".")[0];

    console.log(`[2] Parsed: userId=${userId} filename=${filename} fileId=${fileId}`);

    // 1. Get file from S3
    console.log("[3] Fetching file from S3...");
    const s3Obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const audioData = await s3Obj.Body?.transformToByteArray();
    if (!audioData) throw new Error("S3 Body is empty");
    const buffer = Buffer.from(audioData);
    console.log(`[4] File fetched from S3: ${buffer.byteLength} bytes`);

    // 2. Upload to AssemblyAI
    console.log("[5] Uploading to AssemblyAI...");
    const uploadRes = await axios.post("https://api.assemblyai.com/v2/upload", buffer, {
      headers: {
        authorization: process.env.ASSEMBLYAI_API_KEY!,
        "content-type": "application/octet-stream"
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });

    const audioUrl = uploadRes.data.upload_url;
    console.log(`[6] Uploaded to AssemblyAI, audio_url=${audioUrl}`);

    // 3. Start Transcription
    console.log("[7] Starting transcription job...");
    const transcriptRes = await axios.post("https://api.assemblyai.com/v2/transcript", {
      audio_url: audioUrl,
      language_code: "es",
      speech_models: ["universal-3-pro", "universal-2"]
    }, {
      headers: { authorization: process.env.ASSEMBLYAI_API_KEY! }
    });

    const transcriptId = transcriptRes.data.id;
    console.log(`[8] Transcription job started, id=${transcriptId}, status=${transcriptRes.data.status}`);

    // 4. Poll for completion
    let status = "queued";
    let transcriptText = "";
    let pollCount = 0;
    while (status !== "completed" && status !== "error") {
      await new Promise(r => setTimeout(r, 5000));
      pollCount++;
      const pollRes = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: { authorization: process.env.ASSEMBLYAI_API_KEY! }
      });
      status = pollRes.data.status;
      console.log(`[9.${pollCount}] Poll status: ${status}`);
      if (status === "completed") {
        transcriptText = pollRes.data.text;
        console.log(`[10] Transcription complete: "${transcriptText?.substring(0, 100)}..."`);
      } else if (status === "error") {
        console.error(`[10] Transcription error: ${pollRes.data.error}`);
      }
    }

    // 5. Save to DynamoDB
    if (status === "completed") {
      console.log(`[11] Saving to DynamoDB: table=${process.env.DYNAMO_TABLE} userId=${userId}`);
      await ddb.send(new PutCommand({
        TableName: process.env.DYNAMO_TABLE!,
        Item: {
          userId,
          id: fileId,
          text: transcriptText,
          createdAt: new Date().toISOString(),
          type: "file"
        }
      }));
      console.log("[12] Saved to DynamoDB successfully");

      // 6. Notify via WebSocket (best-effort, don't fail if this errors)
      try {
        const connections = await ddb.send(new QueryCommand({
          TableName: process.env.CONNECTIONS_TABLE!,
          IndexName: "UserIndex",
          KeyConditionExpression: "userId = :uid",
          ExpressionAttributeValues: { ":uid": userId }
        }));

        if (connections.Items) {
          for (const conn of connections.Items) {
            try {
              await wsClient.send(new PostToConnectionCommand({
                ConnectionId: conn.connectionId,
                Data: Buffer.from(JSON.stringify({ type: "transcription_complete", fileId }))
              }));
            } catch (e: any) {
              console.warn("Failed to notify websocket connection:", conn.connectionId, e?.message);
            }
          }
        }
      } catch (wsErr: any) {
        console.warn("WebSocket notification failed (non-fatal):", wsErr?.message);
      }
    }

    console.log("=== processAudio END ===");
    return { statusCode: 200 };
  } catch (error: any) {
    console.error("=== processAudio FATAL ERROR ===");
    console.error("Error:", JSON.stringify({
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
      stack: error?.stack?.substring(0, 500)
    }));
    return { statusCode: 500 };
  }
};
