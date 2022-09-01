import React, { useEffect, useMemo, useState } from 'react'
import {
  TokenAmount,
  STABLE_POOL_ADDRESS,
  STABLES_INDEX_MAP,
  ZERO,
  NETWORK_CCY,
  Price,
  Pool,
  Percent,
  CurrencyAmount,
  StablePool,
} from '@requiemswap/sdk'
import {
  Button,
  CardBody,
  useMatchBreakpoints,
  Text,
  Table,
  Th,
  Td,
  Flex,
  Box,
  Card,
} from '@requiemswap/uikit'
import styled from "styled-components";
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { BigNumber } from 'ethers'

import PoolPriceBar from './PoolPriceBar'


export const HeaderWrapper = styled(Card)`
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
  max-width: 2000px;
  height: 35px;
  width: 100%;
  background: rgba(46, 46, 46, 0.8);
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

export default function PoolPriceMatrix({
  pool,
  poolDataLoaded,
  fontsize,
  width
}: { pool: Pool, poolDataLoaded: boolean, fontsize: string, width: string }) {


  const priceMatrix = useMemo(() => {
    const _priceMatrix = []
    if (poolDataLoaded && pool)
      for (let i = 0; i < Object.values(pool?.tokens).length; i++) {
        _priceMatrix.push([])
        for (let j = 0; j < Object.values(pool?.tokens).length; j++) {
          if (i !== j) {
            _priceMatrix?.[i].push(
              new Price(
                pool?.tokens[i],
                pool?.tokens[j],
                pool?.calculateSwapGivenIn(
                  pool.tokenFromIndex(j),
                  pool.tokenFromIndex(i),
                  pool?.getBalances()[j]?.div(1000)
                ) ?? BigNumber.from('1'),
                pool?.getBalances()[j]?.div(1000) ?? '1'
              ),
            )
          } else {
            _priceMatrix?.[i].push(undefined)
          }
        }
      }
    return _priceMatrix
  }, [pool, poolDataLoaded]
  )


  return (
        <Table width={width}>
          <thead>
            <tr>
              <Th textAlign="left">Base</Th>
              {pool && pool.tokens.map(tok => {
                return (
                  <Th> {tok.symbol}</Th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {
              pool && pool.tokens.map((tokenRow, i) => {
                return (
                  <tr>
                    <Td textAlign="left" fontSize={fontsize}>
                      1 {tokenRow.symbol} =
                    </Td>
                    {pool.tokens.map((__, j) => {
                      return (

                        <Td fontSize={fontsize}>{i === j ? '-' : priceMatrix?.[i]?.[j]?.toSignificant(pool instanceof StablePool ? 5 : 4) ?? ' '}</Td>
                      )
                    })}
                  </tr>
                )
              })
            }
          </tbody>
        </Table>
  )

}
