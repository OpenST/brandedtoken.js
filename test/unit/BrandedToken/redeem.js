'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../utils/Spy');
const AssertAsync = require('../../utils/AssertAsync');
const BrandedToken = require('../../../lib/ContractInteract/BrandedToken');
const Utils = require('../../../utils/Utils');

describe('BrandedToken.redeem()', () => {
  let brandedToken;
  let web3;

  beforeEach(() => {
    web3 = new Web3();
    const tokenAddress = '0x0000000000000000000000000000000000000002';
    brandedToken = new BrandedToken(web3, tokenAddress);
  });

  it('should pass with correct params', async () => {
    const brandedTokens = '100';
    const mockRawTx = 'mockRawTx';

    const rawTx = sinon.replace(
      brandedToken,
      'redeemRawTx',
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
    const response = await brandedToken.redeem(
      brandedTokens,
      txOptions,
    );
    assert.isTrue(
      response,
      'Redeem should return true',
    );
    Spy.assert(rawTx, 1, [[brandedTokens]]);
    Spy.assert(spySendTransaction, 1, [[mockRawTx, txOptions]]);
    sinon.restore();
  });

  it('should throw an error when transaction options is undefined', async () => {
    const brandedTokens = '100';
    const txOptions = undefined;

    await AssertAsync.reject(
      brandedToken.redeem(brandedTokens, txOptions),
      'Invalid transaction options: undefined.',
    );
  });

  it('should throw an error when from address is undefined', async () => {
    const brandedTokens = '100';
    const txOptions = {};
    await AssertAsync.reject(
      brandedToken.redeem(brandedTokens, txOptions),
      `Invalid from address ${txOptions.from} in transaction options.`,
    );
  });
});
