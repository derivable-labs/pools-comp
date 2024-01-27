import LeverageSlider from 'leverage-slider/dist/component'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useGenerateLeverageData } from '../../hooks/useGenerateLeverageData'
import { useTokenValue } from '../../hooks/useTokenValue'
import { useConfigs } from '../../state/config/useConfigs'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { usePoolSettings } from '../../state/poolSettings/hook'
import { useListPool } from '../../state/pools/hooks/useListPool'
import { useListTokens } from '../../state/token/hook'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { NATIVE_ADDRESS } from '../../utils/constant'
import formatLocalisedCompactNumber, {
  formatWeiToDisplayNumber
} from '../../utils/formatBalance'
import {
  IEW,
  STR,
  WEI,
  bn,
  formatFloat,
  numDec,
  numInt,
  unwrap,
  weiToNumber
} from '../../utils/helpers'
import { Box } from '../ui/Box'
import { ButtonExecute } from '../ui/Button'
import { IconArrowDown } from '../ui/Icon'
import { Input } from '../ui/Input'
import { SkeletonLoader } from '../ui/SkeletonLoader'
import { Text, TextBlue, TextGrey } from '../ui/Text'
import { TokenIcon } from '../ui/TokenIcon'
import { TokenSymbol } from '../ui/TokenSymbol'
import './style.scss'
import { useNativePrice } from '../../hooks/useTokenPrice'
import { useFeeData } from '../../state/pools/hooks/useFeeData'
import { BigNumber } from 'ethers'
import Tooltip from '../Tooltip/Tooltip'
import { useSettings } from '../../state/setting/hooks/useSettings'
import { truncate as truncateAddress } from 'truncate-ethereum-address'

function numSplit(v: string) {
  return (
    <div>
      <span className='position-delta--right'>{numInt(v)}</span>
      <span className='position-delta--left'>{numDec(v)}</span>
    </div>
  )
}
export const PoolCreateInfo = () => {
  const {
    poolSettings,
    updatePoolSettings,
    deployPool,
    calculateParamsForPools
  } = usePoolSettings()
  useEffect(() => {
    console.log('#poolSettings', poolSettings)
  }, [poolSettings])
  const { data: nativePrice } = useNativePrice()

  const { chainId, provider } = useWeb3React()
  const [barData, setBarData] = useState<any>({})
  const { tokens } = useListTokens()
  const { balances } = useWalletBalance()
  const [recipient, setRecipient] = useState<string>('')
  const { account } = useWeb3React()
  const { pools, poolGroups } = useListPool()
  const inputTokenAddress = NATIVE_ADDRESS

  const { configs } = useConfigs()
  const leverageData = useGenerateLeverageData(
    poolSettings.pairAddress,
    STR(poolSettings.power),
    STR(poolSettings.amountIn ?? 0)
  )
  console.log('#leverageData', leverageData)
  const { value } = useTokenValue({
    amount: STR(poolSettings.amountIn ?? 0),
    tokenAddress: inputTokenAddress,
  })

  // useMemo(() => {
  //   console.log('#data', data)
  //   console.log('#barData', barData)
  // }, [data, barData])

  useEffect(() => {
    if (Object.values(pools).length > 0) {
      for (let i = 0; i < leverageData.length; i++) {
        const leve: any = leverageData[i]
        for (let k = 0; k < leve.bars.length; k++) {
          console.log('#leve-bar', leve.bars[k])
          if (
            (
              (poolGroups[Object.keys(poolGroups)[0]]?.allTokens as String[]) ||
              []
            ).includes(leve.bars[k].token)
          ) {
            setBarData(leve.bars[k])
            break
          }
        }
      }
    } else {
      setBarData([])
    }
  }, [pools, leverageData])

  // useMemo(() => {
  //   if (account) {
  //     setRecipient(account)
  //   }
  // }, [account])

  useEffect(() => {
    if (chainId && provider) {
      const signer = provider.getSigner()
      setIsLoadingStaticParam(true)
      calculateParamsForPools(chainId, provider, signer)
        .then((res) => {
          setIsLoadingStaticParam(false)
        })
        .catch((e) => {
          setIsLoadingStaticParam(false)
        })
    }
  }, [chainId, provider, poolSettings.pairAddress])
  const { initListPool } = useListPool()
  const { ddlEngine } = useConfigs()
  const [isBarLoading, setIsBarLoading] = useState(false)
  const [isDeployPool, setIsDeployPool] = useState(false)
  const [isLoadingStaticParam, setIsLoadingStaticParam] = useState(false)
  useEffect(() => {
    setIsBarLoading(true)
    initListPool(account, poolSettings.baseToken)
      .then((res) => {
        setIsBarLoading(false)
      })
      .catch((e) => {
        setIsBarLoading(false)
      })
  }, [poolSettings.baseToken, configs, ddlEngine])

  const handleCreatePool = async () => {
    setIsDeployPool(true)
    const pairAddress = poolSettings.pairAddress
    // const settings = {
    //   // pairAddress: '0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443',
    //   // pairAddress: '0x8d76e9c2bd1adde00a3dcdc315fcb2774cb3d1d6',
    //   pairAddress: ['0x31C77F72BCc209AD00E3B7be13d719c08cb7BA7B'],
    //   windowBlocks: 120,
    //   power: 2,
    //   interestRate: 0.03 / 100,
    //   premiumRate: 0.3 / 100,
    //   vesting: 60,
    //   closingFee: 0.3 / 100,
    //   closingFeeDuration: 24 * 60 * 60,
    //   reserveToken: 'PLD' // PlayDerivable
    //   // openingFee: 0/100,
    //   // R: 0.0001, // init liquidity
    // }
    console.log('#deplyer', chainId, provider, pairAddress)
    if (chainId && provider && pairAddress) {
      const signer = provider.getSigner()
      await deployPool(chainId, provider, signer)
      setIsDeployPool(false)
    }
    setIsDeployPool(false)
  }
  const [gasPrice, setGasPrice] = useState<any>(BigNumber.from(10 ** 8))
  const { feeData } = useFeeData()
  useEffect(() => {
    setGasPrice(feeData?.gasPrice ?? 1)
  }, [feeData])

  const handleBlur = () => {
    if (!provider) return
    const signer = provider.getSigner()

    setIsLoadingStaticParam(true)
    calculateParamsForPools(chainId, provider, signer)
      .then((res) => {
        setIsLoadingStaticParam(false)
      })
      .catch((e) => {
        setIsLoadingStaticParam(false)
      })
    // Additional logic you want to perform when input is blurred
  }
  const leverageCondition = useMemo(() => {
    const isHavePool =
      Object.keys(poolGroups).length > 0 || Object.keys(pools).length > 0
    const isHaveLeverage =
      leverageData?.length > 1 ||
      (leverageData as { bars: any[] }[])[0].bars.length > 1
    return isHaveLeverage && isHavePool
  }, [poolGroups, pools, leverageData])
  const { settings } = useSettings()
  return (
    <div className='pool-create-info'>
      <div className='amount-input-box'>
        <div className='amount-input-box__head'>
          <SkeletonLoader loading={!tokens[Object.keys(tokens)[0]]}>
            <span
              className='current-token'
              onClick={(address) => {
                // setVisibleSelectTokenModal(true)
                // setTokenTypeToSelect('input')
              }}
            >
              <TokenIcon size={24} tokenAddress={inputTokenAddress} />
              <Text>
                <TokenSymbol token={tokens[inputTokenAddress]} />
              </Text>
            </span>
          </SkeletonLoader>
          <SkeletonLoader loading={!balances[inputTokenAddress]}>
            <Text
              className='amount-input-box__head--balance'
              onClick={() => {
                updatePoolSettings({
                  amountIn: weiToNumber(
                    balances[inputTokenAddress],
                    tokens[inputTokenAddress]?.decimals || 18
                  )
                })
              }}
            >
              Balance:{' '}
              {balances && balances[inputTokenAddress]
                ? formatWeiToDisplayNumber(
                    balances[inputTokenAddress],
                    4,
                    tokens[inputTokenAddress]?.decimals || 18
                  )
                : 0}
            </Text>
          </SkeletonLoader>
        </div>
        <Input
          placeholder='Initial Liquidity'
          onBlur={handleBlur}
          // suffix={Number(valueIn) > 0 ? <TextGrey>${formatLocalisedCompactNumber(formatFloat(valueIn))}</TextGrey> : ''}
          className='fs-24'
          value={poolSettings.amountIn}
          onChange={(e) => {
            if (Number(e.target.value) >= 0) {
              updatePoolSettings({
                amountIn: (e.target as HTMLInputElement).value
              })
            }
          }}
          suffix={
            Number(value) > 0 ? (
              <TextGrey>
                ${formatLocalisedCompactNumber(formatFloat(value))}
              </TextGrey>
            ) : (
              ''
            )
          }
        />
      </div>
      {poolSettings?.baseToken?.symbol && poolSettings?.quoteToken?.symbol && (
        <div className='pl-5 mt-1 mb-2'>
          <IconArrowDown fill='#01A7FA' />
        </div>
      )}
      <Box borderColor='blue' className='estimate-box swap-info-box mt-2 mb-2'>
        <TextBlue className='estimate-box__title liquidity'>
          Liquidity {poolSettings.power}x{' '}
          {poolSettings?.baseToken?.symbol && poolSettings?.quoteToken?.symbol
            ? unwrap(poolSettings?.baseToken?.symbol) +
              '/' +
              unwrap(poolSettings?.quoteToken?.symbol)
            : ''}
        </TextBlue>
        <InfoRow>
          <TextGrey>Initial Liquidity</TextGrey>
          <span className={`delta-box ${!poolSettings.amountIn && 'no-data'}`}>
            <div className='text-left' />
            {poolSettings.amountIn && (
              <div className='text-right'>
                {value && parseFloat(poolSettings.amountIn.toString()) > 0 ? (
                  <Text>
                    {/* {numSplit(
                      formatLocalisedCompactNumber(
                        formatFloat(poolSettings.amountIn)
                      )
                    )} */}
                    {/* <Text>
                      <TokenSymbol token={tokens[poolSettings.reserveToken]} />
                    </Text> */}
                    {numSplit(
                      '$' + formatLocalisedCompactNumber(formatFloat(value, 2))
                    )}
                  </Text>
                ) : (
                  ''
                )}
              </div>
            )}
          </span>
        </InfoRow>
        <InfoRow>
          <TextGrey>New Pool Address</TextGrey>
          <SkeletonLoader loading={isLoadingStaticParam}>
            <Tooltip
              position='right-top'
              handle={
                <Text>
                  {truncateAddress(poolSettings.newPoolAddress ?? '', {
                    nPrefix: 8,
                    nSuffix: 8
                  })}
                </Text>
              }
              renderContent={() => <Text>{poolSettings.newPoolAddress}</Text>}
            />
          </SkeletonLoader>
        </InfoRow>
      </Box>
      {leverageCondition && !isBarLoading && (
        <LeverageSlider
          setBarData={setBarData}
          barData={barData}
          leverageData={leverageData}
          height={100}
        />
      )}

      <Box borderColor='default' className='swap-info-box mt-1 mb-1'>
        <InfoRow>
          <TextGrey>Recipient</TextGrey>
          <Input
            inputWrapProps={{
              className: 'recipient-input'
            }}
            width='100%'
            value={recipient}
            placeholder={account ?? 'Logged In Wallet'}
            onChange={(e) => {
              setRecipient((e.target as HTMLInputElement).value)
            }}
          />
        </InfoRow>
        <InfoRow>
          <TextGrey>Network Fee</TextGrey>
          {!nativePrice || !gasPrice || bn(poolSettings.gasUsed).isZero() ? (
            <Text>&nbsp;</Text>
          ) : (
            <SkeletonLoader loading={isLoadingStaticParam}>
              <Tooltip
                position='right-bottom'
                handle={
                  <Text>
                    {IEW(bn(poolSettings.gasUsed).mul(gasPrice), 18, 5)}
                    <TextGrey> {configs.nativeSymbol ?? 'ETH'} </TextGrey>
                    ($
                    {IEW(
                      bn(poolSettings.gasUsed)
                        .mul(gasPrice)
                        .mul(WEI(nativePrice)),
                      36,
                      2
                    )}
                    )
                  </Text>
                }
                renderContent={() => (
                  <div>
                    <div>
                      <TextGrey>Estimated Gas:&nbsp;</TextGrey>
                      <Text>
                        {formatWeiToDisplayNumber(
                          bn(poolSettings.gasUsed),
                          0,
                          0
                        )}
                      </Text>
                    </div>
                    <div>
                      <TextGrey>Gas Price:&nbsp;</TextGrey>
                      <Text>
                        {bn(gasPrice || 0)?.gte?.(1e6)
                          ? (Number(chainId) === 42161
                              ? Number(gasPrice) / 1e9
                              : formatWeiToDisplayNumber(
                                  gasPrice.div(1e9),
                                  0,
                                  0
                                )) + ' gwei'
                          : formatWeiToDisplayNumber(gasPrice, 0, 0) + ' wei'}
                      </Text>
                    </div>
                    <div>
                      <TextGrey>{configs.nativeSymbol} Price:&nbsp;</TextGrey>
                      <Text>
                        ${formatFloat(nativePrice || configs.nativePriceUSD, 4)}
                      </Text>
                    </div>
                  </div>
                )}
              />
            </SkeletonLoader>
          )}
        </InfoRow>
      </Box>

      {/* <Box borderColor='default' className='swap-info-box mt-1 mb-1 p-1'>
        <InfoRow className='mb-1'>
          <TextGrey>Gas Used</TextGrey>
          <span>
            <Text>
              {formatWeiToDisplayNumber(bn(poolSettings.bn(poolSettings.gasUsed)), 0, 0)} Gas
            </Text>
          </span>
        </InfoRow>
        <InfoRow>
          <TextGrey>Transaction Fee</TextGrey>
          <span>
            <Text>
              {weiToNumber(
                bn(poolSettings.gasUsed).mul(poolSettings.gasPrice),
                18,
                5
              )}
              <TextGrey> {chainId === 56 ? 'BNB' : 'ETH'} </TextGrey>
              ($
              {weiToNumber(
                bn(poolSettings.gasUsed)
                  .mul(poolSettings.gasPrice)
                  .mul(numberToWei(nativePrice)),
                36,
                2
              )}
              )
            </Text>
          </span>
        </InfoRow>
      </Box> */}

      {/* <TxFee gasUsed={bn(poolSettings.gasUsed)} /> */}
      <ButtonExecute
        className='create-pool-button w-100 mt-1'
        onClick={handleCreatePool}
        disabled={
          isLoadingStaticParam ||
          isDeployPool ||
          poolSettings.errorMessage?.length !== 0
        }
      >
        {isLoadingStaticParam
          ? 'Calculating...'
          : isDeployPool
          ? 'Waiting for confirmation...'
          : poolSettings.errorMessage
          ? poolSettings.errorMessage
          : 'Deploy New Pool'}
      </ButtonExecute>
    </div>
  )
}

const InfoRow = (props: any) => {
  return (
    <div
      className={
        'd-flex jc-space-between info-row font-size-12 ' + props.className
      }
    >
      {props.children}
    </div>
  )
}
