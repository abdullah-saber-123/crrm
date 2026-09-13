import Link from "next/link";
import { formatPrice, type Product } from "@/lib/products";
import ProductThumb from "@/components/ProductThumb";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 transition hover:shadow-md dark:border-zinc-800"
    >
      <ProductThumb product={product} className="aspect-square w-full" />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs uppercase tracking-wide text-zinc-500">
          {product.category}
        </span>
        <h3 className="font-medium group-hover:underline">{product.name}</h3>
        <p className="mt-auto pt-2 font-semibold">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
