"use client";

import { ProductForm } from "@/components/admin/products/product-form";

interface ProductEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductEditPage({ params }: ProductEditPageProps) {
  const { id } = await params;
  return <ProductForm productId={id} />;
}
