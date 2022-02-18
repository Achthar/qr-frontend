/* eslint no-useless-return: 0 */
import React, { useEffect, useMemo } from 'react'
import styled from 'styled-components'
import { Text, Flex, CardBody, Card } from '@requiemswap/uikit'

import { useDispatch, useSelector } from 'react-redux'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import Column from 'components/Column'
import { useWeb3React } from '@web3-react/core'
import TokenPositionCard from 'components/PositionCard/TokenPosition'
import { fetchUserTokenBalances } from 'state/user/fetchUserTokenBalances'
import useRefresh from 'hooks/useRefresh'
import { fetchUserNetworkCcyBalanceBalances } from 'state/user/fetchUserNetworkCcyBalance'
import {
  getStableAmounts,
  getMainAmounts,
  useUserBalances,
} from '../../state/user/hooks'
import Dots from '../../components/Loader/Dots'
import { AppDispatch, AppState } from '../../state'

const Body = styled(CardBody)`
  background-color: ${({ theme }) => theme.colors.dropdownDeep};
`

export const BodyWrapper = styled(Card)`
  border-radius: 24px;
  max-width: 2000px;
  width: 100%;
  z-index: 1;
  align:center;
`

export default function Balances() {
  const { chainId, account } = useActiveWeb3React()
  const { slowRefresh } = useRefresh()
  const dispatch = useDispatch<AppDispatch>()

  // const additionalTokens =  Object.values(useSelector((state: AppState) => state.user.tokens)[chainId])

  useEffect(
    () => {
      if (account) {

        dispatch(fetchUserTokenBalances({
          chainId,
          account,
          // additionalTokens 
        }))

        dispatch(fetchUserNetworkCcyBalanceBalances({
          chainId,
          account
        }))
      }
      return;
    },
    [
      chainId,
      account,
      slowRefresh,
      dispatch,
      // additionalTokens
    ]
  )

  const {
    balances,
    isLoadingTokens,
    networkCcyBalance,
    isLoadingNetworkCcy
  } = useUserBalances()

  const allBalances = balances

  const stableAmounts = useMemo(() =>
    getStableAmounts(chainId, allBalances),
    [chainId, allBalances]
  )

  const mainAmounts = useMemo(() =>
    getMainAmounts(chainId, allBalances),
    [chainId, allBalances]
  )

  const renderBody = () => {
    if (!account) {
      return (
        <Text color="textSubtle" textAlign="center">
          Connect to a wallet to view your balances.
        </Text>
      )
    }
    if (isLoadingTokens) {
      return (
        <Text color="textSubtle" textAlign="center">
          <Dots>Loading</Dots>
        </Text>
      )
    }
    return (
      <div style={{ zIndex: 15 }}>
        <Flex flexDirection="row" justifyContent='space-between' alignItems="center" grid-row-gap='10px' marginRight='10px' marginLeft='10px'>
          <Column>
            {!isLoadingTokens && mainAmounts && mainAmounts.map((tokenAmount, index) => (
              <TokenPositionCard
                tokenAmount={tokenAmount}
                mb={index < Object.values(allBalances).length - 1 ? '5px' : 0}
                gap='1px'
                padding='0px'
                showSymbol
              />))}
          </Column>
          <Column>
            {!isLoadingTokens && stableAmounts && stableAmounts.map((tokenAmount, index) => (
              <TokenPositionCard
                tokenAmount={tokenAmount}
                mb={index < Object.values(allBalances).length - 1 ? '5px' : 0}
                gap='1px'
                padding='0px'
                showSymbol
              />))}
          </Column>
          {/* <Column>
            {!isLoadingTokens && stableAmounts.slice(2, 4).map((tokenAmount, index) => (
              <TokenPositionCard
                tokenAmount={tokenAmount}
                mb={index < Object.values(allBalances).length - 1 ? '5px' : 0}
                gap='1px'
                padding='0px'
                showSymbol
              />))}
          </Column> */}
        </Flex >
      </div>
    )
  }





  return (
    <>
      {/* <BodyWrapper> */}
      {/* <AppHeader title='Your Liquidity' subtitle='Remove liquidity to receive tokens back' /> */}
      {/* <Body> */}
      {renderBody()}
      {/* {account && (
            <Flex flexDirection="column" alignItems="center" mt="24px">
              <Button id="import-pool-link" variant="secondary" scale="sm" as={Link} to="/find">
                Find other tokens
              </Button>
            </Flex>
          )} */}
      {/* </Body> */}
      {/* </BodyWrapper> */}
    </>
  )
}
