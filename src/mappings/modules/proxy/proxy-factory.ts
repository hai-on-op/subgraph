import { UserProxy, User, SafeHandlerOwner } from '../../../../generated/schema'
import { Created } from '../../../../generated/ProxyFactory/HaiProxyFactory'
import { getOrCreateUser, getSystemState } from '../../../entities'

import * as integer from '../../../utils/integer'
import { Bytes } from '@graphprotocol/graph-ts'
import { addressMap } from '../../../utils/addresses'
import { allowanceId } from '../../../entities/erc20'

export function handleCreated(event: Created): void {
  let user = getOrCreateUser(event.params._owner)

  // Register new user proxy
  let proxy = new UserProxy(event.params._proxy.toHexString())
  proxy.address = event.params._proxy
  proxy.owner = user.id

  // We add a reference to the proxy allowances, note that these might not yet exist.
  proxy.coinAllowance = allowanceId(
    event.params._owner,
    addressMap.get('GEB_COIN'),
    event.params._proxy,
  )

  proxy.protAllowance = allowanceId(
    event.params._owner,
    addressMap.get('GEB_PROT'),
    event.params._proxy,
  )

  proxy.uniCoinLpAllowance = allowanceId(
    event.params._owner,
    addressMap.get('GEB_COIN_UNISWAP_POOL'),
    event.params._proxy,
  )

  proxy.save()

  // Update system state
  let system = getSystemState(event)
  system.proxyCount = system.proxyCount.plus(integer.ONE)
  system.save()
}

export function findProxy(address: Bytes): UserProxy | null {
  let proxy = UserProxy.load(address.toHexString())

  if (proxy) {
    return proxy as UserProxy
  } else {
    let handler = SafeHandlerOwner.load(address.toHexString())
    if (handler) {
      proxy = UserProxy.load(handler.owner)
      if (proxy) {
        return proxy as UserProxy
      } else {
        return null
      }
    } else {
      return null
    }
  }
}
