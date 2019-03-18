'use strict';

const Web3 = require('web3');
const Mosaic = require('@openst/mosaic.js');
const sinon = require('sinon');
const { assert } = require('chai');

const Facilitator = require('../../../lib/Facilitator');

describe('Facilitator.constructor()', () => {
  it('should construct successfully', () => {
    const eip20TokenSpy = sinon.createStubInstance(Mosaic.ContractInteract.EIP20Token);

    console.log(eip20TokenSpy);
    const originWeb3 = new Web3();
    const valueToken = '0x0000000000000000000000000000000000000002';
    const brandedToken = '0x0000000000000000000000000000000000000003';
    const gatewayComposer = '0x0000000000000000000000000000000000000004';

    const facilitator = new Facilitator(
      originWeb3,
      valueToken,
      brandedToken,
      gatewayComposer,
    );

    assert.strictEqual(
      facilitator.originWeb3,
      originWeb3,
      'Origin web3 must match',
    );
    assert.strictEqual(
      facilitator.valueToken.address,
      valueToken,
      'Value token must match',
    );
    assert.strictEqual(
      facilitator.brandedToken,
      brandedToken,
      'Branded token must match',
    );
    assert.strictEqual(
      facilitator.gatewayComposerAddress,
      gatewayComposer,
      'Gateway composer address must match',
    );
  });
});
