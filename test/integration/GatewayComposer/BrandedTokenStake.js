'use strict';

// Load external packages
const BN = require('bn.js');
const { assert } = require('chai');
const Web3 = require('web3');
const Mosaic = require('@openstfoundation/mosaic.js');
const Package = require('./../../../index');

const { AbiBinProvider } = Package;
const Setup = Package.EconomySetup;
const config = require('./../../utils/configReader');

const {
  StakeHelper,
  Staker,
  Facilitator,
} = Package.Helpers;
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
    // Deployer while deploying MockToken gets MAX ValueTokens.
    // Since owner is the deployer, owner also gets MAX ValueTokens.
    owner = deployerAddress;
  });

  after(() => {
    dockerTeardown();
  });

  it('Deploys Organization contract', async () => {
    // Create worker address in wallet in order to sign EIP 712 hash
    await originWeb3.eth.accounts.wallet.create(1);
    worker = originWeb3.eth.accounts.wallet[0].address;

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
    assert.strictEqual(gatewayComposerAddress, btStakeStruct.staker, 'Incorrect staker address.');
    assert.strictEqual(config.stakeAmountInWei, btStakeStruct.stake, 'Incorrect stake amount.');
  });

  it('Validates worker is whitelisted', async () => {
    const organizationContractInstance = new Mosaic.ContractInteract.Organization(
      originWeb3,
      caOrganization,
    );
    const isWorkerResult = await organizationContractInstance.contract.methods
      .isWorker(worker).call();
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
    const hashLockInstance = Mosaic.Utils.createSecretHashLock();
    const gatewayContractInstance = new Mosaic.ContractInteract.EIP20Gateway(originWeb3, caGateway);
    const bountyAmountInWei = await gatewayContractInstance.getBounty();


    const stakeHelper = new StakeHelper(originWeb3, btAddress, gatewayComposerAddress);
    const abiBinProviderFacilitator = new AbiBinProvider();
    const facilitatorInstance = new Facilitator(
      originWeb3,
      caMockToken,
      facilitator,
      stakeHelper,
      abiBinProviderFacilitator,
    );
    await facilitatorInstance.acceptStakeRequest(
      stakeRequestHash,
      signature,
      bountyAmountInWei,
      hashLockInstance.hashLock,
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
