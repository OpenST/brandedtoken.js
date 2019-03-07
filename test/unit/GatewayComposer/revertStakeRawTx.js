'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../utils/Spy');
const GatewayComposer = require('../../../lib/ContractInteract/GatewayComposer');
const AssertAsync = require('../../utils/AssertAsync');

describe('GatewayComposer.revertStakeRawTx()', () => {
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
      'revertStake',
      sinon.fake.resolves(mockTx),
    );

    const gatewayAddress = '0x0000000000000000000000000000000000000001';
    const penalty = '2';
    const messageHash = web3.utils.sha3('dummy');

    const response = await gatewayComposer.revertStakeRawTx(
      gatewayAddress,
      penalty,
      messageHash,
    );

    assert.strictEqual(
      response,
      mockTx,
      'It must return correct raw tx',
    );

    Spy.assert(spyRawTx, 1, [[gatewayAddress, penalty, messageHash]]);
    sinon.restore();
  });

  it('should throw an error when messageHash is invalid', async () => {
    const gatewayAddress = '0x0000000000000000000000000000000000000001';
    const penalty = '2';
    const messageHash = undefined;

    await AssertAsync.reject(
      gatewayComposer.revertStakeRawTx(
        gatewayAddress,
        penalty,
        messageHash,
      ),
      `Invalid messageHash: ${messageHash}.`,
    );
  });

  it('should throw an error when address is invalid', async () => {
    const gatewayAddress = '0x123';
    const penalty = '2';
    const messageHash = web3.utils.sha3('1');

    await AssertAsync.reject(
      gatewayComposer.revertStakeRawTx(
        gatewayAddress,
        penalty,
        messageHash,
      ),
      `Invalid gateway address: ${gatewayAddress}.`,
    );
  });

  it('should throw an error when penalty is invalid', async () => {
    const gatewayAddress = '0x0000000000000000000000000000000000000001';
    const penalty = undefined;
    const messageHash = web3.utils.sha3('1');

    await AssertAsync.reject(
      gatewayComposer.revertStakeRawTx(
        gatewayAddress,
        penalty,
        messageHash,
      ),
      `Invalid penalty: ${penalty}.`,
    );
  });
});
