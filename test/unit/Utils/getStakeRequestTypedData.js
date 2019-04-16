const { assert } = require('chai');
const sinon = require('sinon');
const Mosaic = require('@openst/mosaic.js');

const { EIP712TypedData: TypedDataClass } = Mosaic.Utils;

const Utils = require('../../../utils/Utils');
const Spy = require('../../utils/Spy');

describe('Utils.getStakeRequestTypedData()', () => {
  const stakeAmountInWei = '100';
  const btStakeRequestNonce = 1;
  const gatewayComposerAddress = '0x0000000000000000000000000000000000000002';
  const brandedTokenAddress = '0x0000000000000000000000000000000000000003';

  it('should pass for valid type data', () => {
    const fakeTypedData = {
      validate: () => true,
    };

    const fromObjectSpy = sinon.replace(
      TypedDataClass,
      'fromObject',
      sinon.fake.returns(fakeTypedData),
    );

    Utils.getStakeRequestTypedData(
      stakeAmountInWei,
      btStakeRequestNonce,
      gatewayComposerAddress,
      brandedTokenAddress,
    );

    const typedDataInput = {
      types: {
        EIP712Domain: [{ name: 'verifyingContract', type: 'address' }],
        StakeRequest: [
          { name: 'staker', type: 'address' },
          { name: 'stake', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
        ],
      },
      primaryType: 'StakeRequest',
      domain: {
        verifyingContract: brandedTokenAddress,
      },
      message: {
        staker: gatewayComposerAddress,
        stake: stakeAmountInWei,
        nonce: btStakeRequestNonce,
      },
    };
    Spy.assert(fromObjectSpy, 1, [[typedDataInput]]);
    sinon.restore();
  });

  it('should fail for invalid type data', () => {
    const fakeTypedData = {
      validate: () => false,
    };

    sinon.replace(
      TypedDataClass,
      'fromObject',
      sinon.fake.returns(fakeTypedData),
    );

    assert.throws(
      () => Utils.getStakeRequestTypedData(
        stakeAmountInWei,
        btStakeRequestNonce,
        gatewayComposerAddress,
        brandedTokenAddress,
      ),
      'StakeRequest TypedData is invalid',
    );

    sinon.restore();
  });
});
