import * as cryptoLib from './cryptoLib';
import { dq } from '../components';

const debug = require('debug')('holdmybeer:token');
const debugV = require('debug')('holdmybeer-v:token');

// import { dq } from '../components';

const SESSION_CODE_CHARS = cryptoLib.SESSION_CODE_CHARS;
const SESSION_CODE_LENGTH = 16;
const AUTH_CODE_CHARS = cryptoLib.AUTH_CODE_CHARS;
const AUTH_CODE_LENGTH = 24;

export function createUnownedAuthToken(body?: dq.Token): Promise<dq.Token> {
    return new Promise<dq.Token>((resolve, reject) => {
        Promise.resolve()
            .then(() => { return generateAuthTokenCode(); })
            .then(code => {
                return dq.tokens.insert(Object.assign({
                    id: code,
                    createdAt: new Date(Date.now()),
                    type: dq.TokenType.Auth,
                    description: 'An unowned authorization token via the user authentication workflow.',
                    ttl: 60 // token is only live for at most 60 seconds.
                }, body));
            })
            .then(resolve)
            .catch(reject);
    });
}

/**
 * Create a new authorizatoin token.
 * @param code - Predefined token token code`
 */
export function whitelistAuthToken(ownerId: string, code?: string, body?: dq.Token): Promise<dq.Token> {
    // We will assume in the general case that tokens being created
    // are authorization tokens. For this reason, the parameters are
    // optional as we can make global constants to address tis commonality.

    return new Promise<dq.Token>((resolve, reject) => {
        // generate session token code
        // create new session token using session token code
        // resolve authtoken record

        Promise.resolve()
            .then(() => { return code ? Promise.resolve(code) : generateAuthTokenCode(); })
            .then(code => {
                return dq.tokens.insert(Object.assign({
                    id: code,
                    ownerId,
                    createdAt: new Date(Date.now()),
                    type: dq.TokenType.Auth,
                    description: 'An unowned authorization token via the user authentication workflow.',
                }, body));
            })
            .then(resolve)
            .catch(reject);
    });
}

/**
 * Create a new session token.
 * @param code - Predefined token token code
 */
export function createSessionToken(body?: dq.Token, code?: string): Promise<dq.Token> {
    return new Promise<dq.Token>((resolve, reject) => {
        Promise.resolve()
            .then(() => { return code ? Promise.resolve(code) : generateSessionCode(); })
            .then(code => {
                return dq.tokens.insert(Object.assign({
                    id: code,
                    createdAt: new Date(Date.now()),
                    type: dq.TokenType.Session
                }, body));
            })
            .then(resolve)
            .catch(reject);
    });
}

/**
 * Whitelist a user with a token
 * @param user - User record
 * @param authToken - AuthToken record
 * @return Promise<void> resolve indicates success, reject otherwise
 */
export function whitelist(user: any, authToken: any) {

    // Takes in a user and token record (must already be created so we know
    // we will not run into a conflict) and adds the user to the token context.
}

// Generate a code for a session token
export function generateSessionCode(): Promise<string> {
    return cryptoLib.generateSecureCode(SESSION_CODE_CHARS, SESSION_CODE_LENGTH);
}

function generateAuthTokenCode(): Promise<string> {
    return cryptoLib.generateSecureCode(AUTH_CODE_CHARS, AUTH_CODE_LENGTH);
}