'use strict';

import * as AWS from 'aws-sdk';
const debug = require('debug')('holdmybeer:aws');

const config = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION
};

// Create single instance of dynamodb document client
const dynasty = require('dynasty')(config);

export function dynamodb(): any {
    return dynasty;
};