import { ChainId, WRAPPED_NETWORK_TOKENS } from '@requiemswap/sdk'
import { abi as DaiBondContract } from 'config/abi/DaiBondContract.json'
import { ethers } from 'ethers'
import { serializeToken } from 'state/user/hooks/helpers'
import tokens, { serializeTokens } from './tokens'
import { BondConfig, BondType } from './types'

export const bonds = (chainId: number): BondConfig[] => {
  // [ChainId.AVAX_TESTNET]: [
  const serializedTokens = serializeTokens(chainId ?? 43113)
  const serializedNetworkCcy = serializeToken(WRAPPED_NETWORK_TOKENS[chainId ?? 43113])
  return [
    {
      bondId: 4,
      isBondable: {
        [ChainId.AVAX_TESTNET]: true,
        [ChainId.AVAX_MAINNET]: false
      },
      isClaimable: {
        [ChainId.AVAX_TESTNET]: true,
        [ChainId.AVAX_MAINNET]: false
      },
      isLP: false,
      name: "80/20 REQT-DAI",
      displayName: "80% REQT - 20% DAI",
      bondToken: "DAI REQT LP",
      payoutToken: "abREQ",
      bondIconSvg: 'CvxImg',
      // bondContractABI: new ethers.utils.Interface(DaiBondContract),
      // reserveContract: '',
      type: BondType.PairLP,
      displayUnits: '4',
      reserveAddress: {
        43114: "0xcde9f3be9786e91b3b309bcf5f6de69c9ea8739c",
        43113: "0xcde9f3be9786e91b3b309bcf5f6de69c9ea8739c"
      },
      token: serializedTokens.reqt,
      quoteToken: serializedTokens.dai,
      lpProperties: {
        weightToken: 80,
        weightQuoteToken: 20,
        fee: 25
      }
    },
    {
      bondId: 5,
      isBondable: {
        [ChainId.AVAX_TESTNET]: true,
        [ChainId.AVAX_MAINNET]: false
      },
      isClaimable: {
        [ChainId.AVAX_TESTNET]: true,
        [ChainId.AVAX_MAINNET]: false
      },
      isLP: false,
      name: " 50/50 WAVAX-USDC LP",
      displayName: "REQT LP",
      bondToken: "Swap LP",
      payoutToken: "abREQ",
      bondIconSvg: 'CvxImg',
      // bondContractABI: new ethers.utils.Interface(DaiBondContract),
      // reserveContract: '',
      type: BondType.PairLP,
      token: serializedTokens.wavax,
      quoteToken: serializedTokens.usdc,
      displayUnits: '4',
      reserveAddress: {
        43114: "0x1152803C660f86D262f9A235612ddc82f705c0bD",
        43113: "0x1152803C660f86D262f9A235612ddc82f705c0bD"
      },
      lpProperties: {
        weightToken: 80,
        weightQuoteToken: 20,
        fee: 25
      }
    },
    {
      bondId: 6,
      isBondable: {
        [ChainId.AVAX_TESTNET]: true,
        [ChainId.AVAX_MAINNET]: false
      },
      isClaimable: {
        [ChainId.AVAX_TESTNET]: true,
        [ChainId.AVAX_MAINNET]: false
      },
      isLP: false,
      name: "req4USD LP",
      displayName: "REQT - Stable LP",
      bondToken: "Stable Swap LP",
      payoutToken: "abREQ",
      bondIconSvg: 'CvxImg',
      // bondContractABI: new ethers.utils.Interface(DaiBondContract),
      // reserveContract: '',
      type: BondType.StableSwapLP,
      displayUnits: '4',
      token: serializedTokens.dai,
      quoteToken: serializedTokens.usdc,
      token2: serializedTokens.tusd,
      token3: serializedTokens.usdt,
      reserveAddress: {
        43114: "0x3372DE341A07418765Ae12f77aEe9029EaA4442A",
        43113: "0x3372DE341A07418765Ae12f77aEe9029EaA4442A"
      },
      lpProperties: {
        weightToken: 80,
        weightQuoteToken: 20,
        fee: 25
      }
    }
  ]
  // ],
  // [ChainId.BSC_TESTNET]: [],
  // [ChainId.MATIC_MAINNET]: [],
  // [ChainId.AVAX_MAINNET]: [],
  // [ChainId.ARBITRUM_MAINNET]: [],
  // [ChainId.ARBITRUM_TETSNET_RINKEBY]: []
}