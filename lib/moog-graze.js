/**
 * Created by Stephen on 12/05/2016.
 *
 */


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
 * Create a moogEvent to be passed to the Incident.MOOG REST LAM
 *
 * @param {MoogEvent} [dEvent] - Default values to use in the constructor
 * @returns {MoogEvent}
 * @constructor
 */
exports.MoogEvent = function MoogEvent(dEvent) {
    'use strict';
    var defEvent = dEvent || {};
    if (!(this instanceof MoogEvent)){
        return new MoogEvent(dEvent);
    }

    this.signature = "";
    this.source_id = (typeof defEvent.source_id === "undefined" || typeof defEvent.source_id !== "string") ? "NodePID-" + process.pid : defEvent.source_id;
    this.external_id = "";
    this.manager = defEvent.manager || "NodeRESTLam";
    this.source = defEvent.source || "NodePID-"+process.pid;
    this.class = defEvent.class || "NodePlatform-"+process.platform;
    this.agent_location = defEvent.agent_location || process.argv[1];
    this.type = defEvent.type || "NodeRest";
    this.severity = 0;
    this.description = "";
    this.first_occurred = 0;
    this.agent_time = 0;
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

