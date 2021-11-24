import React, { useMemo } from 'react'
import styled from 'styled-components'
import useTheme from 'hooks/useTheme'
import { Pair, Token, StablePool, TokenAmount, STABLE_POOL_LP_ADDRESS } from '@requiemswap/sdk'
import { Text, Flex, CardBody, CardFooter, Button, AddIcon } from '@requiemswap/uikit'
import { Link } from 'react-router-dom'
import { useTranslation } from 'contexts/Localization'
import { BigNumber } from 'ethers'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import Column from 'components/Column'
import { useNetworkState } from 'state/globalNetwork/hooks'
import TokenPositionCard from 'components/PositionCard/TokenPosition'
import FullStablesPositionCard from 'components/PositionCard/StablesPosition'
import {
  useTokenBalancesWithLoadingIndicator,
  useTokenBalance,
  useNetworkCCYBalances,
  useUserBalancesState,
  getStables,
  getMainTokens,
  getTokenAmounts
} from '../../state/userBalances/hooks'
import { useTokenBalancesWithLoadingIndicator as xD } from '../../state/wallet/hooks'
import {
  refreshBalances,
  refreshNetworkCcyBalance
} from '../../state/userBalances/actions'
import { usePairs } from '../../hooks/usePairs'
import { useStablePool, StablePoolState } from '../../hooks/useStablePool'
import { toV2LiquidityToken, useTrackedTokenPairs } from '../../state/user/hooks'
import Dots from '../../components/Loader/Dots'
import { AppHeader, AppBody } from '../../components/App'
import Page from '../Page'

const Body = styled(CardBody)`
  background-color: ${({ theme }) => theme.colors.dropdownDeep};
`

export default function Balances() {
  const { chainId } = useNetworkState()
  const { account } = useActiveWeb3React()

  const networkCcyBalance = useNetworkCCYBalances(chainId, [account])[account]
  const [allBalances, fetchingAllBalances] = useTokenBalancesWithLoadingIndicator(account, [...getMainTokens(chainId), ...getStables(chainId)])

  const [allBalances1, fetchingAllBalances1] = xD(account, [...getMainTokens(chainId), ...getStables(chainId)])
  // console.log(allBalances1, fetchingAllBalances1)
  // console.log(allBalances1.map())
  refreshBalances({
    newBalances: allBalances
  })

  refreshNetworkCcyBalance({
    newBalance: networkCcyBalance
  })

  const amounts = useMemo(() =>
    getTokenAmounts(chainId, allBalances),
    [chainId, allBalances]
  )
  console.log(amounts)
  console.log(allBalances)
  console.log(networkCcyBalance)
  const renderBody = () => {
    if (!account) {
      return (
        <Text color="textSubtle" textAlign="center">
          Connect to a wallet to view your balances.
        </Text>
      )
    }
    if (fetchingAllBalances) {
      return (
        <Text color="textSubtle" textAlign="center">
          <Dots>Loading</Dots>
        </Text>
      )
    }
    return (<Column>
      {!fetchingAllBalances && amounts.map((tokenAmount, index) => (
        <TokenPositionCard
          tokenAmount={tokenAmount}
          mb={index < Object.values(allBalances).length - 1 ? '16px' : 0}
          gap='1px'
          padding = '1px'
          showSymbol
        />))}
    </Column>
    )
  }





  return (
    <Page>
      <AppBody>
        <AppHeader title='Your Liquidity' subtitle='Remove liquidity to receive tokens back' />
        <Body>
          {renderBody()}
          {account && (
            <Flex flexDirection="column" alignItems="center" mt="24px">
              <Button id="import-pool-link" variant="secondary" scale="sm" as={Link} to="/find">
                Find other tokens
              </Button>
            </Flex>
          )}
        </Body>
        <CardFooter style={{ textAlign: 'center' }}>
          Add Liquidity
        </CardFooter>
      </AppBody>
    </Page>
  )
}
