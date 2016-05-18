/**
 * Created by stephen on 17/05/2016.
 */

// Export the options and the graze methods
// hide the auth, retry and proxy complexity
// Aim to provide a simple API based on the
// http://docs.moogsoft.com/display/MOOG/Graze+API
// remove need for auth_token paramter for each call
// pass a callback as the finnal parameter
//
// @example getAlertDetails(alert_id, callback(res, err) {});
// 
// Error conditions are returned in the err as a standard error 
// object, res is the response message from Moog as an object
//

/**
 * Module dependencies.
 */

var https = require('https');
var util = require('util');
var httpsProxy = require('https-proxy-agent');
var debug = require('debug')('graze');
var debugDetail = require('debug')('verbose');

/**
 * Module exports.
 */

exports = module.exports = Graze;

exports.version = '0.0.1';


/**
 * Main module
 */

function Graze(grazeOpts) {
    if (!(this instanceof Graze)) {
        return new Graze(grazeOpts);
    }
    debug('creating new graze instance.');

    grazeOpts = grazeOpts || {};

    // Build the options object for the first time
    //
    this.connectOptions = {
        // return a default options object
        grazeUser: "graze",
        grazePass: "graze",
        grazeBasePath: "/graze/v1",
        retry: 3,
        hostname: 'hostname',
        port: 8080,
        rejectUnauthorized: false,
        caCert: '',
        key: '',
        cert: '',
        useProxy: false,
        proxyHost: '',
        proxyPort: 0,
        grazeHeaders: {
            Accept: 'application/json',
            ContentType: 'application/json'
        },
        authToken: '',
        retryCount: 0
    };

    // Add in any paramters passed
    //
    this.setOps(grazeOpts);
}

function authenticate(opts) {

    return new Promise(function (resolve, reject) {
        debug('Enter authenticate promise');

        var grazeAuthPath = opts.grazeBasePath +
            "/authenticate?username=" + opts.grazeUser + "&password=" + opts.grazePass;

        var grazeLoginOpts = {
            host: opts.hostname,
            port: opts.port,
            path: grazeAuthPath,
            method: 'GET',
            headers: opts.grazeHeaders,
            rejectUnauthorized: opts.rejectUnauthorized
        };

        callGrazeEndpoint(grazeLoginOpts).then(function (response) {
            debug("authenticate - callGrazeEndpoint response " + response);
            opts.retryCount = 0;
            resolve(response);
        }, function (error) {
            console.log("authenticate - callGrazeEndpoint error", error.statusCode);

            if (error.statusCode >= 400 && error.statusCode < 500) {
                console.log("authenticate rejecting with a 400-499 client error");
                reject(error);
            }
            else if (opts.retryCount < opts.retry) {
                console.log("authenticate: Retry " + opts.retryCount++ + ' of ' + opts.retry);
                authenticate(opts).then(function (response) {
                    console.log("authenticate: Success!", response);
                    resolve(response);
                }, function (error) {
                    console.error("authenticate: Failed!", error.statusCode);
                    reject(error);
                });
            }
            else {
                console.log('Retry count exceded');
                reject('Retry limit exceded ' + error);
            }
        });

    });
}

/**
 *
 * @param opts
 * @returns {Promise}
 */
function callGrazeEndpoint(opts) {

    return new Promise(function (resolve, reject) {

        debug('Enter callGrazeEndpoint promise :https://' + opts.host + ":" + opts.port + "" + opts.path);
        // We use an agent so we can add a proxy if needed
        //
        if (!opts.agent) {
            opts.agent = new https.Agent(opts);
        }
        debugDetail('callGrazeEndpoint opts: ' + util.inspect(opts));
        var req = https.request(opts, (res) => {
            var resData = {};
            var returnString = "";

            debug('callGrazeEndpoint https.request: response statusCode: ' + res.statusCode);
            debugDetail('callGrazeEndpoint https.request: headers: ' + res.headers);

            res.on('data', function (d) {
                returnString += d;
            });
            res.on('end', function () {
                try {
                    resData = JSON.parse(returnString.toString('utf8'));
                }
                catch (e) {
                    debug("callGrazeEndpoint: Failed to parse returned JSON string: " + e);
                    reject({statusCode: 204, statusMessage: 'No record found'});
                }
                if (res.statusCode === 200 && res.statusMessage === 'OK') {
                    debug("callGrazeEndpoint received graze data " + res.statusCode + ': ' + res.statusMessage);
                    resolve(resData);
                }
                else if (resData.message) {
                    console.log("callGrazeEndpoint: Failed to get graze data " +
                        res.statusCode + ': ' + res.statusMessage + ': ' + resData.message);
                    res.message = resData.message;
                    reject(res);
                }
                else {
                    console.log("callGrazeEndpoint: Failed " + res.statusCode + ': ' + res.statusMessage);
                    reject(res);
                }
            });
        });

        req.on('error', function (err) {
            console.log("callGrazeEndpoint: Connection to graze failed: " + err);
            reject(err);
        });

        req.end();
    });
}

/**
 *
 * @returns {{grazeUser: string, grazePass: string, grazeBasePath: string, retry: number, hostname: string, port:
 *     number, rejectUnauthorized: boolean, caCert: string, key: string, cert: string, useProxy: boolean, proxyHost:
 *     string, proxyPort: number, grazeHeaders: {Accept: string, ContentType: string}, authToken: string, retryCount:
 *     number}|*}
 */
Graze.prototype.getOps = function () {
    debug('Entering getOps');
    debugDetail('getOps connectOptions: ' + util.inspect(this.connectOptions));

    return Object.assign({}, this.connectOptions);
};

/**
 *
 * @param opts
 */
Graze.prototype.setOps = function (opts) {
    debug('Entering setOps');
    var localOps = opts || {};
    var keysUpdated = 0;

    if (localOps && typeof localOps !== 'object') {
        console.log('setOps: Paramter passed is not an object ignoring.');
        localOps = {};
    }

    debugDetail('setOps connectOptions before update: ' + util.inspect(this.connectOptions));

    for (var option in localOps) {
        if (localOps.hasOwnProperty(option)) {
            debug('setOps seting option ' + option + ' from:' + this.connectOptions[option] + ' to:' + localOps[option]);
            this.connectOptions[option] = localOps[option];
            keysUpdated++;
        }
    }
    debugDetail('setOps connectOptions after update: ' + util.inspect(this.connectOptions));

    return keysUpdated;
};

/**
 *
 * @param alertId
 * @param callback
 */
Graze.prototype.getAlertDetails = function (alertId, callback) {
    debug("Entering getAlertDetails");
    var opts = this.connectOptions;
    var authToken = opts.authToken || '';
    var self = this;

    var _getAlertDetails = function (authToken, alertId) {
        debug('Entering _getAlertDetails');
        if (!authToken) {
            console.log('_getAlertDetails: Auth Token not passed.');
            return;
        }
        debug('_getAlertDetails authToken: ' + authToken);
        return new Promise(function (resolve, reject) {

            var grazePayload = opts.grazeBasePath +
                "/getAlertDetails?auth_token=" + authToken + "&alert_id=" + alertId;

            var grazeLoginOpts = {
                host: opts.hostname,
                port: opts.port,
                path: grazePayload,
                method: 'GET',
                headers: opts.grazeHeaders,
                rejectUnauthorized: opts.rejectUnauthorized
            };

            callGrazeEndpoint(grazeLoginOpts).then(function (response) {
                debug("_getAlertDetails - callGrazeEndpoint response " + response);
                opts.retryCount = 0;
                resolve(response);
            }, function (error) {
                console.log("_getAlertDetails - callGrazeEndpoint error " + error.statusCode);

                if (error.statusCode >= 500 && error.statusCode < 510) {
                    if (opts.retryCount < opts.retry) {
                        console.log("Retry " + opts.retryCount++ + ' of ' + opts.retry);
                        _getAlertDetails(authToken, alertId).then(function (response) {
                            debug("_getAlertDetails -  retry response" + response);
                            resolve(response);
                        }, function (error) {
                            console.log("_getAlertDetails -  retry error" + error);
                        });
                    }
                    else {
                        console.log('_getAlertDetails -  retry count exceded');
                        reject('_getAlertDetails Retry limit exceded ' + error);
                    }
                } else {
                    reject(error);
                }
            });
        });
    };

    if (!authToken) {
        debug('getAlertDetails authenticate: No authToken, go get one.');
        authenticate(opts).then(function (response) {
            debug('getAlertDetails authenticate response authToken:' + response.auth_token);
            self.authToken = response.auth_token;
            _getAlertDetails(self.authToken, alertId).then(function (response) {
                debug("getAlertDetails response from _getAlertDetails:" + response.description);
                debug("getAlertDetails _getAlertDetails call callback with OK");
                callback('OK', response);
            }, function (error) {
                console.log("getAlertDetails _getAlertDetails error: " + error.statusCode);
                callback(error.statusCode, error.statusMessage);
            })
        }, function (error) {
            console.log("getAlertDetails authenticate error: " + error.statusCode+' '+error.statusMessage);
            self.authToken = '';
            callback(error.statusCode, error.statusMessage);
        });
    }
    else {
        _getAlertDetails(self.authToken, alertId).then(function (response) {
            debug("getAlertDetails response from _getAlertDetails:" + response.description);
            debug("getAlertDetails _getAlertDetails call callback with OK");
            callback('OK', response);
        }, function (error) {
            console.log("getAlertDetails error from _getAlertDetails was there a 401? " + error);
            self.authenticate(opts).then(function (response) {
                debug("getAlertDetails after error (retry authenticate) response: " + response);
                self.authToken = response;
                _getAlertDetails(self.authToken, alertId).then(function (response) {
                    debug("getAlertDetails after error (retry authenticate) response from _getAlertDetails: " + response.description);
                    debug("getAlertDetails after error (retry authenticate) call callback with OK");
                    callback('OK', response);
                }, function (error) {
                    console.log("getAlertDetails after error (retry authenticate) error back from _getAlertDetails: " + error);
                    debug("getAlertDetails after error (retry authenticate) call callback with error");
                    callback(error.statusCode, error.statusMessage);
                })
            })
        });
    }
};
