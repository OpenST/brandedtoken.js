'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../utils/Spy');
const BrandedToken = require('../../../lib/ContractInteract/BrandedToken');

describe('BrandedToken.convertToValueTokens()', () => {
  let brandedToken;

  beforeEach(() => {
    const web3 = new Web3();
    const tokenAddress = '0x0000000000000000000000000000000000000002';
    brandedToken = new BrandedToken(web3, tokenAddress);
  });

  it('should return expected value', async () => {
    const brandedTokens = '100';

    const convertToValueTokensSpy = sinon.replace(
      brandedToken.contract.methods,
      'convertToValueTokens',
      sinon.fake.returns({
        call: () => Promise.resolve(true),
      }),
    );
    const response = await brandedToken.convertToValueTokens(brandedTokens);

    assert.isTrue(
      response,
      'convertToValueTokens must return true',
    );

    Spy.assert(convertToValueTokensSpy, 1, [[brandedTokens]]);
    sinon.restore();
  });
});
