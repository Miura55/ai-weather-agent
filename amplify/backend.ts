import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Policy } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';

const backend = defineBackend({
  auth,
});

const iamPolicyStack = backend.createStack('IAMPolicyStack');
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  new Policy(iamPolicyStack, 'UserPolicy', {
    statements: [
      new PolicyStatement({
        actions: [
          'bedrock:InvokeModel*',
        ],
        resources: ['*'],
      }),
    ],
  }),
);

