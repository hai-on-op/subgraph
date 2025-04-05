import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let BI_18 = BigInt.fromI32(18)

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}

export function toDecimal(value: BigInt, decimals: BigInt = BI_18): BigDecimal {
  if (value.equals(ZERO_BI)) {
    return ZERO_BD
  }
  return value.toBigDecimal().div(exponentToBigDecimal(decimals))
}

export function fromDecimal(amount: BigDecimal, decimals: BigInt = BI_18): BigInt {
  if (amount.equals(ZERO_BD)) {
    return ZERO_BI
  }
  return BigInt.fromString(amount.times(exponentToBigDecimal(decimals)).toString().split('.')[0])
} 