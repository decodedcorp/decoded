import {
  MEDIA_METADATA_KEYS,
  type MediaMetadataKey,
  type MediaMetadataItem,
  type StructuredFieldsState,
} from "@/lib/api/mutation-types";

const KEY_SET = new Set<string>(MEDIA_METADATA_KEYS);

function isWhitelistKey(key: string): key is MediaMetadataKey {
  return KEY_SET.has(key);
}

/**
 * 구조화 필드 viewmodel → wire array.
 * whitelist 순서 유지, 빈 값(undefined/"")은 omit, whitelist 외 key drop.
 */
export function toMediaMetadataItems(
  state: StructuredFieldsState
): MediaMetadataItem[] {
  const out: MediaMetadataItem[] = [];
  for (const key of MEDIA_METADATA_KEYS) {
    const value = state[key];
    if (value === undefined || value === "") continue;
    out.push({ key, value });
  }
  return out;
}

/**
 * Wire array → 구조화 필드 viewmodel.
 * whitelist 외 key 무시, 중복 key는 마지막 값 선택.
 */
export function fromMediaMetadataItems(
  items: MediaMetadataItem[]
): StructuredFieldsState {
  const out: StructuredFieldsState = {};
  for (const item of items) {
    if (!isWhitelistKey(item.key)) continue;
    out[item.key] = item.value;
  }
  return out;
}

/**
 * Manual 입력이 AI 추출 결과를 덮어쓴다 (manual wins).
 * 결과는 중복 없는 배열.
 */
export function mergeManualOverAi(
  manual: MediaMetadataItem[],
  ai: MediaMetadataItem[]
): MediaMetadataItem[] {
  const map = new Map<string, string>();
  for (const item of ai) map.set(item.key, item.value);
  for (const item of manual) map.set(item.key, item.value);
  return Array.from(map, ([key, value]) => ({ key, value }));
}
