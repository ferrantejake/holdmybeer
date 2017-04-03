import { cryptoLib, rest, token } from '../utils';
import * as express from 'express';
const router = express.Router();
const debug = require('debug')('holdmybeer:auth');

module.exports = router;

// Describe what the endpoints will allow for parameters, if any.
const paramOptions = {

};

const verify = rest.verify(paramOptions);
const validate = rest.validate(paramOptions);
const respond = rest.respond(debug);

router.route('/status')
    .get(accountStatus);
router.route('/session')
    .get(respond(session));
router.route('/login')
    .get(respond(login));
router.route('/logout')
    .get(respond(logout));

// Request a new device authentication session.
function session(req: express.Request, res: express.Response): Promise<rest.Response> {
    return new Promise<rest.Response>((resolve, reject) => {

        // Create new token
        // Repond with token code

        // token.create()
        //     .then(sessionToken => res.json({ token: sessionToken }));
    });
}

// Check the status of an account
function accountStatus(req: express.Request, res: express.Response): Promise<rest.Response> {
    return new Promise<rest.Response>((resolve, reject) => { });
}

// Log into an account using an authorization provider.
function login(req: express.Request, res: express.Response): Promise<rest.Response> {
    return new Promise<rest.Response>((resolve, reject) => { });
}

// Log out of an account.
function logout(req: express.Request, res: express.Response): Promise<rest.Response> {
    return new Promise<rest.Response>((resolve, reject) => { });
}