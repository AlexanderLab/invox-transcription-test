import { CognitoIdentityProviderClient, GlobalSignOutCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});

export const handler = async (event: any) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { accessToken } = body;

    if (!accessToken) {
      return { statusCode: 400, body: JSON.stringify({ message: "accessToken is required" }) };
    }

    const command = new GlobalSignOutCommand({
      AccessToken: accessToken,
    });

    await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Logged out successfully" }),
    };
  } catch (error: any) {
    console.error("Logout Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message || "Error logging out" }),
    };
  }
};
