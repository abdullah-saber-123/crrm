import type { Product } from "@/lib/products";

export default function ProductThumb({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center text-5xl ${className}`}
      style={{ backgroundColor: product.color }}
      aria-hidden
    >
      {product.emoji}
    </div>
  );
}
