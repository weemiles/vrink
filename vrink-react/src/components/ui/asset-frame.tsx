import Image from "next/image";
import { ImageIcon } from "lucide-react";

import type { AssetEntry } from "@/content/assets";
import { cn } from "@/lib/utils";

type AssetFrameProps = {
  asset: AssetEntry;
  className?: string;
};

export function AssetFrame({ asset, className }: AssetFrameProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-muted)]",
        className,
      )}
      style={{ aspectRatio: asset.aspectRatio }}
    >
      {asset.src ? (
        <Image
          src={asset.src}
          alt={asset.alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
          <ImageIcon className="h-8 w-8 text-[var(--text-subtle)]" aria-hidden="true" />
          <p className="text-body-2 text-[var(--text-muted)]">이미지 에셋 준비중</p>
          <p className="text-caption text-[var(--text-subtle)]">{asset.alt}</p>
        </div>
      )}
    </div>
  );
}
