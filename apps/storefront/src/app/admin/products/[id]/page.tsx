import { getProductFullAdmin } from "../actions";
import { EnhancedProductEditor } from "@/components/admin/enhanced-product-editor";
import { notFound } from "next/navigation";

interface ProductAdminPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductAdminPage({ params }: ProductAdminPageProps) {
  const { id } = await params;

  try {
    const productData = await getProductFullAdmin(id);
    return <EnhancedProductEditor productData={productData} />;
  } catch (error) {
    console.error("Error loading product:", error);
    notFound();
  }
}
