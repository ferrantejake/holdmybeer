import { cryptoLib, rest, token } from '../utils';
import { dq } from '../components';
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
const getContext = rest.getContext;

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
        token.create()
            .then(tokenRecord => resolve(rest.Response.fromSuccess(tokenRecord)));
    });
}

// Check the status of an account
function accountStatus(req: express.Request, res: express.Response): Promise<rest.Response> {
    return new Promise<rest.Response>((resolve, reject) => {
        getContext(req).then(requestContext => {
            if (requestContext.user)
                rest.Response.fromSuccess(dq.UserDq.mapToConsumable(requestContext.user));
            else rest.Response.fromNotFound({ path: undefined, message: 'Invalid token' });
        });
    });
}

// Log into an account using an authorization provider.
function login(req: express.Request, res: express.Response): Promise<rest.Response> {
    return new Promise<rest.Response>((resolve, reject) => {

    });
}

// Log out of an account.
function logout(req: express.Request, res: express.Response): Promise<rest.Response> {
    return new Promise<rest.Response>((resolve, reject) => { });
}