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

 options is an object containing connection specific settings

```javascript

var graze = require('../lib/moog-graze.js')({hostname: 'moogtest','grazeUser':'my_user', 'grazePass':'my_password'});

```

The use of TLS (https) is mandatory

To pass a server crt pass the parameter options.cert as a cert in PEM format

To pass a client key use options.key as cert in PEM format, you must also pass a server cert.

To provide a ca certificate (self signed) or a ca as a valid root (some common root certificates are included)

To bypass root ca checking (insecure TLS/SSL for self signed)
rejectUnauthorized: false

````javascript

// Pass the options as an object on init
//
var graze = require('../lib/moog-graze.js')({hostname: 'moogtest'});

// Or set the options to your specific configuration.
//
graze.setOps({hostname: 'newtesthost',
    'authUser': 'graze',
    'authPass': 'graze',
    'caCert': '<a certificate in PEM format>',
    'cert': '<a certificate in PEM format>',
    'rejectUnauthorized': false
    });

// Get a copy of the current options 
//
var opts = graze.getOps();

````

### Submit a request

Very simple to submit a request to a Graze endpoint

```javascript

// example to get the detail for a situation.
//
graze.getSituationDetails(situationId,callback());

```

```javascript

graze.getSituationDetails(situationId, function (err, data) {
    if (err !== 'OK') {
        console.log('graze message sent, return code: ' + err);
        console.log('graze result: ' + data);
        process.exit(0);
    } else {
        console.log('graze Situation details: ' + util.inspect(data));
        process.exit(1);
    }
});

```