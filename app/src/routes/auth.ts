import * as express from 'express';
const router = express.Router();
const debug = require('debug')('holdmybeer:auth');
import { cryptoLib, rest } from '../utils';
/* GET home page. */

router.get('/session');
router.get('/status');
router.get('/login');
router.get('/logout');

const verify = rest.verify();
const validate = rest.validate();

router.route('/session')
    .get(verify, validate, respond(session));



// Request a new device authentication session.
function session(req: express.Request, res: express.Response) {
\
    cryptoLib.generateSessionToken()
        .then(sessionToken => {
            res.json({ token: sessionToken });
        })
        .catch(error => {
            // should probably log error here
            debug(error);
            res.status(500);
        });
}

// Check the status of an account
function accountStatus(req: express.Request, res: express.Response) { }

// Log into an account using an authorization provider.
function login(req: express.Request, res: express.Response) {

}

// Log out of an account.
function logout(req: express.Request, res: express.Response) { }
module.exports = router;