/* eslint-disable */
import React, { Fragment, memo } from 'react'
import { Swap, PoolType } from '@requiemswap/sdk'
import { Text, Flex, ChevronRightIcon, ArrowForwardIcon } from '@requiemswap/uikit'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { CurrencyLogo } from 'components/Logo'
import { AutoColumn } from 'components/Column'
import Row from 'components/Row'
import { weightedSwapInitialData } from 'config/constants/weightedPool'
import { stableSwapInitialData } from 'config/constants/stablePools'

export default memo(function SwapV3Route({ trade }: { trade: Swap }) {
  return (
    // <AutoColumn style={{ flex: '1' }} gap='2px' >
    <Flex flexWrap="wrap" width="100%" justifyContent="flex-end" alignItems="center">
      {trade.route.path.map((currency, j) => {
        const isLastItem: boolean = j === trade.route.path.length - 1
        return (
          // eslint-disable-next-line react/no-array-index-key
          <Fragment key={j}>
            <Flex alignItems="end">
              <AutoColumn style={{ flex: '1' }} gap='2px' >
                <Row>
                  <Flex alignItems="end">
                    <AutoColumn style={{ flex: '1' }} gap='2px' >
                      <CurrencyLogo chainId={trade.route.chainId} currency={currency} size='25px' style={{ marginLeft: "0.125rem", marginRight: "0.125rem" }} />
                      {/* <Text fontSize="7px" ml="0.125rem" mr="0.125rem">
                        {currency.symbol}
                      </Text> */}
                    </AutoColumn>
                  </Flex>
                  <Flex flexDirection="column" justifyContent='space-between' alignItems="center" grid-row-gap='0px' marginRight='1px' marginLeft='1px'>
                    {!isLastItem && <ArrowForwardIcon height='10px' width="10px" marginBottom='0px' />}

                    {!isLastItem && trade.route.swapData[j] && (
                      <Text fontSize="10px" textAlign='center' marginTop='0px' >
                        {weightedSwapInitialData[trade.route.chainId].map(p => p.address).includes(trade.route.swapData[j].poolRef) ? '3Cls' :
                          stableSwapInitialData[trade.route.chainId].map(p => p.address).includes(trade.route.swapData[j].poolRef) ? '4USD' : 'Pair'}
                      </Text>)}
                  </Flex>
                </Row>

              </AutoColumn>
            </Flex>
          </Fragment>
        )
      })}
    </Flex>
    // </AutoColumn>
  )
})
