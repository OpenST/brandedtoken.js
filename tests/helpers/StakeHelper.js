'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  Package = require('../../index');

const Setup = Package.EconomySetup,
  OrganizationHelper = Setup.OrganizationHelper,
  assert = chai.assert,
  config = require('../../tests/utils/configReader'),
  Web3WalletHelper = require('../../tests/utils/Web3WalletHelper'),
  StakeHelper = require('../../libs/helpers/StakeHelper'),
  MockContractsDeployer = require('../utils/MockContractsDeployer'),
  abiBinProvider = MockContractsDeployer.abiBinProvider(),
  BTHelper = Package.EconomySetup.BrandedTokenHelper,
  GatewayHelper = Package.EconomySetup.GatewayHelper,
  GCHelper = Setup.GatewayComposerHelper;

const web3 = new Web3(config.gethRpcEndPoint),
  web3WalletHelper = new Web3WalletHelper(web3),
  owner = config.deployerAddress;

let worker,
  caOrganization = null,
  caMockToken,
  caGC,
  wallets,
  stakeRequestHash,
  gatewayComposerAddress,
  facilitator,
  beneficiary,
  stakeStruct,
  stakeHelper,
  caBT,
  deployer;

const valueTokenInWei = 200,
  gasPrice = '8000000',
  gasLimit = '100',
  txOptions = {
    from: owner,
    gas: '8000000'
  };

describe('StakeHelper', async function() {
  let deployParams = {
    from: config.deployerAddress,
    gasPrice: config.gasPrice
  };

  before(function() {
    this.timeout(3 * 60000);
    //This hook could take long time.
    return web3WalletHelper
      .init(web3)
      .then(function(_out) {
        if (!caOrganization) {
          console.log('* Setting up Organization');
          wallets = web3WalletHelper.web3Object.eth.accounts.wallet;
          worker = wallets[1].address;
          beneficiary = wallets[2].address;
          facilitator = wallets[3].address;
          let orgHelper = new OrganizationHelper(web3, caOrganization);
          const orgConfig = {
            deployer: config.deployerAddress,
            owner: owner,
            workers: worker
          };
          return orgHelper.setup(orgConfig).then(function() {
            caOrganization = orgHelper.address;
          });
        }
        return _out;
      })
      .then(function() {
        if (!caMockToken) {
          deployer = new MockContractsDeployer(config.deployerAddress, web3);
          return deployer.deployMockToken().then(function() {
            caMockToken = deployer.addresses.MockToken;
            return caMockToken;
          });
        }
      });
  });

  it('Should perform requestStake successfully', async function() {
    this.timeout(60000 * 2);

    const helperConfig = {
      deployer: config.deployerAddress,
      valueToken: caMockToken,
      symbol: 'BT',
      name: 'MyBrandedToken',
      decimals: '18',
      conversionRate: '1000',
      conversionRateDecimals: 5,
      organization: caOrganization
    };

    const btHelper = new BTHelper(web3, caBT);
    caBT = await btHelper.setup(helperConfig, deployParams);
    const btAddress = caBT.contractAddress;

    const gcHelperConfig = {
      deployer: config.deployerAddress,
      valueToken: caMockToken,
      brandedToken: btAddress,
      owner: owner
    };

    let gcDeployParams = {
      from: config.deployerAddress,
      gasPrice: config.gasPrice
    };

    let gcHelper = new GCHelper(web3, caGC),
      gatewayComposerInstance = await gcHelper.setup(gcHelperConfig, gcDeployParams);

    gatewayComposerAddress = gatewayComposerInstance.contractAddress;

    const mockTokenAbi = abiBinProvider.getABI('MockToken'),
      mockContract = new web3.eth.Contract(mockTokenAbi, caMockToken, txOptions),
      txMockApprove = mockContract.methods.approve(gatewayComposerAddress, 1000);

    await txMockApprove.send(txOptions);
    await deployer.deployMockGatewayPass();

    stakeHelper = new StakeHelper(web3, btAddress, gatewayComposerAddress);
    const txBrandedToken = await stakeHelper.convertToBTToken(valueTokenInWei, btAddress, web3, txOptions),
      stakerNonce = 1,
      caGateway = deployer.addresses.MockGatewayPass;

    await stakeHelper.requestStake(
      owner,
      valueTokenInWei,
      txBrandedToken,
      caGateway,
      gasPrice,
      gasLimit,
      beneficiary,
      stakerNonce,
      web3,
      txOptions
    );

    stakeRequestHash = await stakeHelper._getStakeRequestHashForStakerRawTx(gatewayComposerAddress, web3, txOptions);

    stakeStruct = await stakeHelper._getStakeRequestRawTx(stakeRequestHash, web3, txOptions);

    assert.strictEqual(gatewayComposerAddress, stakeStruct.staker, 'Incorrect staker address');
  });

  it('Should perform acceptStakeRequest successfully', async function() {
    this.timeout(60000);

    // AcceptStakeRequest Testing
    await stakeHelper.acceptStakeRequest(
      stakeRequestHash,
      gatewayComposerAddress,
      valueTokenInWei,
      stakeStruct.nonce,
      facilitator,
      worker,
      web3,
      txOptions
    );

    stakeRequestHash = await stakeHelper._getStakeRequestHashForStakerRawTx(gatewayComposerAddress, web3, txOptions);
    stakeStruct = await stakeHelper._getStakeRequestRawTx(stakeRequestHash, web3, txOptions);
    console.log('stakeRequestHash:', stakeRequestHash, 'stakeStruct:', stakeStruct);
    assert.strictEqual(stakeRequestHash, null, 'BT.StakeRequestHash should be deleted for staker');
    assert.strictEqual(stakeStruct.stake, 0, 'BT.StakeRequest struct should be deleted for input stakeRequestHash.');
  });
});

// Go easy on RPC Client (Geth)
(function() {
  let maxHttpScokets = 10;
  let httpModule = require('http');
  httpModule.globalAgent.keepAlive = true;
  httpModule.globalAgent.keepAliveMsecs = 30 * 60 * 1000;
  httpModule.globalAgent.maxSockets = maxHttpScokets;
})();
