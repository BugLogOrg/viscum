import type { ProtocolColorId } from "@/lib/protocol-colors";

/** ベタ塗りの色丸（絵文字の影・立体感を避ける） */
export function ProtocolDot({
  id,
  className = "h-2.5 w-2.5",
}: {
  id: ProtocolColorId;
  className?: string;
}) {
  const bg: Record<ProtocolColorId, string> = {
    green: "bg-viscum-protocol-green",
    blue: "bg-viscum-protocol-blue",
    yellow: "bg-viscum-protocol-yellow",
    red: "bg-viscum-protocol-red",
  };
  return (
    <span
      className={`inline-block shrink-0 rounded-full ${bg[id]} ${className}`}
      aria-hidden
    />
  );
}
