'use strict';

const BrandedToken = require('../ContractInteract/BrandedToken');

const setup = (
  originWeb3,
  originBTConfig,
  originTxOptions,
) => BrandedToken.deploy(
  originWeb3,
  originBTConfig.valueToken,
  originBTConfig.symbol,
  originBTConfig.name,
  originBTConfig.decimal,
  originBTConfig.conversionRate,
  originBTConfig.conversionRateDecimals,
  originBTConfig.organization,
  originTxOptions,
);

module.exports = setup;
