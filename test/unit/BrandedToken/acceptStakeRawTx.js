'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../utils/Spy');
const BrandedToken = require('../../../lib/ContractInteract/BrandedToken');
const AssertAsync = require('../../utils/AssertAsync');

describe('BrandedToken.acceptStakeRequestRawTx()', () => {
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
  it('should throw an error when stakeRequestHash is invalid', async () => {
    const stakeRequestHash = undefined;
    const r = 'r';
    const v = 'v';
    const s = 's';

    await AssertAsync.reject(
      brandedToken.acceptStakeRequestRawTx(stakeRequestHash, r, s, v),
      `Invalid stakeRequestHash: ${stakeRequestHash}.`,
    );
  });

  it('should throw an error when  r of signature is invalid', async () => {
    const stakeRequestHash = web3.utils.sha3('dummy');
    const r = undefined;
    const v = 'v';
    const s = 's';

    await AssertAsync.reject(
      brandedToken.acceptStakeRequestRawTx(stakeRequestHash, r, s, v),
      `Invalid r of signature: ${r}.`,
    );
  });

  it('should throw an error when  r of signature is invalid', async () => {
    const stakeRequestHash = web3.utils.sha3('dummy');
    const r = 'r';
    const v = undefined;
    const s = 's';

    await AssertAsync.reject(
      brandedToken.acceptStakeRequestRawTx(stakeRequestHash, r, s, v),
      `Invalid v of signature: ${v}.`,
    );
  });

  it('should throw an error when  r of signature is invalid', async () => {
    const stakeRequestHash = web3.utils.sha3('dummy');
    const r = 'r';
    const v = 'v';
    const s = undefined;

    await AssertAsync.reject(
      brandedToken.acceptStakeRequestRawTx(stakeRequestHash, r, s, v),
      `Invalid s of signature: ${s}.`,
    );
  });
});
