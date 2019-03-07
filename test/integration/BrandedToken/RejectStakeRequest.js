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
const BN = require('bn.js');
const { assert } = require('chai');
const Mosaic = require('@openstfoundation/mosaic.js');

const Package = require('../../../index');
const MockContractsDeployer = require('../../utils/MockContractsDeployer');
const config = require('../../utils/configReader');
const shared = require('../shared');

const { GatewayComposerHelper } = Package.EconomySetup;
const { StakeHelper } = Package.Helpers;
const { Staker } = Package;
const BTHelper = Package.EconomySetup.BrandedTokenHelper;
const { Contracts } = Package;

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
let deployerAddress;
let txOptions;
let accountsOrigin;

describe('RejectStakeRequest', async () => {
  before(async () => {
    // Set up docker geth instance and retrieve RPC endpoint
    originWeb3 = shared.origin.web3;
    accountsOrigin = await originWeb3.eth.getAccounts();
    [deployerAddress, beneficiary] = accountsOrigin;
    // Deployer while deploying MockToken gets MAX ValueTokens.
    // Since owner is the deployer, owner also gets MAX ValueTokens.
    owner = deployerAddress;
  });

  it('Deploys Organization contract', async () => {
    // Create worker address in wallet in order to sign EIP 712 hash
    //    and fund in order to execute rejectStakeRequest
    await originWeb3.eth.accounts.wallet.create(1);
    worker = originWeb3.eth.accounts.wallet[0].address;
    await originWeb3.eth.sendTransaction({
      from: accountsOrigin[1],
      to: worker,
      value: originWeb3.utils.toWei('1'),
    });

    const { Organization } = Mosaic.ContractInteract;
    const orgConfig = {
      deployer: deployerAddress,
      owner,
      admin: worker,
      workers: [worker],
      workerExpirationHeight: config.workerExpirationHeight,
    };
    const organizationContractInstance = await Organization.setup(originWeb3, orgConfig);
    caOrganization = organizationContractInstance.address;
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
      symbol: config.symbol,
      name: config.name,
      decimals: config.decimals,
      conversionRate: config.conversionRate,
      conversionRateDecimals: config.conversionRateDecimals,
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

  it('Verifies ValueToken balance of owner', async () => {
    const mockTokenInstance = new Mosaic.ContractInteract.EIP20Token(originWeb3, caMockToken);
    const balanceOfStaker = await mockTokenInstance.balanceOf(owner);
    const balanceOfStakerBN = new BN(balanceOfStaker);
    const stakeAmountBN = new BN(config.stakeAmountInWei);
    assert.strictEqual(balanceOfStakerBN.cmp(stakeAmountBN), 1, 'staker ValueToken balance should be greater/equal to stakeAmountInWei.');
  });

  it('Performs staker.requestStake', async () => {
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


    const stakerGatewayNonce = '1';

    const stakerInstance = new Staker(originWeb3, caMockToken, btAddress, gatewayComposerAddress);
    await stakerInstance.requestStake(
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
