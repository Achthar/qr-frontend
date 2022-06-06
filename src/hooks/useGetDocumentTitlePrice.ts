import { useEffect } from 'react'

const useGetDocumentTitlePrice = () => {
  const reqtPriceBusd = 5 //useCakeBusdPrice()
  useEffect(() => {
    const reqtPriceBusdString = reqtPriceBusd ? reqtPriceBusd.toFixed(2) : ''
    document.title = `Requiem Finance - ${reqtPriceBusdString}`
  }, [reqtPriceBusd])
}
export default useGetDocumentTitlePrice
