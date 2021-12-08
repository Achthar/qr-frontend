import React, { useCallback, useState } from 'react'
import {
  Currency,
  currencyEquals,
  ETHER,
  NETWORK_CCY,
  TokenAmount,
  WETH,
  WRAPPED_NETWORK_TOKENS,
  STABLE_POOL_ADDRESS,
  STABLES_INDEX_MAP,
} from '@requiemswap/sdk'
import {
  Button,
  Text,
  Flex,
  CardBody,
} from '@requiemswap/uikit'
import { RouteComponentProps, Link } from 'react-router-dom'
// import {Svg, SvgProps} from '@requiemswap/uikit'
import styled from 'styled-components'
import { useIsTransactionUnsupported } from 'hooks/Trades'
import { useTranslation } from 'contexts/Localization'
import UnsupportedCurrencyFooter from 'components/UnsupportedCurrencyFooter'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { LightCard } from 'components/Card'
import { AutoColumn, ColumnCenter } from 'components/Layout/Column'
import CurrencyInputPanelStable from 'components/CurrencyInputPanel/CurrencyInputPanelStable'
import { AppHeader, AppBody } from 'components/App'
import Row, { RowBetween } from 'components/Layout/Row'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { Field } from 'state/mint/actions'
import { StablesField } from 'state/mintStables/actions'
import { useDerivedMintStablesInfo, useMintStablesActionHandlers, useMintStablesState } from 'state/mintStables/hooks'
import { ButtonStableApprove } from 'components/Button'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useGasPrice, useIsExpertMode, useUserSlippageTolerance } from 'state/user/hooks'
import { calculateGasMargin, calculateSlippageAmount, getRouterContract, getStableRouterContract } from 'utils'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import Dots from 'components/Loader/Dots'

import ConnectWalletButton from 'components/ConnectWalletButton'
import { useStablePool } from 'hooks/useStablePool'
import StablePoolPriceBar from './StablePoolPriceBar'
import Page from '../Page'

export default function AddStableLiquidity({
  history,
}: RouteComponentProps<{ stable: string }>) {
  const { account, chainId, library } = useActiveWeb3React("AL")
  const { t } = useTranslation()
  const gasPrice = useGasPrice(chainId)


  const expertMode = useIsExpertMode()

  // modal and loading
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // txn values
  const deadline = useTransactionDeadline(chainId) // custom from users settings
  const [allowedSlippage] = useUserSlippageTolerance() // custom from users
  const [txHash, setTxHash] = useState<string>('')


  const addTransaction = useTransactionAdder()

  // const [liquidityState, setLiquidityState] = useState<LiquidityState>(LiquidityState.STABLE)
  // const handleClick = (newIndex: LiquidityState) => setLiquidityState(newIndex)

  const LiquidityStateButtonWrapper = styled.div`
    margin-bottom: 20px;
  `
  const StablesInputWrapper = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: right;
    padding: 1px;
  `

  // get the correctly arranged stablecoins

  // mint state
  const { typedValue1, typedValue2, typedValue3, typedValue4 } = useMintStablesState()

  // we separate loading the stavblepool to avoid rerendering on every input
  const [stablePoolState, stablePool] = useStablePool()

  const {
    stableCurrencies,
    stablesCurrencyBalances,
    parsedStablesAmounts,
    stablesLiquidityMinted,
    stablesPoolTokenPercentage,
    stablesError,
  } = useDerivedMintStablesInfo(stablePool, stablePoolState, account)

  const formattedStablesAmounts = {
    [StablesField.CURRENCY_1]: parsedStablesAmounts[StablesField.CURRENCY_1],
    [StablesField.CURRENCY_2]: parsedStablesAmounts[StablesField.CURRENCY_2],
    [StablesField.CURRENCY_3]: parsedStablesAmounts[StablesField.CURRENCY_3],
    [StablesField.CURRENCY_4]: parsedStablesAmounts[StablesField.CURRENCY_4],
  }

  const { onField1Input, onField2Input, onField3Input, onField4Input } = useMintStablesActionHandlers()

  const [approval1, approve1Callback] = useApproveCallback(
    chainId,
    formattedStablesAmounts[StablesField.CURRENCY_1],
    STABLE_POOL_ADDRESS[chainId],
  )
  const [approval2, approve2Callback] = useApproveCallback(
    chainId,
    formattedStablesAmounts[StablesField.CURRENCY_2],
    STABLE_POOL_ADDRESS[chainId],
  )
  const [approval3, approve3Callback] = useApproveCallback(
    chainId,
    formattedStablesAmounts[StablesField.CURRENCY_3],
    STABLE_POOL_ADDRESS[chainId],
  )
  const [approval4, approve4Callback] = useApproveCallback(
    chainId,
    formattedStablesAmounts[StablesField.CURRENCY_4],
    STABLE_POOL_ADDRESS[chainId],
  )

  // get the max amounts user can add
  const maxAmountsStables: { [field in StablesField]?: TokenAmount } = [
    StablesField.CURRENCY_1,
    StablesField.CURRENCY_2,
    StablesField.CURRENCY_3,
    StablesField.CURRENCY_4,
  ].reduce((accumulator, field) => {
    return {
      ...accumulator,
      [field]: maxAmountSpend(chainId, stablesCurrencyBalances[field]),
    }
  }, {})

  const atMaxAmountsStables: { [field in Field]?: StablesField } = [
    StablesField.CURRENCY_1,
    StablesField.CURRENCY_2,
    StablesField.CURRENCY_3,
    StablesField.CURRENCY_4,
  ].reduce((accumulator, field) => {
    return {
      ...accumulator,
      [field]: maxAmountsStables[field]?.equalTo(parsedStablesAmounts[field] ?? '0'),
    }
  }, {})


  const balances: { [address: string]: TokenAmount } = [
    StablesField.CURRENCY_1,
    StablesField.CURRENCY_2,
    StablesField.CURRENCY_3,
    StablesField.CURRENCY_4,
  ].reduce((accumulator, field) => {
    return {
      ...accumulator,
      [stablesCurrencyBalances[field]?.token.address]: stablesCurrencyBalances[field],
    }
  }, {})

  const stableAddValid: boolean = (
    approval1 === ApprovalState.APPROVED &&
    approval2 === ApprovalState.APPROVED &&
    approval3 === ApprovalState.APPROVED &&
    approval4 === ApprovalState.APPROVED
  ) && (
      !parsedStablesAmounts[StablesField.CURRENCY_1].toBigNumber().eq(0)
      || !parsedStablesAmounts[StablesField.CURRENCY_2].toBigNumber().eq(0)
      || !parsedStablesAmounts[StablesField.CURRENCY_3].toBigNumber().eq(0)
      || !parsedStablesAmounts[StablesField.CURRENCY_4].toBigNumber().eq(0)
    )
  async function onStablesAdd() {
    if (!chainId || !library || !account) return
    const stableRouter = getStableRouterContract(chainId, library, account)

    const {
      [StablesField.CURRENCY_1]: parsedAmount1,
      [StablesField.CURRENCY_2]: parsedAmount2,
      [StablesField.CURRENCY_3]: parsedAmount3,
      [StablesField.CURRENCY_4]: parsedAmount4,
    } = parsedStablesAmounts
    if (!parsedAmount1 && !parsedAmount2 && !parsedAmount3 && !parsedAmount4 && !deadline) {
      return
    }

    const amountMin = calculateSlippageAmount(stablesLiquidityMinted, allowedSlippage)[0]

    // let estimate
    // let method: (...args: any) => Promise<TransactionResponse>
    // let args: Array<string | string[] | number>
    // let value: BigNumber | null

    const estimate = stableRouter.estimateGas.addLiquidity
    const method = stableRouter.addLiquidity
    const args = [
      [
        parsedStablesAmounts[StablesField.CURRENCY_1].toBigNumber(),
        parsedStablesAmounts[StablesField.CURRENCY_2].toBigNumber(),
        parsedStablesAmounts[StablesField.CURRENCY_3].toBigNumber(),
        parsedStablesAmounts[StablesField.CURRENCY_4].toBigNumber(),
      ],
      amountMin.toString(),
      deadline.toHexString(),
    ]
    const value = null

    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then((estimatedGasLimit) =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit),
          gasPrice,
        }).then((response) => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary: `Add [${parsedStablesAmounts[StablesField.CURRENCY_1]?.toSignificant(2)}, ${parsedStablesAmounts[
              StablesField.CURRENCY_2
            ]?.toSignificant(2)}, ${parsedStablesAmounts[StablesField.CURRENCY_3]?.toSignificant(
              2,
            )}, ${parsedStablesAmounts[StablesField.CURRENCY_4]?.toSignificant(2)}] ${parsedStablesAmounts[StablesField.CURRENCY_1]?.currency.symbol
              }-${parsedStablesAmounts[StablesField.CURRENCY_2]?.currency.symbol}-${parsedStablesAmounts[StablesField.CURRENCY_3]?.currency.symbol
              }-${parsedStablesAmounts[StablesField.CURRENCY_4]?.currency.symbol}`,
          })

          setTxHash(response.hash)
        }),
      )
      .catch((err) => {
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (err?.code !== 4001) {
          console.error(err)
        }
      })
  }

  return (
    <Page>
      <Row width='200px' height='50px'>
        {/* <ButtonMenu activeIndex={liquidityState} onItemClick={handleClick} scale="sm" ml="24px"> */}
        <Button
          as={Link}
          to='/add'
          variant="secondary"
          width="100%"
          mb="8px"
        >
          Pairs
        </Button>
        <Button
          as={Link}
          to='/add/stable'
          variant="primary"
          width="100%"
          mb="8px"
        >
          Stables
        </Button>
        {/* </ButtonMenu> */}
      </Row>
      <AppBody>
        <AppHeader
          title='Add Stablecoin Liquidity'
          subtitle='Receive collateralizable StableSwap LP Tokens'

          helper={t(
            'Liquidity providers earn a 0.01% trading fee on all trades made through the pool, proportional to their share of the liquidity pool.',
          )}
          backTo="/pool"
        />
        <CardBody>

          <AutoColumn gap="5px">
            <Row>
              <CurrencyInputPanelStable
                width={account && approval1 !== ApprovalState.APPROVED ? '300px' : '100%'}
                value={typedValue1}
                onUserInput={onField1Input}
                onMax={() => {
                  onField1Input(maxAmountsStables[StablesField.CURRENCY_1]?.toExact() ?? '')
                }}
                showMaxButton={!atMaxAmountsStables[StablesField.CURRENCY_1]}
                stableCurrency={STABLES_INDEX_MAP[chainId][0]}
                balances={balances}
                account={account}
                id="add-liquidity-input-token1"
              />

              {
                account && (
                  approval1 !== ApprovalState.APPROVED && (
                    <ButtonStableApprove
                      onClick={approve1Callback}
                      disabled={approval1 === ApprovalState.PENDING}
                      width="80px"
                    >
                      {approval1 === ApprovalState.PENDING ? (
                        <Dots>{t('Enabling %asset%', { asset: stableCurrencies[StablesField.CURRENCY_1]?.symbol })}</Dots>
                      ) : (
                        t('Enable %asset%', { asset: stableCurrencies[StablesField.CURRENCY_1]?.symbol })
                      )}
                    </ButtonStableApprove>
                  ))
              }
            </Row>
            <Row>
              <CurrencyInputPanelStable
                width={account && approval2 !== ApprovalState.APPROVED ? '300px' : '100%'}
                value={typedValue2}
                onUserInput={onField2Input}
                onMax={() => {
                  onField2Input(maxAmountsStables[StablesField.CURRENCY_2]?.toExact() ?? '')
                }}
                showMaxButton={!atMaxAmountsStables[StablesField.CURRENCY_2]}
                stableCurrency={STABLES_INDEX_MAP[chainId][1]}
                balances={balances}
                account={account}
                id="add-liquidity-input-token2"
              />
              {account && (approval2 !== ApprovalState.APPROVED && (
                <ButtonStableApprove
                  onClick={approve2Callback}
                  disabled={approval2 === ApprovalState.PENDING}
                  width="80px"
                >
                  {approval2 === ApprovalState.PENDING ? (
                    <Dots>{t('Enabling %asset%', { asset: stableCurrencies[StablesField.CURRENCY_2]?.symbol })}</Dots>
                  ) : (
                    t('Enable %asset%', { asset: stableCurrencies[StablesField.CURRENCY_2]?.symbol })
                  )}
                </ButtonStableApprove>
              ))}
            </Row>
            <Row>
              <CurrencyInputPanelStable
                width={account && approval3 !== ApprovalState.APPROVED ? '300px' : '100%'}
                value={typedValue3}
                onUserInput={onField3Input}
                onMax={() => {
                  onField3Input(maxAmountsStables[StablesField.CURRENCY_3]?.toExact() ?? '')
                }}
                showMaxButton={!atMaxAmountsStables[StablesField.CURRENCY_3]}
                stableCurrency={STABLES_INDEX_MAP[chainId][2]}
                balances={balances}
                account={account}
                id="add-liquidity-input-token3"
              />
              {account && (approval3 !== ApprovalState.APPROVED && (
                <ButtonStableApprove
                  onClick={approve3Callback}
                  disabled={approval3 === ApprovalState.PENDING}
                  width="80px"
                >
                  {approval3 === ApprovalState.PENDING ? (
                    <Dots>{t('Enabling %asset%', { asset: stableCurrencies[StablesField.CURRENCY_3]?.symbol })}</Dots>
                  ) : (
                    t('Enable %asset%', { asset: stableCurrencies[StablesField.CURRENCY_3]?.symbol })
                  )}
                </ButtonStableApprove>
              ))}
            </Row>
            <Row>
              <CurrencyInputPanelStable
                width={account && approval4 !== ApprovalState.APPROVED ? '300px' : '100%'}
                value={typedValue4}
                onUserInput={onField4Input}
                onMax={() => {
                  onField4Input(maxAmountsStables[StablesField.CURRENCY_4]?.toExact() ?? '')
                }}
                showMaxButton={!atMaxAmountsStables[StablesField.CURRENCY_4]}
                stableCurrency={STABLES_INDEX_MAP[chainId][3]}
                balances={balances}
                account={account}
                id="add-liquidity-input-token4"
              />
              {account && (approval4 !== ApprovalState.APPROVED && (
                <ButtonStableApprove
                  onClick={approve4Callback}
                  disabled={(approval4 as ApprovalState) === ApprovalState.PENDING}
                  width="80px"
                >
                  {(approval4 as ApprovalState) === ApprovalState.PENDING ? (
                    <Dots>{t('Enabling %asset%', { asset: stableCurrencies[StablesField.CURRENCY_4]?.symbol })}</Dots>
                  ) : (
                    t('Enable %asset%', { asset: stableCurrencies[StablesField.CURRENCY_4]?.symbol })
                  )}
                </ButtonStableApprove>
              ))}
            </Row>

            <>
              <LightCard padding="0px" borderRadius="20px">
                <LightCard padding="1rem" borderRadius="20px">
                  <StablePoolPriceBar poolTokenPercentage={stablesPoolTokenPercentage} stablePool={stablePool} formattedStablesAmounts={formattedStablesAmounts} />
                </LightCard>
              </LightCard>
            </>

            <AutoColumn gap="md">

              {!account ? (<ConnectWalletButton align='center' maxWidth='100%' />)
                : ((approval1 === ApprovalState.NOT_APPROVED ||
                  approval1 === ApprovalState.PENDING ||
                  approval2 === ApprovalState.NOT_APPROVED ||
                  approval2 === ApprovalState.PENDING ||
                  approval3 === ApprovalState.NOT_APPROVED ||
                  approval3 === ApprovalState.PENDING ||
                  approval4 === ApprovalState.NOT_APPROVED ||
                  approval4 === ApprovalState.PENDING) ? (<RowBetween>Approvals still pending...</RowBetween>) :
                  (<Button
                    variant={
                      // !!parsedStablesAmounts[StablesField.CURRENCY_1] && !!parsedStablesAmounts[StablesField.CURRENCY_2]
                      //   && !!parsedStablesAmounts[StablesField.CURRENCY_3] && !!parsedStablesAmounts[StablesField.CURRENCY_4]
                      //   ? 'danger'
                      //   : 
                      'primary'
                    }
                    onClick={() => {
                      onStablesAdd()
                    }}
                    disabled={
                      !stableAddValid
                    }
                  >
                    Supply Stable Liquidity
                  </Button>))}
            </AutoColumn>

          </AutoColumn>

        </CardBody>
      </AppBody>
    </Page>
  )
}
