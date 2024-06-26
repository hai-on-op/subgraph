import {
  ModifyParameters as ModifyParameters,
  DecreaseSoldAmount,
  RestartAuction,
  SettleAuction,
  AddAuthorization,
  RemoveAuthorization,
} from '../../../../generated/DebtAuctionHouse/DebtAuctionHouse'
import { UserProxy, User } from '../../../../generated/schema'

import { EnglishAuctionConfiguration, EnglishAuctionBid, EnglishAuction } from '../../../entities'
import { dataSource, log, BigInt } from '@graphprotocol/graph-ts'

import { toUnsignedInt } from '../../../utils/bytes'
import * as decimal from '../../../utils/decimal'
import * as integer from '../../../utils/integer'
import * as enums from '../../../utils/enums'
import { getOrCreateEnglishAuctionConfiguration } from '../../../entities/auctions'
import { addAuthorization, removeAuthorization } from '../governance/authorizations'
import { getOrCreateAccountingEngine } from '../../../entities/accounting-engine'
import { findProxy } from '../proxy/proxy-factory'

export function handleModifyParameters(event: ModifyParameters): void {
  let what = event.params._param.toString()

  let config = getOrCreateEnglishAuctionConfiguration(
    dataSource.address(),
    enums.EnglishAuctionType_DEBT,
  )
  let val = toUnsignedInt(event.params._data)

  if (what == 'bidIncrease') {
    config.bidIncrease = decimal.fromWad(val)
  } else if (what == 'bidDuration') {
    config.bidDuration = val
  } else if (what == 'totalAuctionLength') {
    config.totalAuctionLength = val
  } else if (what == 'amountSoldIncrease') {
    config.DEBT_amountSoldIncrease = decimal.fromWad(val)
  }

  config.save()
}

export function handleDecreaseSoldAmount(event: DecreaseSoldAmount): void {
  let auction = EnglishAuction.load(auctionId(event.params._id))
  if (auction != null) {
    let bid = new EnglishAuctionBid(bidAuctionId(event.params._id, auction.numberOfBids))

    let proxy = findProxy(event.params._bidder)
    if (proxy != null) {
      let owner = User.load(proxy.owner)
      if (owner != null) {
        bid.owner = owner.address
      }
    }

    bid.bidNumber = auction.numberOfBids
    bid.type = enums.EnglishBidType_DECREASE_SOLD
    bid.auction = auction.id
    bid.sellAmount = decimal.fromWad(event.params._soldAmount)
    bid.buyAmount = auction.buyInitialAmount
    bid.price = bid.sellAmount.div(bid.buyAmount)
    bid.bidder = event.params._bidder
    bid.createdAt = event.block.timestamp
    bid.createdAtBlock = event.block.number
    bid.createdAtTransaction = event.transaction.hash
    bid.save()

    auction.numberOfBids = auction.numberOfBids.plus(integer.ONE)
    auction.auctionDeadline = event.params._bidExpiry
    auction.sellAmount = bid.sellAmount
    auction.price = bid.price
    auction.winner = bid.bidder
    auction.save()
  }
}

export function handleRestartAuction(event: RestartAuction): void {
  let auction = EnglishAuction.load(auctionId(event.params._id))
  if (auction != null) {
      auction.auctionDeadline = event.params._auctionDeadline
      let timestamps = auction.auctionRestartTimestamps
      let hashes = auction.auctionRestartHashes

      timestamps.push(event.block.timestamp!)
      hashes.push(event.transaction.hash!)
      auction.auctionRestartTimestamps = timestamps
      auction.auctionRestartHashes = hashes
      auction.save()

  }
}

export function handleSettleAuction(event: SettleAuction): void {
  let accounting = getOrCreateAccountingEngine(event)
  accounting.activeDebtAuctions = accounting.activeDebtAuctions.minus(integer.ONE)
  accounting.save()
  let auction = EnglishAuction.load(auctionId(event.params._id))
  if (auction != null) {
    auction.isClaimed = true
    auction.save()
  }
}

function auctionId(auctionId: BigInt): string {
  return enums.EnglishAuctionType_DEBT + '-' + auctionId.toString()
}

function bidAuctionId(auctionId: BigInt, bidNumber: BigInt): string {
  return enums.EnglishAuctionType_DEBT + '-' + auctionId.toString() + '-' + bidNumber.toString()
}

export function handleAddAuthorization(event: AddAuthorization): void {
  addAuthorization(event.params._account, event)
}

export function handleRemoveAuthorization(event: RemoveAuthorization): void {
  removeAuthorization(event.params._account, event)
}
