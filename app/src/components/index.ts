import * as aws from './aws';
import * as dq from './dq';
import * as rest from './rest';
import * as brewerydb from './brewerydb';
import * as arbiter from './arbiter';

export {
    dq,
    aws,
    rest,
    brewerydb,
    arbiter
};

export function init(): Promise<void> {
    return new Promise<void>((rsolve, reject) => {
        Promise.all<any>([
        ]);
    });
}