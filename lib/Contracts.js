'use strict';

const Web3 = require('web3');
const AbiBinProvider = require('./AbiBinProvider');
const Mosaic = require('@openstfoundation/mosaic-tbd');
const Contracts = Mosaic.Contracts;
let abProvider = new AbiBinProvider();

/**
 * The class exposes instance of different contracts. Dappy can use the
 * instances to call contract methods. This gives Dappy flexibility in calling
 * contract methods based on his use case.
 */
class BTContracts extends Contracts {
  constructor(originWeb3, auxiliaryWeb3) {
    super(originWeb3, auxiliaryWeb3);
    const oThis = this;

    oThis.originWeb3 = originWeb3;
    oThis.auxiliaryWeb3 = auxiliaryWeb3;
  }

  BrandedToken(address, options) {
    const oThis = this;
    let web3 = oThis.originWeb3;
    return BTContracts.getBrandedToken(web3, address, options);
  }

  GatewayComposer(address, options) {
    const oThis = this;
    let web3 = oThis.originWeb3;
    return BTContracts.getGatewayComposer(web3, address, options);
  }

  UtilityBrandedToken(address, options) {
    const oThis = this;
    let web3 = oThis.auxiliaryWeb3;
    return BTContracts.getUtilityBrandedToken(web3, address, options);
  }

  static getBrandedToken(web3, address, options) {
    web3 = Contracts._getWeb3(web3);
    let jsonInterface = abProvider.getABI('BrandedToken');
    let contract = new web3.eth.Contract(jsonInterface, address, options);
    return contract;
  }

  static getGatewayComposer(web3, address, options) {
    web3 = Contracts._getWeb3(web3);
    let jsonInterface = abProvider.getABI('GatewayComposer');
    let contract = new web3.eth.Contract(jsonInterface, address, options);
    return contract;
  }

  static getUtilityBrandedToken(web3, address, options) {
    web3 = Contracts._getWeb3(web3);
    let jsonInterface = abProvider.getABI('UtilityBrandedToken');
    let contract = new web3.eth.Contract(jsonInterface, address, options);
    return contract;
  }

  static _getWeb3(web3) {
    if (web3 instanceof Web3) {
      return web3;
    }
    if (typeof web3 === 'string') {
      return new Web3(web3);
    }
    throw 'Invalid web3. Please provide an instanceof Web3(version: ' + Web3.version + ' )';
  }
}

module.exports = BTContracts;
