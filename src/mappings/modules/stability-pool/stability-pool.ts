import { BigInt, Address, Bytes } from '@graphprotocol/graph-ts'
import {
  Transfer,
  ClaimRewards,
  ClaimRewardsFromEmissionsController,
  CoverAndRepayDebt,
  TransfersEnabled,
  KiteRewardsDeactivated,
  SweepInternalCoin,
  EmergencyWithdrawKite,
  AddAuthorization,
  RemoveAuthorization,
  SetStrategySteps,
  ClearStrategySteps,
  SetStepWhitelist,
  SetCollateralSlippageBps,
  SetStepTypeSlippageBps,
  SetMinProfitBps,
} from '../../../../generated/StabilityPool/StabilityPool'
import {
  StabilityPool,
  StabilityPoolDepositor,
  StabilityPoolAction,
  StabilityPoolRewardClaim,
  CoverAndRepayDebtEvent,
  StabilityPoolStrategy,
  StabilityPoolWhitelistedStep,
} from '../../../../generated/schema'
import { addAuthorization, removeAuthorization } from '../governance/authorizations'

let ZERO = BigInt.fromI32(0)
let ZERO_ADDRESS = Address.fromString('0x0000000000000000000000000000000000000000')

function getOrCreateStabilityPool(address: Address): StabilityPool {
  let pool = StabilityPool.load(address.toHexString())
  if (!pool) {
    pool = new StabilityPool(address.toHexString())
    pool.totalShares = ZERO
    pool.totalDeposited = ZERO
    pool.totalWithdrawn = ZERO
    pool.totalKiteFromEmissions = ZERO
    pool.totalKiteDistributed = ZERO
    pool.transfersEnabled = false
    pool.kiteRewardsActive = true
    pool.totalAuctionsCovered = ZERO
    pool.depositorCount = ZERO
    pool.minProfitBps = 0
    pool.save()
  }
  return pool
}

function getOrCreateDepositor(userAddress: Address, pool: StabilityPool): StabilityPoolDepositor {
  let depositor = StabilityPoolDepositor.load(userAddress.toHexString())
  if (!depositor) {
    depositor = new StabilityPoolDepositor(userAddress.toHexString())
    depositor.pool = pool.id
    depositor.shareBalance = ZERO
    depositor.totalRewardsClaimed = ZERO
    depositor.save()
  }
  return depositor
}

function eventId(event: Transfer): string {
  return event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
}

export function handleTransfer(event: Transfer): void {
  let pool = getOrCreateStabilityPool(event.address)
  let from = event.params.from
  let to = event.params.to
  let amount = event.params.value

  if (from.equals(ZERO_ADDRESS)) {
    // DEPOSIT (mint)
    let depositor = getOrCreateDepositor(to, pool)
    let wasZero = depositor.shareBalance.equals(ZERO)

    depositor.shareBalance = depositor.shareBalance.plus(amount)
    depositor.save()

    pool.totalShares = pool.totalShares.plus(amount)
    pool.totalDeposited = pool.totalDeposited.plus(amount)
    if (wasZero) {
      pool.depositorCount = pool.depositorCount.plus(BigInt.fromI32(1))
    }
    pool.save()

    let action = new StabilityPoolAction(
      event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
    )
    action.pool = pool.id
    action.user = depositor.id
    action.type = 'DEPOSIT'
    action.amount = amount
    action.createdAt = event.block.timestamp
    action.createdAtBlock = event.block.number
    action.createdAtTransaction = event.transaction.hash
    action.save()
  } else if (to.equals(ZERO_ADDRESS)) {
    // WITHDRAW (burn)
    let depositor = getOrCreateDepositor(from, pool)

    depositor.shareBalance = depositor.shareBalance.minus(amount)
    depositor.save()

    pool.totalShares = pool.totalShares.minus(amount)
    pool.totalWithdrawn = pool.totalWithdrawn.plus(amount)
    if (depositor.shareBalance.equals(ZERO)) {
      pool.depositorCount = pool.depositorCount.minus(BigInt.fromI32(1))
    }
    pool.save()

    let action = new StabilityPoolAction(
      event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
    )
    action.pool = pool.id
    action.user = depositor.id
    action.type = 'WITHDRAW'
    action.amount = amount
    action.createdAt = event.block.timestamp
    action.createdAtBlock = event.block.number
    action.createdAtTransaction = event.transaction.hash
    action.save()
  } else {
    // TRANSFER between users
    let sender = getOrCreateDepositor(from, pool)
    let receiver = getOrCreateDepositor(to, pool)
    let wasReceiverZero = receiver.shareBalance.equals(ZERO)

    sender.shareBalance = sender.shareBalance.minus(amount)
    sender.save()

    receiver.shareBalance = receiver.shareBalance.plus(amount)
    receiver.save()

    if (sender.shareBalance.equals(ZERO)) {
      pool.depositorCount = pool.depositorCount.minus(BigInt.fromI32(1))
    }
    if (wasReceiverZero) {
      pool.depositorCount = pool.depositorCount.plus(BigInt.fromI32(1))
    }
    pool.save()

    let outAction = new StabilityPoolAction(
      event.transaction.hash.toHexString() + '-' + event.logIndex.toString() + '-out'
    )
    outAction.pool = pool.id
    outAction.user = sender.id
    outAction.type = 'TRANSFER_OUT'
    outAction.amount = amount
    outAction.counterparty = to
    outAction.createdAt = event.block.timestamp
    outAction.createdAtBlock = event.block.number
    outAction.createdAtTransaction = event.transaction.hash
    outAction.save()

    let inAction = new StabilityPoolAction(
      event.transaction.hash.toHexString() + '-' + event.logIndex.toString() + '-in'
    )
    inAction.pool = pool.id
    inAction.user = receiver.id
    inAction.type = 'TRANSFER_IN'
    inAction.amount = amount
    inAction.counterparty = from
    inAction.createdAt = event.block.timestamp
    inAction.createdAtBlock = event.block.number
    inAction.createdAtTransaction = event.transaction.hash
    inAction.save()
  }
}

export function handleClaimRewards(event: ClaimRewards): void {
  let pool = getOrCreateStabilityPool(event.address)
  let depositor = getOrCreateDepositor(event.params._user, pool)

  let claim = new StabilityPoolRewardClaim(
    event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  )
  claim.pool = pool.id
  claim.user = depositor.id
  claim.amount = event.params._amount
  claim.createdAt = event.block.timestamp
  claim.createdAtBlock = event.block.number
  claim.createdAtTransaction = event.transaction.hash
  claim.save()

  depositor.totalRewardsClaimed = depositor.totalRewardsClaimed.plus(event.params._amount)
  depositor.save()

  pool.totalKiteDistributed = pool.totalKiteDistributed.plus(event.params._amount)
  pool.save()
}

export function handleClaimRewardsFromEmissionsController(event: ClaimRewardsFromEmissionsController): void {
  let pool = getOrCreateStabilityPool(event.address)
  pool.totalKiteFromEmissions = pool.totalKiteFromEmissions.plus(event.params._amount)
  pool.save()
}

export function handleCoverAndRepayDebt(event: CoverAndRepayDebt): void {
  let pool = getOrCreateStabilityPool(event.address)

  let coverEvent = new CoverAndRepayDebtEvent(
    event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  )
  coverEvent.pool = pool.id
  coverEvent.auctionId = event.params._auctionId
  coverEvent.collateralType = event.params._collateralType
  coverEvent.collateralAmount = event.params._collateralAmount
  coverEvent.haiSpent = event.params._haiSpent
  coverEvent.haiReceived = event.params._haiReceived
  coverEvent.createdAt = event.block.timestamp
  coverEvent.createdAtBlock = event.block.number
  coverEvent.createdAtTransaction = event.transaction.hash
  coverEvent.save()

  pool.totalAuctionsCovered = pool.totalAuctionsCovered.plus(BigInt.fromI32(1))
  pool.save()
}

export function handleTransfersEnabled(event: TransfersEnabled): void {
  let pool = getOrCreateStabilityPool(event.address)
  pool.transfersEnabled = true
  pool.save()
}

export function handleKiteRewardsDeactivated(event: KiteRewardsDeactivated): void {
  let pool = getOrCreateStabilityPool(event.address)
  pool.kiteRewardsActive = false
  pool.save()
}

export function handleSweepInternalCoin(event: SweepInternalCoin): void {
  // State update only - no entity needed
  getOrCreateStabilityPool(event.address)
}

export function handleEmergencyWithdrawKite(event: EmergencyWithdrawKite): void {
  // State update only - no entity needed
  getOrCreateStabilityPool(event.address)
}

export function handleAddAuthorization(event: AddAuthorization): void {
  addAuthorization(event.params._account, event)
}

export function handleRemoveAuthorization(event: RemoveAuthorization): void {
  removeAuthorization(event.params._account, event)
}

export function handleSetStrategySteps(event: SetStrategySteps): void {
  let pool = getOrCreateStabilityPool(event.address)
  let strategyId = event.address.toHexString() + '-' + event.params._collateralType.toHexString()

  let strategy = StabilityPoolStrategy.load(strategyId)
  if (!strategy) {
    strategy = new StabilityPoolStrategy(strategyId)
    strategy.pool = pool.id
    strategy.collateralType = event.params._collateralType
    strategy.slippageBps = 0
  }

  let stepAddresses = event.params._steps
  let steps = new Array<Bytes>(stepAddresses.length)
  for (let i = 0; i < stepAddresses.length; i++) {
    steps[i] = stepAddresses[i]
  }
  strategy.stepAddresses = steps
  strategy.active = true
  strategy.save()
}

export function handleClearStrategySteps(event: ClearStrategySteps): void {
  let strategyId = event.address.toHexString() + '-' + event.params._collateralType.toHexString()
  let strategy = StabilityPoolStrategy.load(strategyId)
  if (strategy) {
    strategy.active = false
    strategy.stepAddresses = []
    strategy.save()
  }
}

export function handleSetStepWhitelist(event: SetStepWhitelist): void {
  let stepId = event.params._step.toHexString()
  let step = StabilityPoolWhitelistedStep.load(stepId)
  if (!step) {
    step = new StabilityPoolWhitelistedStep(stepId)
    step.address = event.params._step
  }
  step.allowed = event.params._allowed
  step.save()
}

export function handleSetCollateralSlippageBps(event: SetCollateralSlippageBps): void {
  let pool = getOrCreateStabilityPool(event.address)
  let strategyId = event.address.toHexString() + '-' + event.params._collateralType.toHexString()

  let strategy = StabilityPoolStrategy.load(strategyId)
  if (!strategy) {
    strategy = new StabilityPoolStrategy(strategyId)
    strategy.pool = pool.id
    strategy.collateralType = event.params._collateralType
    strategy.stepAddresses = []
    strategy.active = false
  }
  strategy.slippageBps = event.params._bps
  strategy.save()
}

export function handleSetStepTypeSlippageBps(event: SetStepTypeSlippageBps): void {
  // Step type slippage is tracked at the pool level but the step type is a bytes32
  // For now we just ensure the pool exists
  getOrCreateStabilityPool(event.address)
}

export function handleSetMinProfitBps(event: SetMinProfitBps): void {
  let pool = getOrCreateStabilityPool(event.address)
  pool.minProfitBps = event.params._bps
  pool.save()
}
