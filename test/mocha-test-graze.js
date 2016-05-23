/**
 * Created by stephen on 17/05/2016.
 */

var util = require('util');
var debug = require('debug')('graze');
var debugDetail = require('debug')('verbose');
var chai = require('chai'),
    expect = chai.expect;

var hostname = process.env.HOSTNAME || 'moog';

// Start testing!
//
console.log('Starting Mocha tests \x1b[31;1m' + 'NOW\x1b[0m');


describe('Graze - see the API documents at docs.moogsoft.com/display/MOOG/Graze+API', function () {
    // Hold the IDs of any new situation that is created
    var newSits = [];

    debug('* Graze - see the API documents at docs.moogsoft.com/display/MOOG/Graze+API');

    describe('#init', function () {
        debug('** #init');
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
        debug('** #getOps');
        it('should be an object with specific keys', function () {
            var graze = require('../lib/moog-graze.js')();
            var opts = graze.getOps('some rubbish');
            expect(opts).to.be.an('object');
            opts = graze.getOps();
            expect(opts).to.be.an('object');
            expect(opts).to.contain.all.keys(['grazeUser', 'grazePass', 'hostname', 'port', 'grazeBasePath', 'useProxy', 'grazeHeaders']);
            expect(opts.port).to.be.a('number');
            expect(opts.grazeHeaders).to.be.an('object');
            expect(opts.grazeHeaders).to.include.keys(['accept', 'content-type']);
            expect(opts.grazeHeaders['content-type']).to.equal('application/json');
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
        debug('** #setOps');
        it('should update the options', function () {
            var graze = require('../lib/moog-graze.js')();
            var opts = graze.getOps();
            expect(opts).to.be.an('object');
            opts.grazeUser = 'testuser';
            opts.grazePass = 'testpass';
            opts.hostname = 'testhost';
            opts.port = 6666;
            setops = graze.setOps(opts);
            expect(setops).to.be.ok;
            newopts = graze.getOps();
            expect(newopts).to.be.an('object');
            expect(newopts).to.contain.all.keys(['grazeUser', 'grazePass', 'hostname', 'port']);
            expect(newopts.grazeUser).to.equal('testuser');
            expect(newopts.grazePass).to.equal('testpass');
            expect(newopts.hostname).to.equal('testhost');
            expect(newopts.port).to.equal(6666);
            expect(newopts.grazeHeaders).to.be.an('object');
            expect(newopts.grazeHeaders).to.include.keys(['accept', 'content-type']);
            expect(newopts.grazeHeaders.accept).to.equal('application/json');

            var setops = graze.setOps({hostname: 'newtesthost'});
            expect(setops).to.be.ok;
            var newopts = graze.getOps();
            expect(newopts.hostname).to.equal('newtesthost');

            var badops = graze.setOps('some rubbish');
            expect(badops).to.not.be.ok;
        });
    });

    describe('graze.addAlertCustomInfo', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        it('should add custom_info to an alert (testing against an instance called ' + hostname + ')', function (done) {
            var customInfo = {field1: 'value1', num1: 99, obj1: {obj1_1: 'a string'}};
            graze.addAlertCustomInfo(2, customInfo, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('should return an error (testing against an instance called ' + hostname + ')', function (done) {
            var unparseable = "{field1: 'value1', num1: 99, obj1: {'obj1 1: 'a string'}";
            graze.addAlertCustomInfo(1, unparseable, function (err, data) {
                try {
                    expect(err).to.equal(400);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('should return the previously updated alert with new custom_info (testing against an instance called ' + hostname + ')', function (done) {
            graze.getAlertDetails(2, function (err, data) {
                try {
                    expect(data).to.be.an('object');
                    expect(data).to.contain.all.keys(['custom_info']);
                    expect(data.custom_info).to.be.an('object');
                    expect(err).to.equal(200);
                    expect(data.custom_info).to.contain.all.keys(['field1', 'num1', 'obj1']);
                    expect(data.custom_info.num1).to.be.a('number');
                    expect(data.custom_info.obj1).to.be.an('object');
                    expect(data.custom_info.obj1.obj1_1).to.be.a('string');
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.addAlertToSituation', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var alertId = 12;
        var sitId = 2;
        var invalidSitId = 10000;
        it('should add an alert (' + alertId + ') to a situation (' + sitId + ') (testing against an instance called ' + hostname + ')', function (done) {
            graze.addAlertToSituation(alertId, sitId, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('should return an error as the situation (' + invalidSitId + ') does not exist (testing against an instance called ' + hostname + ')', function (done) {
            graze.addAlertToSituation(alertId, invalidSitId, function (err, data) {
                try {
                    expect(err).to.equal(400);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('should return the previously updated situation (' + sitId + ') with new alert id added (testing against an instance called ' + hostname + ')', function (done) {
            graze.getSituationAlertIds(sitId, false, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    expect(data).to.be.an('object');
                    expect(data).to.contain.all.keys(['total_alerts', 'alert_ids']);
                    expect(data.total_alerts).to.be.a('number');
                    expect(data.alert_ids).to.be.an('array');
                    expect(data.alert_ids).to.contain(alertId);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.addProcess', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var name = 'myNewProcess';
        var description = 'My New Process Description';
        var sitnId = 2;
        it('should add process (' + name + ') to the database (testing against an instance called ' + hostname + ')', function (done) {
            var graze = require('../lib/moog-graze.js')({hostname: hostname});
            graze.addProcess(name, description, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('should return an error no name passed (testing against an instance called ' + hostname + ')', function (done) {
            graze.addProcess('', description, function (err, data) {
                try {
                    expect(err).to.equal(400);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('add the previously inserted process (' + name + ') to a situation (' + sitnId + ') (testing against an instance called ' + hostname + ')', function (done) {
            graze.setSituationProcesses(sitnId, name, '', function (err, data) {
                try {
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('is the previously inserted process (' + name + ') in situation (' + sitnId + ') (testing against an instance called ' + hostname + ')', function (done) {
            var graze = require('../lib/moog-graze.js')({hostname: hostname});
            graze.getSituationProcesses(sitnId, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    expect(data.processes).to.contain(name);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.addService', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var name = 'myNewService';
        var description = 'My New Service Description';
        var sitnId = 2;
        it('should add service (' + name + ') to the database (testing against an instance called ' + hostname + ')', function (done) {
            graze.addService(name, description, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('should return an error no name passed (testing against an instance called ' + hostname + ')', function (done) {
            graze.addService('', description, function (err, data) {
                try {
                    expect(err).to.equal(400);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('add the previously inserted service (' + name + ') to a situation (' + sitnId + ') (testing against an instance called ' + hostname + ')', function (done) {
            graze.setSituationServices(sitnId, name, '', function (err, data) {
                try {
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('is the previously inserted service (' + name + ') in situation (' + sitnId + ') (testing against an instance called ' + hostname + ')', function (done) {
            var graze = require('../lib/moog-graze.js')({hostname: hostname});
            graze.getSituationServices(sitnId, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    expect(data.services).to.contain(name);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.addSigCorrelationInfo', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var sitnId = 3;
        var serviceName = 'My Testsing Service';
        var resourceId = 'My Test ID';
        
        it('should add correlation info for a situation (testing against an instance called ' + hostname +
            ') (need to check in DB as no call to see if it worked)', function (done) {
            
            graze.addSigCorrelationInfo(sitnId, serviceName, resourceId, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('should return an error, no service provided (testing against an instance called ' + hostname + ')', function (done) {
            graze.addSigCorrelationInfo(sitnId, '', resourceId, function (err, data) {
                try {
                    expect(err).to.equal(400);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('should return an error, no resource id provided (testing against an instance called ' + hostname + ')', function (done) {
            graze.addSigCorrelationInfo(sitnId, serviceName, '', function (err, data) {
                try {
                    expect(err).to.equal(400);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.addSituationCustomInfo', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var sitnId = 4;
        
        it('should add custom_info to a situation (testing against an instance called ' + hostname + ')', function (done) {
            var customInfo = {field1: 'sitvalue1', num1: 999, obj1: {obj1_1: 'a sit string'}};
            graze.addSituationCustomInfo(sitnId, customInfo, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('should return an error (testing against an instance called ' + hostname + ')', function (done) {
            var unparseable = "{field1: 'value1', num1: 99, obj1: {'obj1 1: 'a string'}";
            graze.addSituationCustomInfo(sitnId, unparseable, function (err, data) {
                try {
                    expect(err).to.equal(400);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('should return the previously updated situation with new custom_info (testing against an instance called ' + hostname + ')', function (done) {
            graze.getSituationDetails(sitnId, function (err, data) {
                try {
                    expect(data).to.be.an('object');
                    expect(data).to.contain.all.keys(['custom_info']);
                    expect(data.custom_info).to.be.an('object');
                    expect(err).to.equal(200);
                    expect(data.custom_info).to.contain.all.keys(['field1', 'num1', 'obj1']);
                    expect(data.custom_info.num1).to.be.a('number');
                    expect(data.custom_info.obj1).to.be.an('object');
                    expect(data.custom_info.obj1.obj1_1).to.be.a('string');
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.addThreadEntry', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var threadName = 'Support';
        var threadEntry = 'Test thred entry \n with 2 lines';
        var sitnId = 4;

        it('should add a thread entry to a situation ('+sitnId+') thread ('+threadName+') (testing against an instance called ' + hostname + ')', function (done) {
            var customInfo = {field1: 'value1', num1: 99, obj1: {obj1_1: 'a string'}};
            graze.addThreadEntry(sitnId, threadName, threadEntry, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('should create the thread (DUMMY) and post to it in situation ('+sitnId+') (testing against an instance called ' + hostname + ')', function (done) {
            threadName = 'DUMMY';

            graze.addThreadEntry(sitnId, threadName, threadEntry, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.closeAlert', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var alertId = 10;

        it('should close an alert ('+alertId+') (testing against an instance called ' + hostname + ')', function (done) {
            graze.closeAlert(alertId, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('should return an alert ('+alertId+') that is closed (status 9) (testing against an instance called ' + hostname + ')', function (done) {
            graze.getAlertDetails(alertId, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    expect(data.state).to.equal(9);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.closeSituation', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var sitnId = 6;

        it('should close a situation ('+sitnId+') but no alerts (testing against an instance called ' + hostname + ')', function (done) {
            graze.closeSituation(sitnId, 0, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('should return the status of situation ('+sitnId+') (testing against an instance called ' + hostname + ')', function (done) {
            graze.getSituationDetails(sitnId, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    expect(data.status).to.equal(9);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.createSituation', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var description = 'New situation from mocha-test-graze testing';

        it('should add a new situation and return the ID (testing against an instance called ' + hostname + ')', function (done) {

            graze.createSituation(description, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    expect(data).to.be.an('object');
                    expect(data.sit_id).to.be.a('number');
                    newSits.push(data.sit_id);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.createThread', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var threadName = 'my new testThread';
        var sitnId = 2;

        it('should add a thread ('+threadName+') to situation ('+sitnId+') (testing against an instance called ' + hostname + ')', function (done) {
            graze.createThread(sitnId, threadName, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.getActiveSituationIds', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});

        it('should add custom_info to an alert (testing against an instance called ' + hostname + ')', function (done) {
            graze.getActiveSituationIds(function (err, data) {
                try {
                    expect(err).to.equal(200);
                    expect(data).to.contain.all.keys(['total_situations','sit_ids']);
                    expect(data.total_situations).to.be.a('number');
                    expect(data.sit_ids).to.be.an('array');
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.getAlertDetail', function () {
        it('should return an alert detail object (testing against an instance called ' + hostname + ')', function (done) {
            var graze = require('../lib/moog-graze.js')({hostname: hostname});
            graze.getAlertDetails(1, function (err, data) {
                try {
                    expect(data).to.be.an('object');
                    expect(data).to.contain.all.keys(['alert_id', 'severity', 'manager', 'custom_info']);
                    expect(data.alert_id).to.equal(1);
                    expect(data.severity).to.be.a('number');
                    expect(data.custom_info).to.be.an('object');
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('should return "unautorized" (testing against an instance called ' + hostname + ')', function (done) {
            var graze = require('../lib/moog-graze.js')({hostname: hostname, grazePass: 'rubbish'});
            graze.getAlertDetails(1, function (err, data) {
                try {
                    expect(data).to.be.a('string');
                    expect(err).to.be.a('number');
                    expect(data).to.equal('Unauthorized');
                    expect(err).to.equal(401);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('alert should not be found (testing against an instance called ' + hostname + ' with an alert_id that is not available)', function (done) {
            var graze = require('../lib/moog-graze.js')({hostname: hostname});
            graze.getAlertDetails(1000, function (err, data) {
                console.log('Data returned: err:' + err + ' data:' + util.inspect(data));
                try {
                    expect(data).to.be.a('string');
                    expect(err).to.be.a('number');
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.getSituationAlertIds', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var sitnId = 2;

        it('should get a list of unique alerts for situation ('+sitnId+') (testing against an instance called ' + hostname + ')', function (done) {
            graze.getSituationAlertIds(sitnId, true, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    expect(data).to.contain.all.keys(['total_alerts','alert_ids']);
                    expect(data.total_alerts).to.be.a('number');
                    expect(data.alert_ids).to.be.an('array');
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });

        it('should get a list of all alerts for situation ('+sitnId+') (testing against an instance called ' + hostname + ')', function (done) {
            graze.getSituationAlertIds(sitnId, false, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    expect(data).to.contain.all.keys(['total_alerts','alert_ids']);
                    expect(data.total_alerts).to.be.a('number');
                    expect(data.alert_ids).to.be.an('array');
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.getSituationDescription', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var sitnId = 4;
        
        it('should get a description for a situation ('+sitnId+') (testing against an instance called ' + hostname + ')', function (done) {
            graze.getSituationDescription(sitnId, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    expect(data).to.be.an('object');
                    expect(data).to.contain.all.keys(['sitn_id','description']);
                    expect(data.description).to.be.a('string');
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('should return an error (testing against an instance called ' + hostname + ')', function (done) {
            var graze = require('../lib/moog-graze.js')({hostname: hostname});
            graze.getSituationDescription('', function (err, data) {
                try {
                    expect(err).to.equal(400);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.getSituationDetails', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var sitnId = 4;

        it('should get details for a situation ('+sitnId+') (testing against an instance called ' + hostname + ')', function (done) {
            graze.getSituationDetails(sitnId, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    expect(data).to.be.an('object');
                    expect(data).to.contain.all.keys(['category','created_at','custom_info','description',
                        'external_priority','first_event_time','last_event_time','last_state_change',
                        'moderator_id','sit_id','status','story_id','superseded_by','total_alerts','total_unique_alerts']);
                    expect(data.category).to.be.a('string');
                    expect(data.created_at).to.be.a('number');
                    expect(data.external_priority).to.be.a('number');
                    expect(data.first_event_time).to.be.a('number');
                    expect(data.internal_priority).to.be.a('number');
                    expect(data.last_event_time).to.be.a('number');
                    expect(data.last_state_change).to.be.a('number');
                    expect(data.moderator_id).to.be.a('number');
                    expect(data.sit_id).to.be.a('number');
                    expect(data.status).to.be.a('number');
                    expect(data.story_id).to.be.a('number');
                    expect(data.total_alerts).to.be.a('number');
                    expect(data.total_unique_alerts).to.be.a('number');
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('should return an error no situation id passed (testing against an instance called ' + hostname + ')', function (done) {
            graze.getSituationDetails('', function (err, data) {
                try {
                    expect(err).to.equal(400);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.getSituationHosts', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var sitnId = 4;
        
        it('should get a list of hosts for all alerts in a situation ('+sitnId+') (testing against an instance called ' + hostname + ')', function (done) {
            graze.getSituationHosts(sitnId, false, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    expect(data).to.contain.all.keys(['hosts']);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('should get a list of hosts for unique alerts in a situation ('+sitnId+') (testing against an instance called ' + hostname + ')', function (done) {
            graze.getSituationHosts(sitnId, true, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    expect(data).to.contain.all.keys(['hosts']);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.getSituationProcesses', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var sitnId = 2;

        it('should return the list of processes in situation ('+sitnId+') (testing against an instance called ' + hostname + ')', function (done) {
            graze.getSituationProcesses(sitnId, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    expect(data.processes).to.exist;
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.getSituationServices', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var sitnId = 2;

        it('should return the list of services in situation ('+sitnId+') (testing against an instance called ' + hostname + ')', function (done) {
            graze.getSituationServices(sitnId, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    expect(data.services).to.exist;
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.getSystemStatus', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});

        it('should return the system status (testing against an instance called ' + hostname + ')', function (done) {
            graze.getSystemStatus(function (err, data) {
                try {
                    expect(err).to.equal(200);
                    expect(data).to.be.an('object');
                    expect(data.processes).to.be.an('array');
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.getSystemSummary', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});

        it('should the system summary (testing against an instance called ' + hostname + ')', function (done) {
            graze.getSystemSummary(function (err, data) {
                try {
                    expect(err).to.equal(200);
                    expect(data).to.be.an('object');
                    expect(data.system_summary).to.contain.all.keys(['total_events','alert_count','total_sitns']);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.getTeamSituationIds', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var teamName = 'testteam';

        it('should get the situations for a team ('+teamName+') (testing against an instance called ' + hostname + ')', function (done) {
            graze.getTeamSituationIds(teamName, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    expect(data).to.contain.all.keys(['total_situations','sit_ids']);
                    expect(data.total_situations).to.be.a('number');
                    expect(data.sit_ids).to.be.an('array');
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('should produce an error for a dummy team name (testing against an instance called ' + hostname + ')', function (done) {
            graze.getTeamSituationIds('DUMMY', function (err, data) {
                try {
                    expect(err).to.equal(400);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.getThreadEntries', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var sitnId = 2;
        var threadName = 'Support';

        it('should get thread ('+threadName+') entries from situation ('+sitnId+') use defualt start and limit ' +
            '(testing against an instance called ' + hostname + ')', function (done) {
            graze.getThreadEntries(sitnId, threadName, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    expect(data).to.be.an('object');
                    expect(data.entries).to.be.an('array');
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.getUserInfo', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var userId = 2;

        it('get the name of a user from the id ('+userId+') (testing against an instance called ' + hostname + ')', function (done) {
            graze.getUserInfo(userId, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.getUserRoles', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var userId = 2;

        it('get the roles for a user ('+userId+') (testing against an instance called ' + hostname + ')', function (done) {
            graze.getUserRoles(userId, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.getUserTeams', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var userId = 2;

        it('get the teams for a user ('+userId+') (testing against an instance called ' + hostname + ')', function (done) {
            graze.getUserTeams(userId, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.mergeSituations', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var sit1 = 2;
        var sit2 = 3;
        var situations = [sit1,sit2];

        it('should merge 2 situations ('+sit1+' and '+sit2+') (testing against an instance called ' + hostname + ')', function (done) {
            graze.mergeSituations(situations, false, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    expect(data).to.be.an('object');
                    expect(data.sit_id).to.be.a('number');
                    done();
                    newSits.push(data.sit_id);
                }
                catch (e) {
                    done(e);
                }
            });
        });

    });

    describe('graze.removeAlertFromSituation', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var sitId = newSits.pop() || 4;
        var alertId = 20;

        it('should remove an alert ('+alertId+') from a situation ('+sitId+') (testing against an instance called ' + hostname + ')', function (done) {
            graze.removeAlertFromSituation(alertId, sitId, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.resolveSituation', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var sitId = newSits.pop() || 6;

        it('should resolve a situation ('+sitId+') (testing against an instance called ' + hostname + ')', function (done) {
            graze.resolveSituation(sitId, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.setAlertSeverity', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var alertId = 4;
        var severity = 5;

        it('should set an alert ('+alertId+') severity to ('+severity+') (testing against an instance called ' + hostname + ')', function (done) {
            graze.setAlertSeverity(alertId, severity, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.setSituationDescription', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var sitId = 3;
        var description = 'New description from testing.';

        it('should set the description ('+description+') for a situation ('+sitId+') (testing against an instance called ' + hostname + ')', function (done) {
            graze.setSituationDescription(sitId, description, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.setSituationExternalSeverity', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var sitnId = 2;
        var severity = 5;

        it('should set the external severity ('+severity+') for situation ('+sitnId+') (testing against an instance called ' + hostname + ')', function (done) {
            graze.setSituationExternalSeverity(sitnId, severity, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.setSituationProcesses', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var sitnId = 2;
        var process = 'myNewProcess';
        var primaryProcess = 'myNewProcess';

        it('should add process ('+process+') to situation ('+sitnId+') (testing against an instance called ' + hostname + ')', function (done) {
            graze.setSituationProcesses(sitnId, process, primaryProcess, function (err, data) {
                try {
                    expect(err).to.equal(200);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('graze.setSituationServices', function () {
        var graze = require('../lib/moog-graze.js')({hostname: hostname});
        var sitnId = 2;
        var service = 'myNewService';
        var primaryService = 'myNewService';

        it('should add service ('+service+') to situation ('+sitnId+') (testing against an instance called ' + hostname + ')', function (done) {
            graze.setSituationServices(sitnId, service, primaryService, function (err, data) {
                try {
                    expect(err).to.equal(200);
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
