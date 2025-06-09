import serverlessExpress from '@vendia/serverless-express';
import app from './src/index.js';

export const handler = serverlessExpress({ app });