import { Currency, Percent, Price } from '@requiemswap/sdk'
import React from 'react'
import { Box, Text, Card } from '@requiemswap/uikit'
import styled from "styled-components";
import { useTranslation } from 'contexts/Localization'
import { AutoColumn } from '../../components/Layout/Column'
import { AutoRow } from '../../components/Layout/Row'
import { ONE_BIPS } from '../../config/constants'
import { WeightedField } from '../../state/mintWeightedPair/actions'

export const BodyWrapper = styled(Card)`
  border-radius: 24px;
  max-width: 2000px;
  width: 100%;
  background-color: white;
  z-index: 1;
  align:center;
`

const Line = styled.hr`
  color: white;
  width: 100%;
`;

function PoolPriceBar({
  currencies,
  noLiquidity,
  poolTokenPercentage,
  priceRatio,
  price
}: {
  currencies: { [field in WeightedField]?: Currency }
  noLiquidity?: boolean
  poolTokenPercentage?: Percent
  priceRatio?: Price
  price?: Price
}) {
  const { t } = useTranslation()
  return (
    <AutoColumn gap="md">
      <AutoRow justify="space-around" gap="4px">
        <AutoColumn justify="center">
          <Text>{price?.toSignificant(6) ?? '-'}</Text>
          <Text fontSize="14px" pt={1}>
            {t('%assetA% per %assetB%', {
              assetA: currencies[WeightedField.CURRENCY_B]?.symbol ?? '',
              assetB: currencies[WeightedField.CURRENCY_A]?.symbol ?? '',
            })}
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <Text>{price?.invert()?.toSignificant(6) ?? '-'}</Text>
          <Text fontSize="14px" pt={1}>
            {t('%assetA% per %assetB%', {
              assetA: currencies[WeightedField.CURRENCY_A]?.symbol ?? '',
              assetB: currencies[WeightedField.CURRENCY_B]?.symbol ?? '',
            })}
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <Text>
            {noLiquidity && price
              ? '100'
              : (poolTokenPercentage?.lessThan(ONE_BIPS) ? '<0.01' : poolTokenPercentage?.toFixed(2)) ?? '0'}
            %
          </Text>
          <Text fontSize="14px" pt={1}>
            {t('Share of Pool')}
          </Text>
        </AutoColumn>
      </AutoRow>
      {/* here the actual pool price section starts */}
      <BodyWrapper>
        <AutoRow justify="space-around" gap="4px">
          <AutoColumn justify="center">
            <Text fontSize="14px" pt={1} bold marginLeft='3px' marginBottom='1px' marginTop='2px'>
              Market
              <br />
              prices
            </Text>
          </AutoColumn>
          <AutoColumn justify="center">
            <Text>{priceRatio?.toSignificant(6) ?? '-'}</Text>
            <Text fontSize="14px" pt={1}>
              {t('%assetA%/%assetB%', {
                assetA: currencies[WeightedField.CURRENCY_B]?.symbol ?? '',
                assetB: currencies[WeightedField.CURRENCY_A]?.symbol ?? '',
              })}
            </Text>
          </AutoColumn>
          <AutoColumn justify="center">
            <Text>{priceRatio?.invert()?.toSignificant(6) ?? '-'}</Text>
            <Text fontSize="14px" pt={1}>
              {t('%assetA%/%assetB%', {
                assetA: currencies[WeightedField.CURRENCY_A]?.symbol ?? '',
                assetB: currencies[WeightedField.CURRENCY_B]?.symbol ?? '',
              })}
            </Text>
          </AutoColumn>
        </AutoRow>
      </BodyWrapper>
    </AutoColumn>
  )
}

export default PoolPriceBar
