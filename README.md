# yeelight-wifi

[![Greenkeeper badge](https://badges.greenkeeper.io/pmdroid/yeelight-wifi.svg)](https://greenkeeper.io/)
[![CircleCI](https://circleci.com/gh/pmdroid/yeelight-wifi.svg?style=svg)](https://circleci.com/gh/pmdroid/yeelight-wifi)
[![codecov](https://codecov.io/gh/pmdroid/yeelight-wifi/branch/master/graph/badge.svg)](https://codecov.io/gh/pmdroid/yeelight-wifi)

The [Yeelight WiFi Lib](https://github.com/pmdroid/yeelight-wifi) docs are located [here](https://pmdroid.github.io/yeelight-wifi/).

Using npm:
```shell
$ npm i --save yeelight-wifi
```

In Node.js:
```js
const YeelightSearch = require('yeelight-wifi');

const yeelightSearch = new YeelightSearch();
yeelightSearch.on('found', (lightBulb) => {
  lightBulb.toggle()
    .then(() => {
      console.log('toggled');
    })
    .catch((err) => {
      console.log(`received some error: ${err}`);
    });
});
```
