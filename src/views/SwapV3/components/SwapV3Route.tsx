import React, { Fragment, memo } from 'react'
import { TradeV3 } from '@requiemswap/sdk'
import { Text, Flex, ChevronRightIcon } from '@requiemswap/uikit'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { CurrencyLogo } from 'components/Logo'
import { AutoColumn } from 'components/Column'

export default memo(function SwapV3Route({ trade }: { trade: TradeV3 }) {
  return (
    <Flex flexWrap="wrap" width="100%" justifyContent="flex-end" alignItems="center">
      {trade.route.path.map((token, i, path) => {
        const isLastItem: boolean = i === path.length - 1
        const currency = unwrappedToken(token)
        return (
          // eslint-disable-next-line react/no-array-index-key
          <Fragment key={i}>
            <Flex alignItems="end">
              <AutoColumn style={{ flex: '1' }} gap='2px' >
                <CurrencyLogo chainId={trade.route.chainId} currency={currency} size='17px' style={{ marginLeft: "0.125rem", marginRight: "0.125rem" }} />
                <Text fontSize="10px" ml="0.125rem" mr="0.125rem">
                  {currency.symbol}
                </Text>
              </AutoColumn>
            </Flex>
            {!isLastItem && <ChevronRightIcon width="12px" />}
          </Fragment>
        )
      })}
    </Flex>
  )
})
