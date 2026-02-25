import type { JSX } from "react";

type PresenceDotProps = {
  online?: boolean;
  className?: string;
};

export function PresenceDot({ online = false, className = "" }: PresenceDotProps): JSX.Element {
  return (
    <span
      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#111b21] ${
        online ? "bg-green-500" : "bg-gray-400"
      } ${className}`}
    />
  );
}
