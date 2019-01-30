'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  Package = require('../../../../index');

const Setup = Package.EconomySetup,
  OrganizationHelper = Setup.OrganizationHelper,
  assert = chai.assert,
  config = require('../../../utils/configReader'),
  StakeHelper = require('../../../../lib/helpers/stake/gateway_composer/StakeHelper'),
  Staker = require('../../../../lib/helpers/stake/gateway_composer/Staker'),
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
  btAddress;

const valueTokenInWei = '200',
  gasPrice = '8000000',
  gasLimit = '100';

describe('Staker', async function() {
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

  after(() => {
    dockerTeardown();
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

    const mockTokenAbi = abiBinProvider.getABI('MockToken');

    await deployer.deployMockGatewayPass();
    caGateway = deployer.addresses.MockGatewayPass;

    const stakeHelperInstance = new StakeHelper(web3, btAddress, gatewayComposerAddress),
      mintBTAmountInWei = await stakeHelperInstance.convertToBTToken(valueTokenInWei, btAddress, web3, txOptions),
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
});

KeepAliveConfig.get();
