import React from 'react'
import styled from 'styled-components'
import { Card } from '@requiemswap/uikit'

export const BodyWrapper = styled(Card) <{ isMobile: boolean }>`
  border-radius: 24px;
  max-width: ${({ isMobile }) => isMobile ? '436px' : '950px'};
  width: 100%;
  z-index: 1;
  background: rgba(15, 15, 15, 0.5);
`

/**
 * The styled container element that wraps the content of most pages and the tabs.
 */
export default function GeneralAppBody({ children, isMobile }: { children: React.ReactNode, isMobile: boolean }) {
  return <BodyWrapper isMobile={isMobile} background=''>{children}</BodyWrapper>
}
