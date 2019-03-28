'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Staker = require('../../../lib/Staker');
const Spy = require('../../utils/Spy');
const AssertAsync = require('../../utils/AssertAsync');

describe('Staker.requestStake()', () => {
  let staker;
  const valueToken = '0x0000000000000000000000000000000000000002';
  const brandedToken = '0x0000000000000000000000000000000000000003';
  const gatewayComposer = '0x0000000000000000000000000000000000000004';
  let originWeb3;

  beforeEach(() => {
    originWeb3 = new Web3();

    staker = new Staker(
      originWeb3,
      valueToken,
      brandedToken,
      gatewayComposer,
    );
  });

  it('should return valid receipts on success ', async () => {
    const fakeApproveReceipt = {
      status: true,
      transactionHash: originWeb3.utils.sha3('t1'),
    };

    const fakeRequestStakeReceipt = {
      status: true,
      transactionHash: originWeb3.utils.sha3('t2'),
    };

    const fakeValueTokenApprove = sinon.replace(
      staker.valueToken,
      'approve',
      sinon.fake.resolves(fakeApproveReceipt),
    );

    const fakeGatewayComposerRequestStakeRequest = sinon.replace(
      staker.gatewayComposer,
      'requestStake',
      sinon.fake.resolves(fakeRequestStakeReceipt),
    );

    const stakeVTAmountInWei = '100';
    const mintBTAmountInWei = '100';
    const gatewayAddress = '0x0000000000000000000000000000000000000001';
    const gasPrice = '100';
    const gasLimit = '100';
    const beneficiary = '0x0000000000000000000000000000000000000003';
    const stakerGatewayNonce = '1';
    const txOptions = {
      from: '0x0000000000000000000000000000000000000002',
    };

    const receipts = await staker.requestStake(
      stakeVTAmountInWei,
      mintBTAmountInWei,
      gatewayAddress,
      gasPrice,
      gasLimit,
      beneficiary,
      stakerGatewayNonce,
      txOptions,
    );

    assert.deepEqual(
      receipts.approveForValueTokenReceipt,
      fakeApproveReceipt,
      'Approve receipt must match',
    );

    assert.deepEqual(
      receipts.requestStakeReceipt,
      fakeRequestStakeReceipt,
      'Request stake receipt must match',
    );

    Spy.assert(fakeValueTokenApprove, 1, [[gatewayComposer, stakeVTAmountInWei, txOptions]]);
    Spy.assert(
      fakeGatewayComposerRequestStakeRequest, 1,
      [
        [
          stakeVTAmountInWei,
          mintBTAmountInWei,
          gatewayAddress,
          beneficiary,
          gasPrice,
          gasLimit,
          stakerGatewayNonce,
          txOptions,
        ],
      ],
    );
  });

  it('should fail if approval for value token fails', async () => {
    const fakeApproveReceipt = {
      status: false,
      transactionHash: originWeb3.utils.sha3('t1'),
    };

    const fakeValueTokenApprove = sinon.replace(
      staker.valueToken,
      'approve',
      sinon.fake.resolves(fakeApproveReceipt),
    );

    const stakeVTAmountInWei = '100';
    const mintBTAmountInWei = '100';
    const gatewayAddress = '0x0000000000000000000000000000000000000001';
    const gasPrice = '100';
    const gasLimit = '100';
    const beneficiary = '0x0000000000000000000000000000000000000003';
    const stakerGatewayNonce = '1';
    const txOptions = {
      from: '0x0000000000000000000000000000000000000002',
    };

    await AssertAsync.reject(
      staker.requestStake(
        stakeVTAmountInWei,
        mintBTAmountInWei,
        gatewayAddress,
        gasPrice,
        gasLimit,
        beneficiary,
        stakerGatewayNonce,
        txOptions,
      ),
      `Approval for value token is failed with transactionHash: ${fakeApproveReceipt.transactionHash}`,
    );

    Spy.assert(fakeValueTokenApprove, 1, [[gatewayComposer, stakeVTAmountInWei, txOptions]]);
  });

  it('should fail if acceptStakeRequest fails', async () => {
    const fakeApproveReceipt = {
      status: true,
      transactionHash: originWeb3.utils.sha3('t1'),
    };

    const fakeRequestStakeReceipt = {
      status: false,
      transactionHash: originWeb3.utils.sha3('t2'),
    };

    const fakeValueTokenApprove = sinon.replace(
      staker.valueToken,
      'approve',
      sinon.fake.resolves(fakeApproveReceipt),
    );

    const fakeGatewayComposerRequestStakeRequest = sinon.replace(
      staker.gatewayComposer,
      'requestStake',
      sinon.fake.resolves(fakeRequestStakeReceipt),
    );

    const stakeVTAmountInWei = '100';
    const mintBTAmountInWei = '100';
    const gatewayAddress = '0x0000000000000000000000000000000000000001';
    const gasPrice = '100';
    const gasLimit = '100';
    const beneficiary = '0x0000000000000000000000000000000000000003';
    const stakerGatewayNonce = '1';
    const txOptions = {
      from: '0x0000000000000000000000000000000000000002',
    };

    await AssertAsync.reject(
      staker.requestStake(
        stakeVTAmountInWei,
        mintBTAmountInWei,
        gatewayAddress,
        gasPrice,
        gasLimit,
        beneficiary,
        stakerGatewayNonce,
        txOptions,
      ),
      `Request stake is failed with transactionHash: ${fakeRequestStakeReceipt.transactionHash}`,
    );

    Spy.assert(fakeValueTokenApprove, 1, [[gatewayComposer, stakeVTAmountInWei, txOptions]]);
    Spy.assert(
      fakeGatewayComposerRequestStakeRequest, 1,
      [
        [
          stakeVTAmountInWei,
          mintBTAmountInWei,
          gatewayAddress,
          beneficiary,
          gasPrice,
          gasLimit,
          stakerGatewayNonce,
          txOptions,
        ],
      ],
    );
  });
});
