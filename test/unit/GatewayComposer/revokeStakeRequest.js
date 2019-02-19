'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../utils/Spy');
const AssertAsync = require('../../utils/AssertAsync');
const GatewayComposer = require('../../../lib/ContractInteract/GatewayComposer');
const Utils = require('../../../utils/Utils');

describe('GatewayComposer.revokeStakeRequest()', () => {
  let gatewayComposer;
  let
    web3;

  beforeEach(() => {
    web3 = new Web3();
    const contractAddress = '0x0000000000000000000000000000000000000002';
    gatewayComposer = new GatewayComposer(web3, contractAddress);
  });

  it('should pass with correct params', async () => {
    const stakeRequestHash = web3.utils.sha3('dummy');

    const mockRawTx = 'mockRawTx';

    const rawTx = sinon.replace(
      gatewayComposer,
      'revokeStakeRequestRawTx',
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
    const response = await gatewayComposer.revokeStakeRequest(
      stakeRequestHash,
      txOptions,
    );
    assert.isTrue(
      response,
      'Request stake should return true',
    );
    Spy.assert(rawTx, 1, [[stakeRequestHash]]);
    Spy.assert(spySendTransaction, 1, [[mockRawTx, txOptions]]);
    sinon.restore();
  });

  it('should throw an error when transaction options is undefined', async () => {
    const stakeRequestHash = web3.utils.sha3('dummy');
    const txOptions = undefined;

    await AssertAsync.reject(
      gatewayComposer.revokeStakeRequest(stakeRequestHash, txOptions),
      'Invalid transaction options: undefined.',
    );
  });

  it('should throw an error when account address is undefined', async () => {
    const stakeRequestHash = web3.utils.sha3('dummy');
    const txOptions = {};
    await AssertAsync.reject(
      gatewayComposer.revokeStakeRequest(stakeRequestHash, txOptions),
      `Invalid from address ${txOptions.from} in transaction options.`,
    );
  });

  it('should throw an error when account address is invalid', async () => {
    const stakeRequestHash = web3.utils.sha3('dummy');
    const txOptions = {
      from: '0x123',
    };
    await AssertAsync.reject(
      gatewayComposer.revokeStakeRequest(stakeRequestHash, txOptions),
      `Invalid from address ${txOptions.from} in transaction options.`,
    );
  });
});
