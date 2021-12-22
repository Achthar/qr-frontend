import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { Currency, JSBI, TokenAmount, NETWORK_CCY, Token, WeightedPair, STABLECOINS } from '@requiemswap/sdk'
import { Button, ChevronDownIcon, Text, AddIcon, useModal, Flex, ArrowUpIcon, Box } from '@requiemswap/uikit'
import styled from 'styled-components'
import { useTranslation } from 'contexts/Localization'
import PercentageInputPanel from 'components/CurrencyInputPanel/PercentageInputPanel'
import BpsInputPanel from 'components/CurrencyInputPanel/BpsInputPanel'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { STANDARD_FEES, STANDARD_WEIGHTS } from 'config/constants'
import { LightCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Layout/Column'
import { CurrencyLogo } from '../../components/Logo'
import { MinimalWeightedPositionCard } from '../../components/PositionCard/WeightedPairPosition'
import Row from '../../components/Layout/Row'
import CurrencySearchModal from '../../components/SearchModal/CurrencySearchModal'
import { WeightedPairState, useWeightedPair, useWeightedPairsExist, useGetWeightedPairs, useWeightedPairsDataLite } from '../../hooks/useWeightedPairs'
import useActiveWeb3React from '../../hooks/useActiveWeb3React'
import { useWeightedPairAdder } from '../../state/user/hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import StyledInternalLink from '../../components/Links'
import { currencyId } from '../../utils/currencyId'
import { weightedPairAddresses } from '../../utils/weightedPairAddresses'
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
  width: 80%;
  align: right;
`


export default function WeightedPairFinder() {
  const { account, chainId } = useActiveWeb3React()
  const { t } = useTranslation()

  const [activeField, setActiveField] = useState<number>(Fields.TOKEN1)

  const [fee, setFee] = useState<number>(20)
  const [weight0, setWeight0] = useState<number>(50)
  const [currency0, setCurrency0] = useState<Currency | null>(NETWORK_CCY[chainId])
  const [currency1, setCurrency1] = useState<Currency | null>(STABLECOINS[chainId][0])


  const addressesRaw = useGetWeightedPairs([[currency0, currency1]], chainId)

  const validatedAddresses = useMemo(
    () =>
      addressesRaw ? addressesRaw.filter(x => x[0] === WeightedPairState.EXISTS).map((data) => data[1]) : [],
    [addressesRaw]
  )

  const tA = wrappedCurrency(currency0, chainId)
  const tB = wrappedCurrency(currency1, chainId)

  const weightedPairsAvailable = useWeightedPairsDataLite([[tA, tB]], validatedAddresses?.[0], chainId, 20)

  const [pairState, pair] = useWeightedPair(currency0 ?? undefined, currency1 ?? undefined, weight0, fee)
  const addPair = useWeightedPairAdder()

  useEffect(() => {
    if (pair) {
      addPair(pair)
    }
  }, [pair, addPair])

  const validPairNoLiquidity: boolean =
    pairState === WeightedPairState.NOT_EXISTS ||
    Boolean(
      pairState === WeightedPairState.EXISTS &&
      pair &&
      JSBI.equal(pair.reserve0.raw, JSBI.BigInt(0)) &&
      JSBI.equal(pair.reserve1.raw, JSBI.BigInt(0)),
    )

  const position: TokenAmount | undefined = useTokenBalance(chainId, account ?? undefined, pair?.liquidityToken)
  const hasPosition = Boolean(position && JSBI.greaterThan(position.raw, JSBI.BigInt(0)))

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
      chainId={chainId}
      onCurrencySelect={handleCurrencySelect}
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
          <Flex flexDirection="row" justifyContent='space-between' alignItems="center" grid-row-gap='10px'>
            <PercentageInputPanel
              width='10px'
              borderRadius='13px'
              value={String(weight0)}
              onUserInput={value => setWeight0(Number(value))}
              label='Weight'
              id='feePanel'
            />

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
          </Flex>
          <ColumnCenter>
            <Flex flexDirection="row" justifyContent='space-between' alignItems="center" grid-row-gap='10px'>
              <AddIcon />

              <BpsInputPanel
                width='20px'
                borderRadius='16px'
                value={String(fee)}
                onUserInput={value => setFee(Number(value))}
                label='fee'
                id='feePanel'
              />
            </Flex>
          </ColumnCenter>


          <Flex flexDirection="row" justifyContent='space-between' alignItems="center" grid-row-gap='10px'>
            <PercentageInputPanel
              width='10px'
              borderRadius='16px'
              value={String(100 - weight0)}
              onUserInput={value => null}
              label='Weight'
              id='weightPanel2'
            />
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
          </Flex>
          {hasPosition && (
            <ColumnCenter
              style={{ justifyItems: 'center', backgroundColor: '', padding: '12px 0px', borderRadius: '12px' }}
            >
              <Text textAlign="center">{t('Pool Found!')}</Text>
              <StyledInternalLink to="/pool">
                <Text textAlign="center">{t('Manage this pool.')}</Text>
              </StyledInternalLink>
            </ColumnCenter>
          )}

          {currency0 && currency1 ? (
            pairState === WeightedPairState.EXISTS ? (
              hasPosition && pair ? (
                <MinimalWeightedPositionCard weightedPair={pair} />
              ) : (
                <LightCard padding="45px 10px">
                  <AutoColumn gap="sm" justify="center">
                    <Text textAlign="center">{t('You don’t have liquidity in this pool yet.')}</Text>
                    <StyledInternalLink to={`/add/${currencyId(chainId, currency0)}/${currencyId(chainId, currency1)}`}>
                      <Text textAlign="center">{t('Add Liquidity')}</Text>
                    </StyledInternalLink>
                  </AutoColumn>
                </LightCard>
              )
            ) : validPairNoLiquidity ? (
              <LightCard padding="45px 10px">
                <AutoColumn gap="sm" justify="center">
                  <Text textAlign="center">{t('No pool found.')}</Text>
                  <StyledInternalLink to={`/add/${currencyId(chainId, currency0)}/${currencyId(chainId, currency1)}`}>
                    {t('Create pool.')}
                  </StyledInternalLink>
                </AutoColumn>
              </LightCard>
            ) : pairState === WeightedPairState.INVALID ? (
              <LightCard padding="45px 10px">
                <AutoColumn gap="sm" justify="center">
                  <Text textAlign="center" fontWeight={500}>
                    {t('Invalid pair.')}
                  </Text>
                </AutoColumn>
              </LightCard>
            ) : pairState === WeightedPairState.LOADING ? (
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

          {weightedPairsAvailable.length > 0 && (
            <Box>
              <AutoColumn gap="sm" justify="center">
                <Text bold fontSize='15px'>
                  Available constellations
                </Text>
                {weightedPairsAvailable.map((pairData) => (

                  pairData[0] === WeightedPairState.EXISTS && (
                    <Flex flexDirection="row" justifyContent='space-between' alignItems="center" grid-row-gap='10px' marginRight='5px' marginLeft='5px'>
                      <AutoColumn>
                        <Text fontSize='13px' width='100px'>
                          {`${currency0.symbol} ${aIs0 ? pairData[1].weight0.toString() : pairData[1].weight1.toString()}%`}
                        </Text>
                        <Text fontSize='13px' width='100px'>
                          {`${currency1.symbol} ${aIs0 ? pairData[1].weight1.toString() : pairData[1].weight0.toString()}%`}
                        </Text>
                      </AutoColumn>
                      <Text fontSize='13px' width='30px' marginLeft='20px' marginRight='20px'>
                        {`Fee ${pairData[1].fee0.toString()}Bps`}
                      </Text>
                      <StyledButton
                        height='20px'
                        endIcon={<ArrowUpIcon />}
                        onClick={() => {
                          setFee(Number(pairData[1].fee0.toString()))
                          setWeight0(aIs0 ? Number(pairData[1].weight0.toString()) : Number(pairData[1].weight1.toString()))
                        }}
                      >
                        <Text fontSize='15px'>
                          Set
                        </Text>
                      </StyledButton>
                    </Flex>)
                ))}
              </AutoColumn>
            </Box>
          )}
        </AutoColumn>
      </AppBody>
    </Page >
  )
}
