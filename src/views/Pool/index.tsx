import React, { useMemo } from 'react'
import styled from 'styled-components'
import useTheme from 'hooks/useTheme'
import { Pair, Token, StablePool, TokenAmount, STABLE_POOL_LP_ADDRESS } from '@pancakeswap/sdk'
import { Text, Flex, CardBody, CardFooter, Button, AddIcon } from '@pancakeswap/uikit'
import { Link } from 'react-router-dom'
import { useTranslation } from 'contexts/Localization'
import { BigNumber } from 'ethers'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import Column from 'components/Column'
import FullPositionCard from '../../components/PositionCard'
import FullStablesPositionCard from '../../components/PositionCard/StablesPosition'
import { useTokenBalancesWithLoadingIndicator, useTokenBalance } from '../../state/wallet/hooks'
import { usePairs } from '../../hooks/usePairs'
import { useStablePool, StablePoolState } from '../../hooks/useStablePool'
import { toV2LiquidityToken, useTrackedTokenPairs } from '../../state/user/hooks'
import Dots from '../../components/Loader/Dots'
import { AppHeader, AppBody } from '../../components/App'
import Page from '../Page'

const Body = styled(CardBody)`
  background-color: ${({ theme }) => theme.colors.dropdownDeep};
`

export default function Pool() {
  const { account, chainId } = useActiveWeb3React()
  const { t } = useTranslation()
  const { theme } = useTheme()

  // fetch the user's balances of all tracked V2 LP tokens
  const trackedTokenPairs = useTrackedTokenPairs()
  const tokenPairsWithLiquidityTokens = useMemo(
    () => trackedTokenPairs.map((tokens) => ({ liquidityToken: toV2LiquidityToken(tokens), tokens })),
    [trackedTokenPairs],
  )
  const liquidityTokens = useMemo(
    () => tokenPairsWithLiquidityTokens.map((tpwlt) => tpwlt.liquidityToken),
    [tokenPairsWithLiquidityTokens],
  )
  const [v2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    liquidityTokens,
  )

  // fetch the reserves for all V2 pools in which the user has a balance
  const liquidityTokensWithBalances = useMemo(
    () =>
      tokenPairsWithLiquidityTokens.filter(({ liquidityToken }) =>
        v2PairsBalances[liquidityToken.address]?.greaterThan('0'),
      ),
    [tokenPairsWithLiquidityTokens, v2PairsBalances],
  )

  const v2Pairs = usePairs(
    liquidityTokensWithBalances.map(({ tokens }) => tokens),
  )
  const v2IsLoading =
    fetchingV2PairBalances || v2Pairs?.length < liquidityTokensWithBalances.length || v2Pairs?.some((V2Pair) => !V2Pair)

  const allV2PairsWithLiquidity = v2Pairs.map(([, pair]) => pair).filter((v2Pair): v2Pair is Pair => Boolean(v2Pair))

  // stable pool starting here
  const [stablePoolState, stablePool] = useStablePool()

  // const userPoolBalance = new TokenAmount(new Token(chainId, StablePool.getAddress(chainId), 18, 'RequiemStable-LP', 'Requiem StableSwap LPs'), BigNumber.from(123).toBigInt())
  const [userPoolBalance, fetchingUserPoolBalance] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    [new Token(chainId, STABLE_POOL_LP_ADDRESS[chainId ?? 43113], 18, 'RequiemStable-LP', 'Requiem StableSwap LPs')],
  )

  const renderBody = () => {
    if (!account) {
      return (
        <Text color="textSubtle" textAlign="center">
          {t('Connect to a wallet to view your liquidity.')}
        </Text>
      )
    }
    if (v2IsLoading) {
      return (
        <Text color="textSubtle" textAlign="center">
          <Dots>{t('Loading')}</Dots>
        </Text>
      )
    }
    if (userPoolBalance?.[STABLE_POOL_LP_ADDRESS[chainId ?? 43113]]?.toBigNumber().gt(0) || allV2PairsWithLiquidity?.length > 0) {
      return (<Column>
        {userPoolBalance?.[STABLE_POOL_LP_ADDRESS[chainId ?? 43113]]?.toBigNumber().gt(0) && stablePool != null && stablePoolState === StablePoolState.EXISTS && (
          <FullStablesPositionCard
            userLpPoolBalance={userPoolBalance?.[STABLE_POOL_LP_ADDRESS[chainId ?? 43113]]}
            stablePool={stablePool}
          />)}
        {allV2PairsWithLiquidity?.length > 0 && (allV2PairsWithLiquidity.map((v2Pair, index) => (
          <FullPositionCard
            // chainId={chainId}
            key={v2Pair.liquidityToken.address}
            pair={v2Pair}
            mb={index < allV2PairsWithLiquidity.length - 1 ? '16px' : 0}
          />)))}
      </Column>)
    }


    return (
      <Text color="textSubtle" textAlign="center">
        {t('No liquidity found.')}
      </Text>
    )
  }

  return (
    <Page>
      <AppBody>
        <AppHeader title={t('Your Liquidity')} subtitle={t('Remove liquidity to receive tokens back')} />
        <Body>
          {renderBody()}
          {account && !v2IsLoading && (
            <Flex flexDirection="column" alignItems="center" mt="24px">
              <Text color="textSubtle" mb="8px">
                {t("Don't see a pool you joined?")}
              </Text>
              <Button id="import-pool-link" variant="secondary" scale="sm" as={Link} to="/find">
                {t('Find other LP tokens')}
              </Button>
            </Flex>
          )}
        </Body>
        <CardFooter style={{ textAlign: 'center' }}>
          <Button
            id="join-pool-button"
            as={Link}
            to="/add"
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
