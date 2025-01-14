import React, { useEffect, useMemo, useState } from 'react'
import {
  NETWORK_CCY,
  TokenAmount,
  ZERO,
} from '@requiemswap/sdk'
import {
  Button,
  useMatchBreakpoints,
  Text,
  Box,
  Flex
} from '@requiemswap/uikit'
import { useDerivedMintPoolInfo, useMintPoolLpActionHandlers, useMintPoolState } from 'state/mintPoolLp/hooks'
import { useGetWeightedPoolState } from 'hooks/useGetWeightedPoolState'
import { useTranslation } from 'contexts/Localization'
import { RouteComponentProps, Link } from 'react-router-dom'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import getChain from 'utils/getChain'
import { AutoColumn } from 'components/Layout/Column'
import {  USDC } from 'config/constants/tokens'
import CurrencyInputPanelStable from 'components/CurrencyInputPanel/CurrencyInputPanelStable'
import { AppHeader} from 'components/App'
import Row from 'components/Layout/Row'
import { ApprovalState, useApproveCallbacks } from 'hooks/useApproveCallback'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import useRefresh from 'hooks/useRefresh'
import { ButtonStableApprove } from 'components/Button'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useGasPrice, useUserSlippageTolerance } from 'state/user/hooks'
import { calculateGasMargin, calculateSlippageAmount, getWeightedPoolContract } from 'utils'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import Dots from 'components/Loader/Dots'
import GeneralAppBody from 'components/App/GeneralAppBody'
import PoolData from 'components/PoolPriceBar'
import ConnectWalletButton from 'components/ConnectWalletButton'
import Page from '../Page'

export default function AddLiquidityToPool({
  match: {
    params: { chain },
  },
  history,
}: RouteComponentProps<{ chain: string }>) {
  const { account, chainId, library } = useActiveWeb3React()
  const { t } = useTranslation()
  const gasPrice = useGasPrice(chainId)

  useEffect(() => {
    const _chain = chain ?? getChain(chainId)
    history.push(`/${_chain}/add/weighted`)

  },
    [chainId, chain, history],
  )

  // modal and loading
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // txn values
  const deadline = useTransactionDeadline(chainId) // custom from users settings
  const [allowedSlippage] = useUserSlippageTolerance() // custom from users
  const [txHash, setTxHash] = useState<string>('')


  const addTransaction = useTransactionAdder()

  // mint state
  const { values } = useMintPoolState()

  // we separate loading the stablepool to avoid rerendering on every input
  const { slowRefresh } = useRefresh()


  const {
    weightedPools,
    userBalances,
    userDataLoaded,
    publicDataLoaded
  } = useGetWeightedPoolState(chainId, account, slowRefresh, slowRefresh)
  const pool = weightedPools[0]



  const {
    orderedUserBalances,
    parsedInputAmounts,
    poolLiquidityMinted,
    poolTokenPercentage,
    poolError,
  } = useDerivedMintPoolInfo(pool, publicDataLoaded, userBalances, account)

  const { onFieldInput } = useMintPoolLpActionHandlers()

  const tokens = pool?.tokens

  const { approvalStates, approveCallback, isLoading: approvalLoading } = useApproveCallbacks(
    chainId,
    library,
    account,
    tokens,
    parsedInputAmounts,
    pool?.address,

  )

  const apporvals = approvalStates



  // get the max amounts user can add
  const maxAmountsStables = orderedUserBalances?.map(balance => { return maxAmountSpend(chainId, balance) })

  const atMaxAmountsStables = maxAmountsStables?.map((mas, index) => { return mas?.equalTo(parsedInputAmounts[index] ?? '0') })


  const { isMobile } = useMatchBreakpoints()

  const balances: { [address: string]: TokenAmount } = orderedUserBalances ? Object.assign({}, ...orderedUserBalances?.map(b => { return { [b?.token.address]: b } })) : {}



  let stableAddValid = false
  let invalidAdd = false
  let apporvalsPending = true
  for (let i = 0; i < parsedInputAmounts?.length; i++) {
    stableAddValid = stableAddValid || !parsedInputAmounts[i]?.raw.eq(0)
    invalidAdd = invalidAdd || parsedInputAmounts[i]?.raw.gt(ZERO)
    apporvalsPending = apporvals[i] === ApprovalState.NOT_APPROVED || apporvals[i] === ApprovalState.PENDING
  }

  const summaryText = useMemo(() => `Add [${parsedInputAmounts?.map(x => x.toSignificant(8)).join(',')}] of ${parsedInputAmounts?.map(x => x.token.symbol).join('-')}`,
    [parsedInputAmounts]
  )

  async function onTokenAdd() {
    if (!chainId || !library || !account) return
    const poolContrat = getWeightedPoolContract(pool, library, account)

    if (invalidAdd && !deadline) {
      return
    }

    const amountMin = calculateSlippageAmount(poolLiquidityMinted, allowedSlippage)[0]

    const estimate = poolContrat.estimateGas.addLiquidityExactIn
    const method = poolContrat.addLiquidityExactIn
    const args = [
      parsedInputAmounts.map(bn => bn.raw.toHexString()),
      amountMin.toString(),
      account,
      deadline.toHexString(),
    ]
    const value = null

    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then((estimatedGasLimit) =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit),
          // gasPrice,
        }).then((response) => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary: summaryText,
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


  const bttm = useMemo(() => { return pool?.tokens.length - 1 }, [pool])

  return (
    <Page>
      <GeneralAppBody isMobile={isMobile}>
        <Row width='100%' height='50px' marginTop='3px'>
          <Button
            as={Link}
            to={`/${getChain(chainId)}/add/50-${NETWORK_CCY[chainId].symbol}/50-${USDC[chainId].address}`}
            variant="secondary"
            width="100%"
            mb="8px"
            style={{ borderTopRightRadius: '3px', borderBottomRightRadius: '3px', marginLeft: '3px', marginRight: '3px', marginBottom: '5px' }}
          >
            Pairs
          </Button>
          <Button
            as={Link}
            to={`/${getChain(chainId)}/add/stables`}
            variant="secondary"
            width="100%"
            mb="8px"
            style={{ borderRadius: '3px', marginLeft: '3px', marginRight: '3px', marginBottom: '5px' }}
          >
            Stables
          </Button>
          <Button
            variant="primary"
            width="100%"
            mb="8px"
            style={{ borderTopLeftRadius: '3px', borderBottomLeftRadius: '3px', marginLeft: '3px', marginRight: '3px', marginBottom: '5px' }}
          >
            Weighted
          </Button>
        </Row>
        <AppHeader
          chainId={chainId}
          account={account}
          title={`Add ${pool?.name ?? ''} Pool Liquidity`}
          subtitle={`Receive ${pool?.name ?? 'Weighted Pool'} LP Tokens`}

          helper={t(
            `Liquidity providers earn a ${Number(pool?.swapStorage.fee.toString()) / 1e8}% trading fee on all trades made through the pool, proportional to their share of the liquidity pool.`,
          )}
          backTo={`/${getChain(chainId)}/liquidity`}
        />
        <Flex flexDirection='row' justifyContent='space-between'>
          {!isMobile && (
            <Box marginLeft='10px' marginRight='10px' marginTop='20px'>
              <PoolData pool={pool} poolDataLoaded={publicDataLoaded} poolPercentage={poolTokenPercentage} parsedAmounts={parsedInputAmounts} fontsize='14px' width='350px' />
            </Box>
          )}

          <AutoColumn gap="5px">
            <Flex flexDirection='column' justifyContent='center' marginTop='20px'>
              {
                pool && parsedInputAmounts?.map(((amount, i) => {
                  return (
                    <Row
                      marginBottom='5px'
                      maxWidth={isMobile ? '100vw' : '350px'}
                      justify={isMobile ? '' : 'center'}
                      align={isMobile ? '' : 'center'}
                      key={`${amount.token.symbol}-row`}
                    >
                      <Flex
                        maxWidth={isMobile && account && approvalStates[i] !== ApprovalState.APPROVED ? '100vw' : '100%'}
                        minWidth={isMobile ? '88vw' : ''}
                        width={isMobile ? '88vw' : '350px'}
                      >
                        <CurrencyInputPanelStable
                          chainId={chainId}
                          account={account}
                          width={account && approvalStates[i] !== ApprovalState.APPROVED ? isMobile ? '100%' : '270px' : '100%'}
                          value={values?.[i]}
                          onUserInput={(val) => { return onFieldInput(val, i) }}
                          onMax={() => {
                            onFieldInput(maxAmountsStables[i]?.toExact() ?? '', i)
                          }}
                          showMaxButton={!atMaxAmountsStables[i]}
                          stableCurrency={pool.tokens[i]}
                          balances={balances}
                          id={`add-liquidity-input-${i}`}
                          isTop={i === 0}
                          isBottom={i === bttm}
                        />
                      </Flex>
                      {
                        account && (
                          approvalStates[i] !== ApprovalState.APPROVED && (
                            <ButtonStableApprove
                              onClick={() => approveCallback(i)}
                              disabled={approvalStates[i] === ApprovalState.PENDING}
                              width="75px"
                              minWidth="75px"
                              maxHeight={isMobile ? '60px' : '70px'}
                              height={isMobile ? '100%' : ''}
                              margin={isMobile ? '5px' : ''}
                              marginLeft={isMobile ? '-65vw' : "1px"}
                            >
                              <Text fontSize='12px' color='black'>
                                {approvalStates[i] === ApprovalState.PENDING ? (
                                  <Dots>{t('Enabling %asset%', { asset: amount.token.symbol })}</Dots>
                                ) : (
                                  !approvalLoading ? t('Enable %asset%', { asset: amount.token.symbol }) : <Dots>Loading allowance</Dots>
                                )
                                }
                              </Text>
                            </ButtonStableApprove>
                          ))
                      }
                    </Row>

                  )
                }))
              }
            </Flex>
            <AutoColumn gap="md" style={{ width: '95%' }}>
              {!account ? (<ConnectWalletButton align='center' maxWidth='100%' />)
                :
                (<Button
                  variant='primary'

                  onClick={() => {
                    onTokenAdd()
                  }}
                  disabled={
                    !stableAddValid || Boolean(poolError) || approvalLoading || apporvalsPending
                  }
                >

                  {approvalLoading ? <Dots>Fetching allowances</Dots> : apporvalsPending ? (<Dots >Approvals still pending</Dots>) : !poolError ? 'Supply Liquidity' : poolError}
                </Button>)}
            </AutoColumn>
            {isMobile && (
              <PoolData pool={pool} poolDataLoaded={publicDataLoaded} poolPercentage={poolTokenPercentage} parsedAmounts={parsedInputAmounts} fontsize='12px' width='95%' />
            )}
          </AutoColumn>
        </Flex>
      </GeneralAppBody>
    </Page>
  )
}
