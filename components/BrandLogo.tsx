import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({
  size = 40,
  className,
  showWord = false,
}: {
  size?: number;
  className?: string;
  showWord?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/a-studio-icon.png"
        alt="A Studio"
        width={size}
        height={size}
        className="rounded-xl bg-white object-contain p-0.5 shadow-glow"
        priority
      />
      {showWord && <span className="font-display tracking-wide text-neon">MANAGERS LEAGUE</span>}
    </span>
  );
}
