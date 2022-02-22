/* eslint no-continue: 0 */
import React, { useEffect, useMemo } from 'react'
import styled from 'styled-components'
import useTheme from 'hooks/useTheme'
import { REQT, DAI } from 'config/constants/tokens'
import { WeightedPair, Token, STABLE_POOL_LP_ADDRESS, TokenAmount } from '@requiemswap/sdk'
import { Text, Flex, CardBody, CardFooter, Button, AddIcon } from '@requiemswap/uikit'
import { Link, RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'contexts/Localization'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import getChain from 'utils/getChain'
import Column from 'components/Column'
import { useGetStablePoolState } from 'hooks/useGetStablePoolState'
import useRefresh from 'hooks/useRefresh'
import { useGetWeightedPairsState } from 'hooks/useGetWeightedPairsState'
import { useDeserializedStablePools, useStablePoolLpBalance, useStablePools } from 'state/stablePools/hooks'
import FullWeightedPositionCardExtended from '../../components/PositionCard/WeightedPairPositionExtended'
import FullStablesPositionCard from '../../components/PositionCard/StablesPosition'
import Dots from '../../components/Loader/Dots'
import { AppHeader, AppBody } from '../../components/App'
import Page from '../Page'

const Body = styled(CardBody)`
  background-color: ${({ theme }) => theme.colors.dropdownDeep};
`

export default function PoolList({
  history,
  match: {
    params: { chain },
  },
}: RouteComponentProps<{ chain: string }>) {
  const { account, chainId, library } = useActiveWeb3React()
  const { t } = useTranslation()
  const { theme } = useTheme()

  useEffect(() => {
    const _chain = getChain(chainId ?? 43113)
    if (chain !== _chain) {
      history.push(`/${_chain}/liquidity`)
    }

  },
    [chain, chainId, history],
  )


  const { slowRefresh, fastRefresh } = useRefresh()

  const { stablePools, stableAmounts, userDataLoaded, publicDataLoaded } = useGetStablePoolState(chainId, account, slowRefresh, slowRefresh)
  const stablePoolReceived = stablePools[0]

  const {
    pairs,
    balances,
    totalSupply,
    metaDataLoaded,
    reservesAndWeightsLoaded,
    userBalancesLoaded
  } = useGetWeightedPairsState(chainId, account, [], slowRefresh, fastRefresh)

  const dataWithUserBalances: { pair: WeightedPair, balance: TokenAmount, supply: TokenAmount }[] = useMemo(
    () =>
      pairs.map((pair, index) => { return { pair, balance: balances[index], supply: totalSupply[index] } }).filter((data) =>
        data.balance?.greaterThan('0'),
      ),
    [pairs, balances, totalSupply],
  )

  const lpWithUserBalances = useMemo(
    () =>
      pairs.filter((_, index) =>
        balances[index]?.greaterThan('0'),
      ),
    [pairs, balances],
  )
  console.log("WP DWU", dataWithUserBalances)

  const weightedIsLoading = !metaDataLoaded || !reservesAndWeightsLoaded || !userBalancesLoaded

  const allWeightedPairsWithLiquidity = lpWithUserBalances.filter((pair): pair is WeightedPair => Boolean(pair))

  const allWeightedDataWithLiquidity = dataWithUserBalances.filter((data) => Boolean(data.pair))

  console.log("RELEVANT PAIR", allWeightedDataWithLiquidity, allWeightedPairsWithLiquidity?.[0]?.token0Price.toSignificant(18))

  const stablePoolBalance = useStablePoolLpBalance(chainId, 0)

  const renderBody = () => {
    if (!account) {
      return (
        <Text color="textSubtle" textAlign="center">
          {t('Connect to a wallet to view your liquidity.')}
        </Text>
      )
    }
    if (weightedIsLoading) {
      return (
        <Text color="textSubtle" textAlign="center">
          <Dots>{t('Loading')}</Dots>
        </Text>
      )
    }
    if ((!pairs || pairs.length === 0) && !publicDataLoaded) {
      if (!userDataLoaded) {
        return (
          <Text color="textSubtle" textAlign="center">
            <Dots>Finding Your Pools</Dots>
          </Text>
        )
      }
      return (
        <Text color="textSubtle" textAlign="center">
          <Dots>Finding Pools</Dots>
        </Text>
      )
    }
    return (
      <Column>
        {stablePoolBalance?.toBigNumber().gt(0) && stablePoolReceived != null && (
          <FullStablesPositionCard
            userLpPoolBalance={stablePoolBalance}
            stablePool={stablePoolReceived}
            mb='20px'
          />)}
        {allWeightedPairsWithLiquidity?.length > 0 && (allWeightedDataWithLiquidity.map((data, index) => (
          <FullWeightedPositionCardExtended
            key={data.pair.liquidityToken.address}
            weightedPair={data.pair}
            totalSupply={data.supply}
            userBalance={data.balance}
            mb={index < allWeightedPairsWithLiquidity.length - 1 ? '16px' : 0}
          />)))}

        {(stablePoolBalance?.toBigNumber().eq(0) && allWeightedPairsWithLiquidity?.length === 0) && (
          <Text color="textSubtle" textAlign="center">
            {t('No liquidity found.')}
          </Text>
        )}
      </Column>
    )
  }





  return (
    <Page>
      <AppBody>
        <AppHeader
          chainId={chainId}
          account={account}
          title={t('Your Liquidity')}
          subtitle={t('Remove liquidity to receive tokens back')} />
        <Body>
          {renderBody()}
          {account && !weightedIsLoading && (
            <Flex flexDirection="column" alignItems="center" mt="24px">
              <Text color="textSubtle" mb="8px">
                {t("Don't see a pool you joined?")}
              </Text>
              <Button id="import-pool-link" variant="secondary" scale="sm" as={Link} to={`/${getChain(chainId)}/find`}>
                {t('Find other LP tokens')}
              </Button>
            </Flex>
          )}
        </Body>
        <CardFooter style={{ textAlign: 'center' }}>
          <Button
            id="join-pool-button"
            as={Link}
            to={`/${getChain(chainId)}/add/80-${REQT[chainId].address}/20-${DAI[chainId].address}/25`}
            width="100%"
            startIcon={<AddIcon color={theme.colors.backgroundAlt} />}
          >
            {t('Add Liquidity')}
          </Button>
        </CardFooter>
      </AppBody>
    </Page>
  )
}
