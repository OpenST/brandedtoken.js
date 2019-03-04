'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../utils/Spy');
const GatewayComposer = require('../../../lib/ContractInteract/GatewayComposer');
const AssertAsync = require('../../utils/AssertAsync');

describe('GatewayComposer.revokeStakeRequestRawTx()', () => {
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
      'revokeStakeRequest',
      sinon.fake.resolves(mockTx),
    );

    const stakeRequestHash = web3.utils.sha3('dummy');

    const response = await gatewayComposer.revokeStakeRequestRawTx(
      stakeRequestHash,
    );

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
      gatewayComposer.revokeStakeRequestRawTx(stakeRequestHash),
      `Invalid stakeRequestHash: ${stakeRequestHash}.`,
    );
  });
});
