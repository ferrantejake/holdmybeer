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
    const clientId = req.query.uniqueId;
    if (!clientId) res.send('invalid request');
    debugV(`new login request [${clientId}]`);
    token.createSessionToken({ type: dq.TokenType.Session, context: { clientId } })
        .then(sessionToken => {
            debugV(`new session token created:`, sessionToken);
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
    debugV('received response');

    dq.tokens.getById(transactionId)
        .then(sessionTokenRecord => {
            // If invalid session, then quit early.
            if (!sessionTokenRecord) {
                debugV('invalid session token');
                next();
            } else {
                debugV('validated session token');
                // hide information in the request
                (req as any).holdmybeer = { clientId: sessionTokenRecord.context.clientId };
                return dq.tokens.deleteById(sessionTokenRecord.id);
            }
        })
        .then(result => {
            return new Promise<string>((resolve, reject) => {
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

export function respond(req: express.Request, res: express.Response) {
    console.log('>> respond');
    const user = req.user as dq.User;
    const clientId = (req as any).holdmybeer.clientId;
    debug('clientId: ', clientId);

    if (!user) return res.render('loginConfirmation', { title: 'Login failed', message: 'Something went wrong! Please try this action again.' });
    // res.send('user could not be logged in'); // rest.Response.fromError(rest.ResponseType.ServerError, { message: 'user could not be logged in', path: undefined });

    // Create unowned token
    debug('creating unowned auth token');
    token.createUnownedAuthToken({
        type: dq.TokenType.Session,
        ownerId: clientId,
        context: {
            user: user.id
        }
    })
        .then(tokenRecord => {
            debug('token created, resolving', tokenRecord);
            res.render('loginConfirmation', { title: 'You\'ve been logged in!', message: 'You may close this window now.' });
        })
        .catch((error: Error) => {
            debug('Response to Login errored..');
            debug(error);
            res.render('loginConfirmation', { title: 'Login failed', message: 'Something went wrong! Please try this action again.' });
        });
}

export function grantAccess(req: express.Request, res: express.Response): Promise<rest.Response> {
    return new Promise<rest.Response>((resolve, reject) => {
        debug('grantaccess:');
        const clientId = req.params.uniqueId;
        debug(`grantaccess: [${clientId}]`);
        if (!clientId) { resolve(rest.Response.fromForbidden()); return; }

        debug('token by ownerid');
        // If we make it here, then a client id has been passed in
        dq.tokens.getByOwnerId(clientId)
            .then<any>(sessionTokenRecord => {
                debug('checking session token');
                if (!sessionTokenRecord) return resolve(rest.Response.fromNotFound({ path: 'token', message: 'token not found' }));
                const userId = sessionTokenRecord.context.user;
                debug('session token looks good');
                return Promise.all<any>([
                    token.whitelistAuthToken(userId, undefined, { type: dq.TokenType.Auth, description: 'Validated in authentication workflow.' }),
                    dq.tokens.deleteById(sessionTokenRecord.id)
                ]);
            }).then((promises: [dq.Token, void]) => resolve(rest.Response.fromSuccess({ token: promises[0].id })))
            .catch((error: Error) => {
                debug('there was an issue');
                debug(error);
                resolve(rest.Response.fromServerError({ message: error ? error.message : undefined, path: undefined }));
            });
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