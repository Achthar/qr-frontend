import { Currency, Token } from '@requiemswap/sdk'
import { Flex } from '@requiemswap/uikit'
import { AutoColumn } from 'components/Column'
import Row from 'components/Row'
import React from 'react'
import styled from 'styled-components'

import { sliceIntoChunks } from 'utils/arraySlicer'
import CurrencyLogo from './CurrencyLogo'

const Wrapper = styled.div<{ margin: boolean }>`
  display: flex;
  justify-content: center;
  flex-direction: row;
  margin-right: ${({ margin }) => margin && '4px'}
  aspect-ratio: 1;
`

interface PoolLogoProps {
  margin?: boolean
  size?: number
  tokens?: Token[]
  tokensInRow?: number
  overlap?: string
  width?: string
}

export default function PoolLogo({
  tokens,
  size = 20,
  margin = false,
  tokensInRow = 2,
  overlap = '-7px',
  width = '100%'
}: PoolLogoProps) {
  const chainId = tokens?.[0].chainId ?? 43113
  const chunks = tokens && sliceIntoChunks(tokens, tokensInRow)

  return (
    <AutoColumn style={{ width: `${width}` }}>
      {chunks.map((ts, rowIndex) => {

        return (
          <Wrapper margin={margin}>
            <Flex alignContent='center' justifyContent='center'>
              {ts && ts.map((t, colIndex) => {
                return (
                  <CurrencyLogo chainId={chainId} currency={t} size={`${size.toString()}px`}
                    style={
                      { marginLeft: colIndex === 0 ? '0px' : overlap, marginTop: rowIndex === 0 ? '0px' : overlap }
                    } />
                )
              })}
            </Flex>
          </Wrapper>
        )
      })}
    </AutoColumn>
  )
}
