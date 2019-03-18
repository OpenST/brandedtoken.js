# brandedtoken.js Change Log

## Version 0.10.0

<!-- [**0.10.0, (<release date: DD MM YYYY>)**](https://github.com/OpenST/brandedtoken.js/releases/tag/0.10.0) -->

You can use brandedtoken.js to interact with BrandedToken contracts.

### Notable Changes

* ABIs and BINs are now accessed as a dependency on brandedtoken-contracts ([#117](https://github.com/OpenST/brandedtoken.js/pull/117))
* Mosaic.js version is upgraded to beta-4 (#[115](https://github.com/OpenST/brandedtoken.js/pull/115))
* Mosaic contract interacts are now exposed ([#114](https://github.com/OpenST/brandedtoken.js/pull/114))
* New economy setup simplifies deployment ([#112](https://github.com/OpenST/brandedtoken.js/pull/112)) 
* Facilitator and Staker now uses contract interacts ([#105](https://github.com/OpenST/brandedtoken.js/pull/105)) 
* Added contract interacts for branded token, gateway composer, utility branded token contracts ([#99](https://github.com/OpenST/brandedtoken.js/pull/99), [#103](https://github.com/OpenST/brandedtoken.js/pull/103))
* Replace mosaic-tbd with mosaic.js ([#74](https://github.com/OpenST/brandedtoken.js/pull/74))
* Readme ([#72](https://github.com/OpenST/brandedtoken.js/pull/72))
* License Update and repo alignment as per eslint configuration ([#71](https://github.com/OpenST/brandedtoken.js/pull/71))
* Illustrate reject stakeRequest flow in integration test ([#62](https://github.com/OpenST/brandedtoken.js/pull/62))
* Updated package.json and npm run alignment ([#65](https://github.com/OpenST/brandedtoken.js/pull/65))
* Integration test files cleanup ([#60](https://github.com/OpenST/brandedtoken.js/pull/60))
* Use docker geth instance for testing ([#58](https://github.com/OpenST/brandedtoken.js/pull/58))
* Directory structure improvements ([#54](https://github.com/OpenST/brandedtoken.js/pull/54))
* Documentation improvements ([#53](https://github.com/OpenST/brandedtoken.js/pull/53))
* Interaction for Staker.requestStake and Facilitator.acceptStakeRequest ([#50](https://github.com/OpenST/brandedtoken.js/pull/50))
* Interaction for bounty approval ([#47](https://github.com/OpenST/brandedtoken.js/pull/47))
* Index.js update with StakeHelper interfaces ([#42](https://github.com/OpenST/brandedtoken.js/pull/42))
* Interaction for approve for ValueToken ([#40](https://github.com/OpenST/brandedtoken.js/pull/40))
* EIP712 signer integration with AcceptStakeRequest ([#33](https://github.com/OpenST/brandedtoken.js/pull/33))
* Interaction for GatewayComposer AcceptStakeRequest in StakeHelper ([#37](https://github.com/OpenST/brandedtoken.js/pull/37))
* Updated BrandedToken contracts ABI/BIN files ([#32](https://github.com/OpenST/brandedtoken.js/pull/32))
* Test case added for RegisterInternalActor ([#29](https://github.com/OpenST/brandedtoken.js/pull/29))
* Interaction for GatewayComposer.RequestStake ([#30](https://github.com/OpenST/brandedtoken.js/pull/30))

### Deprecations

* `EconomySetup` and setup helpers are now deprecated ([#121](https://github.com/OpenST/brandedtoken.js/pull/121)).
  * See [here](https://github.com/OpenST/brandedtoken.js#deploy-eip20token-contract) for help on how to migrate.
* `StakeHelper` is now deprecated ([#121](https://github.com/OpenST/brandedtoken.js/pull/121)).
  * See ([#119](https://github.com/OpenST/brandedtoken.js/pull/119)) for help on how to migrate.