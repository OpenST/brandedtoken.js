'use strict';

const AbiBinProvider = require('./lib/AbiBinProvider');
const EconomySetup = require('./lib/EconomySetup');
const Contracts = require('./lib/Contracts');
const StakeHelper = require('./lib/helpers/stake/gateway_composer/StakeHelper');
const Staker = require('./lib/helpers/stake/gateway_composer/Staker');
const Facilitator = require('./lib/helpers/stake/gateway_composer/Facilitator');

module.exports = {
  AbiBinProvider: AbiBinProvider,
  EconomySetup: EconomySetup,
  Contracts: Contracts,
  Helpers: {
    StakeHelper: StakeHelper,
    Staker: Staker,
    Facilitator: Facilitator
  }
};
