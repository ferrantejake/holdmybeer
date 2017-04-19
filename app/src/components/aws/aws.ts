import * as AWS from 'aws-sdk';
const debug = require('debug')('holdmybeer:aws');

// Setup AWS client configuration
const config = {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
};

// Update raw AWS interface
AWS.config.update(config);

// Create single instance of dynasty document client
const _dynasty = require('dynasty')(config);

export function dynamodb(): any {
    return _dynasty;
};

// Create single instance of dynamodb document client
const _dynamodb = new AWS.DynamoDB.DocumentClient();

export function AWSDynamoClient(): AWS.DynamoDB.DocumentClient {
    return _dynamodb;
};
