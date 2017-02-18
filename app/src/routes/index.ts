'use strict';

import * as express from 'express';
import * as AWS from 'aws-sdk';
import { dq } from '../components';
const router = express.Router();
const debug = require('debug')('holdmybeer:index');
const pkg = require('../../../package.json');
/* GET home page. */

router.get('/', (req: express.Request, res: express.Response) => {
  console.log('serving index...');
  dq.users.getById('ferrantejake').then(user => {
    res.send(user);
  });
});

router.post('/', (req: express.Request, res: express.Response) => {
  console.log('posting user');
  // res.render('index', { title: pkg.name, version: pkg.version, description: pkg.description, message: '' });
});
module.exports = router;