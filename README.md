![Moogsoft Logo](https://www.moogsoft.com/wp-content/uploads/2017/02/moog-logo.png)

## MOOG.AIOps Graze ReSTful Client for Node.js


[![Code Climate](https://codeclimate.com/github/Moogsoft/moog-graze/badges/gpa.svg)](https://codeclimate.com/github/Moogsoft/moog-graze)


Allows connecting to the MOOG.AIOps REST API (Called Graze) and interacting with the MOOG.AIOps platform.

- Provides a simplified abstraction
- Provides for automated authentication
- Provides support for the latest v1 specification
- Will handle auth failure and retry activity

Updated for MOOG.AIOps V6

## Installation

$ npm install moog-graze

## Usage

### Create a connection

 Create a connection to the Graze REST (You need a user with the Grazer role)

 options is an object containing connection specific settings

```javascript
// For Auth token
var graze = require('moog-graze')({hostname: 'moogtest','grazeUser':'my_user', 'grazePass':'my_password'});
// OR for Basic Auth
var graze = require('moog-graze')({hostname: 'moogtest','auth':'my_user:my_password'});

```

 The use of TLS (https) is mandatory

 To pass a server certificate pass the parameter options.cert in PEM format

 To pass a client key use options.key as certificate in PEM format, you must also pass a server certificate.

 To provide a ca certificate (self signed) or a ca as a valid root (some common root certificates are included)

 To bypass root ca checking (insecure TLS/SSL for self signed)
 rejectUnauthorized: false

````javascript

// Pass the options as an object on init
//
var graze = require('moog-graze')({hostname: 'moogtest'});

// Or set the options to your specific configuration.
//
graze.setOps({hostname: 'newtesthost',
    'auth': 'username:password',
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

 All callbacks provide err (http code) and data (payload or more error details)

```javascript

graze.getSituationDetails(situationId, function (err, data) {
    if (err !== 200) {
        console.log('graze message sent, return code: ' + err);
        console.log('graze result: ' + data);
    } else {
        console.log('graze Situation details: ' + util.inspect(data));
    }
});

```
##Tests
 There are a set of Mocha tests that can be run against an instance, you will need a number of alets
 and situations and a team with name 'Cloud DevOps'.
 
 For the new getAlertId, getSituationId and createMaintenanceWindow take a filter as an argument or as a paramter.
 This needs to be in MOOG internal filter format, e.g.
 
 ```
 '{"op":6,"column":"internal_priority","type":"LEAF","value":[3,4,5]}'
 ```
 ##Updates
 Last tested against 6.1.0
 + Basic Auth
 + createTeam
 + updateTeam
 + createUser
 + teamObj prototype
 + userObj prototype
 
 5.2.3
 + createMaintenanceWindow
 + getMaintenanceWindows
 + deleteMaintenanceWindow
 + maintenanceWindowObj prototype
 + setAlertAcknowledgeState
 + setSituationAcknowledgeState
 - setSituationExternalSeverity DEPRECATED

###TODO
 Add convertion of advanced query syntax to internal MOOG format
 
##References 
 For full details of the Graze API see [http://docs.moogsoft.com/display/MOOG/Graze+API](http://docs.moogsoft.com/display/MOOG/Graze+API)