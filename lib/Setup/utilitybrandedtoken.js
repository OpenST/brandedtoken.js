'use strict';

const { ContractInteract, Setup } = require('@openstfoundation/mosaic.js');
const UtilityBrandedToken = require('../ContractInteract/UtilityBrandedToken');

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
