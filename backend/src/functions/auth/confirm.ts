import { CognitoIdentityProviderClient, ConfirmSignUpCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});

export const handler = async (event: any) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { email, code } = body;

    if (!email || !code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Email and confirmation code are required" }),
      };
    }

    const command = new ConfirmSignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      Username: email,
      ConfirmationCode: code,
    });

    await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Account confirmed successfully. You can now log in.",
      }),
    };
  } catch (error: any) {
    console.error("Confirm Error:", error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: error.message || "Error confirming account" }),
    };
  }
};
