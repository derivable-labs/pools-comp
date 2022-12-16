import React from 'react'
import './style.scss'
import { SwapTxType } from '../../state/wallet/type'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { TokenIcon } from '../ui/TokenIcon'
import { TokenSymbol } from '../ui/TokenSymbol'
import { useListTokens } from '../../state/token/hook'
import { formatWeiToDisplayNumber } from '../../utils/formatBalance'
import { formatDate, formatTime } from '../../utils/helpers'

export const WalletHistoryTable = ({ swapTxs }: {swapTxs: SwapTxType[]}) => {
  const { cToken } = useCurrentPool()
  const { tokens } = useListTokens()


  console.log(swapTxs)

  return (
    <div className='pool-table-wrap'>
      <table className='pool-table'>
        <thead>
          <tr>
            <th className='text-left'>Time</th>
            <th className='text-left'>
              <TokenIcon size={24} tokenAddress={cToken} />
              <TokenSymbol token={tokens[cToken]} /> Change
            </th>
            <th className='text-left'>Old Leverage</th>
            <th className='text-left'>New Leverage</th>
            <th className='text-left'/>
          </tr>
        </thead>
        <tbody>
          {
            swapTxs.map((swapTx, key) => {
              return <tr key={key}>
                <td>{formatDate(swapTx.timeStamp)} {formatTime(swapTx.timeStamp)}</td>
                <td>{
                  formatWeiToDisplayNumber(
                    swapTx.cAmount,
                    4,
                    tokens[cToken]?.decimal || 18
                  )
                }</td>
                <td>{swapTx.oldLeverage}</td>
                <td>{swapTx.newLeverage}</td>
                <td><a href='#'>View</a></td>
              </tr>
            })
          }
        </tbody>
      </table>
    </div>
  )
}
