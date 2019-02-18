'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../utils/Spy');
const BrandedToken = require('../../../lib/ContractInteract/BrandedToken');

describe('BrandedToken.requestStakeRawTx()', () => {
  it('should return correct raw tx', async () => {
    const web3 = new Web3();
    const tokenAddress = '0x0000000000000000000000000000000000000002';
    const brandedToken = new BrandedToken(web3, tokenAddress);

    const mockTx = 'mockTx';

    const spyRawTx = sinon.replace(
      brandedToken.contract.methods,
      'requestStake',
      sinon.fake.resolves(mockTx),
    );

    const stakeAmount = '100';
    const mintAmount = '100';
    const response = await brandedToken.requestStakeRawTx(stakeAmount, mintAmount);

    assert.strictEqual(
      response,
      mockTx,
      'It must return correct raw tx',
    );

    Spy.assert(spyRawTx, 1, [[stakeAmount, mintAmount]]);
  });
});
