import { notFound } from "next/navigation";
import { formatPrice, getProduct, products } from "@/lib/products";
import ProductThumb from "@/components/ProductThumb";
import AddToCartButton from "@/components/AddToCartButton";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-12 sm:grid-cols-2">
      <ProductThumb product={product} className="aspect-square w-full rounded-2xl" />
      <div className="flex flex-col gap-4">
        <span className="text-xs uppercase tracking-wide text-zinc-500">
          {product.category}
        </span>
        <h1 className="text-3xl font-semibold">{product.name}</h1>
        <p className="text-2xl font-semibold">{formatPrice(product.price)}</p>
        <p className="text-zinc-600 dark:text-zinc-400">{product.description}</p>
        <div className="mt-4 max-w-xs">
          <AddToCartButton slug={product.slug} />
        </div>
      </div>
    </div>
  );
}
