const brewerydb = require('brewerydb-node');
import * as express from 'express';

export function getByUPC(upc: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        brewerydb.beer.getById(upc, {}, (error: Error, response: express.Response, body: any) => {
            if (response && response.statusCode === 200)
                try { resolve(JSON.stringify(body)); }
                catch (error) { reject(error); }
            else reject(error);
        });
    });
}

// /beer/:beerId
// brewdb.beer.getById('avMkil', {}, callback);

// // /beers?ids=
// brewdb.beer.getById(['avMkil', 'XcvLTe'], { withBreweries: 'Y' }, callback);

// // /beers?name=“bock”&abv=....
// // can provide params that beers endpoint accepts (like abv, ibu, etc.)
// brewdb.beer.find({ name: 'bock' }, callback);