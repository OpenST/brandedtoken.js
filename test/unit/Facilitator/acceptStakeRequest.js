'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Facilitator = require('../../../lib/Facilitator');
const Spy = require('../../utils/Spy');
const AssertAsync = require('../../utils/AssertAsync');

describe('Facilitator.acceptStakeRequest()', () => {
  let facilitator;
  const valueToken = '0x0000000000000000000000000000000000000002';
  const brandedToken = '0x0000000000000000000000000000000000000003';
  const gatewayComposer = '0x0000000000000000000000000000000000000004';
  let originWeb3;

  beforeEach(() => {
    originWeb3 = new Web3();

    facilitator = new Facilitator(
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

    const fakeAcceptStakeReceipt = {
      status: true,
      transactionHash: originWeb3.utils.sha3('t2'),
    };

    const fakeValueTokenApprove = sinon.replace(
      facilitator.valueToken,
      'approve',
      sinon.fake.resolves(fakeApproveReceipt),
    );

    const fakeGatewayComposerAcceptStakeRequest = sinon.replace(
      facilitator.gatewayComposer,
      'acceptStakeRequest',
      sinon.fake.resolves(fakeAcceptStakeReceipt),
    );

    const stakeRequestHash = originWeb3.utils.sha3('dummy');
    const hashLock = originWeb3.utils.sha3('dummy');
    const signature = {
      r: 'r',
      s: 's',
      v: 'v',
    };
    const bountyInWei = '100';
    const txOptions = {
      from: '0x0000000000000000000000000000000000000002',
    };

    const receipts = await facilitator.acceptStakeRequest(
      stakeRequestHash,
      signature,
      bountyInWei,
      hashLock,
      txOptions,
    );

    assert.deepEqual(
      receipts.approveForBountyReceipt,
      fakeApproveReceipt,
      'Approve receipt must match',
    );

    assert.deepEqual(
      receipts.acceptStakeRequestReceipt,
      fakeAcceptStakeReceipt,
      'Accept stake receipt must match',
    );

    Spy.assert(fakeValueTokenApprove, 1, [[gatewayComposer, bountyInWei, txOptions]]);
    Spy.assert(
      fakeGatewayComposerAcceptStakeRequest, 1,
      [
        [
          stakeRequestHash,
          signature.r,
          signature.s,
          signature.v,
          hashLock,
          txOptions,
        ],
      ],
    );
  });

  it('should fail if approval for bounty fails', async () => {
    const fakeApproveReceipt = {
      status: false,
      transactionHash: originWeb3.utils.sha3('t1'),
    };


    const fakeValueTokenApprove = sinon.replace(
      facilitator.valueToken,
      'approve',
      sinon.fake.resolves(fakeApproveReceipt),
    );

    const stakeRequestHash = originWeb3.utils.sha3('dummy');
    const hashLock = originWeb3.utils.sha3('dummy');
    const signature = {
      r: 'r',
      s: 's',
      v: 'v',
    };
    const bountyInWei = '100';
    const txOptions = {
      from: '0x0000000000000000000000000000000000000002',
    };

    const expectedMessage = `Approval for bounty is failed with transactionHash: ${fakeApproveReceipt.transactionHash}`;

    AssertAsync.reject(
      facilitator.acceptStakeRequest(
        stakeRequestHash,
        signature,
        bountyInWei,
        hashLock,
        txOptions,
      ),
      expectedMessage,
    );


    Spy.assert(fakeValueTokenApprove, 1, [[gatewayComposer, bountyInWei, txOptions]]);
  });

  it('should fail if acceptStakeRequest fails', async () => {
    const fakeApproveReceipt = {
      status: true,
      transactionHash: originWeb3.utils.sha3('t1'),
    };

    const fakeAcceptStakeReceipt = {
      status: false,
      transactionHash: originWeb3.utils.sha3('t2'),
    };

    const fakeValueTokenApprove = sinon.replace(
      facilitator.valueToken,
      'approve',
      sinon.fake.resolves(fakeApproveReceipt),
    );

    const fakeGatewayComposerAcceptStakeRequest = sinon.replace(
      facilitator.gatewayComposer,
      'acceptStakeRequest',
      sinon.fake.resolves(fakeAcceptStakeReceipt),
    );

    const stakeRequestHash = originWeb3.utils.sha3('dummy');
    const hashLock = originWeb3.utils.sha3('dummy');
    const signature = {
      r: 'r',
      s: 's',
      v: 'v',
    };
    const bountyInWei = '100';
    const txOptions = {
      from: '0x0000000000000000000000000000000000000002',
    };

    await AssertAsync.reject(
      facilitator.acceptStakeRequest(
        stakeRequestHash,
        signature,
        bountyInWei,
        hashLock,
        txOptions,
      ),
      `Accept stake request failed with transactionHash: ${fakeAcceptStakeReceipt.transactionHash}`,
    );

    Spy.assert(fakeValueTokenApprove, 1, [[gatewayComposer, bountyInWei, txOptions]]);
    Spy.assert(
      fakeGatewayComposerAcceptStakeRequest, 1,
      [
        [
          stakeRequestHash,
          signature.r,
          signature.s,
          signature.v,
          hashLock,
          txOptions,
        ],
      ],
    );
  });
});
