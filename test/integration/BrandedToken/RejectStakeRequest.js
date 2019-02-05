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

// Load external packages
const chai = require('chai');

const Web3 = require('web3');

const Package = require('../../../index');

const Setup = Package.EconomySetup;

const { OrganizationHelper } = Setup;

const { assert } = chai;

const config = require('../../utils/configReader');

const StakeHelper = require('../../../lib/helpers/stake/gateway_composer/StakeHelper');

const Staker = require('../../../lib/helpers/stake/gateway_composer/Staker');

const MockContractsDeployer = require('../../utils/MockContractsDeployer');

const abiBinProvider = MockContractsDeployer.abiBinProvider();

const BTHelper = Package.EconomySetup.BrandedTokenHelper;

const { GatewayComposerHelper } = Setup;

const { Contracts } = Package;

const { dockerSetup, dockerTeardown } = require('../../utils/docker');

let originWeb3;

let owner;

let worker;

let caOrganization;

let caMockToken;

let stakeRequestHash;

let gatewayComposerAddress;

let beneficiary;

let btStakeStruct;

let caGateway;

let btAddress;

let stakeHelperInstance;

let mockTokenAbi;

let deployerAddress;

let txOptions;

let accountsOrigin;

describe('RejectStakeRequest', async () => {
  before(async () => {
    // Set up docker geth instance and retrieve RPC endpoint
    const { rpcEndpointOrigin } = await dockerSetup();
    originWeb3 = new Web3(rpcEndpointOrigin);
    accountsOrigin = await originWeb3.eth.getAccounts();
    deployerAddress = accountsOrigin[0];
    owner = deployerAddress;
    beneficiary = accountsOrigin[1];
  });

  after(() => {
    dockerTeardown();
  });

  it('Deploys Organization contract', async () => {
    // Create worker address in wallet in order to sign EIP 712 hash
    //    and fund in order to execute rejectStakeRequest
    await originWeb3.eth.accounts.wallet.create(1);
    worker = originWeb3.eth.accounts.wallet[0].address;
    await originWeb3.eth.sendTransaction({ from: accountsOrigin[2], to: worker, value: originWeb3.utils.toWei('1') });

    const orgHelper = new OrganizationHelper(originWeb3, caOrganization);
    const orgConfig = {
      deployer: deployerAddress,
      owner,
      workers: worker,
      workerExpirationHeight: '20000000',
    };
    await orgHelper.setup(orgConfig);
    caOrganization = orgHelper.address;
    assert.isNotNull(caOrganization, 'Organization contract address should not be null.');
  });

  it('Deploys EIP20Token contract', async () => {
    const deployerInstance = new MockContractsDeployer(deployerAddress, originWeb3);
    await deployerInstance.deployMockToken();
    caMockToken = deployerInstance.addresses.MockToken;
    assert.isNotNull(caMockToken, 'EIP20Token contract address should not be null.');
  });

  it('Deploys BrandedToken contract', async () => {
    const btHelperConfig = {
      deployer: deployerAddress,
      valueToken: caMockToken,
      symbol: 'BT',
      name: 'MyBrandedToken',
      decimals: '18',
      conversionRate: '1000',
      conversionRateDecimals: 5,
      organization: caOrganization,
    };

    const btDeployParams = {
      from: deployerAddress,
      gasPrice: config.gasPrice,
    };

    const btHelper = new BTHelper(originWeb3, null);
    const brandedTokenInstance = await btHelper.setup(btHelperConfig, btDeployParams);
    btAddress = brandedTokenInstance.contractAddress;
    assert.isNotNull(btAddress, 'BrandedToken contract address should not be null.');
  });

  it('Deploys GatewayComposer contract', async () => {
    const gcHelperConfig = {
      deployer: deployerAddress,
      valueToken: caMockToken,
      brandedToken: btAddress,
      owner,
    };

    const gcDeployParams = {
      from: deployerAddress,
      gasPrice: config.gasPrice,
    };

    const gcHelper = new GatewayComposerHelper(originWeb3, null);


    const gatewayComposerInstance = await gcHelper.setup(gcHelperConfig, gcDeployParams);

    gatewayComposerAddress = gatewayComposerInstance.contractAddress;
    assert.isNotNull(gatewayComposerAddress, 'GatewayComposer contract address should not be null.');
  });

  it('Deploys mock gateway contract', async () => {
    const deployerInstance = new MockContractsDeployer(deployerAddress, originWeb3);
    await deployerInstance.deployMockGatewayPass();
    caGateway = deployerInstance.addresses.MockGatewayPass;
    assert.isNotNull(caGateway, 'Gateway contract address should not be null.');
  });

  it('Performs staker.requestStake', async () => {
    mockTokenAbi = abiBinProvider.getABI('MockToken');
    stakeHelperInstance = new StakeHelper(originWeb3, btAddress, gatewayComposerAddress);

    txOptions = {
      from: owner,
      gas: '7500000',
    };
    const mintBTAmountInWei = await stakeHelperInstance.convertToBTToken(
      config.stakeAmountInWei,
      btAddress,
      originWeb3,
      txOptions,
    );


    const stakerGatewayNonce = 1;

    const stakerInstance = new Staker(originWeb3, caMockToken, btAddress, gatewayComposerAddress);
    await stakerInstance.requestStake(
      mockTokenAbi,
      owner,
      config.stakeAmountInWei,
      mintBTAmountInWei,
      caGateway,
      config.stakeGasPrice,
      config.stakeGasLimit,
      beneficiary,
      stakerGatewayNonce,
      txOptions,
    );

    stakeRequestHash = await stakeHelperInstance._getStakeRequestHashForStakerRawTx(
      gatewayComposerAddress,
      originWeb3,
      txOptions,
    );

    btStakeStruct = await stakeHelperInstance._getStakeRequestRawTx(
      stakeRequestHash,
      originWeb3,
      txOptions,
    );
    assert.strictEqual(gatewayComposerAddress, btStakeStruct.staker, 'Incorrect staker address');
  });

  it('Performs worker.rejectStakeRequest', async () => {
    const brandedToken = Contracts.getBrandedToken(originWeb3, btAddress);
    const tx = brandedToken.methods.rejectStakeRequest(stakeRequestHash);

    txOptions = {
      from: worker,
      gas: '7500000',
    };

    return tx
      .send(txOptions)
      .on('transactionHash', (transactionHash) => {
        console.log('\t - transaction hash of reject stake request:', transactionHash);
      })
      .on('error', (error) => {
        console.log('\t !! Error for requestStake!!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      });
  });
});
