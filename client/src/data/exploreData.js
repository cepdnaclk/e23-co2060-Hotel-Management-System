export const formatLkr = (amount) => {
  const value = Number(amount || 0);
  return `LKR ${value.toLocaleString()}`;
};
