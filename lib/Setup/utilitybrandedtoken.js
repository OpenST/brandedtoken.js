/**
 * @typedef {Object} UtilityBrandedTokenSetupConfig
 *
 * @property {string} valueToken Address of the branded token contract on
 *                               origin.
 * @property {string} symbol Symbol for branded token contract.
 * @property {string} name Name for branded token contract.
 * @property {string} decimal Decimal for branded token contract.
 * @property {string} organization The address of the organization contract
 *                                 on auxiliary chain.
 */

'use strict';

const { ContractInteract, Setup } = require('@openstfoundation/mosaic.js');
const UtilityBrandedToken = require('../ContractInteract/UtilityBrandedToken');

/**
 * A single function to setup a utility branded token. This function deploy
 * auxiliary organization, EIP2Gateway, EIP20CoGateway and Utility branded
 * token.
 *
 * @param {Web3} originWeb3 Web3 instance pointing to origin chain.
 * @param {Web3} auxiliaryWeb3 Web3 instance pointing to auxiliary chain.
 * @param {OrganizationSetupConfig} auxiliaryOrganizationConfig Configuration to
 *                                                              deploy auxiliary
 *                                                              organization.
 * @param {Object} auxiliaryOrganizationTxOptions Transaction options to deploy
 *                                                auxiliary organization.
 * @param {UtilityBrandedTokenSetupConfig} auxiliaryUBTConfig Configuration to
 *                                                            deploy utility
 *                                                            Branded token.
 * @param {Object} auxiliaryTxUBTOptions Transaction options to deploy
 *                                       utility Branded token.
 * @param {GatewaysOriginSetupConfig} originGatewayConfig Configuration to
 *                                                        deploy origin gateway.
 * @param {GatewaysAuxiliarySetupConfig} auxiliaryGatewayConfig Configuration to
 *                                                              deploy auxiliary
 *                                                              co-gateway.
 * @param {Object} originGatewayTxOptions Transaction options to deploy
 *                                        origin gateway.
 * @param {Object} auxiliaryCoGatewayTxOptions Transaction options to deploy
 *                                             auxiliary co-gateway.
 * @param {Object }auxiliaryUBTSetCoGatewayTxOptions Transaction options to set
 *                                                   co-gateway on utility
 *                                                   branded token. From
 *                                                   address in transaction
 *                                                   must be organization
 *                                                   master key.
 *
 * @return {Promise<{
 *   auxiliaryOrganization: Organization,
 *   utilityBrandedToken: UtilityBrandedToken,
 *   originGateway: EIP20Gateway,
 *   auxiliaryCoGateway: EIP20CoGateway}>
 *  }
 */
const setup = async (
  originWeb3,
  auxiliaryWeb3,
  auxiliaryOrganizationConfig,
  auxiliaryOrganizationTxOptions,
  auxiliaryUBTConfig,
  auxiliaryTxUBTOptions,
  originGatewayConfig,
  auxiliaryGatewayConfig,
  originGatewayTxOptions,
  auxiliaryCoGatewayTxOptions,
  auxiliaryUBTSetCoGatewayTxOptions,
) => {
  const auxiliaryOrganization = await ContractInteract.Organization.setup(
    auxiliaryWeb3,
    auxiliaryOrganizationConfig,
    auxiliaryOrganizationTxOptions,
  );

  const utilityBrandedToken = await UtilityBrandedToken.deploy(
    auxiliaryWeb3,
    auxiliaryUBTConfig.valueToken,
    auxiliaryUBTConfig.symbol,
    auxiliaryUBTConfig.name,
    auxiliaryUBTConfig.decimal,
    auxiliaryOrganization.address,
    auxiliaryTxUBTOptions,
  );

  // eslint-disable-next-line no-param-reassign
  auxiliaryGatewayConfig = {
    ...auxiliaryGatewayConfig,
    utilityToken: utilityBrandedToken.address,
    organization: auxiliaryOrganization.address,
  };

  const [originGateway, auxiliaryCoGateway] = await Setup.gateways(
    originWeb3,
    auxiliaryWeb3,
    originGatewayConfig,
    auxiliaryGatewayConfig,
    originGatewayTxOptions,
    auxiliaryCoGatewayTxOptions,
  );

  await utilityBrandedToken.setCoGateway(
    auxiliaryCoGateway.address,
    auxiliaryUBTSetCoGatewayTxOptions,
  );

  return {
    auxiliaryOrganization,
    utilityBrandedToken,
    originGateway,
    auxiliaryCoGateway,
  };
};

module.exports = setup;
