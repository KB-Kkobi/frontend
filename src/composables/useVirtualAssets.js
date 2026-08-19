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

  // keep-alive 재진입 때마다 onActivated에서 다시 호출된다. 이미 화면에 유효한 데이터가
  // 떠 있는 상태(재조회)에서까지 기존 데이터를 비우고 로딩 카드로 바꿔치기하면,
  // 탭을 다시 들어갈 때마다 "이전 내용이 잠깐 보였다가 사라지는" 것처럼 보인다.
  // 최초 로딩일 때만 로딩 카드를 보여주고, 재조회는 화면을 그대로 둔 채 조용히 최신화한다.
  async function loadAssets() {
    const isInitialLoad = account.value === null

    if (isInitialLoad) {
      isLoading.value = true
      isAccountMissing.value = false
      errorMessage.value = ''
    }

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
      if (!isInitialLoad) {
        // 백그라운드 재조회 실패는 화면에 이미 떠 있는 데이터를 그대로 유지한다.
        console.error('[useVirtualAssets] 자산 재조회 실패', error)
        return
      }
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
