import * as Accordion from "./accordion";
import { AlignLinkButton } from "./link-button";
import { AlignModal } from "./modal";
import { Typography } from "./typography";

const questions = [
  {
    question: "Bagaimana cara membaca peta kurikulum?",
    answer:
      "Mata kuliah dikelompokkan menurut semester. Garis menghubungkan prasyarat ke mata kuliah yang mensyaratkannya. Arahkan kursor atau fokuskan mata kuliah untuk menyorot koneksinya, lalu pilih untuk membuka detail. Gunakan tombol di kanan bawah untuk beralih ke daftar.",
  },
  {
    question: "Bagaimana cara mengganti versi kurikulum?",
    answer:
      "Buka tombol filter di samping pencarian, lalu pilih kurikulum 2021 atau 2026. Filter yang sama juga menyediakan pilihan peminatan atau kelompok mata kuliah.",
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

export function Faq() {
  return (
    <AlignModal.Root>
      <AlignModal.Trigger asChild>
        <AlignLinkButton.Root>FAQ</AlignLinkButton.Root>
      </AlignModal.Trigger>
      <AlignModal.Content className="max-h-[85dvh] max-w-[560px] overflow-y-auto p-5">
        <AlignModal.Title asChild>
          <Typography as="h2" variant="title" className="m-0 pr-8">
            FAQ
          </Typography>
        </AlignModal.Title>
        <AlignModal.Description className="sr-only">
          Pertanyaan umum tentang peta kurikulum, roadmap kuliah, dan arsip ujian.
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
