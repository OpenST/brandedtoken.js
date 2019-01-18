'use strict';

const AbiBinProvider = require('../../AbiBinProvider');

const ContractName = 'GatewayComposer';

class StakeHelper {

  constructor(){

  }

  perform(){

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

    let web3 = originWeb3 || oThis.originWeb3;
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

    console.log("_acceptStakeRequestRawTx: Returning txObject");
    const txObject =  Contract.methods.acceptStakeRequest(
      stakeRequestHash,
      r,
      s,
      v
    );

    return txObject;
  }

}
