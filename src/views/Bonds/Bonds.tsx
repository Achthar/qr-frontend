import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react'
import { Route, useRouteMatch, useLocation, NavLink } from 'react-router-dom'
import BigNumber from 'bignumber.js'
import { useWeb3React } from '@web3-react/core'
import { Image, Heading, RowType, Toggle, Text, Button, ArrowForwardIcon, Flex } from '@requiemswap/uikit'
import { ChainId } from '@requiemswap/sdk'
import styled from 'styled-components'
import FlexLayout from 'components/Layout/Flex'
import Page from 'components/Layout/Page'
import tokens, { getSerializedToken } from 'config/constants/tokens'
import { useBonds, usePollBondsWithUserData, usePriceReqtUsd, usePollBondsPublicData } from 'state/bonds/hooks'
import usePersistState from 'hooks/usePersistState'
import { Bond } from 'state/types'
import { useTranslation } from 'contexts/Localization'
import { getBalanceNumber } from 'utils/formatBalance'
import { getBondApr } from 'utils/apr'
import { chain, orderBy } from 'lodash'
import isArchivedPid from 'utils/bondHelpers'
import { blocksToDays } from 'config'
import { serializeToken } from 'state/user/hooks/helpers'
import { latinise } from 'utils/latinise'
import useDebounce from 'hooks/useDebounce'
import PageHeader from 'components/PageHeader'
import SearchInput from 'components/SearchInput'
import Select, { OptionProps } from 'components/Select/Select'
import Loading from 'components/Loading'
// import { BigNumber } from 'ethers'
import { useAppDispatch } from 'state'
import useRefresh from 'hooks/useRefresh'
import { calcSingleBondDetails } from 'state/bonds/calcSingleBondDetails'
import BondCard, { BondWithStakedValue } from './components/BondCard/BondCard'
import Table from './components/BondTable/BondTable'
import BondTabButtons from './components/BondTabButtons'
import { RowProps } from './components/BondTable/Row'
import ToggleView from './components/ToggleView/ToggleView'
import { DesktopColumnSchema, ViewMode } from './components/types'

import fetchPublicBondData from '../../state/bonds/fetchPublicBondData'
import { calculateUserBondDetails, fetchBondsPublicDataAsync, fetchBondUserDataAsync } from '../../state/bonds/index'





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

const Bonds: React.FC = () => {
  const { path } = useRouteMatch()
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const { data: bondsLP, userDataLoaded } = useBonds()

  const [query, setQuery] = useState('')
  // const [viewMode, setViewMode] = usePersistState(ViewMode.TABLE, { localStorageKey: 'requiem_bond_view' })
  const { account, chainId, library } = useWeb3React()
  const reqtPrice = usePriceReqtUsd(chainId)
  const [sortOption, setSortOption] = useState('hot')
  const chosenBondsLength = useRef(0)

  const isArchived = pathname.includes('archived')
  const isInactive = pathname.includes('history')
  const isActive = !isInactive && !isArchived

  console.log("PRICE", reqtPrice.toString())

  usePollBondsWithUserData(chainId, isArchived)

  // Users with no wallet connected should see 0 as Earned amount
  // Connected users should see loading indicator until first userData has loaded
  const userDataReady = !account || (!!account && userDataLoaded)

  // const [stakedOnly, setStakedOnly] = useUserBondStakedOnly(isActive)

  const activeBonds = bondsLP // .filter((bond) => bond.bondId !== 0 && !isArchivedPid(bond.bondId))
  const inactiveBonds = bondsLP.filter((bond) => bond.bondId !== 0 && !isArchivedPid(bond.bondId))
  const archivedBonds = bondsLP.filter((bond) => isArchivedPid(bond.bondId))

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
          ? getBondApr(new BigNumber(bond.poolWeight), reqtPrice, totalLiquidity, bond.reserveAddress[chainId])
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
    [reqtPrice, query, isActive, chainId],
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
        // case 'multiplier':
        //   return orderBy(
        //     bonds,
        //     (bond: BondWithStakedValue) => (bond.multiplier ? Number(bond.multiplier.slice(0, -1)) : 0),
        //     'desc',
        //   )
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

  // workaround useEffect in hooks not working
  // useEffect(() => { dispatch(fetchBondsPublicDataAsync()) }, [dispatch])

  const calcDebounce = useDebounce('1', 100)

  useEffect(() => {
    bondsLP.map(
      (bond) => {
        dispatch(calcSingleBondDetails({ bond,  provider: library, chainId }))
        if (account) {
          dispatch(calculateUserBondDetails({ address: account, bond, chainId, provider: library }))
        }
        return 0
      }
    )
  },
    [calcDebounce, dispatch, bondsLP, chainId, library, account]
  )
  // console.log("BAM")
  const { bondData } = useBonds()
  console.log("BDATA", bondData)
  chosenBondsLength.current = chosenBondsMemoized.length

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
    // console.log("TERM", (1 + bond.bondDiscount), (365 / blocksToDays(bond.vestingTerm, chainId)))
    // const { token, quoteToken } = bond

    // const token = getSerializedToken(chainId, tokens.reqt)
    // const quoteToken = getSerializedToken(chainId, tokens.tusd)

    // const tokenAddress = token.address
    // const quoteTokenAddress = quoteToken.address

    const lpLabel = bond.name && bond.name.split(' ')[0].toUpperCase().replace('REQUIEM', '')
    const price = Number(bond.bondPrice)
    const purchased = Math.round(bond.purchased * 100) / 100 // 7002000

    const row: RowProps = {
      // apr: {
      //   value: getDisplayApr(bond.apr, bond.lpRewardsApr),
      //   bondId: bond.bondId,
      //   // multiplier: bond.multiplier,
      //   lpLabel,
      //   tokenAddress,
      //   quoteTokenAddress,
      //   reqtPrice,
      //   originalValue: bond.apr,
      // },
      bond: {
        label: bond.name,
        bondId: bond.bondId,
        token: bond.token,
        quoteToken: bond.quoteToken
      },
      discount: bond.bondDiscount,
      // earned: {
      //   earnings: getBalanceNumber(new BigNumber(bond.userData.earnings)),
      //   bondId: bond.bondId,
      // },
      // multiplier: {
      //   multiplier: '12x',
      // },
      details: bond,
      price: Math.round(price * 1000) / 1000,
      term: blocksToDays(bond.vestingTerm ?? 0, chainId),
      roi: {
        value: String(Math.round(((1 + bond.bondDiscount / blocksToDays(bond.vestingTerm, chainId)) ** (365 / blocksToDays(bond.vestingTerm, chainId)) - 1) * 100) / 100),
        bondId: 1,
        lpLabel: 'string',
        reqtPrice: new BigNumber(1),
        originalValue: 3

      },
      purchased
    }

    return row
  })

  const renderContent = (): JSX.Element => {
    // if (
    // viewMode === ViewMode.TABLE && 
    // rowData.length > 0) {
    const columnSchema = DesktopColumnSchema

    const columns = columnSchema.map((column) => ({
      id: column.id,
      name: column.name,
      label: column.label,
      sort: (a: RowType<RowProps>, b: RowType<RowProps>) => {
        switch (column.name) {
          case 'bond':
            return b.id - a.id
          // case 'apr':
          //   if (a.original.apr.value && b.original.apr.value) {
          //     return Number(a.original.apr.value) - Number(b.original.apr.value)
          //   }

          //   return 0
          // case 'earned':
          //   return a.original.earned.earnings - b.original.earned.earnings
          default:
            return 1
        }
      },
      sortable: column.sortable,
    }))

    return <Table data={rowData} columns={columns} userDataReady={userDataReady} />
    // }

    // return (
    //   <FlexLayout>
    //     <Route exact path={`${path}`}>
    //       {chosenBondsMemoized.map((bond) => (
    //         <BondCard
    //           key={bond.bondId}
    //           bond={bond}
    //           displayApr={getDisplayApr(bond.apr, bond.lpRewardsApr)}
    //           reqtPrice={reqtPrice}
    //           account={account}
    //           removed={false}
    //         />
    //       ))}
    //     </Route>
    //     <Route exact path={`${path}/history`}>
    //       {chosenBondsMemoized.map((bond) => (
    //         <BondCard
    //           key={bond.bondId}
    //           bond={bond}
    //           displayApr={getDisplayApr(bond.apr, bond.lpRewardsApr)}
    //           reqtPrice={reqtPrice}
    //           account={account}
    //           removed
    //         />
    //       ))}
    //     </Route>
    //     <Route exact path={`${path}/archived`}>
    //       {chosenBondsMemoized.map((bond) => (
    //         <BondCard
    //           key={bond.bondId}
    //           bond={bond}
    //           displayApr={getDisplayApr(bond.apr, bond.lpRewardsApr)}
    //           reqtPrice={reqtPrice}
    //           account={account}
    //           removed
    //         />
    //       ))}
    //     </Route>
    //   </FlexLayout>
    // )
  }

  const handleSortOptionChange = (option: OptionProps): void => {
    setSortOption(option.value)
  }

  return (
    <>
      {/* <PageHeader>
        <Heading as="h1" scale="xxl" color="secondary" mb="24px">
          {t('Bonds')}
        </Heading>
        <Heading scale="lg" color="text">
          {t('Stake LP tokens to earn.')}
        </Heading>
        <NavLink exact activeClassName="active" to="/bonds/auction" id="lottery-pot-banner">
          <Button p="0" variant="text">
            <Text color="primary" bold fontSize="16px" mr="4px">
              {t('Community Auctions')}
            </Text>
            <ArrowForwardIcon color="primary" />
          </Button>
        </NavLink>
      </PageHeader> */}
      <Page>
        {/* <ControlContainer> */}
        {/* <ViewControls> */}
        {/* <ToggleView viewMode={viewMode} onToggle={(mode: ViewMode) => setViewMode(mode)} /> */}
        {/* <ToggleWrapper>
              <Toggle checked={stakedOnly} onChange={() => setStakedOnly(!stakedOnly)} scale="sm" />
              <Text> {t('Staked only')}</Text>
            </ToggleWrapper>
            <BondTabButtons hasStakeInFinishedBonds={stakedInactiveBonds.length > 0} /> */}
        {/* </ViewControls> */}
        {/* <FilterContainer>
            <LabelWrapper>
              <Text textTransform="uppercase">{t('Sort by')}</Text>
              <Select
                options={[
                  {
                    label: t('Hot'),
                    value: 'hot',
                  },
                  {
                    label: t('APR'),
                    value: 'apr',
                  },
                  {
                    label: t('Multiplier'),
                    value: 'multiplier',
                  },
                  {
                    label: t('Earned'),
                    value: 'earned',
                  },
                  {
                    label: t('Liquidity'),
                    value: 'liquidity',
                  },
                ]}
                onChange={handleSortOptionChange}
              />
            </LabelWrapper>
            <LabelWrapper style={{ marginLeft: 16 }}>
              <Text textTransform="uppercase">{t('Search')}</Text>
              <SearchInput onChange={handleChangeQuery} placeholder="Search Bonds" />
            </LabelWrapper>
          </FilterContainer> */}
        {/* </ControlContainer> */}
        {renderContent()}
        {account && !userDataLoaded && (
          <Flex justifyContent="center">
            <Loading />
          </Flex>
        )}
        <div ref={loadMoreRef} />
        {/* <StyledImage src="/images/decorations/3dpan.png" alt="Panreqt illustration" width={120} height={103} /> */}
      </Page>
    </>
  )
}

export default Bonds
