import { BigInt, Address, Bytes } from '@graphprotocol/graph-ts'
import {
  EmissionsController as EmissionsControllerContract,
  UpdateRewardSplit,
  ClaimRewardsForStabilityPool,
  SetStabilityRewardsReceiver,
  EmergencyWithdrawKite,
  ExtendEmissions,
  MarkMintingRewardsDistributed,
} from '../../../../generated/EmissionsController/EmissionsController'
import {
  EmissionsController,
  EmissionsEvent,
} from '../../../../generated/schema'

let ZERO = BigInt.fromI32(0)

function getOrCreateEmissionsController(address: Address): EmissionsController {
  let controller = EmissionsController.load(address.toHexString())
  if (!controller) {
    controller = new EmissionsController(address.toHexString())
    controller.totalKiteAmount = ZERO
    controller.emissionStartTime = ZERO
    controller.emissionEndTime = ZERO
    controller.baseEmissionRate = ZERO
    controller.deviationLimit = ZERO
    controller.stabilityPoolSplit = ZERO
    controller.mintingSplit = ZERO
    controller.currentStabilityPoolRate = ZERO
    controller.currentMintingRate = ZERO
    controller.currentRateStartTime = ZERO
    controller.stabilityPoolCumulativeRewards = ZERO
    controller.mintingCumulativeRewards = ZERO
    controller.mintingRewardsLastDistributed = ZERO
    controller.lastCheckpointTime = ZERO
    controller.lastSplitUpdateTime = ZERO
    controller.totalClaimedForStabilityPool = ZERO
    controller.totalMintingRewardsDistributed = ZERO
    controller.extensionCount = ZERO
    controller.save()
  }
  return controller
}

function syncContractState(controller: EmissionsController, address: Address): void {
  let contract = EmissionsControllerContract.bind(address)

  let totalKiteAmount = contract.try_totalKiteAmount()
  if (!totalKiteAmount.reverted) controller.totalKiteAmount = totalKiteAmount.value

  let emissionStartTime = contract.try_emissionStartTime()
  if (!emissionStartTime.reverted) controller.emissionStartTime = emissionStartTime.value

  let emissionEndTime = contract.try_emissionEndTime()
  if (!emissionEndTime.reverted) controller.emissionEndTime = emissionEndTime.value

  let baseEmissionRate = contract.try_baseEmissionRate()
  if (!baseEmissionRate.reverted) controller.baseEmissionRate = baseEmissionRate.value

  let deviationLimit = contract.try_deviationLimit()
  if (!deviationLimit.reverted) controller.deviationLimit = deviationLimit.value

  let stabilityPoolSplit = contract.try_stabilityPoolSplit()
  if (!stabilityPoolSplit.reverted) controller.stabilityPoolSplit = stabilityPoolSplit.value

  let mintingSplit = contract.try_mintingSplit()
  if (!mintingSplit.reverted) controller.mintingSplit = mintingSplit.value

  let currentStabilityPoolRate = contract.try_currentStabilityPoolRate()
  if (!currentStabilityPoolRate.reverted) controller.currentStabilityPoolRate = currentStabilityPoolRate.value

  let currentMintingRate = contract.try_currentMintingRate()
  if (!currentMintingRate.reverted) controller.currentMintingRate = currentMintingRate.value

  let currentRateStartTime = contract.try_currentRateStartTime()
  if (!currentRateStartTime.reverted) controller.currentRateStartTime = currentRateStartTime.value

  let stabilityPoolCumulativeRewards = contract.try_stabilityPoolCumulativeRewards()
  if (!stabilityPoolCumulativeRewards.reverted) controller.stabilityPoolCumulativeRewards = stabilityPoolCumulativeRewards.value

  let mintingCumulativeRewards = contract.try_mintingCumulativeRewards()
  if (!mintingCumulativeRewards.reverted) controller.mintingCumulativeRewards = mintingCumulativeRewards.value

  let mintingRewardsLastDistributed = contract.try_mintingRewardsLastDistributed()
  if (!mintingRewardsLastDistributed.reverted) controller.mintingRewardsLastDistributed = mintingRewardsLastDistributed.value

  let lastCheckpointTime = contract.try_lastCheckpointTime()
  if (!lastCheckpointTime.reverted) controller.lastCheckpointTime = lastCheckpointTime.value

  let lastSplitUpdateTime = contract.try_lastSplitUpdateTime()
  if (!lastSplitUpdateTime.reverted) controller.lastSplitUpdateTime = lastSplitUpdateTime.value
}

function createEmissionsEvent(
  controller: EmissionsController,
  eventType: string,
  txHash: Bytes,
  logIndex: BigInt,
  timestamp: BigInt,
  blockNumber: BigInt,
): EmissionsEvent {
  let emissionsEvent = new EmissionsEvent(
    txHash.toHexString() + '-' + logIndex.toString()
  )
  emissionsEvent.controller = controller.id
  emissionsEvent.type = eventType
  emissionsEvent.createdAt = timestamp
  emissionsEvent.createdAtBlock = blockNumber
  emissionsEvent.createdAtTransaction = txHash
  return emissionsEvent
}

export function handleUpdateRewardSplit(event: UpdateRewardSplit): void {
  let controller = getOrCreateEmissionsController(event.address)
  syncContractState(controller, event.address)
  controller.save()

  let emissionsEvent = createEmissionsEvent(
    controller,
    'UPDATE_REWARD_SPLIT',
    event.transaction.hash,
    event.logIndex,
    event.block.timestamp,
    event.block.number,
  )
  emissionsEvent.amount = event.params.stabilityPoolSplit
  emissionsEvent.amount2 = event.params.mintingSplit
  emissionsEvent.save()
}

export function handleClaimRewardsForStabilityPool(event: ClaimRewardsForStabilityPool): void {
  let controller = getOrCreateEmissionsController(event.address)
  controller.totalClaimedForStabilityPool = controller.totalClaimedForStabilityPool.plus(event.params._amount)
  syncContractState(controller, event.address)
  controller.save()

  let emissionsEvent = createEmissionsEvent(
    controller,
    'CLAIM_REWARDS_FOR_STABILITY_POOL',
    event.transaction.hash,
    event.logIndex,
    event.block.timestamp,
    event.block.number,
  )
  emissionsEvent.amount = event.params._amount
  emissionsEvent.save()
}

export function handleSetStabilityRewardsReceiver(event: SetStabilityRewardsReceiver): void {
  let controller = getOrCreateEmissionsController(event.address)
  controller.stabilityRewardsReceiver = event.params._receiver
  syncContractState(controller, event.address)
  controller.save()

  let emissionsEvent = createEmissionsEvent(
    controller,
    'SET_STABILITY_REWARDS_RECEIVER',
    event.transaction.hash,
    event.logIndex,
    event.block.timestamp,
    event.block.number,
  )
  emissionsEvent.address = event.params._receiver
  emissionsEvent.save()
}

export function handleEmergencyWithdrawKite(event: EmergencyWithdrawKite): void {
  let controller = getOrCreateEmissionsController(event.address)
  syncContractState(controller, event.address)
  controller.save()

  let emissionsEvent = createEmissionsEvent(
    controller,
    'EMERGENCY_WITHDRAW_KITE',
    event.transaction.hash,
    event.logIndex,
    event.block.timestamp,
    event.block.number,
  )
  emissionsEvent.address = event.params._rescueReceiver
  emissionsEvent.amount = event.params._wad
  emissionsEvent.save()
}

export function handleExtendEmissions(event: ExtendEmissions): void {
  let controller = getOrCreateEmissionsController(event.address)
  controller.extensionCount = controller.extensionCount.plus(BigInt.fromI32(1))
  syncContractState(controller, event.address)
  controller.save()

  let emissionsEvent = createEmissionsEvent(
    controller,
    'EXTEND_EMISSIONS',
    event.transaction.hash,
    event.logIndex,
    event.block.timestamp,
    event.block.number,
  )
  emissionsEvent.amount = event.params._additionalKiteAmount
  emissionsEvent.amount2 = event.params._newEndTime
  emissionsEvent.save()
}

export function handleMarkMintingRewardsDistributed(event: MarkMintingRewardsDistributed): void {
  let controller = getOrCreateEmissionsController(event.address)
  controller.totalMintingRewardsDistributed = controller.totalMintingRewardsDistributed.plus(event.params._amount)
  syncContractState(controller, event.address)
  controller.save()

  let emissionsEvent = createEmissionsEvent(
    controller,
    'MARK_MINTING_REWARDS_DISTRIBUTED',
    event.transaction.hash,
    event.logIndex,
    event.block.timestamp,
    event.block.number,
  )
  emissionsEvent.amount = event.params._amount
  emissionsEvent.save()
}
