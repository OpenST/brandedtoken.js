'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const Setup = require('../../../lib/Setup');
const shared = require('../shared');

describe('Setup.organization', () => {
  let originTxOptions;

  before(() => {
    originTxOptions = {
      gasPrice: shared.setupConfig.gasPrice,
    };
  });

  it('should deploy new organizations', async () => {
    const originConfig = {
      deployer: shared.setupConfig.deployerAddress,
      owner: shared.setupConfig.organizationOwner,
      admin: shared.setupConfig.organizationAdmin,
      workers: [],
      workerExpirationHeight: '0',
    };

    const originOrganization = await Setup.organization(
      shared.origin.web3,
      originConfig,
      originTxOptions,
    );

    assert.strictEqual(
      Web3.utils.isAddress(originOrganization.address),
      true,
      `Origin organization does not have a valid address: ${
        originOrganization.address
      }`,
    );

    shared.setupModule.originOrganization = originOrganization;
  });
});
