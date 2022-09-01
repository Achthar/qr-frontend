import React, { useMemo, useState } from 'react'
import { AmplifiedWeightedPair, ONE, Percent, StablePool, Token, TokenAmount, WeightedPool } from '@requiemswap/sdk'
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
    StarLineIcon,
} from '@requiemswap/uikit'
import { bnParser } from 'utils/helper'
import PoolLogo from 'components/Logo/PoolLogo'
import Column from 'components/Column'

import { BigNumber, ethers } from 'ethers'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { deserializeToken } from 'state/user/hooks/helpers'
import getChain from 'utils/getChain'
import { SerializedWeightedPair } from 'state/types'

import { currencyId } from '../../utils/currencyId'
import { unwrappedToken } from '../../utils/wrappedCurrency'

import { AutoColumn } from '../Layout/Column'
import CurrencyLogo from '../Logo/CurrencyLogo'
import { DoubleCurrencyLogo } from '../Logo'
import { RowBetween, RowFixed } from '../Layout/Row'
import Dots from '../Loader/Dots'

const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`

interface WeightedPositionCardProps extends CardProps {
    weightedPair: SerializedWeightedPair
    isMobile?: boolean
}

const Field = styled.div`
    height: 24px;
`

const countName = {
    3: 'Tri',
    4: 'Quad'
}

const TEN = BigNumber.from(10)

const tableFontSize = '14px'

const formatReserve = (reserve: string, token: Token) => {
    return reserve ? Number(ethers.utils.formatEther(TEN.pow(18 - token.decimals).mul(reserve))).toLocaleString() : '0'
}

export function PairGeneralPositionCard({ weightedPair, isMobile, ...props }: WeightedPositionCardProps) {
    const chainId = weightedPair.token0.chainId
    const token0 = deserializeToken(weightedPair.token0)
    const token1 = deserializeToken(weightedPair.token1)

    const currency0 = unwrappedToken(token0)
    const currency1 = unwrappedToken(token1)


    const chain = getChain(chainId)

    const [showMore, setShowMore] = useState(false)

    return (
        <Card style={{ borderRadius: '12px' }} {...props}>
            <Flex justifyContent="space-between" role="button" onClick={() => setShowMore(!showMore)} p="16px">
                <Flex flexDirection="column">
                    <Flex alignItems="center" mb="4px">
                        <DoubleCurrencyLogo chainId={chainId} currency0={currency0} currency1={currency1} size={20} />
                        <Text bold ml="16px">
                            {!currency0 || !currency1 ? <Dots>Loading</Dots> : `${weightedPair.weight0}% ${currency0.symbol} + ${100 - weightedPair?.weight0}% ${currency1.symbol}`}
                            <Text fontSize='12px'>
                                {!currency0 || !currency1 ? <Dots>Loading</Dots> : `Amplified by ${Number(weightedPair.amp.toString()) / 10000}x with swap fee of ${Number(weightedPair.fee)}BPs`}
                            </Text>
                        </Text>

                    </Flex>
                </Flex>
                {showMore ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </Flex>

            {showMore && (

                <AutoColumn gap="8px" style={{ padding: '5px' }}>
                    <Flex flexDirection='row' justifyContent='space-between'>

                        <Flex flexDirection='column' marginRight='20px' marginLeft='5px'>
                            <Field />
                            <Field> <CurrencyLogo chainId={chainId} size="20px" currency={currency0} /></Field>
                            <Field> <CurrencyLogo chainId={chainId} size="20px" currency={currency1} /></Field>
                        </Flex>

                        <Flex flexDirection='column' marginRight='20px'>
                            <Field>  <Text>Reserves</Text></Field>
                            <Field>  <Text fontSize={tableFontSize}>{formatReserve(weightedPair?.reserve0, token0)}</Text></Field>
                            <Field>   <Text fontSize={tableFontSize}>{formatReserve(weightedPair?.reserve1, token1)}</Text></Field>
                        </Flex>
                        <Flex flexDirection='column' marginRight='20px'>
                            <Field> <Text>Virtual</Text></Field>
                            <Field> <Text fontSize={tableFontSize}>{formatReserve(weightedPair?.vReserve0, token0)}</Text></Field>
                            <Field> <Text fontSize={tableFontSize}>{formatReserve(weightedPair?.vReserve1, token1)}</Text></Field>
                        </Flex>
                        <Flex flexDirection='column'>
                            <Field> <Text>{isMobile ? 'Value' : 'Pool value'}</Text></Field>
                            <Field> <Text fontSize={tableFontSize}>{Number(weightedPair?.value0).toLocaleString()}</Text></Field>
                            <Field> <Text fontSize={tableFontSize}>{Number(weightedPair?.value1).toLocaleString()}</Text></Field>
                        </Flex>
                    </Flex>


                    <FixedHeightRow padding='5px'>
                        <Text color="textSubtle" marginLeft='10px'>LP token total supply</Text>
                        <Text fontSize="14px" color="textSubtle">
                            {Math.round(Number(ethers.utils.formatEther(weightedPair?.totalSupply ?? '0')) * 1e8) / 1e8}
                        </Text>
                    </FixedHeightRow>

                    <Button
                        as={Link}
                        to={`/${chain}/add/${weightedPair.weight0.toString()}-${currencyId(chainId, currency0)}/${100 - weightedPair.weight0}-${currencyId(chainId, currency1)}`}
                        variant="text"
                        startIcon={<AddIcon color="primary" />}
                        width="100%"
                    >
                        Add liquidity to pool
                    </Button>

                </AutoColumn>
            )
            }
        </Card >
    )
}

interface PositionCardProps extends CardProps {
    pool: WeightedPool | StablePool
}

export function PoolGeneralPositionCard({ pool, ...props }: PositionCardProps) {

    const tokens = pool?.tokens
    const chainId = pool.chainId
    const [showMore, setShowMore] = useState(false)

    const chain = getChain(chainId)

    const balances = pool.getBalances()

    const values: string[] = useMemo(() => {
        if (!(pool))
            return tokens.map((tk) => { return '0' })
        const _vals: BigNumber[] = pool.getBalances()
        for (let i = 0; i < tokens.length; i++) {
            for (let k = 0; k < tokens.length; k++) {
                if (i !== k) {
                    _vals[i] = _vals[i].add(pool.calculateSwapGivenIn(tokens[k], tokens[i], balances[k].div(10000)).mul(10000))
                }
            }
        }
        return _vals.map((v, j) => formatReserve(v.toString(), tokens[j]))
    },
        [pool, balances, tokens]
    )

    const isWeighted = useMemo(() => pool instanceof WeightedPool, [pool])

    const tokenText = pool?.tokens.map((t, i) => `${isWeighted ?
        (pool as WeightedPool)?.swapStorage?.normalizedWeights?.[i]
        && Math.round(bnParser((pool as WeightedPool)?.swapStorage.normalizedWeights[i], ONE) * 10000) / 100 : ''}${isWeighted ? '%-' : ''
        }${t.symbol}`).join('-')

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
                                {!tokens ? <Dots>Loading</Dots> : `${pool.name} ${countName[pool.tokens.length]} ${!isWeighted ? 'Stable' : 'Weighted'} Pool`}
                            </Text>
                            <Text ml="8px" fontSize='10px'>
                                {!tokens ? <Dots>Loading</Dots> : `${tokenText}`}
                            </Text>
                        </Column>
                    </Flex>

                </Flex>
                {showMore ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </Flex>

            {
                showMore && (
                    <AutoColumn gap="8px" style={{ padding: '16px' }}>
                        <Flex flexDirection='row' justifyContent='space-between'>

                            <Flex flexDirection='column' marginRight='20px' marginLeft='5px'>
                                <Field />
                                {tokens.map(_t => <Field> <CurrencyLogo chainId={chainId} size="20px" currency={_t} /></Field>)}
                            </Flex>

                            <Flex flexDirection='column' marginRight='20px'>
                                <Field>  <Text>Reserves</Text></Field>
                                {pool?.getBalances().map((_b, i) => <Field>  <Text fontSize={tableFontSize}>{formatReserve(_b.toString(), tokens[i])}</Text></Field>)}
                            </Flex>
                            <Flex flexDirection='column'>
                                <Field> <Text>Pool value</Text></Field>
                                {values.map(_v => <Field> <Text fontSize={tableFontSize}>{_v}</Text></Field>)}
                            </Flex>
                        </Flex>

                        <FixedHeightRow padding='5px'>
                            <Text color="textSubtle" marginLeft='10px'>LP token total supply</Text>
                            <Text fontSize="14px" color="textSubtle">
                                {Math.round(Number(ethers.utils.formatEther(pool?.lpTotalSupply)) * 1e8) / 1e8}
                            </Text>
                        </FixedHeightRow>
                        <Button
                            as={Link}
                            to={`/${chain}/add/${!isWeighted ? 'stables' : 'weighted'}`}
                            variant="text"
                            startIcon={<AddIcon color="primary" />}
                            width="100%"
                        >
                            Add liquidity to pool
                        </Button>

                    </AutoColumn>
                )
            }
        </Card >
    )
}



export const PoolsHeader = styled(Flex)`
  margin-top: 20px;
  margin-bottom: 5px;
  padding: 3px;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  max-width: 400px;
  min-width: 350px;
  height: 40px;
  width: 100%;
  background: radial-gradient(rgba(0, 0, 0, 0.2) 60%, rgba(255, 255, 255, 0.2) 100%);
  z-index: 1;
  align:center;
  justify-content: center;
  align-items:center;
`

export const PoolsSectionHeader = styled(Flex)`
  margin-top: 10px;
  margin-bottom: 5px;
  padding: 3px;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  max-width: 400px;
  min-width: 300px;
  height: 35px;
  width: 100%;
  background:rgba(255, 255, 255, 0.01);
  border-left: solid 5px rgba(220, 220, 220, 0.2);
  border-right: solid 5px rgba(220, 220, 220, 0.2);
  border-bottom: solid 2px rgba(220, 220, 220, 0.2);
  border-top: solid 2px rgba(220, 220, 220, 0.2);
  z-index: 1;
  align:center;
  justify-content: space-between;
  align-items:center;
`