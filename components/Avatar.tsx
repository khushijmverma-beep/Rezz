export default function Avatar({
  name,
  size = 40,
  src,
}: {
  name: string;
  size?: number;
  src?: string | null;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ? `${name}'s profile picture` : "Profile picture"}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      style={{ width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.35)) }}
      className="flex shrink-0 items-center justify-center rounded-full bg-black font-semibold text-white"
    >
      {initials || "?"}
    </div>
  );
}