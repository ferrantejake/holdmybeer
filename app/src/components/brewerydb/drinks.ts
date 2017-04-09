import { UpdateCertificateRequest } from 'aws-sdk/clients/iot';
import * as BreweryDb from './brewerydb';
import * as express from 'express';
const brewerydb = BreweryDb.client();

export function getByUPC(upc: string): Promise<BreweryDbBeer> {
    return new Promise<BreweryDbBeer>((resolve, reject) => {
        brewerydb.beer.getById(upc, {}, (error: Error, response: GetBeerResponse) => {
            if (error) {
                // If the error string contains a 404 (drink not found)
                if (error.message.indexOf('404') > -1) resolve(undefined);
                // Otherwise return server error
                else reject(error);
            }
            else resolve(response.data);
        });
    });
}

export function getRelated(upc: string): Promise<BreweryDbBeer[]> {
    // Get drink information
    // Use drink information to return related drinks in caregory at random

    return new Promise<BreweryDbBeer[]>((resolve, reject) => {
        getByUPC(upc)
            .then(drink => {
                brewerydb.beers.find({ styleId: drink.styleId }, (error: Error, response: GetBatchBeerResponse) => {
                    if (error) {
                        if (error.message.indexOf('404') > -1) resolve(undefined);
                        else reject(error);
                    }
                    else resolve(response.data);
                });

            })
            .catch(reject);
    });
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