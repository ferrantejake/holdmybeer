import { cryptoLib, rest, token } from '../../utils';
import { arbiter, dq } from '../../components';
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

router.route('/log')
    .get(respond(accountLog))
    .all(notAllowed);
router.route('/:uid')
    .get(respond(getBeer))
    .post(respond(registerBeer))
    .all(notAllowed);
router.route('/:uid/related')
    .get(respond(getRelated))
    .all(notAllowed);

// Get beer information
function getBeer(req: express.Request, res: express.Response): Promise<rest.Response> {
    return new Promise<rest.Response>((resolve, reject) => {
        const beerId = req.params.uid;
        arbiter.drinks.getByUPC(beerId)
            .then(beer => resolve(rest.Response.fromSuccess(beer)))
            .catch(error => reject(rest.Response.fromServerError(error)));
    });
}

// Register beer rating for user
function registerBeer(req: express.Request, res: express.Response): Promise<rest.Response> {
    debug('registerBeer');
    return new Promise<rest.Response>((resolve, reject) => {
        getContext(req).then(requestContext => {
            const user = requestContext.user as dq.User;
            const beerId = req.params.uid;
            const rating = req.body.rating;
            const geo = req.body.geo;
            debug('registerBeer: inserting record');
            dq.beerlogs.insert({
                geo,
                ownerId: user.id,
                drinkId: beerId,
            }).then(() => resolve(rest.Response.fromSuccess(undefined)))
                .catch(error => reject(rest.Response.fromServerError(error)));
        }).catch(error => resolve(rest.Response.fromServerError(error)));
    });
}

function getRelated(req: express.Request, res: express.Response): Promise<rest.Response> {
    return new Promise<rest.Response>((resolve, reject) => {
        const beerId = req.params.uid;
        arbiter.drinks.getRelated(beerId)
            .then(drinks => resolve(rest.Response.fromSuccess({ items: drinks })))
            .catch(error => resolve(rest.Response.fromServerError(error)));
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