import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { Currency, TokenAmount, NETWORK_CCY, STABLECOINS, AmplifiedWeightedPair, ZERO } from '@requiemswap/sdk'
import { Button, ChevronDownIcon, Text, AddIcon, useModal } from '@requiemswap/uikit'
import styled from 'styled-components'
import { useTranslation } from 'contexts/Localization'
import getChain from 'utils/getChain'
import { serializeToken } from 'state/user/hooks/helpers'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { setMetdataLoaded } from 'state/weightedPairs/actions'
import { RouteComponentProps } from 'react-router-dom'
import { useAddPair, useGetWeightedPairsState, useTokenPair } from 'hooks/useGetWeightedPairsState'
import useRefresh from 'hooks/useRefresh'
import { useAppDispatch } from 'state'
import { MinimalWeightedPositionCardExtended } from 'components/PositionCard/WeightedPairPositionExtended'
import { LightCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Layout/Column'
import { CurrencyLogo } from '../../components/Logo'
import Row from '../../components/Layout/Row'
import CurrencySearchModal from '../../components/SearchModal/CurrencySearchModal'
import useActiveWeb3React from '../../hooks/useActiveWeb3React'
import { useSerializedPairAdder, useWeightedPairAdder } from '../../state/user/hooks'
import StyledInternalLink from '../../components/Links'
import { currencyId } from '../../utils/currencyId'
import Dots from '../../components/Loader/Dots'
import { AppHeader, AppBody } from '../../components/App'
import Page from '../Page'


enum Fields {
  TOKEN0 = 0,
  TOKEN1 = 1,
  WEIGHT0 = 2,
  FEE = 3
}

const StyledButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.input};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: none;
  border-radius: 16px;
`


export default function WeightedPairFinder({
  history,
  match: {
    params: { chain },
  },
}: RouteComponentProps<{ chain: string }>) {
  const { account, chainId } = useActiveWeb3React()

  useEffect(() => {
    const _chain = chain ?? getChain(chainId)
    history.push(`/${_chain}/find`)

  },
    [chain, chainId, history],
  )



  const { t } = useTranslation()
  const { slowRefresh } = useRefresh()
  const [activeField, setActiveField] = useState<number>(Fields.TOKEN1)

  const [currency0, setCurrency0] = useState<Currency | null>(NETWORK_CCY[chainId])
  const [currency1, setCurrency1] = useState<Currency | null>(STABLECOINS[chainId][0])

  useEffect(() => {
    setCurrency0(NETWORK_CCY[chainId])
    setCurrency1(STABLECOINS[chainId][0])
  }, [chainId])


  const tA = wrappedCurrency(currency0, chainId)
  const tB = wrappedCurrency(currency1, chainId)

  const tokenPair = useTokenPair(tA, tB, chainId)
  const dispatch = useAppDispatch()
  const { pairs, userBalancesLoaded, reservesAndWeightsLoaded, balances, metaDataLoaded, totalSupply } = useGetWeightedPairsState(chainId, account, [tokenPair], slowRefresh, slowRefresh)

  // check all standard pairs first
  const pairsAvailable = useMemo(() => pairs.filter(
    pair => pair.token0.address === tokenPair.token0.address
      && pair.token1.address === tokenPair.token1.address),
    [pairs, tokenPair])

  // use this to set a flag whether pair data has been loaded
  const [pairChecked, setPairChecked] = useState(false)

  // if pair is not checked, add it to the token pair query and set metaDataLoaded flag to false
  useEffect(() => {
    if (!pairChecked && pairsAvailable.length === 0) {
      dispatch(setMetdataLoaded())
      setPairChecked(true)
    }
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pairChecked, pairsAvailable.length, tokenPair]
  )

  const addPair = useSerializedPairAdder()

  // if pairsAvailable changes, add the pair to user Pairs
  useEffect(() => {
    if (pairsAvailable.length > 0) {
      addPair({ token0: serializeToken(pairsAvailable[0].token0), token1: serializeToken(pairsAvailable[0].token1) })
    }
  }, [pairsAvailable, addPair])


  const dataWithUserBalances: { pair: AmplifiedWeightedPair, balance: TokenAmount, totalSupply: TokenAmount }[] = useMemo(
    () =>
      pairs.map((pair, index) => { return { pair, balance: balances[index], totalSupply: totalSupply[index] } })
        .filter(data => data.pair.token0.address === tokenPair.token0.address && data.pair.token1.address === tokenPair.token1.address).filter((data) =>
          data.balance?.greaterThan('0'),
        ),
    [pairs, balances, totalSupply, tokenPair],
  )

  const lpWithUserBalances = useMemo(
    () =>
      pairsAvailable.filter((_, index) =>
        balances[index]?.greaterThan('0'),
      ),
    [pairsAvailable, balances],
  )

  const weightedIsLoading = !metaDataLoaded || !reservesAndWeightsLoaded || !userBalancesLoaded

  const allWeightedPairsWithLiquidity = lpWithUserBalances.filter((pair): pair is AmplifiedWeightedPair => Boolean(pair))

  const allWeightedDataWithLiquidity = dataWithUserBalances.filter((data) => Boolean(data.pair))

  const validPairNoLiquidity: boolean =
    pairsAvailable.length > 0 && allWeightedDataWithLiquidity.length === 0


  const position = dataWithUserBalances[0]?.balance
  const hasPosition = Boolean(position && position.raw.gt(ZERO))

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      if (activeField === Fields.TOKEN0) {
        setCurrency0(currency)
      } else {
        setCurrency1(currency)
      }
    },
    [activeField],
  )

  const prerequisiteMessage = (
    <LightCard padding="45px 10px">
      <Text textAlign="center">
        {!account ? t('Connect to a wallet to find pools') : t('Select a token to find your liquidity.')}
      </Text>
    </LightCard>
  )

  const [onPresentCurrencyModal] = useModal(
    <CurrencySearchModal
      account={account}
      chainId={chainId}
      onCurrencySelect={(ccy: Currency) => {
        handleCurrencySelect(ccy)
        setPairChecked(false) // set check to false
      }}
      showCommonBases
      selectedCurrency={(activeField === Fields.TOKEN0 ? currency1 : currency0) ?? undefined}
    />,
    true,
    true,
    'selectCurrencyModal',
  )

  const aIs0 = tA && tB && tA?.sortsBefore(tB ?? undefined)

  return (
    <Page>
      <AppBody>
        <AppHeader
          chainId={chainId}
          account={account}
          title={t('Import Pool')}
          subtitle={t('Import an existing pool')}
          backTo="/pool" />
        <AutoColumn style={{ padding: '1rem' }} gap="md">
          <StyledButton
            endIcon={<ChevronDownIcon />}
            onClick={() => {
              onPresentCurrencyModal()
              setActiveField(Fields.TOKEN0)
            }}
          >
            {currency0 ? (
              <Row>
                <CurrencyLogo chainId={chainId} currency={currency0} />
                <Text ml="8px">{currency0.symbol}</Text>
              </Row>
            ) : (
              <Text ml="8px">{t('Select a Token')}</Text>
            )}
          </StyledButton>

          <ColumnCenter>
            <AddIcon />
          </ColumnCenter>
          <StyledButton
            endIcon={<ChevronDownIcon />}
            onClick={() => {
              onPresentCurrencyModal()
              setActiveField(Fields.TOKEN1)
            }}
          >
            {currency1 ? (
              <Row>
                <CurrencyLogo chainId={chainId} currency={currency1} />
                <Text ml="8px">{currency1.symbol}</Text>
              </Row>
            ) : (
              <Text as={Row}>{t('Select a Token')}</Text>
            )}
          </StyledButton>
          {hasPosition && (
            <ColumnCenter
              style={{ justifyItems: 'center', backgroundColor: '', padding: '12px 0px', borderRadius: '12px' }}
            >
              <Text textAlign="center">{t('Pools Found!')}</Text>
              <StyledInternalLink to={`/${getChain(chainId)}/liquidity`}>
                <Text textAlign="center">{t('Manage these pools.')}</Text>
              </StyledInternalLink>
            </ColumnCenter>
          )}

          {currency0 && currency1 ? (
            pairsAvailable.length > 0 ? (
              hasPosition ? dataWithUserBalances.map((pairData) => (
                <MinimalWeightedPositionCardExtended weightedPair={pairData.pair} totalSupply={pairData.totalSupply} userBalance={pairData.balance} showUnwrapped={false} />
              )
              )
                : (
                  <LightCard padding="45px 10px">
                    <AutoColumn gap="sm" justify="center">
                      <Text textAlign="center">{t('You don’t have liquidity in this pool yet.')}</Text>
                      <StyledInternalLink to={`/add/50-${currencyId(chainId, currency0)}/50-${currencyId(chainId, currency1)}/25`}>
                        <Text textAlign="center">{t('Add Liquidity')}</Text>
                      </StyledInternalLink>
                    </AutoColumn>
                  </LightCard>
                )
            ) : validPairNoLiquidity ? (
              <LightCard padding="45px 10px">
                <AutoColumn gap="sm" justify="center">
                  <Text textAlign="center">{t('No pool found.')}</Text>
                  <StyledInternalLink to={`/add/50-${currencyId(chainId, currency0)}/50-${currencyId(chainId, currency1)}/25`}>
                    {t('Create pool.')}
                  </StyledInternalLink>
                </AutoColumn>
              </LightCard>
            ) : tokenPair?.token0.address === tokenPair?.token1.address ? (
              <LightCard padding="45px 10px">
                <AutoColumn gap="sm" justify="center">
                  <Text textAlign="center" fontWeight={500}>
                    {t('Invalid pair.')}
                  </Text>
                </AutoColumn>
              </LightCard>
            ) : weightedIsLoading ? (
              <LightCard padding="45px 10px">
                <AutoColumn gap="sm" justify="center">
                  <Text textAlign="center">
                    {t('Loading')}
                    <Dots />
                  </Text>
                </AutoColumn>
              </LightCard>
            ) : null
          ) : (
            prerequisiteMessage
          )}
        </AutoColumn>
      </AppBody>
    </Page >
  )
}
