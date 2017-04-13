import { dq } from '../../components';
import { rest, token } from '../../utils';
import * as express from 'express';
import * as passport from 'passport';
import * as url from 'url';
const Auth0Strategy = require('passport-auth0');
// import * as auth0 from 'auth0';

const debug = require('debug')('holdmybeer:access');
const debugV = require('debug')('holdmybeer-v:access');

// Log into an account using an authorization provider.
export function login(req: express.Request, res: express.Response): void {
    token.createSessionToken()
        .then(sessionToken => {
            const strat = new Auth0Strategy({
                clientID: process.env.AUTH0_CLIENT_ID,
                clientSecret: process.env.AUTH0_CLIENT_SECRET,
                domain: process.env.AUTH0_DOMAIN,
                callbackURL: `/account/verify?transaction_id=${sessionToken.id}`,
            }, function (accessToken: string, refreshToken: string, extraParams: any, profile: any, done: any) {
                return done(null, profile);
            });
            passport.use(strat);
            passport.authenticate('auth0', { session: false })(req, res);
        }).catch(error => rest.Response.fromServerError(error));
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
    debug('serialize');
    done(null, user.id);
});

passport.deserializeUser((id: string, done: (error: Error, user?: dq.User) => void) => {
    debug('deserialize');
    dq.users.getById(id)
        .then(user => done(null, user))
        .catch(error => done(error));
});