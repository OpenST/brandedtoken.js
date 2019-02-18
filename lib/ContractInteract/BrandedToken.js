'use strict';

const Web3 = require('web3');
const Contracts = require('../Contracts');
const AbiBinProvider = require('../AbiBinProvider');
const Utils = require('../../utils/Utils');

const ContractName = 'BrandedToken';

/**
 * Contract interact for Branded token.
 */
class BrandedToken {
  /**
   * Constructor for Anchor.
   *
   * @param {Object} web3 Web3 object.
   * @param {string} address BrandedToken contract address.
   */
  constructor(web3, address) {
    if (!(web3 instanceof Web3)) {
      throw new TypeError("Mandatory Parameter 'web3' is missing or invalid");
    }
    if (!Web3.utils.isAddress(address)) {
      throw new TypeError(
        `Mandatory Parameter 'address' is missing or invalid: ${address}`,
      );
    }

    this.web3 = web3;
    this.address = address;

    this.contract = Contracts.getBrandedToken(this.web3, this.address);

    if (!this.contract) {
      throw new TypeError(
        `Could not load utility branded token contract for: ${this.address}`,
      );
    }
  }

  /**
   * Deploys a Branded token contract.
   *
   * @param web3 Origin chain web3 object.
   * @param valueToken The value to which valueToken is set.
   * @param symbol The value to which tokenSymbol, defined in EIP20Token,
   *                is set.
   * @param name The value to which tokenName, defined in EIP20Token,
   *              is set.
   * @param decimals The value to which tokenDecimals, defined in EIP20Token,
   *                  is set.
   * @param conversionRate The value to which conversionRate is set.
   * @param conversionRateDecimals The value to which
   *                                conversionRateDecimals is set.
   * @param organization Organization contract address.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<BrandedToken>} Promise containing the Branded token
   *                                  instance that has been deployed.
   */
  static async deploy(
    web3,
    valueToken,
    symbol,
    name,
    decimals,
    conversionRate,
    conversionRateDecimals,
    organization,
    txOptions,
  ) {
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
      return Promise.reject(err);
    }

    const tx = BrandedToken.deployRawTx(
      web3,
      valueToken,
      symbol,
      name,
      decimals,
      conversionRate,
      conversionRateDecimals,
      organization,
    );

    return Utils.sendTransaction(tx, txOptions).then((txReceipt) => {
      const address = txReceipt.contractAddress;
      return new BrandedToken(web3, address);
    });
  }

  /**
   * Raw transaction for {@link BrandedToken#deploy}.
   *
   * @param web3 Origin chain web3 object.
   * @param valueToken The value to which valueToken is set.
   * @param symbol The value to which tokenSymbol, defined in EIP20Token,
   *                is set.
   * @param name The value to which tokenName, defined in EIP20Token,
   *              is set.
   * @param decimals The value to which tokenDecimals, defined in EIP20Token,
   *                  is set.
   * @param conversionRate The value to which conversionRate is set.
   * @param conversionRateDecimals The value to which
   *                                conversionRateDecimals is set.
   * @param organization Organization contract address.
   *
   * @returns {Object} Raw transaction.
   */
  static deployRawTx(
    web3,
    valueToken,
    symbol,
    name,
    decimals,
    conversionRate,
    conversionRateDecimals,
    organization,
  ) {
    if (!(web3 instanceof Web3)) {
      throw new TypeError(
        `Mandatory Parameter 'web3' is missing or invalid: ${web3}`,
      );
    }
    if (!Web3.utils.isAddress(valueToken)) {
      throw new TypeError(`Invalid valueToken address: ${valueToken}.`);
    }
    if (!Web3.utils.isAddress(organization)) {
      throw new TypeError(`Invalid organization address: ${organization}.`);
    }
    if (!(conversionRate > 0)) {
      throw new TypeError(`Invalid conversion rate: ${conversionRate}. It should be more than zero`);
    }
    if (!(conversionRateDecimals < 5)) {
      throw new TypeError(`Invalid conversion rate decimal: ${conversionRateDecimals}. It should be less than 5`);
    }

    const abiBinProvider = new AbiBinProvider();
    const bin = abiBinProvider.getBIN(ContractName);

    const args = [
      valueToken,
      symbol,
      name,
      decimals,
      conversionRate,
      conversionRateDecimals,
      organization,
    ];

    const contract = Contracts.getBrandedToken(web3, null, null);

    return contract.deploy(
      {
        data: bin,
        arguments: args,
      },
    );
  }

  /**
   * This calculates branded tokens equivalent to given value tokens.
   *
   * @param valueTokens Amount of value token.
   *
   * @return {Promise<string>} Promise that resolves to amount of branded token.
   */
  convertToBrandedTokens(valueTokens) {
    return this.contract.methods
      .convertToBrandedTokens(valueTokens)
      .call();
  }

  /**
   * Request stake for given amount. Approval for stake amount to branded
   * token is required before calling this method.
   *
   * @param stakeAmount Stake amount.
   * @param txOptions Transaction options.
   *
   * @return {Promise<Object>} Promise that resolves to transaction receipt.
   */
  async requestStake(stakeAmount, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(
        `Invalid from address ${txOptions.from} in transaction options.`,
      );
      return Promise.reject(err);
    }

    const mintedAmount = await this.convertToBrandedTokens(stakeAmount);
    const tx = await this.requestStakeRawTx(stakeAmount, mintedAmount);
    return Utils.sendTransaction(tx, txOptions);
  }

  /**
   * Raw tx for request stake.
   *
   * @param stakeAmount Stake amount.
   * @param mintAmount Amount that will be minted after staking.
   *
   * @return Promise<Object> Raw transaction object.
   */
  requestStakeRawTx(stakeAmount, mintAmount) {
    return Promise.resolve(this.contract.methods.requestStake(stakeAmount, mintAmount));
  }

  /**
   * Accept open stake request identified by request hash.
   *
   * @param stakeRequestHash Stake request hash.
   * @param r R of signature received from worker.
   * @param s s of signature received from worker.
   * @param v v of signature received from worker.
   * @param txOptions Transaction options
   *
   * @return {Promise<Object>} Promise that resolves to transaction receipt.
   */
  async acceptStakeRequest(stakeRequestHash, r, s, v, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(
        `Invalid from address ${txOptions.from} in transaction options.`,
      );
      return Promise.reject(err);
    }

    const tx = await this.acceptStakeRequestRawTx(stakeRequestHash, r, s, v);
    return Utils.sendTransaction(tx, txOptions);
  }

  /**
   * Raw transaction for accept stake request.
   *
   * @param stakeRequestHash Stake request hash.
   * @param r R of signature received from worker.
   * @param s s of signature received from worker.
   * @param v v of signature received from worker.
   *
   * @return Promise<Object> Raw transaction object.
   */
  acceptStakeRequestRawTx(stakeRequestHash, r, s, v) {
    if (!stakeRequestHash) {
      const err = new TypeError(`Invalid stakeRequestHash: ${stakeRequestHash}.`);
      return Promise.reject(err);
    }
    if (!r) {
      const err = new TypeError(`Invalid r of signature: ${r}.`);
      return Promise.reject(err);
    }
    if (!s) {
      const err = new TypeError(`Invalid s of signature: ${s}.`);
      return Promise.reject(err);
    }
    if (!v) {
      const err = new TypeError(`Invalid v of signature: ${v}.`);
      return Promise.reject(err);
    }

    return Promise.resolve(
      this.contract.methods.acceptStakeRequest(
        stakeRequestHash,
        r,
        s,
        v,
      ),
    );
  }

  /**
   * Lift restriction for given list of addresses.
   *
   * @param addresses Addresses for which to lift restrictions.
   * @param txOptions Transaction options.
   *
   * @return {Promise<Object>} Promise that resolves to transaction receipt.
   */
  async liftRestriction(addresses, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(
        `Invalid from address ${txOptions.from} in transaction options.`,
      );
      return Promise.reject(err);
    }

    const tx = await this.liftRestrictionRawTx(addresses);
    return Utils.sendTransaction(tx, txOptions);
  }

  /**
   * Raw tx for lift restriction.
   *
   * @param addresses Addresses for which to lift restrictions.
   *
   * @return Promise<Object> Raw transaction object.
   */
  liftRestrictionRawTx(addresses) {
    if (!addresses || addresses.length === 0) {
      const err = new TypeError(
        `At least one addresses must be defined : ${addresses}`,
      );
      return Promise.reject(err);
    }
    return Promise.resolve(this.contract.methods.liftRestriction(addresses));
  }

  /**
   * Checks if given address is unrestricted.
   *
   * @param address Address needs to be checked.
   *
   * @returns {Promise<boolean>} Promise that resolves to `true` if
   * unrestricted..
   */
  isUnrestricted(address) {
    return this.contract.methods
      .isUnrestricted(address)
      .call();
  }
}

module.exports = BrandedToken;
