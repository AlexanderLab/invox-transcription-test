import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({});

export const handler = async (event: any) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { userId, contentType, extension } = body;

    if (!userId || !contentType || !extension) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "userId, contentType, and extension are required" }),
      };
    }

    const fileId = uuidv4();
    // Path inside S3, format: audio/{userId}/{fileId}.{extension}
    const key = `audio/${userId}/${fileId}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      ContentType: contentType,
      // AssemblyAI processes better with metadata if needed, but simple is fine
    });

    // Valid for 10 minutes
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 600 });

    return {
      statusCode: 200,
      body: JSON.stringify({ uploadUrl, key, fileId }),
    };
  } catch (error: any) {
    console.error("Presigned URL Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error generating upload URL" }),
    };
  }
};
