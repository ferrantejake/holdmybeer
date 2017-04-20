import { dq } from '../../components';
import { rest, token } from '../../utils';
import * as express from 'express';
import * as http from 'http';
import * as passport from 'passport';
import * as request from 'request';
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
                callbackURL: `/api/account/verify?transaction_id=${sessionToken.id}`,
            }, function (accessToken: string, refreshToken: string, extraParams: any, profile: any, done: any) {
                return done(null, profile);
            });
            passport.use(strat);
            passport.authenticate('auth0', { session: false })(req, res);
        }).catch(error => rest.Response.fromServerError(error));
}

// Validate response from Auth0 and handle token
export function verify(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const session: string = req.query.session;
    const transactionId = req.query.transaction_id;
    const code = req.query.code;
    const state = req.query.state;
    let ecosystemId: string,
        auth0User: any;

    Promise.resolve()
        .then(() => {
            return new Promise<string>((resolve, reject) => {
                debugV('received response');
                debugV('verifying credentials');

                /**
                 * Verify response integrity
                 * > Exchange Auth0's response grant with Auth0's access token.
                 */
                const options: any = {
                    url: `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
                    json:
                    {
                        grant_type: 'authorization_code',
                        client_id: process.env.AUTH0_CLIENT_ID,
                        client_secret: process.env.AUTH0_CLIENT_SECRET,
                        code,
                        redirect_uri: url.resolve((process.env as any).APP_URL, '/api/account/verify')
                    }
                };
                debugV(options);

                request.post(options, function (error: Error, response: http.IncomingMessage, body: any) {
                    if (error || response.statusCode !== 200 || response.statusMessage !== 'OK') {
                        return reject(error || response.statusCode);
                    }

                    const auth0Access = body;
                    const options = {
                        url: `https://${process.env.AUTH0_DOMAIN}/userinfo`,
                        headers: { Authorization: `Bearer ${auth0Access.access_token}` },
                    };

                    debugV('credentials verified');
                    debugV('retrieving user');
                    request.post(options, function (error: Error, response: http.IncomingMessage, body: any) {
                        if (error || response.statusCode !== 200 || response.statusMessage !== 'OK') {
                            debugV('user retrieval error');
                            return reject(new Error('could not validate user identity'));
                        }
                        debugV('Auth0 user information retrieved');

                        let uniqueId: string;
                        try {
                            body = JSON.parse(body);
                            uniqueId = body.sub;
                            auth0User = body;
                            debugV(auth0User);
                            debugV('auth0 user validated');
                            return resolve(uniqueId);
                        }
                        catch (error) { return reject(error); }
                    });
                });
            });
        })
        .then((uniqueId: string) => { return dq.users.getByUniqueId(uniqueId); })
        .then((userRecord: dq.User) => {

            if (userRecord) {
                debugV('user record exists');
                debugV(userRecord);
                req.user = userRecord;
                debug(req.user);
                next();
                return;
            }

            debugV('creating new user');
            const user: dq.User = {
                uniqueId: auth0User.sub,
                createdAt: new Date(Date.now()),
                email: auth0User.email,
                first: auth0User.given_name,
                last: auth0User.family_name,
                nick: auth0User.given_name
            };
            dq.users.insert(user)
                .then(response => {
                    debugV('new user created');
                    req.user = response;
                    next();
                    return;
                }).catch((error: Error) => {
                    debugV(error);
                    next();
                    return;
                });
        })
        .catch((error: Error) => {
            debugV('there was an error..');
            debugV(error);
            next();
        });
}

export function test(req: express.Request, res: express.Response): void {
    console.log('test');
}
export function respond(req: express.Request, res: express.Response): Promise<rest.Response> {
    console.log('>> respond');
    const user = req.user as dq.User;
    return new Promise<rest.Response>((resolve, reject) => {
        if (!user) return resolve(rest.Response.fromError(rest.ResponseType.ServerError, { message: 'user could not be logged in', path: undefined }));

        // Whitelist user and respond with token value.
        token.whitelistAuthToken(user.id)
            .then(tokenRecord => resolve(rest.Response.fromSuccess({ token: tokenRecord.id })))
            .catch((error: Error) => {
                debug('Response to Login errored..');
                return resolve(rest.Response.fromServerError({ message: error.message, path: undefined }));
            });
    });
    // if we make it here, then the response is necessarily well formed.
    // normally we would validate the but because this is an untrusted anon source with whom we
    // will just outright trust, we will ignore this.
    // validate code by making a call to Auth0 with code.
    // get authorization token from Auth0 in exchange for token code.
    // create new token and associate with new authorization token.
    // hand token back to user.
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