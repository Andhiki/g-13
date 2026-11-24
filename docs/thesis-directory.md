# Thesis directory: submissions, consent, and maintenance

The public thesis directory lives at `/theses`. Authors submit thesis data through the
GitHub Issue Form in
[`.github/ISSUE_TEMPLATE/thesis_submission.yml`](../.github/ISSUE_TEMPLATE/thesis_submission.yml),
and a maintainer enters the approved data through `/dashboard/theses`.

There is no in-app public submission form. The public site is read-only.

## Why GitHub Issues

- The audience is Computer Science students and alumni, who usually have a GitHub account.
- The issue form enforces required fields and consent checkboxes.
- The issue URL and creation date are a timestamped consent record.
- It avoids building a public form, spam protection, and email handling for v1.
- The maintainer still reviews and publishes every record through the dashboard.

## Data contract

Required in the submission:

- Thesis title.
- Author name.
- Year.
- At least one supervisor.

Optional:

- Indonesian and English abstract.
- Keywords.
- Public contact (email or URL).
- Repository/ETD/DOI link.
- Peminatan or sub-lab.
- Batch.

The public DTO never returns `consent_at`, `consent_source`, status, timestamps, deleted
records, withheld abstracts, or withheld contact details. A record can be published as
metadata-only.

The `peminatan`/sub-lab value is currently a free-text field. A curated multi-select
sub-lab model is a follow-up; until then, use the single text field and keep the wording
consistent with the author's submission.

## Submission privacy

The GitHub issue is public and indexed. Tell authors:

- Do not include NIM, grades, transcripts, phone numbers, or private email addresses.
- Only fill the public contact field with an address or URL they want displayed.
- For private data or if they do not have GitHub, contact the maintainer through the
  profile linked in [SECURITY.md](../SECURITY.md). Do not ask them to post private data
  in the public issue.

The public contact field is optional. The dashboard marks consent with
`contact_public`; the public DTO hides the contact unless both consent and a valid
value exist.

## Consent record

The author's consent checkboxes are part of the GitHub issue. When entering the record:

1. Set **Author consent recorded** in the dashboard.
2. Paste the issue URL into **Consent source**.
3. Only enable **Publish abstract** or **Show contact** when the author clearly allowed
   those fields.

The service sets `consent_at` on first consent and preserves it on later edits. The
dashboard never returns the consent source publicly. The public page may state that data
and abstract are published with the author's permission.

## Workflow

1. Author opens the form from the CTA on `/theses` (or the repository issue templates)
   and submits the issue.
2. Maintainer reviews:
   - Required fields and supervisor names are present.
   - The author has consented to metadata, abstract, and contact as applicable.
   - The issue contains no NIM, grades, transcripts, phone numbers, or private email.
   - The repository/ETD link, if present, is an `http(s)` URL.
3. Maintainer enters the data in `/dashboard/theses`:
   - Draft first; publish when the fields and consent are complete.
   - Link supervisors to the lecturer directory when there is a confident match;
     otherwise use the snapshot name and leave the lecturer link empty.
4. Maintainer publishes the record, then comments the public `/theses/<slug>` URL on the
   issue and closes it.
5. If the submission is incomplete or unsafe, comment with the reason and keep it open or
   close it after handling the private channel.

The public pages are server-rendered and read from D1 on each request; publishing, hiding,
or deleting a record appears on the next request. The public thesis routes are not cached.

## Corrections and removal

Authors can request a correction or removal by commenting on their submission issue or
contacting the maintainer through the private channel in `SECURITY.md`.

- Edit the record in `/dashboard/theses` for corrections.
- Hide it from public pages when the author wants it removed but the audit record should
  remain.
- Soft-delete it to move it to the Deleted tab; restore returns it as a draft.
- Comment on the issue with the outcome and close it when resolved.

Do not ask for private data in a public issue, and do not expose the private contact in
the public thesis record.

## Full-text policy

The site hosts no full-text PDFs and does not mirror ETD. The record may link to an
authorised repository, DOI, publication, or the author's public contact. If no link or
contact is available, the detail page says the full text is not currently available.

Do not scrape or bulk-import ETD. The author submission is the source of truth; ETD is an
optional link.

## Verification

Run:

```sh
bun run check
bun run build
```

Then verify manually:

1. Open `/theses` and confirm the `Have a thesis to showcase?` CTA links to
   `https://github.com/Andhiki/g-13/issues/new?template=thesis_submission.yml`.
2. Confirm the issue form shows the required fields, the consent checkboxes, and the
   privacy warning.
3. Submit a test issue (or use a maintainer-authored test issue) and confirm the
   `thesis-submission` and `needs-triage` labels.
4. Enter and publish the test record in `/dashboard/theses`.
5. Open `/theses` and `/theses/<slug>`; confirm the public fields, withheld fields,
   JSON-LD, and canonical URL.
6. Comment the public URL on the test issue and close it.
7. Test a correction and a hide/delete/restore cycle.

If the issue form cannot be exercised in the local environment, at minimum verify the CTA
link in the rendered `/theses` HTML and validate the issue form YAML.
