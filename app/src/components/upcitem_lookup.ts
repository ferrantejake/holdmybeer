// Implemenation of nodeJS request module for UPC barcode look up
// Through UPCitemDB

const require = require('request');
const https = require('https');

// To contain the UPC to be looked up
// Default set to Bud Light 6 pack
let UPC = '018200533082';
// URl for get requests
const requestUrl = 'api.upcitemdb.com/prod/trial/lookup?upc=';
const getRequest = requestUrl + UPC;

request(getRequest, function(error, response, body)
{
    if (!error && response.statusCode === 200) {
        console.log(body);
    }
    else
        switch (response.statusCode) {
            case 400: {
                console.log('400: Invalid Query: Missing parameters');
                break;
            }
            case 404: {
                console.log('404: No matches found');
                break;
            }
            case 429: {
                console.log('429: Exceeded Request Limit for Day');
                break;
            }
            case 500: {
                console.log('500: Server Error');
                break;
            }
            default: {
                console.log('Unknown Error');
                break;
            }
    }

} );