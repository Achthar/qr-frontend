/* eslint no-useless-return: 0 */
import React, { useEffect, useMemo } from 'react'
import styled from 'styled-components'
import { Text, Flex, CardBody, Card } from '@requiemswap/uikit'

import { useDispatch } from 'react-redux'
import Column from 'components/Column'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import TokenPositionCard from 'components/PositionCard/TokenPosition'
import { fetchUserTokenData } from 'state/user/fetchUserTokenBalances'
import { useChainIdHandling } from 'hooks/useChainIdHandle'
import useUserAddedTokens from 'state/user/hooks/useUserAddedTokens'
import { CurrencyAmount, Token, TokenAmount } from '@requiemswap/sdk'
import { serializeToken } from 'state/user/hooks/helpers'
import CurrencyPositionCard from 'components/PositionCard/NetworkCcyPosition'

import { useNetworkState } from 'state/globalNetwork/hooks'
import useRefresh from 'hooks/useRefresh'
import { fetchUserNetworkCcyBalance } from 'state/user/fetchUserNetworkCcyBalance'
import {
  getStableAmounts,
  getMainAmounts,
  useUserBalances,
} from '../../state/user/hooks'
import Dots from '../../components/Loader/Dots'
import { AppDispatch, useAppDispatch } from '../../state'

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
  const { slowRefresh } = useRefresh()
  const dispatch = useAppDispatch()

  const { account, chainId } = useActiveWeb3React()

  const userAddedTokens: Token[] = useUserAddedTokens()

  useEffect(
    () => {
      if (account) {

        dispatch(fetchUserTokenData({
          chainId,
          account,
          additionalTokens: userAddedTokens.map(token => serializeToken(token))
        }))

        dispatch(fetchUserNetworkCcyBalance({
          chainId,
          account
        }))
      }
      return;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  } = useUserBalances(chainId)

  const allBalances = balances

  const stableAmounts = useMemo(() =>
    getStableAmounts(chainId, allBalances),
    [chainId, allBalances]
  )

  const mainAmounts = useMemo(() => { return [CurrencyAmount.networkCCYAmount(chainId, networkCcyBalance), ...getMainAmounts(chainId, allBalances)] },
    [chainId, allBalances, networkCcyBalance]
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
              tokenAmount instanceof TokenAmount ?
                (<TokenPositionCard
                  tokenAmount={tokenAmount}
                  mb={index < Object.values(allBalances).length - 1 ? '5px' : 0}
                  gap='1px'
                  padding='0px'
                  showSymbol
                />) : (
                  <CurrencyPositionCard
                    chainId={chainId}
                    currencyAmount={tokenAmount as CurrencyAmount}
                    mb={index < Object.values(allBalances).length - 1 ? '5px' : 0}
                    gap='1px'
                    padding='0px'
                    showSymbol
                  />
                )))}
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
        </Flex >
      </div>
    )
  }


  return (
    <>
      {renderBody()}
    </>
  )
}
