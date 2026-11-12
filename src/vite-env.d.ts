/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL API backend FastAPI, mis. https://peluangku-api.onrender.com/api. Kosong → sinkronisasi mati. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
