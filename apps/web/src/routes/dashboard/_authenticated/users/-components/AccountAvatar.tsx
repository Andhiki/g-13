import { useState } from "react";
import { AlignAvatar } from "@/ui/avatar";

export function AccountAvatar({ name, image }: { name: string; image: string | null }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  return (
    <AlignAvatar.Root size="32" aria-hidden="true" className="overflow-hidden text-label-xs">
      {image && image !== failedImage ? (
        <img
          src={image}
          alt=""
          className="size-full object-cover"
          onError={() => setFailedImage(image)}
        />
      ) : (
        name
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
      )}
    </AlignAvatar.Root>
  );
}
