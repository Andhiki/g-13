import { useState } from "react";
import { useLocale } from "../useLocale";
import { Typography } from "./typography";

const messages = [
  "Biar kami masak dulu…",
  "Mengumpulkan cincin emas…",
  "Menyeduh kopi untuk server…",
  "Merapikan kabel semesta…",
  "Membujuk bit agar kompak…",
  "Menggelar rapat para piksel…",
  "Menunggu ilham dari kucing…",
  "Memoles roda hamster…",
  "Mencari titik koma yang kabur…",
  "Menyiapkan bekal petualangan…",
  "Menghangatkan mesin ide…",
  "Menyusun bintang satu per satu…",
];

export function Loading() {
  const { text } = useLocale();
  const [message] = useState(() => messages[Math.floor(Math.random() * messages.length)]!);

  return (
    <div
      role="status"
      className="flex flex-1 flex-col items-center justify-center gap-4 text-center text-primary-base"
    >
      <span
        aria-hidden="true"
        className="size-24 bg-current [mask:url('/theme/sonic-dancing.gif')_center/contain_no-repeat]"
      />
      <Typography
        variant="subtitle2"
        className="m-0 animate-pulse font-sans motion-reduce:animate-none"
      >
        {text(message)}
      </Typography>
    </div>
  );
}
