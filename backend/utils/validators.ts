export const validateProductData = (data: any) => {
  const errors: string[] = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push("Title is required");
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push("Description is required");
  }

  if (!data.price || isNaN(data.price) || data.price <= 0) {
    errors.push("Valid price is required");
  }

  if (!data.sku || data.sku.trim().length === 0) {
    errors.push("SKU is required");
  }

  if (
    data.stock_quantity === undefined ||
    isNaN(data.stock_quantity) ||
    data.stock_quantity < 0
  ) {
    errors.push("Valid stock quantity is required");
  }

  if (data.images && !Array.isArray(data.images)) {
    errors.push("Images must be an array");
  }

  return errors;
};
