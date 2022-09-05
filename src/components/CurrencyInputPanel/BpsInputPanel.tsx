/* eslint react/jsx-boolean-value: 0 */
import React from 'react'
import {Flex } from '@requiemswap/uikit'
import styled from 'styled-components'
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
const Container = styled.div<{ hideInput: boolean, hoverActive: boolean, borderRadius: string }>`
  border-radius: ${(props) => props.borderRadius};
  background-color: ${({ theme }) => theme.colors.input};
  box-shadow: ${({ theme }) => theme.shadows.inset};
  width: 100px;
  &:hover 
  ${({ hoverActive }) => (hoverActive ? '{ outline: 1px solid black; border-color: solid black; }' : '')}
`
interface BpsInputPanelProps {
  borderRadius: string
  width: string
  value: string
  onUserInput: (value: string) => void
  label?: string
  id: string
  hoverActive?: boolean

}

export default function BpsInputPanel({
  borderRadius = '13px',
  width,
  value,
  onUserInput,
  label,
  id,
  hoverActive = false
}: BpsInputPanelProps) {
  return (
    <InputPanel id={id} width={width}>
      <Container hideInput={false} hoverActive={hoverActive} borderRadius={borderRadius}>
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
