import EventEmitter from 'events';
import { Client } from 'node-ssdp';

import Yeelight from './Yeelight';

/**
 * Create a new instance of the Yeelight lib
 * and start searching for new Yeelights
 * once a Yeelight has been found it will create an Yeelight instance
 * and emits the 'found' event light the Yeelight instance as payload
 *
 * @extends EventEmitter
 */
export default class YeelightSearch extends EventEmitter {
  constructor() {
    super();

    this.yeelights = [];
    this.client = new Client({ ssdpPort: 1982 });

    this.client.on('response', (data) => {
      let yeelight = this.yeelights.find(item => item.getId() === data.ID);
      if (!yeelight) {
        yeelight = new Yeelight(data);
        this.yeelights.push(yeelight);
        this.emit('found', yeelight);
      }
    });

    this.client.search('wifi_bulb');
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
