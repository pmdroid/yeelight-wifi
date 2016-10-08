'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _nodeSsdp = require('node-ssdp');

var _Yeelight = require('./Yeelight');

var _Yeelight2 = _interopRequireDefault(_Yeelight);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Create a new instance of the YeelightSearch class
 * and start searching for new Yeelights
 * once a Yeelight has been found it will create an Yeelight instance
 * and emits the 'found' event light the Yeelight instance as payload
 *
 * @extends EventEmitter
 */
var YeelightSearch = function (_EventEmitter) {
  _inherits(YeelightSearch, _EventEmitter);

  function YeelightSearch() {
    _classCallCheck(this, YeelightSearch);

    var _this = _possibleConstructorReturn(this, (YeelightSearch.__proto__ || Object.getPrototypeOf(YeelightSearch)).call(this));

    _this.yeelights = [];
    _this.client = new _nodeSsdp.Client({ ssdpPort: 1982 });

    _this.client.on('response', function (data) {
      var yeelight = _this.yeelights.find(function (item) {
        return item.getId() === data.ID;
      });
      if (!yeelight) {
        yeelight = new _Yeelight2.default(data);
        _this.yeelights.push(yeelight);
        _this.emit('found', yeelight);
      }
    });

    _this.client.search('wifi_bulb');
    return _this;
  }

  /**
   * returns a list of all found Yeelights
   * @returns {array.<Yeelight>} array with yeelight instances
   */


  _createClass(YeelightSearch, [{
    key: 'getYeelights',
    value: function getYeelights() {
      return this.yeelights;
    }

    /**
     * returns one Yeelight found by id
     * @param {string} id Yeelight Id
     * @returns {Yeelight} Yeelight instance
     */

  }, {
    key: 'getYeelightById',
    value: function getYeelightById(id) {
      return this.yeelights.find(function (item) {
        return item.getId() === id;
      });
    }
  }]);

  return YeelightSearch;
}(_events2.default);

module.exports = YeelightSearch;