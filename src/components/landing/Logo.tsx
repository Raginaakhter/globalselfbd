import Image from "next/image";
import Link from "next/link";

// Intrinsic aspect ratios of the source PNGs (kept in sync with public/logo-*.png)
// so Next/Image can reserve the right space and avoid layout shift on every device.
const COMPACT_RATIO = 786 / 662; // icon + wordmark
const FULL_RATIO = 788 / 742; // icon + wordmark + tagline

export default function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  const image = compact ? (
    <Image
      src="/logo-compact.png"
      alt="Global Shelf BD"
      width={786}
      height={662}
      priority
      className="h-13 w-auto sm:h-15 md:h-16 lg:h-18 xl:h-20 object-contain"
      style={{ aspectRatio: COMPACT_RATIO }}
    />
  ) : (
    <Image
      src="/logo-full.png"
      alt="Global Shelf BD — Global Products, Authentic Choice"
      width={788}
      height={742}
      className="h-24 w-auto sm:h-28 md:h-32 object-contain"
      style={{ aspectRatio: FULL_RATIO }}
    />
  );

  return (
    <Link href="/" className="group shrink-0 inline-flex" aria-label="Global Shelf BD home">
      {light ? (
        // The artwork itself is drawn in navy/blue, so on a dark background (e.g. the
        // footer) it needs a light card behind it to stay visible and "pop" correctly.
        <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">{image}</div>
      ) : (
        image
      )}
    </Link>
  );
}
