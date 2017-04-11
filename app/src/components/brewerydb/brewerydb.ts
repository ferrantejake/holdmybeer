// Create brewerydb client interface
const BreweryDb = require('brewerydb-node');
const breweryDbClient = new BreweryDb(process.env.BREWERYDB_API_KEY);

export function client() {
    return breweryDbClient;
}