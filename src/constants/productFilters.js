import {
  SAVING_TERM_OPTIONS,
  RESERVE_TYPE_OPTIONS,
  PREFERENTIAL_CONDITION_OPTIONS,
} from '@/constants/product'
import { SECURITY_FILTER_TYPE_OPTIONS } from '@/constants/security'

export const SAVING_TERM_FILTER_GROUP = Object.freeze({
  key: 'savingTerms',
  label: '가입 기간',
  options: SAVING_TERM_OPTIONS.map((term) => ({ value: term, label: `${term}개월` })),
  multiple: true,
  color: 'pink',
  cols: 3,
})

export const RESERVE_TYPE_FILTER_GROUP = Object.freeze({
  key: 'reserveTypes',
  label: '적립 방식',
  options: RESERVE_TYPE_OPTIONS.filter((o) => o.value).map((o) => ({ value: o.value, label: o.label })),
  multiple: true,
  color: 'blue',
  cols: 2,
})

export const PREFERENTIAL_CONDITION_FILTER_GROUP = Object.freeze({
  key: 'preferentialConditions',
  label: '우대조건',
  options: PREFERENTIAL_CONDITION_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  multiple: true,
  color: 'yellow',
  cols: 2,
})

export function buildSavingsFilterGroups(isSaving) {
  return isSaving
    ? [SAVING_TERM_FILTER_GROUP, RESERVE_TYPE_FILTER_GROUP, PREFERENTIAL_CONDITION_FILTER_GROUP]
    : [SAVING_TERM_FILTER_GROUP, PREFERENTIAL_CONDITION_FILTER_GROUP]
}

export const SECURITY_TYPE_FILTER_GROUP = Object.freeze({
  key: 'securityTypes',
  label: '자산 유형',
  options: SECURITY_FILTER_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  multiple: true,
  color: 'pink',
  cols: 3,
})

export const SECURITY_FILTER_GROUPS = Object.freeze([SECURITY_TYPE_FILTER_GROUP])
