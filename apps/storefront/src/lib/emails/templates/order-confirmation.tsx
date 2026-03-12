import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface OrderConfirmationEmailProps {
  order: {
    orderNumber: string;
    customerName: string;
    items: Array<{
      title: string;
      quantity: number;
      price: number;
    }>;
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
  };
}

export function OrderConfirmationEmail({ order }: OrderConfirmationEmailProps) {
  const formatKES = (cents: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(cents / 100);
  };

  return (
    <Html>
      <Head />
      <Preview>Thank you for your order #{order.orderNumber}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto max-w-xl bg-white p-8 rounded-lg">
            <Heading className="text-2xl font-bold text-gray-900 mb-4">
              Order Confirmed!
            </Heading>

            <Text className="text-gray-700 mb-4">
              Hi {order.customerName},
            </Text>

            <Text className="text-gray-700 mb-6">
              Thank you for your order. We&apos;re processing it now and will send
              you tracking information once it ships.
            </Text>

            <Section className="bg-gray-50 p-4 rounded-lg mb-6">
              <Text className="font-semibold text-gray-900 mb-2">
                Order #{order.orderNumber}
              </Text>

              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between py-2">
                  <Text className="text-gray-700">
                    {item.title} x {item.quantity}
                  </Text>
                  <Text className="text-gray-900 font-medium">
                    {formatKES(item.price * item.quantity)}
                  </Text>
                </div>
              ))}

              <Hr className="my-4 border-gray-200" />

              <div className="flex justify-between py-1">
                <Text className="text-gray-600">Subtotal</Text>
                <Text className="text-gray-900">{formatKES(order.subtotal)}</Text>
              </div>

              {order.vat > 0 && (
                <div className="flex justify-between py-1">
                  <Text className="text-gray-600">VAT (16%)</Text>
                  <Text className="text-gray-900">{formatKES(order.vat)}</Text>
                </div>
              )}

              <div className="flex justify-between py-1">
                <Text className="text-gray-600">Shipping</Text>
                <Text className="text-gray-900">
                  {order.shipping === 0 ? "Free" : formatKES(order.shipping)}
                </Text>
              </div>

              <div className="flex justify-between py-2 mt-2 border-t border-gray-200">
                <Text className="font-semibold text-gray-900">Total</Text>
                <Text className="font-semibold text-gray-900">
                  {formatKES(order.total)}
                </Text>
              </div>
            </Section>

            <Section className="bg-gray-50 p-4 rounded-lg mb-6">
              <Text className="font-semibold text-gray-900 mb-2">
                Shipping Address
              </Text>
              <Text className="text-gray-700">
                {order.shippingAddress.name}
                <br />
                {order.shippingAddress.address}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.county}
                <br />
                {order.shippingAddress.postalCode}
                <br />
                Kenya
              </Text>
            </Section>

            <Button
              href={`https://trovestak.com/account/orders/${order.orderNumber}`}
              className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium"
            >
              View Order
            </Button>

            <Hr className="my-6 border-gray-200" />

            <Text className="text-gray-500 text-sm text-center">
              If you have any questions, reply to this email or contact us at
              support@trovestak.com
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
