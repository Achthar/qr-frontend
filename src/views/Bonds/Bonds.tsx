import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react'
import { Route, useRouteMatch, useLocation, NavLink, Link } from 'react-router-dom'
import BigNumber from 'bignumber.js'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { Image, Heading, RowType, Toggle, Text, Button, ArrowForwardIcon, Flex, Box } from '@requiemswap/uikit'
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
import { getBondApr } from 'utils/apr'
import { useChainIdHandling } from 'hooks/useChainIdHandle'
import { useNetworkState } from 'state/globalNetwork/hooks'
import { orderBy } from 'lodash'
import isArchivedPid from 'utils/bondHelpers'
import { blocksToDays } from 'config'
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
import { useAppDispatch } from 'state'
import BondCard, { BondWithStakedValue } from './components/BondCard/BondCard'
import Table from './components/BondTable/BondTable'
import { RowProps } from './components/BondTable/Row'
import { DesktopColumnSchema, ViewMode } from './components/types'



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

const HeaderBox = styled(Box) <{ btl: string, btr: string, bbl: string, bbr: string, ml: string, mr: string, width: string, height: string }>`
  margin-top:3px;
  background:  #121212;
  border: 2px solid  ${({ theme }) => theme.colors.backgroundDisabled};
  border-radius: ${({ btl }) => btl} ${({ btr }) => btr} ${({ bbr }) => bbr} ${({ bbl }) => bbl};
  width: ${({ width }) => width};
  height: ${({ height }) => height};
  margin-left: ${({ ml }) => ml};
  margin-right: ${({ mr }) => mr};
  margin-bottom: 15px;
`


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
  const { path } = useRouteMatch()
  const { pathname } = useLocation()
  const { t } = useTranslation()
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

  const { epoch, stakeData, generalDataLoaded, userData, userDataLoaded: stakeUserDataLoaded, stakedRequiem, stakedRequiemLoaded } = useAssetBackedStakingInfo(chainId, account)

  console.log("REQUIEM", stakedRequiem)

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

  const sreqBalance = useMemo(() => { return userData?.data && stakeUserDataLoaded && Number(formatSerializedBigNumber(userData?.data?.sReqBalance, 0, 18)) }, [userData, stakeUserDataLoaded])

  const greqBalance = useMemo(() => { return userData?.data && stakeUserDataLoaded && Number(formatSerializedBigNumber(userData?.data?.gReqBalance, 0, 18)) }, [userData, stakeUserDataLoaded])


  const totalPayoutAllNotes = useMemo(() => {
    const val = bondsLP && userDataLoaded && Object.values(bondsLP).map(x => x?.userData ? (x?.userData?.notes.map(n => ethers.BigNumber.from(n.payout)).reduce((sum, current) => sum.add(current))) : ZERO).reduce((x, y) => x.add(y))
    return val && Number(formatSerializedBigNumber(val.toString(), 0, 18))
  },
    [userDataLoaded, bondsLP])


  const renderSupplySReq = (): JSX.Element => {

    return (
      <Flex flexDirection="column">

        <Text fontSize='15px' textAlign='center' lineHeight='16px' bold>
          {stakedRequiemLoaded && `${sreqSupp.toLocaleString()} sREQ / $${(sreqSupp * reqPrice / 1e6).toLocaleString()}M`}
        </Text>
        <Text fontSize='10px' textAlign='center' lineHeight='16px' bold marginLeft='20px'>
          Total Supply
        </Text>
      </Flex>
    )
  }

  const renderSupplyGReq = (): JSX.Element => {

    return (
      <Flex flexDirection="column">

        <Text fontSize='15px' textAlign='center' lineHeight='16px' bold>
          {stakedRequiemLoaded && `${greqSupp.toLocaleString()} gREQ / $${(greqSupp * reqPrice / 50).toLocaleString()}`}
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

        <Text fontSize='15px' textAlign='center' lineHeight='16px' bold>
          {userDataLoaded && `${totalPayoutAllNotes.toLocaleString()} gREQ / $${(totalPayoutAllNotes * reqPrice / 50).toLocaleString()}`}
        </Text>
        <Text fontSize='10px' textAlign='center' lineHeight='16px' bold marginLeft='20px'>
          Total Claims
        </Text>
      </Flex>
    )
  }





  const renderHeader = (): JSX.Element => {



    return (
      <>{stakedRequiemLoaded && (
        <Box>
          <Row width='100%' height='50px' marginTop='10px'>
            <HeaderBox
              btl='16px'
              btr='3px'
              bbl='16px'
              bbr='3px'
              width="33%"
              height='80px'
              ml='1px'
              mr='2px'
            >
              <Flex flexDirection="column">
                <Text fontSize='17px' textAlign='left' bold marginLeft='10px' marginTop='2px'>
                  Staking
                </Text>
                <Flex flexDirection="row" alignItems='center' justifyContent='center'>
                  {renderSupplySReq()}
                </Flex>
              </Flex>
            </HeaderBox>
            <HeaderBox
              btl='3px'
              btr='3px'
              bbl='3px'
              bbr='3px'
              width="33%"
              height='80px'
              ml='1px'
              mr='2px'
            >
              <Flex flexDirection="column">
                <Text fontSize='17px' textAlign='left' bold marginLeft='10px' marginTop='2px'>
                  Governance
                </Text>
                <Flex flexDirection="row" alignItems='center' justifyContent='center'>
                  {renderSupplyGReq()}
                </Flex>
              </Flex>
            </HeaderBox>
            <HeaderBox
              btl='3px'
              btr='16px'
              bbl='3px'
              bbr='16px'
              width="33%"
              height='80px'
              ml='1px'
              mr='2px'
            >
              <Flex flexDirection="column">
                <Text fontSize='17px' textAlign='left' bold marginLeft='10px' marginTop='2px'>
                  Your Bond Terms
                </Text>
                <Flex flexDirection="row" alignItems='center' justifyContent='center'>
                  {renderTerms()}
                </Flex>
              </Flex>
            </HeaderBox>
          </Row>
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
