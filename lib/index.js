'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _nodeSsdp = require('node-ssdp');

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _LightBulb = require('./LightBulb');

var _LightBulb2 = _interopRequireDefault(_LightBulb);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Yeelight = function (_EventEmitter) {
  _inherits(Yeelight, _EventEmitter);

  function Yeelight() {
    _classCallCheck(this, Yeelight);

    var _this = _possibleConstructorReturn(this, (Yeelight.__proto__ || Object.getPrototypeOf(Yeelight)).call(this));

    _this.lightBulbs = [];
    _this.client = new _nodeSsdp.Client({ ssdpPort: 1982 });

    _this.client.on('response', function (data) {
      var lightBulb = _this.lightBulbs.find(function (item) {
        return item.getId() === data.ID;
      });
      if (!lightBulb) {
        lightBulb = new _LightBulb2.default(data);
        _this.lightBulbs.push(lightBulb);
        _this.emit('found', lightBulb);
      }
    });

    _this.client.search('wifi_bulb');
    return _this;
  }

  _createClass(Yeelight, [{
    key: 'getLightBulbs',
    value: function getLightBulbs() {
      return this.lightBulbs;
    }
  }, {
    key: 'getLightBulbById',
    value: function getLightBulbById(id) {
      return this.lightBulbs.find(function (item) {
        return item.getId() === id;
      });
    }
  }]);

  return Yeelight;
}(_events2.default);

module.exports = Yeelight;