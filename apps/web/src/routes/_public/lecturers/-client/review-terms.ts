export function reviewTerms(date: Date): string[] {
  // Academic years start in August; the second semester starts in February.
  const year = date.getFullYear();
  const month = date.getMonth();
  const currentYear = month >= 7 ? year : year - 1;
  const currentSemester = month >= 1 && month < 7 ? 1 : 0;
  const terms: string[] = [];
  for (let start = 2021; start <= currentYear; start++) {
    for (let semester = 0; semester <= (start === currentYear ? currentSemester : 1); semester++) {
      terms.push(`${start}/${start + 1} ${semester === 0 ? "Ganjil" : "Genap"}`);
    }
  }
  return terms;
}
