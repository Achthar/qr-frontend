import { Currency, Percent, Price } from '@requiemswap/sdk'
import React from 'react'
import { Box, Text, Card } from '@requiemswap/uikit'
import styled from "styled-components";
import { useTranslation } from 'contexts/Localization'
import { AutoColumn } from '../../components/Layout/Column'
import { AutoRow } from '../../components/Layout/Row'
import { ONE_BIPS } from '../../config/constants'
import { WeightedField } from '../../state/mintWeightedPair/actions'


export const HeaderWrapper = styled(Card)`
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
  max-width: 2000px;
  height: 35px;
  width: 100%;
  background: linear-gradient(rgba(0, 0, 0, 0.1), rgba(145, 36, 36, 0.1));
  z-index: 1;
  align:center;
  justify-content: center;
  border: 1px solid black;
`


export const BodyWrapper = styled(Card)`
  border-top-left-radius: 0px;
  border-top-right-radius: 0px;
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
  max-width: 2000px;
  width: 100%;
  background: rgba(145, 36, 36, 0.1);
  z-index: 1;
  align:center;
  border: 1px solid black;
`

export const BodyWrapperPrice = styled(Card)`
  border-top-left-radius: 0px;
  border-top-right-radius: 0px;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  max-width: 2000px;
  width: 100%;
  background: rgba(145, 36, 36, 0.1);
  z-index: 1;
  align:center;
  border: 1px solid black;
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
    <AutoColumn gap="5px">
      <HeaderWrapper background=''>
      <Text fontSize='17px' textAlign='center' textTransform="uppercase" bold letterSpacing='2px'> Pool ratio and market rates</Text>
      </HeaderWrapper>
      <BodyWrapper background=''>
        <Text fontSize="17px" pt={1} bold marginLeft='3px' marginBottom='10px' marginTop='2px' textAlign='center'>
          Liquidity pooling ratios
        </Text>
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
              Received share of pool
            </Text>
          </AutoColumn>
        </AutoRow>
      </BodyWrapper>
      {/* here the actual pool price section starts */}
      <BodyWrapperPrice background=''>
        <AutoColumn justify="center">
          <Text fontSize="17px" pt={1} bold marginLeft='3px' marginBottom='10px' marginTop='2px'>
            Market swap rates
          </Text>
          <AutoRow justify="space-around" gap="4px">
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

        </AutoColumn>
      </BodyWrapperPrice>

    </AutoColumn>
  )
}

export default PoolPriceBar
