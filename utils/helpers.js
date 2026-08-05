const generateBookingReference = () => {
    return `SB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

const parseDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

module.exports = { generateBookingReference, parseDate };