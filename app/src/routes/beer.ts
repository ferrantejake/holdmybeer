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

router.route('/')
    .get(undefined);
router.route('/:uid')
    .get(respond(getBeer));

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