import {
  Body,
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

interface LowStockAlertEmailProps {
  alert: {
    productTitle: string;
    variantTitle: string;
    currentStock: number;
    threshold: number;
  };
}

export function LowStockAlertEmail({ alert }: LowStockAlertEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Low Stock Alert: {alert.productTitle}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto max-w-xl bg-white p-8 rounded-lg">
            <Heading className="text-2xl font-bold text-red-600 mb-4">
              Low Stock Alert
            </Heading>

            <Text className="text-gray-700 mb-4">
              The following product is running low on inventory:
            </Text>

            <Section className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
              <Text className="font-semibold text-gray-900 text-lg mb-2">
                {alert.productTitle}
              </Text>

              {alert.variantTitle && (
                <Text className="text-gray-700 mb-2">
                  Variant: {alert.variantTitle}
                </Text>
              )}

              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <Text className="text-gray-600">Current Stock</Text>
                  <Text className="text-red-600 font-bold text-xl">
                    {alert.currentStock}
                  </Text>
                </div>

                <div className="flex justify-between">
                  <Text className="text-gray-600">Alert Threshold</Text>
                  <Text className="text-gray-900 font-medium">
                    {alert.threshold}
                  </Text>
                </div>
              </div>
            </Section>

            <Text className="text-gray-700 mb-4">
              Please restock this item soon to avoid running out of inventory.
            </Text>

            <Hr className="my-6 border-gray-200" />

            <Text className="text-gray-500 text-sm text-center">
              This is an automated alert from your Trovestak inventory system.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
