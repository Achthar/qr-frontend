import React from 'react'
import styled from 'styled-components'
import { Flex } from '@requiemswap/uikit'
import Footer from 'components/Menu/Footer'

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 16px;
  padding-bottom: 0;
  margin-bottom: 100px;
  background: transparent;
  padding-top: 100px;
  ${({ theme }) => theme.mediaQueries.xs} {
    padding-top: 80px;
    background-size: auto;
  }

  ${({ theme }) => theme.mediaQueries.sm} {
    padding: 24px;
    padding-bottom: 0;
    padding-top: 100px;
  }
`

const Page: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => {
  return (
    <StyledPage {...props}>
      {children}
      <Flex flexGrow={1} />
      <Footer />
    </StyledPage>
  )
}

export default Page
