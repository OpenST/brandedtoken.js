'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../utils/Spy');
const AssertAsync = require('../../utils/AssertAsync');
const BrandedToken = require('../../../lib/ContractInteract/BrandedToken');
const Utils = require('../../../utils/Utils');

describe('BrandedToken.requestStake()', () => {
  let brandedToken;

  beforeEach(() => {
    const web3 = new Web3();
    const tokenAddress = '0x0000000000000000000000000000000000000002';
    brandedToken = new BrandedToken(web3, tokenAddress);
  });

  it('should pass with correct params', async () => {
    const stakeAmount = '100';
    const mockRawTx = 'mockRawTx';

    const convertToBTSpy = sinon.replace(
      brandedToken,
      'convertToBrandedTokens',
      sinon.fake.returns(Promise.resolve(stakeAmount)),
    );

    const rawTxSpy = sinon.replace(
      brandedToken,
      'requestStakeRawTx',
      sinon.fake.returns(Promise.resolve(mockRawTx)),
    );

    const spySendTransaction = sinon.replace(
      Utils,
      'sendTransaction',
      sinon.fake.resolves(true),
    );
    const txOptions = {
      from: '0x0000000000000000000000000000000000000003',
    };
    const response = await brandedToken.requestStake(stakeAmount, txOptions);
    assert.isTrue(
      response,
      'Request stake should return true',
    );
    Spy.assert(convertToBTSpy, 1, [[stakeAmount]]);
    Spy.assert(rawTxSpy, 1, [[stakeAmount, stakeAmount]]);
    Spy.assert(spySendTransaction, 1, [[mockRawTx, txOptions]]);
    sinon.restore();
  });

  it('should throw an error when transaction options is undefined', async () => {
    const stakeAmount = '100';
    const txOptions = undefined;

    await AssertAsync.reject(
      brandedToken.requestStake(stakeAmount, txOptions),
      'Invalid transaction options: undefined.',
    );
  });

  it('should throw an error when account address is undefined', async () => {
    const stakeAmount = '100';
    const txOptions = {};
    await AssertAsync.reject(
      brandedToken.requestStake(stakeAmount, txOptions),
      `Invalid from address ${txOptions.from} in transaction options.`,
    );
  });

  it('should throw an error when account address is invalid', async () => {
    const stakeAmount = '100';
    const txOptions = {
      from: '0x123',
    };
    await AssertAsync.reject(
      brandedToken.requestStake(stakeAmount, txOptions),
      `Invalid from address ${txOptions.from} in transaction options.`,
    );
  });
});
