import * as express from 'express';
import STATUS = require('http-status');
import { dq } from '../components';

// Verify that the request structure is appropriate.
export function verify(schema: any) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const path = req.route.path;
        const method = req.method.toLowerCase();

        if (!schema.hasOwnProperty(path) || !schema[path].hasOwnProperty(method) || schema[path][method].length === 0)
            return next();

        const verifiers: Function[] = schema[path][method];

        // Turn verifiers into promises
        const promises = verifiers.map(func =>
            (): Promise<any> =>
                new Promise<any>((resolve, reject) => {
                    // Reject if response is sent before a next call
                    const onFinish = () => {
                        res.removeListener('finish', onFinish);
                        reject();
                    };

                    res.on('finish', onFinish);

                    // Resolve on next call from verifier
                    func(req, res, () => {
                        res.removeListener('finish', onFinish);
                        resolve(true);
                    });
                }));

        // If promise chain succeeds, call `next` middleware
        promises.push(() =>
            new Promise<any>((resolve, reject) => { resolve(next()); }));

        // Do a sequence of verifiers
        const all = promises.reduce((prev, cur) =>
            prev.then(() =>
                new Promise((resolve, reject) => {
                    cur().then(resolve).catch(reject);
                })),
            Promise.resolve<any>(undefined));

        // Catch promise rejection. We are doing it on purpose from validation failure.
        all.catch(() => { });
    };
}

// Verify that the authentication is appropriate for a request
// export function validate(options?: Object): express.RequestHandler {
// return null;
// This function generates middleware based on the options
// passed to it so that the requestee can utulize the
// middleware without making additinoal requests to the framework.

// The generated middleware will accomodate the options passed
// in when the function is called.
// }

export function validate(schema: any): (req: express.Request, res: express.Response, next: express.NextFunction) => void {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const path = req.route.path;
        const method = req.method.toLowerCase();
        const validators = schema[path][method];

        if (!validators)
            return next();

        let errors: any[] = [];
        const mapError = (type: string) => (err: RestError) => ({ in: type, message: err.message, path: err.path });
        const clone = (obj: any) => JSON.parse(JSON.stringify(obj));
        if (validators.body)
            errors = errors.concat(validators.body.validate(clone(req.body)).map(mapError('body')));
        if (validators.path)
            errors = errors.concat(validators.path.validate(clone(req.params)).map(mapError('path')));
        if (validators.query)
            errors = errors.concat(validators.query.validate(clone(req.query)).map(mapError('query')));

        if (errors.length > 0)
            Response.fromErrors(ResponseType.InvalidParams, errors).send(res); // handled, don't call "next()"
        else
            next();
    };
}

// reference: https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
export enum ResponseType {
    Success,            // 200
    Created,            // 201
    Accepted,           // 202
    InvalidBody,        // 400
    InvalidParams,      // 400
    Conflict,           // 400
    Unauthorized,       // 401
    Forbidden,          // 403
    NotFound,           // 404
    MethodNotAllowed,   // 405
    NotAcceptable,      // 406
    PreconditionFailed, // 412
    ImATeapot,          // 418
    ServerError,        // 500
    NotImplemented      // 501
}

export interface RestError {
    path: string;
    message?: string;
}
declare type ResponseValue = any;

export class Response {

    constructor(
        public responseType: ResponseType,
        public value?: ResponseValue,
        public errors?: RestError[]
    ) { }

    // 200
    public static fromSuccess(value: ResponseValue) {
        return new this(ResponseType.Success, value);
    }

    // 202
    public static fromAccepted(value?: ResponseValue) {
        return new this(ResponseType.Accepted, value);
    }

    // 404
    public static fromNotFound(value: ResponseValue) {
        return new this(ResponseType.NotFound, value);
    }

    // 404
    public static fromBadRequest(value: ResponseValue) {
        return new this(ResponseType.NotFound, value);
    }

    // 500
    public static fromServerError(error: RestError) {
        return new this(ResponseType.ServerError, undefined, [error]);
    }

    // 401
    public static fromForbidden() {
        return new this(ResponseType.Forbidden);
    }

    // 304
    public static fromConflict(conflict: ResponseValue) {
        return new this(ResponseType.Conflict, conflict);
    }

    public static fromError(responseType: ResponseType, error: RestError) {
        return new this(responseType, undefined, [error]);
    }

    public static fromErrors(responseType: ResponseType, errors: RestError[]) {
        return new this(responseType, undefined, errors);
    }

    // Some other atypical method response
    public static fromAlternativeResponse(responseType: ResponseType, value?: ResponseValue, errors?: RestError[]) {
        return new this(responseType, value, errors);
    }

    public send(res: express.Response): void {
        switch (this.responseType) {
            case ResponseType.Success:
                res.status(STATUS.OK).send(this.value);
                break;
            case ResponseType.Created:
                res.status(STATUS.CREATED).send(this.value);
                break;
            case ResponseType.InvalidParams:
                res.status(STATUS.BAD_REQUEST).send({
                    errorType: ResponseType[this.responseType],
                    errors: this.errors
                });
                break;
            case ResponseType.InvalidBody:
                res.status(STATUS.BAD_REQUEST).send({
                    errorType: ResponseType[this.responseType],
                    errors: this.errors
                });
                break;
            case ResponseType.Conflict:
                this.errors.forEach(error => {
                    if (!error.message) error.message = error.path + ' already exists';
                });
                res.status(STATUS.BAD_REQUEST).send({
                    errorType: ResponseType[this.responseType],
                    errors: this.errors
                });
                break;
            case ResponseType.Unauthorized:
                res.status(STATUS.UNAUTHORIZED).end();
                break;
            case ResponseType.Forbidden:
                res.status(STATUS.FORBIDDEN).end();
                break;
            case ResponseType.NotFound:
                if (this.value)
                    res.status(STATUS.NOT_FOUND).send(this.value);
                else
                    res.status(STATUS.NOT_FOUND).end();
                break;
            case ResponseType.MethodNotAllowed:
                res.status(STATUS.METHOD_NOT_ALLOWED).end();
                break;
            case ResponseType.NotAcceptable:
                res.status(STATUS.NOT_ACCEPTABLE).end();
                break;
            case ResponseType.PreconditionFailed:
                res.status(STATUS.PRECONDITION_FAILED).send({
                    errorType: ResponseType[this.responseType],
                    errors: this.errors && this.errors.length ? this.errors : null
                });
                break;
            case ResponseType.ImATeapot:
                res.status(418).send(this.value);
                break;
            case ResponseType.ServerError:
                res.status(STATUS.INTERNAL_SERVER_ERROR).send({
                    errorType: ResponseType[this.responseType],
                    errors: this.errors && this.errors.length ? this.errors : null
                });
                break;
            case ResponseType.NotImplemented:
                res.status(STATUS.NOT_IMPLEMENTED).end();
                break;
        }
    }
};

export function notAllowed(definition: any): (req: express.Request, res: express.Response, next: express.NextFunction) => void {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        // If used as an app middle-ware; skip
        if (!req.route)
            return next();
        // If the route isn't defined; skip
        if (!definition[req.route.path])
            return next();

        // Determine valid methods for the route
        const routeDefinition = definition[req.route.path];
        const methods = Object.keys(routeDefinition)
            .concat(['OPTIONS'])
            .map(k => k.toUpperCase()).join(', ');

        res.setHeader('Allow', methods);
        res.status(STATUS.METHOD_NOT_ALLOWED).end();
    };
}

export function respond(debug: any) {
    return (promise: (req: express.Request, res: express.Response) => Promise<Response>) =>
        (req: express.Request, res: express.Response, next: express.NextFunction) =>
            promise(req, res)
                .then(response => response.send(res))
                .catch(error => {
                    if (debug !== null)
                        debug('ERROR', req.path, error.stack);
                    res.sendStatus(STATUS.INTERNAL_SERVER_ERROR);
                });
}

// Gets the context of the user or entity requesting information, if availiable.
export interface RequestContext {
    token?: dq.Token;
    user?: dq.User;
}
export function getContext(req: express.Request): Promise<RequestContext> {
    return new Promise<RequestContext>((resolve, reject) => {
        // Accept Authorization or auithorization header
        const token = req.get('Authorization') || req.get('authorization');
        dq.tokens.getById(token).then(tokenRecord => {
            if (!tokenRecord) return reject(new Error('Invalid token'));
            const accountId = tokenRecord.ownerId;
            dq.users.getById(accountId).then(userRecord => {
                if (!userRecord) return reject(new Error('Invalid token'));
                resolve({
                    token: tokenRecord,
                    user: userRecord
                });
            }).catch(reject);
        }).catch(reject);
    });
}