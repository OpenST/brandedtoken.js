'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../utils/Spy');
const GatewayComposer = require('../../../lib/ContractInteract/GatewayComposer');
const AssertAsync = require('../../utils/AssertAsync');

describe('GatewayComposer.acceptStakeRequestRawTx()', () => {
  let gatewayComposer;
  let web3;

  beforeEach(() => {
    web3 = new Web3();
    const contractAddress = '0x0000000000000000000000000000000000000002';
    gatewayComposer = new GatewayComposer(web3, contractAddress);
  });

  it('should return correct raw tx', async () => {
    const mockTx = 'mockTx';

    const spyRawTx = sinon.replace(
      gatewayComposer.contract.methods,
      'acceptStakeRequest',
      sinon.fake.resolves(mockTx),
    );

    const stakeRequestHash = web3.utils.sha3('dummy');
    const r = 'r';
    const v = 'v';
    const s = 's';
    const hashLock = web3.utils.sha3('lock');

    const response = await gatewayComposer.acceptStakeRequestRawTx(
      stakeRequestHash,
      r,
      s,
      v,
      hashLock,
    );

    assert.strictEqual(
      response,
      mockTx,
      'It must return correct raw tx',
    );

    Spy.assert(spyRawTx, 1, [[stakeRequestHash, r, s, v, hashLock]]);
    sinon.restore();
  });
  it('should throw an error when stakeRequestHash is invalid', async () => {
    const stakeRequestHash = undefined;
    const r = 'r';
    const v = 'v';
    const s = 's';
    const hashLock = web3.utils.sha3('lock');

    await AssertAsync.reject(
      gatewayComposer.acceptStakeRequestRawTx(stakeRequestHash, r, s, v, hashLock),
      `Invalid stakeRequestHash: ${stakeRequestHash}.`,
    );
  });

  it('should throw an error when  r of signature is invalid', async () => {
    const stakeRequestHash = web3.utils.sha3('dummy');
    const r = undefined;
    const v = 'v';
    const s = 's';
    const hashLock = web3.utils.sha3('lock');

    await AssertAsync.reject(
      gatewayComposer.acceptStakeRequestRawTx(stakeRequestHash, r, s, v, hashLock),
      `Invalid r of signature: ${r}.`,
    );
  });

  it('should throw an error when  r of signature is invalid', async () => {
    const stakeRequestHash = web3.utils.sha3('dummy');
    const r = 'r';
    const v = undefined;
    const s = 's';
    const hashLock = web3.utils.sha3('lock');

    await AssertAsync.reject(
      gatewayComposer.acceptStakeRequestRawTx(stakeRequestHash, r, s, v, hashLock),
      `Invalid v of signature: ${v}.`,
    );
  });

  it('should throw an error when  hashlock is invalid', async () => {
    const stakeRequestHash = web3.utils.sha3('dummy');
    const r = 'r';
    const v = 'v';
    const s = 's';
    const hashLock = undefined;

    await AssertAsync.reject(
      gatewayComposer.acceptStakeRequestRawTx(stakeRequestHash, r, s, v, hashLock),
      `Invalid hashLock of signature: ${hashLock}.`,
    );
  });
});
