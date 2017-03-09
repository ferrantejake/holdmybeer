// Example insert record into DynamoDB
// Requries localconfig.js
// - set environment variable 'DEBUG' to 'holdmybeer*'
// - run from project root due to scoping issues
// `> node app/lib/test/insert.js`

const localTools = require('../utils/localTools');
import { dq } from '../components';
const debug = require('debug')('testing');

dq.users.insert({
    first: 'jake',
    last: 'ferrante',
    nick: 'jake',
    createdAt: new Date(Date.now()),
    username: 'ferrantejake'
}).then(response => {
    debug('insert reuslt', response);
}).catch(debug);