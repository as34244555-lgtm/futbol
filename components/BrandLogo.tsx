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
        src="/liga-nova-logo.png"
        alt="Liga Nova"
        width={size}
        height={size}
        className="rounded-xl object-cover shadow-glow"
        priority
      />
      {showWord && <span className="font-display tracking-wide text-neon">LIGA NOVA</span>}
    </span>
  );
}
