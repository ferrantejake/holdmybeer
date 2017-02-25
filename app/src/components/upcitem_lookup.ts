// Implemenation of nodeJS request module for UPC barcode look up 
// Through UPCitemDB 

const require = require('request')
const https = require('https')

var options = {
  hostname: 'api.upcitemdb.com',
  path: '/prod/trial/lookup?upc',
}

// To contain the UPC to be looked up
// Default set to Bud Light 6 pack
var UPC = '018200533082'; 
// URl for get requests 
var requestUrl = 'api.upcitemdb.com/prod/trial/lookup?upc='
var getRequest = requestUrl + UPC



request(getRequest, function(error, response, body)
{
    if(!error, && response.statusCode == 200)
    {
        console.log(body)
    }
    else if(error)
    {
        if(response.statusCode == 400)
        {
            console.log("400: Invalid Query: Missing parameters")
        }
        if(response.statusCode == 404)
        {
            console.log("404: No matches found")
        }
        if(response.statusCode == 429)
        {
            console.log("429: Exceeded Request Limit for Day")
        }
        if(response.statusCode == 500 )
        {
            console.log("500: Server Error")
        }
    }


} )

// Sample Code 