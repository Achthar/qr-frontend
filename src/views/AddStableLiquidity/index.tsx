import React, { useEffect, useMemo, useState } from 'react'
import {
  TokenAmount,
  STABLE_POOL_ADDRESS,
  STABLES_INDEX_MAP,
} from '@requiemswap/sdk'
import {
  Button,
  CardBody,
  useMatchBreakpoints,
} from '@requiemswap/uikit'
import { useTranslation } from 'contexts/Localization'
import { RouteComponentProps, Link } from 'react-router-dom'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { LightCard } from 'components/Card'
import getChain from 'utils/getChain'
import { AutoColumn } from 'components/Layout/Column'
import { DAI, REQT } from 'config/constants/tokens'
import CurrencyInputPanelStable from 'components/CurrencyInputPanel/CurrencyInputPanelStable'
import { AppHeader, AppBody } from 'components/App'
import Row, { RowBetween } from 'components/Layout/Row'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { StablesField } from 'state/mintStables/actions'
import { useDeserializedStablePools, useStablePools } from 'state/stablePools/hooks'
import { fetchStablePoolData } from 'state/stablePools/fetchStablePoolData'
import { fetchStablePoolUserDataAsync } from 'state/stablePools'
import { useAppDispatch } from 'state'
import { useGetStablePoolState } from 'hooks/useGetStablePoolState'
import useRefresh from 'hooks/useRefresh'
import { useDerivedMintStablesInfo, useMintStablesActionHandlers, useMintStablesState } from 'state/mintStables/hooks'
import { ButtonStableApprove } from 'components/Button'
import { useTransactionAdder } from 'state/transactions/hooks'
import { getStableAmounts, useGasPrice, useIsExpertMode, useUserBalances, useUserSlippageTolerance } from 'state/user/hooks'
import { calculateGasMargin, calculateSlippageAmount, getStableRouterContract } from 'utils'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import Dots from 'components/Loader/Dots'

import ConnectWalletButton from 'components/ConnectWalletButton'
import { useStablePool } from 'hooks/useStablePool'
import StablePoolPriceBar from './StablePoolPriceBar'
import Page from '../Page'

export default function AddStableLiquidity({
  match: {
    params: { chain },
  },
  history,
}: RouteComponentProps<{ chain: string }>) {
  const { account, chainId, library } = useActiveWeb3React("AL")
  const { t } = useTranslation()
  const gasPrice = useGasPrice(chainId)

  useEffect(() => {
    const _chain = chain ?? getChain(chainId)
    history.push(`/${_chain}/add/stables`)

  },
    [chainId, chain, history],
  )

  const expertMode = useIsExpertMode()

  // modal and loading
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // txn values
  const deadline = useTransactionDeadline(chainId) // custom from users settings
  const [allowedSlippage] = useUserSlippageTolerance() // custom from users
  const [txHash, setTxHash] = useState<string>('')


  const addTransaction = useTransactionAdder()

  // mint state
  const { typedValue1, typedValue2, typedValue3, typedValue4 } = useMintStablesState()

  // we separate loading the stablepool to avoid rerendering on every input
  const { slowRefresh } = useRefresh()


  const { stablePools, stableAmounts, userDataLoaded, publicDataLoaded } = useGetStablePoolState(chainId, account, slowRefresh, slowRefresh)
  const stablePool = stablePools[0]



  const {
    stableCurrencies,
    stablesCurrencyBalances,
    parsedStablesAmounts,
    stablesLiquidityMinted,
    stablesPoolTokenPercentage,
    stablesError,
  } = useDerivedMintStablesInfo(stablePool, publicDataLoaded, stableAmounts, account)

  const formattedStablesAmounts = {
    [StablesField.CURRENCY_1]: parsedStablesAmounts[StablesField.CURRENCY_1],
    [StablesField.CURRENCY_2]: parsedStablesAmounts[StablesField.CURRENCY_2],
    [StablesField.CURRENCY_3]: parsedStablesAmounts[StablesField.CURRENCY_3],
    [StablesField.CURRENCY_4]: parsedStablesAmounts[StablesField.CURRENCY_4],
  }

  const { onField1Input, onField2Input, onField3Input, onField4Input } = useMintStablesActionHandlers()

  const [approval1, approve1Callback] = useApproveCallback(
    chainId,
    account,
    formattedStablesAmounts[StablesField.CURRENCY_1].greaterThan('0') ?
      formattedStablesAmounts[StablesField.CURRENCY_1] :
      new TokenAmount(formattedStablesAmounts[StablesField.CURRENCY_1].token, '1'),
    STABLE_POOL_ADDRESS[chainId],
  )
  const [approval2, approve2Callback] = useApproveCallback(
    chainId,
    account,
    formattedStablesAmounts[StablesField.CURRENCY_2].greaterThan('0') ?
      formattedStablesAmounts[StablesField.CURRENCY_2] :
      new TokenAmount(formattedStablesAmounts[StablesField.CURRENCY_2].token, '1'),
    STABLE_POOL_ADDRESS[chainId],
  )
  const [approval3, approve3Callback] = useApproveCallback(
    chainId,
    account,
    formattedStablesAmounts[StablesField.CURRENCY_3].greaterThan('0') ?
      formattedStablesAmounts[StablesField.CURRENCY_3] :
      new TokenAmount(formattedStablesAmounts[StablesField.CURRENCY_3].token, '1'),
    STABLE_POOL_ADDRESS[chainId],
  )
  const [approval4, approve4Callback] = useApproveCallback(
    chainId,
    account,
    formattedStablesAmounts[StablesField.CURRENCY_4].greaterThan('0') ?
      formattedStablesAmounts[StablesField.CURRENCY_4] :
      new TokenAmount(formattedStablesAmounts[StablesField.CURRENCY_4].token, '1'),
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

  const atMaxAmountsStables: { [field in StablesField]?: StablesField } = [
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

  const { isMobile } = useMatchBreakpoints()

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
        <Button
          as={Link}
          to={`/${getChain(chainId)}/add/80-${REQT[chainId].address}/20-${DAI[chainId].address}/25`}
          variant="secondary"
          width="100%"
          mb="8px"
        >
          Pairs
        </Button>
        <Button
          as={Link}
          to={`/${getChain(chainId)}/add/stables`}
          variant="primary"
          width="100%"
          mb="8px"
        >
          Stables
        </Button>
      </Row>
      <AppBody>
        <AppHeader
          chainId={chainId}
          account={account}
          title='Add Stablecoin Liquidity'
          subtitle='Receive collateralizable StableSwap LP Tokens'

          helper={t(
            'Liquidity providers earn a 0.01% trading fee on all trades made through the pool, proportional to their share of the liquidity pool.',
          )}
          backTo={`/${getChain(chainId)}/liquidity`}
        />
        <CardBody>

          <AutoColumn gap="5px">
            <Row align='center'>
              <CurrencyInputPanelStable
                chainId={chainId}
                account={account}
                width={account && approval1 !== ApprovalState.APPROVED ? isMobile ? '100px' : '300px' : '100%'}
                value={typedValue1}
                onUserInput={onField1Input}
                onMax={() => {
                  onField1Input(maxAmountsStables[StablesField.CURRENCY_1]?.toExact() ?? '')
                }}
                showMaxButton={!atMaxAmountsStables[StablesField.CURRENCY_1]}
                stableCurrency={STABLES_INDEX_MAP[chainId][0]}
                balances={balances}
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
                chainId={chainId}
                account={account}
                width={account && approval2 !== ApprovalState.APPROVED ? isMobile ? '100px' : '300px' : '100%'}
                value={typedValue2}
                onUserInput={onField2Input}
                onMax={() => {
                  onField2Input(maxAmountsStables[StablesField.CURRENCY_2]?.toExact() ?? '')
                }}
                showMaxButton={!atMaxAmountsStables[StablesField.CURRENCY_2]}
                stableCurrency={STABLES_INDEX_MAP[chainId][1]}
                balances={balances}
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
                chainId={chainId}
                account={account}
                width={account && approval3 !== ApprovalState.APPROVED ? isMobile ? '100px' : '300px' : '100%'}
                value={typedValue3}
                onUserInput={onField3Input}
                onMax={() => {
                  onField3Input(maxAmountsStables[StablesField.CURRENCY_3]?.toExact() ?? '')
                }}
                showMaxButton={!atMaxAmountsStables[StablesField.CURRENCY_3]}
                stableCurrency={STABLES_INDEX_MAP[chainId][2]}
                balances={balances}
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
                chainId={chainId}
                account={account}
                width={account && approval4 !== ApprovalState.APPROVED ? isMobile ? '100px' : '300px' : '100%'}
                value={typedValue4}
                onUserInput={onField4Input}
                onMax={() => {
                  onField4Input(maxAmountsStables[StablesField.CURRENCY_4]?.toExact() ?? '')
                }}
                showMaxButton={!atMaxAmountsStables[StablesField.CURRENCY_4]}
                stableCurrency={STABLES_INDEX_MAP[chainId][3]}
                balances={balances}
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
                    variant='primary'

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
