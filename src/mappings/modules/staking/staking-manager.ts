import { BigInt, Address } from '@graphprotocol/graph-ts'
import {
  StakingManagerStaked,
  StakingManagerWithdrawalInitiated,
  StakingManagerWithdrawalCancelled,
  StakingManagerWithdrawn,
  StakingManagerRewardPaid
} from '../../../../generated/StakingManager/StakingManager'
import {
  StakingUser,
  StakingPosition,
  PendingWithdrawal,
  RewardClaim,
  StakingStatistic
} from '../../../../generated/schema'

// Previously defined handlers
export function handleStakingManagerStaked(event: StakingManagerStaked): void {
    let user = getOrCreateUser(event.params._account)
    let position = new StakingPosition(
      event.params._account.toHexString() + event.block.timestamp.toString()
    )
    
    user.stakedBalance = user.stakedBalance.plus(event.params._wad)
    user.totalStaked = user.totalStaked.plus(event.params._wad)
    
    position.user = user.id
    position.amount = event.params._wad
    position.timestamp = event.block.timestamp
    position.type = "STAKE"
    position.transactionHash = event.transaction.hash.toHexString()
    
    user.save()
    position.save()
    updateStakingStatistics(event.params._wad, true)
  }
  
  export function handleStakingManagerWithdrawalInitiated(event: StakingManagerWithdrawalInitiated): void {
    let user = getOrCreateUser(event.params._account)
    let pendingWithdrawal = new PendingWithdrawal(event.params._account.toHexString())
    let position = new StakingPosition(
      event.params._account.toHexString() + event.block.timestamp.toString()
    )
    
    pendingWithdrawal.user = user.id
    pendingWithdrawal.amount = event.params._wad
    pendingWithdrawal.timestamp = event.block.timestamp
    pendingWithdrawal.status = "PENDING"
    
    position.user = user.id
    position.amount = event.params._wad
    position.timestamp = event.block.timestamp
    position.type = "INITIATE_WITHDRAWAL"
    position.transactionHash = event.transaction.hash.toHexString()
    
    user.pendingWithdrawal = pendingWithdrawal.id
    user.stakedBalance = user.stakedBalance.minus(event.params._wad)
    
    user.save()
    pendingWithdrawal.save()
    position.save()
  }
  
  // New handlers for the remaining events
  export function handleStakingManagerWithdrawalCancelled(event: StakingManagerWithdrawalCancelled): void {
    let user = getOrCreateUser(event.params._account)
    let pendingWithdrawal = PendingWithdrawal.load(event.params._account.toHexString())
    let position = new StakingPosition(
      event.params._account.toHexString() + event.block.timestamp.toString()
    )
    
    if (pendingWithdrawal) {
      pendingWithdrawal.status = "CANCELLED"
      pendingWithdrawal.save()
    }
    
    user.stakedBalance = user.stakedBalance.plus(event.params._wad)
    user.pendingWithdrawal = null
    
    position.user = user.id
    position.amount = event.params._wad
    position.timestamp = event.block.timestamp
    position.type = "CANCEL_WITHDRAWAL"
    position.transactionHash = event.transaction.hash.toHexString()
    
    user.save()
    position.save()
  }
  
  export function handleStakingManagerWithdrawn(event: StakingManagerWithdrawn): void {
    let user = getOrCreateUser(event.params._account)
    let pendingWithdrawal = PendingWithdrawal.load(event.params._account.toHexString())
    let position = new StakingPosition(
      event.params._account.toHexString() + event.block.timestamp.toString()
    )
    
    if (pendingWithdrawal) {
      pendingWithdrawal.status = "COMPLETED"
      pendingWithdrawal.save()
    }
    
    user.totalWithdrawn = user.totalWithdrawn.plus(event.params._wad)
    user.pendingWithdrawal = null
    
    position.user = user.id
    position.amount = event.params._wad
    position.timestamp = event.block.timestamp
    position.type = "WITHDRAW"
    position.transactionHash = event.transaction.hash.toHexString()
    
    user.save()
    position.save()
    updateStakingStatistics(event.params._wad, false)
  }
  
  export function handleStakingManagerRewardPaid(event: StakingManagerRewardPaid): void {
    let user = getOrCreateUser(event.params._account)
    let rewardClaim = new RewardClaim(
      event.params._account.toHexString() + event.block.timestamp.toString()
    )
    
    rewardClaim.user = user.id
    rewardClaim.rewardToken = event.params._rewardToken
    rewardClaim.amount = event.params._wad
    rewardClaim.destination = event.params._destination
    rewardClaim.timestamp = event.block.timestamp
    rewardClaim.transactionHash = event.transaction.hash.toHexString()
    
    let stats = getOrCreateStakingStatistics()
    stats.totalRewardsPaid = stats.totalRewardsPaid.plus(event.params._wad)
    
    rewardClaim.save()
    stats.save()
  }
  
  // Helper functions
  function getOrCreateUser(address: Address): StakingUser {
    let user = StakingUser.load(address.toHexString())
    
    if (!user) {
      user = new StakingUser(address.toHexString())
      user.stakedBalance = BigInt.fromI32(0)
      user.totalStaked = BigInt.fromI32(0)
      user.totalWithdrawn = BigInt.fromI32(0)
    }
    
    return user
  }
  
  function getOrCreateStakingStatistics(): StakingStatistic {
    let stats = StakingStatistic.load("singleton")
    
    if (!stats) {
      stats = new StakingStatistic("singleton")
      stats.totalStaked = BigInt.fromI32(0)
      stats.totalStakers = BigInt.fromI32(0)
      stats.totalRewardsPaid = BigInt.fromI32(0)
    }
    
    return stats
  }
  
  function updateStakingStatistics(amount: BigInt, isStaking: boolean): void {
    let stats = getOrCreateStakingStatistics()
    
    if (isStaking) {
      stats.totalStaked = stats.totalStaked.plus(amount)
      stats.totalStakers = stats.totalStakers.plus(BigInt.fromI32(1))
    } else {
      stats.totalStaked = stats.totalStaked.minus(amount)
      stats.totalStakers = stats.totalStakers.minus(BigInt.fromI32(1))
    }
    
    stats.save()
  }