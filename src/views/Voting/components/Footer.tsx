import React from 'react'
import { Box, Button, Text, Heading, ProposalIcon, Flex } from '@pancakeswap/uikit'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useTranslation } from 'contexts/Localization'
import Container from 'components/Layout/Container'
import DesktopImage from './DesktopImage'

const StyledFooter = styled(Box)`
  background: ${({ theme }) => theme.colors.gradients.bubblegum};
  padding-bottom: 32px;
  padding-top: 32px;
`

const Footer = () => {
  const { t } = useTranslation()

  return (
    <StyledFooter>
      <Container>
        <Flex alignItems="center" justifyContent="space-between"></Flex>
      </Container>
    </StyledFooter>
  )
}

export default Footer
