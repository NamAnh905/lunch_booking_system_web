export interface OrderSummaryItemResponse {
  userId: number;
  fullName: string;
  departmentName: string;
  normalMealCount: number;
  specialMealCount: number;
  totalAmount: number;
  totalPaid: number;
  remainingAmount: number;
}

export interface DailyOrderSummaryResponse {
  date: string;
  totalNormalMeals: number;
  totalSpecialMeals: number;
  totalAmount: number;
  items: OrderSummaryItemResponse[];
}

export interface MonthlyOrderSummaryResponse {
  month: number;
  year: number;
  totalNormalMeals: number;
  totalSpecialMeals: number;
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
  items: OrderSummaryItemResponse[];
  dailyCounts?: { date: string, totalMeals: number }[];
}
