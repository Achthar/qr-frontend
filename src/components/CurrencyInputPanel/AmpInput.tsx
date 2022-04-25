/* eslint react/jsx-boolean-value: 0 */
import React from 'react'
import { Flex, Text } from '@requiemswap/uikit'
import styled from 'styled-components'
import MultiplierInput from './MultiplierInput'

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
  height: 40px;
  flex-flow: column wrap;
  border-color:black;
  margin-left:2px;
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
  width: 180px;
  &:hover 
  ${({ onHover }) => (onHover ? '{ outline: 1px solid black; border-color: solid black; }' : '')}
`
interface MultiplierInputPanelProps {
  borderRadius: string
  width: string
  value: string
  onUserInput: (value: string) => void
  label?: string
  id: string
  onHover?: boolean

}

export default function AmpInputPanel({
  borderRadius = '13px',
  width,
  value,
  onUserInput,
  label,
  id,
  onHover = false
}: MultiplierInputPanelProps) {
  return (
    <InputPanel id={id} width={width}>
      <Flex flexDirection="column" justifyContent='space-between' alignItems="center" grid-row-gap='10px'>
        <Container hideInput={false} onHover={onHover} borderRadius={borderRadius}>

          <Flex flexDirection="row" justifyContent='space-between' alignItems="center" grid-row-gap='10px'>
            <LabelRow >
              {label}
            </LabelRow>
            <MultiplierInput
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
        <Text fontSize='10px'>
          {`${Number(value) === 0 ? 1 : Number(value) / 10000}x Liquidity Amplification`}
        </Text>
      </Flex>
    </InputPanel >
  )
}
