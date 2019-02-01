'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  Package = require('./../../../index'),
  Mosaic = require('@openstfoundation/mosaic-tbd');

const Setup = Package.EconomySetup,
  OrganizationHelper = Setup.OrganizationHelper,
  assert = chai.assert,
  config = require('./../../utils/configReader'),
  StakeHelper = Package.Helpers.StakeHelper,
  Staker = Package.Helpers.Staker,
  Facilitator = Package.Helpers.Facilitator,
  MockContractsDeployer = require('./../../utils/MockContractsDeployer'),
  abiBinProvider = MockContractsDeployer.abiBinProvider(),
  BTHelper = Package.EconomySetup.BrandedTokenHelper,
  GatewayComposerHelper = Setup.GatewayComposerHelper;

const { dockerSetup, dockerTeardown } = require('./../../utils/docker');

let originWeb3,
  owner,
  worker,
  caOrganization,
  caMockToken,
  stakeRequestHash,
  gatewayComposerAddress,
  facilitator,
  beneficiary,
  btStakeStruct,
  caGateway,
  btAddress,
  stakeHelperInstance,
  mockTokenAbi,
  deployerAddress,
  txOptions,
  signature;

describe('Performs BrandedToken staking through GatewayComposer', async function() {
  before(async function() {
    // Set up docker geth instance and retrieve RPC endpoint
    const { rpcEndpointOrigin } = await dockerSetup();
    originWeb3 = new Web3(rpcEndpointOrigin);
    const accountsOrigin = await originWeb3.eth.getAccounts();
    deployerAddress = accountsOrigin[0];
    owner = deployerAddress;
    facilitator = accountsOrigin[1];
    beneficiary = accountsOrigin[2];
  });

  after(() => {
    dockerTeardown();
  });

  it('Deploys Organization contract', async function() {
    // Create worker address in wallet in order to sign EIP 712 hash
    await originWeb3.eth.accounts.wallet.create(1);
    worker = originWeb3.eth.accounts.wallet[0].address;

    let orgHelper = new OrganizationHelper(originWeb3, caOrganization);
    const orgConfig = {
      deployer: deployerAddress,
      owner: owner,
      workers: worker,
      workerExpirationHeight: '20000000'
    };
    await orgHelper.setup(orgConfig);
    caOrganization = orgHelper.address;
    assert.isNotNull(caOrganization, 'Organization contract address should not be null.');
  });

  it('Deploys EIP20Token contract', async function() {
    const deployerInstance = new MockContractsDeployer(deployerAddress, originWeb3);
    await deployerInstance.deployMockToken();
    caMockToken = deployerInstance.addresses.MockToken;
    assert.isNotNull(caMockToken, 'EIP20Token contract address should not be null.');
  });

  it('Deploys BrandedToken contract', async function() {
    const btHelperConfig = {
      deployer: deployerAddress,
      valueToken: caMockToken,
      symbol: 'BT',
      name: 'MyBrandedToken',
      decimals: '18',
      conversionRate: '1000',
      conversionRateDecimals: 5,
      organization: caOrganization
    };

    const btDeployParams = {
      from: deployerAddress,
      gasPrice: config.gasPrice
    };

    const btHelper = new BTHelper(originWeb3, null);
    const brandedTokenInstance = await btHelper.setup(btHelperConfig, btDeployParams);
    btAddress = brandedTokenInstance.contractAddress;
    assert.isNotNull(btAddress, 'BrandedToken contract address should not be null.');
  });

  it('Deploys GatewayComposer contract', async function() {
    const gcHelperConfig = {
      deployer: deployerAddress,
      valueToken: caMockToken,
      brandedToken: btAddress,
      owner: owner
    };

    let gcDeployParams = {
      from: deployerAddress,
      gasPrice: config.gasPrice
    };

    let gcHelper = new GatewayComposerHelper(originWeb3, null),
      gatewayComposerInstance = await gcHelper.setup(gcHelperConfig, gcDeployParams);

    gatewayComposerAddress = gatewayComposerInstance.contractAddress;
    assert.isNotNull(gatewayComposerAddress, 'GatewayComposer contract address should not be null.');
  });

  it('Deploys mock gateway contract', async function() {
    const deployerInstance = new MockContractsDeployer(deployerAddress, originWeb3);
    await deployerInstance.deployMockGatewayPass();
    caGateway = deployerInstance.addresses.MockGatewayPass;
    assert.isNotNull(caGateway, 'Gateway contract address should not be null.');
  });

  it('Performs staker.requestStake', async function() {
    mockTokenAbi = abiBinProvider.getABI('MockToken');
    stakeHelperInstance = new StakeHelper(originWeb3, btAddress, gatewayComposerAddress);

    txOptions = {
      from: owner,
      gas: '7500000'
    };
    const mintBTAmountInWei = await stakeHelperInstance.convertToBTToken(
        config.stakeAmountInWei,
        btAddress,
        originWeb3,
        txOptions
      ),
      stakerGatewayNonce = 1;

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
      txOptions
    );

    stakeRequestHash = await stakeHelperInstance._getStakeRequestHashForStakerRawTx(
      gatewayComposerAddress,
      originWeb3,
      txOptions
    );

    btStakeStruct = await stakeHelperInstance._getStakeRequestRawTx(stakeRequestHash, originWeb3, txOptions);
    assert.strictEqual(gatewayComposerAddress, btStakeStruct.staker, 'Incorrect staker address');
  });

  it('Validates worker is whitelisted', async function() {
    const organizationContractInstance = Mosaic.Contracts.getOrganization(originWeb3, caOrganization);
    const isWorkerResult = await organizationContractInstance.methods.isWorker(worker).call();
    assert.strictEqual(isWorkerResult, true, 'Make sure worker is whitelisted.');
  });

  it('Facilitator collects worker signature', async function() {
    // 1. Create TypedData
    const stakeRequestTypedData = stakeHelperInstance.getStakeRequestTypedData(
      config.stakeAmountInWei,
      btStakeStruct.nonce
    );

    // 2. Generate EIP712 Signature.
    const workerAccountInstance = originWeb3.eth.accounts.wallet[worker];
    signature = await workerAccountInstance.signEIP712TypedData(stakeRequestTypedData);
  });

  it('Performs Facilitator.acceptStakeRequest', async function() {
    const hashLockInstance = Mosaic.Helpers.StakeHelper.createSecretHashLock();
    txOptions = {
      from: facilitator,
      gas: '7500000'
    };
    const gatewayContractInstance = Mosaic.Contracts.getEIP20Gateway(originWeb3, caGateway, txOptions);
    let bountyAmountInWei = await gatewayContractInstance.methods.bounty().call();

    const facilitatorInstance = new Facilitator(
      originWeb3,
      caMockToken,
      btAddress,
      gatewayComposerAddress,
      facilitator
    );
    await facilitatorInstance.acceptStakeRequest(
      stakeRequestHash,
      signature,
      bountyAmountInWei,
      mockTokenAbi,
      hashLockInstance.hashLock,
      originWeb3,
      txOptions
    );

    stakeRequestHash = await stakeHelperInstance._getStakeRequestHashForStakerRawTx(
      gatewayComposerAddress,
      originWeb3,
      txOptions
    );
    btStakeStruct = await stakeHelperInstance._getStakeRequestRawTx(stakeRequestHash, originWeb3, txOptions);
    let gcStakeStruct = await stakeHelperInstance._getGCStakeRequestRawTx(stakeRequestHash, originWeb3, txOptions);
    assert.strictEqual(stakeRequestHash, config.nullBytes32, 'BT.StakeRequestHash should be deleted for staker');
    assert.strictEqual(
      btStakeStruct.stake,
      '0',
      'BT.StakeRequest struct should be deleted for input stakeRequestHash.'
    );
    assert.strictEqual(
      gcStakeStruct.stakeVT,
      '0',
      'GC.StakeRequest struct should be deleted for input stakeRequestHash.'
    );
  });
});
