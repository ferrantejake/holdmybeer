import * as fs from 'fs';
// let LOCALCONFIG_FILE_NAME = './localconfig.json';
const LOCALCONFIG_FILE_NAME = './localconfig.json';
let _config: any = {};

const debug = require('debug')('holdmybeer:init');

loadLocalConfig();
loadLocalEnvironmentVariables();

function loadLocalConfig() {
    try {
        _config = JSON.parse(fs.readFileSync(LOCALCONFIG_FILE_NAME, 'utf8'));
    } catch (error) {
        // console.log(error);
        _config = {};
    }
    // console.log(_config);
}

function loadLocalEnvironmentVariables() {
    debug('Updating local environment variables..');
    try {
        if (_config['process.env']) {
            Object.keys(_config['process.env']).forEach(key => {
                process.env[key] = _config['process.env'][key];
                debug('added', key);
            });
        }
        else throw new Error('Missing process.env property');
    } catch (error) {
        debug('Non-critical issue loading environment variables:');
        debug(error);
    }
}