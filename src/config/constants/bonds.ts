import { ChainId, WRAPPED_NETWORK_TOKENS } from '@requiemswap/sdk'
import { serializeToken } from 'state/user/hooks/helpers'
import { serializeTokens } from './tokens'
import { BondConfig, BondAssetType } from './types'

export const bondConfig = (chainId: number): BondConfig[] => {
  const serializedTokens = serializeTokens(chainId ?? 43113)
  const serializedNetworkCcy = serializeToken(WRAPPED_NETWORK_TOKENS[chainId ?? 43113])
  return [
    {
      name: "50/50 wAVAX-USDC",
      displayName: "50% AREQ - 50% USDC",
      bondToken: "DAI abREQ LP",
      payoutToken: "abREQ",
      assetType: BondAssetType.PairLP,
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
    {
      name: "req4USD LP",
      displayName: "4-USD Stable Pool LP",
      bondToken: "Stable Swap LP",
      payoutToken: "abREQ",
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
      name: "ABREQ/DAI LP",
      displayName: "60-ABREQ/40-DAI LP",
      bondToken: "RLP",
      payoutToken: "abREQ",
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
      name: "REQ3 Classic",
      displayName: "wETH/wBTC/USDT 3-Pool LP",
      bondToken: "Stable Swap LP",
      payoutToken: "abREQ",
      assetType: BondAssetType.WeightedPoolLP,
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
}