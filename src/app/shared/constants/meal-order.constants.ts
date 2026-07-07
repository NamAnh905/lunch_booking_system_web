export const MEAL_ORDER_CONSTANTS = {
  PRICE_PER_MEAL: 25000,
  MONTH_NAMES: [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ],
  WEEK_DISHES: {
    0: ['Thịt gà kho sả', 'Đậu phụ sốt cà chua', 'Canh rau cải ngọt', 'Cơm tẻ dẻo'],
    1: ['Thịt ba chỉ cháy cạnh', 'Cá rô phi rán giòn', 'Canh bí đao sườn heo', 'Cơm tẻ dẻo'],
    2: ['Gà rang gừng hành', 'Đậu phụ nhồi thịt sốt', 'Canh cà chua trứng lạp', 'Cơm tẻ dẻo'],
    3: ['Sườn xào chua ngọt', 'Cá quả kho tộ tiêu', 'Canh cải ngọt thịt băm', 'Cơm tẻ dẻo'],
    4: ['Thịt bò xào cần tỏi', 'Chả lá lốt rán giòn', 'Canh rau muống luộc sấu', 'Cơm tẻ dẻo'],
    5: ['Tôm rim ba chỉ cháy ngọt', 'Trứng đúc thịt băm', 'Canh bí đỏ xương hầm', 'Cơm tẻ dẻo'],
    6: ['Thịt chân giò luộc', 'Cá chép kho riềng', 'Canh cải xanh cá rô', 'Cơm tẻ dẻo']
  } as Record<number, string[]>,
  SOLAR_HOLIDAYS: ['01-01', '04-30', '05-01', '09-02', '09-03']
};
