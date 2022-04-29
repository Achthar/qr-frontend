import React, { useMemo, useState } from 'react'
import { Percent, STABLE_POOL_ADDRESS, WeightedPool, TokenAmount, Token, StablePool, ONE } from '@requiemswap/sdk'
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
import PoolLogo from 'components/Logo/PoolLogo'
import { bnParser } from 'utils/helper'

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

const countName = {
  3: 'Tri',
  4: 'Quad'
}

interface PositionCardProps extends CardProps {
  userLpPoolBalance: TokenAmount
  pool: WeightedPool | StablePool
  showUnwrapped?: boolean
}

export function MinimalPoolPositionCard({ userLpPoolBalance, pool }: PositionCardProps) {

  const tokens = pool?.tokens

  const chainId = pool.chainId

  const [showMore, setShowMore] = useState(false)
  // const userPoolBalance = useTokenBalance(chainId, account ?? undefined, pool?.liquidityToken)
  const totalPoolTokens = pool.lpTotalSupply

  const poolTokenPercentage =
    !!userLpPoolBalance && !!totalPoolTokens && totalPoolTokens.gte(userLpPoolBalance.raw.toString())
      ? new Percent(userLpPoolBalance.raw, totalPoolTokens.toBigInt())
      : undefined

  const amountsDepositedRaw = useMemo(() => {
    if (!(pool &&
      totalPoolTokens &&
      userLpPoolBalance && totalPoolTokens.gte(userLpPoolBalance.toBigNumber())))
      return tokens.map((_, i) => undefined)
    return pool.calculateRemoveLiquidity(userLpPoolBalance.raw)
  },
    [pool, totalPoolTokens, userLpPoolBalance, tokens]
  )

  const amountsDeposited = useMemo(() => { return tokens && amountsDepositedRaw?.map((amount, index) => tokens[index] && new TokenAmount(tokens[index], amount ?? '0')) }, [amountsDepositedRaw, tokens])

  return (
    <>
      {userLpPoolBalance && userLpPoolBalance.raw.gt(0) ? (
        <Card>
          <CardBody>
            <AutoColumn gap="16px">
              <FixedHeightRow>
                <RowFixed>
                  <Text color="secondary" bold>
                    LP tokens in your wallet
                  </Text>
                </RowFixed>
              </FixedHeightRow>
              <FixedHeightRow onClick={() => setShowMore(!showMore)}>
                <RowFixed>
                  <IconWrapper size={20}>
                    <CircleOutlineIcon>
                      <PoolLogo tokens={pool?.tokens} margin />
                    </CircleOutlineIcon>
                  </IconWrapper>
                  <Text small color="textSubtle">
                    {pool?.tokens.map(t => t.symbol).join('-')} LP
                  </Text>
                </RowFixed>
                <RowFixed>
                  <Text>{userLpPoolBalance ? userLpPoolBalance.toSignificant(4) : '-'}</Text>
                </RowFixed>
              </FixedHeightRow>
              <AutoColumn gap="4px">
                <FixedHeightRow>
                  <Text color="textSubtle" small>
                    Share of Pool:
                  </Text>
                  <Text>{poolTokenPercentage ? `${poolTokenPercentage.toFixed(6)}%` : '-'}</Text>
                </FixedHeightRow>
                <RowFixed>
                  <Text color="textSubtle" small textAlign='center'>
                    Pooled tokens
                  </Text>
                </RowFixed>
                {amountsDeposited && amountsDeposited.map((amount) => {
                  return (
                    <FixedHeightRow>
                      <Text color="textSubtle" small>
                        {amount.token.symbol}
                      </Text>
                      {amount ? (
                        <RowFixed>
                          <Text ml="6px">{Number(amount?.toSignificant(8)).toLocaleString()}</Text>
                        </RowFixed>
                      ) : (
                        '-'
                      )}
                    </FixedHeightRow>
                  )
                })}
              </AutoColumn>
            </AutoColumn>
          </CardBody>
        </Card>
      ) : (
        <LightCard>
          <Text fontSize="14px" style={{ textAlign: 'center' }}>
            <span role="img" aria-label="pancake-icon" />
            {
              `By adding liquidity you'll earn ${Number(pool?.swapStorage.fee.toString()) / 1e8}% of all trades on this pair proportional to your share of the pool. Fees are added to the pool, accrue in real time and can be claimed by withdrawing your liquidity.`
            }
          </Text>
        </LightCard>
      )}
    </>
  )
}

export default function FullPoolPositionCard({ userLpPoolBalance, pool, ...props }: PositionCardProps) {

  const tokens = pool?.tokens
  const chainId = pool.chainId
  const [showMore, setShowMore] = useState(false)

  const totalPoolTokens = pool.lpTotalSupply
  const chain = getChain(chainId)

  const poolTokenPercentage =
    !!userLpPoolBalance && !!totalPoolTokens && totalPoolTokens.gte(userLpPoolBalance.raw.toString())
      ? new Percent(userLpPoolBalance.raw, totalPoolTokens)
      : undefined


  const amountsDepositedRaw = useMemo(() => {
    if (!(pool &&
      totalPoolTokens &&
      userLpPoolBalance && totalPoolTokens.gte(userLpPoolBalance.raw)))
      return [undefined, undefined, undefined, undefined]
    return pool.calculateRemoveLiquidity(userLpPoolBalance.raw)
  },
    [pool, totalPoolTokens, userLpPoolBalance]
  )

  const amountsDeposited = useMemo(() => { return amountsDepositedRaw.map((amount, index) => new TokenAmount(tokens[index], amount)) }, [amountsDepositedRaw, tokens])

  const tokenText = pool?.tokens.map((t, i) => `${pool instanceof WeightedPool ? Math.round(bnParser(pool?.swapStorage.normalizedWeights[i], ONE) * 10000) / 100 : ''}${pool instanceof WeightedPool ? '%-' : ''}${t.symbol}`).join('-')

  return (
    <Card style={{ borderRadius: '12px' }} {...props}>
      <Flex justifyContent="space-between" role="button" onClick={() => setShowMore(!showMore)} p="16px">
        <Flex flexDirection="column">
          <Flex alignItems="center" mb="4px">
            <AutoColumn gap="4px">
              <PoolLogo tokens={pool?.tokens} margin />
            </AutoColumn>
            <Column>
              <Text bold ml="8px">
                {!tokens ? <Dots>Loading</Dots> : `${pool.name} ${countName[pool.tokens.length]} ${pool instanceof StablePool ? 'Stable' : 'Weighted'} Pool`}
              </Text>
              <Text ml="8px" fontSize='10px'>
                {!tokens ? <Dots>Loading</Dots> : `${tokenText}`}
              </Text>
            </Column>
          </Flex>
          <Text fontSize="14px" color="textSubtle">
            {userLpPoolBalance?.toSignificant(10)}
          </Text>
        </Flex>
        {showMore ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </Flex>

      {
        showMore && (
          <AutoColumn gap="8px" style={{ padding: '16px' }}>
            <RowFixed>
              <Text color="primary" ml="5px" bold textAlign='center'>
                {`Pooled ${pool instanceof StablePool ? 'Stablecoins' : ' Tokens'}`}
              </Text>
            </RowFixed>
            {amountsDeposited && amountsDeposited?.map(amnt => {
              return (

                <FixedHeightRow>

                  <RowFixed>
                    <CurrencyLogo chainId={chainId} size="20px" currency={amnt?.token} />
                    <Text color="textSubtle" ml="4px">
                      {amnt.token.symbol}
                    </Text>
                  </RowFixed>
                  {amnt ? (
                    <RowFixed>
                      <Text ml="6px">{Number(amnt?.toSignificant(8)).toLocaleString()}</Text>
                    </RowFixed>
                  ) : (
                    '-'
                  )}
                </FixedHeightRow>
              )
            })}
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
                  to={`/${chain}/remove/${pool instanceof StablePool ? 'stables' : 'weighted'}`}
                  variant="primary"
                  width="100%"
                  mb="8px"
                >
                  Remove
                </Button>
                <Button
                  as={Link}
                  to={`/${chain}/add/${pool instanceof StablePool ? 'stables' : 'weighted'}`}
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
