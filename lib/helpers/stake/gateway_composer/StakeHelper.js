'use strict';

const AbiBinProvider = require('../../../AbiBinProvider'),
  gatewayComposerContractName = 'GatewayComposer',
  brandedTokenContractName = 'BrandedToken';

const Mosaic = require('@openstfoundation/mosaic-tbd'),
  TypedDataClass = Mosaic.Utils.EIP712TypedData;

/**
 * Performs BrandedToken staking through GatewayComposer.
 */
class StakeHelper {
  /**
   * StakeHelper constructor object.
   *
   * @param originWeb3 Origin chain web3 address.
   * @param brandedToken Branded Token contract address.
   * @param gatewayComposer Gateway composer contract address.
   */
  constructor(originWeb3, brandedToken, gatewayComposer) {
    const oThis = this;
    oThis.originWeb3 = originWeb3;
    oThis.gatewayComposer = gatewayComposer;
    oThis.brandedToken = brandedToken;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /**
   * Returns the amount of branded tokens equivalent to a given amount of value tokens.
   *
   * @param vtAmountInWei ValueToken amount to convert.
   * @param brandedTokenContractAddress BrandedToken contract address.
   * @param originWeb3 Origin chain web3 address.
   * @param txOptions Tx options.
   */
  convertToBTToken(vtAmountInWei, brandedTokenContractAddress, originWeb3, txOptions) {
    const oThis = this;

    const web3 = originWeb3 || oThis.originWeb3;
    const brandedToken = brandedTokenContractAddress || oThis.brandedToken;
    const abi = oThis.abiBinProvider.getABI(brandedTokenContractName);
    const contract = new web3.eth.Contract(abi, brandedToken, txOptions);

    console.log('Getting Branded tokens equivalent to Value tokens');
    return contract.methods.convertToBrandedTokens(vtAmountInWei).call();
  }

  /**
   * Approve gateway composer for ValueToken.
   *
   * @param valueTokenContractAddress Value token contract address.
   * @param valueTokenAbi Value token ABI.
   * @param amountInWei Amount to approve.
   * @param originWeb3 Origin chain web3.
   * @param txOptions Tx options.
   */
  approveForValueToken(valueTokenContractAddress, valueTokenAbi, amountInWei, originWeb3, txOptions) {
    const oThis = this;

    const web3 = originWeb3 || oThis.originWeb3;

    if (valueTokenAbi.length == 0) {
      throw Error('Value token abi is not provided');
    }
    const contract = new web3.eth.Contract(valueTokenAbi, valueTokenContractAddress, txOptions);

    const txObject = contract.methods.approve(oThis.gatewayComposer, amountInWei);
    let txReceipt;

    return txObject
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash  of approveForValueToken method :', transactionHash);
      })
      .on('receipt', function(receipt) {
        txReceipt = receipt;
        console.log('\t - Receipt of approveForValueToken method:\n\x1b[2m', JSON.stringify(txReceipt), '\x1b[0m\n');
      })
      .on('error', function(error) {
        console.log('\t !! Error from approveForValueToken method!!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      });
  }

  /**
   * Approve gateway composer address for bounty amount.
   *
   * @param facilitator Facilitator address.
   * @param bountyInWei Bounty amount in wei's that needs to be approved.
   * @param valueTokenContractAddress Value token contract address.
   * @param valueTokenAbi Value token abi.
   * @param originWeb3 Origin chain web3.
   */
  approveForBounty(facilitator, bountyInWei, valueTokenContractAddress, valueTokenAbi, originWeb3) {
    const oThis = this;

    const web3 = originWeb3 || oThis.originWeb3;

    if (valueTokenAbi.length == 0) {
      throw Error('Value token abi is not provided');
    }

    let txOptions = {
      from: facilitator,
      to: oThis.gatewayComposer,
      gas: '500000'
    };

    let txReceipt = null;

    const contract = new web3.eth.Contract(valueTokenAbi, valueTokenContractAddress, txOptions);
    let txObject = contract.methods.approve(oThis.gatewayComposer, bountyInWei);

    return txObject
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash of approveForBounty:', transactionHash);
      })
      .on('receipt', function(receipt) {
        txReceipt = receipt;
        console.log('\t - Receipt of approveForBounty:\n\x1b[2m', JSON.stringify(txReceipt), '\x1b[0m\n');
      })
      .on('error', function(error) {
        console.log('\t !! Error of approveForBounty!!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      });
  }

  /**
   * Performs request stake on GatewayComposer.
   *
   * @param owner Owner of GatewayComposer contract.
   * @param stakeVTAmountInWei ValueToken amount which is staked.
   * @param mintBTAmountInWei Amount of BT amount which will be minted.
   * @param gatewayAddress Gateway contract address.
   * @param beneficiary The address in the auxiliary chain where the utility
   *                     tokens will be minted.
   * @param gasPrice Gas price that staker is ready to pay to get the stake
   *                  and mint process done.
   * @param gasLimit Gas limit that staker is ready to pay.
   * @param stakerGatewayNonce Nonce of the staker address stored in Gateway.
   * @param originWeb3 Origin chain web3 object.
   * @param txOptions Tx options.
   */
  requestStake(
    owner,
    stakeVTAmountInWei,
    mintBTAmountInWei,
    gatewayAddress,
    gasPrice,
    gasLimit,
    beneficiary,
    stakerGatewayNonce,
    originWeb3,
    txOptions
  ) {
    const oThis = this;
    const txObject = oThis._requestStakeRawTx(
      owner,
      stakeVTAmountInWei,
      mintBTAmountInWei,
      gatewayAddress,
      beneficiary,
      gasPrice,
      gasLimit,
      stakerGatewayNonce,
      originWeb3,
      txOptions
    );

    let txReceipt = null;

    return txObject
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash  of request stake:', transactionHash);
      })
      .on('receipt', function(receipt) {
        txReceipt = receipt;
        console.log('\t - Receipt of requestStake:\n\x1b[2m', JSON.stringify(txReceipt), '\x1b[0m\n');
      })
      .on('error', function(error) {
        console.log('\t !! Error for requestStake!!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      });
  }

  /**
   * Facilitator performs accept stake request.
   * Note: Add KYC worker account/private key in web3 wallet before calling acceptStakeRequest.
   *
   * @param stakeRequestHash Stake request hash unique for each stake.
   * @param stakeAmountInWei Stake amount in wei.
   * @param btStakeRequestNonce BrandedToken StakeRequest nonce.
   * @param facilitator Facilitator address.
   * @param workerAddress KYC worker address.
   * @param hashLock HashLock of facilitator.
   * @param originWeb3 Origin chain web3 object.
   * @param txOptions Tx options.
   */
  acceptStakeRequest(
    stakeRequestHash,
    stakeAmountInWei,
    btStakeRequestNonce,
    facilitator,
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
      facilitator,
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
   * @param facilitator Facilitator address.
   * @param workerAddress KYC worker address.
   * @param hashLock HashLock of facilitator.
   * @param originWeb3 Origin chain web3 object.
   * @param txOptions Transaction options.
   * @returns {txObject} Tx object
   */
  _acceptStakeRequestRawTx(
    stakeRequestHash,
    stakeAmountInWei,
    nonce,
    facilitator,
    workerAddress,
    hashLock,
    originWeb3,
    txOptions
  ) {
    const oThis = this;

    const stakeRequestObject = {
      staker: oThis.gatewayComposer,
      stake: stakeAmountInWei,
      nonce: nonce
    };
    const web3 = originWeb3 || oThis.originWeb3;
    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(gatewayComposerContractName);

    let defaultOptions = {
      from: facilitator,
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

  /**
   * Performs request stake on GatewayComposer.
   *
   * @param owner Owner of GatewayComposer contract.
   * @param stakeVTAmountInWei ValueToken amount which is staked.
   * @param mintBTAmountInWei Amount of BT amount which will be minted.
   * @param gatewayAddress Gateway contract address.
   * @param beneficiary The address in the auxiliary chain where the utility
   *                     tokens will be minted.
   * @param gasPrice Gas price that staker is ready to pay to get the stake
   *                  and mint process done.
   * @param gasLimit Gas limit that staker is ready to pay.
   * @param nonce Nonce of the staker address.
   * @param originWeb3 Origin chain web3 object.
   * @param txOptions Tx options.
   * @private
   */
  _requestStakeRawTx(
    owner,
    stakeVTAmountInWei,
    mintBTAmountInWei,
    gatewayAddress,
    beneficiary,
    gasPrice,
    gasLimit,
    nonce,
    originWeb3,
    txOptions
  ) {
    const oThis = this;

    const web3 = originWeb3 || oThis.originWeb3;
    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(gatewayComposerContractName);

    let defaultOptions = {
      from: owner,
      to: oThis.gatewayComposer,
      gas: '8000000'
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    const contract = new web3.eth.Contract(abi, oThis.gatewayComposer, txOptions);

    console.log('Constructed txObject for GatewayComposer.requestStake.');
    const txObject = contract.methods.requestStake(
      stakeVTAmountInWei,
      mintBTAmountInWei,
      gatewayAddress,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce
    );

    return txObject;
  }

  /**
   * Returns stakeRequestHash for staker address.
   *
   * @param staker Staker address.
   * @param originWeb3 Origin chain web3 object.
   * @param txOptions Tx options.
   * @returns {String} Request hash for the staker.
   * @private
   */
  _getStakeRequestHashForStakerRawTx(staker, originWeb3, txOptions) {
    const oThis = this;

    const web3 = originWeb3 || oThis.web3;

    const abi = oThis.abiBinProvider.getABI(brandedTokenContractName);

    const contract = new web3.eth.Contract(abi, oThis.brandedToken, txOptions);

    return contract.methods.stakeRequestHashes(staker).call();
  }

  /**
   * Returns StakeRequest for a given StakeRequestHash.
   *
   * @param stakeRequestHash Hash of the requests done by the staker.
   * @param originWeb3 Origin chain web3 object.
   * @param txOptions Tx options.
   * @returns {Object} Struct containing stake information.
   * @private
   */
  _getStakeRequestRawTx(stakeRequestHash, originWeb3, txOptions) {
    const oThis = this;

    const web3 = originWeb3 || oThis.web3;

    const abi = oThis.abiBinProvider.getABI(brandedTokenContractName);
    const contract = new web3.eth.Contract(abi, oThis.brandedToken, txOptions);

    return contract.methods.stakeRequests(stakeRequestHash).call();
  }

  /**
   * Returns StakeRequest for a given StakeRequestHash.
   *
   * @param stakeRequestHash Hash of the requests done by the staker.
   * @param originWeb3 Origin chain web3 object.
   * @param txOptions Tx options.
   * @returns {Object} Struct containing stake information.
   * @private
   */
  _getGCStakeRequestRawTx(stakeRequestHash, originWeb3, txOptions) {
    const oThis = this;

    const web3 = originWeb3 || oThis.web3;

    const abi = oThis.abiBinProvider.getABI(gatewayComposerContractName);
    const contract = new web3.eth.Contract(abi, oThis.gatewayComposer, txOptions);

    return contract.methods.stakeRequests(stakeRequestHash).call();
  }
}

module.exports = StakeHelper;
