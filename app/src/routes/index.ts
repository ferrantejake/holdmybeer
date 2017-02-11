'use strict';

import * as express from 'express';
import * as AWS from 'aws-sdk';
const router = express.Router();
const debug = require('debug')('holdmybeer:index');
const pkg = require('../../../package.json');
/* GET home page. */

router.get('/', (req: express.Request, res: express.Response) => {
  console.log('serving index...');

  const options = {
    // dynamodb:  {'2012-08-10',
    region: 'us-east-1',
    // endpoint: 'autoscaling.us-east-1.amazonaws.com',
    // accessKeyId default can be used while using the downloadable version of DynamoDB.
    // For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    // secretAccessKey default can be used while using the downloadable version of DynamoDB.
    // For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
    secretAccessKey: process.env.AWS_SECRET_KEY,
  } as any;

  AWS.config.update(options);
  const dynamodb = new AWS.DynamoDB.DocumentClient();
  const params = {
    'RequestItems': {
      'holdmybeer_users': {
        'Keys': [
          { '_id': 'ferrantejake' }
        ]
      }
    }
  };
  dynamodb.batchGet(params, (error: Error, data: any) => {
    if (error) {
      debug(error);
      res.render('error', { error });
    } else
      res.render('users', { title: pkg.name, version: pkg.version, description: pkg.description, users: data });
  });
});

router.post('/', (req: express.Request, res: express.Response) => {
  console.log('posting user');

  const options = {
    // dynamodb:  {'2012-08-10',
    region: 'us-east-1',
    // endpoint: 'autoscaling.us-east-1.amazonaws.com',
    // accessKeyId default can be used while using the downloadable version of DynamoDB.
    // For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    // secretAccessKey default can be used while using the downloadable version of DynamoDB.
    // For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
    secretAccessKey: process.env.AWS_SECRET_KEY,
  } as any;

  AWS.config.update(options);
  const dynamodb = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: 'holdmybeer_users',
    Item: {
      '_id': 'ferrantejake',
      'first': 'Jake',
      'last': 'Ferrante',
      'nick': 'Jake'
    }
  };
  dynamodb.put(params, (error: Error, data: any) => {
    if (error)
      res.render('error', { error });
    else
      res.render('index', { title: pkg.name, version: pkg.version, description: pkg.description, message: data });
  });

  // res.render('index', { title: pkg.name, version: pkg.version, description: pkg.description, message: '' });
});
module.exports = router;