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

  it('should return expected value', async () => {
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
      'isUnrestricted must be true',
    );

    Spy.assert(isUnrestrictedSpy, 1, [[address]]);
  });
});
