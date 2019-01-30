'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  Package = require('../../../index'),
  Mosaic = require('@openstfoundation/mosaic-tbd');

const Setup = Package.EconomySetup,
  OrganizationHelper = Setup.OrganizationHelper,
  assert = chai.assert,
  config = require('../../utils/configReader'),
  StakeHelper = require('../../../lib/helpers/stake/gateway_composer/StakeHelper'),
  Staker = require('../../../lib/helpers/stake/gateway_composer/Staker'),
  MockContractsDeployer = require('../../utils/MockContractsDeployer'),
  abiBinProvider = MockContractsDeployer.abiBinProvider(),
  BTHelper = Package.EconomySetup.BrandedTokenHelper,
  GatewayComposerHelper = Setup.GatewayComposerHelper,
  Contracts = Package.Contracts;

const { dockerSetup, dockerTeardown } = require('../../utils/docker');

let originWeb3,
  owner,
  worker,
  caOrganization,
  caMockToken,
  stakeRequestHash,
  gatewayComposerAddress,
  beneficiary,
  btStakeStruct,
  caGateway,
  btAddress,
  stakeHelperInstance,
  mockTokenAbi,
  deployerAddress,
  txOptions,
  accountsOrigin;

describe('RejectStakeRequest', async function() {
  before(async function() {
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

  it('Deploys Organization contract', async function() {
    // Create worker address in wallet in order to sign EIP 712 hash
    //    and fund in order to execute rejectStakeRequest
    await originWeb3.eth.accounts.wallet.create(1);
    worker = originWeb3.eth.accounts.wallet[0].address;
    await originWeb3.eth.sendTransaction({from: accountsOrigin[2], to: worker, value: originWeb3.utils.toWei('1')});

    let orgHelper = new OrganizationHelper(originWeb3, caOrganization);
    const orgConfig = {
      deployer: deployerAddress,
      owner: owner,
      workers: worker,
      workerExpirationHeight: '20000000'
    };
    orgHelper.setup(orgConfig).then(function() {
      caOrganization = orgHelper.address;
    });
    assert.isNotNull(caOrganization, 'Organization contract address should not be null.');
  });

  it('Deploys EIP20Token contract', async function() {
    const deployerInstance = new MockContractsDeployer(deployerAddress, originWeb3);
    return deployerInstance.deployMockToken().then(function() {
      caMockToken = deployerInstance.addresses.MockToken;
    });
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

  it('Performs worker.rejectStakeRequest', async function() {
    const brandedToken = Contracts.getBrandedToken(originWeb3, btAddress);
    const tx = brandedToken.methods.rejectStakeRequest(stakeRequestHash)

    txOptions = {
      from: worker,
      gas: '7500000'
    };

    return tx
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash of reject stake request:', transactionHash);
      })
      .on('error', function(error) {
        console.log('\t !! Error for requestStake!!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      });
  });
});
