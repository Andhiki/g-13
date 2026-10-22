# Parent verification — 22 October 2026

These checks verify the extraction package, not academic approval or production readiness.

## Independently checked

- Reopened both structured JSON files and recomputed source SHA256 values against the retained files.
- 2021: checked provenance on all182 schedule/catalog rows and PDF-to-printed page offsets. Confirmed53 actual schedule rows and15 generic elective slots;111 complete unique elective codes plus3 placeholders.
- 2021 credits: raw required-column sum125 minus10 for five unselected religion alternatives minus11 for repeated placements equals104. Generic elective slots sum40. These reconcile the printed144-SKS plan; raw displayed rows must not simply be added together.
- 2026:55 required schedule rows represent46 unique course codes and109SKS. Checked every displayed semester total against its rows, separately from the unique credit sum.
- 2026:64 interest-area rows comprise25WM and39P rows, with6 areas;9 outside-program activity choices,24 equivalency rows,13 transition rules.
- 2026: checked source-page references on all128 course/activity rows, the uploaded-source hash, and the67-page raw companion with zero page-footer mismatches.
- Visually inspected 2026 printed pages168,169,170,175 and2021 revision2023 printed pages251,258. These spot-checks confirm primary-table layout, merged equivalency cells, prerequisite legends, credit summary, and repeated placements.

## Limits requiring follow-up

- Academic interpretation has not been independently approved by a prodi adviser.
- Source documents contain inconsistencies and ambiguities. These are recorded in the extraction reports rather than silently repaired.
- Seven 2026 diagram pages (printed182–188) contain sparse extracted text. No claim is made that graphical curriculum maps were OCR-transcribed or reconciled edge by edge.
- Course descriptions in the 2026 source remain page text; topics/CPL/references are not normalized into application fields.
- JSON outputs retain source-specific structures and raw table rows. A reviewed application data contract remains future work.
- The reference site's public repository/license was not identified in bounded research. No original code or UI asset was copied into this project.
