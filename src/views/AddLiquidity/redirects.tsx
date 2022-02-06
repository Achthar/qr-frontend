import React from 'react'
import { Redirect, RouteComponentProps } from 'react-router-dom'
import AddLiquidity from './index'

export function RedirectToAddLiquidity() {
  return <Redirect to="/add/" />
}


export function RedirectDuplicateTokenIds(props: RouteComponentProps<{ chain: string, weightA: string, weightB, fee: string, currencyIdA?: string; currencyIdB?: string }>) {
  const {
    match: {
      params: { chain, currencyIdA, currencyIdB, weightA, weightB, fee },
    },
  } = props
  if (currencyIdA.toLowerCase() === currencyIdB.toLowerCase()) {
    return <Redirect to={`/${chain}/add/${currencyIdA}`} />
  }
  return <AddLiquidity {...props} />
}
