/* eslint no-continue: 0 */
import React, { useEffect, useMemo } from 'react'
import styled from 'styled-components'
import useTheme from 'hooks/useTheme'
import { REQT, DAI } from 'config/constants/tokens'
import { WeightedPair, Token, STABLE_POOL_LP_ADDRESS } from '@requiemswap/sdk'
import { Text, Flex, CardBody, CardFooter, Button, AddIcon } from '@requiemswap/uikit'
import { Link, RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'contexts/Localization'
import { BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED } from 'config/constants'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { fetchWeightedPairMetaData } from 'state/weightedPairs/fetchWeightedPairMetaData'
import { fetchWeightedPairData, fetchWeightedPairUserData, reduceDataFromDict } from 'state/weightedPairs/fetchWeightedPairData'
import getChain from 'utils/getChain'
// import { resetWeightedPairChainId } from 'state/weightedPairs'
import Column from 'components/Column'
import { changeChainIdWeighted } from 'state/weightedPairs/actions'
import { fetchStablePoolUserDataAsync } from 'state/stablePools'
import { useAppDispatch } from 'state'
import { changeChainId } from 'state/stablePools/actions'
import { useDeserializedWeightedPairsAndLpBalances, useWeightedPairsState } from 'state/weightedPairs/hooks'
import { fetchStablePoolData } from 'state/stablePools/fetchStablePoolData'
import useRefresh from 'hooks/useRefresh'
import { useDeserializedStablePools, useStablePoolLpBalance, useStablePools } from 'state/stablePools/hooks'
import FullWeightedPositionCard from '../../components/PositionCard/WeightedPairPosition'
import FullStablesPositionCard from '../../components/PositionCard/StablesPosition'
import { useTokenBalancesWithLoadingIndicator } from '../../state/wallet/hooks'
import { WeightedPairState, useWeightedPairsDataLite, useGetWeightedPairs } from '../../hooks/useWeightedPairs'
import Dots from '../../components/Loader/Dots'
import { AppHeader, AppBody } from '../../components/App'
import Page from '../Page'

const Body = styled(CardBody)`
  background-color: ${({ theme }) => theme.colors.dropdownDeep};
`

function useRelevantWeightedPairs(chainId: number): WeightedPair[] {

  const basePairs = useMemo(() => {
    const basePairList: [Token, Token][] = []
    for (let i = 0; i < BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED[chainId].length; i++) {
      for (let k = i; k < BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED[chainId].length; k++) {
        basePairList.push(
          [
            BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED[chainId][i],
            BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED[chainId][k]
          ]
        )
      }
    }
    return basePairList
  }, [chainId])

  const allPairCombinations: [Token, Token][] = useMemo(
    () =>
      basePairs
        .filter((tokens): tokens is [Token, Token] => Boolean(tokens[0] && tokens[1]))
        .filter(([t0, t1]) => t0.address !== t1.address),
    [basePairs],
  )

  const addressesRaw = useGetWeightedPairs(allPairCombinations, chainId)

  const pairData = useMemo(
    () =>
      addressesRaw
        ? addressesRaw
          .map((addressData, index) => [addressData[0], allPairCombinations[index], addressData[1]])
          .filter(x => x[0] === WeightedPairState.EXISTS)
        : [],
    [addressesRaw, allPairCombinations]
  )

  const [relevantPairs, addressList] = useMemo(() => {
    const data: [Token, Token][] = []
    const dataAddress: string[] = []
    for (let j = 0; j < pairData.length; j++) {
      for (let k = 0; k < (pairData[j][2] as string[]).length; k++) {
        data.push(pairData[j][1] as [Token, Token])
        dataAddress.push(pairData[j][2][k])
      }
    }
    return [data, dataAddress]
  }, [pairData])

  const weightedPairsData = useWeightedPairsDataLite(
    relevantPairs,
    addressList,
    chainId)


  return useMemo(
    () => {
      return weightedPairsData.filter(x => x[0] === WeightedPairState.EXISTS).map(entry => entry[1])
    },
    [weightedPairsData]
  )
}

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
    const _chain = chain ?? getChain(chainId)
    history.push(`/${_chain}/liquidity`)

  },
    [chainId, chain, history],
  )


  const { slowRefresh } = useRefresh()

  const dispatch = useAppDispatch()

  const { pools, publicDataLoaded, userDataLoaded } = useStablePools()

  useEffect(
    () => {
      if (chainId !== pools[0].tokens[0].chainId) {
        dispatch(changeChainId({ newChainId: chainId }))
      }
      if (!publicDataLoaded) {
        Object.values(pools).map(
          (pool) => {
            dispatch(fetchStablePoolData({ pool, chainId: chainId ?? 43113 }))
            return 0
          }
        )
      }
    },
    [
      chainId,
      dispatch,
      slowRefresh,
      pools,
      library,
      publicDataLoaded
    ])

  useEffect(() => {
    if (account && !userDataLoaded && publicDataLoaded) {
      dispatch(fetchStablePoolUserDataAsync({ chainId, account, pools }))
    }
  },
    [
      account,
      chainId,
      pools,
      userDataLoaded,
      publicDataLoaded,
      slowRefresh,
      dispatch
    ]
  )


  const deserializedPools = useDeserializedStablePools()
  const stablePoolReceived = deserializedPools[0]


  const {
    referenceChain: stateChainId
  } = useWeightedPairsState()

  console.log("WP: CID", chainId, stateChainId)
  //  metatedata is supposed to be fetched once
  useEffect(() => {
    if (stateChainId !== chainId) {
      console.log("WP HERE:", chainId, stateChainId)
      dispatch(changeChainIdWeighted({ newChainId: chainId }))
    }

  },
    [dispatch, stateChainId, chainId]
  )

  const {
    referenceChain,
    tokenPairs,
    metaDataLoaded,
  } = useWeightedPairsState()

  console.log("WP: CID2", chainId, referenceChain, "TP", tokenPairs[0])
  //  metatedata is supposed to be fetched once
  useEffect(() => {
    if (!metaDataLoaded) {
      dispatch(fetchWeightedPairMetaData({ tokenPairs }))
    }

  },
    [dispatch, slowRefresh, tokenPairs, metaDataLoaded]
  )


  const {
    weightedPairMeta,
    reservesAndWeightsLoaded,
    userBalancesLoaded
  } = useWeightedPairsState()

  console.log("WP MD", weightedPairMeta)
  // reserves are fetched only once
  useEffect(() => {
    if (metaDataLoaded && !reservesAndWeightsLoaded) {
      dispatch(fetchWeightedPairData({ chainId, pairMetaData: weightedPairMeta }))
    }
  },
    [dispatch, slowRefresh, metaDataLoaded, chainId, weightedPairMeta, reservesAndWeightsLoaded]
  )

  const {
    weightedPairs
  } = useWeightedPairsState()
  // use reduced data for next input
  const pairData = useMemo(() => {
    if (metaDataLoaded) {
      console.log("WP WPAIRS", weightedPairs)
      return reduceDataFromDict(weightedPairs)
    }
    return {}
  },
    [weightedPairs, metaDataLoaded]
  )

  // fetch balances
  useEffect(() => {
    if (metaDataLoaded && reservesAndWeightsLoaded && account && !userBalancesLoaded) {
      dispatch(fetchWeightedPairUserData({ chainId, account, pairData }))
    }
  },
    [dispatch, slowRefresh, metaDataLoaded, chainId, pairData, reservesAndWeightsLoaded, account, userBalancesLoaded]
  )

  const { pairs: allWeightedPairs, balances, totalSupply } = useDeserializedWeightedPairsAndLpBalances()


  // const pairs = useRelevantWeightedPairs(chainId)

  // const lpTokens = useMemo(
  //   () => pairs && pairs.map((entry) => entry.liquidityToken),
  //   [pairs],
  // )

  // const [weightedPairsBalances, fetchingweightedPairBalances] = useTokenBalancesWithLoadingIndicator(
  //   account ?? undefined,
  //   lpTokens,
  // )

  // fetch the reserves for all V2 pools in which the user has a balance
  const lpWithUserBalances = useMemo(
    () =>
      allWeightedPairs.filter((_, index) =>
        balances[index]?.greaterThan('0'),
      ),
    [allWeightedPairs, balances],
  )


  // fetch the reserves for all V2 pools in which the user has a balance
  // const lpWithBalances = useMemo(
  //   () =>
  //     pairs.filter(({ liquidityToken }) =>
  //       weightedPairsBalances[liquidityToken.address]?.greaterThan('0'),
  //     ),
  //   [weightedPairsBalances, pairs],
  // )

  const weightedIsLoading = !metaDataLoaded || !reservesAndWeightsLoaded || !userBalancesLoaded
  // fetchingweightedPairBalances || pairs?.length < lpWithBalances.length || pairs?.some((pair) => !pair)

  const allWeightedPairsWithLiquidity = lpWithUserBalances.filter((pair): pair is WeightedPair => Boolean(pair))

  const stablePoolBalance = useStablePoolLpBalance(0)

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
    if ((!allWeightedPairs || allWeightedPairs.length === 0) && !publicDataLoaded) {
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
        {allWeightedPairsWithLiquidity?.length > 0 && (allWeightedPairsWithLiquidity.map((v2Pair, index) => (
          <FullWeightedPositionCard
            key={v2Pair.liquidityToken.address}
            weightedPair={v2Pair}
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
