/* eslint react/no-children-prop: 0 */
import React, { useMemo } from 'react'
import styled from 'styled-components'
import PageSection from 'components/PageSection'
import { useWeb3React } from '@web3-react/core'
import useTheme from 'hooks/useTheme'
import Container from 'components/Layout/Container'
import { Text, Step, Stepper, Card, CardBody, Image } from '@pancakeswap/uikit'
import { Status } from '@pancakeswap/uikit/src/components/Stepper/types'
import ReactDom from 'react-dom'

import ReactMarkdown from 'react-markdown'
// import * as fs from 'fs';
// import { readFile } from 'fs'
// import { swapSectionData, earnSectionData, cakeSectionData } from './components/SalesSection/data'
// import MetricsSection from './components/MetricsSection'
// import SalesSection from './components/SalesSection'
// import FarmsPoolsRow from './components/FarmsPoolsRow'
// import Footer from './components/Footer'
// import CakeDataRow from './components/CakeDataRow'
import Row from 'components/Row'
import Column from 'components/Column'

import { WedgeTopLeft, InnerWedgeWrapper, OuterWedgeWrapper, WedgeTopRight, WedgeBottomRight } from './components/WedgeSvgs'
// import { AlignCenter } from 'react-feather'
// import Hero from 'views/Ifos/components/Hero'



const Home: React.FC = () => {
  const { theme } = useTheme()
  const { account, chainId } = useWeb3React()


  const HomeSectionContainerStyles = { margin: '5px', width: '100%', maxWidth: '1000px' }
  const StyledBackIcon = styled.div`
  background-image: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/requiem/REQT_large.png';
  width: 500px;
  zindex: 5;
  opacity: 1;

`;


  const headers = ['Swap', 'Stable Swap', 'Lending', 'Margin Trading']
  const steps = ['Regular product based swap structure is implemented',
    'Stable swap liquidity is set up, trading and integration with product structure to come.',
    'Lending and collateralizable liquidity', 'Leveraged trading - trade loan and collateral positions directly on Requiem DEX'];
  const status: Status[] = ["past", "current", "future", "future"];

  return (


    <>

      <PageSection innerProps={{ style: { margin: '0', width: '100%' } }} index={2} hasCurvedDivider={false}>
        <Container width='100%' maxWidth='1000px'>

          <PageSection
            innerProps={{ style: HomeSectionContainerStyles }}
            background={theme.colors.background}
            index={2}
            hasCurvedDivider
          >
            <OuterWedgeWrapper>
              <InnerWedgeWrapper top fill='#FFFAF0'>
                <WedgeTopLeft height='30px' />

              </InnerWedgeWrapper>

            </OuterWedgeWrapper>
            <Row align='space-between'>
              <Column>
                <Text fontSize="70px" bold >
                  Requiem</Text>
                <Text fontSize="70px" bold>
                  Finance</Text>
              </Column>
              <Image src='https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/requiem/REQT_transparent.png' width={300} height={240} alt="REQT" />

            </Row>
          </PageSection>

          <Stepper>
            {steps.map((step, index) => (
              <Step key={step} index={index} status={status[index]} >
                <Card>
                  <CardBody>
                    <Text fontSize='24px' textTransform="capitalize" bold>{headers[index]}</Text>
                    {step}
                  </CardBody>
                </Card>
              </Step>
            ))}
          </Stepper>

          <PageSection
            innerProps={{ style: HomeSectionContainerStyles }}
            background={theme.colors.background}
            index={2}
            hasCurvedDivider
          >
            <OuterWedgeWrapper>
              <InnerWedgeWrapper top fill='#FFFAF0'>
                <WedgeBottomRight height='30px' />

              </InnerWedgeWrapper>

            </OuterWedgeWrapper>
          </PageSection>

        </Container>


        {/* <ReactMarkdown children={getText()} /> */}


        {/*
      <PageSection
        innerProps={{ style: HomeSectionContainerStyles }}
        background={theme.colors.background}
        index={2}
        hasCurvedDivider={false}
      >
        <OuterWedgeWrapper>
          <InnerWedgeWrapper top fill={theme.isDark ? '#201335' : '#D8CBED'}>
            <WedgeTopLeft />
          </InnerWedgeWrapper>
        </OuterWedgeWrapper>
        <SalesSection {...swapSectionData} />
      </PageSection>
      <PageSection
        innerProps={{ style: HomeSectionContainerStyles }}
        index={2}
        hasCurvedDivider={false}
      >
        <OuterWedgeWrapper>
          <InnerWedgeWrapper width="150%" top fill={theme.colors.background}>
            <WedgeTopRight />
          </InnerWedgeWrapper>
        </OuterWedgeWrapper>
        <SalesSection {...earnSectionData} />
        <FarmsPoolsRow {...chainId} />
      </PageSection>
      <PageSection
        innerProps={{ style: HomeSectionContainerStyles }}
        background={theme.colors.background}
        index={2}
        hasCurvedDivider={false}
      >
        <SalesSection {...cakeSectionData} />
        <CakeDataRow />
      </PageSection> */}
      </PageSection>
    </>
  )
}

export default Home
