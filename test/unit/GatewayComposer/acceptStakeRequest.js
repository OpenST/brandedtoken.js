'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../utils/Spy');
const AssertAsync = require('../../utils/AssertAsync');
const GatewayComposer = require('../../../lib/ContractInteract/GatewayComposer');
const Utils = require('../../../utils/Utils');

describe('GatewayComposer.acceptStakeRequest()', () => {
  let gatewayComposer;
  let web3;

  beforeEach(() => {
    web3 = new Web3();
    const contractAddress = '0x0000000000000000000000000000000000000002';
    gatewayComposer = new GatewayComposer(web3, contractAddress);
  });

  it('should pass with correct params', async () => {
    const stakeRequestHash = web3.utils.sha3('dummy');
    const r = 'r';
    const v = 'v';
    const s = 's';
    const hashLock = web3.utils.sha3('hashLock');

    const mockRawTx = 'mockRawTx';

    const rawTx = sinon.replace(
      gatewayComposer,
      'acceptStakeRequestRawTx',
      sinon.fake.resolves(mockRawTx),
    );

    const spySendTransaction = sinon.replace(
      Utils,
      'sendTransaction',
      sinon.fake.resolves(true),
    );
    const txOptions = {
      from: '0x0000000000000000000000000000000000000003',
    };
    const response = await gatewayComposer.acceptStakeRequest(
      stakeRequestHash,
      r,
      s,
      v,
      hashLock,
      txOptions,
    );
    assert.isTrue(
      response,
      'Accept stake should return true',
    );
    Spy.assert(rawTx, 1, [[stakeRequestHash, r, s, v, hashLock]]);
    Spy.assert(spySendTransaction, 1, [[mockRawTx, txOptions]]);
    sinon.restore();
  });

  it('should throw an error when transaction options is undefined', async () => {
    const stakeRequestHash = web3.utils.sha3('dummy');
    const r = 'r';
    const v = 'v';
    const s = 's';
    const hashLock = web3.utils.sha3('hashLock');
    const txOptions = undefined;

    await AssertAsync.reject(
      gatewayComposer.acceptStakeRequest(stakeRequestHash, r, s, v, hashLock, txOptions),
      'Invalid transaction options: undefined.',
    );
  });

  it('should throw an error when account address is undefined', async () => {
    const stakeRequestHash = web3.utils.sha3('dummy');
    const r = 'r';
    const v = 'v';
    const s = 's';
    const hashLock = web3.utils.sha3('hashLock');
    const txOptions = {};
    await AssertAsync.reject(
      gatewayComposer.acceptStakeRequest(stakeRequestHash, r, s, v, hashLock, txOptions),
      `Invalid from address ${txOptions.from} in transaction options.`,
    );
  });

  it('should throw an error when account address is invalid', async () => {
    const stakeRequestHash = web3.utils.sha3('dummy');
    const r = 'r';
    const v = 'v';
    const s = 's';
    const hashLock = web3.utils.sha3('hashLock');
    const txOptions = {
      from: '0x123',
    };
    await AssertAsync.reject(
      gatewayComposer.acceptStakeRequest(stakeRequestHash, r, s, v, hashLock, txOptions),
      `Invalid from address ${txOptions.from} in transaction options.`,
    );
  });
});
