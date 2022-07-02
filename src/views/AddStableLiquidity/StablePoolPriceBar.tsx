import { CurrencyAmount, Percent, StablePool, STABLES_INDEX_MAP, TokenAmount } from '@requiemswap/sdk'
import React, { useMemo } from 'react'
import { Text } from '@requiemswap/uikit'
import { StablesField } from 'state/mintStables/actions'
import { useTranslation } from 'contexts/Localization'
import { CurrencyLogo } from 'components/Logo'
import Row from 'components/Row'
import Column from 'components/Column'
import { AutoColumn } from '../../components/Layout/Column'
import { AutoRow } from '../../components/Layout/Row'
import { ONE_BIPS, ZERO_PERCENT } from '../../config/constants'



function StablePoolPriceBar({
  stablePool,
  poolTokenPercentage,
  formattedStablesAmounts
}: {
  stablePool: StablePool
  poolTokenPercentage?: Percent
  formattedStablesAmounts?: CurrencyAmount[]
}) {
  const { t } = useTranslation()
  const amounts = useMemo(() =>
    stablePool?.getTokenAmounts()
    , [stablePool])

  const percentages = useMemo(() => {
    return formattedStablesAmounts?.map((amnt, index) => amnt && new
      Percent(
        amnt?.raw ?? '0',
        amounts?.[index]?.raw ?? '1'))
  }, [amounts, formattedStablesAmounts])

  return (
    <AutoColumn gap="md">
      <AutoRow justify="space-around" gap="4px">
        <AutoColumn justify="center">
          {amounts && (
            <Column>
              <Row justify="start" gap="7px">
                <Text fontSize="13px" bold>
                  Reserves
                </Text>
                <Text fontSize="10px" marginLeft="15px">
                  Share Added
                </Text>
              </Row>

              {stablePool && stablePool?.getTokenAmounts().map((amount, index) => {
                return (<Row justify="start" gap="7px">
                  <CurrencyLogo chainId={stablePool?.chainId} currency={amount.token} size='15px' style={{ marginRight: '4px' }} />
                  <Text fontSize="14px" >
                    {
                      amount.toSignificant(6)
                    }
                  </Text>
                  <Text fontSize="10px" marginLeft="15px">
                    {
                      percentages?.[index]?.equalTo(ZERO_PERCENT) ? '0' :
                        (percentages?.[index]?.lessThan(ONE_BIPS) ? '<0.01' : percentages?.[index]?.toFixed(2)) ?? '0'}
                    %
                  </Text>
                </Row>)
              })}
              {/* 
              <Row justify="start" gap="4px">
                <CurrencyLogo chainId={stablePool?.chainId} currency={amounts[1].token} size='15px' style={{ marginRight: '4px' }} />
                <Text fontSize="14px">
                  {
                    amounts?.[1].toSignificant(6)
                  }
                </Text>
                <Text fontSize="10px" marginLeft="15px">
                  {
                    percentages?.[1]?.equalTo(ZERO_PERCENT) ? '0' :
                      (percentages?.[1]?.lessThan(ONE_BIPS) ? '<0.01' : percentages?.[1]?.toFixed(2)) ?? '0'}
                  %
                </Text>
              </Row>
              <Row justify="start" gap="4px">
                <CurrencyLogo chainId={stablePool?.chainId} currency={amounts[2].token} size='15px' style={{ marginRight: '4px' }} />
                <Text fontSize="14px">
                  {
                    amounts?.[2].toSignificant(6)
                  }
                </Text>
                <Text fontSize="10px" marginLeft="15px">
                  {
                    percentages?.[2]?.equalTo(ZERO_PERCENT) ? '0' :
                      (percentages?.[2]?.lessThan(ONE_BIPS) ? '<0.01' : percentages?.[2]?.toFixed(2)) ?? '0'}
                  %
                </Text>
              </Row>
              <Row justify="start" gap="4px">
                <CurrencyLogo chainId={stablePool?.chainId} currency={amounts[3].token} size='15px' style={{ marginRight: '4px' }} />
                <Text fontSize="14px">
                  {
                    amounts?.[3].toSignificant(6)
                  }
                </Text>
                <Text fontSize="10px" marginLeft="15px">
                  {
                    percentages?.[3]?.equalTo(ZERO_PERCENT) ? '0' :
                      (percentages?.[3]?.lessThan(ONE_BIPS) ? '<0.01' : percentages?.[3]?.toFixed(2)) ?? '0'}
                  %
                </Text>
              </Row> */}
            </Column>
          )}
        </AutoColumn>
        <AutoColumn justify="center">
          <Text>
            {
              poolTokenPercentage?.equalTo(ZERO_PERCENT) ? '0' :
                (poolTokenPercentage?.lessThan(ONE_BIPS) ? '<0.01' : poolTokenPercentage?.toFixed(2)) ?? '0'}
            %
          </Text>
          <Text fontSize="12px" pt={1}>
            {`Total Share of
            ${stablePool?.liquidityToken.name} Pool`}
          </Text>
        </AutoColumn>
      </AutoRow>
    </AutoColumn>
  )
}

export default StablePoolPriceBar
