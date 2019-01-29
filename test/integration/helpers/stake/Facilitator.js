'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  Package = require('../../../../index'),
  Mosaic = require('@openstfoundation/mosaic-tbd');

const Setup = Package.EconomySetup,
  OrganizationHelper = Setup.OrganizationHelper,
  assert = chai.assert,
  config = require('../../../utils/configReader'),
  StakeHelper = require('../../../../lib/helpers/stake/gateway_composer/StakeHelper'),
  Staker = require('../../../../lib/helpers/stake/gateway_composer/Staker'),
  Facilitator = require('../../../../lib/helpers/stake/gateway_composer/Facilitator'),
  MockContractsDeployer = require('../../../utils/MockContractsDeployer'),
  abiBinProvider = MockContractsDeployer.abiBinProvider(),
  BTHelper = Package.EconomySetup.BrandedTokenHelper,
  GCHelper = Setup.GatewayComposerHelper,
  KeepAliveConfig = require('../../../utils/KeepAliveConfig');

const { dockerSetup, dockerTeardown } = require('../../../utils/docker');

let web3,
  owner,
  worker,
  caOrganization = null,
  caMockToken,
  caGC,
  stakeRequestHash,
  gatewayComposerAddress,
  facilitator,
  beneficiary,
  btStakeStruct,
  caBT,
  deployer,
  caGateway,
  btAddress,
  stakeHelperInstance,
  mockTokenAbi;

const valueTokenInWei = '200',
  gasPrice = '8000000',
  gasLimit = '100';

describe('Facilitator', async function() {
  let deployerAddress;
  let deployParams;
  let txOptions;

  before(async function() {
    // Set up docker geth instance and retrieve RPC endpoint
    const { rpcEndpointOrigin } = await dockerSetup();
    web3 = new Web3(rpcEndpointOrigin);
    const accountsOrigin = await web3.eth.getAccounts();
    deployerAddress = accountsOrigin[0];
    owner = deployerAddress;
    deployParams = {
      from: deployerAddress,
      gasPrice: config.gasPrice
    };

    beneficiary = accountsOrigin[2];
    facilitator = accountsOrigin[1];

    if (!caOrganization) {
      console.log('* Setting up Organization');
      // Create worker address in wallet in order to sign EIP 712 hash
      await web3.eth.accounts.wallet.create(1);
      worker = web3.eth.accounts.wallet[0].address;

      let orgHelper = new OrganizationHelper(web3, caOrganization);
      const orgConfig = {
        deployer: deployerAddress,
        owner: owner,
        workers: worker,
        workerExpirationHeight: '20000000'
      };
      orgHelper.setup(orgConfig).then(function() {
        caOrganization = orgHelper.address;
      });
    }
    if (!caMockToken) {
      deployer = new MockContractsDeployer(deployerAddress, web3);
      return deployer.deployMockToken().then(function() {
        caMockToken = deployer.addresses.MockToken;
      });
    }
  });

  it('Completes staker.requestStake successfully', async function() {
    this.timeout(4 * 60000);

    const helperConfig = {
      deployer: deployerAddress,
      valueToken: caMockToken,
      symbol: 'BT',
      name: 'MyBrandedToken',
      decimals: '18',
      conversionRate: '1000',
      conversionRateDecimals: 5,
      organization: caOrganization
    };

    txOptions = {
      from: owner,
      gas: '7500000'
    };

    const btHelper = new BTHelper(web3, caBT);
    caBT = await btHelper.setup(helperConfig, deployParams);
    btAddress = caBT.contractAddress;

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

    let gcHelper = new GCHelper(web3, caGC),
      gatewayComposerInstance = await gcHelper.setup(gcHelperConfig, gcDeployParams);

    gatewayComposerAddress = gatewayComposerInstance.contractAddress;

    mockTokenAbi = abiBinProvider.getABI('MockToken');

    await deployer.deployMockGatewayPass();
    caGateway = deployer.addresses.MockGatewayPass;

    stakeHelperInstance = new StakeHelper(web3, btAddress, gatewayComposerAddress);

    const mintBTAmountInWei = await stakeHelperInstance.convertToBTToken(valueTokenInWei, btAddress, web3, txOptions),
      stakerGatewayNonce = 1;

    const stakerInstance = new Staker(web3, caMockToken, btAddress, gatewayComposerAddress);
    await stakerInstance.requestStake(
      mockTokenAbi,
      owner,
      valueTokenInWei,
      mintBTAmountInWei,
      caGateway,
      gasPrice,
      gasLimit,
      beneficiary,
      stakerGatewayNonce,
      txOptions
    );

    stakeRequestHash = await stakeHelperInstance._getStakeRequestHashForStakerRawTx(
      gatewayComposerAddress,
      web3,
      txOptions
    );

    btStakeStruct = await stakeHelperInstance._getStakeRequestRawTx(stakeRequestHash, web3, txOptions);
    assert.strictEqual(gatewayComposerAddress, btStakeStruct.staker, 'Incorrect staker address');
  });

  it('Completes Facilitator.acceptStakeRequest successfully', async function() {
    this.timeout(3 * 60000);

    const organizationContractInstance = Mosaic.Contracts.getOrganization(web3, caOrganization);
    const isWorkerResult = await organizationContractInstance.methods.isWorker(worker).call();
    assert.strictEqual(isWorkerResult, true, 'Make sure worker is whitelisted.');

    const hashLockInstance = Mosaic.Helpers.StakeHelper.createSecretHashLock();
    txOptions = {
      from: facilitator,
      gas: '7500000'
    };
    const gatewayContractInstance = Mosaic.Contracts.getEIP20Gateway(web3, caGateway, txOptions);
    let bountyAmountInWei = await gatewayContractInstance.methods.bounty().call();

    // 1. Create TypedData
    const stakeRequestTypedData = stakeHelperInstance.getStakeRequestTypedData(valueTokenInWei, btStakeStruct.nonce);

    // 2. Generate EIP712 Signature.
    const workerAccountInstance = web3.eth.accounts.wallet[worker];
    const signature = await workerAccountInstance.signEIP712TypedData(stakeRequestTypedData);

    const facilitatorInstance = new Facilitator(web3, caMockToken, btAddress, gatewayComposerAddress, facilitator);
    await facilitatorInstance.acceptStakeRequest(
      stakeRequestHash,
      signature,
      bountyAmountInWei,
      mockTokenAbi,
      hashLockInstance.hashLock,
      web3,
      txOptions
    );

    stakeRequestHash = await stakeHelperInstance._getStakeRequestHashForStakerRawTx(
      gatewayComposerAddress,
      web3,
      txOptions
    );
    btStakeStruct = await stakeHelperInstance._getStakeRequestRawTx(stakeRequestHash, web3, txOptions);
    let gcStakeStruct = await stakeHelperInstance._getGCStakeRequestRawTx(stakeRequestHash, web3, txOptions);
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

KeepAliveConfig.get();
