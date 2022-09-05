/* eslint no-continue: 0 */
import React, { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import useTheme from 'hooks/useTheme'
import { DAI, ABREQ } from 'config/constants/tokens'
import { AmplifiedWeightedPair, TokenAmount } from '@requiemswap/sdk'
import { Text, Flex, CardBody, CardFooter, Button, AddIcon, Box, useMatchBreakpoints, ChevronUpIcon, ChevronDownIcon } from '@requiemswap/uikit'
import { Link, RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'contexts/Localization'
import GeneralAppBody from 'components/App/GeneralAppBody'
import getChain from 'utils/getChain'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useUserPairs } from 'state/user/hooks'
import { PairGeneralPositionCard, PoolGeneralPositionCard, PoolsHeader, PoolsSectionHeader } from 'components/PositionCard/GeneralPositionCards'
import { useSerializedWeightedPairsData } from 'state/weightedPairs/hooks'
import Column from 'components/Column'
import { SerializedWeightedPair } from 'state/types'
import { BigNumber } from 'ethers'
import Row from 'components/Row'
import { useGetStablePoolState } from 'hooks/useGetStablePoolState'
import useRefresh from 'hooks/useRefresh'
import { useGetWeightedPoolState } from 'hooks/useGetWeightedPoolState'
import FullPoolPositionCard from 'components/PositionCard/PoolPosition'
import { useGetWeightedPairsState } from 'hooks/useGetWeightedPairsState'
import { useStablePoolLpBalance } from 'state/stablePools/hooks'
import { useWeightedPoolLpBalance } from 'state/weightedPools/hooks'
import FullWeightedPositionCardExtended from '../../components/PositionCard/WeightedPairPositionExtended'
import Dots from '../../components/Loader/Dots'
import { AppHeader, AppBody } from '../../components/App'
import Page from '../Page'

const Body = styled(CardBody)`
  background-color: ${({ theme }) => theme.colors.dropdownDeep};
`

const Line = styled.hr`
  height: 3px;
  border:  none;
  background-color: ${({ theme }) => theme.colors.cardBorder};
  color: white;
  width: 20%;
  size: 0.1;
`;

const TextContainer = styled.div`
  margin-top: 0px;
  :hover {
    text-decoration: bold;
  }
`;

export default function PoolList({
  history,
  match: {
    params: { chain },
  },
}: RouteComponentProps<{ chain: string }>) {
  const { chainId, library, account } = useActiveWeb3React()

  const { isMobile, isDesktop } = useMatchBreakpoints()

  const { t } = useTranslation()

  useEffect(() => {
    const _chain = getChain(chainId ?? 43113)
    if (chain !== _chain) {
      history.push(`/${_chain}/liquidity`)
    }

  },
    [chain, chainId, history],
  )

  const [showPairs, setShowPairs] = useState(isDesktop)
  const [showWeightedPools, setShowWeightedPools] = useState(isDesktop)
  const [showStablePools, setShowStablePools] = useState(isDesktop)

  const { slowRefresh, fastRefresh } = useRefresh()

  const { stablePools, stableAmounts, userDataLoaded, publicDataLoaded } = useGetStablePoolState(chainId, account, slowRefresh, slowRefresh)

  const { weightedPools, userDataLoaded: wPoolLoaded, publicDataLoaded: wPoolPublicLoaded } = useGetWeightedPoolState(chainId, account, slowRefresh, slowRefresh)

  const stablePoolReceived = stablePools[0]

  const weightedPoolReceived = weightedPools[0]

  const userPairs = useUserPairs(chainId)

  const {
    pairs,
    balances,
    totalSupply,
    metaDataLoaded,
    reservesAndWeightsLoaded,
    userBalancesLoaded
  } = useGetWeightedPairsState(chainId, account, userPairs, slowRefresh, fastRefresh)

  const { pairs: allSerializedWeightedPairs } = useSerializedWeightedPairsData(chainId)

  const allPairsNoBalance = useMemo(() => {
    const arrOfArrs = Object.values(allSerializedWeightedPairs).map(p => Object.values(p))
    const finalArr: SerializedWeightedPair[] = []
    for (let i = 0; i < arrOfArrs.length; i++) {
      arrOfArrs[i].forEach(arr => {
        finalArr.push(arr)
      });
    }
    return finalArr.filter(dat => BigNumber.from(dat?.userData?.balance ?? 0).eq(0))
  }, [allSerializedWeightedPairs])


  const dataWithUserBalances: { pair: AmplifiedWeightedPair, balance: TokenAmount, supply: TokenAmount }[] = useMemo(
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

  const weightedIsLoading = !metaDataLoaded || !reservesAndWeightsLoaded || !userBalancesLoaded

  const allWeightedPairsWithLiquidity = lpWithUserBalances.filter((pair): pair is AmplifiedWeightedPair => Boolean(pair))

  const allWeightedDataWithLiquidity = dataWithUserBalances.filter((data) => Boolean(data.pair))

  const stablePoolBalance = useStablePoolLpBalance(chainId, 0)

  const weightedPoolBalance = useWeightedPoolLpBalance(chainId, 0)

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
          <FullPoolPositionCard
            userLpPoolBalance={stablePoolBalance}
            pool={stablePoolReceived}
            mb='20px'
            key={`stable-pool-${0}`}
          />)}

        {wPoolLoaded && weightedPoolBalance?.toBigNumber().gt(0) && weightedPoolReceived != null && (
          <FullPoolPositionCard
            userLpPoolBalance={weightedPoolBalance}
            pool={weightedPoolReceived}
            mb='20px'
            key={`weighted-pool-${0}`}
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

  const renderGeneralView = () => {
    return (
      <Flex flexDirection='column'>
        <PoolsHeader>
          <Text textAlign='center' bold fontSize='15px' letterSpacing='2px' textTransform="uppercase">
            Pools available
          </Text>
        </PoolsHeader>
        <Body>
          <Flex flexDirection='column'>
            <PoolsSectionHeader onClick={() => setShowPairs(!showPairs)}>
              <Text textAlign='center' marginLeft='15px' bold>
                Amplified Weighted Pairs
              </Text>
              {showPairs ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </PoolsSectionHeader>
            {showPairs && allPairsNoBalance.map((_p, i) =>

              <PairGeneralPositionCard weightedPair={_p} isMobile={isMobile} marginTop='2px' key={`pgc-p-${_p.address}`} />
            )}
            <PoolsSectionHeader onClick={() => setShowWeightedPools(!showWeightedPools)}>
              <Text textAlign='center' marginLeft='15px' bold>
                Weighted Pools
              </Text>
              {showWeightedPools ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </PoolsSectionHeader>
            {showWeightedPools && weightedPools.map((_wp, i) =>

              <PoolGeneralPositionCard pool={_wp} marginTop='2px' key={`pgc-w-${_wp.address}`} />
            )}
            <PoolsSectionHeader onClick={() => setShowStablePools(!showStablePools)} >
              <Text textAlign='center' marginLeft='15px' bold>
                Stable Pools
              </Text>
              {showStablePools ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </PoolsSectionHeader>
            {showStablePools && stablePools.map((_wp, i) =>
              <PoolGeneralPositionCard pool={_wp} marginTop='2px' key={`pgc-s-${_wp.address}`} />
            )}
          </Flex>
        </Body>
      </Flex>
    )
  }

  return (
    <Page>
      <GeneralAppBody isMobile={isMobile}>
        <AppHeader
          chainId={chainId}
          account={account}
          title="Requiem Liquidity Overview"
          subtitle="Add liquidity to pools to earn fees or burn LP tokens to withdraw pooled tokens." />
        <Flex flexDirection={isMobile ? 'column' : 'row'} justifyContent='space-between'>
          {renderGeneralView()}
          <Flex flexDirection="column" marginBottom='15px' width={isMobile ? '100%' : '400px'}>
            <PoolsHeader>
              <Text textAlign='center' bold fontSize='15px' letterSpacing='2px' textTransform="uppercase">
                Your personal pool positions
              </Text>
            </PoolsHeader>
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
              <Flex flexDirection="row" marginBottom='15px'>
                <Line />
                <Text fontSize='15px' textAlign='center' bold>
                  Add Liquidity by Risk Profile
                </Text>
                <Line />
              </Flex>
              <Row width='100%' height='50px' marginTop='10px'>
                <Button
                  as={Link}
                  to={`/${getChain(chainId)}/add/80-${ABREQ[chainId].address}/20-${DAI[chainId].address}`}
                  variant="secondary"
                  width="33%"
                  height='70px'
                  mb="8px"
                  style={{ borderTopRightRadius: '3px', borderBottomRightRadius: '3px', marginLeft: '3px', marginRight: '3px', marginBottom: '5px' }}
                >
                  <Flex flexDirection="column">
                    <Text fontSize='15px' textAlign='center' lineHeight='16px' bold>
                      Amplified Pairs
                    </Text>
                    <Text fontSize='10px' textAlign='center'>
                      Volatile
                    </Text>
                  </Flex>
                </Button>
                <Button
                  as={Link}
                  to={`/${getChain(chainId)}/add/weighted`}
                  variant="secondary"
                  width="33%"
                  height='70px'
                  mb="8px"
                  style={{ borderRadius: '3px', marginLeft: '3px', marginRight: '3px', marginBottom: '5px' }}
                >
                  <Flex flexDirection="column">
                    <Text fontSize='15px' textAlign='center' lineHeight='16px' bold>
                      Weighted Pools
                    </Text>
                    <Text fontSize='10px' textAlign='center'>
                      Diversified
                    </Text>
                  </Flex>
                </Button>
                <Button
                  as={Link}
                  to={`/${getChain(chainId)}/add/stables`}
                  variant="secondary"
                  width="33%"
                  height='70px'
                  mb="8px"
                  style={{ borderTopLeftRadius: '3px', borderBottomLeftRadius: '3px', marginLeft: '3px', marginRight: '3px', marginBottom: '5px' }}
                >
                  <Flex flexDirection="column">
                    <Text fontSize='15px' textAlign='center' lineHeight='16px' bold>
                      Stable Pools
                    </Text>
                    <Text fontSize='10px' textAlign='center'>
                      Conservative
                    </Text>
                  </Flex>
                </Button>
              </Row>
            </CardFooter>
          </Flex>
        </Flex>
      </GeneralAppBody>
    </Page >
  )
}
