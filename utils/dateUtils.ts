
export const getMonthDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay(); // 0 = Sunday
  
  // Calculate the start date of the grid (previous Sunday)
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - startOffset);

  const days = [];

  // Generate 42 days (6 weeks) to fill the calendar grid consistently
  for (let i = 0; i < 42; i++) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + i);
    
    const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    const isCurrentMonth = current.getMonth() === month;
    
    days.push({ date: dateStr, isCurrentMonth });
  }

  return days;
};

export const getMonthName = (monthIndex: number) => {
  const date = new Date(2023, monthIndex, 1);
  return date.toLocaleString('default', { month: 'long' });
};
