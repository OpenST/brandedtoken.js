'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const UtilityToken = require('../../../lib/ContractInteract/UtilityBrandedToken');
const Spy = require('../../utils/Spy');
const AssertAsync = require('../../utils/AssertAsync');

describe('UtilityToken.registerInternalActorsRawTx()', () => {
  let web3;
  let utilityTokenAddress;
  let utilityToken;

  beforeEach(() => {
    web3 = new Web3();
    utilityTokenAddress = '0x0000000000000000000000000000000000000002';
    utilityToken = new UtilityToken(web3, utilityTokenAddress);
  });

  it('should return correct raw tx', async () => {
    const mockRawTx = 'mockRawTx';

    const spyContractMethod = sinon.replace(
      utilityToken.contract.methods,
      'registerInternalActors',
      sinon.fake.returns(mockRawTx),
    );

    const addresses = ['0x0000000000000000000000000000000000000002', '0x0000000000000000000000000000000000000005'];
    const response = await utilityToken.registerInternalActorsRawTx(
      addresses,
    );
    assert.strictEqual(
      response,
      mockRawTx,
      'Raw tx must match',
    );
    Spy.assert(spyContractMethod, 1, [[addresses]]);
    sinon.restore();
  });


  it('should fail if addresses is not defined', async () => {
    const addresses = undefined;
    await AssertAsync.reject(
      utilityToken.registerInternalActorsRawTx(addresses),
      `At least one addresses must be defined : ${addresses}`,
    );
  });

  it('should fail if addresses length is zero', async () => {
    const addresses = [];
    await AssertAsync.reject(
      utilityToken.registerInternalActorsRawTx(addresses),
      `At least one addresses must be defined : ${addresses}`,
    );
  });
});
