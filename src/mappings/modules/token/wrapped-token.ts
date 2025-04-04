import { BigDecimal, BigInt, Address, Bytes } from '@graphprotocol/graph-ts'
import {
  WrappedToken as WrappedTokenContract,
  WrappedTokenDeposit as WrappedTokenDepositEvent,
  Transfer as TransferEvent
} from '../../../../generated/WrappedToken/WrappedToken'
import {
  WrappedToken,
  WrappedTokenDeposit,
  WrappedTokenUserBalance,
  User
} from '../../../../generated/schema'
import { toDecimal } from '../../../utils/decimals'

// Helper function to load or create user
function getOrCreateUser(address: Address): User {
  let user = User.load(address.toHexString())
  if (user == null) {
    user = new User(address.toHexString())
    user.address = address
    user.save()
  }
  return user
}

// Helper function to load or create WrappedToken
function getOrCreateWrappedToken(
  address: Address,
  event: WrappedTokenDepositEvent
): WrappedToken {
  let token = WrappedToken.load(address.toHexString())
  if (token == null) {
    let contract = WrappedTokenContract.bind(address)
    
    token = new WrappedToken(address.toHexString())
    token.name = contract.name()
    token.symbol = contract.symbol()
    token.baseToken = contract.BASE_TOKEN()
    token.baseTokenManager = contract.baseTokenManager()
    token.totalDeposits = BigDecimal.fromString('0')
    token.depositorCount = BigInt.fromI32(0)
    token.createdAt = event.block.timestamp
    token.createdAtBlock = event.block.number
    token.createdAtTransaction = event.transaction.hash
    token.save()
  }
  return token
}

// Helper function to load or create user balance
function getOrCreateUserBalance(
  userAddress: Address,
  tokenAddress: Address,
  event: WrappedTokenDepositEvent
): WrappedTokenUserBalance {
  let id = userAddress.toHexString() + '-' + tokenAddress.toHexString()
  let userBalance = WrappedTokenUserBalance.load(id)
  
  if (userBalance == null) {
    let user = getOrCreateUser(userAddress)
    let token = getOrCreateWrappedToken(tokenAddress, event)
    let contract = WrappedTokenContract.bind(tokenAddress)
    
    userBalance = new WrappedTokenUserBalance(id)
    userBalance.user = user.id
    userBalance.wrappedToken = token.id
    userBalance.balance = toDecimal(contract.balanceOf(userAddress))
    userBalance.totalDeposited = BigDecimal.fromString('0')
    userBalance.depositCount = BigInt.fromI32(0)
    userBalance.createdAt = event.block.timestamp
    userBalance.createdAtBlock = event.block.number
    userBalance.createdAtTransaction = event.transaction.hash
    userBalance.save()
  }
  
  return userBalance
}

// Handle deposit events
export function handleWrappedTokenDeposit(event: WrappedTokenDepositEvent): void {
  let tokenAddress = event.address
  let userAddress = event.params.account
  let amount = toDecimal(event.params.amount)
  
  // Get or create the token entity
  let token = getOrCreateWrappedToken(tokenAddress, event)
  
  // Get or create the user entity
  let user = getOrCreateUser(userAddress)
  
  // Get or create the user balance entity
  let userBalance = getOrCreateUserBalance(userAddress, tokenAddress, event)
  
  // Update token entity
  token.totalDeposits = token.totalDeposits.plus(amount)
  if (userBalance.depositCount.equals(BigInt.fromI32(0))) {
    token.depositorCount = token.depositorCount.plus(BigInt.fromI32(1))
  }
  token.modifiedAt = event.block.timestamp
  token.modifiedAtBlock = event.block.number
  token.modifiedAtTransaction = event.transaction.hash
  token.save()
  
  // Update user balance entity
  userBalance.balance = toDecimal(
    WrappedTokenContract.bind(tokenAddress).balanceOf(userAddress)
  )
  userBalance.totalDeposited = userBalance.totalDeposited.plus(amount)
  userBalance.depositCount = userBalance.depositCount.plus(BigInt.fromI32(1))
  userBalance.modifiedAt = event.block.timestamp
  userBalance.modifiedAtBlock = event.block.number
  userBalance.modifiedAtTransaction = event.transaction.hash
  userBalance.save()
  
  // Create deposit entity
  let deposit = new WrappedTokenDeposit(
    event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  )
  deposit.user = user.id
  deposit.amount = amount
  deposit.wrappedToken = token.id
  deposit.createdAt = event.block.timestamp
  deposit.createdAtBlock = event.block.number
  deposit.createdAtTransaction = event.transaction.hash
  deposit.save()
}

// Handle transfer events to update balances
export function handleTransfer(event: TransferEvent): void {
  let tokenAddress = event.address
  let fromAddress = event.params.from
  let toAddress = event.params.to
  
  // Skip if mint or burn (from or to is zero address)
  if (
    fromAddress.toHexString() == '0x0000000000000000000000000000000000000000' || 
    toAddress.toHexString() == '0x0000000000000000000000000000000000000000'
  ) {
    return
  }
  
  let token = WrappedToken.load(tokenAddress.toHexString())
  if (token == null) {
    return
  }
  
  let contract = WrappedTokenContract.bind(tokenAddress)
  
  // Update sender balance
  let fromBalanceId = fromAddress.toHexString() + '-' + tokenAddress.toHexString()
  let fromBalance = WrappedTokenUserBalance.load(fromBalanceId)
  if (fromBalance != null) {
    fromBalance.balance = toDecimal(contract.balanceOf(fromAddress))
    fromBalance.modifiedAt = event.block.timestamp
    fromBalance.modifiedAtBlock = event.block.number
    fromBalance.modifiedAtTransaction = event.transaction.hash
    fromBalance.save()
  }
  
  // Update receiver balance
  let toBalanceId = toAddress.toHexString() + '-' + tokenAddress.toHexString()
  let toBalance = WrappedTokenUserBalance.load(toBalanceId)
  if (toBalance == null) {
    // Create new balance if doesn't exist
    let user = getOrCreateUser(toAddress)
    
    toBalance = new WrappedTokenUserBalance(toBalanceId)
    toBalance.user = user.id
    toBalance.wrappedToken = token.id
    toBalance.balance = toDecimal(contract.balanceOf(toAddress))
    toBalance.totalDeposited = BigDecimal.fromString('0')
    toBalance.depositCount = BigInt.fromI32(0)
    toBalance.createdAt = event.block.timestamp
    toBalance.createdAtBlock = event.block.number
    toBalance.createdAtTransaction = event.transaction.hash
    toBalance.save()
    
    token.depositorCount = token.depositorCount.plus(BigInt.fromI32(1))
    token.save()
  } else {
    toBalance.balance = toDecimal(contract.balanceOf(toAddress))
    toBalance.modifiedAt = event.block.timestamp
    toBalance.modifiedAtBlock = event.block.number
    toBalance.modifiedAtTransaction = event.transaction.hash
    toBalance.save()
  }
} 