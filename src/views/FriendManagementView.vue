<script setup>
import BackButton from "@/components/common/BackButton.vue";
import PageContainer from "@/components/common/PageContainer.vue";
import FriendManagementCard from "@/components/mypage/FriendManagementCard.vue";
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-6 py-6">
      <header class="flex items-center gap-2">
        <BackButton />
        <div class="flex flex-col gap-2">
          <h1 class="text-h1 text-ink">친구 관리</h1>
          <p class="text-caption text-muted">
            친구 요청을 확인하고 친구 목록을 관리해 보세요.
          </p>
        </div>
      </header>

      <FriendManagementCard />
    </div>
  </PageContainer>
</template>
