const buildUpdateFields = (updates, allowedFields) => {
  const fields = [];
  const values = [];

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      fields.push(`${field} = ?`);
      values.push(updates[field]);
    }
  });

  return { fields, values };
};

const buildSearchQuery = (filters) => {
  return filters.length ? `WHERE ${filters.join(' AND ')}` : '';
};

const normalizePagination = (page, limit, maxLimit = 100) => {
  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 20;
  const safeLimit = Math.min(Math.max(limitNumber, 1), maxLimit);
  const safePage = Math.max(pageNumber, 1);
  const offset = (safePage - 1) * safeLimit;
  return { page: safePage, limit: safeLimit, offset };
};

module.exports = { buildUpdateFields, buildSearchQuery, normalizePagination };
