import React, { useState, useRef, useEffect } from 'react'
import styled, { css } from 'styled-components'
import { ArrowDropDownIcon, Flex, Text } from '@requiemswap/uikit'
import { AmplifiedWeightedPair } from '@requiemswap/sdk'
import { AutoColumn } from 'components/Column'

const DropDownHeader = styled.div`
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0px 16px;
  box-shadow: ${({ theme }) => theme.shadows.inset};
  border: 1px solid ${({ theme }) => theme.colors.inputSecondary};
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.input};
  transition: border-radius 0.15s;
`

const DropDownListContainer = styled.div`
  min-width: 136px;
  height: 0;
  position: absolute;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.input};
  z-index: ${({ theme }) => theme.zIndices.dropdown};
  transition: transform 0.15s, opacity 0.15s;
  transform: scaleY(0);
  transform-origin: top;
  opacity: 0;
  width: 100%;

  ${({ theme }) => theme.mediaQueries.sm} {
    min-width: 168px;
  }
`

const DropDownContainerSingle = styled.div<{ width: string; height: string }>`
  cursor: pointer;
  width: ${({ width }) => width};
  position: relative;
  background: ${({ theme }) => theme.colors.input};
  border-radius: 16px;
  height: ${({ height }) => height};
  min-width: 136px;
  user-select: none;

  ${({ theme }) => theme.mediaQueries.sm} {
    min-width: 168px;
  }

  svg {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
  }
`

const DropDownContainer = styled.div<{ isOpen: boolean; width: string; height: string }>`
  cursor: pointer;
  width: ${({ width }) => width};
  position: relative;
  background: ${({ theme }) => theme.colors.input};
  border-radius: 16px;
  height: ${({ height }) => height};
  min-width: 136px;
  user-select: none;

  ${({ theme }) => theme.mediaQueries.sm} {
    min-width: 168px;
  }

  ${(props) =>
    props.isOpen &&
    css`
      ${DropDownHeader} {
        border-bottom: 1px solid ${({ theme }) => theme.colors.inputSecondary};
        box-shadow: ${({ theme }) => theme.tooltip.boxShadow};
        border-radius: 16px 16px 0 0;
      }

      ${DropDownListContainer} {
        height: auto;
        transform: scaleY(1);
        opacity: 1;
        border: 1px solid ${({ theme }) => theme.colors.inputSecondary};
        border-top-width: 0;
        border-radius: 0 0 16px 16px;
        box-shadow: ${({ theme }) => theme.tooltip.boxShadow};
      }
    `}

  svg {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
  }
`

const DropDownList = styled.ul`
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  z-index: ${({ theme }) => theme.zIndices.dropdown};
`

const ListItem = styled.li`
  list-style: none;
  height: 50px;
  padding: 8px 16px;
  &:hover {
    background: ${({ theme }) => theme.colors.inputSecondary};
  }
`

export interface SelectProps {
  pairsAvailable: AmplifiedWeightedPair[];
  setPair: (ampPair: AmplifiedWeightedPair) => void;
}


export interface PairLabelProps {
  pairData: AmplifiedWeightedPair
}

const PairLabel: React.FunctionComponent<PairLabelProps> = ({ pairData }) => {
  return (<>
    <Flex flexDirection="row" justifyContent='space-between' alignItems="center" grid-row-gap='10px' marginRight='5px' marginLeft='5px'>
      <AutoColumn>
        <Text fontSize='13px' width='100px'>
          {`${pairData.token0.symbol} ${pairData.weight0.toString()}%`}
        </Text>
        <Text fontSize='13px' width='100px'>
          {`${pairData.token1.symbol} ${pairData.weight1.toString()}%`}
        </Text>
      </AutoColumn>
      <AutoColumn>
        <Text fontSize='13px' width='100px' marginLeft='10px' marginRight='10px'>
          {`Fee ${pairData.fee0.toString()}Bps`}
        </Text>
        <Text fontSize='13px' width='100px' marginLeft='10px' marginRight='10px'>
          {`Amp ${Number(pairData.amp.toString()) / 10000}x`}
        </Text>
      </AutoColumn>
    </Flex>
  </>
  )
}


const PairSelect: React.FunctionComponent<SelectProps> = ({ setPair, pairsAvailable }) => {
  const containerRef = useRef(null)
  const dropdownRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  const toggling = (event: React.MouseEvent<HTMLDivElement>) => {
    setIsOpen(!isOpen)
    event.stopPropagation()
  }

  const onOptionClicked = (selectedIndex: number) => () => {
    setSelectedOptionIndex(selectedIndex)
    setIsOpen(false)

    if (setPair) {
      setPair(pairsAvailable[selectedIndex])
    }
  }

  useEffect(
    () => {
      setContainerSize({
        width: dropdownRef?.current?.offsetWidth, // Consider border
        height: dropdownRef?.current?.offsetHeight,
      })

      const handleClickOutside = () => {
        setIsOpen(false)
      }

      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    }, [])

  if (pairsAvailable.length === 1) {
    return (
      <DropDownContainerSingle width='400px' height='40px'>
        {containerSize.width !== 0 && (
          <DropDownHeader onClick={() => { return setPair(pairsAvailable[0]) }}>
            {pairsAvailable[0] && (<PairLabel pairData={pairsAvailable[0]} />)}
          </DropDownHeader>
        )}
      </DropDownContainerSingle>
    )
  }

  return (
    <DropDownContainer isOpen={isOpen} ref={containerRef} width='400px' height='40px'>
      {containerSize.width !== 0 && (
        <DropDownHeader onClick={toggling}>
          {pairsAvailable[selectedOptionIndex] && (<PairLabel pairData={pairsAvailable[selectedOptionIndex]} />)}
        </DropDownHeader>
      )}
      <ArrowDropDownIcon color="text" onClick={toggling} />
      <DropDownListContainer>
        <DropDownList ref={dropdownRef}>
          {pairsAvailable.map((option, index) =>
            index !== selectedOptionIndex ? (
              <ListItem onClick={onOptionClicked(index)} key={String(option.weight0)}>
                <PairLabel pairData={option} />
              </ListItem>
            ) : null,
          )}
        </DropDownList>
      </DropDownListContainer>
    </DropDownContainer>
  )
}

export default PairSelect
