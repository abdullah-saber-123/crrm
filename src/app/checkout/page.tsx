"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatPrice, getProduct } from "@/lib/products";

export default function CheckoutPage() {
  const { items, totalPrice, clear } = useCart();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">Nothing to check out</h1>
        <Link
          href="/"
          className="rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white dark:bg-white dark:text-black"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      clear();
      router.push("/checkout/success");
    }, 800);
  };

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-10 px-6 py-12 sm:grid-cols-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h1 className="mb-2 text-2xl font-semibold">Checkout</h1>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-zinc-500">
            Shipping information
          </legend>
          <input required placeholder="Full name" className="input" />
          <input required type="email" placeholder="Email" className="input" />
          <input required placeholder="Address" className="input" />
          <div className="flex gap-3">
            <input required placeholder="City" className="input" />
            <input required placeholder="Postal code" className="input" />
          </div>
        </fieldset>

        <fieldset className="mt-4 flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-zinc-500">Payment</legend>
          <input required placeholder="Card number" className="input" />
          <div className="flex gap-3">
            <input required placeholder="MM/YY" className="input" />
            <input required placeholder="CVC" className="input" />
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white transition disabled:opacity-60 dark:bg-white dark:text-black"
        >
          {submitting ? "Placing order…" : `Pay ${formatPrice(totalPrice)}`}
        </button>
        <p className="text-xs text-zinc-500">
          This is a demo checkout — no real payment is processed.
        </p>
      </form>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Order summary</h2>
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const product = getProduct(item.slug);
            if (!product) return null;
            return (
              <li key={item.slug} className="flex justify-between text-sm">
                <span>
                  {product.name} × {item.quantity}
                </span>
                <span>{formatPrice(product.price * item.quantity)}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex justify-between border-t border-zinc-200 pt-4 font-semibold dark:border-zinc-800">
          <span>Total</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
      </div>
    </div>
  );
}
