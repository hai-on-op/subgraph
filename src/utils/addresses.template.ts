import { Bytes } from '@graphprotocol/graph-ts'

export var addresses = new Map<string, Bytes>()
addresses.set('ETH_FROM', Bytes.fromHexString('{{ETH_FROM}}') as Bytes)
addresses.set('PROXY_DEPLOYER', Bytes.fromHexString('{{PROXY_DEPLOYER}}') as Bytes)
addresses.set('MULTICALL', Bytes.fromHexString('{{MULTICALL}}') as Bytes)
addresses.set('FAUCET', Bytes.fromHexString('{{FAUCET}}') as Bytes)
addresses.set('GEB_MULTISIG', Bytes.fromHexString('{{GEB_MULTISIG}}') as Bytes)
addresses.set('GEB_MULTISIG_PROXY', Bytes.fromHexString('{{GEB_MULTISIG_PROXY}}') as Bytes)
addresses.set('GEB_DEPLOY', Bytes.fromHexString('{{GEB_DEPLOY}}') as Bytes)
addresses.set('GEB_PROT', Bytes.fromHexString('{{GEB_PROT}}') as Bytes)
addresses.set('GEB_PAUSE_AUTHORITY', Bytes.fromHexString('{{GEB_PAUSE_AUTHORITY}}') as Bytes)
addresses.set('GEB_POLLING_EMITTER', Bytes.fromHexString('{{GEB_POLLING_EMITTER}}') as Bytes)
addresses.set('GEB_SAFE_ENGINE', Bytes.fromHexString('{{GEB_SAFE_ENGINE}}') as Bytes)
addresses.set('GEB_TAX_COLLECTOR', Bytes.fromHexString('{{GEB_TAX_COLLECTOR}}') as Bytes)
addresses.set('GEB_LIQUIDATION_ENGINE', Bytes.fromHexString('{{GEB_LIQUIDATION_ENGINE}}') as Bytes)
addresses.set('GEB_ACCOUNTING_ENGINE', Bytes.fromHexString('{{GEB_ACCOUNTING_ENGINE}}') as Bytes)
addresses.set('GEB_COIN_JOIN', Bytes.fromHexString('{{GEB_COIN_JOIN}}') as Bytes)
addresses.set(
  'GEB_SETTLEMENT_SURPLUS_AUCTIONEER',
  Bytes.fromHexString('{{GEB_SETTLEMENT_SURPLUS_AUCTIONEER}}') as Bytes,
)
addresses.set(
  'GEB_PRE_SETTLEMENT_SURPLUS_AUCTION_HOUSE',
  Bytes.fromHexString('{{GEB_PRE_SETTLEMENT_SURPLUS_AUCTION_HOUSE}}') as Bytes,
)
addresses.set(
  'GEB_POST_SETTLEMENT_SURPLUS_AUCTION_HOUSE',
  Bytes.fromHexString('{{GEB_POST_SETTLEMENT_SURPLUS_AUCTION_HOUSE}}') as Bytes,
)
addresses.set('GEB_DEBT_AUCTION_HOUSE', Bytes.fromHexString('{{GEB_DEBT_AUCTION_HOUSE}}') as Bytes)
addresses.set('GEB_PAUSE', Bytes.fromHexString('{{GEB_PAUSE}}') as Bytes)
addresses.set('GEB_PAUSE_PROXY', Bytes.fromHexString('{{GEB_PAUSE_PROXY}}') as Bytes)
addresses.set('GEB_GOV_ACTIONS', Bytes.fromHexString('{{GEB_GOV_ACTIONS}}') as Bytes)
addresses.set('GEB_COIN', Bytes.fromHexString('{{GEB_COIN}}') as Bytes)
addresses.set('GEB_ORACLE_RELAYER', Bytes.fromHexString('{{GEB_ORACLE_RELAYER}}') as Bytes)
addresses.set('GEB_GLOBAL_SETTLEMENT', Bytes.fromHexString('{{GEB_GLOBAL_SETTLEMENT}}') as Bytes)
addresses.set(
  'GEB_STABILITY_FEE_TREASURY',
  Bytes.fromHexString('{{GEB_STABILITY_FEE_TREASURY}}') as Bytes,
)
addresses.set('GEB_ESM', Bytes.fromHexString('{{GEB_ESM}}') as Bytes)
addresses.set('GEB_RRFM_VALIDATOR', Bytes.fromHexString('{{GEB_RRFM_VALIDATOR}}') as Bytes)
addresses.set('GEB_RRFM_SETTER', Bytes.fromHexString('{{GEB_RRFM_SETTER}}') as Bytes)
addresses.set('PROXY_ACTIONS', Bytes.fromHexString('{{PROXY_ACTIONS}}') as Bytes)
addresses.set(
  'PROXY_ACTIONS_GLOBAL_SETTLEMENT',
  Bytes.fromHexString('{{PROXY_ACTIONS_GLOBAL_SETTLEMENT}}') as Bytes,
)
addresses.set('SAFE_MANAGER', Bytes.fromHexString('{{SAFE_MANAGER}}') as Bytes)
addresses.set('GET_SAFES', Bytes.fromHexString('{{GET_SAFES}}') as Bytes)
addresses.set('FSM_GOV_INTERFACE', Bytes.fromHexString('{{FSM_GOV_INTERFACE}}') as Bytes)
addresses.set('PROXY_FACTORY', Bytes.fromHexString('{{PROXY_FACTORY}}') as Bytes)
addresses.set('PROXY_REGISTRY', Bytes.fromHexString('{{PROXY_REGISTRY}}') as Bytes)
addresses.set('MEDIANIZER_PRAI', Bytes.fromHexString('{{MEDIANIZER_PRAI}}') as Bytes)
addresses.set(
  'FEED_SECURITY_MODULE_PRAI',
  Bytes.fromHexString('{{FEED_SECURITY_MODULE_PRAI}}') as Bytes,
)
addresses.set('ETH', Bytes.fromHexString('{{ETH}}') as Bytes)
addresses.set('MEDIANIZER_ETH', Bytes.fromHexString('{{MEDIANIZER_ETH}}') as Bytes)
addresses.set(
  'FEED_SECURITY_MODULE_ETH',
  Bytes.fromHexString('{{FEED_SECURITY_MODULE_ETH}}') as Bytes,
)
addresses.set('GEB_JOIN_ETH_A', Bytes.fromHexString('{{GEB_JOIN_ETH_A}}') as Bytes)
addresses.set(
  'GEB_COLLATERAL_AUCTION_HOUSE_ETH_A',
  Bytes.fromHexString('{{GEB_COLLATERAL_AUCTION_HOUSE_ETH_A}}') as Bytes,
)
addresses.set('PROXY_PAUSE_ACTIONS', Bytes.fromHexString('{{PROXY_PAUSE_ACTIONS}}') as Bytes)
addresses.set(
  'PROXY_PAUSE_SCHEDULE_ACTIONS',
  Bytes.fromHexString('{{PROXY_PAUSE_SCHEDULE_ACTIONS}}') as Bytes,
)
addresses.set('UNISWAP_FACTORY', Bytes.fromHexString('{{UNISWAP_FACTORY}}') as Bytes)
addresses.set('UNISWAP_ROUTER', Bytes.fromHexString('{{UNISWAP_ROUTER}}') as Bytes)
addresses.set('GEB_DS_COMPARE', Bytes.fromHexString('{{GEB_DS_COMPARE}}') as Bytes)
addresses.set('GEB_TX_MANAGER', Bytes.fromHexString('{{GEB_TX_MANAGER}}') as Bytes)
