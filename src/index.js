import EventEmitter from 'events';
import { Client } from 'node-ssdp';

import Yeelight from './Yeelight';

/**
 * Create a new instance of the YeelightSearch class
 * and start searching for new Yeelights
 * once a Yeelight has been found it will create an Yeelight instance
 * and emits the 'found' event light the Yeelight instance as payload
 *
 * @extends EventEmitter
 */
class YeelightSearch extends EventEmitter {
  constructor() {
    super();

    this.yeelights = [];
    // Setting the sourcePort ensures multicast traffic is received
    this.client = new Client({ sourcePort: 1982, ssdpPort: 1982 });

    this.client.on('response', (data) => this.addLight(data));
    // Register devices that sends NOTIFY to multicast address too
    this.client.on('advertise-alive', (data) => this.addLight(data));

    this.client.search('wifi_bulb');
  }

  /**
   * adds a new light to the lights array
   */
  addLight(lightdata) {
    let yeelight = this.yeelights.find(item => item.getId() === lightdata.ID);
    if (!yeelight) {
	  yeelight = new Yeelight(lightdata);
	  this.yeelights.push(yeelight);
	  this.emit('found', yeelight);
    }
  }

  /**
   * returns a list of all found Yeelights
   * @returns {array.<Yeelight>} array with yeelight instances
   */
  getYeelights() {
    return this.yeelights;
  }

  /**
   * returns one Yeelight found by id
   * @param {string} id Yeelight Id
   * @returns {Yeelight} Yeelight instance
   */
  getYeelightById(id) {
    return this.yeelights.find(item => item.getId() === id);
  }
}

module.exports = YeelightSearch;
