import * as cryptoLib from './cryptoLib';
import { dq } from '../components';

const debug = require('debug')('holdmybeer:token');
const debugV = require('debug')('holdmybeer-v:token');

// import { dq } from '../components';

const SESSION_CODE_CHARS = cryptoLib.SESSION_CODE_CHARS;
const SESSION_CODE_LENGTH = 16;
const AUTH_CODE_CHARS = cryptoLib.AUTH_CODE_CHARS;
const AUTH_CODE_LENGTH = 24;

/**
 * Create a new token.
 * @param code - Predefined token token code
 */
export function create(code?: string): Promise<dq.Token> {
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
                return dq.tokens.insert({
                    id: code,
                    createdAt: new Date(Date.now()),
                    type: dq.TokenType.Auth
                });
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