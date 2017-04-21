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
router.route('/:userId')
    .get(respond(getUser))
    .all(notAllowed);
router.route('/verify/:uniqueId')
    .get(respond(access.grantAccess))
    .all(notAllowed);

// Check the status of an account
function accountStatus(req: express.Request, res: express.Response): Promise<rest.Response> {
    return new Promise<rest.Response>((resolve, reject) => {
        getContext(req).then(requestContext => {
            if (requestContext.user) {
                dq.users.getFriends(requestContext.user.id)
                    .then(friends => {
                        requestContext.user.friends = friends as any[];
                        resolve(rest.Response.fromSuccess(dq.UserDq.mapToConsumable(requestContext.user)));
                    })
                    .catch(error => resolve(rest.Response.fromServerError({ path: undefined, message: 'server error' })));
            }
            else resolve(rest.Response.fromNotFound({ path: undefined, message: 'Invalid token' }));
        });
    });
}

// Get user if requestee is a friend.
function getUser(req: express.Request, res: express.Response): Promise<rest.Response> {
    return new Promise<rest.Response>((resolve, reject) => {
        const requestedUserId = req.params.userId;
        debug('getUser', requestedUserId);

        getContext(req).then(requestContext => {
            // If the requestee DNE, then the service is inaccessable by this requestee.
            const user = requestContext.user;
            if (!user || !userHasFriend(user, requestedUserId)) {
                debug('user does not have friend requested');
                return resolve(rest.Response.fromNotFound({ message: 'user not found', path: undefined }));
            }
            debug('user has friend requested');
            dq.users.getById(requestedUserId)
                .then(friend => resolve(rest.Response.fromSuccess(friend)))
                .catch(error => resolve(rest.Response.fromServerError({ path: undefined, message: error.message })));
        });
    });
    function userHasFriend(user: dq.User, friendId: string): boolean {
        return user.friends.indexOf(friendId) > -1 ? true : false;
    }
}