/**
 * Created by stephen on 13/05/2016.
 */


var request = require('request');
var util = require('util');

const authRetries = process.env.authRetries || 3;
const restHost = process.env.restHost || 'moogtest';
const restPort = process.env.restPort || 8080;
const restVersion = process.env.restVersion || 'v1';
const authUser = process.env.authUser || 'graze';
const authPass = process.env.authPassword || 'graze';
const secureSSL = process.env.secureSSL != 'false';
const caPath = process.env.caPath || '../certs';
// Add proxy stuff too

var retryCount = 0;
var authToken;

var grazeOptions = {};
grazeOptions.url = 'https://' + restHost + ':' + restPort + '/graze/' + restVersion + '/';
grazeOptions.agentOptions = {rejectUnauthorized: secureSSL};

// Check we have all the basics
//


// Perform the tests
//

console.log('grazeAuth(); ' + grazeAuth());


// End of tests


/**
 *
 */
function grazeAuth() {
    var options = {};
    options.url = grazeOptions.url + 'authenticate?username=' + authUser + '&password=' + authPass;
    options.agentOptions = grazeOptions.agentOptions;
    request(options, function (error, response, body) {
        if (error) {
            console.log('**Error ' + error);
            console.log('**Error ' + error.code);
        }
        console.log('**RESP ' + response.statusCode);
        if (!error && response.statusCode == 200) {
            //console.log('**Body '+body); // Show the HTML for the page.
            authToken = JSON.parse(body).auth_token;
            console.log('**Auth_token ' + authToken);
            return authToken;
        }
        if ((error || response.statusCode != 401) && retryCount <= authRetries) {
            retryCount += 1;
            console.log('**Auth retry ' + retryCount);
            grazeAuth();
        }
        if (!authToken) {
            console.log('Error: unauthorized graze user, or authentication timeout.');
            process.exit(1);
        }
    });
}

function grazeSituationDetails(sitId, replyMessage, type) {

    // Need to do this with promises
    //
    var body;

    if (!authCode) {
        grazeAuth(function () {
            var options = {};
            options.url = grazeOptions.url + 'getSituationDetails?auth_token=' + authCode + '&sitn_id=' + sitId;
            options.agentOptions = grazeOptions.agentOptions;

            console.log('**grazeAuth callback ' + sitId);
            request(options, function (error, response, body) {
                //console.log('**Error '+util.inspect(error));
                //console.log('**RESP '+util.inspect(response));
                if (!error && response.statusCode == 200) {
                    //console.log('**Body '+body); // Show the HTML for the page.
                    body = JSON.parse(body);
                    console.log('**grazeSituationDetails ' + util.inspect(body));
                    bot.reply(replyMessage, 'Situation ' + sitId + ' details:' + util.inspect(body));
                }
                else {
                    console.log('**Error: grazeSituationDetails: ' + response.status + ' ' + util.inspect(error));
                }
            });
        });
    }
    else {
        var options = {};
        options.url = grazeOptions.url + 'getSituationDetails?auth_token=' + authCode + '&sitn_id=' + sitId;
        options.agentOptions = grazeOptions.agentOptions;

        request(options, function (error, response, body, callback) {
            //console.log('**Error '+util.inspect(error));
            //console.log('**RESP '+util.inspect(response));
            if (!error && response.statusCode == 200) {
                //console.log('**Body '+body); // Show the HTML for the page.
                body = JSON.parse(body);
                console.log('**grazeSituationDetails ' + util.inspect(body));
                bot.reply(replyMessage, 'Situation ' + sitId + ' details:' + util.inspect(body));
            }
            else {
                console.log('**Error: grazeSituationDetails: ' + response.status + ' ' + util.inspect(error));
            }
        });
    }
}