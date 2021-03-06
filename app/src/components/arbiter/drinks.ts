import * as dq from '../dq';
import * as brewerydb from '../brewerydb';

export function getByUPC(upc: string): Promise<dq.Drink> {
    return new Promise<dq.Drink>((resolve, reject) => {
        dq.drinks.getById(upc).then(beer => {
            // if we found a beer resolve and return
            if (beer) { resolve(beer); return; }
            // otherwise keep looking
            else return brewerydb.drinks.getByUPC(upc);
        })
            .then(beer => {
                // If we can't find a beer, resolve undefined.
                if (!beer) {
                    resolve(undefined);
                    return;
                }

                // If we made it here, then the beer was in brewerydb but not local,
                // therefore update our local database.
                dq.drinks.insert(Object.assign(beer, {
                    brewerydbId: beer.id,
                    id: upc,
                    createdAt: new Date(Date.now())
                } as dq.Drink))
                    .then(updateResult => {
                        console.log(updateResult);
                        resolve(beer);
                    });

                // Future improvement: serach by name across alternative resources.
            })
            .catch(reject);
    });
};

export function getRelated(upc: string): Promise<dq.Drink[]> {
    return new Promise<dq.Drink[]>((resolve, reject) => {
        brewerydb.drinks.getRelated(upc)
            .then(resolve)
            .catch(reject);
    });
}