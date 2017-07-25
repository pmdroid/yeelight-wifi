import net from 'net';
import Joi from 'joi';
import url from 'url';
import debug from 'debug';
import EventEmitter from 'events';

import { hexToRgb } from './utils';

/**
 * Class Yeelight provides all functionality
 * @param {object} yeelightData
 * @example
 * {
 *  LOCATION: 'yeelight://10.0.0.33:55443',
 *  ID: '0x0000000000000000',
 *  SUPPORT: 'get_prop set_default set_power toggle set_bright start_cf stop_cf set_scene cron_add cron_get cron_del set_ct_abx set_rgb set_hsv set_adjust set_music set_name',
 *  NAME: 'Living Room',
 *  MODEL: 'color',
 * }
 * @extends EventEmitter
 */
export default class Yeelight extends EventEmitter {
  constructor(data) {
    super();

    if (typeof data === 'undefined' || typeof data !== 'object') {
      throw new Error('options are needed');
    }

    const parsedUri = url.parse(data.LOCATION);
    if (parsedUri.protocol !== 'yeelight:') {
      throw new Error(`${parsedUri.protocol} is not supported`);
    }

    this.id = data.ID;
    this.name = data.NAME;
    this.model = data.MODEL;
    this.port = parsedUri.port;
    this.hostname = parsedUri.hostname;
    this.supports = data.SUPPORT.split(' ');

    this.reqCount = 1;
    this.log = debug(`Yeelight-${this.name}`);

    this.socket = new net.Socket();

    this.socket.on('data', this.formatResponse.bind(this));

    this.socket.connect(this.port, this.hostname, () => {
      this.log(`connected to ${this.name} ${this.hostname}:${this.port}`);
      this.emit('connected');
    });
  }

  /**
   * sendRequest validates the given params and send the request to the Yeelight
   * @private
   *
   * @param {object} method method to be called 'set_power'
   * @param {object} params array with params ['on', 'smooth', '1000']
   * @param {object} schema schema for validation
   */
  sendRequest(method, params, schema) {
    return new Promise((resolve, reject) => {
      if (!schema) {
        schema = Joi.any(); //eslint-disable-line
      }

      if (!this.supports.includes(method)) {
        reject(new Error(`unsupported method: ${method}`));
        return;
      }

      Joi.validate(params, schema, (err, value) => {
        if (err) {
          reject(err);
          return;
        }

        const req = JSON.stringify({
          method,
          params: value,
          id: this.reqCount,
        });
        this.log(`sending req: ${req}`);

        this.socket.write(`${req}\r\n`, (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
        this.reqCount += 1;
      });
    });
  }

  /**
   * formats the incomming repsonses from the Yeelight
   * the result will trigger an 'response' event with id and result as payload
   * @private
   *
   * @param {string} resp response comming from the socket as a json string
   */
  formatResponse(resp) {
    const json = JSON.parse(resp);
    const id = json.id;
    const result = json.result;

    if (!id) {
      this.log(`got response without id: ${resp.toString().replace(/\r\n/, '')}`);
      this.emit('notifcation', json);
      return;
    }

    this.log(`got response: ${resp.toString().replace(/\r\n/, '')}`);

    if (json && json.error) {
      const error = new Error(json.error.message);
      error.code = json.error.code;
      this.emit('error', id, error);
    } else {
      this.emit('response', id, result);
    }
  }

  /**
   * returns The ID provided by the Yeelight
   * @returns {string} uuid given by the yeelightData
   */
  getId() {
    return this.id;
  }

  /**
   * returns The MODEL provided by the Yeelight
   * @returns {string} model string 'color' or 'mono'
   */
  getModel() {
    return this.model;
  }

  /**
   * returns The NAME provided by the Yeelight
   * @returns {string} Yeelight name
   */
  getName() {
    return this.name;
  }

  /**
   * Sets the name on the Yeelight
   * @param {string} name
   * @returns {Promise} will be invoked after successfull or failed send
   */
  setName(name) {
    const schema = Joi.array().items(
      Joi.string().required(),
    );
    return this.sendRequest('set_name', [name], schema);
  }

  /**
   * This method is used to retrieve current property of smart LED.
   * @param {array} props The parameter is a list of property names and the response contains
   * a list of corresponding property values. If the requested property name is not recognized by
   * smart LED, then a empty string value ("") will be returned.
   *
   * @example
   * getValues('power', 'bright');
   *
   * @returns {Promise} will be invoked after successfull or failed send
   */
  getValues(...props) {
    return this.sendRequest('get_prop', props);
  }

  /**
   * This method is used to toggle the smart LED.
   * @returns {Promise} will be invoked after successfull or failed send
   */
  toggle() {
    return this.sendRequest('toggle', []);
  }

  /**
   * This method is used to save current state of smart LED in persistent memory.
   * So if user powers off and then powers on the smart LED again (hard power reset),
   * the smart LED will show last saved state.
   * @returns {Promise} will be invoked after successfull or failed send
   */
  setDefaultState() {
    return this.sendRequest('set_default', []);
  }

  /**
   * Will change the color temperature of the Yeelight
   * @param {string} temperature is the target color temperature. The type is integer and
   * range is 1700 ~ 6500 (k).
   *
   * @param {string} [effect='smooth'] support two values: 'sudden' and 'smooth'. If effect is 'sudden',
   * then the color temperature will be changed directly to target value, under this case, the
   * third parameter 'duration' is ignored. If effect is 'smooth', then the color temperature will
   * be changed to target value in a gradual fashion, under this case, the total time of gradual
   * change is specified in third parameter "duration".
   *
   * @param {number} [time=1000] time specifies the total time of the gradual changing. The unit is
   * milliseconds. The minimum support duration is 30 milliseconds.
   *
   * @example
   * setColorTemperature(5000);
   * setColorTemperature(5000, 'sudden');
   * setColorTemperature(5000, 'smooth', 1000);
   *
   * @returns {Promise} will be invoked after successfull or failed send
   */
  setColorTemperature(temperature, effect = 'smooth', time = 1000) {
    const schema = Joi.array().items(
      Joi.number().min(1700).max(6500).required(),
      Joi.string().allow('sudden', 'smooth').required(),
      Joi.number().required(),
    );
    return this.sendRequest('set_ct_abx', [temperature, effect, time], schema);
  }

  /**
   * This method is used to change the brightness of a smart LED.
   * @param {string} brightness is the target brightness. The type is integer and ranges
   * from 1 to 100. The brightness is a percentage instead of a absolute value. 100 means
   * maximum brightness while 1 means the minimum brightness.
   *
   * @param {string} [effect='smooth']  Refer to 'setColorTemperature' method.
   * @param {number} [time=1000] Refer to 'setColorTemperature' method.
   *
   * @example
   * setBrightness(25);
   * setBrightness(25, 'sudden');
   * setBrightness(25, 'smooth', 1000);
   *
   * @returns {Promise} will be invoked after successfull or failed send
   */
  setBrightness(brightness, effect = 'smooth', time = 1000) {
    const schema = Joi.array().items(
      Joi.number().min(0).max(100).required(),
      Joi.string().allow('sudden', 'smooth').required(),
      Joi.number().required(),
    );
    return this.sendRequest('set_bright', [brightness, effect, time], schema);
  }

  /**
   * This method is used to switch on the smart LED (software managed on/off).
   * @param {string} [effect='smooth']  Refer to 'setColorTemperature' method.
   * @param {number} [time=1000] Refer to 'setColorTemperature' method.
   *
   * @example
   * turnOn();
   * turnOn('sudden');
   * turnOn('smooth', 1000);
   *
   * @returns {Promise} will be invoked after successfull or failed send
   */
  turnOn(effect = 'smooth', time = 1000) {
    const schema = Joi.array().items(
      Joi.any().required(),
      Joi.string().allow('sudden', 'smooth').required(),
      Joi.number().required(),
    );
    return this.sendRequest('set_power', ['on', effect, time], schema);
  }

  /**
   * This method is used to switch off the smart LED (software managed on/off).
   * @param {string} [effect='smooth']  Refer to 'setColorTemperature' method.
   * @param {number} [time=1000] Refer to 'setColorTemperature' method.
   *
   * @example
   * turnOff();
   * turnOff('sudden');
   * turnOff('smooth', 1000);
   *
   * @returns {Promise} will be invoked after successfull or failed send
   */
  turnOff(effect = 'smooth', time = 1000) {
    const schema = Joi.array().items(
      Joi.any().required(),
      Joi.string().allow('sudden', 'smooth').required(),
      Joi.number().required(),
    );
    return this.sendRequest('set_power', ['off', effect, time], schema);
  }

  /**
   * This method is used to set the smart LED directly to specified state. If +
   * the smart LED is off, then it will turn on the smart LED firstly and
   * then apply the specified command.
   * @param {array} params can be "color", "hsv", "ct", "cf", "auto_dealy_off".
   * <br>"color" means change the smart LED to specified color and brightness.
   * <br>"hsv" means change the smart LED to specified color and brightness"
   * <br>"ct" means change the smart LED to specified ct and brightness.
   * <br>"cf" means start a color flow in specified fashion.
   * <br>c"auto_delay_off" means turn on the smart LED to specified
   * brightness and start a sleep timer to turn off the light after the specified minutes.
 "val1", "val2", "val3" are class specific.
   *
   * @example
   * setScene(['color', 65280, 70]);
   * setScene(['hsv', 300, 70, 100]);
   * setScene(['ct', 5400, 100]);
   * setScene(['cf', 0, 0, '500,1,255,100,1000,1,16776960,70']);
   *
   * @returns {Promise} will be invoked after successfull or failed send
   */
  setScene(params) {
    const schema = Joi.array().items(
      Joi.string().allow('color', 'hsv', 'ct', 'auto_delay_off').required(),
      Joi.any().required(),
      Joi.any().required(),
      Joi.any(),
    );
    return this.sendRequest('set_scene', params, schema);
  }

  /**
   * This method is used to change the color of a smart LED.
   * @param {string} hex is the target color, whose type is integer.
   * It should be expressed in hex 0xFFFFFF.
   *
   * @param {string} [effect='smooth']  Refer to 'setColorTemperature' method.
   * @param {number} [time=1000] Refer to 'setColorTemperature' method.
   *
   * @example
   * setRGB('#ffffff');
   * setRGB('#ffffff', 'sudden');
   * setRGB('#ffffff', 'smooth', 1000);
   *
   * @returns {Promise} will be invoked after successfull or failed send
   */
  setRGB(hex, effect = 'smooth', time = 1000) {
    const color = hexToRgb(hex);
    const colorDec = (color.red * 65536) + (color.green * 256) + color.blue;
    const schema = Joi.array().items(
      Joi.number().min(0).max(16777215).required(),
      Joi.string().allow('sudden', 'smooth').required(),
      Joi.number().required(),
    );
    return this.sendRequest('set_rgb', [colorDec, effect, time], schema);
  }

  /**
   * This method is used to change the color of a smart LED.
   * @param {string} hue "hue" is the target hue value, whose type is integer.
   * It should be expressed in decimal integer ranges from 0 to 359.
   *
   * @param {string} saturation is the target saturation value whose type is integer.
   * It's range is 0 to 100.
   *
   * @param {string} [effect='smooth']  Refer to 'setColorTemperature' method.
   * @param {number} [time=1000] Refer to 'setColorTemperature' method.
   *
   * @example
   * setHSV(100, 50);
   * setHSV(100, 50, 'sudden');
   * setHSV(100, 50, 'smooth', 1000);
   *
   * @returns {Promise} will be invoked after successfull or failed send
   */
  setHSV(hue, saturation, effect = 'smooth', time = 100) {
    const schema = Joi.array().items(
      Joi.number().min(0).max(359).required(),
      Joi.number().min(0).max(100).required(),
      Joi.string().allow('sudden', 'smooth').required(),
      Joi.number().required(),
    );
    return this.sendRequest('set_hsv', [hue, saturation, effect, time], schema);
  }

  /**
   * This method is used to start a timer job on the smart LED.
   * @param {string} type currently can only be 0. (means power off)
   * @param {string} value is the length of the timer (in minutes).
   *
   * @example
   * addCron(0, 15);
   *
   * @returns {Promise} will be invoked after successfull or failed send
   */
  addCron(type, value) {
    const schema = Joi.array().items(
      Joi.number().required(),
      Joi.number().required(),
    );
    return this.sendRequest('cron_add', [type, value], schema);
  }

  /**
   * This method is used to retrieve the setting of the current cron job of the specified type.
   * @param {string} type the type of the cron job. (currently only support 0).
   *
   * @example
   * getCron(0);
   *
   * @returns {Promise} will be invoked after successfull or failed send
   */
  getCron(index) {
    const schema = Joi.array().items(
      Joi.number().required(),
    );
    return this.sendRequest('cron_get', [index], schema);
  }

  /**
   * This method is used to stop the specified cron job.
   * @param {string} type the type of the cron job. (currently only support 0).
   *
   * @example
   * deleteCron(0);
   *
   * @returns {Promise} will be invoked after successfull or failed send
   */
  deleteCron(index) {
    const schema = Joi.array().items(
      Joi.number().required(),
    );
    return this.sendRequest('cron_del', [index], schema);
  }

  /**
   * This method is used to change brightness, CT or color of a smart LED
   * without knowing the current value, it's main used by controllers.
   * @param {string} action the direction of the adjustment. The valid value can be:
   * <br>'increase': increase the specified property
   * <br>'decrease': decrease the specified property
   * <br>'circle': increase the specified property, after it reaches the max value, go back to minimum value
   *
   * @param {string} prop the property to adjust. The valid value can be:
   * <br>'bright': adjust brightness.
   * <br>'ct': adjust color temperature.
   * <br>'color': adjust color. (When 'prop' is 'color', the 'action' can only be 'circle', otherwise, it will be deemed as invalid request.)
   *
   * @example
   * setAdjust('increase', 'bright');
   *
   * @returns {Promise} will be invoked after successfull or failed send
   */
  setAdjust(action, prop) {
    const schema = Joi.array().items(
      Joi.string().allow('increase', 'decrease', 'circle').required(),
      Joi.string().allow('bright', 'ct', 'color').required(),
    );
    return this.sendRequest('set_adjust', [action, prop], schema);
  }

  /**
   * This method is used to start or stop music mode on a device. Under music mode,
   * no property will be reported and no message quota is checked.
   * @param {number} action the action of set_music command. The valid value can be:
   * <br>0: turn off music mode.
   * <br>1: turn on music mode.
   * @param {string} host the IP address of the music server.
   * @param {string} port the TCP port music application is listening on
   *
   * @example
   * setMusicMode(0, '10.0.0.1', 4000);
   *
   * @returns {Promise} will be invoked after successfull or failed send
   */
  setMusicMode(action, host, port) {
    const schema = Joi.array().items(
      Joi.number().allow(0, 1).required(),
      Joi.string().required(),
      Joi.number().min(1).max(65535).required(),
    );
    return this.sendRequest('set_music', [action, host, port], schema);
  }

  /**
   * This method is used to start a color flow. Color flow is a series of smart
   * LED visible state changing. It can be brightness changing,
   * color changing or color temperature changing.
   * @param {number} count is the total number of visible state changing
   * before color flow stopped. 0 means infinite loop on the state changing.
   * @param {string} action is the action taken after the flow is stopped.
   * <br>0: means smart LED recover to the state before the color flow started.
   * <br>1: means smart LED stay at the state when the flow is stopped.
   * <br>2: means turn off the smart LED after the flow is stopped.
   * @param {string} flowExpression is the expression of the state changing series.
   *
   * @example
   * startColorFlow(4, 2, '1000, 2, 2700, 100, 500, 1, 255, 10, 500, 2, 5000, 1');
   *
   * @returns {Promise} will be invoked after successfull or failed send
   */
  startColorFlow(count, action, flowExpression) {
    const schema = Joi.array().items(
      Joi.number().required(),
      Joi.number().allow(0, 1, 2).required(),
      Joi.string().required(),
    );
    return this.sendRequest('start_cf', [action, action, flowExpression], schema);
  }

  /**
   * This method is used to stop a running color flow
   *
   * @example
   * stopColorFlow();
   *
   * @returns {Promise} will be invoked after successfull or failed send
   */
  stopColorFlow() {
    return this.sendRequest('stop_cf', []);
  }
}
