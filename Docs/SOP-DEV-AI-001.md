# SOP-DEV-AI-001 — Standar Penggunaan AI Coding Tools

> **Spec-Driven Development Governance untuk Tim Rekayasa Perangkat Lunak**

| Field | Detail |
| --- | --- |
| **Nomor Dokumen** | SOP-DEV-AI-001 |
| **Versi** | 1.0 |
| **Status** | Draft untuk Review |
| **Klasifikasi** | Internal — Confidential |
| **Berlaku untuk** | Seluruh Tim Delivery & Engineering |
| **Tanggal Terbit** | 8 Juli 2026 |
| **Pemilik Dokumen** | Technical Delivery Lead |
| **Siklus Review** | Setiap 6 bulan atau saat ada perubahan arsitektur |

---

## Daftar Isi

- [1. Pendahuluan](#1-pendahuluan)
  - [1.1 Latar Belakang](#11-latar-belakang)
  - [1.2 Tujuan](#12-tujuan)
  - [1.3 Ruang Lingkup](#13-ruang-lingkup)
- [2. Definisi & Istilah](#2-definisi--istilah)
- [3. Prinsip Tata Kelola](#3-prinsip-tata-kelola)
- [4. Struktur Tata Kelola & Peran](#4-struktur-tata-kelola--peran)
- [5. Alur Kerja Wajib (Mandatory Workflow)](#5-alur-kerja-wajib-mandatory-workflow)
  - [Fase 0 — Architecture Constitution](#fase-0--architecture-constitution)
  - [Fase 1 — Sinkronisasi Requirement & Backlog](#fase-1--sinkronisasi-requirement--backlog)
  - [Fase 2 — Rencana Teknis Wajib Sebelum Implementasi](#fase-2--rencana-teknis-wajib-sebelum-implementasi)
  - [Fase 3 — Implementasi Bertahap oleh AI Agent](#fase-3--implementasi-bertahap-oleh-ai-agent)
  - [Fase 4 — Review Gate, Merge & Sinkronisasi Spec](#fase-4--review-gate-merge--sinkronisasi-spec)
- [6. Standar Review Kode Hasil AI](#6-standar-review-kode-hasil-ai)
- [7. Keamanan & Kerahasiaan Data](#7-keamanan--kerahasiaan-data)
- [8. Metrik & Monitoring Adopsi](#8-metrik--monitoring-adopsi)
- [9. Pengecualian & Eskalasi](#9-pengecualian--eskalasi)
- [10. Lampiran](#10-lampiran)

---

## 1. Pendahuluan

### 1.1 Latar Belakang

Adopsi AI coding assistant (Claude Code, Cursor, GitHub Copilot, dan sejenisnya) meningkatkan kecepatan penulisan kode secara signifikan, namun tanpa kerangka kerja yang jelas, kecepatan ini justru menimbulkan risiko baru:

- Penyimpangan dari standar arsitektur
- Duplikasi/penggunaan pola usang (*deprecated*)
- Peningkatan beban review
- Akumulasi utang teknis (*"AI slop"*) yang pada akhirnya memperlambat rilis dan menambah bug produksi

Dokumen ini menetapkan standar wajib bagi seluruh tim delivery dan engineering dalam menggunakan AI coding tools, dengan pendekatan **Spec-Driven Development (SDD)** yang bersifat **tool-agnostic** — prinsip dan alur kerja berlaku terlepas dari AI coding tool spesifik yang digunakan oleh masing-masing individu atau proyek.

### 1.2 Tujuan

- Memastikan seluruh kode yang dihasilkan dengan bantuan AI tetap selaras dengan standar arsitektur yang berlaku di setiap repository.
- Mengurangi waktu review dan defect rate akibat kode hasil AI yang tidak terkontrol (*"blind-prompting"*).
- Menjamin **traceability** antara requirement, keputusan desain, dan implementasi — sebagai bagian dari audit trail, khususnya untuk klien di industri teregulasi (perbankan, sektor jasa keuangan).
- Menstandarkan proses tanpa mengunci tim pada satu vendor/tool AI tertentu.

### 1.3 Ruang Lingkup

Berlaku untuk seluruh aktivitas pengembangan perangkat lunak — internal maupun proyek klien — di lingkungan **PT Proxsis Biztech Global (PBG)** dan **PT Proxsis Digital Solusi Indonesia (PDSI)** yang melibatkan AI coding assistant dalam bentuk apa pun, mencakup:

- Pembuatan fitur baru
- Perbaikan bug
- Refactoring
- Migrasi
- Pembuatan dokumentasi teknis berbantuan AI

> **Prinsip Dasar:** AI coding agent adalah kolaborator yang bekerja di dalam batas yang ditetapkan manusia — bukan black box yang menerima prompt bebas dan mengembalikan kode yang langsung dipercaya. **Spec ditulis dan disetujui lebih dulu; kode adalah detail implementasi.**

---

## 2. Definisi & Istilah

| Istilah | Definisi |
| --- | --- |
| **Spec-Driven Development (SDD)** | Pendekatan pengembangan di mana requirement dan rancangan teknis (spec) disepakati secara eksplisit dan tertulis sebelum AI diizinkan mengubah kode. |
| **Blind-prompting** | Praktik memberi instruksi bebas ke AI coding agent tanpa spec, batasan arsitektur, atau rencana teknis tertulis. |
| **Architecture Constitution** | Dokumen aturan tertulis per-repository yang menjadi rujukan wajib bagi AI agent: konvensi kode, folder yang dilarang disentuh (legacy/deprecated), dan pola arsitektur acuan. |
| **Change Proposal** | Paket dokumen (proposal, design, tasks) yang diajukan sebelum implementasi untuk satu unit perubahan/fitur. |
| **AI Slop** | Kode hasil AI yang secara fungsional berjalan namun menyimpang dari standar arsitektur, menduplikasi logika, atau menggunakan pola usang — menambah utang teknis tanpa disadari. |
| **Review Gate** | Titik pemeriksaan wajib oleh manusia sebelum sebuah tahap (rencana teknis atau kode) boleh berlanjut ke tahap berikutnya. |
| **Spec Drift** | Kondisi ketika dokumen spec tidak lagi mencerminkan kode aktual karena tidak disinkronkan setelah perubahan. |

---

## 3. Prinsip Tata Kelola

Delapan prinsip berikut berlaku untuk seluruh penggunaan AI coding tools, apa pun tool spesifiknya:

1. **Spec sebelum kode.** Tidak ada perubahan kode signifikan yang dimulai tanpa rencana teknis tertulis yang disetujui reviewer manusia.
2. **Satu sumber kebenaran arsitektur.** Setiap repository memiliki dokumen "constitution" yang menjadi rujukan wajib AI agent dan manusia.
3. **Kode adalah hasil, bukan sumber kebenaran.** Spec dan dokumentasi desain hidup di repository, sejajar dengan kode, dan menjadi rujukan utama saat terjadi ambiguitas.
4. **Tidak ada AI yang menyentuh folder legacy/kritis tanpa izin eksplisit tertulis dalam constitution.**
5. **Setiap perubahan tertelusur ke requirement.** Tidak ada kode tanpa keterkaitan ke ticket/backlog yang jelas.
6. **Human review adalah gerbang wajib, bukan opsional** — di level rencana teknis (sebelum kode ditulis) maupun di level pull request (sebelum merge).
7. **Tool-agnostic.** Prinsip ini berlaku sama untuk Claude Code, Cursor, GitHub Copilot, atau tool AI coding lain yang dipakai anggota tim — standar tidak terikat pada satu vendor.
8. **Spec disinkronkan setiap merge.** Dokumen desain diarsipkan/diperbarui bersamaan dengan merge kode agar tidak terjadi spec drift.

---

## 4. Struktur Tata Kelola & Peran

| Aktivitas | Developer | Tech Lead / Reviewer | Architecture Owner | Project Manager |
| --- | --- | --- | --- | --- |
| Menulis & memutakhirkan Architecture Constitution | C | **R** | **A** | I |
| Menyusun Change Proposal (proposal/design/tasks) | **R** | C | C | I |
| Menyetujui rencana teknis sebelum implementasi | I | **A/R** | C | I |
| Menjalankan AI coding agent untuk implementasi | **R** | I | - | - |
| Review Pull Request hasil AI | C | **A/R** | I | I |
| Merge & sinkronisasi/arsip spec | **R** | **A** | I | I |
| Audit kepatuhan berkala terhadap standar ini | I | C | **A/R** | I |

> **Keterangan:** R = Responsible, A = Accountable, C = Consulted, I = Informed

---

## 5. Alur Kerja Wajib (Mandatory Workflow)

Alur kerja terdiri atas **lima fase**. AI coding agent tidak diperkenankan mengubah kode produksi di luar urutan fase ini.

```text
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ FASE 0       │───▶│ FASE 1       │───▶│ FASE 2       │───▶│ FASE 3       │───▶│ FASE 4       │
│ Architecture │    │ Sinkronisasi │    │ Rencana      │    │ Implementasi │    │ Review Gate  │
│ Constitution │    │ Req & Backlog│    │ Teknis       │    │ oleh AI      │    │ & Merge      │
└──────────────┘    └──────────────┘    └──────┬───────┘    └──────────────┘    └──────────────┘
                                                    │
                                            ┌──────▼───────┐
                                            │ Review Gate  │
                                            │ #1 (manusia) │
                                            └──────────────┘
```

### Fase 0 — Architecture Constitution

Sebelum AI coding tool digunakan pada sebuah repository, repository tersebut wajib memiliki dokumen constitution yang berisi minimal:

- Daftar folder/modul legacy atau deprecated yang **dilarang** diubah atau dijadikan referensi oleh AI.
- Konvensi penamaan, code style, dan pola arsitektur acuan (mis. layering, dependency direction, error handling).
- Daftar helper/library internal yang wajib dipakai ulang, dan daftar yang sudah usang dan dilarang.
- Batasan keamanan: data/kredensial yang tidak boleh pernah muncul di prompt atau kode.

Dokumen ini disimpan di root repository (mis. `ARCHITECTURE.md` atau setara), diberi versi melalui Git, dan menjadi rujukan wajib — baik dibaca manual oleh developer maupun diberikan sebagai konteks ke AI agent.

### Fase 1 — Sinkronisasi Requirement & Backlog

Requirement dan spec ditulis dalam format terstruktur (markdown) dan disinkronkan ke sistem tracking (Jira atau setara) sebagai satu sumber kebenaran. AI agent hanya bekerja dalam domain yang didefinisikan oleh ticket yang sudah disetujui — bukan dari instruksi lisan/chat yang tidak terdokumentasi.

### Fase 2 — Rencana Teknis Wajib Sebelum Implementasi

Untuk setiap unit perubahan, sebelum AI diizinkan mengubah kode, dibuat paket dokumen rencana teknis pada folder kerja terpisah (`changes/<nama-perubahan>/`), berisi:

- **`proposal.md`** — apa yang diusulkan dan mengapa (masalah, dampak, alternatif yang dipertimbangkan).
- **`design.md`** — pendekatan teknis, komponen yang terdampak, keputusan arsitektur.
- **`tasks.md`** — pemecahan pekerjaan menjadi langkah-langkah kecil yang dapat direview dan dieksekusi bertahap.
- **`delta-spec`** (opsional) — perubahan spesifik terhadap spec/kontrak yang sudah ada.

#### Review Gate #1

> ⚠️ Rencana teknis **WAJIB** direview dan disetujui oleh Tech Lead/Reviewer sebelum AI agent diizinkan menyentuh kode. Rencana yang ditolak dikembalikan untuk revisi — bukan langsung diimplementasikan.

### Fase 3 — Implementasi Bertahap oleh AI Agent

Setelah rencana disetujui, AI coding agent mengimplementasikan kode secara bertahap mengikuti `tasks.md` — bukan dalam satu batch besar. Setiap tahap idealnya menghasilkan commit yang dapat direview secara independen. Developer bertanggung jawab memverifikasi setiap output AI terhadap constitution dan rencana yang disetujui sebelum melanjutkan ke task berikutnya.

### Fase 4 — Review Gate, Merge & Sinkronisasi Spec

Pull request hasil AI melalui review kode standar ditambah pemeriksaan khusus berikut, sebelum dapat di-merge:

- [ ] Kesesuaian dengan Architecture Constitution (tidak ada pola deprecated, tidak menyentuh folder terlarang).
- [ ] Kesesuaian implementasi dengan `design.md` dan `tasks.md` yang disetujui — deviasi signifikan wajib didokumentasikan dan disetujui ulang.
- [ ] Tidak ada data sensitif/kredensial yang bocor melalui prompt history atau kode.
- [ ] Test coverage untuk kode baru sesuai standar minimum tim.

Setelah merge, dokumen spec/design diarsipkan atau dipindahkan menjadi bagian dari spec permanen repository, agar dokumentasi tetap mencerminkan kondisi kode terkini (mencegah spec drift).

---

## 6. Standar Review Kode Hasil AI

Checklist berikut wajib digunakan reviewer, di luar checklist code review standar yang sudah berlaku:

| No | Item Pemeriksaan |
| --- | --- |
| 1 | Kode tidak menyentuh atau meniru pola dari folder/modul yang ditandai legacy/deprecated di constitution. |
| 2 | Tidak ada duplikasi helper/fungsi yang sudah tersedia di codebase (indikasi AI "reinventing" alih-alih reuse). |
| 3 | Struktur/pola desain konsisten dengan modul sejenis yang sudah ada (naming, layering, error handling). |
| 4 | Perubahan sesuai cakupan `tasks.md` — tidak ada scope creep yang belum disetujui. |
| 5 | Tidak ada kredensial, token, atau data klien yang ter-hardcode atau bocor dalam kode/komentar. |
| 6 | Test baru/terbarui mencakup skenario utama dan edge case yang relevan. |
| 7 | Spec/dokumentasi terkait sudah diperbarui bersamaan dengan kode. |

---

## 7. Keamanan & Kerahasiaan Data

Mengingat sebagian besar engagement PBG/PDSI berada di sektor teregulasi, ketentuan berikut bersifat **wajib**:

1. **Dilarang** memasukkan data klien yang bersifat rahasia, kredensial produksi, kunci API, atau data pribadi (PII) ke dalam prompt AI coding tool apa pun, kecuali tool tersebut telah melalui kajian keamanan dan disetujui secara tertulis oleh Architecture Owner/tim keamanan internal.

2. Untuk proyek klien dengan persyaratan kontraktual/regulasi (mis. POJK 11/2022, ISO 27001:2022, NIST CSF), penggunaan AI coding tool wajib mengacu pada klausul kerahasiaan data dalam kontrak klien; jika kontrak tidak eksplisit mengatur, **default-nya adalah tidak mengizinkan** penggunaan AI coding tool berbasis cloud untuk kode/data yang diklasifikasikan sebagai confidential.

3. Riwayat prompt yang menyentuh kode produksi disimpan sesuai kebijakan retensi log internal dan dapat diaudit.

4. Constitution setiap repository wajib mencantumkan secara eksplisit data/sistem apa yang tidak boleh direferensikan AI agent (mis. connection string produksi, skrip migrasi data nasabah).

---

## 8. Metrik & Monitoring Adopsi

Efektivitas standar ini dipantau melalui metrik berikut, direview setiap kuartal oleh Technical Delivery Lead:

| Metrik | Definisi | Target Arah |
| --- | --- | --- |
| Rasio proposal disetujui tanpa revisi mayor | Persentase change proposal yang lolos Review Gate #1 tanpa perlu direvisi signifikan | Meningkat ▲ |
| Waktu review PR hasil AI | Rata-rata waktu dari PR dibuka hingga disetujui | Menurun/Stabil ▼ |
| Defect rate pasca-rilis pada kode hasil AI | Jumlah bug produksi yang berasal dari perubahan berbantuan AI | Menurun ▼ |
| Insiden penyimpangan arsitektur | Jumlah PR yang ditolak karena melanggar constitution | Menurun ▼ |
| Cakupan spec vs kode | Persentase perubahan kode yang memiliki dokumen spec terkait | Mendekati 100% ▲ |

---

## 9. Pengecualian & Eskalasi

Pengecualian terhadap alur kerja ini (mis. hotfix produksi darurat) diperbolehkan dengan ketentuan:

- Disetujui secara verbal/tertulis oleh Tech Lead **sebelum** tindakan, dengan dokumentasi retroaktif (`proposal.md` ringkas) dibuat maksimal 1×24 jam setelah insiden ditangani.
- Kode darurat tetap wajib melalui **Review Gate #2** (PR review) sebelum permanen menjadi bagian dari main branch.
- Pola pengecualian yang berulang pada modul yang sama menjadi trigger untuk meninjau ulang constitution modul tersebut.

**Eskalasi** ketidaksepakatan antara developer dan reviewer terkait kepatuhan standar ini diteruskan ke **Architecture Owner** sebagai pemutus akhir.

---

## 10. Lampiran

### Lampiran A — Template `proposal.md`

```markdown
## Ringkasan
[Satu-dua kalimat tentang perubahan yang diusulkan]

## Masalah / Latar Belakang
[Mengapa perubahan ini diperlukan]

## Cakupan
[Apa yang termasuk dan tidak termasuk]

## Alternatif yang Dipertimbangkan
[Opsi lain dan alasan tidak dipilih]

## Dampak
[Modul/sistem yang terdampak, risiko]
```

### Lampiran B — Template `design.md`

```markdown
## Pendekatan Teknis
[Penjelasan arsitektur/pola yang dipakai]

## Komponen Terdampak
[Daftar modul, service, database]

## Keputusan Desain Kunci
[Trade-off dan alasan]

## Kesesuaian dengan Constitution
[Konfirmasi tidak melanggar aturan arsitektur]
```

### Lampiran C — Template `tasks.md`

```markdown
- [ ] Task 1: [deskripsi singkat, dapat direview independen]
- [ ] Task 2: ...
- [ ] Task 3: ...

Setiap task idealnya menghasilkan satu commit yang reviewable.
```

### Lampiran D — Contoh Struktur Folder Repository

```text
project-root/
├── ARCHITECTURE.md # Architecture Constitution
├── changes/
│   └── nama-perubahan/
│       ├── proposal.md
│       ├── design.md
│       └── tasks.md
├── specs/ # Spec permanen, sumber kebenaran fitur aktif
├── src/
│   └── ...
└── ...
```

### Riwayat Perubahan Dokumen

| Versi | Tanggal | Perubahan | Penulis |
| --- | --- | --- | --- |
| 1.0 | 8 Juli 2026 | Penerbitan awal | Technical Delivery Lead |

**Internal — Confidential**

---

## Catatan Penggunaan sebagai System Prompt / AI Context

Untuk menjadikan dokumen ini sebagai **landasan AI saat mengoding**, Anda bisa menggunakan beberapa pendekatan:

| Pendekatan | Cara | Cocok Untuk |
| --- | --- | --- |
| **Cursor Rules** | Tempel isi markdown ini ke file `.cursor/rules/architecture.mdc` | Cursor IDE |
| **Claude Code** | Simpan sebagai `CLAUDE.md` di root repo | Claude Code |
| **GitHub Copilot** | Tempel di `.github/copilot-instructions.md` | Copilot |
| **Custom System Prompt** | Gunakan isi markdown sebagai system prompt pada API call | Custom integration |

Struktur markdown ini sudah **AI-readable** — heading hierarchy, checklist format, dan code block templates semuanya compatible dengan parser markdown umum yang digunakan AI coding tools.
