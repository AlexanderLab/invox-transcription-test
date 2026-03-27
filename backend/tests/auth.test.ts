import { describe, it, expect, beforeEach } from '@jest/globals';
import { mockClient } from 'aws-sdk-client-mock';
import { CognitoIdentityProviderClient, SignUpCommand, InitiateAuthCommand, ConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { handler as registerHandler } from '../src/functions/auth/register';
import { handler as loginHandler } from '../src/functions/auth/login';
import { handler as confirmHandler } from '../src/functions/auth/confirm';

const cognitoMock = mockClient(CognitoIdentityProviderClient);

describe('Auth Functions', () => {
  beforeEach(() => {
    cognitoMock.reset();
    process.env.COGNITO_CLIENT_ID = 'test-client-id';
  });

  describe('Register', () => {
    it('should register a user successfully', async () => {
      cognitoMock.on(SignUpCommand).resolves({ UserSub: '12345' });

      const event = {
        body: JSON.stringify({ email: 'test@example.com', password: 'Password1!', name: 'Test User' })
      } as any;

      const response = await registerHandler(event);
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).message).toBe('User registered successfully. Please check your email for the confirmation code.');
    });

    it('should return 400 if missing fields', async () => {
      const event = {
        body: JSON.stringify({ email: 'test@example.com' })
      } as any;

      const response = await registerHandler(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('Login', () => {
    it('should login successfully and return tokens', async () => {
      cognitoMock.on(InitiateAuthCommand).resolves({
        AuthenticationResult: {
          IdToken: 'header.eyJzdWIiOiIxMjM0NSJ9.sig',
          AccessToken: 'access-token',
          RefreshToken: 'refresh-token'
        }
      });

      const event = {
        body: JSON.stringify({ email: 'test@example.com', password: 'Password1!' })
      } as any;

      const response = await loginHandler(event);
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.tokens.idToken).toBe('header.eyJzdWIiOiIxMjM0NSJ9.sig');
    });

    it('should handle failed login', async () => {
      cognitoMock.on(InitiateAuthCommand).rejects(new Error('NotAuthorizedException'));

      const event = {
        body: JSON.stringify({ email: 'test@example.com', password: 'wrong' })
      } as any;

      const response = await loginHandler(event);
      expect([400, 500]).toContain(response.statusCode); // depending on how error is mapped
    });
  });

  describe('Confirm', () => {
    it('should confirm user successfully', async () => {
      cognitoMock.on(ConfirmSignUpCommand).resolves({});

      const event = {
        body: JSON.stringify({ email: 'test@example.com', code: '123456' })
      } as any;

      const response = await confirmHandler(event);
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).message).toBe('Account confirmed successfully. You can now log in.');
    });
  });
});
