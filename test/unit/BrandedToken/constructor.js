'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../utils/Spy');
const Contracts = require('../../../lib/Contracts');
const BrandedToken = require('../../../lib/ContractInteract/BrandedToken');

describe('BrandedToken.constructor()', () => {
  let web3;
  let
    tokenAddress;
  beforeEach(() => {
    web3 = new Web3();
    tokenAddress = '0x0000000000000000000000000000000000000002';
  });
  it('should construct with correct parameter', async () => {
    const fakeInstance = sinon.fake();
    const spyContract = sinon.replace(
      Contracts,
      'getBrandedToken',
      sinon.fake.returns(fakeInstance),
    );

    const instance = new BrandedToken(web3, tokenAddress);

    assert.strictEqual(
      tokenAddress,
      instance.address,
      'Address must match',
    );

    assert.strictEqual(
      web3,
      instance.web3,
      'Web3 instance must match',
    );
    Spy.assert(spyContract, 1, [[web3, tokenAddress]]);
    sinon.restore();
  });

  it('should throw an error when getBrandedToken returns undefined object', async () => {
    const spyContract = sinon.replace(
      Contracts,
      'getBrandedToken',
      sinon.fake.returns(undefined),
    );

    const errorMessage = `Could not load utility branded token contract for: ${tokenAddress}`;
    assert.throws(() => {
      BrandedToken(web3, tokenAddress);
    },
    errorMessage);

    Spy.assert(spyContract, 1, [[web3, tokenAddress]]);
    sinon.restore();
  });

  it('should throw an error when web3 object is undefined', async () => {
    assert.throws(() => {
      BrandedToken(undefined, tokenAddress);
    }, /Mandatory Parameter 'web3' is missing or invalid/);
  });

  it('should throw an error when token contract address is undefined', async () => {
    assert.throws(() => {
      BrandedToken(web3, undefined);
    }, /Mandatory Parameter 'address' is missing or invalid./);
  });
});
