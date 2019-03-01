'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../utils/Spy');
const BrandedToken = require('../../../lib/ContractInteract/BrandedToken');

describe('BrandedToken.isUnrestricted()', () => {
  let brandedToken;

  beforeEach(() => {
    const web3 = new Web3();
    const tokenAddress = '0x0000000000000000000000000000000000000002';
    brandedToken = new BrandedToken(web3, tokenAddress);
  });

  it('should return true for unrestricted account', async () => {
    const address = '0x0000000000000000000000000000000000000003';

    const isUnrestrictedSpy = sinon.replace(
      brandedToken.contract.methods,
      'isUnrestricted',
      sinon.fake.returns({
        call: () => Promise.resolve(true),
      }),
    );
    const response = await brandedToken.isUnrestricted(address);

    assert.isTrue(
      response,
      'isUnrestricted must return true',
    );

    Spy.assert(isUnrestrictedSpy, 1, [[address]]);
  });

  it('should return false for a restricted account', async () => {
    const address = '0x0000000000000000000000000000000000000003';

    const isUnrestrictedSpy = sinon.replace(
      brandedToken.contract.methods,
      'isUnrestricted',
      sinon.fake.returns({
        call: () => Promise.resolve(false),
      }),
    );
    const response = await brandedToken.isUnrestricted(address);

    assert.isFalse(
      response,
      'isUnrestricted must return false',
    );

    Spy.assert(isUnrestrictedSpy, 1, [[address]]);
  });
});
