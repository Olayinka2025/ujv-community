import logoAsset from "@/assets/ujv-logo.png.asset.json";

export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="UJV Community logo"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}
