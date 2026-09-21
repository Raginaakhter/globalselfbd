import SectionHeading from "./SectionHeading";
import ProductCard from "./ProductCard";
import type { Product } from "./data";

type Props = {
  id: string;
  title: string;
  bn?: string;
  products: Product[];
  tone?: "plain" | "tinted";
  href?: string;
};

export default function ProductSection({ id, title, bn, products, tone = "plain", href }: Props) {
  if (products.length === 0) return null;

  const grid = (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );

  if (tone === "tinted") {
    return (
      <section id={id} className="mt-12 py-10 bg-gradient-to-b from-brand-50 to-white border-y border-brand-100 scroll-mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title={title} bn={bn} href={href} />
          {grid}
        </div>
      </section>
    );
  }

  return (
    <section id={id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 scroll-mt-32">
      <SectionHeading title={title} bn={bn} href={href} />
      {grid}
    </section>
  );
}
