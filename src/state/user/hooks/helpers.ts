import { Token, ChainId } from '@pancakeswap/sdk'
import { parseUnits } from 'ethers/lib/utils'
import { SerializedToken } from '../actions'

export function serializeToken(token: Token): SerializedToken {
  return {
    chainId: token.chainId,
    address: token.address,
    decimals: token.decimals,
    symbol: token.symbol,
    name: token.name,
  }
}

export function deserializeToken(serializedToken: SerializedToken): Token {
  return new Token(
    serializedToken.chainId,
    serializedToken.address,
    serializedToken.decimals,
    serializedToken.symbol,
    serializedToken.name,
  )
}

export enum GAS_PRICE {
  default = '5',
  fast = '6',
  instant = '7',
  testnet = '10',
  avaxTest = '200',
  avaxDefault= '100',
  avaxFast= '150',
  avaxInstant= '200',
}

export const GAS_PRICE_GWEI = {
  [ChainId.BSC_TESTNET]: {
    default: parseUnits(GAS_PRICE.default, 'gwei').toString(),
    fast: parseUnits(GAS_PRICE.fast, 'gwei').toString(),
    instant: parseUnits(GAS_PRICE.instant, 'gwei').toString(),
    testnet: parseUnits(GAS_PRICE.testnet, 'gwei').toString(),
  },
  [ChainId.BSC_MAINNET]: {
    default: parseUnits(GAS_PRICE.default, 'gwei').toString(),
    fast: parseUnits(GAS_PRICE.fast, 'gwei').toString(),
    instant: parseUnits(GAS_PRICE.instant, 'gwei').toString(),
    testnet: parseUnits(GAS_PRICE.testnet, 'gwei').toString(),
  },
  [ChainId.MATIC_TESTNET]: {
    default: parseUnits(GAS_PRICE.default, 'gwei').toString(),
    fast: parseUnits(GAS_PRICE.fast, 'gwei').toString(),
    instant: parseUnits(GAS_PRICE.instant, 'gwei').toString(),
    testnet: parseUnits(GAS_PRICE.testnet, 'gwei').toString(),
  },
  [ChainId.MATIC_TESTNET]: {
    default: parseUnits(GAS_PRICE.default, 'gwei').toString(),
    fast: parseUnits(GAS_PRICE.fast, 'gwei').toString(),
    instant: parseUnits(GAS_PRICE.instant, 'gwei').toString(),
    testnet: parseUnits(GAS_PRICE.testnet, 'gwei').toString(),
  },
  [ChainId.AVAX_MAINNET]: {
    default: parseUnits(GAS_PRICE.avaxDefault, 'gwei').toString(),
    fast: parseUnits(GAS_PRICE.avaxFast, 'gwei').toString(),
    instant: parseUnits(GAS_PRICE.avaxInstant, 'gwei').toString(),
    testnet: parseUnits(GAS_PRICE.testnet, 'gwei').toString(),
  },
  [ChainId.AVAX_TESTNET]: {
    default: parseUnits(GAS_PRICE.avaxTest, 'gwei').toString(),
    fast: parseUnits(GAS_PRICE.avaxTest, 'gwei').toString(),
    instant: parseUnits(GAS_PRICE.avaxTest, 'gwei').toString(),
    testnet: parseUnits(GAS_PRICE.avaxTest, 'gwei').toString(),
  },
  99999:{default: parseUnits('5', 'gwei').toString(),},
  default: parseUnits('5', 'gwei').toString(),

}
