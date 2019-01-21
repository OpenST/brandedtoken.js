'use strict';

const index = require('../../index'),
  AbiBinProvider = index.AbiBinProvider,
  gatewayComposerContractName = 'GatewayComposer',
  brandedTokenContractName = 'BrandedToken';

/**
 * Performs BrandedToken staking through GatewayComposer.
 */
class StakeHelper {
  /**
   * StakeHelper constructor object.
   *
   * @param originWeb3 - Origin chain web3 address.
   * @param brandedTokenAddress - Branded Token contract address.
   * @param gatewayComposerAddress - Gateway composer contract address.
   * @param txOptions - Tx options.
   */
  constructor(originWeb3, brandedTokenAddress, gatewayComposerAddress, txOptions) {
    const oThis = this;
    oThis.originWeb3 = originWeb3;
    oThis.gatewayComposer = gatewayComposerAddress;
    oThis.brandedToken = brandedTokenAddress;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  perform() {
    // approveVT;
    // requestStake();
  }

  // TODO method to get mintBTAmountInWei from BT.

  /**
   * Performs request stake on GatewayComposer.
   *
   * @param owner - Owner of GatewayComposer contract.
   * @param stakeVTAmountInWei - ValueToken amount which is staked.
   * @param mintBTAmountInWei - Amount of BT amount which will be minted.
   * @param gatewayAddress - Gateway contract address.
   * @param beneficiary - The address in the auxiliary chain where the utility
   *                     tokens will be minted.
   * @param gasPrice - Gas price that staker is ready to pay to get the stake
   *                  and mint process done.
   * @param gasLimit - Gas limit that staker is ready to pay.
   * @param nonce -  Nonce of the staker address.
   * @param originWeb3 - Origin chain web3 object.
   * @param txOptions - Tx options.
   */
  requestStake(
    owner,
    stakeVTAmountInWei,
    mintBTAmountInWei,
    gatewayAddress,
    gasPrice,
    gasLimit,
    beneficiary,
    nonce,
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
      nonce,
      originWeb3,
      txOptions
    );

    let txReceipt = null;

    return txObject
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('receipt', function(receipt) {
        txReceipt = receipt;
        console.log('\t - Receipt:\n\x1b[2m', JSON.stringify(txReceipt), '\x1b[0m\n');
      })
      .on('error', function(error) {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      });
  }

  /**
   * Facilitator performs accept stake request.
   *
   * @param facilitator - Facilitator address.
   * @param stakeRequestHash - Stake request hash.
   * @param r - R of the signature.
   * @param s - S of the signature.
   * @param v - V of the signature.
   * @param originWeb3 - Origin chain web3 object.
   * @param txOptions - Transaction options.
   * @returns {PromiseLike<T> | Promise<T>} - Promise object
   */
  acceptStakeRequest(facilitator, stakeRequestHash, r, s, v, originWeb3, txOptions){
    const oThis = this;
    const txObject = oThis._acceptStakeRequestRawTx(facilitator, stakeRequestHash, r, s, v, originWeb3, txOptions);

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
      })
      .then(function(instance) {
        oThis.address = instance.options.address;
        console.log(`\t - ${ContractName} Contract Address:`, oThis.address);
        return txReceipt;
      });
  }

  /**
   * Facilitator performs accept stake request.
   *
   * @param facilitator - Facilitator address.
   * @param stakeRequestHash - Stake request hash.
   * @param r - R of the signature.
   * @param s - S of the signature.
   * @param v - V of the signature.
   * @param originWeb3 - Origin chain web3 object.
   * @param txOptions - Transaction options.
   * @returns {PromiseLike<T> | Promise<T>} - Promise object
   */
  _acceptStakeRequestRawTx(facilitator, stakeRequestHash, r, s, v, originWeb3, txOptions){
    const oThis = this;

    const web3 = originWeb3 || oThis.originWeb3;
    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(ContractName);

    let defaultOptions = {
      from: facilitator,
      to: oThis.gatewayComposerAddress,
      gas: '8000000'
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    const Contract = new web3.eth.Contract(
      abi,
      oThis.gatewayComposerAddress,
      txOptions
    );

    console.log("_acceptStakeRequestRawTx: Returning txObject.");
    const txObject =  Contract.methods.acceptStakeRequest(
      stakeRequestHash,
      r,
      s,
      v
    );

    return txObject;
  }

  /**
   * Performs request stake on GatewayComposer.
   *
   * @param owner - Owner of GatewayComposer contract.
   * @param stakeVTAmountInWei - ValueToken amount which is staked.
   * @param mintBTAmountInWei - Amount of BT amount which will be minted.
   * @param gatewayAddress - Gateway contract address.
   * @param beneficiary - The address in the auxiliary chain where the utility
   *                     tokens will be minted.
   * @param gasPrice - Gas price that staker is ready to pay to get the stake
   *                  and mint process done.
   * @param gasLimit - Gas limit that staker is ready to pay.
   * @param nonce -  Nonce of the staker address.
   * @param originWeb3 - Origin chain web3 object.
   * @param txOptions - Tx options.
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

    console.log("Constructed txObject for GatewayComposer.requestStake.");
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
   * @param staker - Staker address.
   * @param originWeb3 - Origin chain web3 object.
   * @param txOptions - Tx options.
   * @returns {String} - Hash unique for each stake request.
   * @private
   */
  _getStakeRequestHashForStakerRawTx(staker, originWeb3, txOptions){
    const oThis = this;

    const web3 = originWeb3 || oThis.web3;
    const abi = abiBinProvider.getABI(gatewayComposerContractName);
    const contract = new web3.eth.Contract(abi, oThis.brandedTokenContractName, txOptions);

    console.log("Fetching stake request hash for staker");
    return contract.methods.stakeRequestHashes(staker).call();
  }

  /**
   * Returns StakeRequest for a given StakeRequestHash.
   * @param stakeRequestHash - Hash unique for each stake request.
   * @param originWeb3 - Origin chain web3 object.
   * @param txOptions - Tx options.
   * @returns {Object} - Includes information related with requested stake.
   * @private
   */
  _getStakeRequestRawTx(stakeRequestHash, originWeb3, txOptions){
    const oThis = this;

    const web3 = originWeb3 || oThis.web3;
    const abi = abiBinProvider.getABI(gatewayComposerContractName);
    const contract = new web3.eth.Contract(abi, oThis.brandedTokenContractName, txOptions);

    console.log("Fetching stake request hash for staker");
    return contract.methods.stakeRequestHashes(stakeRequestHash).call();
  }

}

module.exports = StakeHelper;
