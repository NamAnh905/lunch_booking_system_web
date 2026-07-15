/**
 * Loại món ăn — mirror enum BE `vn.vnpost.lunchorder.common.enums.DishType`.
 * Dùng thay cho các magic string 'REGULAR' | 'SPECIAL' | ... rải rác ở FE.
 *
 * Cài đặt theo pattern const-object + union type để vừa có giá trị runtime
 * (`DishType.REGULAR`) vừa cho phép so sánh với string literal trong template
 * Angular (`@case ('REGULAR')`) mà không vi phạm strictTemplates.
 */
export const DishType = {
  REGULAR: 'REGULAR',
  SPECIAL: 'SPECIAL',
  DRINK: 'DRINK',
  VEGETABLE: 'VEGETABLE',
  RICE: 'RICE',
  SOUP: 'SOUP',
} as const;

export type DishType = (typeof DishType)[keyof typeof DishType];

/**
 * Nhãn tiếng Việt của loại món — khớp với BE `DishResponse.getTypeExcel()`
 * để hiển thị thống nhất giữa web và file Excel xuất từ BE.
 */
export const DISH_TYPE_LABELS: Record<DishType, string> = {
  [DishType.REGULAR]: 'Món thường',
  [DishType.SPECIAL]: 'Món đặc biệt',
  [DishType.DRINK]: 'Nước uống',
  [DishType.VEGETABLE]: 'Rau',
  [DishType.SOUP]: 'Canh',
  [DishType.RICE]: 'Cơm',
};
