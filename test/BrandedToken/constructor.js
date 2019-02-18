const Web3 = require('web3');

const BrandedToken = require('../../lib/ContractInteract/BrandedToken');

describe('BrandedToken.constructor()', () => {
  it('should pass', async () => {
    const web3 = new Web3();
    const tokenAddress = '0x0000000000000000000000000000000000000002';
    const instance = new BrandedToken(web3, tokenAddress);

    console.log(instance.address);
  });
});
