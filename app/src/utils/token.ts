import * as cryptoLib from './cryptoLib';
// import { dq } from '../components';

const SESSION_CODE_CHARS = cryptoLib.AUTH_CODE_CHARS;
const SESSION_TOKEN_LENGTH = 16;

/**
 * Create a new token.
 * @param code - Predefined token token code
 */
export function create(code?: string): Promise<any> {
    // We will assume in the general case that tokens being created
    // are authorization tokens. For this reason, the parameters are
    // optional as we can make global constants to address tis commonality.

    // Should return an authToken record
    return new Promise<any>((resolve, reject) => {
        // generate session token code
        // create new session token using session token code
        // resolve authtoken record
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
export function generateSessionCode(): Promise<String> {
    return cryptoLib.generateSecureCode(SESSION_CODE_CHARS, SESSION_TOKEN_LENGTH);
}