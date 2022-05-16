import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react'
import { Route, useRouteMatch, useLocation, NavLink, Link } from 'react-router-dom'
import BigNumber from 'bignumber.js'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { Image, Heading, RowType, Toggle, Text, Button, ArrowForwardIcon, Flex, Box, useMatchBreakpoints } from '@requiemswap/uikit'
import { TokenAmount, ZERO } from '@requiemswap/sdk'
import { ethers } from 'ethers'
import { SREQ } from 'config/constants/tokens'
import styled from 'styled-components'
import getChain from 'utils/getChain'
import Page from 'components/Layout/Page'
import TokenPositionCard from 'components/PositionCard/TokenPosition'
import { useBonds, usePollBondsWithUserData, usePollBondsPublicData } from 'state/bonds/hooks'
import { Bond } from 'state/types'
import { useTranslation } from 'contexts/Localization'
import { RouteComponentProps } from 'react-router'
import Row from 'components/Row'
import { timeConverter } from 'utils/time'
import { useAppDispatch } from 'state'
import { getBondApr } from 'utils/apr'
import { orderBy } from 'lodash'
import isArchivedPid from 'utils/bondHelpers'
import { blocksToDays, prettifySeconds } from 'config'
import { formatSerializedBigNumber } from 'utils/formatBalance'

import { latinise } from 'utils/latinise'
import { useAssetBackedStakingInfo } from 'state/assetBackedStaking/hooks'
import useRefresh from 'hooks/useRefresh'
import { useGetRawWeightedPairsState } from 'hooks/useGetWeightedPairsState'
import { useGetStablePoolState } from 'hooks/useGetStablePoolState'
import Select, { OptionProps } from 'components/Select/Select'
import Loading from 'components/Loading'
import { priceAssetBackedRequiem, priceRequiem } from 'utils/poolPricer'
// import { BigNumber } from 'ethers'
import { RowProps } from './components/BondTable/Row'
import Claim from './components/BondTable/Actions/ClaimAction'
import { BondWithStakedValue, DesktopColumnSchema, ViewMode } from './components/types'
import Table from './components/BondTable/BondTable'



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

const Line = styled.hr`
  height: 2px;
  border:  none;
  background-color: ${({ theme }) => theme.colors.backgroundAlt};
  width: 100%;
  size: 0.2;
`;


const StyledImage = styled(Image)`
  margin-left: auto;
  margin-right: auto;
  margin-top: 58px;
`
const NUMBER_OF_BONDS_VISIBLE = 12

const getDisplayApr = (reqtRewardsApr?: number, lpRewardsApr?: number) => {
  if (reqtRewardsApr && lpRewardsApr) {
    return (reqtRewardsApr + lpRewardsApr).toLocaleString('en-US', { maximumFractionDigits: 2 })
  }
  if (reqtRewardsApr) {
    return reqtRewardsApr.toLocaleString('en-US', { maximumFractionDigits: 2 })
  }
  return null
}

function Bonds({
  history,
  match: {
    params: { chain },
  },
}: RouteComponentProps<{ chain: string }>) {


  const { isMobile } = useMatchBreakpoints()
  const { pathname } = useLocation()
  const { bondData: bondsLP, userDataLoaded, } = useBonds()

  const [query, setQuery] = useState('')
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

  const {
    epoch,
    stakeData,
    generalDataLoaded,
    userData,
    userDataLoaded: stakeUserDataLoaded,
    stakedRequiem,
    stakedRequiemLoaded
  } = useAssetBackedStakingInfo(chainId, account)

  // const { data } = userData ?? {}

  // const { warmupInfo } = data ?? {}
  // const { gons } = warmupInfo ?? {}

  console.log("REQUIEM", stakedRequiem, userData, userData?.warmupInfo?.gons)

  const reqPrice = useMemo(
    () => {
      return priceAssetBackedRequiem(chainId, pairs)
    },
    [pairs, chainId]
  )

  usePollBondsWithUserData(chainId, isArchived)

  // Users with no wallet connected should see 0 as Earned amount
  // Connected users should see loading indicator until first userData has loaded
  const userDataReady = !account || (!!account && userDataLoaded)

  // const [stakedOnly, setStakedOnly] = useUserBondStakedOnly(isActive)

  const activeBonds = Object.values(bondsLP) // .filter((bond) => bond.bondId !== 0 && !isArchivedPid(bond.bondId))
  const inactiveBonds = Object.values(bondsLP).filter((bond) => bond.bondId !== 0 && !isArchivedPid(bond.bondId))
  const archivedBonds = Object.values(bondsLP).filter((bond) => isArchivedPid(bond.bondId))

  // const stakedOnlyBonds = activeBonds.filter(
  //   (bond) => bond.userData && new BigNumber(bond.userData.stakedBalance).isGreaterThan(0),
  // )

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

  const dispatch = useAppDispatch()

  const { bondData } = useBonds()

  chosenBondsLength.current = chosenBondsMemoized.length

  useEffect(() => {
    const _chain = chain ?? getChain(chainId)
    history.push(`/${_chain}/bonds`)

  },
    [chainId, chain, history],
  )


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


  const rowData = Object.values(bondData).map((bond) => {

    const purchased = Math.round(Number(formatSerializedBigNumber(bond.market?.purchased ?? '0', 18, 18)) * 10000) / 10000 // 7002000
    const row: RowProps = {
      bond: {
        label: bond.name,
        bondId: bond.bondId,
        token: bond.token,
        quoteToken: bond.quoteToken,
        token2: bond.token2,
        token3: bond.token3,
        bondType: bond.type,
        tokens: bond.tokens
      },
      discount: (reqPrice - bond.bondPrice) / reqPrice,
      details: bond,
      price: bond.bondPrice,
      term: blocksToDays(bond.vestingTerm ?? 0, chainId),
      roi: {
        value: String(Math.round((1.0 / (1.0 - (reqPrice - bond.bondPrice) / reqPrice) - 1) * (31556926 / bond.vestingTerm) * 10000) / 100),
        bondId: 1,
        lpLabel: 'string',
        reqtPrice: new BigNumber(reqPrice),
        originalValue: 3

      },
      purchased,
      reqPrice,
    }

    return row
  })

  const sreqSupp = useMemo(() => { return stakedRequiemLoaded && Number(formatSerializedBigNumber(stakedRequiem.totalSupplySReq, 0, 18)) }, [stakedRequiem, stakedRequiemLoaded])

  const greqSupp = useMemo(() => { return stakedRequiemLoaded && Number(formatSerializedBigNumber(stakedRequiem.totalSupplyGReq, 0, 18)) }, [stakedRequiem, stakedRequiemLoaded])

  const sreqBalance = useMemo(() => { return userData && stakeUserDataLoaded && Number(formatSerializedBigNumber(userData?.sReqBalance, 0, 18)) }, [userData, stakeUserDataLoaded])

  const greqBalance = useMemo(() => { return userData && stakeUserDataLoaded && Number(formatSerializedBigNumber(userData?.gReqBalance, 0, 18)) }, [userData, stakeUserDataLoaded])

  const userStaked = useMemo(() => {
    if (!stakeUserDataLoaded)
      return 0
    const gonsPerFragment = ethers.BigNumber.from(stakedRequiem?.gonsPerFragment ?? '1')
    const bal = ethers.BigNumber.from(userData?.warmupInfo?.gons ?? '0')

    console.log("STaKED B", stakedRequiem?.gonsPerFragment, userData?.warmupInfo?.gons, gonsPerFragment.toString(), bal.toString())
    return Number(formatSerializedBigNumber(bal.div(gonsPerFragment).toString(), 18, 18))
  },
    [userData, stakedRequiem, stakeUserDataLoaded]
  )

  const userRewards = useMemo(() => {
    const oneBond = Object.values(bondsLP)[0]
    return oneBond?.userData && userDataLoaded && Number(formatSerializedBigNumber(oneBond?.userData?.earnings, 4, 18))
  },
    [bondsLP, userDataLoaded])

  const notes = useMemo(() => { // bondsLP && userDataLoaded && Object.values(bondsLP).map(x => x?.userData?.notes ?? []).reduce((n, current) => [...n, ...current])
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



  console.log("STAKED", userStaked)
  const renderSupplySReq = (): JSX.Element => {
    return (
      <Flex flexDirection="column">

        <Text fontSize='15px' textAlign='center' lineHeight='16px' bold>
          {stakedRequiemLoaded && `${sreqSupp.toLocaleString()} sREQ / $${(Math.round(sreqSupp * reqPrice / 1e6)).toLocaleString()}M`}
        </Text>
        <Text fontSize='10px' textAlign='center' lineHeight='16px' bold marginLeft='20px'>
          Total Supply
        </Text>
      </Flex>
    )
  }

  const formattedEpoch = useMemo(() => {
    return generalDataLoaded && {
      length: prettifySeconds(epoch.length),
      number: epoch.number,
      end: timeConverter(epoch.end),
      distribute: (Number(formatSerializedBigNumber(epoch.distribute, 0, 18)) * reqPrice).toLocaleString()
    }
  }, [epoch, generalDataLoaded, reqPrice])

  const renderEpochSReq = (): JSX.Element => {

    return (
      <Flex flexDirection="row" justifyContent='center'>
        <Flex flexDirection="column" marginRight='15px'>
          <Text fontSize='15px' textAlign='left' lineHeight='20px' >
            Number
          </Text>
          <Text fontSize='15px' textAlign='left' lineHeight='20px' >
            Duration
          </Text>
          <Text fontSize='15px' textAlign='left' lineHeight='20px' >
            End
          </Text>
          <Text fontSize='15px' textAlign='left' lineHeight='20px' >
            Distribution
          </Text>
        </Flex>

        <Flex flexDirection="column">
          <Text fontSize='15px' textAlign='center' lineHeight='20px' bold >
            {formattedEpoch.number}
          </Text>
          <Text fontSize='15px' textAlign='center' lineHeight='20px' bold >
            {formattedEpoch.length}
          </Text>
          <Text fontSize='15px' textAlign='center' lineHeight='20px' bold >
            {formattedEpoch.end}
          </Text>
          <Text fontSize='15px' textAlign='center' lineHeight='20px' bold >
            {formattedEpoch.distribute}
          </Text>
        </Flex>
      </Flex>
    )
  }


  const renderSupplyGReq = (): JSX.Element => {

    return (
      <Flex flexDirection="column">

        <Text fontSize='15px' textAlign='center' lineHeight='16px' bold>
          {stakedRequiemLoaded && `${greqSupp.toLocaleString()} gREQ / $${(Math.round(greqSupp * reqPrice * 50)).toLocaleString()}`}
        </Text>
        <Text fontSize='10px' textAlign='center' lineHeight='16px' bold marginLeft='20px'>
          Total Supply
        </Text>
      </Flex>
    )
  }

  const renderTerms = (): JSX.Element => {


    return (

      <Flex flexDirection="column">

        <Flex flexDirection="row">

          <Flex flexDirection="column" marginRight='15px'>

            <Text fontSize='15px' textAlign='center' lineHeight='16px' bold>
              {userDataLoaded && `${totalPayout.toLocaleString()} gREQ / $${Math.round(totalPayout * reqPrice * 50).toLocaleString()}`}
            </Text>
            <Text fontSize='10px' textAlign='center' lineHeight='16px' bold marginLeft='20px'>
              Total Claims
            </Text>
          </Flex>

          <Flex flexDirection="column">

            <Text fontSize='15px' textAlign='center' lineHeight='16px' bold>
              {userRewards && `${userRewards.toLocaleString()} abREQ / $${Math.round(userRewards * reqPrice).toLocaleString()}`}
            </Text>
            <Text fontSize='10px' textAlign='center' lineHeight='16px' bold marginLeft='20px'>
              Claimable abREQ
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





  const renderHeader = (): JSX.Element => {
    const widthComponent = isMobile ? '100%' : '33%'

    return (
      <>{stakedRequiemLoaded && (
        <Box>
          <Flex flexDirection={isMobile ? "column" : 'row'} width='100%' marginTop='10px' marginRight='2px'>
            <Flex flexDirection="column" width={widthComponent} marginRight='2px' >
              <HeaderBox
                btl='16px'
                btr='3px'
                bbl='3px'
                bbr='3px'
                width="100%"
                height='80px'
                ml='1px'
                mr='2px'
                mb='4px'
                mt='0px'
              >
                <Flex flexDirection="column">
                  <Text fontSize='17px' textAlign='left' bold marginLeft='-20px' marginTop='2px'>
                    Staking
                  </Text>
                  <Line />
                  <Flex flexDirection="row" alignItems='center' justifyContent='center'>
                    {renderSupplySReq()}
                  </Flex>
                </Flex>
              </HeaderBox>
              <HeaderBox
                btl='3px'
                btr='3px'
                bbl='16px'
                bbr='3px'
                width="100%"
                height='80px'
                ml='1px'
                mr='2px'
                mb='2px'
                mt='0px'
              >
                <Flex flexDirection="column">
                  <Text fontSize='17px' textAlign='left' bold marginLeft='-20px' marginTop='2px'>
                    Governance
                  </Text>
                  <Line />
                  <Flex flexDirection="row" alignItems='center' justifyContent='center'>

                    {renderSupplyGReq()}
                  </Flex>
                </Flex>
              </HeaderBox>

            </Flex>
            <HeaderBox
              btl='3px'
              btr='3px'
              bbl='3px'
              bbr='3px'
              width={widthComponent}
              height='164px'
              ml='2px'
              mr='2px'
              mb='10px'
              mt='0px'
            >
              <Flex flexDirection="column">
                <Text fontSize='17px' textAlign='left' bold marginLeft='-20px' marginTop='2px'>
                  Epoch
                </Text>
                <Line />
                <Flex flexDirection="row" alignItems='center' justifyContent='center'>
                  {renderEpochSReq()}
                </Flex>
              </Flex>
            </HeaderBox>
            <HeaderBox
              btl='3px'
              btr='16px'
              bbl='3px'
              bbr='16px'
              width={widthComponent}
              height='164px'
              ml='1px'
              mr='2px'
              mb='10px'
              mt='0px'
            >
              <Flex flexDirection="column" justifyContent='center'>
                <Flex flexDirection="row" justifyContent='flex-start' >
                  <Text fontSize='17px' textAlign='left' bold marginLeft='5px' marginTop='2px' marginRight='20px'>
                    Your Term Sheet
                  </Text>
                  <Claim isMobile={isMobile} userDataReady={userDataLoaded} noBond={false} bondIds={Object.keys(bondsLP).map(n => Number(n))} />
                </Flex>
                <Line />
                <Flex flexDirection="row" alignItems='center' justifyContent='center'>
                  {renderTerms()}
                </Flex>
              </Flex>
            </HeaderBox>
          </Flex>
        </Box>)}
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

  const handleSortOptionChange = (option: OptionProps): void => {
    setSortOption(option.value)
  }

  return (
    <>
      <Page>
        {renderHeader()}
        {renderContent()}
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
