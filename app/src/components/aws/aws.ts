'use strict';

import * as AWS from 'aws-sdk';
const debug = require('debug')('holdmybeer:aws');

// Setup AWS client configuration
const options = {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
} as AWS.ClientConfigPartial;
AWS.config.update(options);

// Create single instance of dynamodb document client
const dynamodb = new AWS.DynamoDB.DocumentClient();

export function client(): AWS.DynamoDB.DocumentClient {
    return dynamodb;
};