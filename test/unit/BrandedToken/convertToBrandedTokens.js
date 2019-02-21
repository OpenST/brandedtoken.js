'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../utils/Spy');
const BrandedToken = require('../../../lib/ContractInteract/BrandedToken');

describe('BrandedToken.convertToBrandedTokens()', () => {
  let brandedToken;

  beforeEach(() => {
    const web3 = new Web3();
    const tokenAddress = '0x0000000000000000000000000000000000000002';
    brandedToken = new BrandedToken(web3, tokenAddress);
  });

  it('should return expected value', async () => {
    const valueTokens = '100';

    const isUnrestrictedSpy = sinon.replace(
      brandedToken.contract.methods,
      'convertToBrandedTokens',
      sinon.fake.returns({
        call: () => Promise.resolve(true),
      }),
    );
    const response = await brandedToken.convertToBrandedTokens(valueTokens);

    assert.isTrue(
      response,
      'convertToBrandedTokens must return true',
    );

    Spy.assert(isUnrestrictedSpy, 1, [[valueTokens]]);
  });
});
