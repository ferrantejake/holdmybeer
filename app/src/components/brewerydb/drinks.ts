import { UpdateCertificateRequest } from 'aws-sdk/clients/iot';
import * as BreweryDb from './brewerydb';
import * as express from 'express';
const brewerydb = BreweryDb.client();

export function getByUPC(upc: string): Promise<BreweryDbBeer> {
    return new Promise<BreweryDbBeer>((resolve, reject) => {
        brewerydb.search.beers('upc', { code: upc }, (error: Error, beer: BreweryDbBeer[]) => {
            if (error) {
                // If the error string contains a 404 (drink not found)
                if (error.message.indexOf('404') > -1) resolve(undefined);
                // Otherwise return server error
                else reject(error);
            }
            else resolve(beer[0]);
        });
    });
}

export function getRelated(upc: string): Promise<BreweryDbBeer[]> {
    // Get drink information
    // Use drink information to return related drinks in caregory at random

    return new Promise<BreweryDbBeer[]>((resolve, reject) => {
        getByUPC(upc)
            .then(beer => {
                brewerydb.beer.find({ styleId: beer.styleId }, (error: Error, beers: BreweryDbBeer[]) => {
                    if (error) {
                        if (error.message.indexOf('404') > -1) resolve([]);
                        else reject(error);
                    }
                    else resolve(shuffle(beers).slice(0, 5));
                });

            })
            .catch(reject);
    });
}

/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items The array containing the items.
 */
function shuffle(array: any[]): any[] {
    for (let i = array.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [array[i - 1], array[j]] = [array[j], array[i - 1]];
    }
    return array;
}

export interface GetBeerResponse {
    status: string;
    data: BreweryDbBeer;
}

export interface GetBatchBeerResponse {
    status: string;
    numberOfPages: string;
    data: BreweryDbBeer[];
}

export interface BreweryDbBeer {
    id: string;
    abv: string;
    name: string;
    glass: {
        id: number,
        createDate: string,
        name: string
    };
    style: {
        id: number,
        category: {
            id: number,
            createDate: string,
            name: string
        },
        srmMax: string,
        ibuMax: string,
        srmMin: string,
        description: string,
        fgMin: string,
        ibuMin: string,
        createDate: string,
        fgMax: string,
        abvMax: string,
        ogMin: string,
        abvMin: string,
        name: string,
        categoryId: number
    };
    createDate: string;
    labels: {
        medium: string,
        large: string,
        icon: string
    };
    styleId: number;
    updateDate: string;
    glasswareId: number;
    isOrganic: string;
    status: string;
    statusDisplay: string;
};

// /beer/:beerId
// brewdb.beer.getById('avMkil', {}, callback);

// // /beers?ids=
// brewdb.beer.getById(['avMkil', 'XcvLTe'], { withBreweries: 'Y' }, callback);

// // /beers?name=“bock”&abv=....
// // can provide params that beers endpoint accepts (like abv, ibu, etc.)
// brewdb.beer.find({ name: 'bock' }, callback);