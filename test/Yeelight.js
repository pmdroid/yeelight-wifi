/* eslint-disable no-unused-expressions */
import net from 'net';
import Joi from 'joi';
import sinon from 'sinon';
import { expect } from 'chai';

import Yeelight from '../src/Yeelight';

const yeelightData = {
  LOCATION: 'yeelight://10.0.0.33:55443',
  ID: '0x0000000000000000',
  SUPPORT: 'get_prop set_default set_power toggle set_bright start_cf stop_cf set_scene cron_add cron_get cron_del set_ct_abx set_rgb set_hsv set_adjust set_music set_name', //eslint-disable-line
  NAME: 'Living Room',
  MODEL: 'color',
};

describe('Yeelight', () => {
  let yeelight;
  let socketWriteStub;
  let socketConnectStub;

  beforeEach(() => {
    socketConnectStub = sinon.stub(net.Socket.prototype, 'connect').callsFake((port, hostname, cb) => {
      cb();
    });

    yeelight = new Yeelight(yeelightData);
    yeelight.removeAllListeners('response');
    yeelight.removeAllListeners('error');

    yeelight.socket = new net.Socket({});
    socketWriteStub = sinon.stub(yeelight.socket, 'write').callsFake(function write(data, cb) {
      const args = socketWriteStub.args;
      if (args.length > 0) {
        this.emit('data', socketWriteStub.args[socketWriteStub.callCount - 1][0]);
      }
      cb();
    });
  });

  afterEach(() => {
    if (socketWriteStub) {
      socketWriteStub.restore();
    }
    if (socketConnectStub) {
      socketConnectStub.restore();
    }
  });

  describe('Yeelight', () => {
    it('creating a new instance without required params should result into an error', () => {
      try {
        new Yeelight(); //eslint-disable-line
      } catch (e) {
        expect(e.message).to.be.equal('options are needed');
      }
    });

    it('creating a new instance wrong params should result into an error', () => {
      const data = {
        LOCATION: 'http://localhost',
      };
      try {
        new Yeelight(data); //eslint-disable-line
      } catch (e) {
        expect(e.message).to.be.equal('http: is not supported');
      }
    });

    describe('#formatResponse', () => {
      it('with error', (done) => {
        yeelight.once('response', () => {
          done(new Error('should not return a response'));
        });

        yeelight.once('error', (id, error) => {
          expect(id).to.not.be.undefined;
          expect(error.message).to.be.equal('unsupported method');
          done();
        });
        yeelight.formatResponse('{"id":2, "error":{"code":-1, "message":"unsupported method"}}');
      });

      it('without error', (done) => {
        yeelight.once('response', (id, result) => {
          expect(id).to.not.be.undefined;
          expect(result).to.not.be.undefined;
          done();
        });

        yeelight.once('error', (id, error) => {
          done(error);
        });
        yeelight.formatResponse('{"id":1, "result":["ok"]}');
      });

      it('without id', (done) => {
        yeelight.once('notifcation', (json) => {
          expect(json).to.not.be.undefined;
          done();
        });

        yeelight.once('error', (id, error) => {
          done(error);
        });
        yeelight.formatResponse('{"method":"props","params":{"power":"on", "bright": "10"}}');
      });
    });
  });

  describe('#sendRequest', () => {
    it('send request with valid schema', (done) => {
      const schema = Joi.array().items(
        Joi.number().min(0).max(100).required(),
        Joi.string().allow('sudden', 'smooth').required(),
        Joi.number().required(),
      );
      yeelight.sendRequest('unsupported', ['10', 'smooth', '1000'], schema)
      .catch((error) => {
        expect(error.message).to.be.equal('unsupported method: unsupported');
        done();
      });
    });

    it('send request with valid schema', (done) => {
      const schema = Joi.array().items(
        Joi.number().min(0).max(100).required(),
        Joi.string().allow('sudden', 'smooth').required(),
        Joi.number().required(),
      );
      yeelight.sendRequest('set_bright', ['10', 'smooth', '1000'], schema)
        .then(done)
        .catch(done);
    });

    it('send request with invalid schema', (done) => {
      const schema = Joi.array().items(
        Joi.number().min(0).max(100).required(),
        Joi.string().allow('sudden', 'smooth').required(),
        Joi.number().required(),
      );
      yeelight.sendRequest('set_bright', [null, 'smooth', '1000'], schema)
        .catch((error) => {
          expect(error.name).to.be.equal('ValidationError');
          done();
        });
    });
  });

  describe('#sendRequest', () => {
    beforeEach(() => {
      yeelight.socket = new net.Socket({});
      socketWriteStub = sinon.stub(yeelight.socket, 'write').callsFake((data, cb) => {
        cb(new Error('Socket is closed'));
      });
    });

    afterEach(() => {
      if (socketWriteStub) {
        socketWriteStub.restore();
      }
    });

    it('send request with failed write', (done) => {
      const schema = Joi.array().items(
        Joi.number().min(0).max(100).required(),
        Joi.string().allow('sudden', 'smooth').required(),
        Joi.number().required(),
      );
      yeelight.sendRequest('set_bright', ['10', 'smooth', '1000'], schema)
        .catch((error) => {
          expect(error.message).to.be.equal('Socket is closed');
          done();
        });
    });
  });

  describe('api exists', () => {
    it('#getId should be exposed', () => {
      expect(yeelight.getId).to.not.be.undefined;
    });

    it('#getName should be exposed', () => {
      expect(yeelight.getId).to.not.be.undefined;
    });

    it('#setName should be exposed', () => {
      expect(yeelight.setName).to.not.be.undefined;
    });

    it('#getModel should be exposed', () => {
      expect(yeelight.getModel).to.not.be.undefined;
    });

    it('#getValues should be exposed', () => {
      expect(yeelight.getValues).to.not.be.undefined;
    });

    it('#toggle should be exposed', () => {
      expect(yeelight.toggle).to.not.be.undefined;
    });

    it('#setDefaultState should be exposed', () => {
      expect(yeelight.setDefaultState).to.not.be.undefined;
    });

    it('#setColorTemperature should be exposed', () => {
      expect(yeelight.setColorTemperature).to.not.be.undefined;
    });

    it('#setBrightness should be exposed', () => {
      expect(yeelight.setBrightness).to.not.be.undefined;
    });

    it('#turnOn should be exposed', () => {
      expect(yeelight.turnOn).to.not.be.undefined;
    });

    it('#turnOff should be exposed', () => {
      expect(yeelight.turnOff).to.not.be.undefined;
    });

    it('#setScene should be exposed', () => {
      expect(yeelight.setScene).to.not.be.undefined;
    });

    it('#setRGB should be exposed', () => {
      expect(yeelight.setRGB).to.not.be.undefined;
    });

    it('#setHSV should be exposed', () => {
      expect(yeelight.setHSV).to.not.be.undefined;
    });

    it('#startColorFlow should be exposed', () => {
      expect(yeelight.startColorFlow).to.not.be.undefined;
    });

    it('#stopColorFlow should be exposed', () => {
      expect(yeelight.stopColorFlow).to.not.be.undefined;
    });

    it('#setScene should be exposed', () => {
      expect(yeelight.setScene).to.not.be.undefined;
    });

    it('#addCron should be exposed', () => {
      expect(yeelight.addCron).to.not.be.undefined;
    });

    it('#getCron should be exposed', () => {
      expect(yeelight.getCron).to.not.be.undefined;
    });

    it('#deleteCron should be exposed', () => {
      expect(yeelight.deleteCron).to.not.be.undefined;
    });

    it('#setAdjust should be exposed', () => {
      expect(yeelight.setAdjust).to.not.be.undefined;
    });

    it('#setMusicMode should be exposed', () => {
      expect(yeelight.setMusicMode).to.not.be.undefined;
    });

    it('#startColorFlow should be exposed', () => {
      expect(yeelight.startColorFlow).to.not.be.undefined;
    });

    it('#stopColorFlow should be exposed', () => {
      expect(yeelight.stopColorFlow).to.not.be.undefined;
    });
  });

  describe('methods', () => {
    it('should have the provided id', () => {
      expect(yeelight.getId()).to.equal(yeelightData.ID);
    });

    it('should have the provided name', () => {
      expect(yeelight.getName()).to.equal(yeelightData.NAME);
    });

    it('should have the provided model', () => {
      expect(yeelight.getModel()).to.equal(yeelightData.MODEL);
    });

    it('should return values from the lightbulb', (done) => {
      yeelight.getValues('power', 'bright')
        .then(done)
        .catch(done);
    });

    it('should set the name of the lightbulb', (done) => {
      yeelight.setName('Name')
        .then(done)
        .catch(done);
    });

    it('should toggle the lightbulb', (done) => {
      yeelight.toggle()
        .then(done)
        .catch(done);
    });

    it('should set the default lightbulb state', (done) => {
      yeelight.setDefaultState()
        .then(done)
        .catch(done);
    });

    it('should turn off the lightbulb', (done) => {
      yeelight.turnOff()
        .then(done)
        .catch(done);
    });

    it('should turn on the lightbulb', (done) => {
      yeelight.turnOn()
        .then(done)
        .catch(done);
    });

    it('should the color temperature the lightbulb', (done) => {
      yeelight.setColorTemperature(1800)
        .then(done)
        .catch(done);
    });

    it('should the brightness the lightbulb', (done) => {
      yeelight.setBrightness(50)
        .then(done)
        .catch(done);
    });

    it('should the a scene on the lightbulb', (done) => {
      yeelight.setScene(['color', 65280, 70])
        .then(done)
        .catch(done);
    });

    it('should set the rgb color of the lightbulb', (done) => {
      yeelight.setRGB('#ffffff')
        .then(done)
        .catch(done);
    });

    it('should set the hsv color of the lightbulb', (done) => {
      yeelight.setHSV(100, 10)
        .then(done)
        .catch(done);
    });

    it('should a new cron to the lightbulb', (done) => {
      yeelight.addCron(0, 15)
        .then(done)
        .catch(done);
    });

    it('should get a cron by index from the lightbulb', (done) => {
      yeelight.getCron(0)
        .then(done)
        .catch(done);
    });

    it('should remove a cron by index from the lightbulb', (done) => {
      yeelight.deleteCron(0)
        .then(done)
        .catch(done);
    });

    it('should adjust the lightbulb', (done) => {
      yeelight.setAdjust('circle', 'bright')
        .then(done)
        .catch(done);
    });

    it('should turn on the music mode of the lightbulb', (done) => {
      yeelight.setMusicMode(1, '10.0.0.28', 5000)
        .then(done)
        .catch(done);
    });

    it('should turn on the music mode of the lightbulb', (done) => {
      yeelight.setMusicMode(0, '10.0.0.28', 5000)
        .then(done)
        .catch(done);
    });

    it('should the colorflow mode of the lightbulb', (done) => {
      yeelight.startColorFlow(0, 0, '1000, 2, 2700, 100, 500, 1, 255, 10, 500, 2, 5000, 1')
        .then(done)
        .catch(done);
    });

    it('should turn of the colorflow mode of the lightbulb', (done) => {
      yeelight.stopColorFlow()
        .then(done)
        .catch(done);
    });
  });

  describe('events', () => {
    it('should catch the error event', () => {
      const spy = sinon.spy();
      const emitter = new Yeelight(yeelightData);

      emitter.on('error', spy);
      emitter.emit('error');

      expect(spy.called).to.be.equal(true);
    });

    it('should catch the disconnected event', () => {
      const spy = sinon.spy();
      const emitter = new Yeelight(yeelightData);

      emitter.on('disconnected', spy);
      emitter.emit('disconnected');

      expect(spy.called).to.be.equal(true);
    });

    it('should catch the connected event', () => {
      const spy = sinon.spy();
      const emitter = new Yeelight(yeelightData);

      emitter.on('connected', spy);
      emitter.emit('connected');

      expect(spy.called).to.be.equal(true);
    });
  });
});