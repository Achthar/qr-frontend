/* eslint react/jsx-boolean-value: 0 */
import React from 'react'

import styled from 'styled-components'
import { RowBetween } from '../Layout/Row'
import { PercentageInput } from './PercentageInput'

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
  border-color:black;
  margin-right:2px;
  position: relative;
  border-radius: 17px;
  background-color: ${({ theme }) => theme.colors.background};
  z-index: 1;
  width: ${(props) => props.width}
`
const Container = styled.div<{ hideInput: boolean, onHover: boolean, borderRadius:string }>`
  border-radius: ${(props) => props.borderRadius};
  background-color: ${({ theme }) => theme.colors.input};
  box-shadow: ${({ theme }) => theme.shadows.inset};
  &:hover 
  ${({ onHover }) => (onHover ? '{ outline: 1px solid black; border-color: solid black; }' : '')}
`
interface PercentageInputPanelProps {
  borderRadius: string
  width: string
  value: string
  onUserInput: (value: string) => void
  label?: string
  id: string
  onHover?: boolean
  alignInput?: 'left'|'right'
}

export default function PercentageInputPanel({
  borderRadius = '13px',
  width,
  value,
  onUserInput,
  label,
  id,
  onHover = false,
  alignInput = 'left'
}: PercentageInputPanelProps) {
  return (
    <InputPanel id={id} width={width}>
      <Container hideInput={false} onHover={onHover} borderRadius={borderRadius}>

        <RowBetween>
          <LabelRow >
            {label}
          </LabelRow>

        </RowBetween>
        <InputRow style={{ padding: '0px', borderRadius: '8px', alignItems: 'center' }} selected={true}>
          <>
            <PercentageInput
              style={{ paddingLeft: 30 }}
              className="token-amount-input"
              value={value}
              onUserInput={(val) => {
                onUserInput(val)
              }}
              align={alignInput}
            />
          </>


        </InputRow>
      </Container>
    </InputPanel >
  )
}
