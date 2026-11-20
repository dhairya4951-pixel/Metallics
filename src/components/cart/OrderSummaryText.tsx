interface OrderSummaryTextProps {
  orderCode: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: string;
    subtotal: string;
    productUrl: string;
  }[];
  totalItems: number;
  subtotal: string;
  publicOrderUrl: string;
}

export function generateOrderSummaryText({
  orderCode,
  items,
  totalItems,
  subtotal,
  publicOrderUrl,
}: OrderSummaryTextProps): string {
  const productLines = items
    .map(
      (item, i) =>
        `${i + 1}. ${item.name}\n   Quantity: ${item.quantity}\n   Unit Price: ${item.unitPrice}\n   Subtotal: ${item.subtotal}\n   Product Link: ${item.productUrl}`
    )
    .join('\n\n');

  return `Hello! I would like to place an order.

Order ID: ${orderCode}

Products:

${productLines}

Total Items: ${totalItems}
Product Subtotal: ${subtotal}

View My Complete Order:
${publicOrderUrl}`;
}
