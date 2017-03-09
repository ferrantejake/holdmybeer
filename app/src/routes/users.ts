'use strict';

import * as express from 'express';
import * as AWS from 'aws-sdk';
import { dq } from '../components';
const router = express.Router();
const debug = require('debug')('holdmybeer:index');
const pkg = require('../../../package.json');

// router.get('/', list);
router.get('/create', create);

// function list()

function create(req: express.Request, res: express.Response) {
    dq.users.insert({
        createdAt: new Date(Date.now()),
        first: 'first_name',
        id: '4',
        last: 'last',
        nick: 'nick',
        username: 'jake'
    }).then(console.log)
        .catch(console.log);
    // res.render('index', { title: pkg.name, version: pkg.version, description: pkg.description, message: '' });
};

module.exports = router;
