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
                nick: auth0User.given_name,
                friends: []
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

export function buildOutProfile(req: express.Request, res: express.Response, next: express.NextFunction) {
    debugV('building profile..', );
    if (!req.user) { next(); return; }

    // quick setup
    req.user.provider = req.user.uniqueId.split('|')[0];

    getManagementAccess()
        .then(access => { return getAuth0Friends(req.user.uniqueId, access.token_type, access.access_token, req.user.provider); })
        .then((friends: Auth0Friend[]) => {
            debugV('friends:', friends);
            dq.users.getByUniqueId(req.user.uniqueId)
                .then(userRecord => {
                    dq.users.associateFriends(userRecord.id, friends.map(f => { return f.id; }))
                        .then(next)
                        .catch(error => { debug(error); next(); });
                }).catch(error => { debug(error); next(); });
        }).catch(error => { debug(error); next(); });
}

export function respond(req: express.Request, res: express.Response) {
    console.log('>> respond');
    const user = req.user as dq.User;
    const clientId = (req as any).holdmybeer.clientId;
    debug('clientId: ', clientId);

    if (!user) return res.render('confirmLogin', { title: 'Login failed', description: 'Something went wrong! Please try this action again.' });
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
            res.render('confirmLogin', { title: 'You\'ve been logged in!', description: 'You may close this window now.' });
        })
        .catch((error: Error) => {
            debug('Response to Login errored..');
            debug(error);
            res.render('confirmLogin', { title: 'Login failed', description: 'Something went wrong! Please try this action again.' });
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

export interface Auth0Friend {
    first: string;
    last: string;
    id: string;
}

interface ManagementAccessInfo {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
}

export function getManagementAccess(): Promise<ManagementAccessInfo> {
    return new Promise<ManagementAccessInfo>((resolve, reject) => {
        const options = {
            method: 'POST',
            url: 'https://holdmybeer.auth0.com/oauth/token',
            headers: { 'content-type': 'application/json' },
            body: `{"client_id":"${process.env.AUTH0_CLIENT_ID}","client_secret":"${process.env.AUTH0_CLIENT_SECRET}","audience":"https://${process.env.AUTH0_DOMAIN}/api/v2/","grant_type":"client_credentials"}`
        };

        request(options, function (error, response, body: any) {
            if (error) return reject(error);
            else {
                debug('retrieved management access', body);
                try { resolve(JSON.parse(body) as ManagementAccessInfo); }
                catch (e) { resolve(body as ManagementAccessInfo); debug('>>>>>> dont neeed to parse..'); }
            }
        });
    });
}

export function getAuth0Friends(userId: string, tokenType: string, token: string, provider: string): Promise<Auth0Friend[]> {
    debug('getting auth0 friends');
    return new Promise<Auth0Friend[]>((resolve, reject) => {
        const options = {
            method: 'GET',
            url: url.resolve(`https://${process.env.AUTH0_DOMAIN}/api/v2/users/${userId}`, ''),
            headers: { 'content-type': 'application/json', 'Authorization': `${tokenType} ${token}` },
            // body: `{"client_id":"${process.env.AUTH0_CLIENT_ID}","client_secret":"${process.env.AUTH0_CLIENT_SECRET}","audience":"https://${process.env.AUTH0_DOMAIN}/api/v2/","grant_type":"client_credentials"}`
        };

        debug('making friends request (lol)\n\n');
        debug(options);

        request(options, function (error, response, body) {
            if (error) return reject(error);
            try {
                debug('attempting to parse friends');
                console.log(body);
                const data: any = JSON.parse(body);
                const friends = data.context.mutual_friends.data;
                const newFriends: Auth0Friend[] = (friends as { id: string, name: string }[])
                    .map(f => { return { id: `${provider}|${f.id}`, first: f.name.split(' ')[0], last: f.name.split(' ')[1] }; });
                debug('friends:', newFriends);
                resolve(newFriends);
            } catch (error) { reject(error); };
        });
    });
}