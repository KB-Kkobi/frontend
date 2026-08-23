<script setup>
import naruLogoImage from "@/assets/images/naruLogo.svg";
import splashTaglineImage from "@/assets/images/splashTagline.png";
import PageContainer from "@/components/common/PageContainer.vue";
</script>

<template>
  <PageContainer color="white">
    <div
      class="flex flex-1 flex-col items-center justify-center gap-6"
      role="status"
      aria-label="나루 앱을 불러오는 중"
    >
      <img
        :src="naruLogoImage"
        alt="나루 로고"
        class="w-11/12 object-contain"
      />
      <div
        class="flex w-3/5 items-center justify-center rounded-full bg-splash-soft px-4 py-3"
      >
        <img
          :src="splashTaglineImage"
          alt="쉽고 편안한 투자의 첫걸음"
          class="w-full object-contain"
        />
      </div>
      <span class="sr-only">나루를 불러오는 중입니다.</span>
    </div>
  </PageContainer>
</template>
