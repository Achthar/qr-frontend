/* eslint-disable */
import React, { Fragment, memo } from 'react'
import { Swap, PoolDictionary, WeightedPool, StablePool } from '@requiemswap/sdk'
import { Text, Flex, ArrowForwardIcon, useTooltip } from '@requiemswap/uikit'
import styled from 'styled-components'
import { CurrencyLogo } from 'components/Logo'
import { AutoColumn } from 'components/Column'
import Row from 'components/Row'
import { weightedSwapInitialData } from 'config/constants/weightedPool'
import { stableSwapInitialData } from 'config/constants/stablePools'

const QuestionWrapper = styled.div`
  :hover,
  :focus {
    opacity: 0.7;
  }
`
const maxHops = 9;


export default memo(function SwapV3Route({ trade, poolDict }: { trade: Swap, poolDict: PoolDictionary }) {

  const refs = Array.from(Array(maxHops).keys()).map((j) => {
    const isLastItem: boolean = j === trade.route.path.length - 1
    const pool = !isLastItem ? poolDict[trade.route.swapData[j]?.poolRef] : null
    const typeText = pool && pool instanceof WeightedPool ? 'Weighted Pool' : pool instanceof StablePool ? 'Stable Pool' : 'Pair'
    return useTooltip(`${pool?.getName()} ${typeText}` ?? '', { placement: 'top', trigger: 'hover' })
  })

  return (
    <Flex flexWrap="wrap" width="100%" justifyContent="flex-end" alignItems="center">
      {trade.route.path.map((currency, j) => {
        const isLastItem: boolean = j === trade.route.path.length - 1
        return (
          // eslint-disable-next-line react/no-array-index-key
          <Fragment key={`${currency.symbol}${j}`}>
            <Flex alignItems="end">
              <AutoColumn style={{ flex: '1' }} gap='2px' >
                <Row>
                  <Flex alignItems="end">
                    <AutoColumn style={{ flex: '1' }} gap='2px' >
                      <CurrencyLogo chainId={trade.route.chainId} currency={currency} size='25px' style={{ marginLeft: "0.125rem", marginRight: "0.125rem" }} />
                    </AutoColumn>
                  </Flex>
                  {refs[j]?.tooltipVisible && refs[j]?.tooltip}

                  {!isLastItem &&
                    <QuestionWrapper ref={refs[j]?.targetRef}>
                      <Flex flexDirection="column" justifyContent='space-between' alignItems="center" grid-row-gap='0px' marginRight='1px' marginLeft='1px'>
                        <ArrowForwardIcon height='10px' width="10px" marginBottom='0px' />

                        {trade.route.swapData[j] && (
                          <Text fontSize="10px" textAlign='center' marginTop='0px' >
                            {weightedSwapInitialData[trade.route.chainId].map(p => p.address.toLowerCase()).includes(trade.route.swapData[j].poolRef.toLowerCase()) ? 'WPool' :
                              stableSwapInitialData[trade.route.chainId].map(p => p.address.toLowerCase()).includes(trade.route.swapData[j].poolRef.toLowerCase()) ? 'SPool' : 'Pair'}
                          </Text>)}
                      </Flex>
                    </QuestionWrapper>
                  }
                </Row>

              </AutoColumn>
            </Flex>
          </Fragment>
        )
      })}
    </Flex>
  )
})
