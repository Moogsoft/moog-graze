/**
 * Created by stephen on 16/05/2016.
 */


// Just to test out the auth endpoint and a promise with retries
//


var https = require('https');
var util = require('util');

var connectionObject = {};
connectionObject.authUser = 'graze';
connectionObject.authPass = 'graze';
connectionObject.authRetry = 3;
connectionObject.authURI = 'https://moogtest:8080/graze/v1/authenticate';

var retryCount = 0;


authenticate().then(function(response) {
    console.log("Top level Success!", response);
}, function(error) {
    console.error("Top level Failed!", error);
});


function authenticate() {
    return new Promise(function(resolve, reject) {

        var grazeUser="graze";
        var grazePass="graze";
        var grazeBasePath="/graze/v1";
        var grazeAuthPath=grazeBasePath+"/authenticate?username="+grazeUser+"&password="+grazePass;

        var grazeLoginHeaders = {
            'Accept' 	: 'application/json',
            'Content-Type' 	: 'application/json'
        };

        var grazeLoginOpts = {
            host 	: "moogtest",
            port 	: 8080,
            path 	: grazeAuthPath,
            method 	: 'GET',
            headers : grazeLoginHeaders,
            rejectUnauthorized 	: false
        };

        // We use an agent so we can add a proxy if needed
        //
        grazeLoginOpts.agent = new https.Agent(grazeLoginOpts);

        var req = https.request(grazeLoginOpts, (res) => {
            var tokenData={};
            var loginToken;
            var returnString="";

            console.log('statusCode: ', res.statusCode);
            //console.log('headers: ', res.headers);

            res.on('data', function(d) {
                returnString += d;
            });
            res.on('end', function() {
                try { tokenData=JSON.parse(returnString.toString('utf8')); }
                catch(e) {
                    console.log("Failed to parse login token string: " + e);
                    reject(e);
                }
                if ( tokenData.auth_token ) {
                    loginToken=tokenData.auth_token;
                    console.log("Received a graze login token " + res.statusCode+': '+res.statusMessage +': '+loginToken);
                    resolve(loginToken);
                }
                else if ( tokenData.message ) {
                    console.log("Did not receive a login token from graze, error : " + tokenData.message);
                    reject(res.statusCode+': '+res.statusMessage +': '+tokenData.message);
                }
                else {
                    console.log("Failed to get a graze login token"+res.statusCode+': '+res.statusMessage +': ');
                    reject('Failed to get token');
                }
            });
        });

        req.on('error', function(err) {
            console.log("Connection to graze failed: " + err);
            if (retryCount < connectionObject.authRetry) {
                console.log("Retry "+retryCount++ +' of '+connectionObject.authRetry);
                authenticate().then(function(response) {
                    console.log("Success!", response);
                    resolve(response);
                }, function(error) {
                    console.error("Failed!", error);
                    reject(error);
                });
            } else {
                console.log('Retry count exceded');
                reject('Retry limit exceded ' +err);
            }

        });

        req.end();
    });
}