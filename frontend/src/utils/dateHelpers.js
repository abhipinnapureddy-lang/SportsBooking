export const formatDateTime = (value) => {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};
