import * as aws from './aws';
import * as dq from './dq';
import * as rest from './rest';
export {
    dq,
    aws,
    rest
};

export function init(): Promise<void> {
    return new Promise<void>((rsolve, reject) => {
        Promise.all<any>([
        ]);
    });
}