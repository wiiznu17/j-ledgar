import { Amplify } from 'aws-amplify';

// NOTE: Face Liveness requires an Identity Pool to provide temporary credentials
// to the frontend for streaming the face video to Rekognition.
// You can create one in AWS Cognito Console.
export const configureAmplify = () => {
  Amplify.configure({
    Auth: {
      Cognito: {
        identityPoolId:
          process.env.EXPO_PUBLIC_AWS_IDENTITY_POOL_ID ||
          'us-east-1:placeholder-id',
        allowGuestAccess: true,
        userPoolId: process.env.EXPO_PUBLIC_AWS_USER_POOL_ID,
        userPoolClientId: process.env.EXPO_PUBLIC_AWS_USER_POOL_CLIENT_ID,
      } as any,
    },
  });
};
