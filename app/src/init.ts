import * as fs from 'fs';
const LOCALCONFIG_FILE_NAME = './localconfig.json';
const debug = require('debug')('holdmybeer:init');
const debugV = require('debug')('holdmybeer-v:init');
let _config: any = {};

/**
 * Load required libraries
 */
export function load(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        loadLocalConfig();
        loadLocalEnvironmentVariables();
        resolve();
    });
}

// Retrieve local config
function loadLocalConfig() {
    try {
        _config = JSON.parse(fs.readFileSync(LOCALCONFIG_FILE_NAME, 'utf8'));
    } catch (error) {
        _config = {};
    }
}

// Setup environment variables based on local config.
function loadLocalEnvironmentVariables() {
    debug('Updating local environment variables..');
    try {
        if (_config['process.env']) {
            Object.keys(_config['process.env']).forEach(key => {
                process.env[key] = _config['process.env'][key];
                debugV('+ Added', key);
            });
        }
        else throw new Error('Missing process.env property');
    } catch (error) {
        debug('Non-critical issue loading environment variables:');
        debug(error);
    }
}