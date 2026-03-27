import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});

export const handler = async (event: any) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { email, password } = body;

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Email and password are required" }),
      };
    }

    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: process.env.COGNITO_CLIENT_ID!,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const response = await client.send(command);
    const idToken = response.AuthenticationResult?.IdToken;
    let userId = email;

    if (idToken) {
      try {
        const payloadBase64 = idToken.split(".")[1];
        const payloadJson = Buffer.from(payloadBase64, "base64").toString();
        const payload = JSON.parse(payloadJson);
        userId = payload.sub || email;
      } catch (e) {
        console.error("JWT Decode Error:", e);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Login successful",
        userId,
        tokens: {
          accessToken: response.AuthenticationResult?.AccessToken,
          idToken,
          refreshToken: response.AuthenticationResult?.RefreshToken,
        },
      }),
    };
  } catch (error: any) {
    console.error("Login Error:", error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: error.message || "Error logging in" }),
    };
  }
};
