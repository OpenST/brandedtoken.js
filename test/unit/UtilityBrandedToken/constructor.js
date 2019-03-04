'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const UtilityToken = require('../../../lib/ContractInteract/UtilityBrandedToken');
const Spy = require('../../utils/Spy');
const Contracts = require('../../../lib/Contracts');

describe('UtilityToken.constructor()', () => {
  let web3;
  let utilityTokenAddress;
  let utilityToken;

  beforeEach(() => {
    web3 = new Web3();
    utilityTokenAddress = '0x0000000000000000000000000000000000000002';
  });

  it('should construct UtilityToken object', () => {
    const instance = sinon.fake();
    const utilityTokenSpy = sinon.replace(
      Contracts,
      'getUtilityBrandedToken',
      sinon.fake.returns(instance),
    );

    utilityToken = new UtilityToken(web3, utilityTokenAddress);

    assert.strictEqual(
      utilityToken.address,
      utilityTokenAddress,
      'Utility contract address from contract must be equal to expected'
        + ' address.',
    );
    assert.strictEqual(
      utilityToken.contract,
      instance,
      'Contract instance must match.',
    );
    Spy.assert(utilityTokenSpy, 1, [[web3, utilityTokenAddress]]);
    sinon.restore();
  });

  it('should throw if invalid web3 object is passed', () => {
    assert.throws(
      () => new UtilityToken('web3', utilityTokenAddress),
      /Mandatory Parameter 'web3' is missing or invalid/,
    );
  });

  it('should throw if web3 object is undefined', () => {
    assert.throws(
      () => new UtilityToken(undefined, utilityTokenAddress),
      /Mandatory Parameter 'web3' is missing or invalid/,
    );
  });

  it('should throw if invalid contract address is passed', () => {
    assert.throws(
      () => new UtilityToken(web3, '0x123'),
      /Mandatory Parameter 'address' is missing or invalid./,
    );
  });

  it('should throw if undefined contract address is passed', () => {
    assert.throws(
      () => new UtilityToken(web3, undefined),
      /Mandatory Parameter 'address' is missing or invalid./,
    );
  });

  it('should throw if contract interact is undefined', () => {
    sinon.replace(Contracts, 'getUtilityBrandedToken', sinon.fake.returns(undefined));

    assert.throws(
      () => new UtilityToken(web3, utilityTokenAddress),
      `Could not load Utility contract for: ${utilityTokenAddress}`,
    );
    sinon.restore();
  });
});
