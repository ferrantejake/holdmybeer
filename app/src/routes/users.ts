'use strict';

import * as express from 'express';
import * as AWS from 'aws-sdk';
import { dq } from '../components';
const router = express.Router();
const debug = require('debug')('holdmybeer:index');
const pkg = require('../../../package.json');

router.get('/create', create);
function create(req: express.Request, res: express.Response) {};

module.exports = router;
