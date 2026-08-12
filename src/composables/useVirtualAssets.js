import { ref } from 'vue'
import { fetchAccountAssetStatus, AccountApiError } from '@/api/accountApi'
import { ApiError } from '@/api/http'
import { fetchProductHoldings } from '@/api/productApi'
import { fetchHoldings } from '@/api/trade'

export function useVirtualAssets() {
  const account = ref(null)
  const stockHoldings = ref([])
  const productHoldings = ref([])
  const isLoading = ref(false)
  const isAccountMissing = ref(false)
  const errorMessage = ref('')

  async function loadAssets() {
    isLoading.value = true
    isAccountMissing.value = false
    errorMessage.value = ''
    account.value = null
    stockHoldings.value = []
    productHoldings.value = []

    try {
      const [accountData, holdingsData, productData] = await Promise.all([
        fetchAccountAssetStatus(),
        fetchHoldings(),
        fetchProductHoldings(),
      ])
      account.value = accountData
      // fetchHoldings 응답: { holdings: [...] } 또는 배열 직접
      stockHoldings.value = Array.isArray(holdingsData?.holdings)
        ? holdingsData.holdings
        : Array.isArray(holdingsData)
          ? holdingsData
          : []
      productHoldings.value = productData
    } catch (error) {
      if (error instanceof AccountApiError && error.status === 400) {
        isAccountMissing.value = true
      } else {
        errorMessage.value = getErrorMessage(error)
      }
    } finally {
      isLoading.value = false
    }
  }

  return {
    account,
    stockHoldings,
    productHoldings,
    isLoading,
    isAccountMissing,
    errorMessage,
    loadAssets,
  }
}

function getErrorMessage(error) {
  if (error instanceof ApiError || error instanceof AccountApiError) {
    if (error.status === 401 || error.status === 403) {
      return '로그인 정보가 만료되었습니다. 다시 로그인해 주세요.'
    }
    return error.message
  }
  return '가상투자 자산 현황을 불러오지 못했습니다.'
}
