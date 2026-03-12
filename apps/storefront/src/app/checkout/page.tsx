import CheckoutClient from "./checkout-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | Trovestak",
  description: "Securely verify your purchase and initiate equipment deployment.",
};

export default function CheckoutPage() {
  return (
    <CheckoutClient />
  );
}
