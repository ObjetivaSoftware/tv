
export const formatBRL = (value) => {
  if (value === null || value === undefined) {
    return 'R$ 0,00';
  }

  let numValue = value;
  if (typeof value === 'string') {
    numValue = parseFloat(value.replace(/\./g, ''));
  }

  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);

  return `R$ ${formatted}`;
};
