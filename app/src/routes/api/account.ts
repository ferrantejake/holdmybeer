import { cryptoLib, rest, token } from '../../utils';
import { dq, access } from '../../components';
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
const notAllowed = rest.notAllowed({});
const getContext = rest.getContext;
// const getContext: any = undefined; // rest.getContext;

router.route('/')
    .get(respond(accountStatus))
    .all(notAllowed);
router.route('/login')
    .get(access.login)
    .all(notAllowed);
router.route('/logout')
    .get(respond(access.logout))
    .all(notAllowed);
router.route('/verify')
    .get(access.verify, access.buildOutProfile, access.respond)
    .all(notAllowed);
router.route('/:userid')
    .get(respond(getUser))
    .all(notAllowed);
router.route('/verify/:uniqueId')
    .get(respond(access.grantAccess))
    .all(notAllowed);

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

// Get user if requestee is a friend.
function getUser(req: express.Request, res: express.Response): Promise<rest.Response> {
    return new Promise<rest.Response>((resolve, reject) => {
        const requestedUserId = req.params.userId;

        getContext(req).then(requestContext => {
            // If the requestee DNE, then the service is inaccessable by this requestee.
            const user = requestContext.user;
            if (!user || userHasFriend(user, requestedUserId)) return rest.Response.fromForbidden();

            dq.users.getById(requestedUserId).then(friend =>
                rest.Response.fromSuccess(dq.UserDq.mapToConsumable(requestContext.user)));
        });
    });
    function userHasFriend(user: dq.User, friendId: string): boolean {
        return ((user as any).friends as any[]).indexOf(friendId) > -1 ? true : false;
    }
}