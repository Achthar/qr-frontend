import { Currency, Percent, Price, StablePool, STABLES_INDEX_MAP, TokenAmount } from '@requiemswap/sdk'
import React, { useMemo } from 'react'
import { Text } from '@requiemswap/uikit'
import { useTranslation } from 'contexts/Localization'
import { CurrencyLogo } from 'components/Logo'
import Row from 'components/Row'
import Column from 'components/Column'
import { AutoColumn } from '../../components/Layout/Column'
import { AutoRow } from '../../components/Layout/Row'
import { ONE_BIPS, ZERO_PERCENT } from '../../config/constants'
import { StablesField } from '../../state/mintStables/actions'



function StablePoolPriceBar({
  stablePool,
  poolTokenPercentage,
}: {
  stablePool: StablePool
  poolTokenPercentage?: Percent
}) {
  const { t } = useTranslation()
  const amounts = useMemo(() =>
    stablePool?.getBalances().map((amnt, index) => new TokenAmount(STABLES_INDEX_MAP[stablePool.chainId][index], amnt.toBigInt()))
    , [stablePool])
  return (
    <AutoColumn gap="md">
      <AutoRow justify="space-around" gap="4px">
        <AutoColumn justify="center">
          {/* <Text>{price?.toSignificant(6) ?? '-'}</Text> */}
          {/* <Text fontSize="14px" pt={1}>
            {t('%assetA% per %assetB%', {
              assetA: currencies[StablesField.CURRENCY_B]?.symbol ?? '',
              assetB: currencies[StablesField.CURRENCY_A]?.symbol ?? '',
            })}
          </Text> */}
          {/* <AutoColumn gap="sm"> */}

          {amounts && (
            <Column>
              <Row justify="start" gap="4px">
                <CurrencyLogo chainId={stablePool?.chainId} currency={amounts[0].token} size='15px' style={{ marginRight: '4px' }} />
                <Text fontSize="14px" pt={1}>
                  {
                    amounts?.[0].toSignificant(6)
                  }
                </Text>
              </Row>

              <Row justify="start" gap="4px">
                <CurrencyLogo chainId={stablePool?.chainId} currency={amounts[1].token} size='15px' style={{ marginRight: '4px' }} />
                <Text fontSize="14px" pt={1}>
                  {
                    amounts?.[1].toSignificant(6)
                  }
                </Text>
              </Row>
              <Row justify="start" gap="4px">
                <CurrencyLogo chainId={stablePool?.chainId} currency={amounts[2].token} size='15px' style={{ marginRight: '4px' }} />
                <Text fontSize="14px" pt={1}>
                  {
                    amounts?.[2].toSignificant(6)
                  }
                </Text>
              </Row>
              <Row justify="start" gap="4px">
                <CurrencyLogo chainId={stablePool?.chainId} currency={amounts[3].token} size='15px' style={{ marginRight: '4px' }} />
                <Text fontSize="14px" pt={1}>
                  {
                    amounts?.[3].toSignificant(6)
                  }
                </Text>
              </Row>
            </Column>
          )}

          {/* </AutoColumn> */}
        </AutoColumn>
        <AutoColumn justify="center">
          {/* <Text>{price?.invert()?.toSignificant(6) ?? '-'}</Text> */}
          {/* <Text fontSize="14px" pt={1}>
            {t('%assetA% per %assetB%', {
              assetA: currencies[StablesField.CURRENCY_A]?.symbol ?? '',
              assetB: currencies[StablesField.CURRENCY_B]?.symbol ?? '',
            })}
          </Text> */}
        </AutoColumn>
        <AutoColumn justify="center">
          <Text>
            {
              poolTokenPercentage?.equalTo(ZERO_PERCENT) ? '0' :
                (poolTokenPercentage?.lessThan(ONE_BIPS) ? '<0.01' : poolTokenPercentage?.toFixed(2)) ?? '0'}
            %
          </Text>
          <Text fontSize="14px" pt={1}>
            {t('Share of Quad Pool')}
          </Text>
        </AutoColumn>
      </AutoRow>
    </AutoColumn>
  )
}

export default StablePoolPriceBar
