![Moogsoft Logo](https://www.moogsoft.com/wp-content/uploads/2015/06/logo-moogsoft.png)

## Incident.MOOG Graze ReSTfull Client for Node.js


[![NPM](http://img.shields.io/npm/v/moog-graze.svg)](https://www.npmjs.org/package/moog-graze) [![Code Climate](https://codeclimate.com/github/Moogsoft/moog-graze/badges/gpa.svg)](https://codeclimate.com/github/Moogsoft/moog-graze)

[![NPM](https://nodei.co/npm/moog-graze.png?downloads=true)](https://nodei.co/npm/moog-graze/)


Allows connecting to the Incident.MOOG ReST API (Called Graze) and interacting with the Incident.MOOG platform.

- Provides a simplified abstraction
- Provides for automated authentication
- Provides support for the latest v1 specification
- Will handle auth failure (401) and retry activity

## Installation

$ npm install moog-graze

## Usage

### Create a connection

 Create a connection to the Graze ReST (You need a user with the Grazer role)
 MoogREST(options)

 options is an object containing connection specific settings

```javascript

var grazeRest = require('moog-graze').GrazeREST({'url':'https://hostname:8080','authUser':'my_user', 'authPass':'my_password'});

```

The use of TLS (https) is mandatory

To pass a server crt file pass the parameter options.certFile as a file path to the server crt.

To pass a client crt file use options.caFile as the path, if you want a client cert you must also pass a server cert.

To provide a ca certificate (self signed)

To provide a ca as a valid root

To bypass root ca checking (insecure TLS/SSL)

````javascript

var moog = require('moog-graze');

// Set the options to your specific configuration.
var options = {'url':'https://hostname:8080',
    'authUser':'graze',
    'authPass':'graze',
    'certFile' : '../ssl/server.crt',
    'caFile' : '../ssl/client.crt'
    };

// Init a connection object
var grazeRest = moog.grazeREST(options);

````

### Submit a request

Very simple to now submit a request to the Graze

```javascript

moogEvent.description = 'My new description';
// example to get the detail for a situation.
grazeRest.getSituationDetails(situationId,callback());

```

```javascript

grazeRest.getSituationDetails(situationId, function (res, rtn) {
    if (rtn == 200) {
        console.log('grazeRest message sent, return code: ' + rtn);
        console.log('grazeRest result: ' + res.message);
        process.exit(0);
    } else {
        console.log('grazeRest - ' + rtn);
        console.log('grazeRest - ' + res);
        process.exit(1);
    }
});

```