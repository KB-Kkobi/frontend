import { ref } from "vue";
import { defineStore } from "pinia";
import { fetchMyProfile, updateMyProfile } from "@/api/authApi";
import { DEFAULT_PROFILE_IMAGE_ID } from "@/constants/profileImages";

export const useProfileStore = defineStore("profile", () => {
  const profile = ref(null);
  const isLoading = ref(false);

  function setProfile(nextProfile, fallbackProfileImage) {
    if (!nextProfile) {
      profile.value = null;
      return null;
    }

    profile.value = {
      ...nextProfile,
      profileImage: nextProfile.profileImage
        ?? fallbackProfileImage
        ?? profile.value?.profileImage
        ?? DEFAULT_PROFILE_IMAGE_ID,
    };
    return profile.value;
  }

  async function loadProfile() {
    isLoading.value = true;
    try {
      return setProfile(await fetchMyProfile());
    } finally {
      isLoading.value = false;
    }
  }

  async function saveProfile(profileChanges) {
    const updatedProfile = await updateMyProfile(profileChanges);
    return setProfile(updatedProfile, profileChanges.profileImage);
  }

  function reset() {
    profile.value = null;
    isLoading.value = false;
  }

  return {
    profile,
    isLoading,
    loadProfile,
    saveProfile,
    reset,
  };
});
