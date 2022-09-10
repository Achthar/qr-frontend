import { serializeTokens } from './tokens'
import { BondConfig, BondAssetType } from './types'

export const bondConfig = (chainId: number): BondConfig[] => {
  const serializedTokens = serializeTokens(chainId)
  // const serializedNetworkCcy = serializeToken(WRAPPED_NETWORK_TOKENS[chainId ?? 43113])
  if (chainId === 43113) return [
    {
      name: "50/50 wAVAX-USDC Deprecated",
      displayName: "50% AREQ - 50% USDC",
      bondToken: "DAI abREQ LP",
      payoutToken: "ABREQ",
      assetType: BondAssetType.PairLP,
      displayUnits: '4',
      reserveAddress: {
        43114: "0x344aF4Fd88199F5167332ffe2438ABeC13d6061B",
        43113: "0x344aF4Fd88199F5167332ffe2438ABeC13d6061B"
      },
      tokens: [serializedTokens.wavax, serializedTokens.usdc],
      quoteTokenIndex: 1,
      lpProperties: {
        weightToken: 50,
        weightQuoteToken: 50,
        fee: 10
      }
    },
    {
      name: "50/50 wAVAX-USDC",
      displayName: "50% AREQ - 50% USDC",
      bondToken: "DAI abREQ LP",
      payoutToken: "ABREQ",
      assetType: BondAssetType.PairLP,
      displayUnits: '4',
      reserveAddress: {
        43114: "0xa89488b2Edb65e6F5600a57774371F5D4e6eD1eD",
        43113: "0xa89488b2Edb65e6F5600a57774371F5D4e6eD1eD"
      },
      tokens: [serializedTokens.wavax, serializedTokens.usdc],
      quoteTokenIndex: 1,
      lpProperties: {
        weightToken: 50,
        weightQuoteToken: 50,
        fee: 10
      }
    },
    {
      name: "req4USD LP",
      displayName: "4-USD Stable Pool LP",
      bondToken: "Stable Swap LP",
      payoutToken: "ABREQ",
      assetType: BondAssetType.StableSwapLP,
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
      name: "ABREQ/DAI LP Deprecated",
      displayName: "60-ABREQ/40-DAI LP",
      bondToken: "RLP",
      payoutToken: "ABREQ",
      assetType: BondAssetType.PairLP,
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
      name: "ABREQ/DAI LP",
      displayName: "60-ABREQ/40-DAI LP",
      bondToken: "RLP",
      payoutToken: "ABREQ",
      assetType: BondAssetType.PairLP,
      displayUnits: '4',
      tokens: [serializedTokens.dai, serializedTokens.abreq],
      quoteTokenIndex: 0,
      reserveAddress: {
        43114: "0x273C1825E3aEf331F2C490d5B70103Ec2A2e9283",
        43113: "0x273C1825E3aEf331F2C490d5B70103Ec2A2e9283"
      },
      lpProperties: {
        weightToken: 80,
        weightQuoteToken: 20,
        fee: 25
      }
    },
    {
      name: "REQ3 Classic",
      displayName: "wETH/wBTC/USDT 3-Pool LP",
      bondToken: "Stable Swap LP",
      payoutToken: "ABREQ",
      assetType: BondAssetType.WeightedPoolLP,
      displayUnits: '4',
      tokens: [serializedTokens.weth, serializedTokens.wbtc, serializedTokens.usdt],
      quoteTokenIndex: 2,
      reserveAddress: {
        43114: "0xa63a39F656E0890857987Dfc0AEB90654Bc231B1",
        43113: "0xa63a39F656E0890857987Dfc0AEB90654Bc231B1"
      },
    },
    {
      name: "REQ3 Classic Deprecated",
      displayName: "wETH/wBTC/USDT 3-Pool LP",
      bondToken: "Stable Swap LP",
      payoutToken: "ABREQ",
      assetType: BondAssetType.WeightedPoolLP,
      displayUnits: '4',
      tokens: [serializedTokens.wbtc, serializedTokens.weth, serializedTokens.usdt],
      quoteTokenIndex: 2,
      reserveAddress: {
        43114: "0xA9767BA217AC2543799409E5B4970B7cb3dF3Ed5",
        43113: "0xA9767BA217AC2543799409E5B4970B7cb3dF3Ed5"
      },
      lpProperties: {
        weightToken: 60,
        weightQuoteToken: 40,
        fee: 25
      }
    },
  ]

  return [
    {
      name: "10/90 wROSE-USDC",
      displayName: "10% wROSE - 90% USDC",
      bondToken: "ROSE USDC LP",
      payoutToken: "ABREQ",
      assetType: BondAssetType.PairLP,
      displayUnits: '4',
      reserveAddress: {
        42261: "0x3B2b78e1F16985a77AFbdf63Fa594119E5D7629D",
      },
      tokens: [serializedTokens.wrose, serializedTokens.usdc],
      quoteTokenIndex: 1,
      lpProperties: {
        weightToken: 10,
        weightQuoteToken: 90,
        fee: 10
      }
    },
    {
      name: "req3USD LP",
      displayName: "3-USD Stable Pool LP Oasis",
      bondToken: "Stable Swap LP",
      payoutToken: "ABREQ",
      assetType: BondAssetType.StableSwapLP,
      displayUnits: '4',
      tokens: [serializedTokens.busd, serializedTokens.usdc, serializedTokens.usdt],
      quoteTokenIndex: 0,
      reserveAddress: {
        42261: "0x9912AAfB08F9C018Bd0317c673951A5f4967831F",
      },
      lpProperties: {
        weightToken: 80,
        weightQuoteToken: 20,
        fee: 25
      }
    },
    {
      name: "REQ3 Classic Oasis Network",
      displayName: "wETH/wBTC/USDT 3-Pool LP",
      bondToken: "Stable Swap LP",
      payoutToken: "ABREQ",
      assetType: BondAssetType.WeightedPoolLP,
      displayUnits: '4',
      tokens: [serializedTokens.weth, serializedTokens.wbtc, serializedTokens.usdt],
      quoteTokenIndex: 2,
      reserveAddress: {
        42261: "0xb288d26a17aab729a64d8320836c2ea4794b3baf",
      },
      lpProperties: {
        weightToken: 60,
        weightQuoteToken: 40,
        fee: 25
      }
    },
  ]
}