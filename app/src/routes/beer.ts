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
const notAllowed = rest.notAllowed(undefined);
const getContext = rest.getContext;

router.route('/')
    .get(undefined)
    .all(notAllowed);
router.route('/log')
    .get(respond(accountLog))
    .all(notAllowed);
router.route('/:uid')
    .get(respond(getBeer))
    .put(respond(updateBeerLog))
    .all(notAllowed);

// Get a single beer
function getBeer(req: express.Request, res: express.Response): Promise<rest.Response> {
    return new Promise<rest.Response>((resolve, reject) => {
        const beerId = req.params.uid;
        dq.drinks.getById(beerId)
            .then(beerRecord => {
                // If we locate a record, return a reoslve
                if (beerRecord) return resolve(rest.Response.fromSuccess( /* map value here */ {}));
                // Otherwise continue unto other means of retrieval

                return; /* look up in brewerydb */
            })
            .catch(error => resolve(rest.Response.fromServerError(error)));
    });
}

function updateBeerLog(req: express.Request, res: express.Response): Promise<rest.Response> {
    return new Promise<rest.Response>((resolve, reject) => {
        getContext(req).then(requestContext => {
            const user = requestContext.user as dq.User;
            const beerId = req.params.id;
            const rating = req.body.rating;
            const geo = req.body.geo;
            // const keywords = req.body.keywords

            dq.beerlogs.insert({
                geo,
                ownerId: user.id,
                drinkId: beerId,
            })
                .then(beerLog => resolve(rest.Response.fromSuccess(undefined)))
                .catch(error => reject(rest.Response.fromServerError(error)));
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