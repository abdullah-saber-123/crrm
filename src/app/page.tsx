import { products } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <section className="mb-12 rounded-2xl bg-zinc-100 px-8 py-16 text-center dark:bg-zinc-900">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Everyday essentials, made to last.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-zinc-600 dark:text-zinc-400">
          Thoughtfully designed apparel, footwear, and gear for wherever the
          day takes you.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
