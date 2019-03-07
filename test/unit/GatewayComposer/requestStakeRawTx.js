'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../utils/Spy');
const AssertAsync = require('../../utils/AssertAsync');
const GatewayComposer = require('../../../lib/ContractInteract/GatewayComposer');

describe('GatewayComposer.requestStakeRawTx()', () => {
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
      'requestStake',
      sinon.fake.resolves(mockTx),
    );

    const stakeVT = '100';
    const mintBT = '100';
    const gateway = '0x0000000000000000000000000000000000000002';
    const beneficiary = '0x0000000000000000000000000000000000000003';
    const gasPrice = '1';
    const gasLimit = '1';
    const nonce = '1';
    const response = await gatewayComposer.requestStakeRawTx(
      stakeVT,
      mintBT,
      gateway,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
    );

    assert.strictEqual(
      response,
      mockTx,
      'It must return correct raw tx',
    );

    Spy.assert(spyRawTx, 1, [
      [stakeVT, mintBT, gateway, beneficiary, gasPrice, gasLimit, nonce],
    ]);
  });

  it('should throw for invalid stake amount', async () => {
    const stakeVT = '0';
    const mintBT = '100';
    const gateway = '0x0000000000000000000000000000000000000002';
    const beneficiary = '0x0000000000000000000000000000000000000003';
    const gasPrice = '1';
    const gasLimit = '1';
    const nonce = '1';

    await AssertAsync.reject(gatewayComposer.requestStakeRawTx(
      stakeVT,
      mintBT,
      gateway,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
    ),
    `Stake amount must be greater than zero: ${stakeVT}.`);
  });

  it('should throw for invalid mint amount', async () => {
    const stakeVT = '10';
    const mintBT = '0';
    const gateway = '0x0000000000000000000000000000000000000002';
    const beneficiary = '0x0000000000000000000000000000000000000003';
    const gasPrice = '1';
    const gasLimit = '1';
    const nonce = '1';

    await AssertAsync.reject(gatewayComposer.requestStakeRawTx(
      stakeVT,
      mintBT,
      gateway,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
    ),
    `Mint amount must be greater than zero: ${mintBT}.`);
  });

  it('should throw for invalid gateway address', async () => {
    const stakeVT = '10';
    const mintBT = '10';
    const gateway = '0x134';
    const beneficiary = '0x0000000000000000000000000000000000000003';
    const gasPrice = '1';
    const gasLimit = '1';
    const nonce = '1';

    await AssertAsync.reject(gatewayComposer.requestStakeRawTx(
      stakeVT,
      mintBT,
      gateway,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
    ),
    `Invalid gateway address: ${gateway}.`);
  });

  it('should throw for invalid beneficiary address', async () => {
    const stakeVT = '10';
    const mintBT = '10';
    const gateway = '0x0000000000000000000000000000000000000003';
    const beneficiary = '0x134';
    const gasPrice = '1';
    const gasLimit = '1';
    const nonce = '1';

    await AssertAsync.reject(gatewayComposer.requestStakeRawTx(
      stakeVT,
      mintBT,
      gateway,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
    ),
    `Invalid beneficiary address: ${beneficiary}.`);
  });

  it('should throw for invalid gasPrice', async () => {
    const stakeVT = '10';
    const mintBT = '10';
    const gateway = '0x0000000000000000000000000000000000000003';
    const beneficiary = '0x0000000000000000000000000000000000000002';
    const gasPrice = undefined;
    const gasLimit = '1';
    const nonce = '1';

    await AssertAsync.reject(gatewayComposer.requestStakeRawTx(
      stakeVT,
      mintBT,
      gateway,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
    ),
    `Invalid gas price: ${gasPrice}.`);
  });

  it('should throw for invalid gasLimit', async () => {
    const stakeVT = '10';
    const mintBT = '10';
    const gateway = '0x0000000000000000000000000000000000000003';
    const beneficiary = '0x0000000000000000000000000000000000000002';
    const gasPrice = '1';
    const gasLimit = undefined;
    const nonce = '1';

    await AssertAsync.reject(gatewayComposer.requestStakeRawTx(
      stakeVT,
      mintBT,
      gateway,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
    ),
    `Invalid gas limit: ${gasLimit}.`);
  });

  it('should throw for invalid nonce', async () => {
    const stakeVT = '10';
    const mintBT = '10';
    const gateway = '0x0000000000000000000000000000000000000003';
    const beneficiary = '0x0000000000000000000000000000000000000002';
    const gasPrice = '1';
    const gasLimit = '1';
    const nonce = undefined;

    await AssertAsync.reject(gatewayComposer.requestStakeRawTx(
      stakeVT,
      mintBT,
      gateway,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
    ),
    `Invalid nonce: ${nonce}.`);
  });
});
