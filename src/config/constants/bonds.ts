import { ChainId, WRAPPED_NETWORK_TOKENS } from '@requiemswap/sdk'
import { abi as DaiBondContract } from 'config/abi/DaiBondContract.json'
import { ethers } from 'ethers'
import { serializeToken } from 'state/user/hooks/helpers'
import tokens, { serializeTokens } from './tokens'
import { BondConfig, BondType } from './types'


export const bondList: { [chainId in ChainId]?: BondConfig[] } = {
  [ChainId.AVAX_TESTNET]: [
    {
      bondId: 0,
      isBondable: {
        [ChainId.AVAX_TESTNET]: true,
        [ChainId.AVAX_MAINNET]: false
      },
      isClaimable: {
        [ChainId.AVAX_TESTNET]: true,
        [ChainId.AVAX_MAINNET]: false
      },
      isLP: false,
      name: "80% REQT - 20% DAI",
      displayName: "80% REQT - 20% DAI",
      bondToken: "DAI REQT LP",
      payoutToken: "REQT",
      bondIconSvg: 'CvxImg',
      // bondContractABI: new ethers.utils.Interface(DaiBondContract),
      // reserveContract: '',
      type: BondType.LP,
      displayUnits: '4',
      bondAddress: {
        43114: "0x767e3459A35419122e5F6274fB1223d75881E0a9",
        43113: "0xd43940687f6e76056789d00c43A40939b7a559b5"
      },
      reserveAddress: {
        43114: "0xcde9f3be9786e91b3b309bcf5f6de69c9ea8739c",
        43113: "0xcde9f3be9786e91b3b309bcf5f6de69c9ea8739c"
      }, depositoryAddress: {
        43113: '0x0D5Ff7e85Bf536A26CaFD411FF333c453D5ca455'
      },
      lpProperties: {
        weightToken: 80,
        weightQuoteToken: 20,
        fee: 25
      }
    },
    {
      bondId: 1,
      isBondable: {
        [ChainId.AVAX_TESTNET]: true,
        [ChainId.AVAX_MAINNET]: false
      },
      isClaimable: {
        [ChainId.AVAX_TESTNET]: true,
        [ChainId.AVAX_MAINNET]: false
      },
      isLP: false,
      name: "REQT SLP",
      displayName: "REQT - Stable LP",
      bondToken: "Stable Swap LP",
      payoutToken: "REQT",
      bondIconSvg: 'CvxImg',
      // bondContractABI: new ethers.utils.Interface(DaiBondContract),
      // reserveContract: '',
      type: BondType.StableAsset,
      displayUnits: '4',
      bondAddress: {
        43114: "0x767e3459A35419122e5F6274fB1223d75881E0a9",
        43113: "0xd43940687f6e76056789d00c43A40939b7a559b5"
      },
      reserveAddress: {
        43114: "0xcde9f3be9786e91b3b309bcf5f6de69c9ea8739c",
        43113: "0xcde9f3be9786e91b3b309bcf5f6de69c9ea8739c"
      },
      depositoryAddress: {
        43113: '0x8f22De93BdfD96e7ab7816FadaB26F8BB08A11c3'
      },
      lpProperties: {
        weightToken: 80,
        weightQuoteToken: 20,
        fee: 25
      }
    }
  ],
  [ChainId.BSC_TESTNET]: [],
  [ChainId.MATIC_MAINNET]: [],
  [ChainId.AVAX_MAINNET]: [],
  [ChainId.ARBITRUM_MAINNET]: [],
  [ChainId.ARBITRUM_TETSNET_RINKEBY]: []
}




export const bonds = (chainId: number): BondConfig[] => {
  // [ChainId.AVAX_TESTNET]: [
  const serializedTokens = serializeTokens(chainId ?? 43113)
  const serializedNetworkCcy = serializeToken(WRAPPED_NETWORK_TOKENS[chainId ?? 43113])
  return [
    {
      bondId: 0,
      isBondable: {
        [ChainId.AVAX_TESTNET]: true,
        [ChainId.AVAX_MAINNET]: false
      },
      isClaimable: {
        [ChainId.AVAX_TESTNET]: true,
        [ChainId.AVAX_MAINNET]: false
      },
      isLP: false,
      name: "80% REQT 20% DAI LP",
      displayName: "80%REQT/20%DAI",
      bondToken: "DAI REQT LP",
      payoutToken: "REQT",
      bondIconSvg: 'CvxImg',
      // bondContractABI: new ethers.utils.Interface(DaiBondContract),
      // reserveContract: '',
      type: BondType.LP,
      displayUnits: '4',
      bondAddress: {
        43114: "0x767e3459A35419122e5F6274fB1223d75881E0a9",
        43113: "0xd43940687f6e76056789d00c43A40939b7a559b5"
      },
      reserveAddress: {
        43114: "0xcde9f3be9786e91b3b309bcf5f6de69c9ea8739c",
        43113: "0xcde9f3be9786e91b3b309bcf5f6de69c9ea8739c"
      },
      depositoryAddress: {
        43113: '0x0D5Ff7e85Bf536A26CaFD411FF333c453D5ca455'
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
      bondId: 1,
      isBondable: {
        [ChainId.AVAX_TESTNET]: true,
        [ChainId.AVAX_MAINNET]: false
      },
      isClaimable: {
        [ChainId.AVAX_TESTNET]: true,
        [ChainId.AVAX_MAINNET]: false
      },
      isLP: false,
      name: "REQT SLP",
      displayName: "REQT - Stable LP",
      bondToken: "Stable Swap LP",
      payoutToken: "REQT",
      bondIconSvg: 'CvxImg',
      // bondContractABI: new ethers.utils.Interface(DaiBondContract),
      // reserveContract: '',
      type: BondType.StableAsset,
      displayUnits: '4',
      bondAddress: {
        43113: "0xd43940687f6e76056789d00c43A40939b7a559b5"
      },
      reserveAddress: {
        43113: "0x1152803C660f86D262f9A235612ddc82f705c0bD"
      },
      depositoryAddress: {
        43113: '0x8f22De93BdfD96e7ab7816FadaB26F8BB08A11c3'
      },
      token: serializedTokens.wavax,
      quoteToken: serializedTokens.usdc,
      lpProperties: {
        weightToken: 50,
        weightQuoteToken: 50,
        fee: 10
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