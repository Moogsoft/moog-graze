/**
 * Created by stephen on 17/05/2016.
 */

var util = require('util');
var debug = require('debug')('graze');
var debugDetail = require('debug')('verbose');
var chai   = require('chai'),
    expect = chai.expect;

var hostName = process.env.HOSTNAME || 'moogtest';
var hostPort = process.env.PORT || 8080;
var auth = process.env.AUTH || 'graze:graze';

// Hold the IDs of any new situation that are created
var newSits = [];

// Start testing!
//
console.log('Starting Mocha tests \x1b[31;1m' + 'NOW\x1b[0m');


describe('Graze - see the API documents at docs.moogsoft.com/display/MOOG/Graze+API', function ()
{

  debug('* Graze - see the API documents at docs.moogsoft.com/display/MOOG/Graze+API');

  describe('#init', function ()
  {
    debug('** #init');
    it('should return a graze object', function ()
    {
      var graze;
      graze = require('../lib/moog-graze.js')();
      expect(graze).to.be.an('object');
      graze = require('../lib/moog-graze.js')({retry: 4});
      expect(graze).to.be.an('object');
      graze = require('../lib/moog-graze.js')('some rubbish');
      expect(graze).to.be.an('object');
    });
    it('should set the option correctly', function ()
    {
      var graze = require('../lib/moog-graze.js')({retry: 4});
      var opts = graze.getOps();
      expect(opts).to.be.an('object');
      expect(opts).to.include.keys('retry');
      expect(opts.retry).to.equal(4);
    });
  });

  describe('#getOps', function ()
  {
    debug('** #getOps');
    it('should be an object with specific keys', function ()
    {
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
    it('should not pass by reference', function ()
    {
      var graze = require('../lib/moog-graze.js')();
      var opts = graze.getOps();
      var tmpRetry = opts.retry;
      opts.retry = 100;
      var optsAgain = graze.getOps();
      expect(optsAgain.retry).to.equal(tmpRetry);
    });
  });

  describe('#setOps', function ()
  {
    debug('** #setOps');
    it('should update the options', function ()
    {
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

  describe('graze.addAlertCustomInfo', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort});
    it('should add custom_info to an alert (testing against an instance called ' + hostName + ')', function (done)
    {
      var customInfo = {field1: 'value1', num1: 99, obj1: {obj1_1: 'a string'}};
      graze.addAlertCustomInfo(2, customInfo, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return an error (testing against an instance called ' + hostName + ')', function (done)
    {
      var unparseable = "{field2: 'value2', num2: 666, obj2: {'obj2 2: 'a string'}";
      graze.addAlertCustomInfo(1, unparseable, function (err, data)
      {
        try
        {
          expect(err).to.equal(400);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return the previously updated alert with new custom_info (testing against an instance called ' + hostName + ')', function (done)
    {
      console.log('Send test');
      graze.getAlertDetails(2, function (err, data)
      {
        console.log(util.inspect(data));
        try
        {
          expect(err).to.equal(200);
          expect(data).to.be.an('object');
          expect(data).to.contain.all.keys(['custom_info', 'alert_id', 'state', 'class']);
          expect(data.custom_info).to.be.an('object');
          expect(data.custom_info).to.contain.all.keys(['field1', 'num1', 'obj1']);
          expect(data.custom_info.num1).to.be.a('number');
          expect(data.custom_info.obj1).to.be.an('object');
          expect(data.custom_info.obj1.obj1_1).to.be.a('string');
          console.log('Done all tests');
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.addAlertToSituation', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort});
    var alertId = 10;
    var sitId = 2;
    var invalidSitId = 10000;
    it('should add an alert (' + alertId + ') to a situation (' + sitId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.addAlertToSituation(alertId, sitId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return an error as the situation (' + invalidSitId + ') does not exist (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.addAlertToSituation(alertId, invalidSitId, function (err, data)
      {
        try
        {
          expect(err).to.equal(400);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return the previously updated situation (' + sitId + ') with new alert id added (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getSituationAlertIds(sitId, false, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data).to.be.an('object');
          expect(data).to.contain.all.keys(['total_alerts', 'alert_ids']);
          expect(data.total_alerts).to.be.a('number');
          expect(data.alert_ids).to.be.an('array');
          expect(data.alert_ids).to.contain(alertId);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.addProcess', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort});
    var name = 'myNewProcess';
    var description = 'My New Process Description';
    var sitnId = 2;
    it('should add process (' + name + ') to the database (testing against an instance called ' + hostName + ')', function (done)
    {
      var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort});
      graze.addProcess(name, description, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return an error no name passed (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.addProcess('', description, function (err, data)
      {
        try
        {
          expect(err).to.equal(400);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('add the previously inserted process (' + name + ') to a situation (' + sitnId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.setSituationProcesses(sitnId, name, '', function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('is the previously inserted process (' + name + ') in situation (' + sitnId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort});
      graze.getSituationProcesses(sitnId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data.processes).to.contain(name);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.addService', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort});
    var name = 'myNewService';
    var description = 'My New Service Description';
    var sitnId = 2;
    it('should add service (' + name + ') to the database (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.addService(name, description, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return an error no name passed (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.addService('', description, function (err, data)
      {
        try
        {
          expect(err).to.equal(400);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('add the previously inserted service (' + name + ') to a situation (' + sitnId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.setSituationServices(sitnId, name, '', function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('is the previously inserted service (' + name + ') in situation (' + sitnId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort});
      graze.getSituationServices(sitnId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data.services).to.contain(name);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.addSigCorrelationInfo', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort});
    var sitnId = 3;
    var serviceName = 'My Testsing Service';
    var resourceId = 'My Test ID';

    it('should add correlation info for a situation (testing against an instance called ' + hostName +
      ') (need to check in DB as no call to see if it worked)', function (done)
    {

      graze.addSigCorrelationInfo(sitnId, serviceName, resourceId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return an error, no service provided (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.addSigCorrelationInfo(sitnId, '', resourceId, function (err, data)
      {
        try
        {
          expect(err).to.equal(400);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return an error, no resource id provided (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.addSigCorrelationInfo(sitnId, serviceName, '', function (err, data)
      {
        try
        {
          expect(err).to.equal(400);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.addSituationCustomInfo', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort});
    var sitnId = 4;

    it('should add custom_info to a situation (testing against an instance called ' + hostName + ')', function (done)
    {
      var customInfo = {field1: 'sitvalue1', num1: 999, obj1: {obj1_1: 'a sit string'}};
      graze.addSituationCustomInfo(sitnId, customInfo, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return an error (testing against an instance called ' + hostName + ')', function (done)
    {
      var unparseable = "{field1: 'value1', num1: 99, obj1: {'obj1 1: 'a string'}";
      graze.addSituationCustomInfo(sitnId, unparseable, function (err, data)
      {
        try
        {
          expect(err).to.equal(400);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return the previously updated situation with new custom_info (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getSituationDetails(sitnId, function (err, data)
      {
        try
        {
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
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.addThreadEntry', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort});
    var threadName = 'Support';
    var threadEntry = 'Test thred entry \n with 2 lines';
    var sitnId = 4;

    it('should add a thread entry to a situation (' + sitnId + ') thread (' + threadName + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      var customInfo = {field1: 'value1', num1: 99, obj1: {obj1_1: 'a string'}};
      graze.addThreadEntry(sitnId, threadName, threadEntry, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should create the thread (DUMMY) and post to it in situation (' + sitnId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      threadName = 'DUMMY';

      graze.addThreadEntry(sitnId, threadName, threadEntry, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.assignAlert', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort});
    var alertId = 4;
    // Make sure userName and userId match the same user
    var userId = 3;
    var userName = 'admin';

    it('should assign an alert (' + alertId + ') to user_id ' + userId + ' (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.assignAlert(alertId, userId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return an alert (' + alertId + ') that is assigned to user_id ' + userId + ' (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getAlertDetails(alertId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data.owner).to.equal(userId);
          expect(data.state).to.equal(3); // Assigned
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });

    alertId += 1;
    it('should assign an alert (' + alertId + ') to username ' + userName + ' (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.assignAlert(alertId, userName, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return an alert (' + alertId + ') that is assigned to username ' + userName + ' (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getAlertDetails(alertId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data.owner).to.equal(userId);
          expect(data.state).to.equal(3); // Assigned
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.assignAndAcknowledgeAlert', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort});
    var alertId = 8;
    // Make sure userName and userId match the same user
    var userId = 3;
    var userName = 'admin';

    it('should assign and acknowledge an alert (' + alertId + ') to user_id ' + userId + ' (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.assignAndAcknowledgeAlert(alertId, userId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return an alert (' + alertId + ') that is assigned and acknowledged by user_id ' + userId + ' (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getAlertDetails(alertId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data.owner).to.equal(userId);
          expect(data.state).to.equal(4); // Acknowledged
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });

    alertId += 1;
    it('should assign and acknowledge an alert (' + alertId + ') to username ' + userName + ' (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.assignAndAcknowledgeAlert(alertId, userName, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return an alert (' + alertId + ') that is assigned and acknowledged by username ' + userName + ' (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getAlertDetails(alertId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data.owner).to.equal(userId);
          expect(data.state).to.equal(4); // Acknowledged
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.assignAndAcknowledgeSituation', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort});
    var sitnId = 2;
    // Make sure userName and userId match the same user
    var userId = 3;
    var userName = 'admin';

    it('should assign and acknowledge a situation (' + sitnId + ') to user_id ' + userId + ' (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.assignAndAcknowledgeSituation(sitnId, userId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return a situation (' + sitnId + ') that is assigned and acknowledged by user_id ' + userId + ' (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getSituationDetails(sitnId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data.moderator_id).to.equal(userId);
          expect(data.status).to.equal(4); // Acknowledged
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });

    sitnId += 1;
    it('should assign and acknowledge a situation (' + sitnId + ') to username ' + userName + ' (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.assignAndAcknowledgeSituation(sitnId, userName, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return a situation (' + sitnId + ') that is assigned and acknowledged by username ' + userName + ' (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getSituationDetails(sitnId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data.moderator_id).to.equal(userId);
          expect(data.status).to.equal(4); // Acknowledged
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.assignSituation', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort});
    var sitnId = 2;
    // Make sure userName and userId match the same user
    var userId = 3;
    var userName = 'admin';

    it('should assign and acknowledge a situation (' + sitnId + ') to user_id ' + userId + ' (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.assignSituation(sitnId, userId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return a situation (' + sitnId + ') that is assigned and acknowledged by user_id ' + userId + ' (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getSituationDetails(sitnId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data.moderator_id).to.equal(userId);
          expect(data.status).to.equal(3); // Assigned
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });

    sitnId += 1;
    it('should assign and acknowledge a situation (' + sitnId + ') to username ' + userName + ' (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.assignSituation(sitnId, userName, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return a situation (' + sitnId + ') that is assigned and acknowledged by username ' + userName + ' (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getSituationDetails(sitnId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data.moderator_id).to.equal(userId);
          expect(data.status).to.equal(3); // Assigned
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.closeAlert', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort});
    var alertId = 10;

    it('should close an alert (' + alertId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.closeAlert(alertId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return an alert (' + alertId + ') that is closed (status 9) (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getAlertDetails(alertId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data.state).to.equal(9);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.closeSituation', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort});
    var sitnId = 5;

    it('should close a situation (' + sitnId + ') but no alerts (testing against an instance called ' + hostName + ')', function (done)
    {
      // Close takes some time!
      this.timeout(5000);

      graze.closeSituation(sitnId, 0, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return the status of situation (' + sitnId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getSituationDetails(sitnId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data.status).to.equal(9);
          done();
        }
        catch (e)
        {
          debugDetail('Data: ' + util.inspect(data, {color: true}));
          done(e);
        }
      });
    });
  });

  describe('graze.createSituation', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort});
    var description = 'New situation from mocha-test-graze testing';

    it('should add a new situation and return the ID (testing against an instance called ' + hostName + ')', function (done)
    {

      graze.createSituation(description, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data).to.be.an('object');
          expect(data.sit_id).to.be.a('number');
          newSits.push(data.sit_id);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.createThread', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort});
    var threadName = 'my new testThread';
    var sitnId = 2;

    it('should add a thread (' + threadName + ') to situation (' + sitnId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.createThread(sitnId, threadName, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.createTeam', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: 'graze:graze'});
    var myTeamObj = new graze.teamObj;

    myTeamObj.name = 'mytestteam' + Math.floor((Math.random() * 100) + 1);
    myTeamObj.alertFilter = '{"left":{"op":10,"column":"source","type":"LEAF","value":"hub"},"oper":"AND","right":{"op":6,"column":"severity","type":"LEAF","value":[4,5]},"type":"BRANCH"}';
    myTeamObj.active = true;
    myTeamObj.services = '[]';
    myTeamObj.sigFilter = '';
    myTeamObj.landingPage = '';
    myTeamObj.description = 'My Test Team';
    myTeamObj.users = '[3]';

    it('should create a team (' + JSON.stringify(myTeamObj) + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.createTeam(myTeamObj, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
        if (data)
        {
          expect(data).to.contain('team_id');
        }
      });
    });
  });

  describe('graze.createMaintenanceWindow', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort});
    var myMaintObj = new graze.maintObj;

    myMaintObj.name = 'My test';
    myMaintObj.description = 'My Test maintenance record';
    myMaintObj.filter = '{"left":{"op":10,"column":"source","type":"LEAF","value":"hub"},"oper":"AND","right":{"op":6,"column":"severity","type":"LEAF","value":[4,5]},"type":"BRANCH"}'
    myMaintObj.startDateTime = new Date().getTime();
    myMaintObj.duration = 3600; // 1hour
    myMaintObj.forwardAlerts = true;
    myMaintObj.recurringPeriod = 1;
    myMaintObj.recurringPeriodUnits = 2; //days

    it('should create a maintence window (' + JSON.stringify(myMaintObj) + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.createMaintenanceWindow(myMaintObj, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.createUser', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: 'graze:graze'});
    var myUserObj = new graze.userObj;

    myUserObj.username = 'testUser' + Math.floor((Math.random() * 100) + 1);
    myUserObj.password = 'testUser';
    myUserObj.active = true;
    myUserObj.email = 'test@moogsoft.com';
    myUserObj.fullName = 'The Test User';
    myUserObj.roles = '["Super User"]';
    myUserObj.primaryGroup = '1';
    myUserObj.department = 1;
    myUserObj.joined = Math.floor(Date.now() / 1000);
    myUserObj.timezone = 'European/London';
    myUserObj.contactNum = '12345';
    myUserObj.sessionExpiry = 80;
    myUserObj.competencies = '[{"name":"Generic", "ranking": 40}]';
    myUserObj.teams = '[1]';

    it('should create a user (' + JSON.stringify(myUserObj) + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.createUser(myUserObj, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
        if (data)
        {
          expect(data).to.contain('user_id');
        }
      });
    });
  });

  describe('graze.deassignAlert', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort});
    var alertId = 4;

    it('should deassign an alert (' + alertId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.deassignAlert(alertId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return an alert (' + alertId + ') that is deassigned (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getAlertDetails(alertId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data.owner).to.equal(2); // Assigned to dummy
          expect(data.state).to.equal(2); // Unassigned
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.deassignSituation', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort});
    var sitnId = 2;

    it('should deassign a situation (' + sitnId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.deassignSituation(sitnId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return a situation (' + sitnId + ') that is deassigned (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getSituationDetails(sitnId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data.moderator_id).to.equal(2);
          expect(data.status).to.equal(1); // Unassigned
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.deleteMaintenanceWindow', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var window = 16;

    it('should delete a maintenance window (' + window + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.deleteMaintenanceWindow(window, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should get the deleted maintenance windows (' + window + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getMaintenanceWindows(window, 1, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data.windows).to.be.an('array');
          expect(data.windows).to.be.empty;
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.deleteMaintenanceWindows', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var filter = 'description matches "week"';
    var limit = 2;

    it('should delete '+limit+' maintenance windows matching (' + filter + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.deleteMaintenanceWindows(filter, limit, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should not find the '+limit+' deleted maintenance windows matching (' + filter + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.findMaintenanceWindows(filter, limit, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data.windows).to.be.an('array');
          expect(data.windows).to.be.empty;
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.getActiveSituationIds', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});

    it('should add custom_info to an alert (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getActiveSituationIds(function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data).to.contain.all.keys(['total_situations', 'sit_ids']);
          expect(data.total_situations).to.be.a('number');
          expect(data.sit_ids).to.be.an('array');
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.getAlertDetail', function ()
  {
    it('should return an alert detail object (testing against an instance called ' + hostName + ')', function (done)
    {
      var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
      graze.getAlertDetails(2, function (err, data)
      {
        debug('Data returned: ' + util.inspect(data));
        try
        {
          expect(err).to.equal(200);
          expect(data).to.be.an('object');
          expect(data).to.contain.all.keys(['alert_id', 'severity', 'manager', 'custom_info']);
          expect(data.alert_id).to.equal(2);
          expect(data.severity).to.be.a('number');
          expect(data.custom_info).to.be.an('object');
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return "unautorized" (testing against an instance called ' + hostName + ')', function (done)
    {
      var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, grazePass: 'rubbish'});
      graze.getAlertDetails(1, function (err, data)
      {
        try
        {
          expect(data).to.be.a('string');
          expect(err).to.be.a('number');
          expect(data).to.equal('Unauthorized');
          expect(err).to.equal(401);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('alert should not be found (testing against an instance called ' + hostName + ' with an alert_id that is not available)', function (done)
    {
      var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
      graze.getAlertDetails(100000, function (err, data)
      {
        console.log('Data returned: err:' + err + ' data:' + util.inspect(data));
        try
        {
          expect(data).to.be.an('object');
          expect(data.description).to.be.a('string');
          expect(err).to.be.a('number');
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.getAlertIds', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var filter = '{"op":6,"column":"severity","type":"LEAF","value":[3,4,5]}';
    var limit = 10;

    it('should get a list of alerts for filter (' + filter + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getAlertIds(filter, limit, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data).to.contain.all.keys(['total_alerts', 'alert_ids']);
          expect(data.total_alerts).to.be.a('number');
          expect(data.alert_ids).to.be.an('array');
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.getMaintenanceWindows', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var start = 0;
    var limit = 10;

    it('should get a list of maintenance windows from window (' + start + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getMaintenanceWindows(start, limit, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data.windows).to.be.an('array');
          expect(data.windows[0].id).to.be.a('number');
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.getSituationAlertIds', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var sitnId = 2;

    it('should get a list of unique alerts for situation (' + sitnId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getSituationAlertIds(sitnId, true, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data).to.contain.all.keys(['total_alerts', 'alert_ids']);
          expect(data.total_alerts).to.be.a('number');
          expect(data.alert_ids).to.be.an('array');
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });

    it('should get a list of all alerts for situation (' + sitnId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getSituationAlertIds(sitnId, false, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data).to.contain.all.keys(['total_alerts', 'alert_ids']);
          expect(data.total_alerts).to.be.a('number');
          expect(data.alert_ids).to.be.an('array');
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.getSituationDescription', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var sitnId = 4;

    it('should get a description for a situation (' + sitnId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getSituationDescription(sitnId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data).to.be.an('object');
          expect(data).to.contain.all.keys(['sitn_id', 'description']);
          expect(data.description).to.be.a('string');
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return an error (testing against an instance called ' + hostName + ')', function (done)
    {
      var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
      graze.getSituationDescription('', function (err, data)
      {
        try
        {
          expect(err).to.equal(400);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.getSituationDetails', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var sitnId = 4;

    it('should get details for a situation (' + sitnId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getSituationDetails(sitnId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data).to.be.an('object');
          expect(data).to.contain.all.keys(['category', 'created_at', 'custom_info', 'description',
            'internal_priority', 'first_event_time', 'last_event_time', 'last_state_change',
            'moderator_id', 'sit_id', 'status', 'story_id', 'superseded_by', 'total_alerts', 'total_unique_alerts']);
          expect(data.category).to.be.a('string');
          expect(data.created_at).to.be.a('number');
          expect(data.internal_priority).to.be.a('number');
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
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return an error no situation id passed (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getSituationDetails('', function (err, data)
      {
        try
        {
          expect(err).to.equal(400);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.getSituationHosts', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var sitnId = 4;

    it('should get a list of hosts for all alerts in a situation (' + sitnId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getSituationHosts(sitnId, false, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data).to.contain.all.keys(['hosts']);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should get a list of hosts for unique alerts in a situation (' + sitnId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getSituationHosts(sitnId, true, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data).to.contain.all.keys(['hosts']);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.getSituationIds', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var filter = '{"op":6,"column":"internal_priority","type":"LEAF","value":[3,4,5]}';
    var limit = 5;

    it('should get a list of situations for filter (' + filter + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getSituationIds(filter, limit, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data).to.contain.all.keys(['total_situations', 'sit_ids']);
          expect(data.total_situations).to.be.a('number');
          expect(data.sit_ids).to.be.an('array');
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.getSituationProcesses', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var sitnId = 2;

    it('should return the list of processes in situation (' + sitnId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getSituationProcesses(sitnId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data.processes).to.exist;
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.getSituationServices', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var sitnId = 2;

    it('should return the list of services in situation (' + sitnId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getSituationServices(sitnId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data.services).to.exist;
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.getSystemStatus', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});

    it('should return the system status (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getSystemStatus(function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data).to.be.an('object');
          expect(data.processes).to.be.an('array');
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.getSystemSummary', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});

    it('should the system summary (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getSystemSummary(function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data).to.be.an('object');
          expect(data.system_summary).to.contain.all.keys(["avg_alerts_per_sitn",
            "avg_events_per_sitn",
            "open_sigs_unassigned",
            "open_sitns",
            "open_sitns_down",
            "open_sitns_up",
            "timestamp",
            "total_events"]);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.getTeamSituationIds', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var teamName = 'Cloud DevOps';

    it('should get the situations for a team (' + teamName + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getTeamSituationIds(teamName, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data).to.contain.all.keys(['total_situations', 'sit_ids']);
          expect(data.total_situations).to.be.a('number');
          expect(data.sit_ids).to.be.an('array');
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should produce an error for a dummy team name (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getTeamSituationIds('DUMMY', function (err, data)
      {
        try
        {
          expect(err).to.equal(400);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.getThreadEntries', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var sitnId = 2;
    var threadName = 'Support';

    it('should get thread (' + threadName + ') entries from situation (' + sitnId + ') use defualt start and limit ' +
      '(testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getThreadEntries(sitnId, threadName, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data).to.be.an('object');
          expect(data.entries).to.be.an('array');
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.getUserInfo', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var userId = 2;

    it('get the name of a user from the id (' + userId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getUserInfo(userId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.getUserRoles', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var userId = 2;

    it('get the roles for a user (' + userId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getUserRoles(userId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.getUserTeams', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var userId = 2;

    it('get the teams for a user (' + userId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getUserTeams(userId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.mergeSituations', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var sit1 = 2;
    var sit2 = 3;
    var situations = [sit1, sit2];

    it('should merge 2 situations (' + sit1 + ' and ' + sit2 + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      // Merge takes some time!
      this.timeout(5000);

      graze.mergeSituations(situations, false, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data).to.be.an('object');
          expect(data.sit_id).to.be.a('number');

          console.log('Adding situation ' + data.sit_id + ' to list.');
          newSits.push(data.sit_id);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });

  });

  describe('graze.removeAlertFromSituation', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var sitId = 2;
    var alertId = 10;

    it('should remove an alert (' + alertId + ') from a situation (' + sitId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      console.log('newSit ' + newSits);
      graze.removeAlertFromSituation(alertId, sitId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.resolveSituation', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var sitId = newSits.pop() || 6;

    it('should resolve a situation (' + sitId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.resolveSituation(sitId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.setAlertAcknowledgeState', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var alertId = 20;
    var acknowledged = 1;

    it('should set an alert (' + alertId + ') to acknowledged state (' + acknowledged + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.setAlertAcknowledgeState(alertId, acknowledged, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should return an alert (' + alertId + ') that has acknowledged state (' + acknowledged + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getAlertDetails(alertId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.setAlertSeverity', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var alertId = 4;
    var severity = 5;

    it('should set an alert (' + alertId + ') severity to (' + severity + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.setAlertSeverity(alertId, severity, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.setSituationAcknowledgeState', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var sitnId = 3;
    var acknowedged = 0;
    var expState = 5;

    it('should set the acknowedged state to (' + acknowedged + ') for a situation (' + sitnId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.setSituationAcknowledgeState(sitnId, acknowedged, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
    it('should get acknowedged state for a situation (' + sitnId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.getSituationDetails(sitnId, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          expect(data.status).to.equal(expState);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  /* Deprecated in V6
   describe('graze.setSituationExternalSeverity', function () {
   var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
   var sitnId = 2;
   var severity = 5;

   it('should set the external severity (' + severity + ') for situation (' + sitnId + ') (testing against an instance called ' + hostName + ')', function (done) {
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
   });*/

  describe('graze.setSituationProcesses', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var sitnId = 2;
    var process = 'myNewProcess';
    var primaryProcess = 'myNewProcess';

    it('should add process (' + process + ') to situation (' + sitnId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.setSituationProcesses(sitnId, process, primaryProcess, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.setSituationServices', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: auth});
    var sitnId = 2;
    var service = 'myNewService';
    var primaryService = 'myNewService';

    it('should add service (' + service + ') to situation (' + sitnId + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.setSituationServices(sitnId, service, primaryService, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
          done(e);
        }
      });
    });
  });

  describe('graze.updateTeam', function ()
  {
    var graze = require('../lib/moog-graze.js')({hostname: hostName, port: hostPort, auth: 'graze:graze'});
    var myTeamObj = new graze.teamObj;

    myTeamObj.teamId = 6;
    myTeamObj.name = 'myUpdatedtestteam' + Math.floor((Math.random() * 100) + 1);
    myTeamObj.alertFilter = '';
    myTeamObj.active = '';
    myTeamObj.services = '';
    myTeamObj.sigFilter = '';
    myTeamObj.landingPage = '';
    myTeamObj.description = 'My Updated Test Team';
    myTeamObj.users = '';

    it('should update a team (' + JSON.stringify(myTeamObj) + ') (testing against an instance called ' + hostName + ')', function (done)
    {
      graze.updateTeam(myTeamObj, function (err, data)
      {
        try
        {
          expect(err).to.equal(200);
          done();
        }
        catch (e)
        {
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
