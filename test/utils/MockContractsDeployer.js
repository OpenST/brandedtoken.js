// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

'use strict';

const path = require('path');
// __NOT_FOR_WEB__END__

const Package = require('../../index');

const AbiBinProvider = Package.AbiBinProvider;

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
    const abiBinProvider = oThis.abiBinProvider;
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
      .on('transactionHash', (transactionHash) => {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('error', (error) => {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      })
      .on('receipt', (receipt) => {
        txReceipt = receipt;
      })
      .then((instance) => {
        oThis.addresses[contractName] = instance.options.address;
        console.log(`\t - ${contractName} Contract Address:`, instance.options.address);
        return txReceipt;
      });
  }

  static abiBinProvider() {
    return (new AbiBinProvider(mockAbiFolder, mockBinFolder));
  }
}

module.exports = MockContractsDeployer;
