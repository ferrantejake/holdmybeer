import { rest } from '../../utils';
import * as express from 'express';
const router = express.Router();
const debug = require('debug')('holdmybeer:index');
const pkg = require('../../../../package.json');
const notAllowed = rest.notAllowed({});

// Import endpoints from alternative routes.
router.use('/account', require('./account'));
router.use('/beer', require('./beer'));

/* GET home page. */
router.get('/', (req: express.Request, res: express.Response) => {
    res.render('index', { title: pkg.name, version: pkg.version, description: pkg.description, message: 'Welcome to the Holdmybeer API' });
});

router.all('*', notAllowed);

module.exports = router;