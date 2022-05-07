/* eslint react/jsx-boolean-value: 0 */
import React from 'react'
import { Token, StablePool, TokenAmount } from '@requiemswap/sdk'
import { Button, ChevronDownIcon, Text, useModal, Flex } from '@requiemswap/uikit'
import styled from 'styled-components'
import { useTranslation } from 'contexts/Localization'
import Column, { ColumnCenter, AutoColumn } from 'components/Column'
import { useNetworkState } from 'state/globalNetwork/hooks'
import Row from 'components/Row'
import { CurrencyLogo, DoubleCurrencyLogo } from '../Logo'

import { RowBetween } from '../Layout/Row'
import { Input as NumericalInput } from './NumericalInput'

const InputRow = styled.div<{ selected: boolean }>`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  padding: ${({ selected }) => (selected ? '0.75rem 0.5rem 0.75rem 1rem' : '0.75rem 0.75rem 0.75rem 1rem')};
`

const LabelRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: right;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.75rem 1rem 0 1rem;
`
const InputPanel = styled.div<{ width: string }>`
  display: flex;
  flex-flow: column wrap;
  position: relative;
  border-radius: 17px;
  background-color: ${({ theme }) => theme.colors.background};
  z-index: 1;
  width: ${(props) => props.width}
`
const Container = styled.div<{ hideInput: boolean, onHover: boolean, isTop: boolean, isBottom: boolean }>`
  border-top-left-radius: ${({ isTop }) => isTop ? '16px' : '0px'};
  border-top-right-radius: ${({ isTop }) => isTop ? '16px' : '0px'};
  border-bottom-left-radius: ${({ isBottom }) => isBottom ? '16px' : '0px'};
  border-bottom-right-radius: ${({ isBottom }) => isBottom ? '16px' : '0px'};
  background-color: ${({ theme }) => theme.colors.input};
  box-shadow: ${({ theme }) => theme.shadows.inset};
  &:hover 
  ${({ onHover }) => (onHover ? '{ outline: 1px solid black; border-color: solid black; }' : '')}
`
interface CurrencyInputPanelStable {
  width: string
  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
  showMaxButton: boolean
  label?: string
  stableCurrency: Token
  hideBalance?: boolean
  stablePool?: StablePool | null
  hideInput?: boolean
  chainId: number
  account: string
  balances: { [address: string]: TokenAmount }
  id: string
  showCommonBases?: boolean
  onHover?: boolean
  isTop?: boolean
  isBottom?: boolean

}

export default function CurrencyInputPanelStable({
  width,
  value,
  onUserInput,
  onMax,
  showMaxButton,
  label,
  stableCurrency,
  balances,
  chainId,
  account,
  hideBalance = false,
  stablePool = null, // used for double token logo
  hideInput = true,
  id,
  onHover = false,
  isTop = true,
  isBottom = true
}: CurrencyInputPanelStable) {

  const selectedCurrencyBalance = balances[stableCurrency?.address] ?? undefined // useCurrencyBalance(chainId, account ?? undefined, stableCurrency ?? undefined)

  return (
    <InputPanel id={id} width={width}>
      <Container hideInput={false} onHover={onHover} isTop={isTop} isBottom={isBottom}>

        <RowBetween>
          <LabelRow >
            {!hideBalance && account && (
              <Text onClick={onMax} fontSize="13px" style={{ display: 'inline', cursor: 'pointer' }} ml='215px' textAlign='right'>
                {!hideBalance && !!stableCurrency && selectedCurrencyBalance
                  ? `Balance: ${Number(selectedCurrencyBalance?.toSignificant(8)).toLocaleString() ?? ''}`
                  : ' -'}
              </Text>)
              // ): account && (<Text onClick={onMax} fontSize="14px" style={{ display: 'inline', cursor: 'pointer' }} ml='50px'/>)
            }
          </LabelRow>

        </RowBetween>
        <InputRow style={{ padding: '0px', borderRadius: '8px', alignItems: 'center' }} selected={true}>
          <>
            <NumericalInput
              style={{ paddingLeft: 30 }}
              className="token-amount-input"
              value={value}
              onUserInput={(val) => {
                onUserInput(val)
              }}
              align="left"
            />
            {account && stableCurrency && showMaxButton && label !== 'To' && (
              <Button onClick={onMax} scale="sm" variant="text">
                MAX
              </Button>
            )}
            <Flex alignItems="center" justifyContent="space-between" paddingRight={30}>
              {stablePool ? (
                <Row>
                  <AutoColumn gap="4px">
                    <DoubleCurrencyLogo chainId={chainId} currency0={stablePool.tokens[0]} currency1={stablePool.tokens[1]} size={20} margin />
                    <DoubleCurrencyLogo chainId={chainId} currency0={stablePool.tokens[2]} currency1={stablePool.tokens[3]} size={20} margin />
                  </AutoColumn>
                  <Text mr='5px' width='30px' >Stable LP</Text>
                </Row>
              ) : stableCurrency ? (
                <Row>
                  <ColumnCenter >
                    <CurrencyLogo chainId={chainId} currency={stableCurrency} size="30px" style={{ marginRight: '8px', marginBottom: '8px' }} />
                  </ColumnCenter>
                  <Text mr='5px' width='30px'>{stableCurrency.symbol}</Text>
                </Row>
              ) : null}
            </Flex>
          </>


        </InputRow>
      </Container>
    </InputPanel >
  )
}
