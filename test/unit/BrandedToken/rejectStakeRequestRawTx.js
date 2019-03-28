'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../utils/Spy');
const BrandedToken = require('../../../lib/ContractInteract/BrandedToken');
const AssertAsync = require('../../utils/AssertAsync');

describe('BrandedToken.rejectStakeRequestRawTx()', () => {
  let brandedToken;
  let web3;

  beforeEach(() => {
    web3 = new Web3();
    const tokenAddress = '0x0000000000000000000000000000000000000002';
    brandedToken = new BrandedToken(web3, tokenAddress);
  });

  it('should return correct raw tx', async () => {
    const mockTx = 'mockTx';

    const spyRawTx = sinon.replace(
      brandedToken.contract.methods,
      'rejectStakeRequest',
      sinon.fake.resolves(mockTx),
    );

    const stakeRequestHash = web3.utils.sha3('dummy');

    const response = await brandedToken.rejectStakeRequestRawTx(stakeRequestHash);

    assert.strictEqual(
      response,
      mockTx,
      'It must return correct raw tx',
    );

    Spy.assert(spyRawTx, 1, [[stakeRequestHash]]);
    sinon.restore();
  });

  it('should throw an error when stakeRequestHash is invalid', async () => {
    const stakeRequestHash = undefined;

    await AssertAsync.reject(
      brandedToken.rejectStakeRequestRawTx(stakeRequestHash),
      `Invalid stakeRequestHash: ${stakeRequestHash}.`,
    );
  });
});
