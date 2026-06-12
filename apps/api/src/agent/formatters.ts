/**
 * Formats raw database query results into friendly, conversational natural language replies.
 */
export function formatQueryResult(tableName: string, data: any[] | null): string {
  if (!data || data.length === 0) {
    return `Hmm, I checked the ${tableName} records but couldn't find any entries matching that request. Let me know if you want me to search with different details.`;
  }

  // Handle specific tables with tailored formatting if they exist, or fall back to generic
  switch (tableName.toLowerCase()) {
    case 'orders':
      return formatOrders(data);
    case 'products':
    case 'inventory':
      return formatInventory(data);
    case 'customers':
      return formatCustomers(data);
    default:
      return formatGeneric(tableName, data);
  }
}

function formatOrders(orders: any[]): string {
  if (orders.length === 1) {
    const order = orders[0];
    const dateStr = order.created_at ? new Date(order.created_at).toLocaleDateString() : 'recently';
    return `Got it! I found order #${order.id || order.order_number || 'N/A'}. The current status is "${order.status || 'unknown'}". It was placed on ${dateStr} for a total of ${order.total || order.amount || 'N/A'}.`;
  }

  const items = orders.map((o) => {
    return `- Order #${o.id || o.order_number || 'N/A'} (Status: ${o.status || 'N/A'}, Date: ${o.created_at ? new Date(o.created_at).toLocaleDateString() : 'N/A'})`;
  }).join('\n');

  return `Sure! I found ${orders.length} orders matching your details:\n${items}\n\nWhich one would you like me to look into?`;
}

function formatInventory(items: any[]): string {
  if (items.length === 1) {
    const item = items[0];
    return `Yes, we have "${item.name || 'item'}" in stock. The current price is ${item.price || 'N/A'} and we have ${item.quantity ?? item.stock ?? 0} available.`;
  }

  const list = items.slice(0, 5).map((i) => {
    return `- ${i.name || 'Item'}: ${i.quantity ?? i.stock ?? 0} in stock (${i.price || 'N/A'})`;
  }).join('\n');

  const extra = items.length > 5 ? `\n...and ${items.length - 5} more items.` : '';

  return `Here are the matching stock items I found:\n${list}${extra}`;
}

function formatCustomers(customers: any[]): string {
  if (customers.length === 1) {
    const customer = customers[0];
    return `I found profile details for ${customer.name || 'the customer'}. Email is ${customer.email || 'N/A'} and phone is ${customer.phone || 'N/A'}.`;
  }
  return `I found ${customers.length} matching customers. Could you specify the name or email to narrow it down?`;
}

function formatGeneric(tableName: string, data: any[]): string {
  if (data.length === 1) {
    const entry = data[0];
    const details = Object.entries(entry)
      .slice(0, 5)
      .map(([key, val]) => `${key}: ${val}`)
      .join(', ');
    return `I found one record in "${tableName}" (${details}).`;
  }
  return `I found ${data.length} records in the "${tableName}" database matching your query.`;
}
