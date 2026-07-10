# ARCHITECTURE.md — Task Tracker App Constitution

## Status
Dokumen constitution aktif untuk repository `Task_Tracker_App`.

## Prinsip Dasar
- Spec sebelum implementasi untuk perubahan signifikan.
- Reuse pola yang sudah ada di codebase; hindari membuat pola baru tanpa alasan kuat.
- UI state tetap di komponen client yang relevan; data persistence lewat route API `src/app/api/**/route.ts`.
- Prisma schema adalah source of truth untuk model database.
- Jangan hardcode secret, token, connection string, atau data sensitif ke kode.

## Struktur Arsitektur
- `src/app/**` → route/page Next.js App Router dan route API.
- `src/features/**` → UI dan logic domain per fitur.
- `src/lib/**` → shared infra/helper lintas fitur (auth, prisma, dsb).
- `prisma/schema.prisma` → schema database.
- `prisma/migrations/**` → histori migrasi yang harus sinkron dengan schema.

## Konvensi Wajib
- Ikuti pola file/komponen yang sudah ada sebelum membuat komponen baru.
- Gunakan TypeScript type yang eksplisit untuk state/form/API payload.
- Semua write ke database harus lewat route API; jangan akses DB langsung dari komponen client.
- Setelah perubahan selesai, wajib jalankan lint dan typecheck.
- Untuk perubahan database: update schema, buat migration, lalu generate Prisma client.

## Area Sensitif / Jangan Disentuh Sembarangan
- `src/generated/prisma/**` → hasil generate, jangan edit manual.
- `.env*` → jangan tulis ulang atau expose ke output/user.
- `prisma/migrations/**` lama → jangan ubah histori migration lama kecuali benar-benar perlu untuk memperbaiki migration yang belum pernah dipakai.

## Pola yang Harus Direuse
- Toast UI: ikuti pola toast yang sudah ada di page existing.
- Auth/session: reuse `src/lib/auth.ts` dan `src/features/tasks/store/authStore.ts`.
- Prisma access: reuse `src/lib/prisma.ts`.
- Permission/department label: reuse `src/features/tasks/types/user.ts`.

## Larangan
- Jangan menambahkan komentar kode baru kecuali diminta.
- Jangan membuat file dokumentasi baru selain diminta user.
- Jangan commit/push tanpa instruksi eksplisit.
- Jangan ubah arsitektur besar tanpa proposal/rencana teknis yang jelas.

## Definition of Significant Change
Perubahan dianggap signifikan jika menyentuh salah satu dari:
- schema database / migration
- auth / permission / department system
- route API baru
- flow bisnis utama (lead input, board, report)
- komponen lintas halaman atau shared infra

## Review Checklist
Sebelum selesai, pastikan:
- perubahan sesuai requirement
- tidak duplikasi helper/pola
- migration + schema + generated Prisma sinkron
- lint dan typecheck jalan
- tidak ada secret bocor
