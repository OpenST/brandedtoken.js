'use strict';

const ConfigReader = function() {};

ConfigReader.prototype = {
  gasPrice: '0x3B9ACA00',
  gas: 7500000,
  nullBytes32: '0x0000000000000000000000000000000000000000000000000000000000000000',
  originPort: 8546
};

module.exports = new ConfigReader();
