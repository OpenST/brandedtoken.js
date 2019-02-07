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
const Mosaic = require('@openstfoundation/mosaic-tbd');
const Package = require('./../../../index');

const Setup = Package.EconomySetup;
const { OrganizationHelper } = Setup;
const { assert } = chai;
const config = require('./../../utils/configReader');

const { StakeHelper } = Package.Helpers;
const { Staker } = Package.Helpers;
const { Facilitator } = Package.Helpers;
const MockContractsDeployer = require('./../../utils/MockContractsDeployer');

const abiBinProvider = MockContractsDeployer.abiBinProvider();
const BTHelper = Package.EconomySetup.BrandedTokenHelper;
const { GatewayComposerHelper } = Setup;
const { dockerSetup, dockerTeardown } = require('./../../utils/docker');

let originWeb3;
let owner;
let worker;
let caOrganization;
let caMockToken;
let stakeRequestHash;
let gatewayComposerAddress;
let facilitator;
let beneficiary;
let btStakeStruct;
let caGateway;
let btAddress;
let stakeHelperInstance;
let mockTokenAbi;
let deployerAddress;
let txOptions;
let signature;

describe('Performs BrandedToken staking through GatewayComposer', async () => {
  before(async () => {
    // Set up docker geth instance and retrieve RPC endpoint
    const { rpcEndpointOrigin } = await dockerSetup();
    originWeb3 = new Web3(rpcEndpointOrigin);
    const accountsOrigin = await originWeb3.eth.getAccounts();
    [deployerAddress, facilitator, beneficiary] = accountsOrigin;
    owner = deployerAddress;
    // [facilitator] = accountsOrigin[1];
    // [beneficiary] = accountsOrigin[2];
  });

  after(() => {
    dockerTeardown();
  });

  it('Deploys Organization contract', async () => {
    // Create worker address in wallet in order to sign EIP 712 hash
    await originWeb3.eth.accounts.wallet.create(1);
    worker = originWeb3.eth.accounts.wallet[0].address;

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

  it('Validates worker is whitelisted', async () => {
    const organizationContractInstance = Mosaic.Contracts.getOrganization(
      originWeb3,
      caOrganization,
    );
    const isWorkerResult = await organizationContractInstance.methods.isWorker(worker).call();
    assert.strictEqual(isWorkerResult, true, 'Make sure worker is whitelisted.');
  });

  it('Facilitator collects worker signature', async () => {
    // 1. Create TypedData
    const stakeRequestTypedData = stakeHelperInstance.getStakeRequestTypedData(
      config.stakeAmountInWei,
      btStakeStruct.nonce,
    );

    // 2. Generate EIP712 Signature.
    const workerAccountInstance = originWeb3.eth.accounts.wallet[worker];
    signature = await workerAccountInstance.signEIP712TypedData(stakeRequestTypedData);
  });

  it('Performs Facilitator.acceptStakeRequest', async () => {
    const hashLockInstance = Mosaic.Helpers.StakeHelper.createSecretHashLock();
    txOptions = {
      from: facilitator,
      gas: '7500000',
    };
    const gatewayContractInstance = Mosaic.Contracts.getEIP20Gateway(
      originWeb3,
      caGateway,
      txOptions,
    );
    const bountyAmountInWei = await gatewayContractInstance.methods.bounty().call();

    const facilitatorInstance = new Facilitator(
      originWeb3,
      caMockToken,
      btAddress,
      gatewayComposerAddress,
      facilitator,
    );
    await facilitatorInstance.acceptStakeRequest(
      stakeRequestHash,
      signature,
      bountyAmountInWei,
      mockTokenAbi,
      hashLockInstance.hashLock,
      originWeb3,
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
    const gcStakeStruct = await stakeHelperInstance._getGCStakeRequestRawTx(
      stakeRequestHash,
      originWeb3,
      txOptions,
    );
    assert.strictEqual(
      stakeRequestHash,
      config.nullBytes32,
      'BT.StakeRequestHash should be deleted for staker',
    );
    assert.strictEqual(
      btStakeStruct.stake,
      '0',
      'BT.StakeRequest struct should be deleted for input stakeRequestHash.',
    );
    assert.strictEqual(
      gcStakeStruct.stakeVT,
      '0',
      'GC.StakeRequest struct should be deleted for input stakeRequestHash.',
    );
  });
});
