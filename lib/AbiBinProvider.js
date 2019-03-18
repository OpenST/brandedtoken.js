'use strict';

const btContracts = require('@openst/brandedtoken-contracts');

/**
 * The class provides getter to get ABIs and BINs for different contracts.
 */
class AbiBinProvider {
  constructor() {
    this.custom = {};
  }

  /**
   * Getter to get ABI for a contract.
   *
   * @param {string} contractName Name of the contract.
   *
   * @returns {string} ABI JSON string.
   */
  getABI(contractName) {
    if (this.custom[contractName] && this.custom[contractName].abi) {
      return this.custom[contractName].abi;
    }

    if (btContracts[contractName] && btContracts[contractName].abi) {
      return btContracts[contractName].abi;
    }
    throw new Error(
      `Could not retrieve ABI for ${contractName}.`,
    );
  }

  /**
   * Getter to get BIN for a contract.
   *
   * @param {string} contractName Name of the contract.
   *
   * @returns {string} Binary string.
   */
  getBIN(contractName) {
    if (this.custom[contractName] && this.custom[contractName].bin) {
      return this.custom[contractName].bin;
    }

    if (btContracts[contractName] && btContracts[contractName].bin) {
      return btContracts[contractName].bin;
    }
    throw new Error(
      `Could not retrieve BIN for ${contractName}.`,
    );
  }

  /**
   * Method to add a custom abi for a contract.
   *
   * @param {string} contractName Name of the contract.
   * @param {string|Object} contractAbi ABI of the contract.
   */
  addABI(contractName, contractAbi) {
    let abi;

    if (typeof contractAbi === 'string') {
      abi = JSON.parse(contractAbi);
    } else if (typeof contractAbi === 'object') {
      abi = contractAbi;
    } else {
      throw new Error(
        `Couldn't add ABI for contract ${contractName}, content should be string or object`,
      );
    }

    if (!this.custom[contractName]) {
      this.custom[contractName] = {};
    }
    const contract = this.custom[contractName];

    if (!contract.abi) {
      contract.abi = abi;
    } else {
      throw new Error(
        `Abi for Contract Name ${contractName} already exists.`,
      );
    }
  }

  /**
   * Method to add a custom bin for a contract.
   *
   * @param {string} contractName Name of the contract.
   * @param {string} contractBin Bin of the the contract.
   */
  addBIN(contractName, contractBin) {
    if (typeof contractBin !== 'string') {
      throw new Error('Bin should be a string');
    }

    if (!this.custom[contractName]) {
      this.custom[contractName] = {};
    }
    const contract = this.custom[contractName];

    if (contract.bin) {
      throw new Error(
        `Bin for Contract Name ${contractName} already exists.`,
      );
    }

    contract.bin = contractBin;
  }
}

module.exports = AbiBinProvider;
