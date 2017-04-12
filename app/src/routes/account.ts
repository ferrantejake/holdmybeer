import { cryptoLib, rest, token } from '../utils';
import { dq, access } from '../components';
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
const notAllowed = rest.notAllowed(undefined);
const getContext = rest.getContext;
// const getContext: any = undefined; // rest.getContext;

router.route('/status')
    .get(accountStatus)
    .all(notAllowed);
router.route('/session')
    .get(respond(session))
    .all(notAllowed);
router.route('/login')
    .get(respond(access.login))
    .all(notAllowed);
router.route('/verify')
    .get(respond(access.verify))
    .all(notAllowed);
router.route('/logout')
    .get(respond(access.logout))
    .all(notAllowed);

// Request a new device authentication session.
function session(req: express.Request, res: express.Response): Promise<rest.Response> {
    return new Promise<rest.Response>((resolve, reject) => {
        token.createAuthToken()
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