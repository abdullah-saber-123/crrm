"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatPrice, getProduct } from "@/lib/products";
import ProductThumb from "@/components/ProductThumb";

export default function CartPage() {
  const { items, setQuantity, removeItem, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
        <p className="text-zinc-500">Browse the shop and add something you like.</p>
        <Link
          href="/"
          className="rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white dark:bg-white dark:text-black"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold">Your cart</h1>
      <ul className="flex flex-col gap-4">
        {items.map((item) => {
          const product = getProduct(item.slug);
          if (!product) return null;
          return (
            <li
              key={item.slug}
              className="flex items-center gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <ProductThumb product={product} className="h-20 w-20 rounded-lg text-3xl" />
              <div className="flex flex-1 flex-col">
                <Link href={`/products/${product.slug}`} className="font-medium hover:underline">
                  {product.name}
                </Link>
                <span className="text-sm text-zinc-500">{formatPrice(product.price)}</span>
              </div>
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => setQuantity(item.slug, Number(e.target.value))}
                className="w-16 rounded-md border border-zinc-300 px-2 py-1 text-center dark:border-zinc-700 dark:bg-transparent"
              />
              <span className="w-20 text-right font-medium">
                {formatPrice(product.price * item.quantity)}
              </span>
              <button
                onClick={() => removeItem(item.slug)}
                className="text-sm text-zinc-500 hover:text-red-500"
                aria-label={`Remove ${product.name}`}
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex flex-col items-end gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <div className="flex w-full max-w-xs justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
        <Link
          href="/checkout"
          className="rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white dark:bg-white dark:text-black"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
