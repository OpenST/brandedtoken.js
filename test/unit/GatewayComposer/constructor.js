'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../utils/Spy');
const Contracts = require('../../../lib/Contracts');
const GatewayComposer = require('../../../lib/ContractInteract/GatewayComposer');

describe('GatewayComposer.constructor()', () => {
  let web3;
  let contractAddress;

  beforeEach(() => {
    web3 = new Web3();
    contractAddress = '0x0000000000000000000000000000000000000002';
  });
  it('should construct with correct parameter', async () => {
    const fakeInstance = sinon.fake();
    const spyContract = sinon.replace(
      Contracts,
      'getGatewayComposer',
      sinon.fake.returns(fakeInstance),
    );

    const instance = new GatewayComposer(web3, contractAddress);

    assert.strictEqual(
      contractAddress,
      instance.address,
      'Address must match',
    );

    assert.strictEqual(
      web3,
      instance.web3,
      'Web3 instance must match',
    );
    Spy.assert(spyContract, 1, [[web3, contractAddress]]);
    sinon.restore();
  });

  it('should throw an error when getGatewayComposer returns undefined object', async () => {
    const spyContract = sinon.replace(
      Contracts,
      'getGatewayComposer',
      sinon.fake.returns(undefined),
    );

    const errorMessage = `Could not load gateway composer contract for: ${contractAddress}`;
    assert.throws(() => {
      // eslint-disable-next-line no-new
      new GatewayComposer(web3, contractAddress);
    },
    errorMessage);

    Spy.assert(spyContract, 1, [[web3, contractAddress]]);
    sinon.restore();
  });

  it('should throw an error when web3 object is undefined', async () => {
    assert.throws(() => {
      // eslint-disable-next-line no-new
      new GatewayComposer(undefined, contractAddress);
    }, /Mandatory Parameter 'web3' is missing or invalid/);
  });

  it('should throw an error when token contract address is undefined', async () => {
    assert.throws(() => {
      // eslint-disable-next-line no-new
      new GatewayComposer(web3, undefined);
    }, /Mandatory Parameter 'address' is missing or invalid./);
  });
});
