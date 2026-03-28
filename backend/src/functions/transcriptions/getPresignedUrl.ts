import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const s3 = new S3Client({ region: process.env.AWS_REGION || "eu-west-1" });

export const handler = async (event: any) => {
  console.log("Presigned URL Request started");
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body || "{}") : (event.body || {});
    const { userId, contentType, extension } = body;

    if (!userId || !contentType || !extension) {
      console.warn("Validation failed:", { userId: !!userId, contentType: !!contentType, extension: !!extension });
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "userId, contentType, and extension are required" }),
      };
    }

    const fileId = randomUUID();
    const key = `audio/${userId}/${fileId}.${extension}`;

    console.log("Generating URL for bucket:", process.env.S3_BUCKET, "Key:", key);

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 600 });
    console.log("Success: URL generated");

    return {
      statusCode: 200,
      body: JSON.stringify({ uploadUrl, key, fileId }),
    };
  } catch (error: any) {
    console.error("Presigned URL Critical Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: "Error generating upload URL", 
        error: error.message,
        stack: error.stack
      }),
    };
  }
};

