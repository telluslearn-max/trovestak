import { Resend } from "resend";
import { OrderConfirmationEmail } from "./emails/templates/order-confirmation";
import { ShippingUpdateEmail } from "./emails/templates/shipping-update";
import { LowStockAlertEmail } from "./emails/templates/low-stock-alert";

const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL = "Trovestak <orders@trovestak.com>";

interface OrderItem {
  title: string;
  quantity: number;
  price: number;
}

interface OrderDetails {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  vat: number;
  shipping: number;
  total: number;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    county: string;
    postalCode: string;
  };
}

export async function sendOrderConfirmation(order: OrderDetails) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: order.customerEmail,
      subject: `Order Confirmation - #${order.orderNumber}`,
      react: OrderConfirmationEmail({ order }),
    });

    if (error) {
      console.error("Failed to send order confirmation:", error);
      return { success: false, error };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Error sending order confirmation:", error);
    return { success: false, error };
  }
}

interface ShippingDetails {
  orderNumber: string;
  customerEmail: string;
  trackingNumber: string;
  carrier: string;
  trackingUrl: string;
  estimatedDelivery: string;
}

export async function sendShippingUpdate(shipping: ShippingDetails) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: shipping.customerEmail,
      subject: `Your Order #${shipping.orderNumber} Has Shipped`,
      react: ShippingUpdateEmail({ shipping }),
    });

    if (error) {
      console.error("Failed to send shipping update:", error);
      return { success: false, error };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Error sending shipping update:", error);
    return { success: false, error };
  }
}

interface LowStockAlert {
  productTitle: string;
  variantTitle: string;
  currentStock: number;
  threshold: number;
}

export async function sendLowStockAlert(alert: LowStockAlert) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@trovestak.com";

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `Low Stock Alert: ${alert.productTitle}`,
      react: LowStockAlertEmail({ alert }),
    });

    if (error) {
      console.error("Failed to send low stock alert:", error);
      return { success: false, error };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Error sending low stock alert:", error);
    return { success: false, error };
  }
}

export async function validateEmailConfig() {
  try {
    const { data } = await resend.domains.list();
    return {
      valid: true,
      domains: data?.data?.map((d) => d.name) || [],
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
