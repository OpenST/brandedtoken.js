'use strict';

const { assert } = require('chai');
const Web3 = require('web3');

const MockContractsDeployer = require('./../../utils/MockContractsDeployer');
const Setup = require('../../../lib/Setup');
const shared = require('../shared');

describe('Setup.brandedtoken', () => {
  let originTxOptions;

  before(() => {

  });

  it('should deploy new branded token', async () => {
    const deployerInstance = new MockContractsDeployer(
      shared.setupConfig.deployerAddress,
      shared.origin.web3,
    );
    await deployerInstance.deployMockToken();
    shared.setupConfig.originToken = deployerInstance.addresses.MockToken;

    const symbol = 'DT';
    const name = 'dummy token';
    const decimal = 18;
    const conversionRate = 100000;
    const conversionRateDecimals = 5;
    const organization = shared.setupModule.originOrganization.address;

    const originConfig = {
      valueToken: shared.setupConfig.originToken,
      symbol,
      name,
      decimal,
      conversionRate,
      conversionRateDecimals,
      organization,
    };

    originTxOptions = {
      gasPrice: shared.setupConfig.gasPrice,
      from: shared.setupConfig.deployerAddress,
    };

    const originBrandedToken = await Setup.brandedtoken(
      shared.origin.web3,
      originConfig,
      originTxOptions,
    );

    assert.strictEqual(
      Web3.utils.isAddress(originBrandedToken.address),
      true,
      `Origin branded token does not have a valid address: ${
        originBrandedToken.address
      }`,
    );

    shared.setupModule.originBrandedToken = originBrandedToken;
  });
});
