import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import BigNumber from 'bignumber.js'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { Image, RowType, Text, Flex, Box, useMatchBreakpoints, ChevronRightIcon } from '@requiemswap/uikit'
import { ethers } from 'ethers'
import { ABREQ } from 'config/constants/tokens'
import styled from 'styled-components'
import getChain from 'utils/getChain'
import Page from 'components/Layout/Page'
import { TokenImage } from 'components/TokenImage'
import { useBonds, usePollBondsWithUserData, useLpPricing } from 'state/bonds/hooks'
import { useGetWeightedPoolState } from 'hooks/useGetWeightedPoolState'
import { Bond } from 'state/types'
import { RouteComponentProps } from 'react-router'
import { getBondApr } from 'utils/apr'
import { orderBy } from 'lodash'
import isArchivedPid from 'utils/bondHelpers'
import { blocksToDays, prettifySeconds } from 'config'
import { formatSerializedBigNumber } from 'utils/formatBalance'
import chartIcon from 'assets/chartIcon.svg'
import flatChartIcon from 'assets/flatChart.svg'
import { useOracles } from 'state/oracles/hooks'
import { latinise } from 'utils/latinise'
import useRefresh from 'hooks/useRefresh'
import { useGetRawWeightedPairsState, useGetWeightedPairsPricerState } from 'hooks/useGetWeightedPairsState'
import { useGetStablePoolState } from 'hooks/useGetStablePoolState'
import { OptionProps } from 'components/Select/Select'
import Loading from 'components/Loading'
import { priceAssetBackedRequiem } from 'utils/poolPricer'
import { RowProps } from './components/BondTable/Row'
import Claim from './components/BondTable/Actions/ClaimAction'
import { BondWithStakedValue, DesktopColumnSchema, DesktopColumnSchemaCall, DesktopColumnSchemaCallable } from './components/types'
import Table from './components/BondTable/BondTable'
import CallTable from './components/CallBondTable/CallBondTable'
import CallableTable from './components/CallableBondTable/CallableBondTable'
import BondTabButtons from './components/BondTabButtons'
import { NoteTable } from './components/BondTable/NoteTable'
import { CallRowProps } from './components/CallBondTable/CallRow'
import { CallNoteTable } from './components/CallBondTable/CallNoteTable'
import { CallableRowProps } from './components/CallableBondTable/CallableRow'
import { CallableNoteTable } from './components/CallableBondTable/CallableNoteTable'



const ControlContainer = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  position: relative;

  justify-content: space-between;
  flex-direction: column;
  margin-bottom: 32px;

  ${({ theme }) => theme.mediaQueries.sm} {
    flex-direction: row;
    flex-wrap: wrap;
    padding: 16px 32px;
    margin-bottom: 0;
  }
`

const ToggleWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-left: 10px;

  ${Text} {
    margin-left: 8px;
  }
`

const LabelWrapper = styled.div`
  > ${Text} {
    font-size: 12px;
  }
`

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 0px;

  ${({ theme }) => theme.mediaQueries.sm} {
    width: auto;
    padding: 0;
  }
`

const ViewControls = styled.div`
  flex-wrap: wrap;
  justify-content: space-between;
  display: flex;
  align-items: center;
  width: 100%;

  > div {
    padding: 8px 0px;
  }

  ${({ theme }) => theme.mediaQueries.sm} {
    justify-content: flex-start;
    width: auto;

    > div {
      padding: 0;
    }
  }
`

const StyledIconAbs = styled.div<{ height?: number, width?: number }>`
  margin-left:5px
  position:relative;
  display: flex;
  justify-content: center;
  fill: ${({ theme }) => theme.colors.primary};
  filter: invert(98%) sepia(0%) saturate(270%) hue-rotate(198deg) brightness(88%) contrast(100%);
  align-items: center;
  border-radius: 100%;
  img {
    filter: grayscale(80%);
  }
  & > img,
  span {
    height: ${({ height }) => (height ? `${height}px` : '32px')};
    width: ${({ width }) => (width ? `${width}px` : '32px')};
  }
  -webkit-transition: all 300ms ease;
  -moz-transition: all 300ms ease;
  -o-transition: all 300ms ease;
`;

const HeaderBox = styled(Box) <{ btl: string, btr: string, bbl: string, bbr: string, ml: string, mr: string, mb: string, mt: string, width: string, height: string }>`
  margin-top:3px;
  background:  #121212;
  border: 2px solid  ${({ theme }) => theme.colors.backgroundDisabled};
  border-radius: ${({ btl }) => btl} ${({ btr }) => btr} ${({ bbr }) => bbr} ${({ bbl }) => bbl};
  width: ${({ width }) => width};
  height: ${({ height }) => height};
  margin-left: ${({ ml }) => ml};
  margin-right: ${({ mr }) => mr};
  margin-bottom: ${({ mb }) => mb};
  margin-top: ${({ mt }) => mt};
  display:flex;
  justify-content: center;
  align-items: center;
`

const HeaderBoxBond = styled(Box) <{ btl: string, btr: string, bbl: string, bbr: string, ml: string, mr: string, mb: string, mt: string, width: string, height: string }>`
  margin-top:3px;
  background:rgba(10, 10, 10, 0.5);
  border: 2px solid  rgba(30, 30, 30, 0.5);
  border-radius: ${({ btl }) => btl} ${({ btr }) => btr} ${({ bbr }) => bbr} ${({ bbl }) => bbl};
  width: ${({ width }) => width};
  height: ${({ height }) => height};
  margin-left: ${({ ml }) => ml};
  margin-right: ${({ mr }) => mr};
  margin-bottom: ${({ mb }) => mb};
  margin-top: ${({ mt }) => mt};
  display:flex;
  justify-content: center;
  align-items: center;
`

const ExpandingContainer = styled.div<{ expanded: boolean }>`
  transition:all 1s ease;
  pointer-events: none;
  z-index: 1;
  position: relative;
  align: center;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: ${({ expanded }) => (!expanded ? '0%' : '100%')};
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
`

const Line = styled.hr`
  height: 2px;
  border:  none;
  background-color: ${({ theme }) => theme.colors.backgroundAlt};
  width: 100%;
  size: 0.2;
`;

const NUMBER_OF_BONDS_VISIBLE = 12


function Bonds({
  history,
  match: {
    params: { chain },
  },
}: RouteComponentProps<{ chain: string }>) {


  const { isMobile } = useMatchBreakpoints()
  const { pathname } = useLocation()
  const { bondData: bondsLP, userDataLoaded, userReward, vanillaNotesClosed, callNotesClosed, userCallDataLoaded, userCallableDataLoaded, callableNotesClosed } = useBonds()

  const [query, setQuery] = useState('')

  const [liveSelected, setLive] = useState(true)

  const handleSelectMarkets = () => setLive(!liveSelected)

  const [liveSelectedCall, setLiveCall] = useState(true)

  const handleSelectCallMarkets = () => setLiveCall(!liveSelectedCall)


  const [liveSelectedCallable, setLiveCallable] = useState(true)

  const handleSelectCallableMarkets = () => setLiveCallable(!liveSelectedCallable)



  const { account, chainId } = useActiveWeb3React()

  const [sortOption, setSortOption] = useState('hot')
  const chosenBondsLength = useRef(0)

  const isArchived = pathname.includes('archived')
  const isInactive = pathname.includes('history')
  const isActive = !isInactive && !isArchived

  const { slowRefresh, fastRefresh } = useRefresh()

  const {
    pairs,
    metaDataLoaded,
    reservesAndWeightsLoaded,
  } = useGetRawWeightedPairsState(chainId, account, [], slowRefresh)


  const reqPrice = useMemo(
    () => {
      return priceAssetBackedRequiem(chainId, pairs)
    },
    [pairs, chainId]
  )

  const { dataLoaded, oracles } = useOracles(chainId)

  usePollBondsWithUserData(chainId, isArchived)

  // Users with no wallet connected should see 0 as Earned amount
  // Connected users should see loading indicator until first userData has loaded
  const userDataReady = !account || (!!account && userDataLoaded)

  const activeBonds = Object.values(bondsLP) // .filter((bond) => bond.bondId !== 0 && !isArchivedPid(bond.bondId))
  const inactiveBonds = Object.values(bondsLP).filter((bond) => bond.bondId !== 0 && !isArchivedPid(bond.bondId))
  const archivedBonds = Object.values(bondsLP).filter((bond) => isArchivedPid(bond.bondId))


  const stakedInactiveBonds = inactiveBonds.filter(
    (bond) => bond.userData && new BigNumber(bond.userData.stakedBalance).isGreaterThan(0),
  )

  const stakedArchivedBonds = archivedBonds.filter(
    (bond) => bond.userData && new BigNumber(bond.userData.stakedBalance).isGreaterThan(0),
  )

  const bondsList = useCallback(
    (bondsToDisplay: Bond[]): BondWithStakedValue[] => {
      let bondsToDisplayWithAPR: BondWithStakedValue[] = bondsToDisplay.map((bond) => {
        if (!bond.lpTotalInQuoteToken) {
          return bond
        }
        const totalLiquidity = new BigNumber(123123) // new BigNumber(bond.lpTotalInQuoteToken).times(bond.quoteToken.busdPrice)
        const { reqtRewardsApr, lpRewardsApr } = isActive
          ? getBondApr(new BigNumber(bond.poolWeight), new BigNumber(reqPrice), totalLiquidity, bond.reserveAddress[chainId])
          : { reqtRewardsApr: 0, lpRewardsApr: 0 }

        return { ...bond, apr: reqtRewardsApr, lpRewardsApr, liquidity: totalLiquidity }
      })

      if (query) {
        const lowercaseQuery = latinise(query.toLowerCase())
        bondsToDisplayWithAPR = bondsToDisplayWithAPR.filter((bond: BondWithStakedValue) => {
          return latinise(bond.name.toLowerCase()).includes(lowercaseQuery)
        })
      }
      return bondsToDisplayWithAPR
    },
    [reqPrice, query, isActive, chainId],
  )

  const handleChangeQuery = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
  }

  const loadMoreRef = useRef<HTMLDivElement>(null)

  const [numberOfBondsVisible, setNumberOfBondsVisible] = useState(NUMBER_OF_BONDS_VISIBLE)
  const [observerIsSet, setObserverIsSet] = useState(false)

  const chosenBondsMemoized = useMemo(() => {
    let chosenBonds = []

    const sortBonds = (bonds: BondWithStakedValue[]): BondWithStakedValue[] => {
      switch (sortOption) {
        case 'apr':
          return orderBy(bonds, (bond: BondWithStakedValue) => bond.apr + bond.lpRewardsApr, 'desc')
        case 'earned':
          return orderBy(
            bonds,
            (bond: BondWithStakedValue) => (bond.userData ? Number(bond.userData.earnings) : 0),
            'desc',
          )
        case 'liquidity':
          return orderBy(bonds, (bond: BondWithStakedValue) => Number(bond.liquidity), 'desc')
        default:
          return bonds
      }
    }

    if (isActive) {
      chosenBonds = bondsList(activeBonds)
    }
    if (isInactive) {
      chosenBonds = bondsList(inactiveBonds)
    }
    if (isArchived) {
      chosenBonds = bondsList(archivedBonds)
    }

    return sortBonds(chosenBonds).slice(0, numberOfBondsVisible)
  }, [
    sortOption,
    activeBonds,
    bondsList,
    inactiveBonds,
    archivedBonds,
    isActive,
    isInactive,
    isArchived,
    // stakedArchivedBonds,
    // stakedInactiveBonds,
    numberOfBondsVisible,
  ]) // end chosenBondsMemoized


  const { bondData, callBondData, callableBondData } = useBonds()

  chosenBondsLength.current = chosenBondsMemoized.length

  useEffect(() => {
    const _chain = chain ?? getChain(chainId)
    history.push(`/${_chain}/bonds`)

  },
    [chainId, chain, history],
  )

  const {
    stablePools,
    stableAmounts,
    publicDataLoaded
  } = useGetStablePoolState(chainId, account, slowRefresh, slowRefresh)

  useEffect(() => {
    const showMoreBonds = (entries) => {
      const [entry] = entries
      if (entry.isIntersecting) {
        setNumberOfBondsVisible((bondsCurrentlyVisible) => {
          if (bondsCurrentlyVisible <= chosenBondsLength.current) {
            return bondsCurrentlyVisible + NUMBER_OF_BONDS_VISIBLE
          }
          return bondsCurrentlyVisible
        })
      }
    }

    if (!observerIsSet) {
      const loadMoreObserver = new IntersectionObserver(showMoreBonds, {
        rootMargin: '0px',
        threshold: 1,
      })
      loadMoreObserver.observe(loadMoreRef.current)
      setObserverIsSet(true)
    }
  }, [chosenBondsMemoized, observerIsSet])

  const {
    pairs: _pairs
  } = useGetWeightedPairsPricerState(chainId, slowRefresh)

  const {
    weightedPools,
    publicDataLoaded: weightedLoaded
  } = useGetWeightedPoolState(chainId, account, slowRefresh, slowRefresh)

  useLpPricing({ chainId, weightedPools, weightedLoaded, stablePools, stableLoaded: publicDataLoaded, pairs: _pairs, pairsLoaded: metaDataLoaded && reservesAndWeightsLoaded })

  const rowData = Object.values(bondData).map((bond) => {
    const purchasedUnits = Math.round(Number(formatSerializedBigNumber(bond.market?.purchased ?? '0', 18, 18)) * 10000) / 10000 // 7002000
    const purchasedInQuote = Number(ethers.utils.formatEther(bond?.purchasedInQuote ?? '0'))
    const row: RowProps = {
      bond: {
        label: bond.name,
        bondId: bond.bondId,
        bondType: bond.assetType,
        tokens: bond.tokens
      },
      discount: (reqPrice - bond.bondPrice) / reqPrice,
      details: bond,
      term: blocksToDays(bond.vestingTerm ?? 0, chainId),
      roi: {
        value: (Math.round((1.0 / (1.0 - (reqPrice - bond.bondPrice) / reqPrice) - 1) * (31556926 / bond.vestingTerm) * 10000) / 100).toLocaleString(),
        bondId: 1,
        lpLabel: 'string',
        reqtPrice: new BigNumber(reqPrice),
        originalValue: (Math.round((1.0 / (1.0 - (reqPrice - bond.bondPrice) / reqPrice) - 1) * (31556926 / bond.vestingTerm) * 10000) / 100)

      },
      purchased: {
        purchasedUnits,
        purchasedInQuote,
      },
      reqPrice: Number(reqPrice),
      price: {
        reqPrice,
        price: bond.bondPrice,
      }
    }

    return row
  })

  const callRowData = Object.values(callBondData).map((bond) => {
    const purchasedUnits = Math.round(Number(formatSerializedBigNumber(bond.market?.purchased ?? '0', 18, 18)) * 10000) / 10000 // 7002000
    const purchasedInQuote = Number(ethers.utils.formatEther(bond?.purchasedInQuote ?? '0'))
    const row: CallRowProps = {
      bond: {
        label: bond.name,
        bondId: bond.bondId,
        bondType: bond.assetType,
        tokens: bond.tokens
      },
      discount: (reqPrice - bond.bondPrice) / reqPrice,
      details: bond,
      term: blocksToDays(bond.vestingTerm ?? 0, chainId),
      strike: bond.bondTerms?.thresholdPercentage,
      payout: bond.bondTerms?.payoffPercentage,
      purchased: {
        purchasedUnits,
        purchasedInQuote,
      },
      reqPrice: Number(reqPrice),
      price: {
        reqPrice,
        price: bond.bondPrice,
      }
    }

    return row
  })

  const callableRowData = Object.values(callableBondData).map((bond) => {
    const purchasedUnits = Math.round(Number(formatSerializedBigNumber(bond.market?.purchased ?? '0', 18, 18)) * 10000) / 10000 // 7002000
    const purchasedInQuote = Number(ethers.utils.formatEther(bond?.purchasedInQuote ?? '0'))
    const row: CallableRowProps = {
      bond: {
        label: bond.name,
        bondId: bond.bondId,
        bondType: bond.assetType,
        tokens: bond.tokens
      },
      discount: (reqPrice - bond.bondPrice) / reqPrice,
      details: bond,
      term: blocksToDays(bond.vestingTerm ?? 0, chainId),
      strike: bond.bondTerms?.thresholdPercentage,
      purchased: {
        purchasedUnits,
        purchasedInQuote,
      },
      reqPrice: Number(reqPrice),
      price: {
        reqPrice,
        price: bond.bondPrice,
      }
    }

    return row
  })


  const userRewards = useMemo(() => {
    const oneBond = Object.values(bondsLP)[0]
    return oneBond?.userData && userDataLoaded && Number(formatSerializedBigNumber(oneBond?.userData?.earnings, 4, 18))
  },
    [bondsLP, userDataLoaded])

  const notes = useMemo(() => {
    let _notes = []
    const bondKeys = Object.keys(bondsLP)
    for (let k = 0; k < bondKeys.length; k++) {
      const _userData = bondsLP[bondKeys[k]]?.userData
      if (!userDataLoaded || !_userData)
        break;

      for (let l = 0; l < _userData.notes.length; l++)
        _notes = [..._notes, ..._userData.notes]
    }

    return _notes
  }, [bondsLP, userDataLoaded])


  const [totalPayout, avgVesting] = useMemo(() => {
    if (!notes || notes.length === 0)
      return [0, 0]
    const now = Math.round((new Date()).getTime() / 1000);
    const payouts = notes.map((note) => Number(formatSerializedBigNumber(note.payout, 5, 18)))
    const vestingTimes = notes.map(note => Number(note.matured) - now)
    let sumPa = 0
    let sumMulti = 0
    for (let i = 0; i < notes.length; i++) {
      const payout = payouts[i]
      sumPa += payout
      sumMulti += payout * vestingTimes[i]

    }
    return [sumPa, sumMulti / sumPa]

  }, [notes])




  const renderTerms = (): JSX.Element => {
    return (
      <Flex flexDirection="column">
        <Flex flexDirection="row">
          <Flex flexDirection="column" marginRight='15px'>
            <Text fontSize='15px' textAlign='center' lineHeight='16px' bold>
              {userDataLoaded && `${totalPayout.toLocaleString()} ABREQ / $${Math.round(totalPayout * reqPrice).toLocaleString()}`}
            </Text>
            <Text fontSize='10px' textAlign='center' lineHeight='16px' bold marginLeft='20px'>
              Total Claims
            </Text>
          </Flex>
          <Flex flexDirection="column">
            <Text fontSize='15px' textAlign='center' lineHeight='16px' bold>
              {userRewards && `${userRewards.toLocaleString()} ABREQ / $${Math.round(userRewards * reqPrice).toLocaleString()}`}
            </Text>
            <Text fontSize='10px' textAlign='center' lineHeight='16px' bold marginLeft='20px'>
              Claimable ABREQ
            </Text>
          </Flex>
        </Flex>
        <Flex flexDirection="column" marginTop='15px'>
          <Text fontSize='15px' textAlign='center' lineHeight='16px' bold>
            {avgVesting && prettifySeconds(avgVesting, 's')}
          </Text>
          <Text fontSize='10px' textAlign='center' lineHeight='16px' bold marginLeft='20px'>
            Average Maturity
          </Text>
        </Flex>

      </Flex>
    )
  }



  const renderSummary = (): JSX.Element => {
    return (
      <Flex flexDirection="column">
        <Flex flexDirection="row" marginRight='15px'>
          <ChevronRightIcon width={20} />
          <Text fontSize='15px' textAlign='left' lineHeight='16px' bold marginLeft='20px'>
            Get LP from our DEX
          </Text>
        </Flex>
        <Flex flexDirection="row" marginTop='5px'>
          <ChevronRightIcon width={20} />
          <Text fontSize='15px' textAlign='left' lineHeight='16px' bold marginLeft='20px'>
            Select your ideal Terms for Bonding
          </Text>
        </Flex>
        <Flex flexDirection="row" marginTop='5px'>
          <ChevronRightIcon width={20} />
          <Text fontSize='15px' textAlign='left' lineHeight='16px' bold marginLeft='20px' marginRight='2px'>
            Bond the Asset in Return for
          </Text>
          <TokenImage token={ABREQ[chainId]} chainId={chainId} width={20} height={20} marginLeft='2px' />
        </Flex>

      </Flex>
    )
  }

  const renderHeader = (): JSX.Element => {
    return (
      <>
        <Box>
          <Flex flexDirection={isMobile ? "column" : 'row'} width='100%' marginTop='10px' marginRight='2px'>
            <HeaderBox
              btl='16px'
              btr={isMobile ? '16px' : '3px'}
              bbl={isMobile ? '3px' : '16px'}
              bbr='3px'
              width={isMobile ? '100%' : '50%'}
              height='164px'
              ml='1px'
              mr='2px'
              mb='2px'
              mt='0px'
            >
              <Flex flexDirection="column" justifyContent='center'>
                <Flex flexDirection="row" justifyContent='flex-start' >
                  <Text fontSize='17px' textAlign={isMobile ? 'center' : 'left'} bold marginLeft='5px' marginTop='2px' marginRight='20px'>
                    Bond Tokens for Asset-Backed Requiem
                  </Text>
                </Flex>
                <Line />
                <Flex flexDirection="row" alignItems='center' justifyContent='center'>
                  {renderSummary()}
                </Flex>
              </Flex>
            </HeaderBox>
            <HeaderBox
              btl='3px'
              btr={isMobile ? '3px' : '16px'}
              bbl={isMobile ? '16px' : '3px'}
              bbr='16px'
              width={isMobile ? '100%' : '50%'}
              height='164px'
              ml='1px'
              mr='2px'
              mb='2px'
              mt={isMobile ? '5px' : '0px'}
            >
              <Flex flexDirection="column" justifyContent='center'>
                <Flex flexDirection="row" justifyContent='flex-start' >
                  <Text fontSize='17px' textAlign='left' bold marginLeft='5px' marginTop='2px' marginRight='20px'>
                    Your Term Sheet
                  </Text>
                  <Claim isMobile={isMobile} userDataReady={userDataLoaded} noBond={userDataLoaded ? Number(userReward) === 0 : false} bondIds={Object.keys(bondsLP).map(n => Number(n))} />
                </Flex>
                <Line />
                <Flex flexDirection="row" alignItems='center' justifyContent='center'>
                  {renderTerms()}
                </Flex>
              </Flex>
            </HeaderBox>
          </Flex>
        </Box>
      </>
    )
  }


  const renderGeneralHeader = (): JSX.Element => {
    return (
      <>
        <Box>
          <Flex flexDirection={isMobile ? "column" : 'row'} width='100%' marginTop='10px' marginRight='2px'>
            <HeaderBoxBond
              btl='32px'
              btr='32px'
              bbl='32px'
              bbr='32px'
              width={isMobile ? '100%' : '100%'}
              height={isMobile ? '120px' : '80px'}
              ml='1px'
              mr='2px'
              mb={isMobile ? '7px' : '2px'}
              mt='0px'
            >
              <Flex flexDirection="row" width='90%'>
                <StyledIconAbs height={80} width={80}>
                  <img src={flatChartIcon} alt='' />
                </StyledIconAbs>
                <Flex flexDirection="column" width='100%' marginLeft='3px'>
                  <Text fontSize='20px' textAlign={isMobile ? 'left' : 'left'} bold marginLeft='5px' marginTop='2px' marginRight='5px'>
                    Vanilla Bonding
                  </Text>
                  <Flex flexDirection="row" justifyContent='flex-start' >
                    <Text fontSize='14px' textAlign={isMobile ? 'left' : 'left'} marginLeft='5px' marginRight='2px'>
                      Bond stable LP Tokens for fixed payoff
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            </HeaderBoxBond>

            <Flex flexDirection="column" justifyContent='center' alignSelf='center' >
              <Flex flexDirection="row" alignItems='center' justifyContent='center'>
                <BondTabButtons hasStakeInFinishedBonds={vanillaNotesClosed.length > 0} isLive={liveSelected} onLive={handleSelectMarkets} />
              </Flex>
            </Flex>
          </Flex>
        </Box>
      </>
    )
  }



  const renderGeneralCallHeader = (): JSX.Element => {
    return (
      <>
        <Box>
          <Flex flexDirection={isMobile ? "column" : 'row'} width='100%' marginTop='10px' marginRight='2px'>
            <HeaderBoxBond
              btl='32px'
              btr='32px'
              bbl='32px'
              bbr='32px'
              width={isMobile ? '100%' : '100%'}
              height={isMobile ? '120px' : '80px'}
              ml='1px'
              mr='2px'
              mb={isMobile ? '7px' : '2px'}
              mt='0px'
            >
              <Flex flexDirection="row" width='90%'>
                <StyledIconAbs height={40} width={40}>
                  <img src={chartIcon} alt='' />
                </StyledIconAbs>

                <Flex flexDirection="column" width='100%' marginLeft='5px'>
                  <Text fontSize='20px' textAlign={isMobile ? 'left' : 'left'} bold marginLeft='5px' marginTop='2px' marginRight='5px'>
                    Digital Crypto Bonding
                  </Text>

                  <Flex flexDirection="row" justifyContent='flex-start' >
                    <Text fontSize='14px' textAlign={isMobile ? 'left' : 'left'} marginLeft='5px' marginRight='2px'>
                      Bond Tokens for fixed payoff and gain aditional coupon payoff based on the underlying Crypto Index
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            </HeaderBoxBond>

            <Flex flexDirection="column" justifyContent='center'>
              <Flex flexDirection="row" alignItems='center' justifyContent='center'>
                <BondTabButtons hasStakeInFinishedBonds={callNotesClosed.length > 0} isLive={liveSelectedCall} onLive={handleSelectCallMarkets} />
              </Flex>
            </Flex>
          </Flex>
        </Box>
      </>
    )
  }


  const renderGeneralCallableHeader = (): JSX.Element => {
    return (
      <>
        <Box>
          <Flex flexDirection={isMobile ? "column" : 'row'} width='100%' marginTop='10px' marginRight='2px'>
            <HeaderBoxBond
              btl='32px'
              btr='32px'
              bbl='32px'
              bbr='32px'
              width={isMobile ? '100%' : '100%'}
              height={isMobile ? '120px' : '80px'}
              ml='1px'
              mr='2px'
              mb={isMobile ? '7px' : '2px'}
              mt='0px'
            >
              <Flex flexDirection="row" width='90%'>
                <StyledIconAbs height={40} width={40}>
                  <img src={chartIcon} alt='' />
                </StyledIconAbs>

                <Flex flexDirection="column" width='100%' marginLeft='5px'>
                  <Text fontSize='20px' textAlign={isMobile ? 'left' : 'left'} bold marginLeft='5px' marginTop='2px' marginRight='5px'>
                    Callable Bonding
                  </Text>

                  <Flex flexDirection="row" justifyContent='flex-start' >
                    <Text fontSize='14px' textAlign={isMobile ? 'left' : 'right'} marginLeft='5px' marginRight='2px'>
                      Claim ABREQ before vesting ends if Index crosses threshold.
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            </HeaderBoxBond>

            <Flex flexDirection="column" justifyContent='center'>
              <Flex flexDirection="row" alignItems='center' justifyContent='center'>
                <BondTabButtons hasStakeInFinishedBonds={callableNotesClosed.length > 0} isLive={liveSelectedCallable} onLive={handleSelectCallableMarkets} />
              </Flex>
            </Flex>
          </Flex>
        </Box>
      </>
    )
  }


  const renderContent = (): JSX.Element => {
    const columnSchema = DesktopColumnSchema

    const columns = columnSchema.map((column) => ({
      id: column.id,
      name: column.name,
      label: column.label,
      sort: (a: RowType<RowProps>, b: RowType<RowProps>) => {
        switch (column.name) {
          case 'bond':
            return b.id - a.id
          default:
            return 1
        }
      },
      sortable: column.sortable,
    }))

    return <Table data={rowData} columns={columns} userDataReady={userDataReady} />
  }


  const renderCallContent = (): JSX.Element => {
    const columnSchema = DesktopColumnSchemaCall

    const columns = columnSchema.map((column) => ({
      id: column.id,
      name: column.name,
      label: column.label,
      sort: (a: RowType<CallRowProps>, b: RowType<CallRowProps>) => {
        switch (column.name) {
          case 'bond':
            return b.id - a.id
          default:
            return 1
        }
      },
      sortable: column.sortable,
    }))

    return <CallTable data={callRowData} columns={columns} userDataReady={userDataReady} />
  }

  const renderCallableContent = (): JSX.Element => {
    const columnSchema = DesktopColumnSchemaCallable

    const columns = columnSchema.map((column) => ({
      id: column.id,
      name: column.name,
      label: column.label,
      sort: (a: RowType<CallableRowProps>, b: RowType<CallableRowProps>) => {
        switch (column.name) {
          case 'bond':
            return b.id - a.id
          default:
            return 1
        }
      },
      sortable: column.sortable,
    }))

    return <CallableTable data={callableRowData} columns={columns} userDataReady={userDataReady} />
  }



  const handleSortOptionChange = (option: OptionProps): void => {
    setSortOption(option.value)
  }

  return (
    <>
      <Page>
        {renderHeader()}
        {renderGeneralHeader()}
        {liveSelected && renderContent()}
        <NoteTable notes={vanillaNotesClosed} userDataReady={userDataLoaded} reqPrice={reqPrice} expanded={!liveSelected} />

        {renderGeneralCallHeader()}
        {liveSelectedCall && renderCallContent()}
        <CallNoteTable notes={callNotesClosed} userDataReady={userCallDataLoaded} reqPrice={reqPrice} expanded={!liveSelectedCall} />


        {renderGeneralCallableHeader()}
        {liveSelectedCallable && renderCallableContent()}
        <CallableNoteTable notes={callableNotesClosed} userDataReady={userCallableDataLoaded} reqPrice={reqPrice} expanded={!liveSelectedCallable} />

        {account && !userDataLoaded && (
          <Flex justifyContent="center">
            <Loading />
          </Flex>
        )}
        <div ref={loadMoreRef} />
      </Page>
    </>
  )
}

export default Bonds
