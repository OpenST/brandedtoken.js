'use strict';

const Web3 = require('web3');
const Mosaic = require('mosaic-tbd');
const AbiBinProvider = require('../libs/AbiBinProvider');
const BTHelper = require('../libs/helpers/BTHelper');

class EconomySetup extends Mosaic.ChainSetup {
  constructor(originWeb3, auxiliaryWeb3) {
    super(originWeb3, auxiliaryWeb3);
  }

  static get BTHelper() {
    return BTHelper;
  }
}

module.exports = EconomySetup;
