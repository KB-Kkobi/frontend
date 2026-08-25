import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { fetchMyProfile, updateMyProfile } from "@/api/authApi";
import { useProfileStore } from "@/stores/profile";

vi.mock("@/api/authApi", () => ({
  fetchMyProfile: vi.fn(),
  updateMyProfile: vi.fn(),
}));

describe("useProfileStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("저장 응답에 이미지가 없어도 사용자가 선택한 이미지를 유지한다", async () => {
    updateMyProfile.mockResolvedValue({
      nickname: "꼬비",
      birthDate: "2000-01-01",
    });
    const store = useProfileStore();

    await store.saveProfile({
      nickname: "꼬비",
      birthDate: "2000-01-01",
      profileImage: "PROFILE_KKOBI",
    });

    expect(store.profile.profileImage).toBe("PROFILE_KKOBI");
  });

  it("다시 조회한 응답에 이미지가 없어도 직전 선택 이미지를 유지한다", async () => {
    updateMyProfile.mockResolvedValue({ nickname: "꼬비" });
    fetchMyProfile.mockResolvedValue({ nickname: "꼬비" });
    const store = useProfileStore();

    await store.saveProfile({ profileImage: "PROFILE_KKOBI" });
    await store.loadProfile();

    expect(store.profile.profileImage).toBe("PROFILE_KKOBI");
  });
});
