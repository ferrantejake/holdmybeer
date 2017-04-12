import { rest, token } from '../../utils';
import { dq } from '../../components';
import * as express from 'express';
const Auth0Strategy = require('passport-auth0');
import * as auth0 from 'auth0';
import * as passport from 'passport';
import * as url from 'url';

const debug = require('debug')('holdmybeer:access');
const debugV = require('debug')('holdmybeer-v:access');

// Log into an account using an authorization provider.
export function login(req: express.Request, res: express.Response): Promise<rest.Response> {
    return new Promise<rest.Response>((resolve, reject) => {
        token.createSessionToken()
            .then(sessionToken => {
                const callback = url.resolve((process.env as any).YO_URL, `/account/verify?transaction_id=${sessionToken.id}`);
                const strategy = new Auth0Strategy({
                    clientID: process.env.AUTH0_CLIENT_ID,
                    clientSecret: process.env.AUTH0_CLIENT_SECRET,
                    domain: process.env.AUTH0_DOMAIN,
                    callbackURL: callback,
                }, (accessToken: string, refreshToken: string, extraParams: any, profile: any, done: any) => {
                    debug('unknown point of access achieved..');
                    done(null, profile);
                });
                passport.use(strategy);
                debugV('redirecting user to Auth0..');
                passport.authenticate('auth0')(req, res, this.handleUnknownCondition);
            }).catch(error => rest.Response.fromServerError(error));
    });
}

// Validate response from Auth0 and handle token
export function verify(req: express.Request, res: express.Response): Promise<rest.Response> {
    return new Promise<rest.Response>((resolve, reject) => {
        // if we make it here, then the response is necessarily well formed.
        // normally we would validate the but because this is an untrusted anon source with whom we
        // will just outright trust, we will ignore this.
        // validate code by making a call to Auth0 with code.
        // get authorization token from Auth0 in exchange for token code.
        // create new token and associate with new authorization token.
        // hand token back to user.
    });
}

export function logout(req: express.Request, res: express.Response): Promise<rest.Response> {
    return new Promise<rest.Response>((resolve, reject) => {
        rest.getContext(req).then(requestContext => {
            if (!requestContext.token) return resolve(rest.Response.fromSuccess(undefined));
            dq.tokens.deleteById(requestContext.token.id)
                .then(() => resolve(rest.Response.fromSuccess(undefined)))
                .catch(error => resolve(rest.Response.fromServerError(error)));
        }).catch(error => rest.Response.fromServerError(error));
    });
}

passport.serializeUser((user: dq.User, done: (error: Error, id?: string) => void) => {
    done(null, user.id);
});

passport.deserializeUser((id: string, done: (error: Error, user?: dq.User) => void) => {
    dq.users.getById(id)
        .then(user => done(null, user))
        .catch(error => done(error));
});