/**
 * Format angka jadi format tampilan dengan titik sebagai pemisah ribuan.
 * Contoh: "12000" → "12.000"
 */
export function formatInputCurrency(value: string): string {
  // Hapus semua karakter selain angka
  const numericOnly = value.replace(/\D/g, '')
  if (!numericOnly) return ''
  // Tambahkan titik setiap 3 digit dari kanan
  return numericOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/**
 * Parse string format titik ribuan ke number.
 * Contoh: "12.000" → 12000
 */
export function parseInputCurrency(value: string): number {
  const numericOnly = value.replace(/\./g, '')
  const parsed = parseFloat(numericOnly)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Format number ke tampilan Rupiah.
 * Contoh: 12000 → "Rp 12.000"
 */
export function formatRupiah(value: number): string {
  return 'Rp ' + value.toLocaleString('id-ID')
}
