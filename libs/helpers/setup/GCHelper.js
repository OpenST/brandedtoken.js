'use strict';

const AbiBinProvider = require('../../AbiBinProvider');

const ContractName = 'GatewayComposer';

/**
 * Performs setup and deployment related tasks.
 */
class GCHelper {
  /**
   * @param web3 - Web3 object.
   * @param address - GatewayComposer contract address.
   */
  constructor(web3, address) {
    const oThis = this;
    oThis.web3 = web3;
    oThis.address = address;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /**
   * @param config - Configurations for setup:
   *                 {
   *                  "deployer": config.deployerAddress,
   *                  "owner": config.staker,
   *                  "valueToken": config.simpleTokenContractAddress,
   *                  "brandedToken": config.brandedTokenContractAddress,
   *                  }
   * @param txOptions - Tx options.
   * @param web3 - Web3 object.
   * @returns {Promise} - Promise object.
   */
  setup(config, txOptions, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;

    GCHelper.validateSetupConfig(config);

    if (!txOptions) {
      txOptions = txOptions || {};
    }
    txOptions.gasPrice = 0;

    let deployParams = Object.assign({}, txOptions);
    deployParams.from = config.deployer;
    deployParams.gasPrice = 0; // TODO why gasPrice is 0

    let owner, valueToken, brandedToken;
    owner = config.owner;
    valueToken = config.valueToken;
    brandedToken = config.brandedToken;

    // Deploy the Contract
    let promiseChain = oThis.deploy(owner, valueToken, brandedToken, deployParams);

    return promiseChain;
  }

  /**
   * Performs validation of input methods.
   *
   * @param config - Configuration parameters.
   * @returns {boolean} - True on successful validation.
   */
  static validateSetupConfig(config) {
    console.log(`* Validating ${ContractName} Setup Config.`);
    if (!config) {
      throw new Error('Mandatory parameter "config" missing. ');
    }

    if (!config.owner) {
      throw new Error('Mandatory configuration "owner" missing. Set config.owner address');
    }

    if (!config.valueToken) {
      throw new Error('Mandatory configuration "valueToken" missing. Set config.valueToken address');
    }

    if (!config.brandedToken) {
      throw new Error('Mandatory configuration "brandedToken" missing. Set config.brandedToken address');
    }

    return true;
  }

  /**
   * Deploys Gateway Composer.
   * @param owner - Address of the staker on the value chain.
   * @param valueToken - EIP20Token address which is staked.
   * @param brandedToken - It's a value backed minted EIP20Token.
   * @param txOptions - Transaction options for flexibility.
   * @param web3 - Web3 object
   * @returns {PromiseLike<T> | Promise<T>} - Promise object.
   */
  deploy(owner, valueToken, brandedToken, txOptions, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;

    let tx = oThis._deployRawTx(owner, valueToken, brandedToken, txOptions, web3);

    console.log(`* Deploying ${ContractName} Contract`);
    let txReceipt;
    return tx
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
   * Returns raw transaction object.
   *
   * @param owner - Address of the staker on the value chain.
   * @param valueToken - EIP20Token address which is staked.
   * @param brandedToken - It's a value backed minted EIP20Token.
   * @param txOptions - Transaction options for flexibility.
   * @param web3 - Web3 object
   * @returns {PromiseLike<T>|Promise<T>|*} - Promise object.
   * @private
   */
  _deployRawTx(owner, valueToken, brandedToken, txOptions, web3) {
    const oThis = this;

    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(ContractName);
    const bin = abiBinProvider.getBIN(ContractName);

    let defaultOptions = {
      gas: '8000000'
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    let args = [owner, valueToken, brandedToken];

    const contract = new web3.eth.Contract(abi, null, txOptions);

    return contract.deploy(
      {
        data: bin,
        arguments: args
      },
      txOptions
    );
  }
}

module.exports = GCHelper;
