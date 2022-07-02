import { Contract } from '@ethersproject/contracts'
import { getAddress } from '@ethersproject/address'
import { AddressZero } from '@ethersproject/constants'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { BigNumber } from '@ethersproject/bignumber'

// abis
import StablesRouter from 'config/abi/avax/StableSwap.json'
import RedRequiem from 'config/abi/avax/BloodRedRequiem.json'
import Aggregator from 'config/abi/avax/RequiemAggregator.json'
import { Percent, Token, CurrencyAmount, Currency, NETWORK_CCY, STABLE_POOL_ADDRESS, StablePool, WeightedPool } from '@requiemswap/sdk'
import { SWAP_ROUTER } from '../config/constants'
import { BASE_EXPLORER_URLS, ChainId } from '../config'
import { TokenAddressMap } from '../state/lists/hooks'
import SwapRouter from '../config/abi/avax/SwapRouter.json'
import WeightedPoolABI from '../config/abi/avax/WeightedPool.json'
import { getRedRequiemAddress } from './addressHelpers'

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value: any): string | false {
  try {
    return getAddress(value)
  } catch {
    return false
  }
}

export function getNetworkExplorerLink(
  data: string | number,
  type: 'transaction' | 'token' | 'address' | 'block' | 'countdown',
  chainId: ChainId = ChainId.AVAX_TESTNET,
): string {
  switch (type) {
    case 'transaction': {
      return `${BASE_EXPLORER_URLS[chainId]}/tx/${data}`
    }
    case 'token': {
      return `${BASE_EXPLORER_URLS[chainId]}/token/${data}`
    }
    case 'block': {
      return `${BASE_EXPLORER_URLS[chainId]}/block/${data}`
    }
    case 'countdown': {
      return `${BASE_EXPLORER_URLS[chainId]}/block/countdown/${data}`
    }
    default: {
      return `${BASE_EXPLORER_URLS[chainId]}/address/${data}`
    }
  }
}

// shorten the checksummed version of the input address to have 0x + 4 characters at start and end
export function shortenAddress(address: string, chars = 4): string {
  const parsed = isAddress(address)
  if (!parsed) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return `${parsed.substring(0, chars + 2)}...${parsed.substring(42 - chars)}`
}

// add 10%
export function calculateGasMargin(value: BigNumber): BigNumber {
  return value.mul(BigNumber.from(10000).add(BigNumber.from(1000))).div(BigNumber.from(10000))
}

// converts a basis points value to a sdk percent
export function basisPointsToPercent(num: number): Percent {
  return new Percent(BigNumber.from(num), '10000')
}

export function calculateSlippageAmount(value: CurrencyAmount, slippage: number): [BigNumber, BigNumber] {
  if (slippage < 0 || slippage > 10000) {
    throw Error(`Unexpected slippage value: ${slippage}`)
  }
  return [
    value.raw.mul(10000 - slippage).div(10000),
    value.raw.mul(10000 + slippage).div(10000),
  ]
}

// account is not optional
export function getSigner(library: Web3Provider, account: string): JsonRpcSigner {
  return library.getSigner(account).connectUnchecked()
}

// account is optional
export function getProviderOrSigner(library: Web3Provider, account?: string): Web3Provider | JsonRpcSigner {
  return account ? getSigner(library, account) : library
}

// account is optional
export function getContract(address: string, ABI: any, library: Web3Provider, account?: string): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return new Contract(address, ABI, getProviderOrSigner(library, account) as any)
}

// account is optional
export function getRouterContract(chainId: number, library: Web3Provider, account?: string): Contract {
  const ABI = SwapRouter
  return getContract(SWAP_ROUTER[chainId], ABI, library, account)
}

// account is optional
export function getPairManagerContract(chainId: number, library: Web3Provider, account?: string): Contract {
  const ABI = SwapRouter
  return getContract(SWAP_ROUTER[chainId], ABI, library, account)
}

export function getSwapRouterContract(chainId: number, library: Web3Provider, account?: string): Contract {
  const ABI = SwapRouter
  return getContract(SWAP_ROUTER[chainId], ABI, library, account)
}

export function getStableRouterContract(chainId: number, library: Web3Provider, account?: string): Contract {
  const ABI = StablesRouter
  return getContract(STABLE_POOL_ADDRESS[chainId], ABI, library, account)
}

export function getStableSwapContract(pool: StablePool, library: Web3Provider, account?: string): Contract {
  const ABI = StablesRouter
  return getContract(pool.address, ABI, library, account)
}

export function getWeightedPoolContract(pool: WeightedPool, library: Web3Provider, account?: string): Contract {
  const ABI = WeightedPoolABI
  return getContract(pool.address, ABI, library, account)
}

export function getRedRequiemContract(chainId: number, library: Web3Provider, account?: string): Contract {
  const ABI = RedRequiem
  return getContract(getRedRequiemAddress(chainId), ABI, library, account)
}



export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

export function isTokenOnList(chainId: number, defaultTokens: TokenAddressMap, currency?: Currency): boolean {
  if (currency === NETWORK_CCY[chainId]) {
    return true
  }
  return Boolean(currency instanceof Token && defaultTokens[currency.chainId]?.[currency.address])
}
