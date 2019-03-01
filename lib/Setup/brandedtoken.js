/**
 * @typedef {Object} OriginBrandedTokenSetupConfig
 *
 * @property {string} valueToken Address of the value token contract.
 * @property {string} symbol Symbol for branded token contract.
 * @property {string} name Name for branded token contract.
 * @property {string} decimal Decimal for branded token contract.
 * @property {number} conversionRate Factor used to convert between branded
 *                                   token and value token.
 * @property {number} conversionRateDecimals Number represents decimals for
 *                                           conversion between branded token
 *                                           and value token.
 * @property {string} organization The address of the organization contract
 *                                 on origin chain.
 */

'use strict';

const BrandedToken = require('../ContractInteract/BrandedToken');

/**
 * A single function to deploy branded token contract.
 *
 * @param {Web3} originWeb3 Web3 instance pointing to origin chain.
 * @param {OriginBrandedTokenSetupConfig} originBTConfig Configuration of the origin
 *                                                       branded token contract.
 * @param {Object} originTxOptions Transaction options for the origin chain.
 *
 * @return {Promise<BrandedToken>} Branded token contract interact instance.
 */
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
