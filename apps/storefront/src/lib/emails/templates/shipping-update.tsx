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

interface ShippingUpdateEmailProps {
  shipping: {
    orderNumber: string;
    trackingNumber: string;
    carrier: string;
    trackingUrl: string;
    estimatedDelivery: string;
  };
}

export function ShippingUpdateEmail({ shipping }: ShippingUpdateEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your order #{shipping.orderNumber} is on its way!</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto max-w-xl bg-white p-8 rounded-lg">
            <Heading className="text-2xl font-bold text-gray-900 mb-4">
              Your Order Has Shipped!
            </Heading>

            <Text className="text-gray-700 mb-4">
              Great news! Your order #{shipping.orderNumber} is on its way.
            </Text>

            <Section className="bg-gray-50 p-4 rounded-lg mb-6">
              <Text className="font-semibold text-gray-900 mb-4">
                Tracking Details
              </Text>

              <div className="space-y-3">
                <div>
                  <Text className="text-gray-600 text-sm mb-1">Carrier</Text>
                  <Text className="text-gray-900 font-medium">
                    {shipping.carrier}
                  </Text>
                </div>

                <div>
                  <Text className="text-gray-600 text-sm mb-1">
                    Tracking Number
                  </Text>
                  <Text className="text-gray-900 font-medium">
                    {shipping.trackingNumber}
                  </Text>
                </div>

                <div>
                  <Text className="text-gray-600 text-sm mb-1">
                    Estimated Delivery
                  </Text>
                  <Text className="text-gray-900 font-medium">
                    {shipping.estimatedDelivery}
                  </Text>
                </div>
              </div>
            </Section>

            <Button
              href={shipping.trackingUrl}
              className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium"
            >
              Track Your Package
            </Button>

            <Hr className="my-6 border-gray-200" />

            <Text className="text-gray-600">
              You can also track your package on our website by visiting your
              order details.
            </Text>

            <Text className="text-gray-500 text-sm text-center mt-4">
              Questions? Contact us at support@trovestak.com
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
