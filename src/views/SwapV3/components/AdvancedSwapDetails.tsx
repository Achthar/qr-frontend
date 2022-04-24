import React from 'react'
import { Swap, SwapType } from '@requiemswap/sdk'
import { Text } from '@requiemswap/uikit'
import { Field } from 'state/swapV3/actions'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { computeSlippageAdjustedAmountsV3, computeTradeV3PriceBreakdown } from 'utils/pricesV3'
import { AutoColumn } from 'components/Layout/Column'
import QuestionHelper from 'components/QuestionHelper'
import { RowBetween, RowFixed } from 'components/Layout/Row'
import FormattedPriceImpact from './FormattedPriceImpact'
import SwapV3Route from './SwapV3Route'

function TradeV3Summary({ trade, allowedSlippage }: { trade: Swap; allowedSlippage: number }) {
  const { priceImpactWithoutFee, realizedLPFee } = computeTradeV3PriceBreakdown(trade)
  const isExactIn = trade.tradeType === SwapType.EXACT_INPUT
  const slippageAdjustedAmounts = computeSlippageAdjustedAmountsV3(trade, allowedSlippage)

  return (
    <AutoColumn style={{ padding: '0 16px' }}>
      <RowBetween>
        <RowFixed>
          <Text fontSize="14px" color="textSubtle">
            {isExactIn ? 'Minimum received' : 'Maximum sold'}
          </Text>
          <QuestionHelper
            text="Your transaction will revert if there is a large, unfavorable price movement before it is confirmed."
            ml="4px"
          />
        </RowFixed>
        <RowFixed>
          <Text fontSize="14px">
            {isExactIn
              ? `${slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(4)} ${trade.outputAmount.currency.symbol}` ??
              '-'
              : `${slippageAdjustedAmounts[Field.INPUT]?.toSignificant(4)} ${trade.inputAmount.currency.symbol}` ?? '-'}
          </Text>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <RowFixed>
          <Text fontSize="14px" color="textSubtle">
            Price Impact
          </Text>
          <QuestionHelper
            text="The difference between the market price and estimated price due to trade size."
            ml="4px"
          />
        </RowFixed>
        <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <Text fontSize="14px" color="textSubtle">
            Liquidity Provider Fee
          </Text>
          <QuestionHelper
            text={
              <>
                <Text mb="12px">For each trade a pool-dependent fee is paid</Text>
              </>
            }
            ml="4px"
          />
        </RowFixed>
        <Text fontSize="14px">
          {realizedLPFee ? `${realizedLPFee.toSignificant(4)} ${trade.inputAmount.currency.symbol}` : '-'}
        </Text>
      </RowBetween>
    </AutoColumn>
  )
}

export interface AdvancedSwapV3DetailsProps {
  trade?: Swap
}

export function AdvancedSwapDetails({ trade }: AdvancedSwapV3DetailsProps) {
  const [allowedSlippage] = useUserSlippageTolerance()

  const showRoute = Boolean(trade && trade.route.path.length > 2)

  return (

    <AutoColumn gap="0px">
      {trade && (
        <>
          <TradeV3Summary trade={trade} allowedSlippage={allowedSlippage} />
          {showRoute && (
            <>
              <RowBetween style={{ padding: '0 16px' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <Text fontSize="14px" color="textSubtle">
                    Route
                  </Text>
                  <QuestionHelper
                    text="Routing through these tokens resulted in the best price for your trade."
                    ml="4px"
                  />
                </span>
                {trade && (<SwapV3Route trade={trade} />)}
              </RowBetween>
            </>

          )}
        </>
      )}
    </AutoColumn>
  )
}
