import * as express from 'express';

// Verify that the request structure is appropriate.
export function verify(options?: Object): express.RequestHandler {
    return null;
}

// Verify that the authentication is appropriate for a request
export function validate(options?: Object): express.RequestHandler {
    return null;
    // This function generates middleware based on the options
    // passed to it so that the requestee can utulize the
    // middleware without making additinoal requests to the framework.

    // The generated middleware will accomodate the options passed
    // in when the function is called.
}