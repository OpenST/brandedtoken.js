'use strict';

const { assert } = require('chai');
const Web3 = require('web3');

const Setup = require('../../../lib/Setup');
const shared = require('../shared');

describe('Setup.brandedtoken', () => {
  let originTxOptions;

  before(() => {

  });

  it('should deploy new branded token', async () => {
    const accountsOrigin = await shared.origin.web3.eth.getAccounts();

    // Fixme Deploy a EIP20 Token here.
    const token = accountsOrigin[0];

    shared.setupConfig.originToken = token;

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
