# 💰 Aplikasi Budgeting Bulanan

Aplikasi manajemen keuangan bulanan dengan Next.js, Supabase, dan TailwindCSS. Bisa diakses oleh banyak user dengan autentikasi masing-masing.

## Tech Stack

- **Next.js 14** - Framework React dengan App Router
- **Supabase** - Database dan Autentikasi (gratis)
- **TypeScript** - Type safety
- **TailwindCSS** - Styling modern
- **date-fns** - Manipulasi tanggal
- **Vercel** - Deployment gratis

## Fitur

- ✅ Autentikasi user dengan email/password
- ✅ Dashboard dengan overview keuangan bulanan
- ✅ Manajemen budget per kategori
- ✅ Pencatatan transaksi (pemasukan/pengeluaran)
- ✅ Kategori default otomatis saat registrasi
- ✅ Progress bar untuk tracking budget
- ✅ Filter transaksi berdasarkan tipe
- ✅ Multi-user support (data terpisah per user)

## Setup Project

### 1. Clone dan Install Dependencies

```bash
cd budgeting-app
npm install
```

### 2. Setup Supabase

1. Buat akun di [supabase.com](https://supabase.com) (gratis)
2. Buat project baru di Supabase
3. Masuk ke project → SQL Editor
4. Copy dan jalankan SQL dari file `supabase/schema.sql`
5. Enable Email Auth di:
   - Project Settings → Authentication → Providers → Email
6. Ambil credentials dari:
   - Project Settings → API
   - Copy `Project URL` dan `anon public key`

### 3. Setup Environment Variables

Buat file `.env.local` di root project:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Cara Penggunaan

1. **Registrasi**: Daftar akun baru dengan email dan password
2. **Dashboard**: Lihat overview keuangan bulanan (total budget, pemasukan, pengeluaran, sisa)
3. **Budget**: Atur budget bulanan per kategori pengeluaran
4. **Transaksi**: Catat pemasukan dan pengeluaran harian
5. **Kategori**: 10 kategori default otomatis dibuat saat registrasi

## Struktur Database

- **categories**: Kategori pemasukan/pengeluaran
- **budgets**: Budget bulanan per kategori
- **transactions**: Riwayat transaksi
- **Row Level Security**: Data user terpisah dan aman

## Deploy ke Vercel (Gratis)

### Cara 1: Melalui Vercel Dashboard

1. Push code ke GitHub
2. Login ke [vercel.com](https://vercel.com)
3. Import repository dari GitHub
4. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy

### Cara 2: Melalui CLI

```bash
npm install -g vercel
vercel
```

Ikuti instruksi dan tambahkan environment variables saat diminta.

## Catatan Penting

- Supabase free tier: 500MB database, 2GB bandwidth/bulan (cukup untuk personal/small team)
- Vercel free tier: Unlimited bandwidth, 100GB bandwidth/bulan untuk Hobby plan
- Data user terpisah dengan Row Level Security (RLS)
- Password minimal 6 karakter

## Troubleshooting

**Error: User tidak terautentikasi**
- Pastikan environment variables sudah di-set dengan benar
- Cek Supabase Auth settings sudah enable Email provider

**Error: Database connection failed**
- Pastikan SQL schema sudah dijalankan di Supabase SQL Editor
- Cek Project URL dan Anon Key sudah benar

**Deploy gagal di Vercel**
- Pastikan environment variables sudah di-set di Vercel dashboard
- Cek build logs untuk error spesifik
