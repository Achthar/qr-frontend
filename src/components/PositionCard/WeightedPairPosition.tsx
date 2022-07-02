import React, { useState } from 'react'
import { AmplifiedWeightedPair, Percent } from '@requiemswap/sdk'
import {
  Button,
  Text,
  ChevronUpIcon,
  ChevronDownIcon,
  Card,
  CardBody,
  Flex,
  CardProps,
  AddIcon,
} from '@requiemswap/uikit'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useTranslation } from 'contexts/Localization'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import getChain from 'utils/getChain'

import { useBurnActionHandlers } from 'state/burn/hooks'
import useTotalSupply from '../../hooks/useTotalSupply'

import { useTokenBalance } from '../../state/wallet/hooks'
import { currencyId } from '../../utils/currencyId'
import { unwrappedToken } from '../../utils/wrappedCurrency'

import { LightCard } from '../Card'
import { AutoColumn } from '../Layout/Column'
import CurrencyLogo from '../Logo/CurrencyLogo'
import { DoubleCurrencyLogo } from '../Logo'
import { RowBetween, RowFixed } from '../Layout/Row'
import { BIG_INT_ZERO } from '../../config/constants'
import Dots from '../Loader/Dots'

const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`

interface WeightedPositionCardProps extends CardProps {
  weightedPair: AmplifiedWeightedPair
  showUnwrapped?: boolean
}

export function MinimalWeightedPositionCard({ weightedPair, showUnwrapped = false }: WeightedPositionCardProps) {
  const { account, chainId } = useActiveWeb3React()

  const { t } = useTranslation()


  const currency0 = showUnwrapped ? weightedPair.token0 : unwrappedToken(weightedPair.token0)
  const currency1 = showUnwrapped ? weightedPair.token1 : unwrappedToken(weightedPair.token1)

  const [showMore, setShowMore] = useState(false)

  const userPoolBalance = useTokenBalance(chainId, account ?? undefined, weightedPair.liquidityToken)
  const totalPoolTokens = useTotalSupply(weightedPair.liquidityToken)

  const poolTokenPercentage =
    !!userPoolBalance && !!totalPoolTokens && totalPoolTokens.raw.gte(userPoolBalance.raw)
      ? new Percent(userPoolBalance.raw, totalPoolTokens.raw)
      : undefined

  const [token0Deposited, token1Deposited] =
    !!weightedPair &&
      !!totalPoolTokens &&
      !!userPoolBalance &&
      // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
      totalPoolTokens.raw.gte(userPoolBalance.raw)
      ? [
        weightedPair.getLiquidityValue(weightedPair.token0, totalPoolTokens, userPoolBalance, false),
        weightedPair.getLiquidityValue(weightedPair.token1, totalPoolTokens, userPoolBalance, false),
      ]
      : [undefined, undefined]

  return (
    <>
      {userPoolBalance && userPoolBalance.raw.gt(0) ? (
        <Card>
          <CardBody>
            <AutoColumn gap="16px">
              <FixedHeightRow>
                <RowFixed>
                  <Text color="secondary" bold>
                    {t('LP tokens in your wallet')}
                  </Text>
                </RowFixed>
              </FixedHeightRow>
              <FixedHeightRow onClick={() => setShowMore(!showMore)}>
                <RowFixed>
                  <DoubleCurrencyLogo chainId={chainId} currency0={currency0} currency1={currency1} margin size={20} />
                  <Text small color="textSubtle">
                    {currency0.symbol}-{currency1.symbol} LP
                  </Text>
                </RowFixed>
                <RowFixed>
                  <Text>{userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}</Text>
                </RowFixed>
              </FixedHeightRow>
              <AutoColumn gap="4px">
                <FixedHeightRow>
                  <Text color="textSubtle" small>
                    {t('Share of Pool')}:
                  </Text>
                  <Text>{poolTokenPercentage ? `${poolTokenPercentage.toFixed(6)}%` : '-'}</Text>
                </FixedHeightRow>
                <FixedHeightRow>
                  <Text color="textSubtle" small>
                    {t('Pooled %asset%', { asset: currency0.symbol })}:
                  </Text>
                  {token0Deposited ? (
                    <RowFixed>
                      <Text ml="6px">{token0Deposited?.toSignificant(6)}</Text>
                    </RowFixed>
                  ) : (
                    '-'
                  )}
                </FixedHeightRow>
                <FixedHeightRow>
                  <Text color="textSubtle" small>
                    {t('Pooled %asset%', { asset: currency1.symbol })}:
                  </Text>
                  {token1Deposited ? (
                    <RowFixed>
                      <Text ml="6px">{token1Deposited?.toSignificant(6)}</Text>
                    </RowFixed>
                  ) : (
                    '-'
                  )}
                </FixedHeightRow>
              </AutoColumn>
            </AutoColumn>
          </CardBody>
        </Card>
      ) : (
        <LightCard>
          <Text fontSize="14px" style={{ textAlign: 'center' }}>
            <span role="img" aria-label="pancake-icon" />
            {t(
              "By adding liquidity you'll earn a fee on all trades on this weightedPair proportional to your share of the pool. Fees are added to the pool, accrue in real time and can be claimed by withdrawing your liquidity.",
            )}
          </Text>
        </LightCard>
      )}
    </>
  )
}

export default function FullWeightedPositionCard({ weightedPair, ...props }: WeightedPositionCardProps) {
  const { account, chainId } = useActiveWeb3React()

  const currency0 = unwrappedToken(weightedPair.token0)
  const currency1 = unwrappedToken(weightedPair.token1)
  const { onSetFee, onSetWeightA } = useBurnActionHandlers()


  const chain = getChain(chainId)

  const [showMore, setShowMore] = useState(false)

  const userPoolBalance = useTokenBalance(chainId, account ?? undefined, weightedPair.liquidityToken)
  const totalPoolTokens = useTotalSupply(weightedPair.liquidityToken)

  const poolTokenPercentage =
    !!userPoolBalance && !!totalPoolTokens && totalPoolTokens.raw.gte(userPoolBalance.raw)
      ? new Percent(userPoolBalance.raw, totalPoolTokens.raw)
      : undefined

  const [token0Deposited, token1Deposited] =
    !!weightedPair &&
      !!totalPoolTokens &&
      !!userPoolBalance &&
      // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
      totalPoolTokens.raw.gte(userPoolBalance.raw)
      ? [
        weightedPair.getLiquidityValue(weightedPair.token0, totalPoolTokens, userPoolBalance, false),
        weightedPair.getLiquidityValue(weightedPair.token1, totalPoolTokens, userPoolBalance, false),
      ]
      : [undefined, undefined]

  return (
    <Card style={{ borderRadius: '12px' }} {...props}>
      <Flex justifyContent="space-between" role="button" onClick={() => setShowMore(!showMore)} p="16px">
        <Flex flexDirection="column">
          <Flex alignItems="center" mb="4px">
            <DoubleCurrencyLogo chainId={chainId} currency0={currency0} currency1={currency1} size={20} />
            <Text bold ml="16px">
              {!currency0 || !currency1 ? <Dots>Loading</Dots> : `${weightedPair.weight0}% ${currency0.symbol} + ${weightedPair?.weight1}% ${currency1.symbol} @ ${weightedPair.fee0.toString()}bps Fee`}
            </Text>
          </Flex>
          <Text fontSize="14px" color="textSubtle">
            {userPoolBalance?.toSignificant(4)}
          </Text>
        </Flex>
        {showMore ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </Flex>

      {showMore && (
        <AutoColumn gap="8px" style={{ padding: '16px' }}>
          <FixedHeightRow>
            <RowFixed>
              <CurrencyLogo chainId={chainId} size="20px" currency={currency0} />
              <Text color="textSubtle" ml="4px">
                Pooled {currency0.symbol}
              </Text>
            </RowFixed>
            {token0Deposited ? (
              <RowFixed>
                <Text ml="6px">{token0Deposited?.toSignificant(6)}</Text>
              </RowFixed>
            ) : (
              '-'
            )}
          </FixedHeightRow>

          <FixedHeightRow>
            <RowFixed>
              <CurrencyLogo chainId={chainId} size="20px" currency={currency1} />
              <Text color="textSubtle" ml="4px">
                Pooled {currency1.symbol}
              </Text>
            </RowFixed>
            {token1Deposited ? (
              <RowFixed>
                <Text ml="6px">{token1Deposited?.toSignificant(6)}</Text>
              </RowFixed>
            ) : (
              '-'
            )}
          </FixedHeightRow>

          <FixedHeightRow>
            <Text color="textSubtle">Share of pool</Text>
            <Text>
              {poolTokenPercentage
                ? `${poolTokenPercentage.toFixed(2) === '0.00' ? '<0.01' : poolTokenPercentage.toFixed(2)}%`
                : '-'}
            </Text>
          </FixedHeightRow>

          {userPoolBalance && userPoolBalance.raw.gt(0) && (
            <Flex flexDirection="column">
              <Button
                as={Link}
                to={`/${chain}/remove/${weightedPair.weight0}-${currencyId(chainId, currency0)}/${weightedPair.weight1}-${currencyId(chainId, currency1)}/${weightedPair.fee0}`}
                variant="primary"
                width="100%"
                mb="8px"
              >
                Remove
              </Button>
              <Button
                as={Link}
                // onClick={()=>{
                //   onSetFee(weightedPair?.fee0.toString())
                //   onSetWeightA(weightedPair?.weight0.toString())
                // }}
                to={`/${chain}/add/${weightedPair.weight0.toString()}-${currencyId(chainId, currency0)}/${weightedPair.weight1.toString()}-${currencyId(chainId, currency1)}/${weightedPair.fee0.toString()}`}
                variant="text"
                startIcon={<AddIcon color="primary" />}
                width="100%"
              >
                Add liquidity instead
              </Button>
            </Flex>
          )}
        </AutoColumn>
      )}
    </Card>
  )
}
