---
trigger: manual
---

# 🔒 UI/UX Style Rules — Music Party App (Next.js + ShadCN UI)

Terapkan aturan berikut **setiap kali saya meminta update, perubahan UI, refactor tampilan, atau penambahan komponen baru** dalam project Music Party saya.  
**Jangan pernah mengubah logika fungsi, alur data, atau struktur database.**  
Fokus hanya pada tampilan (UI), gaya (styling), dan interaksi (UX).

---

## 🎨 1. Tema & Styling (Wajib Menggunakan Tema Yang Sudah Ada)
- Selalu gunakan **ShadCN UI** dengan tema yang sudah ditetapkan pada project.
- Gunakan **class Tailwind** yang sesuai dengan palette warna tema yang sudah ada (jangan menciptakan warna baru yang keluar dari theme).
- Gunakan styling konsisten sesuai theme:
  - radius yang sama  
  - spacing yang konsisten  
  - typography yang mengikuti default ShadCN UI  
  - use `bg-primary`, `text-primary-foreground`, `bg-muted`, `hover:bg-accent`, dst  
- Jangan override theme dengan warna manual seperti hex atau rgb (kecuali saya minta).

---

## 📱 2. Responsiveness Rules
- Gunakan layout responsif yang sudah saya terapkan sebelumnya.
- Lanjutkan pattern mobile-first yang sudah ada.
- Semua perubahan UI harus:
  - tampil rapi di mobile
  - adaptif di tablet
  - optimal di layar desktop besar
- Jangan menambah media-query custom kecuali memakai utilitas Tailwind yang sudah sesuai.

---

## ✨ 3. Framer Motion Rules
- Gunakan Framer Motion untuk seluruh perubahan UI yang relevan, tetapi:
  - animasi harus minimalis  
  - smooth  
  - tidak berlebihan  
  - tidak mempengaruhi logika player  
- Efek wajib:
  - hover/motion kecil pada card & button  
  - page transition halus  
  - fade/slide saat komponen muncul  
- Jangan menambahkan animasi yang mengganggu interaksi atau timing sinkronisasi player.

---

## 🎼 4. Player & Party Mode Rules
- **Dilarang keras mengubah logika**:
  - play/pause  
  - next/previous  
  - seek/position  
  - realtime sync via Supabase  
- Hanya modifikasi tampilan elemen player:
  - tampilan cover  
  - layout tombol  
  - progress bar styles  
  - animasi UI  
- Jangan menambah state baru yang mengubah perilaku musik.

---

## 📦 5. Struktur & Komponen
- Gunakan komponen yang sudah ada (reusable) bila tersedia.
- Jangan mengubah struktur folder besar.
- Bila menambah komponen baru:
  - harus memakai ShadCN UI  
  - harus memakai theme  
  - harus menggunakan Tailwind utility yang konsisten  
  - boleh memakai Framer Motion tanpa mengubah logic  

---

## 🚫 6. Hal-hal Yang Tidak Boleh Diubah
- Jangan mengubah logika pemutaran musik.
- Jangan mengubah logika sinkronisasi realtime.
- Jangan mengubah fungsi handler, callback, atau event utama.
- Jangan menambah dependensi besar baru kecuali saya minta.
- Jangan menambah warna custom yang tidak ada di theme.
- Jangan mengubah arsitektur Next.js (App Router tetap).

---

## 🎯 7. Output Yang Harus Saya Terima
Setiap kali saya meminta tambahan UI atau refactor tampilan, hasil yang diberikan harus:

- Mengikuti tema proyek yang sudah ada
- Responsif (mobile–desktop)
- Menggunakan ShadCN UI
- Menggunakan Framer Motion sesuai aturan
- Tidak mengubah logika fungsi
- Hanya memperindah tampilan, animasi, dan pengalaman pengguna

