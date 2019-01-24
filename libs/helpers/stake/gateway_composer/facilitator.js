'use strict';

const AbiBinProvider = require('./../AbiBinProvider'),
  gatewayComposerContractName = 'GatewayComposer';

const Mosaic = require('@openstfoundation/mosaic-tbd'),
  TypedDataClass = Mosaic.Utils.EIP712TypedData;

/**
 * Performs BrandedToken acceptStake through GatewayComposer.
 */
class Facilitator {
  /**
   * StakeHelper constructor object.
   *
   * @param originWeb3 Origin chain web3 address.
   * @param brandedToken Branded Token contract address.
   * @param gatewayComposer Gateway composer contract address.
   * @param facilitator Facilitator address.
   * @param txOptions - Tx options.
   */
  constructor(originWeb3, brandedToken, gatewayComposer, facilitator, txOptions) {
    const oThis = this;
    oThis.originWeb3 = originWeb3;
    oThis.gatewayComposer = gatewayComposer;
    oThis.brandedToken = brandedToken;
    oThis.facilitator = facilitator;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /**
   * Facilitator performs accept stake request.
   * Note: Add KYC worker account/private key in web3 wallet before calling acceptStakeRequest.
   *
   * @param stakeRequestHash Stake request hash unique for each stake.
   * @param stakeAmountInWei Stake amount in wei.
   * @param btStakeRequestNonce BrandedToken StakeRequest nonce.
   * @param workerAddress KYC worker address.
   * @param hashLock HashLock of facilitator.
   * @param originWeb3 Origin chain web3 object.
   * @param txOptions Tx options.
   */
  acceptStakeRequest(
    stakeRequestHash,
    stakeAmountInWei,
    btStakeRequestNonce,
    workerAddress,
    hashLock,
    originWeb3,
    txOptions
  ) {
    const oThis = this;
    const txObject = oThis._acceptStakeRequestRawTx(
      stakeRequestHash,
      stakeAmountInWei,
      btStakeRequestNonce,
      workerAddress,
      hashLock,
      originWeb3,
      txOptions
    );

    let txReceipt = null;
    return txObject
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('error', function(error) {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      })
      .on('receipt', function(receipt) {
        txReceipt = receipt;
        console.log('\t - Receipt:\n\x1b[2m', JSON.stringify(receipt), '\x1b[0m\n');
      });
  }

  /**
   * Facilitator performs accept stake request.
   * Note: Add KYC worker account/private key in web3 wallet before calling acceptStakeRequest.
   *
   * @param stakeRequestHash Stake request hash unique for a stake request.
   * @param stakeAmountInWei Stake amount in wei.
   * @param nonce BrandedToken StakeRequest nonce.
   * @param workerAddress KYC worker address.
   * @param hashLock HashLock of facilitator.
   * @param originWeb3 Origin chain web3 object.
   * @param txOptions Transaction options.
   * @returns {txObject} Tx object
   */
  _acceptStakeRequestRawTx(stakeRequestHash, stakeAmountInWei, nonce, workerAddress, hashLock, originWeb3, txOptions) {
    const oThis = this;

    const stakeRequestObject = {
      staker: oThis.gatewayComposer,
      stake: stakeAmountInWei,
      nonce: nonce
    };
    console.log('stakeRequestObject:', stakeRequestObject);
    const web3 = originWeb3 || oThis.originWeb3;
    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(gatewayComposerContractName);

    let defaultOptions = {
      from: oThis.facilitator,
      to: oThis.gatewayComposer,
      gas: '2000000'
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    const Contract = new web3.eth.Contract(abi, oThis.gatewayComposer, txOptions);

    const signature = oThis._getEIP712SignedData(stakeRequestObject, oThis.brandedToken, workerAddress, web3);
    const txObject = Contract.methods.acceptStakeRequest(
      stakeRequestHash,
      signature.r,
      signature.s,
      signature.v,
      hashLock
    );

    return txObject;
  }

  /**
   * Signs using EIP712 signer and returns signed data.
   *
   * @param stakeRequestObject Supports below format:
   *        {
   *          staker: "staker address",
   *          stakeAmountInWei: "stake Amount in wei",
   *          nonce: BT contract nonce.
   *        }
   * @param brandedToken BrandedToken contract address.
   * @param workerAddress Worker address.
   * @returns {Object} Signature format:
   *                  {
   *                    messageHash: signHash,
   *                    v: vrs[0],
   *                    r: vrs[1],
   *                    s: vrs[2],
   *                    signature: signature
   *                  }
   * @private
   */
  _getEIP712SignedData(stakeRequestObject, brandedToken, workerAddress, originWeb3) {
    const typedDataInput = {
      types: {
        EIP712Domain: [{ name: 'verifyingContract', type: 'address' }],
        StakeRequest: [
          { name: 'staker', type: 'address' },
          { name: 'stake', type: 'uint256' },
          { name: 'nonce', type: 'uint256' }
        ]
      },
      primaryType: 'StakeRequest',
      domain: {
        verifyingContract: brandedToken
      },
      message: {
        staker: stakeRequestObject.staker,
        stake: stakeRequestObject.stake,
        nonce: stakeRequestObject.nonce
      }
    };

    let typedDataInstance = TypedDataClass.fromObject(typedDataInput);
    console.log('typedDataInstance.getEIP712SignHash', typedDataInstance.getEIP712SignHash());

    if (typedDataInstance.validate() === true) {
      // It fetches account object from web3wallet.
      const workerAccountInstance = originWeb3.eth.accounts.wallet[workerAddress];
      const signature = workerAccountInstance.signEIP712TypedData(typedDataInstance);
      return signature;
    } else {
      throw new Error('TypedData is invalid');
    }
  }
}

module.exports = Facilitator;
