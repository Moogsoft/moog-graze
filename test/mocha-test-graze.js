/**
 * Created by stephen on 17/05/2016.
 */

var util = require('util');
var debug = require('debug')('graze');
var debugDetail = require('debug')('verbose');
var chai = require('chai'),
    expect = chai.expect;


// Start testing!
//
console.log('Starting Mocha tests \x1b[31;1m' + 'NOW\x1b[0m');


describe('Graze - see the API documents at docs.moogsoft.com/display/MOOG/Graze+API', function () {
    describe('#init', function () {
        it('should return a graze object', function () {
            var graze;
            graze = require('../lib/moog-graze.js')();
            expect(graze).to.be.an('object');
            graze = require('../lib/moog-graze.js')({retry: 4});
            expect(graze).to.be.an('object');
            graze = require('../lib/moog-graze.js')('some rubbish');
            expect(graze).to.be.an('object');
        });
        it('should set the option correctly', function () {
            var graze = require('../lib/moog-graze.js')({retry: 4});
            var opts = graze.getOps();
            expect(opts).to.be.an('object');
            expect(opts).to.include.keys('retry');
            expect(opts.retry).to.equal(4);
        });
    });
    describe('#getOps', function () {
        it('should be an object with specific keys', function () {
            var graze = require('../lib/moog-graze.js')();
            var opts = graze.getOps('some rubbish');
            expect(opts).to.be.an('object');
            var opts = graze.getOps();
            expect(opts).to.be.an('object');
            expect(opts).to.include.keys('grazeUser');
            expect(opts).to.include.keys('grazePass');
            expect(opts).to.include.keys('hostname');
            expect(opts).to.include.keys('port');
            expect(opts.port).to.be.a('number');
            expect(opts).to.include.keys('grazeBasePath');
            expect(opts).to.include.keys('useProxy');
            expect(opts).to.include.keys('grazeHeaders');
            expect(opts.grazeHeaders).to.be.an('object');
            expect(opts.grazeHeaders).to.include.keys('ContentType');
            expect(opts.grazeHeaders.ContentType).to.equal('application/json');
        });
        it('should not pass by reference', function () {
            var graze = require('../lib/moog-graze.js')();
            var opts = graze.getOps();
            var tmpRetry = opts.retry;
            opts.retry = 100;
            var optsAgain = graze.getOps();
            expect(optsAgain.retry).to.equal(tmpRetry);
        });
    });
    describe('#setOps', function () {
        it('should update the options', function () {
            var graze = require('../lib/moog-graze.js')();
            var opts = graze.getOps();
            expect(opts).to.be.an('object');
            opts.grazeUser = 'testuser';
            opts.grazePass = 'testpass';
            opts.hostname = 'testhost';
            opts.port = 6666;
            var setops = graze.setOps(opts);
            expect(setops).to.be.ok;
            var newopts = graze.getOps();
            expect(newopts).to.be.an('object');
            expect(newopts).to.include.keys('grazeUser');
            expect(newopts).to.include.keys('grazePass');
            expect(newopts).to.include.keys('hostname');
            expect(newopts).to.include.keys('port');
            expect(newopts.grazeUser).to.equal('testuser');
            expect(newopts.grazePass).to.equal('testpass');
            expect(newopts.hostname).to.equal('testhost');
            expect(newopts.port).to.equal(6666);
            expect(newopts.grazeHeaders).to.be.an('object');
            expect(newopts.grazeHeaders).to.include.keys('ContentType');
            expect(newopts.grazeHeaders.ContentType).to.equal('application/json');

            var setops = graze.setOps({hostname: 'newtesthost'});
            expect(setops).to.be.ok;
            var newopts = graze.getOps();
            expect(newopts.hostname).to.equal('newtesthost');

            var badops = graze.setOps('some rubbish');
            expect(badops).to.not.be.ok;
        });
    });
    describe('graze.getAlertDetail', function () {
        it('should return an alert detail object (testing against an instance called moogtest)', function (done) {
            var graze = require('../lib/moog-graze.js')({hostname: 'moogtest'});
            graze.getAlertDetails(1, function (err, data) {
                try {
                    expect(data).to.be.an('object');
                    expect(data).to.contain.all.keys(['alert_id', 'severity', 'manager', 'custom_info']);
                    expect(data.alert_id).to.equal(1);
                    expect(data.severity).to.be.a('number');
                    expect(data.custom_info).to.be.an('object');
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('should return "unautorized" (testing against an instance called moogtest)', function (done) {
            var graze = require('../lib/moog-graze.js')({hostname: 'moogtest', grazePass: 'rubbish'});
            graze.getAlertDetails(1, function (err, data) {
                try {
                    expect(data).to.be.a('string');
                    expect(err).to.be.a('number');
                    expect(data).to.equal('Unauthorized');
                    expect(err).to.equal(401);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });
        it('alert should not be found (testing against an instance called moogtest with an alert_id that is not available)', function (done) {
            var graze = require('../lib/moog-graze.js')({hostname: 'moogtest'});
            graze.getAlertDetails(1000, function (err, data) {
                console.log('Data returned: err:'+err+' data:'+util.inspect(data));
                try {
                    expect(data).to.be.a('string');
                    expect(err).to.be.a('number');
                    expect(err).to.equal(204);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });
});

/*
 // get the latest options
 //
 var connectionOptions = graze.getOps();

 // Set an option
 //
 connectionOptions.grazePass = 'graze';

 // and send it back
 //
 graze.setOps(connectionOptions);

 //console.log('Options: '+util.inspect(connectionOptions));

 graze.getAlertDetails(1, function (err, data) {
 debug('Entering the callback passed to getAlertDetails');
 if (data) {
 debug('Alert details signature:\x1b[32;1m'+data.signature+'\x1b[0m alert_id:\x1b[32;1m'+data.alert_id+'\x1b[0m');
 debugDetail('Data: '+util.inspect(data,{color: true}));
 }
 });*/
