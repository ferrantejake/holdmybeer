'use strict';

import * as express from 'express';
import * as AWS from 'aws-sdk';
import { dq, rest } from '../components';
const router = express.Router();
const debug = require('debug')('holdmybeer:index');
const pkg = require('../../../package.json');

router.get('/create', create);
router.get('/update', update);
router.get('/delete', remove);

function create(req: express.Request, res: express.Response) {
    dq.users.insert({
        first: 'first',
        last: 'last',
        nick: 'user',
        createdAt: new Date(Date.now()),
        username: 'example_user'
    }).then(response => res.send(response)).catch(debug);
};
function remove(req: express.Request, res: express.Response) {
    dq.users.deleteById('example_user')
        .then(response => { debug(response); res.send(response); }).catch(debug);
};
function update(req: express.Request, res: express.Response) {
    dq.users.updateById('example_user', {
        last: 'first',
        first: 'last'
    })
        .then(response => res.send(response)).catch(debug);
};
router.all('*', rest.notAllowed);

module.exports = router;
