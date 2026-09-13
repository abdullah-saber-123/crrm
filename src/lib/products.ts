export type Product = {
  slug: string;
  name: string;
  price: number;
  category: string;
  color: string;
  emoji: string;
  description: string;
};

export const products: Product[] = [
  {
    slug: "aurora-hoodie",
    name: "Aurora Hoodie",
    price: 68,
    category: "Apparel",
    color: "#4c6ef5",
    emoji: "🧥",
    description:
      "A heavyweight fleece hoodie with a brushed interior, drop shoulders, and a kangaroo pocket built for cool evenings.",
  },
  {
    slug: "meridian-sneakers",
    name: "Meridian Sneakers",
    price: 94,
    category: "Footwear",
    color: "#f76707",
    emoji: "👟",
    description:
      "Lightweight knit sneakers with responsive foam cushioning, designed for all-day comfort on any terrain.",
  },
  {
    slug: "summit-backpack",
    name: "Summit Backpack",
    price: 120,
    category: "Accessories",
    color: "#2f9e44",
    emoji: "🎒",
    description:
      "A 24L water-resistant backpack with a padded laptop sleeve, external straps, and reinforced stitching.",
  },
  {
    slug: "lumen-watch",
    name: "Lumen Smart Watch",
    price: 149,
    category: "Electronics",
    color: "#1c1c1c",
    emoji: "⌚",
    description:
      "Track workouts, sleep, and notifications with a bright always-on display and a week-long battery life.",
  },
  {
    slug: "cascade-jacket",
    name: "Cascade Rain Jacket",
    price: 110,
    category: "Apparel",
    color: "#0c8599",
    emoji: "🧥",
    description:
      "Fully seam-sealed waterproof shell with pit zips and an adjustable hood for unpredictable weather.",
  },
  {
    slug: "orbit-headphones",
    name: "Orbit Headphones",
    price: 79,
    category: "Electronics",
    color: "#ae3ec9",
    emoji: "🎧",
    description:
      "Over-ear wireless headphones with active noise cancellation and 30 hours of playback on a single charge.",
  },
  {
    slug: "terra-mug",
    name: "Terra Ceramic Mug",
    price: 22,
    category: "Home",
    color: "#e8590c",
    emoji: "☕",
    description:
      "A hand-glazed 12oz ceramic mug, microwave and dishwasher safe, made from stoneware clay.",
  },
  {
    slug: "nimbus-tent",
    name: "Nimbus 2P Tent",
    price: 189,
    category: "Outdoor",
    color: "#37b24d",
    emoji: "⛺",
    description:
      "A freestanding 2-person tent that pitches in minutes, with a full-coverage rainfly and two vestibules.",
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}
