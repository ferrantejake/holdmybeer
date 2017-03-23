'use strict';

import * as express from 'express';
import * as AWS from 'aws-sdk';
import { dq, rest } from '../components';
const router = express.Router();
const debug = require('debug')('holdmybeer:index');
const pkg = require('../../../package.json');
/* GET home page. */

router.use('/users', require('./users'));

router.get('/', (req: express.Request, res: express.Response) => {
  console.log('serving index...');
  res.render('index', { title: pkg.name, version: pkg.version, description: pkg.description });
});

router.all('*', rest.notAllowed);

module.exports = router;