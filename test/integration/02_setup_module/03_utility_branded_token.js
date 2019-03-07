'use strict';

const { assert } = require('chai');
const Web3 = require('web3');

const Setup = require('../../../lib/Setup');
const shared = require('../shared');

describe('Setup.utilityBrandedtoken', () => {
  it('should deploy new utility branded token', async () => {
    const symbol = 'DT';
    const name = 'dummy token';
    const decimal = 18;

    const accountsOrigin = await shared.origin.web3.eth.getAccounts();

    // Fixme anchors deployment.
    const originAnchor = accountsOrigin[0];
    const auxiliaryAnchor = accountsOrigin[1];

    const auxiliaryOrganizationConfig = {
      deployer: shared.setupConfig.deployerAddress,
      owner: shared.setupConfig.organizationOwner,
      admin: shared.setupConfig.organizationAdmin,
      workers: [],
      workerExpirationHeight: '0',
    };

    const auxiliaryUBTConfig = {
      valueToken: shared.setupModule.originBrandedToken.address,
      symbol,
      name,
      decimal,
    };

    const auxiliaryTxUBTOptions = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice,
    };

    const originGatewayConfig = {
      token: shared.setupModule.originBrandedToken.address,
      baseToken: shared.setupModule.originBrandedToken.address,
      stateRootProvider: originAnchor,
      bounty: '0',
      organization: shared.setupModule.originOrganization.address,
      burner: '0x0000000000000000000000000000000000000000',
      deployer: shared.setupConfig.deployerAddress,
      organizationOwner: shared.setupConfig.organizationOwner,
    };

    const auxiliaryGatewayConfig = {
      stateRootProvider: auxiliaryAnchor,
      bounty: '0',
      burner: '0x0000000000000000000000000000000000000000',
      deployer: shared.setupConfig.deployerAddress,
      organizationOwner: shared.setupConfig.organizationOwner,
    };

    const originGatewayTxOptions = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice,
    };
    const auxiliaryCoGatewayTxOptions = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice,
    };

    const auxiliaryUBTSetCoGatewayTxOptions = {
      gasPrice: shared.setupConfig.gasPrice,
      from: shared.setupConfig.organizationOwner,
    };

    const {
      auxiliaryOrganization,
      utilityBrandedToken,
      originGateway,
      auxiliaryCoGateway,
    } = await Setup.utilitybrandedtoken(
      shared.origin.web3,
      shared.origin.web3,
      auxiliaryOrganizationConfig,
      auxiliaryTxUBTOptions,
      auxiliaryUBTConfig,
      auxiliaryTxUBTOptions,
      originGatewayConfig,
      auxiliaryGatewayConfig,
      originGatewayTxOptions,
      auxiliaryCoGatewayTxOptions,
      auxiliaryUBTSetCoGatewayTxOptions,
    );

    assert.strictEqual(
      Web3.utils.isAddress(auxiliaryOrganization.address),
      true,
      `Auxiliary organization does not have a valid address: ${
        auxiliaryOrganization.address
      }`,
    );
    assert.strictEqual(
      Web3.utils.isAddress(utilityBrandedToken.address),
      true,
      `Utility branded token does not have a valid address: ${
        utilityBrandedToken.address
      }`,
    );
    assert.strictEqual(
      Web3.utils.isAddress(originGateway.address),
      true,
      `Origin gateway does not have a valid address: ${
        originGateway.address
      }`,
    );
    assert.strictEqual(
      Web3.utils.isAddress(auxiliaryCoGateway.address),
      true,
      `Auxiliary cogateway does not have a valid address: ${
        auxiliaryCoGateway.address
      }`,
    );

    shared.setupModule.auxiliaryOrganization = auxiliaryOrganization;
    shared.setupModule.utilityBrandedToken = utilityBrandedToken;
    shared.setupModule.originGateway = originGateway;
    shared.setupModule.auxiliaryCoGateway = auxiliaryCoGateway;
  });
});
