const generateBookingReference = () => {
    return `SB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

const parseDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const getDayOfWeekName = (value) => {
    const date = typeof value === 'string' ? new Date(value) : value;
    const dayIndex = date.getDay();
    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return names[dayIndex] || 'Monday';
};

const isTimeRangeOverlap = (aStart, aEnd, bStart, bEnd) => {
    return aStart < bEnd && bStart < aEnd;
};

module.exports = { generateBookingReference, parseDate, getDayOfWeekName, isTimeRangeOverlap };