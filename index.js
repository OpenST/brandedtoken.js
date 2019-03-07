'use strict';

const Mosaic = require('@openstfoundation/mosaic.js');

const AbiBinProvider = require('./lib/AbiBinProvider');
const BrandedToken = require('./lib/ContractInteract/BrandedToken');
const Contracts = require('./lib/Contracts');
const EconomySetup = require('./lib/EconomySetup');
const Setup = require('./lib/Setup');
const Facilitator = require('./lib/Facilitator');
const GatewayComposer = require('./lib/ContractInteract/GatewayComposer');
const StakeHelper = require('./lib/helpers/stake/gateway_composer/StakeHelper');
const Staker = require('./lib/Staker');
const UtilityBrandedToken = require('./lib/ContractInteract/UtilityBrandedToken');

const mosaicContractInteracts = Mosaic.ContractInteract;

module.exports = {
  AbiBinProvider,
  EconomySetup,
  Contracts,
  ContractInteract: {
    BrandedToken,
    GatewayComposer,
    UtilityBrandedToken,
    ...mosaicContractInteracts,
  },
  Helpers: {
    StakeHelper,
    Staker,
    Facilitator,
  },
  Setup,
};
