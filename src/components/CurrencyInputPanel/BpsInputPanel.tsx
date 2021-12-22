/* eslint react/jsx-boolean-value: 0 */
import React from 'react'
import { Token, StablePool, TokenAmount } from '@requiemswap/sdk'
import { Button, ChevronDownIcon, Text, useModal, Flex } from '@requiemswap/uikit'
import styled from 'styled-components'
import { useTranslation } from 'contexts/Localization'
import Column, { ColumnCenter, AutoColumn } from 'components/Column'
import { useNetworkState } from 'state/globalNetwork/hooks'
import Row from 'components/Row'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import CurrencySearchModal from '../SearchModal/CurrencySearchModal'
import { CurrencyLogo, DoubleCurrencyLogo } from '../Logo'

import { RowBetween } from '../Layout/Row'
import BpsInput from './BpsInput'

const InputRow = styled.div<{ selected: boolean }>`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  padding: ${({ selected }) => (selected ? '0.75rem 0.5rem 0.75rem 1rem' : '0.75rem 0.75rem 0.75rem 1rem')};
`

const LabelRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: left;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.75rem;
  line-height: 1rem;
  margin-left: 5px;
`
const InputPanel = styled.div<{ width: string }>`
  display: flex;
  flex-flow: column wrap;
  border-color:black;
  margin-right:2px;
  position: relative;
  border-radius: 17px;
  background-color: ${({ theme }) => theme.colors.background};
  z-index: 1;
  width: ${(props) => props.width}
`
const Container = styled.div<{ hideInput: boolean, onHover: boolean, borderRadius: string }>`
  border-radius: ${(props) => props.borderRadius};
  background-color: ${({ theme }) => theme.colors.input};
  box-shadow: ${({ theme }) => theme.shadows.inset};
  width: 80px;
  &:hover 
  ${({ onHover }) => (onHover ? '{ outline: 1px solid black; border-color: solid black; }' : '')}
`
interface BpsInputPanelProps {
  borderRadius: string
  width: string
  value: string
  onUserInput: (value: string) => void
  label?: string
  id: string
  onHover?: boolean

}

export default function BpsInputPanel({
  borderRadius = '13px',
  width,
  value,
  onUserInput,
  label,
  id,
  onHover = false
}: BpsInputPanelProps) {
  return (
    <InputPanel id={id} width={width}>
      <Container hideInput={false} onHover={onHover} borderRadius={borderRadius}>
        <Flex flexDirection="row" justifyContent='space-between' alignItems="center" grid-row-gap='10px'>
          <LabelRow >
            {label}
          </LabelRow>
          <BpsInput
            style={{ paddingLeft: 2, paddingRight: 2 }}
            className="fee-bps-input"
            value={value}
            onUserInput={(val) => {
              onUserInput(val)
            }}
            align="right"
          />
        </Flex>
      </Container>
    </InputPanel >
  )
}
