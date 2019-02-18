'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../utils/Spy');
const BrandedToken = require('../../../lib/ContractInteract/BrandedToken');

describe('BrandedToken.acceptStakeRequestRawTx()', () => {
  it('should return correct raw tx', async () => {
    const web3 = new Web3();
    const tokenAddress = '0x0000000000000000000000000000000000000002';
    const brandedToken = new BrandedToken(web3, tokenAddress);

    const mockTx = 'mockTx';

    const spyRawTx = sinon.replace(
      brandedToken.contract.methods,
      'acceptStakeRequest',
      sinon.fake.resolves(mockTx),
    );

    const stakeRequestHash = web3.utils.sha3('dummy');
    const r = 'r';
    const v = 'v';
    const s = 's';

    const response = await brandedToken.acceptStakeRequestRawTx(
      stakeRequestHash,
      r,
      s,
      v,
    );

    assert.strictEqual(
      response,
      mockTx,
      'It must return correct raw tx',
    );

    Spy.assert(spyRawTx, 1, [[stakeRequestHash, r, s, v]]);
  });
});
