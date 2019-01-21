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
  GCHelper = Setup.GatewayComposerHelper;

const web3 = new Web3(config.gethRpcEndPoint),
  web3WalletHelper = new Web3WalletHelper(web3),
  owner = config.deployerAddress;

let worker,
  caOrganization = null,
  caMockToken,
  caBT,
  caGC,
  wallets;

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
          let deployer = new MockContractsDeployer(config.deployerAddress, web3);
          return deployer.deployMockToken().then(function() {
            caMockToken = deployer.addresses.MockToken;
            return caMockToken;
          });
        }
      });
  });

  it('Should perform stake request successfully', async function() {
    this.timeout(60000);

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

    let caBT;
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
      gatewayComposer = await gcHelper.setup(gcHelperConfig, gcDeployParams);
    let gcAddress = gatewayComposer.contractAddress;

    const txOptions = {
      from: owner,
      gas: '8000000'
    };

    let mockTokenAbi = abiBinProvider.getABI('MockToken');
    let mockContract = new web3.eth.Contract(mockTokenAbi, caMockToken, txOptions);
    const txMockApprove = mockContract.methods.approve(gcAddress, 1000);

    await txMockApprove.send(txOptions);

    const valueTokenInWei = 200,
      gasPrice = '8000000',
      gasLimit = '100',
      beneficiary = wallets[2].address,
      stakeHelper = new StakeHelper(web3, btAddress, gcAddress),
      txBTToken = await stakeHelper.convertToBTToken(valueTokenInWei, btAddress, web3, txOptions),
      stakerNonce = 1;

    await stakeHelper.requestStake(
      owner,
      valueTokenInWei,
      txBTToken,
      gcAddress,
      gasPrice,
      gasLimit,
      beneficiary,
      stakerNonce,
      web3,
      txOptions
    );

    const requestHash = await stakeHelper._getStakeRequestHashForStakerRawTx(gcAddress, web3, txOptions);

    const stakeStruct = await stakeHelper._getStakeRequestRawTx(requestHash, web3, txOptions);

    assert.strictEqual(gcAddress, stakeStruct.staker, 'Incorrect staker address');
  });
});
