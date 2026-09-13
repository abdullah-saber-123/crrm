import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <div className="text-5xl">🎉</div>
      <h1 className="text-2xl font-semibold">Order placed!</h1>
      <p className="text-zinc-500">
        Thanks for your purchase. A confirmation email is on its way.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white dark:bg-white dark:text-black"
      >
        Continue shopping
      </Link>
    </div>
  );
}
