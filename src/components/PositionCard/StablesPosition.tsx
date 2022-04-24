import React, { useState } from 'react'
import { Percent, STABLE_POOL_ADDRESS, StablePool, TokenAmount, Token } from '@requiemswap/sdk'
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
  CircleOutlineIcon,
} from '@requiemswap/uikit'
import getChain from 'utils/getChain'
import { BigNumber } from 'ethers'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useTranslation } from 'contexts/Localization'
import Column from 'components/Column'
import QuadCurrencyLogo from 'components/Logo/QuadLogo'
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


const IconWrapper = styled.div<{ size?: number }>`
  align-items: center;
  justify-content: center;
  & > img,
  span {
    height: ${({ size }) => (size ? `${size}px` : '32px')};
    width: ${({ size }) => (size ? `${size}px` : '32px')};
  }
  ${({ theme }) => theme.mediaWidth.upToMedium`
    align-items: center;
  `};
`

interface PositionCardProps extends CardProps {
  userLpPoolBalance: TokenAmount
  stablePool: StablePool
  showUnwrapped?: boolean
}

export function MinimalStablesPositionCard({ userLpPoolBalance, stablePool }: PositionCardProps) {

  const { t } = useTranslation()

  const tokens = stablePool.tokens

  const chainId = stablePool.chainId

  const [showMore, setShowMore] = useState(false)
  // const userPoolBalance = useTokenBalance(chainId, account ?? undefined, stablePool?.liquidityToken)
  const totalPoolTokens = stablePool.lpTotalSupply

  const poolTokenPercentage =
    !!userLpPoolBalance && !!totalPoolTokens && totalPoolTokens.gte(userLpPoolBalance.raw.toString())
      ? new Percent(userLpPoolBalance.raw, totalPoolTokens.toBigInt())
      : undefined

  const amountsDeposited = !!stablePool &&
    !!totalPoolTokens &&
    !!userLpPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    totalPoolTokens.gte(userLpPoolBalance.raw.toString())
    ? stablePool.calculateRemoveLiquidity(userLpPoolBalance.toBigNumber()).map((amount, index) => new TokenAmount(tokens[index], amount.toBigInt()))
    : [undefined, undefined, undefined, undefined]

  return (
    <>
      {userLpPoolBalance && userLpPoolBalance.raw.gt(0) ? (
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
                  <IconWrapper size={20}>
                    <CircleOutlineIcon>
                      <Column>
                        <DoubleCurrencyLogo chainId={chainId} currency0={tokens[0]} currency1={tokens[1]} margin size={20} />
                        <DoubleCurrencyLogo chainId={chainId} currency0={tokens[2]} currency1={tokens[3]} margin size={20} />
                      </Column>
                    </CircleOutlineIcon>
                  </IconWrapper>
                  <Text small color="textSubtle">
                    {tokens[0].symbol}-{tokens[1].symbol}-{tokens[2].symbol}-{tokens[3].symbol} LP
                  </Text>
                </RowFixed>
                <RowFixed>
                  <Text>{userLpPoolBalance ? userLpPoolBalance.toSignificant(4) : '-'}</Text>
                </RowFixed>
              </FixedHeightRow>
              <AutoColumn gap="4px">
                <FixedHeightRow>
                  <Text color="textSubtle" small>
                    {t('Share of Pool')}:
                  </Text>
                  <Text>{poolTokenPercentage ? `${poolTokenPercentage.toFixed(6)}%` : '-'}</Text>
                </FixedHeightRow>
                <RowFixed>
                  <Text color="textSubtle" small textAlign='center'>
                    Pooled Stablecoins
                  </Text>
                </RowFixed>
                <FixedHeightRow>
                  <Text color="textSubtle" small>
                    {tokens[0].symbol}
                  </Text>
                  {amountsDeposited?.[0] ? (
                    <RowFixed>
                      <Text ml="6px">{amountsDeposited?.[0]?.toSignificant(2)}</Text>
                    </RowFixed>
                  ) : (
                    '-'
                  )}
                </FixedHeightRow>
                <FixedHeightRow>
                  <Text color="textSubtle" small>
                    {tokens[1].symbol}
                  </Text>
                  {amountsDeposited?.[1] ? (
                    <RowFixed>
                      <Text ml="6px">{amountsDeposited?.[1]?.toSignificant(2)}</Text>
                    </RowFixed>
                  ) : (
                    '-'
                  )}
                </FixedHeightRow>
                <FixedHeightRow>
                  <Text color="textSubtle" small>
                    {tokens[2].symbol}
                  </Text>
                  {amountsDeposited?.[2] ? (
                    <RowFixed>
                      <Text ml="6px">{amountsDeposited?.[2]?.toSignificant(2)}</Text>
                    </RowFixed>
                  ) : (
                    '-'
                  )}
                </FixedHeightRow>
                <FixedHeightRow>
                  <Text color="textSubtle" small>
                    {tokens[3].symbol}
                  </Text>
                  {amountsDeposited?.[4] ? (
                    <RowFixed>
                      <Text ml="6px">{amountsDeposited?.[1]?.toSignificant(2)}</Text>
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
              "By adding liquidity you'll earn 0.01% of all trades on this pair proportional to your share of the pool. Fees are added to the pool, accrue in real time and can be claimed by withdrawing your liquidity.",
            )}
          </Text>
        </LightCard>
      )}
    </>
  )
}

export default function FullStablesPositionCard({ userLpPoolBalance, stablePool, ...props }: PositionCardProps) {

  const tokens = stablePool.tokens
  const chainId = stablePool.chainId
  const [showMore, setShowMore] = useState(false)

  const totalPoolTokens = stablePool.lpTotalSupply
  const chain = getChain(chainId)

  const poolTokenPercentage =
    !!userLpPoolBalance && !!totalPoolTokens && totalPoolTokens.gte(userLpPoolBalance.raw.toString())
      ? new Percent(userLpPoolBalance.raw, totalPoolTokens.toBigInt())
      : undefined



  const amountsDeposited = !!stablePool &&
    !!totalPoolTokens &&
    !!userLpPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    totalPoolTokens.gte(userLpPoolBalance.toBigNumber())
    ? stablePool.calculateRemoveLiquidity(userLpPoolBalance.toBigNumber()).map((amount, index) => new TokenAmount(tokens[index], amount.toBigInt()))
    : [undefined, undefined, undefined, undefined]

  return (
    <Card style={{ borderRadius: '12px' }} {...props}>
      <Flex justifyContent="space-between" role="button" onClick={() => setShowMore(!showMore)} p="16px">
        <Flex flexDirection="column">
          <Flex alignItems="center" mb="4px">
            <AutoColumn gap="4px">
              <QuadCurrencyLogo chainId={chainId} currency0={tokens[0]} currency1={tokens[1]} currency2={tokens[2]} currency3={tokens[3]} size={20} />
            </AutoColumn>
            <Column>
              <Text bold ml="8px">
                {!tokens ? <Dots>Loading</Dots> : 'Quad Stable Pool'}
              </Text>
              <Text ml="8px" fontSize='10px'>
                {!tokens ? <Dots>Loading</Dots> : `${tokens[0].symbol}-${tokens[1].symbol}-${tokens[2].symbol}-${tokens[3].symbol}`}
              </Text>
            </Column>
          </Flex>
          <Text fontSize="14px" color="textSubtle">
            {userLpPoolBalance?.toSignificant(8)}
          </Text>
        </Flex>
        {showMore ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </Flex>

      {
        showMore && (
          <AutoColumn gap="8px" style={{ padding: '16px' }}>
            <RowFixed>
              <Text color="primary" ml="5px" bold textAlign='center'>
                Pooled Stablecoins
              </Text>
            </RowFixed>
            <FixedHeightRow>

              <RowFixed>
                <CurrencyLogo chainId={chainId} size="20px" currency={tokens[0]} />
                <Text color="textSubtle" ml="4px">
                  {tokens[0].symbol}
                </Text>
              </RowFixed>
              {amountsDeposited ? (
                <RowFixed>
                  <Text ml="6px">{amountsDeposited?.[0]?.toSignificant(6)}</Text>
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>

            <FixedHeightRow>
              <RowFixed>
                <CurrencyLogo chainId={chainId} size="20px" currency={tokens[1]} />
                <Text color="textSubtle" ml="4px">
                  {tokens[1].symbol}
                </Text>
              </RowFixed>
              {amountsDeposited ? (
                <RowFixed>
                  <Text ml="6px">{amountsDeposited?.[1]?.toSignificant(6)}</Text>
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>
            <FixedHeightRow>
              <RowFixed>
                <CurrencyLogo chainId={chainId} size="20px" currency={tokens[2]} />
                <Text color="textSubtle" ml="4px">
                  {tokens[2].symbol}
                </Text>
              </RowFixed>
              {amountsDeposited ? (
                <RowFixed>
                  <Text ml="6px">{amountsDeposited?.[2]?.toSignificant(6)}</Text>
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>
            <FixedHeightRow>
              <RowFixed>
                <CurrencyLogo chainId={chainId} size="20px" currency={tokens[3]} />
                <Text color="textSubtle" ml="4px">
                  {tokens[3].symbol}
                </Text>
              </RowFixed>
              {amountsDeposited ? (
                <RowFixed>
                  <Text ml="6px">{amountsDeposited?.[3]?.toSignificant(6)}</Text>
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

            {userLpPoolBalance && userLpPoolBalance.raw.gt(0) && (
              <Flex flexDirection="column">
                <Button
                  as={Link}
                  to={`/${chain}/remove/stables`}
                  variant="primary"
                  width="100%"
                  mb="8px"
                >
                  Remove
                </Button>
                <Button
                  as={Link}
                  to={`/${chain}/add/stables`}
                  variant="text"
                  startIcon={<AddIcon color="primary" />}
                  width="100%"
                >
                  Add liquidity instead
                </Button>
              </Flex>
            )}
          </AutoColumn>
        )
      }
    </Card >
  )
}
