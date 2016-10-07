const debug = require('debug');
const YeelightSearch = require('../build/');

const yeelightSearch = new YeelightSearch();
const log = debug('Yeelight-example');

yeelightSearch.on('found', (lightBulb) => {
  lightBulb.toggle()
    .then(() => {
      log('toggled');
    })
    .catch((err) => {
      log(`recived some error: ${err}`);
    });
});

setTimeout(() => {}, 1000);
