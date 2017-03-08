import * as express from 'express';
const router = express.Router();
const debug = require('debug')('holdmybeer:auth');
import { cryptoLib } from '../utils';
/* GET home page. */

router.get('/session', (req: express.Request, res: express.Response) => {
    cryptoLib.generateSessionToken()
        .then(sessionToken => {
            res.json({ token: sessionToken });
        })
        .catch(error => {
            // should probably log error here
            debug(error);
            res.status(500);
        });
});

module.exports = router;