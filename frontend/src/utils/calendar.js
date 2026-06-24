
export const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
export const buildMonthGrid = (year, month) => {const firstDay = new Date(year, month, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const days = [];
    for(let i = 0; i <offset; i++) days.push(null);
    for(let d = 1; d <= getDaysInMonth(year, month); d++) {
        days.push(
            `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          );
        }
    return days;
};