# Dokumentasi Progress Kerja — Task Tracker App

> Format dokumen ini dibuat agar mudah dipakai untuk **laporan kerja**, **update Odoo**, dan **handover progress**.
> Repository: `Task_Tracker_App`
> Update terakhir: **9 Juli 2026**

---

## 1. Identitas Pekerjaan

| Item | Keterangan |
|---|---|
| Project | Task Tracker App |
| Fokus Pekerjaan | Form Marketing, Dashboard, Department System, Deadline, Detail Lead |
| Environment | Next.js 16 + React 19 + Prisma 7 + PostgreSQL |
| Mode Catatan | Progress implementasi / changelog kerja |

---

## 2. Ringkasan Status Pekerjaan

| Area | Status | Keterangan Singkat |
|---|---|---|
| Database PostgreSQL & Prisma | ✅ Selesai | Schema, migration, client, model baru sudah berjalan |
| Authentication & Session | ✅ Selesai | Login/logout/session/AuthGuard stabil |
| Department System | ✅ Selesai | Operational, Marketing, Management |
| Settings / Users / Profile | ✅ Selesai | Role & Permission UI, user management, profile |
| Form Marketing | ✅ Selesai | Single input, multiple input, draft, batch submit |
| Detail Lead Page | ✅ Selesai | Search, filter, pagination, detail per lead |
| Marketing Dashboard | ✅ Selesai | Summary, chart, ranking, tabel + pagination |
| Deadline & Notification | ✅ Selesai | dueDate, overdue checker, bell notification |
| Integrasi Odoo | ⚠️ Belum selesai | Masih bridge stub |

---

## 3. Log Progress Pekerjaan

### 3.1 Database & Prisma

#### Task
Menyiapkan database PostgreSQL dan struktur data aplikasi.

#### Progress
Sudah dikerjakan:
- setup PostgreSQL local (`App_Tracker`)
- setup Prisma ORM
- generate Prisma client
- singleton Prisma client di `src/lib/prisma.ts`
- model dasar aplikasi (`User`, `Task`, `Project`, `Milestone`, `Notification`, `AuditLog`)
- auth fields di `User`
- model `LeadSource`
- audit trail di `LeadSource`
- enum `Department`
- field `departments` di `User`
- model `LeadEntry`
- field `typeOfNeed` di `LeadEntry`
- migration dibuat dan sudah diaplikasikan

#### Output
- schema database aktif dan sinkron
- tabel lead summary dan lead detail sudah tersedia
- Prisma client siap dipakai oleh route API

#### File Terkait
- `prisma/schema.prisma`
- `prisma/migrations/**`
- `src/lib/prisma.ts`

#### Next Step
- tidak ada blocker untuk area ini

---

### 3.2 Authentication & Session

#### Task
Membuat sistem login, logout, dan proteksi route.

#### Progress
Sudah dikerjakan:
- login via `/api/auth/login`
- logout via `/api/auth/logout`
- current user via `/api/auth/me`
- session cookie berbasis token
- `AuthGuard` untuk proteksi halaman
- perbaikan error 404 auth route
- patch hydration warning di halaman login

#### Output
- user bisa login/logout
- route private aman dengan AuthGuard
- sesi user tersimpan dan dapat diverifikasi

#### File Terkait
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/auth/me/route.ts`
- `src/features/tasks/store/authStore.ts`
- `src/app/login/page.tsx`
- `src/features/tasks/components/AuthGuard.tsx`

#### Next Step
- tidak ada blocker untuk area ini

---

### 3.3 Department System

#### Task
Menambahkan department-based access dan dashboard per department.

#### Progress
Sudah dikerjakan:
- department awal: `MARKETING`, `OPERATIONAL`
- ditambahkan department baru: `MANAGEMENT`
- department switcher di header
- current department disimpan di localStorage
- default department logic diperbaiki
- mapping akses halaman per department di `AuthGuard`
- navbar menyesuaikan department aktif
- Management dibatasi ke akses **Board**
- dibuat `ManagementDashboard` dengan toggle:
  - `Task Board`
  - `Marketing Data`

#### Output
- user bisa berpindah department
- setiap department mendapat tampilan dashboard yang sesuai
- akses halaman dibatasi sesuai department aktif

#### File Terkait
- `src/features/tasks/types/user.ts`
- `src/features/tasks/store/authStore.ts`
- `src/features/tasks/components/DepartmentSwitcher.tsx`
- `src/features/tasks/components/AppHeader.tsx`
- `src/features/tasks/components/AuthGuard.tsx`
- `src/features/tasks/components/ManagementDashboard.tsx`
- `src/app/page.tsx`

#### Next Step
- jika diperlukan, Management bisa dibatasi lebih ketat menjadi full view only

---

### 3.4 Settings / Users / Profile / Role & Permission

#### Task
Menyediakan halaman pengaturan, user management, profile, dan pengaturan hak akses.

#### Progress
Sudah dikerjakan:
- halaman `/settings`
- tab:
  - Users
  - Role & Permission
  - Integrations
- create user baru dari Settings
- tampilkan list user
- badge department di list user
- role baru ditambahkan:
  - Admin
  - Member - Operational
  - Member - Marketing
  - Member - Management
  - Member - Operational & Marketing
- hak akses halaman di tab Role & Permission bisa diklik
- state permission role disimpan ke localStorage
- halaman `/profile`
- ubah nama
- ubah password

#### Output
- admin dapat mengelola user
- user dapat mengubah profil dasar
- role & permission bisa disimulasikan dari UI

#### File Terkait
- `src/app/settings/page.tsx`
- `src/app/users/page.tsx`
- `src/app/profile/page.tsx`
- `src/app/api/users/route.ts`
- `src/app/api/users/[id]/route.ts`
- `src/app/api/users/me/route.ts`
- `src/app/api/users/me/name/route.ts`
- `src/app/api/users/me/password/route.ts`

#### Next Step
- persistence permission role ke database (saat ini masih local browser)

---

### 3.5 Form Marketing / Lead Source

#### Task
Membuat sistem form marketing yang mendukung input summary, detail lead, draft, dan detail view.

#### Progress
Sudah dikerjakan:
- halaman `/lead-sources`
- section periode report tetap ada
- tanggal periode otomatis generate
- bulan otomatis generate dari start date
- reset form setelah save → kembali kosong / nol
- state awal setelah refresh juga kosong / nol

##### Riwayat Data Tersimpan
Sudah dikerjakan:
- tabel history di bawah form
- kolom:
  - Tanggal
  - Judul
  - Periode
  - Total
  - Top Channel
  - Oleh
  - Aksi
- pagination 25 data per halaman
- search/filter di history table
- tombol **Details** menggantikan tombol **Edit**
- tombol **Hapus** tetap ada
- periode 1 hari tampil sebagai 1 tanggal saja

##### Single Input View
Sudah dikerjakan:
- 1 form tunggal
- field:
  - Name
  - Phone Number
  - Email
  - Company Name
  - Job Title/Position
  - Type of Need
- channel picker (pilih 1 channel)
- submit langsung ke database via `/api/lead-entries`

##### Multiple Input View
Sudah dikerjakan:
- card per channel
- field umum per channel:
  - Name
  - Phone Number
  - Email
  - Company Name
  - Job Title/Position
  - Type of Need
- field tambahan khusus channel `Other`:
  - Information Source
- tombol **Save** per channel = simpan draft lokal
- draft bisa:
  - ditambah lebih dari satu per channel
  - diedit
  - dihapus
- tombol **Simpan Data** di bawah = kirim semua draft ke database sekaligus

##### Lead Entry / Detail Data
Sudah dikerjakan:
- model `LeadEntry`
- endpoint `/api/lead-entries`
- setiap submit single / multiple input masuk sebagai detail lead
- lead source summary otomatis update count channel + total leads

#### Output
- marketing form sudah mendukung input per lead dan multi-lead
- history dan detail data bisa dilihat terpisah
- summary dan detail saling terhubung lewat `LeadSource` dan `LeadEntry`

#### File Terkait
- `src/app/lead-sources/page.tsx`
- `src/app/api/lead-sources/route.ts`
- `src/app/api/lead-sources/[id]/route.ts`
- `src/app/api/lead-entries/route.ts`
- `prisma/schema.prisma`

#### Next Step
- bila dibutuhkan, bisa ditambahkan klik detail dari card summary/dashboard lain

---

### 3.6 Halaman Detail Lead Source

#### Task
Membuat halaman detail untuk melihat isi lead per channel dan per entry.

#### Progress
Sudah dikerjakan:
- halaman detail baru: `/lead-sources/[id]`
- tombol **Back to Lead Form**
- tampilkan detail lead source:
  - title
  - month label
  - period
  - total leads
- tabs filter per channel
- search lead
- filter need type
- pagination 25 data per halaman
- tampilkan detail per lead:
  - Name
  - Phone Number
  - Email
  - Company Name
  - Position
  - Need Type
  - Source Info
  - Diinput Oleh

#### Output
- user bisa lihat isi angka total leads secara detail
- user bisa tahu lead datang dari siapa, channel apa, dan detail inputnya

#### File Terkait
- `src/app/lead-sources/[id]/page.tsx`
- `src/app/api/lead-sources/[id]/route.ts`

#### Next Step
- tidak ada blocker untuk area ini

---

### 3.7 Marketing Dashboard

#### Task
Membuat dashboard marketing yang menampilkan summary, chart, ranking, dan tabel data.

#### Progress
Sudah dikerjakan:
- `MarketingDashboard`
- summary metrics:
  - Total Entri
  - Total Leads
  - Top Channel
  - Periode Terakhir
- detail input periode terakhir
- comparison current vs previous
- ranking channel
- tabel semua data form
- charts:
  - line chart
  - doughnut chart
- pagination 25 data di tabel "Semua Data Form"
- periode 1 hari tampil 1 tanggal saja

#### Output
- dashboard marketing sudah bisa dipakai untuk monitoring summary data form
- data visual dan tabel sudah tersedia dalam satu halaman

#### File Terkait
- `src/features/tasks/components/MarketingDashboard.tsx`

#### Next Step
- jika dibutuhkan, dashboard bisa ditambah link klik ke detail tertentu

---

### 3.8 Task Board, Deadline & Notification

#### Task
Membuat task board dengan dukungan deadline dan notifikasi.

#### Progress
Sudah dikerjakan:
- task board / kanban
- field `dueDate` di task
- deadline dipakai di task card / report / logic notifikasi
- endpoint cek overdue task
- bell notification di header
- mark as read / mark all as read
- polling notifikasi setiap 30 detik

#### Output
- task memiliki deadline
- overdue task bisa dideteksi otomatis
- user mendapatkan notifikasi dari header

#### File Terkait
- `src/features/tasks/components/TaskBoard.tsx`
- `src/features/tasks/components/AppHeader.tsx`
- `src/app/api/notifications/route.ts`
- `src/app/api/notifications/[id]/route.ts`
- `src/app/api/notifications/read-all/route.ts`
- `src/app/api/notifications/check-deadlines/route.ts`

#### Next Step
- tidak ada blocker untuk area ini

---

### 3.9 Integrasi Odoo

#### Task
Menyiapkan bridge integrasi ke Odoo.

#### Progress
Sudah dikerjakan:
- struktur bridge service dibuat
- tersedia fungsi stub:
  - test connection
  - sync task
  - delete task
  - fetch stages

#### Output
- fondasi integrasi sudah tersedia
- belum ada koneksi nyata ke server Odoo

#### File Terkait
- `src/features/integrations/services/odooService.ts`

#### Next Step
- koneksi real ke Odoo API
- sinkronisasi session/auth ke Odoo
- mapping stage real dari Odoo
- persistence hasil sync

#### Status
**⚠️ Belum selesai / masih stub**

---

## 4. Bugfix & Perbaikan Teknis

### UI / UX
- reset form tidak kembali ke sample values lagi
- refresh halaman form tidak memunculkan sample default lagi
- periode 1 hari tampil sebagai 1 tanggal
- history table dipagination
- dashboard table dipagination
- details page dipagination
- hydration warning login dipatch

### State / Logic
- auth route 404 teratasi setelah regenerate + restart dev server
- `ThemeContext` dibersihkan dari lint error `set-state-in-effect`
- `AppHeader` notification flow dibersihkan dari lint error `set-state-in-effect`
- profile page state dirapikan
- multiple input draft sekarang bisa:
  - save
  - edit
  - hapus
  - submit batch

### Data Dummy
Sudah dibuat dummy data untuk:
- riwayat data tersimpan (>25 data)
- detail lead source (>25 leads)
- multi-channel lead entries sesuai format form terbaru

---

## 5. File Baru / File Penting

### File Baru Penting
- `ARCHITECTURE.md`
- `Docs/dokumentasi.md`
- `src/features/tasks/components/ManagementDashboard.tsx`
- `src/app/profile/page.tsx`
- `src/app/settings/page.tsx`
- `src/app/api/users/me/route.ts`
- `src/app/api/users/me/name/route.ts`
- `src/app/api/users/me/password/route.ts`
- `src/app/api/lead-entries/route.ts`
- `src/app/lead-sources/[id]/page.tsx`

### File Utama yang Banyak Berubah
- `prisma/schema.prisma`
- `src/app/lead-sources/page.tsx`
- `src/app/api/lead-sources/route.ts`
- `src/app/api/lead-sources/[id]/route.ts`
- `src/features/tasks/components/AppHeader.tsx`
- `src/features/tasks/components/AuthGuard.tsx`
- `src/features/tasks/components/MarketingDashboard.tsx`
- `src/features/tasks/store/authStore.ts`
- `src/features/tasks/types/user.ts`

---

## 6. Quality Check

### Status terakhir
- `npx tsc --noEmit` → **aman**
- `npm run lint` → **tanpa error**, masih ada warning kecil lama di beberapa file non-kritis

### Warning yang masih tersisa
- `src/app/api/users/me/route.ts`
- `src/app/users/page.tsx`
- `src/features/integrations/services/odooService.ts`

---

## 7. Backlog / Yang Masih Kurang

Masih perlu dikerjakan:
- integrasi Odoo real
- report marketing yang final sesuai kebutuhan bisnis
- management full "view only" kalau ingin dibatasi lebih ketat
- semua angka summary/dashboard bisa diklik kalau memang dibutuhkan sebagai navigation ke detail
- sinkronisasi role permission ke database (saat ini masih local browser)

---

## 8. Ringkasan Siap Update Odoo

### Sudah selesai
- Database PostgreSQL
- Sistem Form
- Visualisasi Dashboard
- Sistem Deadline

### Belum selesai
- Integrasi Odoo

### Catatan penting
Fitur form sekarang sudah berkembang lebih jauh dari sub-task awal, karena sudah mencakup:
- single input
- multiple input
- draft system
- batch submit
- details page
- pagination
- search/filter
- lead detail per channel

---

## 9. Penutup

Dokumen ini adalah **catatan progres implementasi / changelog kerja**.
Dokumen ini cocok digunakan untuk:
- update progress ke Odoo
- laporan harian / mingguan
- handover progress ke tim lain
- dasar dokumentasi final produk
