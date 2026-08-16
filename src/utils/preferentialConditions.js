/**
 * 우대조건 정렬·그룹핑 유틸.
 * 상품 상세(ProductInterestOptionCard)와 가상투자 가입 화면
 * (ProductSubscriptionView)이 동일한 그룹 구조를 공유한다.
 */

export function sortPreferentialConditions(conditions) {
  if (!Array.isArray(conditions)) return [];
  return [...conditions].sort(
    (a, b) =>
      (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
      a.preferentialRateConditionId - b.preferentialRateConditionId,
  );
}

/**
 * 백엔드가 내려주는 conditionGroupId/conditionRole을 기준으로 우대조건을
 * 화면 표시 단위로 묶는다. 같은 conditionGroupId가 연속되는 구간을 그룹
 * 하나로 보고, GROUP_NOTICE(공통 안내)/GROUP_DETAIL(세부 설명)/
 * GROUP_CONDITION(실제 선택·금리 조건)을 역할별로 나눠 담는다.
 * conditionGroupId가 없는 조건(STANDALONE)은 단독 항목으로 유지한다.
 */
export function groupPreferentialConditions(conditions) {
  const sorted = sortPreferentialConditions(conditions);
  const units = [];
  let currentGroupUnit = null;

  sorted.forEach((condition) => {
    if (condition.conditionGroupId == null) {
      currentGroupUnit = null;
      units.push({ type: "standalone", condition });
      return;
    }

    if (!currentGroupUnit || currentGroupUnit.groupId !== condition.conditionGroupId) {
      currentGroupUnit = {
        type: "group",
        groupId: condition.conditionGroupId,
        notice: null,
        details: [],
        conditions: [],
      };
      units.push(currentGroupUnit);
    }

    if (condition.conditionRole === "GROUP_NOTICE") {
      currentGroupUnit.notice = condition;
    } else if (condition.conditionRole === "GROUP_DETAIL") {
      currentGroupUnit.details.push(condition);
    } else {
      currentGroupUnit.conditions.push(condition);
    }
  });

  return units;
}

/**
 * 원본 conditionName에 "…:연 0.7%p"처럼 우대금리가 문장 끝에 함께 들어있는
 * 경우가 있다. 같은 값을 오른쪽에 additionalRate로 이미 표시하므로 중복
 * 노출되지 않도록 문장 끝의 금리 표기만 제거한다(설명 문장 자체는 원본 그대로).
 */
export function getConditionLabel(condition) {
  const name = String(condition.conditionName ?? "").trim();
  const stripped = name.replace(/\s*[:：]\s*(연\s*)?[\d.]+\s*%p?\s*$/, "").trim();
  return stripped || name;
}

/**
 * 실제로 우대금리를 받을 수 있는(selectable) 조건에 0보다 큰 금리가 있을
 * 때만 배지를 보여준다. null/0%처럼 의미 없는 값은 표시하지 않는다.
 */
export function hasVisibleAdditionalRate(condition) {
  if (condition.selectable === false) return false;
  const rate = Number(condition.additionalRate);
  return Number.isFinite(rate) && rate > 0;
}
