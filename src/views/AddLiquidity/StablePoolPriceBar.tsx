import { Currency, Percent, Price, StablePool } from '@pancakeswap/sdk'
import React from 'react'
import { Text } from '@pancakeswap/uikit'
import { useTranslation } from 'contexts/Localization'
import { AutoColumn } from '../../components/Layout/Column'
import { AutoRow } from '../../components/Layout/Row'
import { ONE_BIPS } from '../../config/constants'
import { StablesField } from '../../state/mintStables/actions'

function StablePoolPriceBar({
  stablePool,
  poolTokenPercentage,
}: {
  stablePool: StablePool
  poolTokenPercentage?: Percent
}) {
  const { t } = useTranslation()
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
            {(poolTokenPercentage?.lessThan(ONE_BIPS) ? '<0.01' : poolTokenPercentage?.toFixed(2)) ?? '0'}
            %
          </Text>
          <Text fontSize="14px" pt={1}>
            {t('Share of Pool')}
          </Text>
        </AutoColumn>
      </AutoRow>
    </AutoColumn>
  )
}

export default StablePoolPriceBar
