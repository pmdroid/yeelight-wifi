'use strict';

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _Color = require('Color');

var _Color2 = _interopRequireDefault(_Color);

var _chai = require('chai');

var _LightBulb = require('./LightBulb');

var _LightBulb2 = _interopRequireDefault(_LightBulb);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var lightBulbData = {
  LOCATION: 'yeelight://10.0.0.33:55443',
  ID: '0x0000000000000000',
  SUPPORT: 'get_prop set_default set_power toggle set_bright start_cf stop_cf set_scene cron_add cron_get cron_del set_ct_abx set_rgb set_hsv set_adjust set_music set_name', //eslint-disable-line
  NAME: 'Living Room',
  MODEL: 'color'
}; /* eslint-disable no-unused-expressions */


describe('LightBulb', function () {
  var lightBulb = void 0;
  var requestId = 1;
  var sendRequestStub = void 0;

  before(function (done) {
    lightBulb = new _LightBulb2.default(lightBulbData);
    sendRequestStub = _sinon2.default.stub(lightBulb, 'sendRequest', function (method, params, schema) {
      return new Promise(function (resolve, reject) {
        var json = { id: requestId, result: ['ok'] };
        if (method === 'get_prop') {
          json = { id: requestId, result: ['on', '100'] };
        } else if (method === 'cron_get') {
          json = { id: requestId, result: [{ type: 0, delay: 15, mix: 0 }] };
        }

        if (!schema) {
          schema = _joi2.default.any(); //eslint-disable-line
        }

        _joi2.default.validate(params, schema, function (err) {
          if (err) {
            reject(err);
            return;
          }

          lightBulb.formatResponse.apply(lightBulb, [JSON.stringify(json)]);
          lightBulb.formatResponse.apply(lightBulb, [JSON.stringify({
            method: 'props',
            params: { power: 'on', bright: '100' }
          })]);

          resolve();
          requestId += 1;
        });
      });
    });
    done();
  });

  after(function () {
    if (sendRequestStub) {
      sendRequestStub.restore();
    }
  });

  describe('LightBulb', function () {
    it('creating a new instance without required params should result into an error', function () {
      try {
        new _LightBulb2.default(); //eslint-disable-line
      } catch (e) {
        (0, _chai.expect)(e.message).to.be.equal('options are needed');
      }
    });

    it('creating a new instance wrong params should result into an error', function () {
      var data = {
        LOCATION: 'http://localhost'
      };
      try {
        new _LightBulb2.default(data); //eslint-disable-line
      } catch (e) {
        (0, _chai.expect)(e.message).to.be.equal('http: is not supported');
      }
    });
  });

  describe('api exists', function () {
    it('#getId should be exposed', function () {
      (0, _chai.expect)(lightBulb.getId).to.not.be.undefined;
    });

    it('#getName should be exposed', function () {
      (0, _chai.expect)(lightBulb.getId).to.not.be.undefined;
    });

    it('#setName should be exposed', function () {
      (0, _chai.expect)(lightBulb.setName).to.not.be.undefined;
    });

    it('#getModel should be exposed', function () {
      (0, _chai.expect)(lightBulb.getModel).to.not.be.undefined;
    });

    it('#getValues should be exposed', function () {
      (0, _chai.expect)(lightBulb.getValues).to.not.be.undefined;
    });

    it('#toggle should be exposed', function () {
      (0, _chai.expect)(lightBulb.toggle).to.not.be.undefined;
    });

    it('#setDefaultState should be exposed', function () {
      (0, _chai.expect)(lightBulb.setDefaultState).to.not.be.undefined;
    });

    it('#setColorTemperature should be exposed', function () {
      (0, _chai.expect)(lightBulb.setColorTemperature).to.not.be.undefined;
    });

    it('#setBrightness should be exposed', function () {
      (0, _chai.expect)(lightBulb.setBrightness).to.not.be.undefined;
    });

    it('#turnOn should be exposed', function () {
      (0, _chai.expect)(lightBulb.turnOn).to.not.be.undefined;
    });

    it('#turnOff should be exposed', function () {
      (0, _chai.expect)(lightBulb.turnOff).to.not.be.undefined;
    });

    it('#setScene should be exposed', function () {
      (0, _chai.expect)(lightBulb.setScene).to.not.be.undefined;
    });

    it('#setRGB should be exposed', function () {
      (0, _chai.expect)(lightBulb.setRGB).to.not.be.undefined;
    });

    it('#setHSV should be exposed', function () {
      (0, _chai.expect)(lightBulb.setHSV).to.not.be.undefined;
    });

    it('#startColorFlow should be exposed', function () {
      (0, _chai.expect)(lightBulb.startColorFlow).to.not.be.undefined;
    });

    it('#stopColorFlow should be exposed', function () {
      (0, _chai.expect)(lightBulb.stopColorFlow).to.not.be.undefined;
    });

    it('#setScene should be exposed', function () {
      (0, _chai.expect)(lightBulb.setScene).to.not.be.undefined;
    });

    it('#addCron should be exposed', function () {
      (0, _chai.expect)(lightBulb.addCron).to.not.be.undefined;
    });

    it('#getCron should be exposed', function () {
      (0, _chai.expect)(lightBulb.getCron).to.not.be.undefined;
    });

    it('#deleteCron should be exposed', function () {
      (0, _chai.expect)(lightBulb.deleteCron).to.not.be.undefined;
    });

    it('#setAdjust should be exposed', function () {
      (0, _chai.expect)(lightBulb.setAdjust).to.not.be.undefined;
    });

    it('#setMusicMode should be exposed', function () {
      (0, _chai.expect)(lightBulb.setMusicMode).to.not.be.undefined;
    });

    it('#startColorFlow should be exposed', function () {
      (0, _chai.expect)(lightBulb.startColorFlow).to.not.be.undefined;
    });

    it('#stopColorFlow should be exposed', function () {
      (0, _chai.expect)(lightBulb.stopColorFlow).to.not.be.undefined;
    });
  });

  describe('methods', function () {
    it('should have the provided id', function () {
      (0, _chai.expect)(lightBulb.getId()).to.equal(lightBulbData.ID);
    });

    it('should have the provided name', function () {
      (0, _chai.expect)(lightBulb.getName()).to.equal(lightBulbData.NAME);
    });

    it('should have the provided model', function () {
      (0, _chai.expect)(lightBulb.getModel()).to.equal(lightBulbData.MODEL);
    });

    it('should return values from the lightbulb', function (done) {
      lightBulb.getValues('power', 'bright').then(done).catch(done);
    });

    it('should set the name of the lightbulb', function (done) {
      lightBulb.setName('Name').then(done).catch(done);
    });

    it('should toggle the lightbulb', function (done) {
      lightBulb.toggle().then(done).catch(done);
    });

    it('should set the default lightbulb state', function (done) {
      lightBulb.setDefaultState().then(done).catch(done);
    });

    it('should turn off the lightbulb', function (done) {
      lightBulb.turnOff().then(done).catch(done);
    });

    it('should turn on the lightbulb', function (done) {
      lightBulb.turnOn().then(done).catch(done);
    });

    it('should the color temperature the lightbulb', function (done) {
      lightBulb.setColorTemperature(1800).then(done).catch(done);
    });

    it('should the brightness the lightbulb', function (done) {
      lightBulb.setBrightness(50).then(done).catch(done);
    });

    it('should the a scene on the lightbulb', function (done) {
      lightBulb.setScene(['color', 65280, 70]).then(done).catch(done);
    });

    it('should set the rgb color of the lightbulb', function (done) {
      var color = new _Color2.default();
      lightBulb.setRGB(color).then(done).catch(done);
    });

    it('should set the hsv color of the lightbulb', function (done) {
      var color = new _Color2.default();
      lightBulb.setHSV(color).then(done).catch(done);
    });

    it('should a new cron to the lightbulb', function (done) {
      lightBulb.addCron(0, 15).then(done).catch(done);
    });

    it('should get a cron by index from the lightbulb', function (done) {
      lightBulb.getCron(0).then(done).catch(done);
    });

    it('should remove a cron by index from the lightbulb', function (done) {
      lightBulb.deleteCron(0).then(done).catch(done);
    });

    it('should adjust the lightbulb', function (done) {
      lightBulb.setAdjust('circle', 'bright').then(done).catch(done);
    });

    it('should turn on the music mode of the lightbulb', function (done) {
      lightBulb.setMusicMode(1, '10.0.0.28', 5000).then(done).catch(done);
    });

    it('should turn on the music mode of the lightbulb', function (done) {
      lightBulb.setMusicMode(0, '10.0.0.28', 5000).then(done).catch(done);
    });

    it('should the colorflow mode of the lightbulb', function (done) {
      lightBulb.startColorFlow(0, 0, '1000, 2, 2700, 100, 500, 1, 255, 10, 500, 2, 5000, 1').then(done).catch(done);
    });

    it('should turn of the colorflow mode of the lightbulb', function (done) {
      lightBulb.stopColorFlow().then(done).catch(done);
    });
  });

  describe('notifcation', function () {
    it('should trigger a notifcation', function (done) {
      lightBulb.once('notifcation', function (notifcation) {
        (0, _chai.expect)(notifcation).to.not.be.undefined;
        done();
      });

      lightBulb.turnOff().then(function () {
        return lightBulb.turnOn();
      }).catch(done);
    });
  });
});