import type { JSX } from "react";
import { PresenceDot } from "./PresenceDot";

type AvatarWithPresenceProps = {
  src: string;
  alt: string;
  online?: boolean;
  sizeClassName?: string;
};

export function AvatarWithPresence({
  src,
  alt,
  online = false,
  sizeClassName = "h-10 w-10",
}: AvatarWithPresenceProps): JSX.Element {
  return (
    <div className="relative">
      <img src={src} alt={alt} className={`${sizeClassName} rounded-full object-cover`} />
      <PresenceDot online={online} />
    </div>
  );
}
