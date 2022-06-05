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
      bondId: 7,
      isBondable: {
        [ChainId.AVAX_TESTNET]: true,
        [ChainId.AVAX_MAINNET]: false
      },
      isClaimable: {
        [ChainId.AVAX_TESTNET]: true,
        [ChainId.AVAX_MAINNET]: false
      },
      isLP: false,
      name: "60/40 AREQ-DAI",
      displayName: "60% AREQ - 40% DAI",
      bondToken: "DAI abREQ LP",
      payoutToken: "abREQ",
      bondIconSvg: 'CvxImg',
      // bondContractABI: new ethers.utils.Interface(DaiBondContract),
      // reserveContract: '',
      type: BondType.PairLP,
      displayUnits: '4',
      reserveAddress: {
        43114: "0x086AbCBD5377fFCD5441f0da1969eb468903b693",
        43113: "0x086AbCBD5377fFCD5441f0da1969eb468903b693"
      },
      tokens: [serializedTokens.reqt, serializedTokens.dai],
      quoteTokenIndex: 1,
      lpProperties: {
        weightToken: 70,
        weightQuoteToken: 30,
        fee: 50
      }
    },
    // {
    //   bondId: 5,
    //   isBondable: {
    //     [ChainId.AVAX_TESTNET]: true,
    //     [ChainId.AVAX_MAINNET]: false
    //   },
    //   isClaimable: {
    //     [ChainId.AVAX_TESTNET]: true,
    //     [ChainId.AVAX_MAINNET]: false
    //   },
    //   isLP: false,
    //   name: " 50/50 WAVAX-USDC LP",
    //   displayName: "REQT LP",
    //   bondToken: "Swap LP",
    //   payoutToken: "abREQ",
    //   bondIconSvg: 'CvxImg',
    //   // bondContractABI: new ethers.utils.Interface(DaiBondContract),
    //   // reserveContract: '',
    //   type: BondType.PairLP,
    //   token: serializedTokens.wavax,
    //   quoteToken: serializedTokens.usdc,
    //   displayUnits: '4',
    //   reserveAddress: {
    //     43114: "0x1152803C660f86D262f9A235612ddc82f705c0bD",
    //     43113: "0x1152803C660f86D262f9A235612ddc82f705c0bD"
    //   },
    //   lpProperties: {
    //     weightToken: 80,
    //     weightQuoteToken: 20,
    //     fee: 25
    //   }
    // },
    {
      bondId: 9,
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
      tokens: [serializedTokens.dai, serializedTokens.usdc, serializedTokens.tusd, serializedTokens.usdt],
      quoteTokenIndex: 0,
      reserveAddress: {
        43114: "0x99674285c50CdB86AE423aac9be7917d7D054994",
        43113: "0x99674285c50CdB86AE423aac9be7917d7D054994"
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



export const bondConfig = (chainId: number): BondConfig[] => {
  // [ChainId.AVAX_TESTNET]: [
  const serializedTokens = serializeTokens(chainId ?? 43113)
  const serializedNetworkCcy = serializeToken(WRAPPED_NETWORK_TOKENS[chainId ?? 43113])
  return [
    // {
    //   isLP: false,
    //   name: "60/40 AREQ-DAI",
    //   displayName: "60% AREQ - 40% DAI",
    //   bondToken: "DAI abREQ LP",
    //   payoutToken: "abREQ",
    //   bondIconSvg: 'CvxImg',
    //   // bondContractABI: new ethers.utils.Interface(DaiBondContract),
    //   // reserveContract: '',
    //   type: BondType.PairLP,
    //   displayUnits: '4',
    //   reserveAddress: {
    //     43114: "0x086AbCBD5377fFCD5441f0da1969eb468903b693",
    //     43113: "0x086AbCBD5377fFCD5441f0da1969eb468903b693"
    //   },
    //   tokens: [serializedTokens.reqt, serializedTokens.dai],
    //   quoteTokenIndex: 1,
    //   lpProperties: {
    //     weightToken: 70,
    //     weightQuoteToken: 30,
    //     fee: 50
    //   }
    // },
    {
      isLP: false,
      name: "50/50 wAVAX-USDC",
      displayName: "50% AREQ - 50% USDC",
      bondToken: "DAI abREQ LP",
      payoutToken: "abREQ",
      bondIconSvg: 'CvxImg',
      // bondContractABI: new ethers.utils.Interface(DaiBondContract),
      // reserveContract: '',
      type: BondType.PairLP,
      displayUnits: '4',
      reserveAddress: {
        43114: "0x344aF4Fd88199F5167332ffe2438ABeC13d6061B",
        43113: "0x344aF4Fd88199F5167332ffe2438ABeC13d6061B"
      },
      tokens: [serializedTokens.wavax, serializedTokens.usdc],
      quoteTokenIndex: 1,
      lpProperties: {
        weightToken: 70,
        weightQuoteToken: 30,
        fee: 50
      }
    },
    // {
    //   bondId: 5,
    //   isBondable: {
    //     [ChainId.AVAX_TESTNET]: true,
    //     [ChainId.AVAX_MAINNET]: false
    //   },
    //   isClaimable: {
    //     [ChainId.AVAX_TESTNET]: true,
    //     [ChainId.AVAX_MAINNET]: false
    //   },
    //   isLP: false,
    //   name: " 50/50 WAVAX-USDC LP",
    //   displayName: "REQT LP",
    //   bondToken: "Swap LP",
    //   payoutToken: "abREQ",
    //   bondIconSvg: 'CvxImg',
    //   // bondContractABI: new ethers.utils.Interface(DaiBondContract),
    //   // reserveContract: '',
    //   type: BondType.PairLP,
    //   token: serializedTokens.wavax,
    //   quoteToken: serializedTokens.usdc,
    //   displayUnits: '4',
    //   reserveAddress: {
    //     43114: "0x1152803C660f86D262f9A235612ddc82f705c0bD",
    //     43113: "0x1152803C660f86D262f9A235612ddc82f705c0bD"
    //   },
    //   lpProperties: {
    //     weightToken: 80,
    //     weightQuoteToken: 20,
    //     fee: 25
    //   }
    // },
    {
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
      tokens: [serializedTokens.dai, serializedTokens.usdc, serializedTokens.tusd, serializedTokens.usdt],
      quoteTokenIndex: 0,
      reserveAddress: {
        43114: "0x99674285c50CdB86AE423aac9be7917d7D054994",
        43113: "0x99674285c50CdB86AE423aac9be7917d7D054994"
      },
      lpProperties: {
        weightToken: 80,
        weightQuoteToken: 20,
        fee: 25
      }
    },
    {
      isLP: false,
      name: "60-ABREQ/40-DAI LP",
      displayName: "REQ Pair LP",
      bondToken: "RLP",
      payoutToken: "abREQ",
      bondIconSvg: 'CvxImg',
      // bondContractABI: new ethers.utils.Interface(DaiBondContract),
      // reserveContract: '',
      type: BondType.PairLP,
      displayUnits: '4',
      tokens: [serializedTokens.dai, serializedTokens.abreq],
      quoteTokenIndex: 0,
      reserveAddress: {
        43114: "0x51991dfd191D15d7055c45f4DB849Fea0e8004CD",
        43113: "0x51991dfd191D15d7055c45f4DB849Fea0e8004CD"
      },
      lpProperties: {
        weightToken: 80,
        weightQuoteToken: 20,
        fee: 25
      }
    },
    {
      isLP: false,
      name: "REQ3 Classic LP",
      displayName: "REQT - CLassic LP",
      bondToken: "Stable Swap LP",
      payoutToken: "abREQ",
      bondIconSvg: 'CvxImg',
      // bondContractABI: new ethers.utils.Interface(DaiBondContract),
      // reserveContract: '',
      type: BondType.WeightedPoolLP,
      displayUnits: '4',
      tokens: [serializedTokens.wbtc, serializedTokens.weth, serializedTokens.usdt],
      quoteTokenIndex: 2,
      reserveAddress: {
        43114: "0xa9767ba217ac2543799409e5b4970b7cb3df3ed5",
        43113: "0xa9767ba217ac2543799409e5b4970b7cb3df3ed5"
      },
      lpProperties: {
        weightToken: 80,
        weightQuoteToken: 20,
        fee: 25
      }
    },
  ]
  // ],
  // [ChainId.BSC_TESTNET]: [],
  // [ChainId.MATIC_MAINNET]: [],
  // [ChainId.AVAX_MAINNET]: [],
  // [ChainId.ARBITRUM_MAINNET]: [],
  // [ChainId.ARBITRUM_TETSNET_RINKEBY]: []
}