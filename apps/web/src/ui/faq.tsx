import * as Accordion from "./accordion";
import { AlignLinkButton } from "./link-button";
import { AlignModal } from "./modal";
import { Typography } from "./typography";

const questions = [
  {
    question: "Bagaimana cara berkontribusi?",
    answer: (
      <>
        Siapa pun bisa ikut mengembangkan g-13. Kode sumbernya terbuka di{" "}
        <AlignLinkButton.Root asChild variant="primary" underline>
          <a href="https://github.com/Andhiki/g-13" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </AlignLinkButton.Root>
        . Punya ide, menemukan bug, atau ingin mengoreksi kurikulum? Langsung buat{" "}
        <AlignLinkButton.Root asChild variant="primary" underline>
          <a href="https://github.com/Andhiki/g-13/issues" target="_blank" rel="noreferrer">
            issue
          </a>
        </AlignLinkButton.Root>{" "}
        atau kirim{" "}
        <AlignLinkButton.Root asChild variant="primary" underline>
          <a href="https://github.com/Andhiki/g-13/pulls" target="_blank" rel="noreferrer">
            pull request
          </a>
        </AlignLinkButton.Root>
        . Kontribusi kecil juga berarti, termasuk perbaikan teks dan laporan masalah. Untuk koreksi
        kurikulum, sertakan sumber resmi.
      </>
    ),
  },
  {
    question: "Bagaimana cara membaca peta kurikulum?",
    answer:
      "Mata kuliah dikelompokkan menurut semester. Garis menghubungkan prasyarat ke mata kuliah yang mensyaratkannya. Arahkan kursor atau fokuskan mata kuliah untuk menyorot koneksinya, lalu pilih untuk membuka detail. Gunakan tombol di kanan bawah untuk beralih ke daftar.",
  },
  {
    question: "Bagaimana cara mengganti versi kurikulum?",
    answer:
      "Buka tombol filter di samping pencarian, lalu pilih kurikulum 2021 atau 2026. Mata kuliah pilihan dikelompokkan di bawah kolom semester.",
  },
  {
    question: "Apa perbedaan peta kurikulum dan roadmap kuliah?",
    answer:
      "Peta kurikulum menampilkan mata kuliah dan hubungan prasyarat dalam suatu versi kurikulum. Roadmap menyusun rencana per semester berdasarkan jawaban kuis dan target selesai 7 atau 8 semester. Rencana ini perlu dicocokkan dengan ketentuan resmi prodi sebelum menentukan KRS.",
  },
  {
    question: "Bagaimana cara menggunakan Arsip Ujian?",
    answer:
      "Cari atau pilih mata kuliah, buka folder tahun, lalu pilih berkas ujian untuk melihat pratinjau. Tombol pada pratinjau tersedia untuk mengunduh, menyalin tautan, atau membuka berkas di Google Drive. Arsip berasal dari Himakom UGM dan berlaku lintas versi kurikulum.",
  },
];

export function Faq({ className }: { className?: string }) {
  return (
    <AlignModal.Root>
      <AlignModal.Trigger asChild>
        <AlignLinkButton.Root className={className}>FAQ</AlignLinkButton.Root>
      </AlignModal.Trigger>
      <AlignModal.Content className="max-h-[85dvh] max-w-[560px] overflow-y-auto p-5">
        <AlignModal.Title asChild>
          <Typography as="h2" variant="title" className="m-0 pr-8">
            FAQ
          </Typography>
        </AlignModal.Title>
        <AlignModal.Description asChild>
          <Typography as="p" variant="paragraph" className="mb-0 mt-2 text-text-sub-600">
            g-13 adalah proyek open source yang dibangun bersama komunitas. Siapa pun bisa memakai,
            mempelajari, dan ikut memperbaikinya.
          </Typography>
        </AlignModal.Description>
        <Accordion.Root type="single" collapsible className="mt-4 divide-y divide-stroke-soft-200">
          {questions.map(({ question, answer }) => (
            <Accordion.Item key={question} value={question}>
              <Accordion.Header>
                <Accordion.Trigger>
                  {question}
                  <Accordion.Arrow aria-hidden="true" className="shrink-0" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="pb-4">{answer}</Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </AlignModal.Content>
    </AlignModal.Root>
  );
}
