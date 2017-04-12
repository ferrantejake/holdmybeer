import * as express from 'express';
import * as AWS from 'aws-sdk';
import { dq } from '../components';
import { rest } from '../utils';
const router = express.Router();
const debug = require('debug')('holdmybeer:index');
const pkg = require('../../../package.json');

// Import endpoints from alternative routes.
router.use('/account', require('./account'));
router.use('/beer', require('./beer'));

/* GET home page. */

router.use('/users', require('./users'));

router.get('/', (req: express.Request, res: express.Response) => {
  console.log('serving index...');
  res.render('index', { title: pkg.name, version: pkg.version, description: pkg.description, message: '' });
});

router.all('*', rest.notAllowed);

module.exports = router;