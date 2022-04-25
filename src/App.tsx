import React, { lazy, useCallback } from 'react'
import { Router, Redirect, Route, Switch } from 'react-router-dom'
import { ResetCSS } from '@requiemswap/uikit'
import BigNumber from 'bignumber.js'
import useEagerConnect from 'hooks/useEagerConnect'
import { usePollBlockNumber } from 'state/block/hooks'
import { DatePickerPortal } from 'components/DatePicker'
import Popups from 'components/Popups'
import SuspenseWithChunkError from './components/SuspenseWithChunkError'
import { ToastListener } from './contexts/ToastsContext'
import PageLoader from './components/Loader/PageLoader'

import history from './routerHistory'
// Views included in the main bundle
// import Swap from './views/Swap' // weighted + stable
import SwapV3 from './views/SwapV3' // uniswapv2 + stable


import {
  RedirectDuplicateTokenIds,
  RedirectToAddLiquidity,
} from './views/AddLiquidity/redirects'

import CustomMenu from './CustomNav'
import CustomNav from './CustomMenu'
import Balances from './Balances'
import GlobalStyle from './style/Global'

// Route-based code splitting
// Only pool is included in the main bundle because of it's the most visited page
const Home = lazy(() => import('./views/Home'))
// const Balances = lazy(() => import('./views/Balances'))
const Bonds = lazy(() => import('./views/Bonds'))
const Farms = lazy(() => import('./views/Farms'))
const NotFound = lazy(() => import('./views/NotFound'))
const AddLiquidity = lazy(() => import('./views/AddLiquidity'))
const Governance = lazy(() => import('./views/Governance'))
const GovernanceAb = lazy(() => import('./views/Governance-AB'))
const AddStableLiquidity = lazy(() => import('./views/AddStableLiquidity'))
const Liquidity = lazy(() => import('./views/Pool/poolList'))
const WeightedPairFinder = lazy(() => import('./views/PoolFinder/weightedPairFinder'))
const RemoveLiquidity = lazy(() => import('./views/RemoveLiquidity'))
const RemoveStableLiquidity = lazy(() => import('./views/RemoveStableLiquidity'))

// This config is required for number formatting
BigNumber.config({
  EXPONENTIAL_AT: 1000,
  DECIMAL_PLACES: 80,
})

const App: React.FC = () => {
  usePollBlockNumber()
  useEagerConnect()

  return (
    <Router history={history}>
      <ResetCSS />
      <GlobalStyle />
      {/* <CustomMenu /> */}
      <video id="background-video" autoPlay loop muted poster="https://requiem-finance.s3.eu-west-2.amazonaws.com/background/fractalStatic.jpg">
        <source src="https://requiem-finance.s3.eu-west-2.amazonaws.com/background/fractal2.0.mp4" type="video/mp4" />
      </video>
      <SuspenseWithChunkError fallback={<PageLoader />}>
        <Popups />
        {/* <Web3ReactManager> */}

        <Switch>
          <Route path="/" exact>
            <Home />
          </Route>
          {/* Using this format because these components use routes injected props. We need to rework them with hooks */}
          <Route exact strict path="/:chain/farms" component={Farms} />
          <Route exact strict path="/:chain/bonds" component={Bonds} />
          <Route exact strict path="/:chain/exchange" component={SwapV3} />
          <Route exact strict path="/:chain/find" component={WeightedPairFinder} />
          <Route exact strict path="/:chain/liquidity" component={Liquidity} />
          <Route exact strict path="/create" component={RedirectToAddLiquidity} />
          <Route exact path="/:chain/add" component={AddLiquidity} />
          <Route exact path="/:chain/governance" component={Governance} />
          <Route exact path="/:chain/governance-ab" component={GovernanceAb} />
          <Route exact path="/:chain/add/stables" component={AddStableLiquidity} />
          <Route exact path="/:chain/add/:weightA-:currencyIdA/:weightB-:currencyIdB/:fee" component={RedirectDuplicateTokenIds} />
          <Route exact path="/:chain/create" component={AddLiquidity} />
          <Route exact path="/:chain/create/:currencyIdA/:currencyIdB" component={RedirectDuplicateTokenIds} />
          <Route exact strict path="/:chain/remove/:weightA-:currencyIdA/:weightB-:currencyIdB/:fee" component={RemoveLiquidity} />
          <Route exact path="/:chain/remove/stables" component={RemoveStableLiquidity} />
          {/* Redirect */}
          <Route path="/pool">
            <Redirect to="/:chain/liquidity" />
          </Route>

          {/* 404 */}
          <Route component={NotFound} />
        </Switch>
        <Balances />
        {/* </Web3ReactManager> */}
        <CustomNav />
      </SuspenseWithChunkError>
      <ToastListener />
      <DatePickerPortal />
    </Router>
  )
}

export default React.memo(App)
