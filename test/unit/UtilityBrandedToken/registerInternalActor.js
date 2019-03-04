'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const UtilityToken = require('../../../lib/ContractInteract/UtilityBrandedToken');
const Spy = require('../../utils/Spy');
const Utils = require('../../../utils/Utils');
const AssertAsync = require('../../utils/AssertAsync');

describe('UtilityToken.registerInternalActor()', () => {
  let web3;
  let utilityTokenAddress;
  let utilityToken;

  beforeEach(() => {
    web3 = new Web3();
    utilityTokenAddress = '0x0000000000000000000000000000000000000002';
    utilityToken = new UtilityToken(web3, utilityTokenAddress);
  });

  it('should register internal actors', async () => {
    const mockRawTx = 'mockRawTx';

    const rawTx = sinon.replace(
      utilityToken,
      'registerInternalActorRawTx',
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
    const addresses = ['0x0000000000000000000000000000000000000002', '0x0000000000000000000000000000000000000005'];
    const response = await utilityToken.registerInternalActor(
      addresses,
      txOptions,
    );
    assert.isTrue(
      response,
      'Request stake should return true',
    );
    Spy.assert(rawTx, 1, [[addresses]]);
    Spy.assert(spySendTransaction, 1, [[mockRawTx, txOptions]]);
    sinon.restore();
  });


  it('should throw an error when transaction options is undefined', async () => {
    const addresses = ['0x0000000000000000000000000000000000000002', '0x0000000000000000000000000000000000000005'];
    const txOptions = undefined;

    await AssertAsync.reject(
      utilityToken.registerInternalActor(addresses, txOptions),
      'Invalid transaction options: undefined.',
    );
  });

  it('should throw an error when account address is undefined', async () => {
    const addresses = ['0x0000000000000000000000000000000000000002', '0x0000000000000000000000000000000000000005'];
    const txOptions = {};
    await AssertAsync.reject(
      utilityToken.registerInternalActor(addresses, txOptions),
      `Invalid from address ${txOptions.from} in transaction options.`,
    );
  });

  it('should throw an error when account address is invalid', async () => {
    const addresses = ['0x0000000000000000000000000000000000000002', '0x0000000000000000000000000000000000000005'];
    const txOptions = {
      from: '0x123',
    };
    await AssertAsync.reject(
      utilityToken.registerInternalActor(addresses, txOptions),
      `Invalid from address ${txOptions.from} in transaction options.`,
    );
  });
});
