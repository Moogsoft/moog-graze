/**
 * Created by Stephen on 12/05/2016.
 *
 */


//// TEST CODE FROM SPIKE

var https = require('https');

var loginToken;
var maxRetries=5;
var retryCount=0;

console.log("Starting what I am supposed to do");
grazeGet("getSituationDescription","sitn_id=1",
    function(grazeResponse) {

        // We'll eventually get the response from getSituationDescription
        // Do something.

        if ( grazeResponse && grazeResponse.description ) {
            console.log("Situation 1 has description : " + grazeResponse.description);
        }

        // We could equally well call antother grazeGet or grazeSet here.
        // We got a sig descr, now let's get a user.

        grazeGet("getSituationHosts","sitn_id=1",function(grazeResponse) {

            if ( grazeResponse && grazeResponse.hosts ) {
                console.log("Hosts are " + grazeResponse.hosts.join(","));
            }
            console.log("Finished what I am supposed to do");
        });

    });

function getGrazeLogin(callback) {

    console.log("Getting Graze login token");

    var grazeUser="graze";
    var grazePass="graze";
    var grazeBasePath="/graze/v1";
    var grazeAuthPath=grazeBasePath+"/authenticate?username="+grazeUser+"&password="+grazePass;

    var grazeLoginHeaders = {
        'Accept' 	: 'application/json',
        'Content-Type' 	: 'application/json',
    };

    var grazeLoginOpts = {
        host 	: "localhost",
        port 	: 8080,
        path 	: grazeAuthPath,
        method 	: 'GET',
        headers : grazeLoginHeaders,
        rejectUnauthorized 	: false
    };

    var grazeLoginRequest = https.request(grazeLoginOpts, function(res)
    {
        var tokenData={};
        var returnString="";
        res.on('data', function(d) {
            returnString += d;
        });
        res.on('end', function() {
            try { tokenData=JSON.parse(returnString.toString('utf8')); }
            catch(e) {
                console.log("Failed to parse login token string: " + e);
            }
            if ( tokenData.auth_token ) {

                loginToken=tokenData.auth_token;
                console.log("Received a Graze login token " + loginToken);
                // Now do what we're told.
                if ( callback )  {
                    callback();
                }

            }
            else if ( tokenData.message ) {
                console.log("Did not receive a login token from Graze, error : " + tokenData.message);
            }
            else {
                console.log("Failed to get a Graze login token");
            }
        });
    });
    grazeLoginRequest.on('error', function(err) {
        console.log("Connection to Graze  failed: " + err);
    });

    grazeLoginRequest.end();

}


function grazeGet(path,params,callback) {

    retryCount++;
    console.log("getGraze called for " + path + " retry " + retryCount);
    var grazeBasePath="/graze/v1";
    var grazePath=grazeBasePath+"/"+ path + "?" + params;

    if ( retryCount >= maxRetries ) {
        console.log("Tried too many times");
        process.exit(1);
        return;
    }

    if ( !loginToken ) {
        // Get a token and call this
        getGrazeLogin(
            function() { grazeGet(path,params,callback);
            }) ;
        return;
    }
    console.log("Using logintoken " + loginToken);

    // uncomment to force a bork.
    // loginToken="12345";
    // Add the authtoken to the path.

    grazePath += "&auth_token="+loginToken;

    var grazeHeaders = {
        'Accept' 	: 'application/json',
        'Content-Type' 	: 'application/json',
    };

    var grazeOpts = {
        host 	: "localhost",
        port 	: 8080,
        path 	: grazePath,
        method 	: 'GET',
        headers : grazeHeaders,
        rejectUnauthorized 	: false
    };

    var grazeGetRequest = https.request(grazeOpts, function(res)
    {
        var returnData={};
        var returnString="";
        var returnStatus=0;
        res.on('data', function(d) {
            returnString += d;
        });
        res.on('end', function() {
            returnStatus=res.statusCode || 0;
            try {
                returnObj=JSON.parse(returnString.toString('utf8'));
            }
            catch(e) {
                console.log("Failed to parse returned data");
                return;
            }
            if ( returnStatus === 401 ) {

                console.log("Auth borked - trying agains")
                getGrazeLogin(
                    function() { grazeGet(path,params,callback);
                    }) ;
                return;
            }


            if ( returnStatus !== 200 )  {
                console.log("Graze GET failed: " + returnStatus);
                if ( returnObj.message ) {
                    console.log("Error Message: " + returnObj.message);
                }
            }
            else {
                retryCount = 0;
                callback(returnObj);
            }
        });

    });
    grazeGetRequest.on('error', function(err) {
        console.log("Connection to Graze failed: " + err);
    });

    grazeGetRequest.end();

}
//// END OF TEST CODE


/**
 * @file moog-graze.js
 *
 * @fileOverview This is the module to use for constructing and sending requests
 * to the Incident.MOOG Graze (ReST) endpoints for interacting with the product.
 *
 * @example
 * // require
 * var moog = require('moog-graze');
 * // return a grazeREST connection
 * var options = {'url': 'http://mooggraze:8080'};
 * var moogREST = new moog.grazeREST(options);
 *
 * @requires url
 * @requires util
 * @requires events
 * @requires http
 * @requires https
 * @requires fs
 *
 */

var urlParser = require('url'),
    util = require("util"),
    events = require("events"),
    http = require('http'),
    https = require('https'),
    fs = require('fs');

/**
 * @description maxSockets=20
 * @type {number}
 */
http.globalAgent.maxSockets=20;

/**
 * Generic Debug logging function
 * @function
 *
 */
var debug = function(){
    if (!process.env.DEBUG) {
        return;
    }
    var stack = new Error().stack;
    var args = Array.prototype.slice.call(arguments);
    var lines = stack.split('\n');
    var callee = lines[2].match(/at .* /i);
    util.log('[node-moog.js] ' + callee + ' -> ' + args);
};

/**
 * @typedef options
 * @description The connection options used to construct the http or https connection
 * @type {object}
 * @property {object} [connection] - a connection object.
 * @property {string} url - the to the Incident.MOOG REST endpoint including the port and protocol e.g.
 *     'http://moogserver:8888'.
 * @property {string} [auth_token='my_secret'] - the shared secret with Incident.MOOG.
 * @property {string} [certFile='./ssl/server.crt'] - the path to the server certificate file.
 * @property {string} [cafile='./ssl/client.crt'] - the path to the client certificate file.
 * @property {boolean} [secure=false] - set the connection certificate checking.
 * @property {string} [authUser] - User name for basic auth
 * @property {string} [authPass] - Password for basic auth
 *
 * @typedef {object} eventHeaders
 * @description The http headers.
 * @type {object}
 * @property {string} [Accept='application/json'] - must be json.
 * @property {string} [Content-Type='application/json'] - must be jason.
 * @property {string} [Connection='keep-alive'] - should be keep-alive.
 * @property {string} [Authorization=options.authUser + options authPass] - passed in options
 *
 * @typedef eventRequestOpts
 * @description The connection options (derived from the url).
 * @type {object}
 * @property {string} host - from the url.
 * @property {number} port=8888 - from the url or 8888.
 * @property {string} [method='POST'] - always POST.
 */

/**
 * Setup a connection to the Incident.MOOG REST endpoint and provide a method to send
 * events to that endpoint
 *
 * @param {options} options - The Options used in setting up the connection to Incident.MOOG
 * @constructor
 */
exports.moogREST = function moogREST(options) {
    'use strict';
    if ((this instanceof moogREST)){
        util.log("ERROR Don't use new for moogREST");
        return;
    }
    var that = this;
    var proto = {};

    if (!options.url) {
        that.emit('error','No URL specified in options object');
        return;
    }

    that.options = options || {};
    that.connection = options.connection;
    that.auth_token = options.auth_token || 'my_secret';
    that.certFile = options.certFile;
    that.caFile = options.caFile;
    that.secure = options.rejectUnauthorized || false;
    that.url = urlParser.parse(options.url);
    that.eventHeaders = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Connection': 'keep-alive'
    };
    if (options.authUser && options.authPass) {
        that.eventHeaders.Authorization = 'Basic ' + new Buffer(options.authUser + ':' + options.authPass).toString('base64');
    }
    that.eventRequestOpts = {
        host: that.url.hostname,
        port: that.url.port,
        method: 'POST'
    };
    debug('MoogRest init '+JSON.stringify(that));

    if (!that.url.host) {
        util.log('WARNING: No Host defined - using localhost');
        that.url.host = 'localhost';
    }
    if (!that.url.port) {
        util.log('WARNING: No port defined - using 8888');
        that.url.port = 8888;
    }
    if (!that.url.protocol){
        util.log('WARNING: No protocol defined - using https:');
        that.url.protocol = 'https:';
    }
    if (that.url.protocol === 'https:'){
        proto = https;
        if (that.certFile) {
            this.getCert('cert', that.certFile);
        }
        if (that.caFile) {
            this.getCert('ca', that.caFile);
        }
        that.eventRequestOpts.rejectUnauthorized = that.secure;
        // Need an agent as globalAgent will silently ignore the options
        that.eventRequestOpts.agent = new https.Agent(that.eventRequestOpts);
    } else {
        proto = http;
        debug('Connect using http');
        that.eventRequestOpts.rejectUnauthorized = false;
        // Need an agent as globalAgent will silently ignore the options
        that.eventRequestOpts.agent = new http.Agent(that.eventRequestOpts);
    }

    /**
     *
     * @param {string} type  Either 'ca' or 'cert'
     * @param {string} file  The filename to load
     * @returns {boolean}  True file loaded, False file error
     */
    that.getCert = function(type,file) {
        if (!fs.existsSync(file)) {
            util.log("ERROR: https specified but can't read :" + file);
            return false;
        }
        try {
            debug('Loading '+file);
            that.eventRequestOpts[type] = fs.readFileSync(file);
        }
        catch (e) {
            util.log("ERROR: Could not read file " + file + " : " + e);
            return false;
        }
        return true;
    };

    /**
     * Send the event or an array of events to Incident.MOOg REST LAM
     * @param {MoogEvent|MoogEvent[]} mEvent - A single event object of an array of event objects to send
     * @param callback - Callback passed by module
     */
    that.sendEvent = function (mEvent,callback) {
        // Parse the data we're going to add.
        var myEvent = mEvent;
        var epochDate = Math.round(Date.now() / 1000);
        var num = myEvent.external_id++ || 0;
        var event = {};
        var reqOpts = {};
        var eventRequest = {};
        var eventString = '';
        var contentLength;

        if (myEvent instanceof Array) {
            event.events = myEvent;
            debug('Event array length '+event.events.length);
        } else {
            if (!(mEvent instanceof that.MoogEvent)) {
                callback('Non MoogEvent passed, not sent. '+util.inspect(mEvent));
                return;
            }
            myEvent.signature = mEvent.signature || mEvent.source + ":" + mEvent.class + ":" + mEvent.type;
            myEvent.external_id = mEvent.external_id || "REST"+num;
            myEvent.source = mEvent.source || "NodeRest-" + num;
            myEvent.severity = mEvent.severity || 2;
            myEvent.description = mEvent.description || "No Description Provided";
            myEvent.first_occurred = mEvent.first_occurred || epochDate;
            myEvent.agent_time = mEvent.agent_time || epochDate;
            event.events = [myEvent];
        }
        event.auth_token = that.auth_token;
        try {
            eventString = JSON.stringify(event);
            debug('Event to send '+eventString);
        }
        catch (e) {
            callback("Error: Could not JSON.stringify the event - " + e);
            return;
        }
        contentLength = Buffer.byteLength(eventString, 'utf8');
        that.eventHeaders['Content-Length'] = contentLength;
        that.eventRequestOpts.headers= that.eventHeaders;
        reqOpts = that.eventRequestOpts;
        debug('Request Options: '+util.inspect(reqOpts));
        //debug('Request headers: '+util.inspect(reqOpts.headers));
        eventRequest = proto.request(reqOpts, function (res) {
            var returnString = "";
            var returnStatus = 0;

            res.on('data', function (d) {
                //debug('sendEvent returned '+util.inspect(returnString));
                returnString += d;
            });
            res.on('end', function () {
                returnStatus = res.statusCode || 0;
                debug('sendEvent end '+util.inspect(returnStatus));
                callback(res,returnString);
            });
        });
        eventRequest.on('error', function (err) {
            debug("ERROR Can't send "+err.stack);
            debug("Connection: "+that.url.protocol+"//"+reqOpts.host+":"+reqOpts.port);
            callback('Connection Error. '+that.url.protocol+"//"+reqOpts.host+':'+reqOpts.port,err);
            eventRequest.end();
        });
        debug('Now send event');
        eventRequest.write(eventString);
        eventRequest.end();
    };
    return that;
};

/**
 * Add the Event emitter to moogREST
 */
util.inherits(exports.moogREST, events.EventEmitter);

