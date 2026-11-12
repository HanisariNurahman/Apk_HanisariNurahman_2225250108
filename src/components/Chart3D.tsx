// Grafik batang 3D interaktif (three.js) untuk hasil simulasi (F7) [GL01, DS01].
// Prinsip beban kognitif (DESIGN.md §1):
// - Setiap batang = satu titik sampel; bidang transparan = peluang teoretik. Tidak ada objek hiasan.
// - Label nama hasil & frekuensi menempel pada batangnya (kedekatan, EL02).
// - Tidak ada rotasi otomatis; render hanya saat ada perubahan (hemat baterai).
// - Animasi tinggi batang ≤ 300 ms, mati bila prefers-reduced-motion (EL03).
// - Modul ini di-lazy-load: three.js hanya diunduh saat halaman simulasi dibuka.

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { chartScale, relativeFrequencies, total } from '../lib/simulation';
import { prefersReducedMotion } from '../lib/webgl';

export interface Chart3DProps {
  labels: string[];
  counts: number[];
  /** Peluang teoretik tiap hasil, mis. 1/6. */
  theoretical: number;
  /** Teks pecahan peluang teoretik, mis. "1/6". */
  theoreticalLabel: string;
  /** Dipanggil jika WebGL gagal dibuat → induk menampilkan grafik 2D. */
  onUnavailable?: () => void;
}

interface SceneApi {
  update(counts: number[]): void;
  resetView(): void;
  dispose(): void;
}

const MAX_H = 3;
const BAR_W = 0.7;
const GAP = 0.4;
const ANIM_MS = 300;
const MIN_SCALE = 0.0001;
const VIEW_DIR = new THREE.Vector3(0, 0.55, 1).normalize();

function cssColor(name: string, fallback: string): THREE.Color {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(v || fallback);
}

function makeLabel(className: string, text = ''): { el: HTMLDivElement; obj: CSS2DObject } {
  const el = document.createElement('div');
  el.className = className;
  el.textContent = text;
  return { el, obj: new CSS2DObject(el) };
}

function createScene(
  host: HTMLElement,
  labels: string[],
  theoretical: number,
  theoreticalLabel: string,
): SceneApi {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = 'chart3d-overlay';
  host.appendChild(labelRenderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  const n = labels.length;
  const span = n * BAR_W + (n - 1) * GAP;
  const target = new THREE.Vector3(0, MAX_H * 0.4, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(3, 6, 5);
  scene.add(sun);

  // Alas
  const floorMat = new THREE.MeshStandardMaterial({ roughness: 1 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(span + 1, 0.06, BAR_W + 1.2), floorMat);
  floor.position.y = -0.03;
  scene.add(floor);

  // Batang + label nama (di depan alas) + label frekuensi (di atas batang)
  const barMat = new THREE.MeshStandardMaterial({ roughness: 0.55 });
  const bars: THREE.Mesh[] = [];
  const values: { el: HTMLDivElement; obj: CSS2DObject }[] = [];
  labels.forEach((label, i) => {
    const x = -span / 2 + BAR_W / 2 + i * (BAR_W + GAP);
    const geo = new THREE.BoxGeometry(BAR_W, 1, BAR_W);
    geo.translate(0, 0.5, 0); // alas batang di y = 0
    const bar = new THREE.Mesh(geo, barMat);
    bar.position.x = x;
    bar.scale.y = MIN_SCALE;
    scene.add(bar);
    bars.push(bar);

    const name = makeLabel('chart3d-label', label);
    name.obj.position.set(x, 0, BAR_W / 2 + 0.45);
    scene.add(name.obj);

    const value = makeLabel('chart3d-value');
    value.obj.position.set(x, 0.25, 0);
    scene.add(value.obj);
    values.push(value);
  });

  // Bidang peluang teoretik (warna netral, bukan warna makna baru)
  const theoMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.16,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const theo = new THREE.Mesh(new THREE.PlaneGeometry(span + 0.6, BAR_W + 0.6), theoMat);
  theo.rotation.x = -Math.PI / 2;
  scene.add(theo);
  const edgeMat = new THREE.LineBasicMaterial();
  theo.add(new THREE.LineSegments(new THREE.EdgesGeometry(theo.geometry), edgeMat));
  const theoText = makeLabel('chart3d-theo', `Teoretik ${theoreticalLabel}`);
  theoText.obj.position.set(-span / 2 + 0.2, 0, 0.35); // lokal: z bidang = atas dunia
  theo.add(theoText.obj);

  function applyColors() {
    barMat.color.copy(cssColor('--primary', '#2457c5'));
    floorMat.color.copy(cssColor('--border', '#dfe2e7'));
    const line = cssColor('--text', '#1c1f24');
    theoMat.color.copy(line);
    edgeMat.color.copy(line);
  }
  applyColors();

  function render() {
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }

  // Kontrol putar: tanpa geser (pan), sudut dibatasi agar grafik tidak "hilang".
  const controls = new OrbitControls(camera, labelRenderer.domElement);
  controls.enablePan = false;
  controls.enableDamping = false;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.minAzimuthAngle = -Math.PI / 3;
  controls.maxAzimuthAngle = Math.PI / 3;
  controls.target.copy(target);
  let userMoved = false;
  controls.addEventListener('start', () => {
    userMoved = true;
  });
  controls.addEventListener('change', render);

  function fitDistance(): number {
    const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
    const hTan = Math.tan(vHalf) * camera.aspect;
    const needW = (span / 2 + 0.9) / hTan;
    const needH = (MAX_H * 0.75) / Math.tan(vHalf);
    return Math.max(needW, needH) + 1;
  }

  function resetView() {
    const d = fitDistance();
    controls.minDistance = d * 0.6;
    controls.maxDistance = d * 1.6;
    camera.position.copy(target).addScaledVector(VIEW_DIR, d);
    controls.target.copy(target);
    controls.update();
    userMoved = false;
    render();
  }

  // Tinggi batang
  let current = new Array<number>(n).fill(0);
  let theoH = MAX_H / 2;
  let raf = 0;

  function setHeights(h: number[], th: number) {
    h.forEach((v, i) => {
      bars[i].scale.y = Math.max(v, MIN_SCALE);
      values[i].obj.position.y = v + 0.25;
    });
    theo.position.y = th;
  }

  function update(counts: number[]) {
    const nTotal = total(counts);
    const rel = relativeFrequencies(counts);
    const yMax = chartScale(rel, theoretical);
    const toH = rel.map((r) => (r / yMax) * MAX_H);
    const toTh = (theoretical / yMax) * MAX_H;
    counts.forEach((c, i) => {
      if (values[i]) values[i].el.textContent = nTotal ? String(c) : '';
    });

    cancelAnimationFrame(raf);
    if (prefersReducedMotion()) {
      current = toH;
      theoH = toTh;
      setHeights(current, theoH);
      render();
      return;
    }
    const fromH = current.slice();
    const fromTh = theoH;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / ANIM_MS);
      const e = 1 - (1 - p) ** 3; // ease-out
      current = fromH.map((f, i) => f + (toH[i] - f) * e);
      theoH = fromTh + (toTh - fromTh) * e;
      setHeights(current, theoH);
      render();
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  // Ukuran mengikuti wadah
  const ro = new ResizeObserver(() => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (userMoved) render();
    else resetView();
  });
  ro.observe(host);

  // Ikuti mode terang/gelap
  const onTheme = () => {
    applyColors();
    render();
  };
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', onTheme);
  const mo = new MutationObserver(onTheme);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  return {
    update,
    resetView,
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mq.removeEventListener('change', onTheme);
      mo.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) o.geometry.dispose();
      });
      [barMat, floorMat, theoMat, edgeMat].forEach((m) => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
      labelRenderer.domElement.remove();
    },
  };
}

export default function Chart3D({ labels, counts, theoretical, theoreticalLabel, onUnavailable }: Chart3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<SceneApi | null>(null);
  const countsRef = useRef(counts);
  countsRef.current = counts;
  const unavailableRef = useRef(onUnavailable);
  unavailableRef.current = onUnavailable;
  const labelKey = labels.join('|');

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let api: SceneApi;
    try {
      api = createScene(host, labelKey.split('|'), theoretical, theoreticalLabel);
    } catch {
      unavailableRef.current?.();
      return;
    }
    apiRef.current = api;
    api.update(countsRef.current);
    return () => {
      api.dispose();
      apiRef.current = null;
    };
  }, [labelKey, theoretical, theoreticalLabel]);

  useEffect(() => {
    apiRef.current?.update(counts);
  }, [counts]);

  const n = total(counts);
  const summary =
    n === 0
      ? 'Grafik batang 3D, belum ada lemparan.'
      : `Grafik batang 3D dari ${n} lemparan: ` +
        labels.map((l, i) => `${l} muncul ${counts[i]} kali`).join(', ') +
        `. Peluang teoretik tiap hasil ${theoreticalLabel}.`;

  return (
    <figure className="chart3d">
      <div ref={hostRef} className="chart3d-host" role="img" aria-label={summary} />
      <figcaption className="chart3d-caption">
        <span className="muted">Geser grafik untuk memutar. Bidang tipis = peluang teoretik.</span>
        <button type="button" className="btn-link" onClick={() => apiRef.current?.resetView()}>
          Reset
        </button>
      </figcaption>
    </figure>
  );
}
