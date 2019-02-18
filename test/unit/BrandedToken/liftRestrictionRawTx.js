'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../utils/Spy');
const BrandedToken = require('../../../lib/ContractInteract/BrandedToken');
const AssertAsync = require('../../utils/AssertAsync');

describe('BrandedToken.liftRestrictionRawTx()', () => {
  it('should return correct raw tx', async () => {
    const web3 = new Web3();
    const tokenAddress = '0x0000000000000000000000000000000000000002';
    const brandedToken = new BrandedToken(web3, tokenAddress);

    const mockTx = 'mockTx';

    const spyRawTx = sinon.replace(
      brandedToken.contract.methods,
      'liftRestriction',
      sinon.fake.resolves(mockTx),
    );

    const addresses = ['0x0000000000000000000000000000000000000002'];
    const response = await brandedToken.liftRestrictionRawTx(addresses);

    assert.strictEqual(
      response,
      mockTx,
      'It must return correct raw tx',
    );

    Spy.assert(spyRawTx, 1, [[addresses]]);
  });

  it('should fail if addresses is not defined', async () => {
    const web3 = new Web3();
    const tokenAddress = '0x0000000000000000000000000000000000000002';
    const brandedToken = new BrandedToken(web3, tokenAddress);

    const addresses = undefined;
    await AssertAsync.reject(
      brandedToken.liftRestrictionRawTx(addresses),
      `At least one addresses must be defined : ${addresses}`,
    );
  });

  it('should fail if addresses length is zero', async () => {
    const web3 = new Web3();
    const tokenAddress = '0x0000000000000000000000000000000000000002';
    const brandedToken = new BrandedToken(web3, tokenAddress);

    const addresses = [];
    await AssertAsync.reject(
      brandedToken.liftRestrictionRawTx(addresses),
      `At least one addresses must be defined : ${addresses}`,
    );
  });
});
