import * as crypto from 'crypto';

import * as URLSafeBase64 from 'urlsafe-base64';

const SHORT_CODE_LENGTH = 6;
const SALT_SIZE = 64;
const TOKEN_LENGTH = 128;
const PASSWORD_HASH_DIGEST = 'sha512';
const PASSWORD_HASH_ITERATIONS = 100000;
const PASSWORD_HASH_SIZE = 512;
const PASSWORD_ENCODING = 'base64';
const AUTH_CODE_LENGTH = 64;
export const charSets = {
    ALPHA: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    alpha: 'abcdefghijklmnopqrstuvwxyz',
    numeric: '0123456789',
    urlSafeSpecial: '/+',
    nonUrlSafeSpecial: '',
};
export const SHORT_CODE_CHARS = charsetGenerator(charSets.ALPHA, charSets.numeric);
export const AUTH_CODE_CHARS = charsetGenerator(charSets.ALPHA, charSets.alpha, charSets.numeric, charSets.urlSafeSpecial);
export const SESSION_CODE_CHARS = AUTH_CODE_CHARS;

export function charsetGenerator(...args: any[]): string {
    return args.reduce((acc: string, current: string) => { `${acc}${current}`; }, '');
};

/**
 * Generates a psuedo-random string with passed base of size length
 * @param {string} charSet      Character set to generate string from. ex: "123abc"
 * @param {number} length       Length of desired output
 * @param {boolean} isUrlSafe
 * @return Promise<string>      Returns a Promise of type string
 * reference on short code creation http://stackoverflow.com/questions/8855687/secure-random-token-in-node-js
 */
export function generateSecureCode(charSet: string, length: number, isUrlSafe?: boolean): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        crypto.randomBytes(length, (ex, buf) => {
            const result: string[] = [];
            let cursor = 0;
            const charsLength = charSet.length;
            if (isUrlSafe) {
                return resolve(URLSafeBase64.encode(buf));
            }
            for (let i = 0; i < length; i++) {
                cursor += buf[i];
                result[i] = charSet[cursor % charsLength];
            }
            resolve(result.join(''));
        });
    });
}

// Generates a short code of length 6 (refer to generateSecureCode)
export function generateShortCode(): Promise<string> {
    return generateSecureCode(SHORT_CODE_CHARS, SHORT_CODE_LENGTH);
}

// Generates a token code of length 128 (refer to generateSecureCode)
export function generateTokenCode(): Promise<string> {
    return generateSecureCode(AUTH_CODE_CHARS, TOKEN_LENGTH);
}