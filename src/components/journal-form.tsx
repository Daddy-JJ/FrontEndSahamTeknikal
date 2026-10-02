"use client";

import { useRef, useState, useTransition } from "react";
import { submitActualJournal } from "@/app/journal/actions";

const messages: Record<string, string> = {
  invalid_request: "Permintaan tidak lengkap. Muat ulang halaman.",
  invalid_input: "Periksa harga, jumlah, tanggal, dan biaya yang diisi.",
  unauthenticated: "Sesi berakhir. Masuk kembali sebagai owner sebelum mencoba lagi.",
  forbidden: "Akun ini tidak memiliki izin owner aktif.",
  "40001": "Revisi trade berubah. Muat ulang dan periksa ledger sebelum mengirim aksi baru.",
  PT412: "Revisi trade berubah. Muat ulang dan periksa ledger sebelum mengirim aksi baru.",
  "23514": "Aturan ledger menolak aksi ini. Periksa jumlah, status entry, risiko, atau konflik request.",
  "22023": "Data tidak valid untuk aksi pada trade ini.",
  "42501": "Akses owner ditolak.",
  unavailable: "Hasil penyimpanan belum dapat dipastikan. Coba kembali dengan isian dan request yang sama, atau periksa ledger sebelum membuat aksi baru.",
};

/** Retain the rendered request ID and entered fields on failure, including lost replies. */
export function JournalForm({ children, className }: { children: React.ReactNode; className: string }) {
  const busy = useRef(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return <form method="post" className={className} onSubmit={event => {
    event.preventDefault();
    if (busy.current) return;
    const form = new FormData(event.currentTarget);
    busy.current = true;
    setError(null);
    startTransition(async () => {
      try {
        const result = await submitActualJournal(form);
        if (result.error) setError(messages[result.error] ?? messages.unavailable);
        else if (result.destination) {
          // A fresh GET also covers same-trade edits and historical replay receipts.
          // Do not race router.push with a refresh of the previous URL.
          window.location.assign(result.destination);
        }
      } catch {
        setError(messages.unavailable);
      } finally {
        busy.current = false;
      }
    });
  }}>
    <fieldset className="journal-form-fields" disabled={pending}>{children}</fieldset>
    {pending && <p role="status" className="journal-help">Menyimpan…</p>}
    {error && <p role="alert" className="journal-alert">{error}</p>}
  </form>;
}
