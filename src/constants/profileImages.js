import profileKkobiImage from "@/assets/images/profile/profileKkobi.webp";
import profileKkobi2Image from "@/assets/images/profile/profileKkobi2.webp";
import profileKkobi3Image from "@/assets/images/profile/profileKkobi3.webp";
import profileKkobi4Image from "@/assets/images/profile/profileKkobi4.webp";
import profileKkobi5Image from "@/assets/images/profile/profileKkobi5.webp";
import sleepKkobiImage from "@/assets/images/profile/sleepKkobi.webp";

export const DEFAULT_PROFILE_IMAGE_ID = "SLEEP_KKOBI";

export const PROFILE_IMAGE_OPTIONS = Object.freeze([
  {
    id: DEFAULT_PROFILE_IMAGE_ID,
    label: "새근새근 꼬비",
    imageUrl: sleepKkobiImage,
    fit: "contain",
  },
  {
    id: "PROFILE_KKOBI",
    label: "반가운 꼬비",
    imageUrl: profileKkobiImage,
    isSelectable: false,
  },
  {
    id: "PROFILE_KKOBI_2",
    label: "꼬비 프로필 2",
    imageUrl: profileKkobi2Image,
  },
  {
    id: "PROFILE_KKOBI_3",
    label: "꼬비 프로필 3",
    imageUrl: profileKkobi3Image,
  },
  {
    id: "PROFILE_KKOBI_4",
    label: "꼬비 프로필 4",
    imageUrl: profileKkobi4Image,
  },
  {
    id: "PROFILE_KKOBI_5",
    label: "꼬비 프로필 5",
    imageUrl: profileKkobi5Image,
  },
]);

export const SELECTABLE_PROFILE_IMAGE_OPTIONS = Object.freeze(
  PROFILE_IMAGE_OPTIONS.filter(({ isSelectable }) => isSelectable !== false),
);

export function getProfileImageOption(profileImageId) {
  return PROFILE_IMAGE_OPTIONS.find(({ id }) => id === profileImageId)
    ?? PROFILE_IMAGE_OPTIONS[0];
}
