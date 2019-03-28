'use strict';

const path = require('path');
const fs = require('fs');

const Package = require('../../index');

const { AbiBinProvider } = Package;
const mockAbiFolder = path.resolve(__dirname, './mock-contracts/abi');
const mockBinFolder = path.resolve(__dirname, './mock-contracts/bin');

class MockContractsDeployer {
  constructor(deployer, web3) {
    const oThis = this;
    oThis.web3 = web3;
    oThis.deployer = deployer;
    oThis.abiBinProvider = MockContractsDeployer.abiBinProvider();

    oThis.addresses = {};
  }

  deployMockToken(web3, txOptions) {
    const oThis = this;
    return oThis.deploy('MockToken', web3, txOptions);
  }

  deployMockGatewayPass(web3, txOptions) {
    const oThis = this;
    return oThis.deploy('MockGatewayPass', web3, txOptions);
  }

  deploy(contractName, web3, txOptions) {
    const oThis = this;
    const web3Provider = web3 || oThis.web3;
    const { abiBinProvider } = oThis;
    const abi = abiBinProvider.getABI(contractName);
    const bin = abiBinProvider.getBIN(contractName);

    const defaultOptions = {
      from: oThis.deployer,
      gas: '7500000',
      gasPrice: '0x5B9ACA00',
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    const finalTxOptions = defaultOptions;

    const args = [];
    const contract = new web3Provider.eth.Contract(abi, null, finalTxOptions);
    const tx = contract.deploy(
      {
        data: bin,
        arguments: args,
      },
      finalTxOptions,
    );

    let txReceipt;
    return tx
      .send(finalTxOptions)
      .on('error', error => Promise.reject(error))
      .on('receipt', (receipt) => {
        txReceipt = receipt;
      })
      .then((instance) => {
        oThis.addresses[contractName] = instance.options.address;
        return txReceipt;
      });
  }

  static abiBinProvider() {
    const abiBinProvider = new AbiBinProvider();
    MockContractsDeployer.loadContracts(abiBinProvider, mockAbiFolder, mockBinFolder);
    return abiBinProvider;
  }

  static loadContracts(provider, abiFolderPath, binFolderPath) {
    if (!path.isAbsolute(abiFolderPath)) {
      throw new Error(
        '"abiFolderPath" is not Absolute. Please provide absolute path.',
      );
    }
    if (!path.isAbsolute(binFolderPath)) {
      throw new Error(
        '"binFolderPath" is not Absolute. Please provide absolute path.',
      );
    }

    // add all ABIs from abiFolderPath
    fs.readdirSync(abiFolderPath).forEach((abiFile) => {
      const contractName = path.basename(abiFile, path.extname(abiFile));
      const contractAbi = JSON.parse(
        fs.readFileSync(path.join(abiFolderPath, abiFile)),
      );
      provider.addABI(contractName, contractAbi);
    });

    // add all bins from binFolderPath
    fs.readdirSync(binFolderPath).forEach((binFile) => {
      const contractName = path.basename(binFile, path.extname(binFile));
      const contractBin = fs.readFileSync(
        path.join(binFolderPath, binFile),
        'utf8',
      );
      provider.addBIN(contractName, contractBin);
    });
  }
}

module.exports = MockContractsDeployer;
