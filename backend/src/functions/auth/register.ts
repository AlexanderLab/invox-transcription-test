import { CognitoIdentityProviderClient, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});

export const handler = async (event: any) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { email, password, name } = body;

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Email and password are required" }),
      };
    }

    const command = new SignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email },
        ...(name ? [{ Name: "name", Value: name }] : [])
      ],
    });

    const response = await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "User registered successfully. Please check your email for the confirmation code.",
        userSub: response.UserSub,
      }),
    };
  } catch (error: any) {
    console.error("Register Error:", error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: error.message || "Error registering user" }),
    };
  }
};
