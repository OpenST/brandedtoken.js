'use strict';

const ConfigReader = function constructor() {};

ConfigReader.prototype = {
  gasPrice: '0x3B9ACA00',
  gas: 7500000,
  nullBytes32: '0x0000000000000000000000000000000000000000000000000000000000000000',
  originPort: 8546,
  stakeAmountInWei: '10000000000',
  stakeGasPrice: '7500000',
  stakeGasLimit: '100',
  workerExpirationHeight: '20000000',
  symbol: 'BT',
  name: 'MyBrandedToken',
  decimals: '18',
  conversionRate: '10',
  conversionRateDecimals: '5',
};

module.exports = new ConfigReader();
