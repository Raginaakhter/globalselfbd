/* eslint-disable @next/next/no-img-element */

// Shows the product photo when one exists, otherwise the category emoji on the product's tint.
export default function ProductImage({
  image,
  emoji,
  alt,
  emojiClass = "",
}: {
  image?: string | null;
  emoji: string;
  alt: string;
  emojiClass?: string;
}) {
  if (image) {
    return <img src={image} alt={alt} loading="lazy" className="w-full h-full object-contain" />;
  }
  return <span className={emojiClass}>{emoji}</span>;
}
