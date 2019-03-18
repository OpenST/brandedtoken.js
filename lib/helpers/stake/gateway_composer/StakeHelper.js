'use strict';

const Mosaic = require('@openst/mosaic.js');

const AbiBinProvider = require('../../../AbiBinProvider');
const Utils = require('../../../../utils/Utils');

const gatewayComposerContractName = 'GatewayComposer';
const brandedTokenContractName = 'BrandedToken';
const TypedDataClass = Mosaic.Utils.EIP712TypedData;

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
    Utils.deprecationNoticeStakeHelper();

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
    Utils.deprecationNoticeStakeHelper('convertToBTToken');

    const oThis = this;

    const web3 = originWeb3 || oThis.originWeb3;
    const brandedToken = brandedTokenContractAddress || oThis.brandedToken;
    const abi = oThis.abiBinProvider.getABI(brandedTokenContractName);
    const contract = new web3.eth.Contract(abi, brandedToken, txOptions);

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
  approveForValueToken(
    valueTokenContractAddress,
    valueTokenAbi,
    amountInWei,
    originWeb3,
    txOptions,
  ) {
    Utils.deprecationNoticeStakeHelper('approveForValueToken');

    const oThis = this;

    const web3 = originWeb3 || oThis.originWeb3;

    if (valueTokenAbi.length === 0) {
      throw Error('Value token abi is not provided');
    }
    const contract = new web3.eth.Contract(valueTokenAbi, valueTokenContractAddress, txOptions);

    const txObject = contract.methods.approve(oThis.gatewayComposer, amountInWei);

    return Utils.sendTransaction(txObject, txOptions);
  }

  /**
   * Approve gateway composer address for bounty amount.
   *
   * @param facilitator Facilitator address.
   * @param bountyInWei Bounty amount in wei's that needs to be approved.
   * @param valueTokenContractAddress Value token contract address.
   * @param valueTokenAbi Value token abi.
   * @param originWeb3 Origin chain web3.
   * @param txOptions Tx options.
   */
  approveForBounty(
    facilitator,
    bountyInWei,
    valueTokenContractAddress,
    valueTokenAbi,
    originWeb3,
    txOptions,
  ) {
    Utils.deprecationNoticeStakeHelper('approveForBounty');

    const oThis = this;

    const web3 = originWeb3 || oThis.originWeb3;

    if (valueTokenAbi.length === 0) {
      throw Error('Value token abi is not provided');
    }

    const defaultOptions = {
      from: facilitator,
      to: oThis.gatewayComposer,
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    const finalTxOptions = defaultOptions;

    const contract = new web3.eth.Contract(
      valueTokenAbi,
      valueTokenContractAddress,
      finalTxOptions,
    );
    const txObject = contract.methods.approve(oThis.gatewayComposer, bountyInWei);

    return Utils.sendTransaction(txObject, finalTxOptions);
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
    txOptions,
  ) {
    Utils.deprecationNoticeStakeHelper('requestStake');

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
      txOptions,
    );

    return Utils.sendTransaction(txObject, txOptions);
  }

  /**
   * Facilitator performs accept stake request.
   * Note: Add KYC worker account/private key in web3 wallet before calling acceptStakeRequest.
   *
   * @param stakeRequestHash Stake request hash unique for each stake.
   * @param signature EIP712 Signature object of KYC worker address generated by signing
   *        StakeRequest typed-data.
   *                  {
   *                    messageHash: signHash,
   *                    v: vrs[0],
   *                    r: vrs[1],
   *                    s: vrs[2],
   *                    signature: signature
   *                  }
   * @param facilitator Facilitator address.
   * @param hashLock HashLock of facilitator.
   * @param originWeb3 Origin chain web3 object.
   * @param txOptions Tx options.
   */
  acceptStakeRequest(stakeRequestHash, signature, facilitator, hashLock, originWeb3, txOptions) {
    Utils.deprecationNoticeStakeHelper('acceptStakeRequest');

    const oThis = this;

    const web3 = originWeb3 || oThis.originWeb3;

    // 1. Create Tx Object.
    const txObject = oThis._acceptStakeRequestRawTx(
      stakeRequestHash,
      signature,
      facilitator,
      hashLock,
      web3,
      txOptions,
    );

    return Utils.sendTransaction(txObject, txOptions);
  }

  /**
   * Returns EIP712TypedData StakeRequest Object.
   * @param stakeAmountInWei Stake amount in wei.
   * @param btStakeRequestNonce BrandedToken StakeRequest nonce.
   * @param [brandedToken] BrandedToken contract address.
   * @param [gatewayComposer] Gateway composer contract address.
   * @returns {EIP712TypedData} EIP712TypedData instance of StakeRequest
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
  getStakeRequestTypedData(stakeAmountInWei, btStakeRequestNonce, gatewayComposer, brandedToken) {
    Utils.deprecationNoticeStakeHelper('getStakeRequestTypedData');

    const oThis = this;
    const gatewayComposerAddr = gatewayComposer || oThis.gatewayComposer;
    const brandedTokenAddr = brandedToken || oThis.brandedToken;

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
        verifyingContract: brandedTokenAddr,
      },
      message: {
        staker: gatewayComposerAddr,
        stake: stakeAmountInWei,
        nonce: btStakeRequestNonce,
      },
    };

    const typedDataInstance = TypedDataClass.fromObject(typedDataInput);

    if (typedDataInstance.validate() === true) {
      return typedDataInstance;
    }
    throw new Error('StakeRequest TypedData is invalid');
  }

  /**
   * Facilitator performs accept stake request.
   * Note: Add KYC worker account/private key in web3 wallet before calling acceptStakeRequest.
   *
   * @param stakeRequestHash Stake request hash unique for a stake request.
   * @param signature EIP712 Signature object of KYC worker address generated by signing
   *        StakeRequest typed-data.
   * @param facilitator Facilitator address.
   * @param hashLock HashLock of facilitator.
   * @param [originWeb3] Origin chain web3 object.
   * @param [txOptions] Transaction options.
   * @returns {txObject} Tx object
   */
  _acceptStakeRequestRawTx(
    stakeRequestHash,
    signature,
    facilitator,
    hashLock,
    originWeb3,
    txOptions,
  ) {
    Utils.deprecationNoticeStakeHelper('_acceptStakeRequestRawTx');

    const oThis = this;

    const web3 = originWeb3 || oThis.originWeb3;
    const { abiBinProvider } = oThis;
    const abi = abiBinProvider.getABI(gatewayComposerContractName);

    const defaultOptions = {
      from: facilitator,
      to: oThis.gatewayComposer,
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    const finalTxOptions = defaultOptions;

    const Contract = new web3.eth.Contract(abi, oThis.gatewayComposer, finalTxOptions);

    const txObject = Contract.methods.acceptStakeRequest(
      stakeRequestHash,
      signature.r,
      signature.s,
      signature.v,
      hashLock,
    );

    return txObject;
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
    txOptions,
  ) {
    Utils.deprecationNoticeStakeHelper('_requestStakeRawTx');

    const oThis = this;

    const web3 = originWeb3 || oThis.originWeb3;
    const { abiBinProvider } = oThis;
    const abi = abiBinProvider.getABI(gatewayComposerContractName);

    const defaultOptions = {
      from: owner,
      to: oThis.gatewayComposer,
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    const finalTxOptions = defaultOptions;

    const contract = new web3.eth.Contract(abi, oThis.gatewayComposer, finalTxOptions);

    const txObject = contract.methods.requestStake(
      stakeVTAmountInWei,
      mintBTAmountInWei,
      gatewayAddress,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
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
    Utils.deprecationNoticeStakeHelper('_getStakeRequestHashForStakerRawTx');

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
    Utils.deprecationNoticeStakeHelper('_getStakeRequestRawTx');

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
    Utils.deprecationNoticeStakeHelper('_getGCStakeRequestRawTx');

    const oThis = this;

    const web3 = originWeb3 || oThis.web3;

    const abi = oThis.abiBinProvider.getABI(gatewayComposerContractName);
    const contract = new web3.eth.Contract(abi, oThis.gatewayComposer, txOptions);

    return contract.methods.stakeRequests(stakeRequestHash).call();
  }
}

module.exports = StakeHelper;
