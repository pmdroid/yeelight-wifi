'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _net = require('net');

var _net2 = _interopRequireDefault(_net);

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var LightBulb = function (_EventEmitter) {
  _inherits(LightBulb, _EventEmitter);

  function LightBulb(data) {
    _classCallCheck(this, LightBulb);

    var _this = _possibleConstructorReturn(this, (LightBulb.__proto__ || Object.getPrototypeOf(LightBulb)).call(this));

    if (!data || (typeof data === 'undefined' ? 'undefined' : _typeof(data)) !== 'object') {
      throw new Error('options are needed');
    }

    var parsedUri = _url2.default.parse(data.LOCATION);
    if (parsedUri.protocol !== 'yeelight:') {
      throw new Error(parsedUri.protocol + ' is not supported');
    }

    _this.id = data.ID;
    _this.name = data.NAME;
    _this.model = data.MODEL;
    _this.port = parsedUri.port;
    _this.hostname = parsedUri.hostname;
    _this.supports = data.SUPPORT.split(' ');

    _this.reqCount = 1;
    _this.log = (0, _debug2.default)('Yeelight-' + _this.name);

    _this.socket = new _net2.default.Socket();

    _this.socket.on('error', function (error) {
      _this.log('error from ' + _this.name + ' ' + _this.hostname + ':' + _this.port + ' Error: ' + error.message);
      _this.emit('error', error);
    });

    _this.socket.on('close', function () {
      _this.log('disconnected from ' + _this.name + ' ' + _this.hostname + ':' + _this.port);
      _this.emit('disconnected');
    });

    _this.socket.on('data', _this.formatResponse.bind(_this));

    _this.socket.connect(_this.port, _this.hostname, function () {
      _this.log('connected to ' + _this.name + ' ' + _this.hostname + ':' + _this.port);
      _this.emit('connected');
    });
    return _this;
  }

  _createClass(LightBulb, [{
    key: 'sendRequest',
    value: function sendRequest(method, params, schema) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        if (!schema) {
          schema = _joi2.default.any(); //eslint-disable-line
        }

        _joi2.default.validate(params, schema, function (err, value) {
          if (err) {
            reject(err);
            return;
          }

          var req = JSON.stringify({
            method: method,
            params: value,
            id: _this2.reqCount
          });
          _this2.log('sending req: ' + req);

          _this2.socket.write(req + '\r\n', function (err) {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          });
          _this2.reqCount += 1;
        });
      });
    }
  }, {
    key: 'formatResponse',
    value: function formatResponse(resp) {
      var json = JSON.parse(resp);
      var id = json.id;
      var result = json.result;

      if (!id) {
        this.log('got response without id: ' + resp.toString().replace(/\r\n/, ''));
        this.emit('notifcation', json);
        return;
      }

      this.log('got response: ' + resp.toString().replace(/\r\n/, ''));

      if (json.error) {
        var error = new Error(json.error.message);
        error.code = json.error.code;
        this.emit('error', id, error);
      } else {
        this.emit('response', id, result);
      }
    }
  }, {
    key: 'getId',
    value: function getId() {
      return this.id;
    }
  }, {
    key: 'getModel',
    value: function getModel() {
      return this.model;
    }
  }, {
    key: 'getName',
    value: function getName() {
      return this.name;
    }
  }, {
    key: 'setName',
    value: function setName(name) {
      var schema = _joi2.default.array().items(_joi2.default.string().required());
      return this.sendRequest('set_name', [name], schema);
    }
  }, {
    key: 'getValues',
    value: function getValues() {
      for (var _len = arguments.length, props = Array(_len), _key = 0; _key < _len; _key++) {
        props[_key] = arguments[_key];
      }

      return this.sendRequest('get_prop', props);
    }
  }, {
    key: 'toggle',
    value: function toggle() {
      return this.sendRequest('toggle', []);
    }
  }, {
    key: 'setDefaultState',
    value: function setDefaultState() {
      return this.sendRequest('set_default', []);
    }
  }, {
    key: 'setColorTemperature',
    value: function setColorTemperature(value) {
      var effect = arguments.length <= 1 || arguments[1] === undefined ? 'smooth' : arguments[1];
      var time = arguments.length <= 2 || arguments[2] === undefined ? 1000 : arguments[2];

      var schema = _joi2.default.array().items(_joi2.default.number().min(1700).max(6500).required(), _joi2.default.string().allow('sudden', 'smooth').required(), _joi2.default.number().required());
      return this.sendRequest('set_ct_abx', [value, effect, time], schema);
    }
  }, {
    key: 'setBrightness',
    value: function setBrightness(brightness) {
      var effect = arguments.length <= 1 || arguments[1] === undefined ? 'smooth' : arguments[1];
      var time = arguments.length <= 2 || arguments[2] === undefined ? 1000 : arguments[2];

      var schema = _joi2.default.array().items(_joi2.default.number().min(0).max(100).required(), _joi2.default.string().allow('sudden', 'smooth').required(), _joi2.default.number().required());
      return this.sendRequest('set_bright', [brightness, effect, time], schema);
    }
  }, {
    key: 'turnOn',
    value: function turnOn() {
      var effect = arguments.length <= 0 || arguments[0] === undefined ? 'smooth' : arguments[0];
      var time = arguments.length <= 1 || arguments[1] === undefined ? 1000 : arguments[1];

      var schema = _joi2.default.array().items(_joi2.default.any().required(), _joi2.default.string().allow('sudden', 'smooth').required(), _joi2.default.number().required());
      return this.sendRequest('set_power', ['on', effect, time], schema);
    }
  }, {
    key: 'turnOff',
    value: function turnOff() {
      var effect = arguments.length <= 0 || arguments[0] === undefined ? 'smooth' : arguments[0];
      var time = arguments.length <= 1 || arguments[1] === undefined ? 1000 : arguments[1];

      var schema = _joi2.default.array().items(_joi2.default.any().required(), _joi2.default.string().allow('sudden', 'smooth').required(), _joi2.default.number().required());
      return this.sendRequest('set_power', ['off', effect, time], schema);
    }
  }, {
    key: 'setScene',
    value: function setScene(params) {
      var schema = _joi2.default.array().items(_joi2.default.string().allow('color', 'hsv', 'ct', 'auto_delay_off').required(), _joi2.default.any().required(), _joi2.default.any().required(), _joi2.default.any());
      return this.sendRequest('set_scene', params, schema);
    }
  }, {
    key: 'setRGB',
    value: function setRGB(color) {
      var effect = arguments.length <= 1 || arguments[1] === undefined ? 'smooth' : arguments[1];
      var time = arguments.length <= 2 || arguments[2] === undefined ? 1000 : arguments[2];

      var colorDec = color.red() * 65536 + color.green() * 256 + color.blue();
      var schema = _joi2.default.array().items(_joi2.default.number().min(0).max(16777215).required(), _joi2.default.string().allow('sudden', 'smooth').required(), _joi2.default.number().required());
      return this.sendRequest('set_rgb', [colorDec, effect, time], schema);
    }
  }, {
    key: 'setHSV',
    value: function setHSV(color) {
      var effect = arguments.length <= 1 || arguments[1] === undefined ? 'smooth' : arguments[1];
      var time = arguments.length <= 2 || arguments[2] === undefined ? 100 : arguments[2];

      var schema = _joi2.default.array().items(_joi2.default.number().min(0).max(359).required(), _joi2.default.number().min(0).max(100).required(), _joi2.default.string().allow('sudden', 'smooth').required(), _joi2.default.number().required());
      return this.sendRequest('set_hsv', [color.hue(), color.saturation(), effect, time], schema);
    }
  }, {
    key: 'addCron',
    value: function addCron(type, value) {
      var schema = _joi2.default.array().items(_joi2.default.number().required(), _joi2.default.number().required());
      return this.sendRequest('cron_add', [type, value], schema);
    }
  }, {
    key: 'getCron',
    value: function getCron(index) {
      var schema = _joi2.default.array().items(_joi2.default.number().required());
      return this.sendRequest('cron_get', [index], schema);
    }
  }, {
    key: 'deleteCron',
    value: function deleteCron(index) {
      var schema = _joi2.default.array().items(_joi2.default.number().required());
      return this.sendRequest('cron_del', [index], schema);
    }
  }, {
    key: 'setAdjust',
    value: function setAdjust(action, prop) {
      var schema = _joi2.default.array().items(_joi2.default.string().allow('increase', 'decrease', 'circle').required(), _joi2.default.string().allow('bright', 'ct', 'color').required());
      return this.sendRequest('set_adjust', [action, prop], schema);
    }
  }, {
    key: 'setMusicMode',
    value: function setMusicMode(action, host, port) {
      var schema = _joi2.default.array().items(_joi2.default.number().allow(0, 1).required(), _joi2.default.string().required(), _joi2.default.number().min(1).max(65535).required());
      return this.sendRequest('set_music', [action, host, port], schema);
    }
  }, {
    key: 'startColorFlow',
    value: function startColorFlow(count, action, flowExpression) {
      var schema = _joi2.default.array().items(_joi2.default.number().required(), _joi2.default.number().allow(0, 1, 2).required(), _joi2.default.string().required());
      return this.sendRequest('start_cf', [action, action, flowExpression], schema);
    }
  }, {
    key: 'stopColorFlow',
    value: function stopColorFlow() {
      return this.sendRequest('stop_cf', []);
    }
  }]);

  return LightBulb;
}(_events2.default);

exports.default = LightBulb;