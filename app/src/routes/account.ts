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
// const getContext: any = undefined; // rest.getContext;

router.route('/status')
    .get(accountStatus)
    .all(notAllowed);
router.route('/session')
    .get(respond(session))
    .all(notAllowed);
router.route('/login')
    .get(respond(login))
    .all(notAllowed);
router.route('/verify')
    .get(respond(loginVerification))
    .all(notAllowed);
router.route('/logout')
    .get(respond(logout))
    .all(notAllowed);
router.route('/log')
    .get(respond(accountLog))
    .all(notAllowed);

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

        // if we make it here then the request was well formed.

        // implement auth0 conduit.. environment variables.
        // establish passport strategy using conduit..

        // redirect user to auth0.
        // create new session token from sessionID and store in database for later evaluation.

        // if something went wrong, then respond with the appropriate error.
    });
}

// Validate response from Auth0 and handle token
function loginVerification(req: express.Request, res: express.Response): Promise<rest.Response> {
    return new Promise<rest.Response>((resolve, reject) => {
        // if we make it here, then the response is necessarily well formed.
        // normally we would validate the but because this is an untrusted anon source with whom we
        // will just outright trust, we will ignore this.
        // validate code by making a call to Auth0 with code.
        // get authorization token from Auth0 in exchange for token code.
        // create new token and associate with new authorization token.
        // hand token back to user.
    });
}

// Log out of an account.
function logout(req: express.Request, res: express.Response): Promise<rest.Response> {
    return new Promise<rest.Response>((resolve, reject) => {
        // Do not redirect to Auth0 logout page. Simply delete user token.
        getContext(req).then(requestContext => {
            const token = requestContext.token;
            dq.tokens.getById(token.id)
                .then(() => { resolve(rest.Response.fromSuccess(undefined)); })
                .catch(error => rest.Response.fromServerError(error));
        });
    });
}

// View account log.
function accountLog(req: express.Request, res: express.Response): Promise<rest.Response> {
    return new Promise<rest.Response>((resolve, reject) => {
        getContext(req).then(requestContext => {
            const user = requestContext.user;
            dq.beerlogs.getByOwner(user.id)
                .then(records => { resolve(rest.Response.fromSuccess({ items: records.map(dq.beerlogs.mapToConsumable) })); })
                .catch(error => { rest.Response.fromServerError(error); });
        });
    });
}