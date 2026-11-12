// PIN Area guru. Ini hanya penghalang agar siswa tidak membuka area guru tanpa sengaja,
// BUKAN keamanan kuat (data di HP tidak dienkripsi). PIN tidak disimpan apa adanya, melainkan hash-nya.
// crypto.subtle tidak tersedia di http://IP-laptop, jadi dipakai hash FNV-1a 32-bit bergaram.

const SALT = 'peluangku-guru';

export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

export function hashPin(pin: string): string {
  let h = 0x811c9dc5;
  for (const ch of SALT + pin) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function checkPin(pin: string, storedHash: string | null): boolean {
  return !!storedHash && isValidPin(pin) && hashPin(pin) === storedHash;
}
