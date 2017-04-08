import * as aws from './aws';
import * as dq from './dq';
import * as rest from './rest';
import * as brewerydb from './brewerydb';

export {
    dq,
    aws,
    rest,
    brewerydb
};

export function init(): Promise<void> {
    return new Promise<void>((rsolve, reject) => {
        Promise.all<any>([
        ]);
    });
}