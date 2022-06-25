import styled from 'styled-components'

export const ActionContainer = styled.div`
  padding: 4px;
  border: 2px solid ${({ theme }) => theme.colors.input};
  border-radius: 16px;
  flex-grow: 1;
  flex-basis: 0;
  margin-bottom: 16px;

  ${({ theme }) => theme.mediaQueries.sm} {
    margin-left: 5px;
    margin-right: 5px;
    margin-bottom: 5;
    max-height: 100px;
  }

  ${({ theme }) => theme.mediaQueries.xl} {
    margin-left: 48px;
    margin-right: 0;
    margin-bottom: 5;
    max-height: 100px;
  }
`

export const BondActionContainer = styled.div<{ isMobile: boolean }>`
  padding: 16px;
  width: ${({ isMobile }) => isMobile ? '90%' : '80%'};
  border: 2px solid ${({ theme }) => theme.colors.input};
  border-radius: 16px;
  flex-grow: 1;
  flex-basis: 0;
  margin-bottom: 16px;

  ${({ theme }) => theme.mediaQueries.sm} {
    max-height: 110px;
  }

  ${({ theme }) => theme.mediaQueries.xl} {

    max-height: 110px;
  }
`

export const ActionTitles = styled.div` 
height:40px;
  display: flex;
`

export const ActionContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`
