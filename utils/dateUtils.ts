
export const getMonthDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

  const days = [];

  // Padding for previous month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push(dateStr);
  }

  return days;
};

export const getMonthName = (monthIndex: number) => {
  const date = new Date(2023, monthIndex, 1);
  return date.toLocaleString('default', { month: 'long' });
};
