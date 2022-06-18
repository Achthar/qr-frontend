import { Currency, CurrencyAmount, ZERO, NETWORK_CCY, AmplifiedWeightedPair, Percent, Price, TokenAmount, Token } from '@requiemswap/sdk'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { WeightedPairState } from 'hooks/useWeightedPairs'
import useTotalSupply from 'hooks/useTotalSupply'

import { useGetWeightedPairsState } from 'hooks/useGetWeightedPairsState'
import useRefresh from 'hooks/useRefresh'
import { deserializeToken } from 'state/user/hooks/helpers'

import { wrappedCurrency, wrappedCurrencyAmount } from 'utils/wrappedCurrency'
import { AppDispatch, AppState } from '../index'
import { tryParseAmount } from '../swapV3/hooks'
import { useCurrencyBalances } from '../wallet/hooks'
import { WeightedField, typeInput, typeInputWeight, typeInputFee, typeInputAmp } from './actions'


export function useMintWeightedPairState(): AppState['mintWeightedPair'] {
    return useSelector<AppState, AppState['mintWeightedPair']>((state) => state.mintWeightedPair)
}

export function useMintWeightedPairActionHandlers(noLiquidity: boolean | undefined): {
    onFieldAInput: (typedValue: string) => void
    onFieldBInput: (typedValue: string) => void
    onWeightAInput: (typedValue: string) => void
    onWeightBInput: (typedValue: string) => void
    onFeeInput: (typedValue: string) => void
    onAmpInput: (typedValue: string) => void
} {
    const dispatch = useDispatch<AppDispatch>()

    const onFieldAInput = useCallback(
        (typedValue: string) => {
            dispatch(typeInput({ field: WeightedField.CURRENCY_A, typedValue, noLiquidity: noLiquidity === true }))
        },
        [dispatch, noLiquidity],
    )
    const onFieldBInput = useCallback(
        (typedValue: string) => {
            dispatch(typeInput({ field: WeightedField.CURRENCY_B, typedValue, noLiquidity: noLiquidity === true }))
        },
        [dispatch, noLiquidity],
    )

    const onWeightAInput = useCallback(
        (typedValue: string) => {
            dispatch(typeInputWeight({ field: WeightedField.WEIGHT_A, typedValue, noLiquidity: noLiquidity === true }))
        },
        [dispatch, noLiquidity],
    )
    const onWeightBInput = useCallback(
        (typedValue: string) => {
            dispatch(typeInputWeight({ field: WeightedField.WEIGHT_B, typedValue, noLiquidity: noLiquidity === true }))
        },
        [dispatch, noLiquidity],
    )

    const onFeeInput = useCallback(
        (typedValue: string) => {
            dispatch(typeInputFee({ typedValue }))
        },
        [dispatch],
    )

    const onAmpInput = useCallback(
        (typedValue: string) => {
            dispatch(typeInputAmp({ typedValue }))
        },
        [dispatch],
    )


    return {
        onFieldAInput,
        onFieldBInput,
        onWeightAInput,
        onWeightBInput,
        onFeeInput,
        onAmpInput
    }
}

export function useDerivedMintWeightedPairInfo(
    chainId: number,
    account: string,
    weightA: string | undefined,
    weightB: string | undefined,
    currencyA: Currency | undefined,
    currencyB: Currency | undefined,
    // this is input from the balances state
    tokenBalances: { [address: string]: TokenAmount },
    networkCcyBalance: CurrencyAmount,
    // this is input from the weightedPairState
    loadedPairs?: AmplifiedWeightedPair[],
    loadedBalances?: TokenAmount[],
    loadedSupply?: TokenAmount[],
): {
    dependentField: WeightedField,
    dependentWeightField: WeightedField,
    currencies: { [field in WeightedField]?: Currency }
    weightedPair?: AmplifiedWeightedPair | null
    weightedPairState: WeightedPairState
    currencyBalances: { [field in WeightedField]?: CurrencyAmount }
    parsedAmounts: { [field in WeightedField]?: CurrencyAmount }
    weights: { [field in WeightedField]?: string }
    price?: Price
    noLiquidity?: boolean
    liquidityMinted?: TokenAmount
    poolTokenPercentage?: Percent
    error?: string
    fee: string
    amp: string
    priceActual?: Price
} {

    const {
        independentField,
        typedValue,
        otherTypedValue,
        independentWeightField,
        typedWeight,
        typedFee,
        typedAmp
    } = useMintWeightedPairState()

    const [tokens, aIsToken0] = useMemo(
        () => {
            if (!currencyA && !currencyB)
                return [{ token0: undefined, token1: undefined }, false]
            const tokenA = wrappedCurrency(currencyA, chainId)
            const tokenB = wrappedCurrency(currencyB, chainId)
            return tokenA?.address.toLowerCase() < tokenB?.address.toLocaleLowerCase() ?
                [
                    {
                        token0: deserializeToken(tokenA),
                        token1: deserializeToken(tokenB),
                    }, true
                ] : [
                    {
                        token1: deserializeToken(tokenA),
                        token0: deserializeToken(tokenB),
                    }, false
                ]
        },
        [chainId, currencyA, currencyB],
    )

    const relevantPairData = loadedPairs.map((_, index) => {
        return {
            pair: loadedPairs[index],
            supply: loadedSupply[index],
            balance: loadedBalances[index]
        }
    }).filter(data => data.pair.token0.address === tokens.token0.address && data.pair.token1.address === tokens.token1.address)


    const dependentField = independentField === WeightedField.CURRENCY_A ? WeightedField.CURRENCY_B : WeightedField.CURRENCY_A
    const dependentWeightField = independentWeightField === WeightedField.WEIGHT_A ? WeightedField.WEIGHT_B : WeightedField.WEIGHT_A
    // tokens
    const currencies: { [field in WeightedField]?: Currency } = useMemo(
        () => ({
            [WeightedField.CURRENCY_A]: currencyA ?? undefined,
            [WeightedField.CURRENCY_B]: currencyB ?? undefined,
        }),
        [currencyA, currencyB],
    )

    const dependentWeight: number | undefined = useMemo(() => {
        return 100 - Number(typedWeight === '' ? weightA : typedWeight)
    }, [typedWeight, weightA])

    const weights = useMemo(() => {
        return {
            [WeightedField.WEIGHT_A]: independentWeightField === WeightedField.WEIGHT_A ? typedWeight === '' ? weightA : typedWeight : String(dependentWeight),
            [WeightedField.WEIGHT_B]: independentWeightField === WeightedField.WEIGHT_A ? String(dependentWeight) : typedWeight === '' ? weightA : typedWeight,
        }
    },
        [independentWeightField, typedWeight, dependentWeight, weightA]
    )

    const usedFee = typedFee === '' ? '10' : typedFee


    // pair
    const pairData = relevantPairData.filter(
        data => (aIsToken0 ? data.pair.weight0.toString() === weights[WeightedField.WEIGHT_A] :
            data.pair.weight1.toString() === weights[WeightedField.WEIGHT_A])
    )?.[0]

    const [weightedPairState, weightedPairData] = pairData ? [WeightedPairState.EXISTS, pairData] :
        [WeightedPairState.NOT_EXISTS, undefined]

    const totalSupply = weightedPairData?.supply
    const weightedPair = pairData?.pair

    const noLiquidity: boolean = useMemo(() => {
        return pairData === undefined
    },
        [pairData])

    // balances
    // fetch balances from state if available
    const [currencyABalance, currencyBBalance] = useMemo(() => {
        let _currencyABalance: CurrencyAmount
        let _currencyBBalance: CurrencyAmount
        if (!currencyA) {
            _currencyABalance = undefined
        } else if (currencyA === NETWORK_CCY[chainId]) {
            _currencyABalance = networkCcyBalance
        } else {
            _currencyABalance = tokenBalances[(currencyA as Token).address]
        }

        if (!currencyB) {
            _currencyBBalance = undefined
        } else if (currencyB === NETWORK_CCY[chainId]) {
            _currencyBBalance = networkCcyBalance
        } else {
            _currencyBBalance = tokenBalances[(currencyB as Token).address]
        }


        return [_currencyABalance, _currencyBBalance]
    },
        [currencyA, currencyB, tokenBalances, networkCcyBalance, chainId]
    )

    // if balances are in state do not load them manually - if not fetch them here
    const relevantTokenBalances = useCurrencyBalances(chainId, account ?? undefined, [
        currencyABalance?.currency ? undefined : currencyA ?? undefined,
        currencyBBalance?.currency ? undefined : currencies[WeightedField.CURRENCY_B] ?? undefined,
    ])


    // assign the user balances
    const currencyBalances: { [field in WeightedField]?: CurrencyAmount } = useMemo(() => {
        return {
            [WeightedField.CURRENCY_A]: currencyABalance ?? relevantTokenBalances[0],
            [WeightedField.CURRENCY_B]: currencyBBalance ?? relevantTokenBalances[1],
        }
    },
        [relevantTokenBalances, currencyABalance, currencyBBalance]
    )

    // amounts
    const independentAmount: CurrencyAmount | undefined = useMemo(() => {
        return tryParseAmount(chainId, typedValue, currencies[independentField])
    },
        [chainId, typedValue, currencies, independentField])

    const dependentAmount: CurrencyAmount | undefined = useMemo(() => {
        if (noLiquidity) {
            if (otherTypedValue && currencies[dependentField]) {
                return tryParseAmount(chainId, otherTypedValue, currencies[dependentField])
            }
            return undefined
        }
        if (independentAmount) {
            // we wrap the currencies just to get the price in terms of the other token
            const wrappedIndependentAmount = wrappedCurrencyAmount(independentAmount, chainId)
            const [tokenA, tokenB] = [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]
            if (tokenA && tokenB && wrappedIndependentAmount && weightedPair) {
                const dependentCurrency = dependentField === WeightedField.CURRENCY_B ? currencyB : currencyA
                const dependentTokenAmount =
                    dependentField === WeightedField.CURRENCY_B
                        ? weightedPair.priceRatioOf(tokenA).quote(chainId, wrappedIndependentAmount)
                        : weightedPair.priceRatioOf(tokenB).quote(chainId, wrappedIndependentAmount)
                return dependentCurrency === NETWORK_CCY[chainId] ? CurrencyAmount.networkCCYAmount(chainId, dependentTokenAmount.raw) : dependentTokenAmount
            }
            return undefined
        }
        return undefined
    }, [noLiquidity, otherTypedValue, currencies, dependentField, independentAmount, currencyA, chainId, currencyB, weightedPair])

    const parsedAmounts: { [field in WeightedField]?: CurrencyAmount | undefined } = useMemo(
        () => ({
            [WeightedField.CURRENCY_A]: independentField === WeightedField.CURRENCY_A ? independentAmount : dependentAmount,
            [WeightedField.CURRENCY_B]: independentField === WeightedField.CURRENCY_A ? dependentAmount : independentAmount
        }),
        [dependentAmount, independentAmount, independentField],
    )

    const price = useMemo(() => {
        if (noLiquidity) {
            const { [WeightedField.CURRENCY_A]: currencyAAmount, [WeightedField.CURRENCY_B]: currencyBAmount } = parsedAmounts
            if (currencyAAmount && currencyBAmount) {
                return new Price(currencyAAmount.currency, currencyBAmount.currency, currencyAAmount.raw, currencyBAmount.raw)
            }
            return undefined
        }
        const wrappedCurrencyA = wrappedCurrency(currencyA, chainId)
        return weightedPair && wrappedCurrencyA ? weightedPair.priceRatioOf(wrappedCurrencyA) : undefined
    }, [chainId, currencyA, noLiquidity, weightedPair, parsedAmounts])

    const priceActual = useMemo(() => {
        if (noLiquidity) {
            const { [WeightedField.CURRENCY_A]: currencyAAmount, [WeightedField.CURRENCY_B]: currencyBAmount } = parsedAmounts
            if (currencyAAmount && currencyBAmount && weightA && weightB) {
                return new Price(
                    currencyAAmount.currency,
                    currencyBAmount.currency,
                    currencyAAmount.raw.mul(weightB),
                    currencyBAmount.raw.mul(weightA))
            }
            return undefined
        }
        const wrappedCurrencyA = wrappedCurrency(currencyA, chainId)
        return weightedPair && wrappedCurrencyA ? weightedPair.priceOf(wrappedCurrencyA) : undefined
    }, [chainId, currencyA, noLiquidity, weightedPair, parsedAmounts, weightA, weightB])



    // liquidity minted
    const liquidityMinted = useMemo(() => {
        const { [WeightedField.CURRENCY_A]: currencyAAmount, [WeightedField.CURRENCY_B]: currencyBAmount } = parsedAmounts
        const [tokenAmountA, tokenAmountB] = [
            wrappedCurrencyAmount(currencyAAmount, chainId),
            wrappedCurrencyAmount(currencyBAmount, chainId),
        ]
        if (weightedPair && totalSupply && tokenAmountA && tokenAmountB) {
            return weightedPair.getLiquidityMinted(totalSupply, tokenAmountA, tokenAmountB)
        }
        return undefined
    }, [parsedAmounts, chainId, weightedPair, totalSupply])

    const poolTokenPercentage = useMemo(() => {
        if (liquidityMinted && totalSupply) {
            return new Percent(liquidityMinted.raw, totalSupply.add(liquidityMinted).raw)
        }
        return undefined
    }, [liquidityMinted, totalSupply])

    let error: string | undefined
    if (!account) {
        error = 'Connect Wallet'
    }

    if (weightedPairState === WeightedPairState.INVALID) {
        error = error ?? 'Invalid pair'
    }

    if (!parsedAmounts[WeightedField.CURRENCY_A] || !parsedAmounts[WeightedField.CURRENCY_B]) {
        error = error ?? 'Enter an amount'
    }

    const { [WeightedField.CURRENCY_A]: currencyAAmount, [WeightedField.CURRENCY_B]: currencyBAmount } = parsedAmounts

    if (currencyAAmount && currencyBalances?.[WeightedField.CURRENCY_A]?.lessThan(currencyAAmount)) {
        error = `Insufficient ${currencies[WeightedField.CURRENCY_A]?.symbol} balance`
    }

    if (currencyBAmount && currencyBalances?.[WeightedField.CURRENCY_B]?.lessThan(currencyBAmount)) {
        error = `Insufficient ${currencies[WeightedField.CURRENCY_B]?.symbol} balance`
    }

    return {
        dependentField,
        dependentWeightField,
        currencies,
        weightedPair,
        weightedPairState,
        currencyBalances,
        parsedAmounts,
        weights,
        price,
        noLiquidity,
        liquidityMinted,
        poolTokenPercentage,
        error,
        fee: usedFee,
        amp: typedAmp,
        priceActual
    }
}