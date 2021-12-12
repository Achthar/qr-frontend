import { useEffect } from 'react'
import { useCakeBusdPrice } from 'hooks/useBUSDPrice'

const useGetDocumentTitlePrice = () => {
  const reqtPriceBusd = 5 //useCakeBusdPrice()
  useEffect(() => {
    const reqtPriceBusdString = reqtPriceBusd ? reqtPriceBusd.toFixed(2) : ''
    document.title = `Pancake Swap - ${reqtPriceBusdString}`
  }, [reqtPriceBusd])
}
export default useGetDocumentTitlePrice
