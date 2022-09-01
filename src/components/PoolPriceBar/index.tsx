import React from 'react'
import {
  Pool,
  Percent,
  CurrencyAmount
} from '@requiemswap/sdk'
import {
  Text,
  Flex,
  Card,
} from '@requiemswap/uikit'
import styled from "styled-components";

import PoolPriceBar from './PoolPriceBar'
import PoolPriceMatrix from './PoolPriceMatrix';


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
  margin-bottom: 5px;
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
  margin-bottom: 5px;
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
  margin-bottom: 5px;
`

export default function PoolData({
  pool,
  poolDataLoaded,
  parsedAmounts,
  poolPercentage,
  fontsize,
  width
}: { pool: Pool, poolDataLoaded: boolean, poolPercentage: Percent, parsedAmounts: CurrencyAmount[], fontsize: string, width: string }) {
  return (
    <Flex flexDirection='column' >
      <HeaderWrapper background=''>
        <Text fontSize='17px' textAlign='center' textTransform="uppercase" bold letterSpacing='2px'> Pool ratio and market rates</Text>
      </HeaderWrapper>
      <BodyWrapper background=''>
        <Text fontSize="17px" pt={1} bold marginLeft='3px' marginBottom='10px' marginTop='2px' textAlign='center'>
          Pool Liqudity
        </Text>
        <PoolPriceBar poolTokenPercentage={poolPercentage} pool={pool} formattedAmounts={parsedAmounts} />
      </BodyWrapper>
      <BodyWrapperPrice background=''>
        <Text fontSize="17px" pt={1} bold marginLeft='3px' marginBottom='10px' marginTop='2px' textAlign='center'>
          Pool Prices
        </Text>
        <PoolPriceMatrix pool={pool} poolDataLoaded={poolDataLoaded} fontsize={fontsize} width={width} />
      </BodyWrapperPrice>
    </Flex>
  )

}
