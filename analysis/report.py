"""Laporan deskriptif log PeluangKu untuk tahap Evaluation (tabel CSV, grafik PNG, ringkasan Markdown).

    python report.py --csv peluangku-logs.csv --out laporan
    python report.py --api https://<backend>/api --class 8A --out laporan
        (token guru dibaca dari variabel lingkungan PELUANGKU_TEACHER_TOKEN, bukan dari argumen)

Hasil bersifat DESKRIPTIF. Tidak membuktikan penurunan beban kognitif; itu diukur dengan angket.
"""

from __future__ import annotations

import argparse
import csv
import math
import os
import sys
from collections import defaultdict
from datetime import datetime
from itertools import groupby
from pathlib import Path

import matplotlib

matplotlib.use("Agg")  # tanpa jendela; hanya menulis file
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.ticker import FuncFormatter  # noqa: E402

from load import STEP_LABELS, Log, load_api, load_csv  # noqa: E402
from metrics import (  # noqa: E402
    PROBLEM_COLUMNS,
    STEP_COLUMNS,
    TREND_COLUMNS,
    class_overview,
    hint_trend,
    per_problem,
    per_step,
)

# Palet tervalidasi (slot 1 & 2) + tinta teks; latar putih agar ramah cetak.
BLUE = "#2a78d6"
ORANGE = "#eb6834"
INK = "#0b0b0b"
INK_2 = "#52514e"
GRID = "#e4e3df"
STUDENT_LINE = "#b9b8b2"

HINT_TICKS = [0, 1, 2, 3]
HINT_TICK_LABELS = ["0 (tanpa)", "1", "2", "3"]


def _style() -> None:
    plt.rcParams.update(
        {
            "figure.facecolor": "white",
            "axes.facecolor": "white",
            "axes.edgecolor": GRID,
            "axes.labelcolor": INK_2,
            "axes.titlecolor": INK,
            "axes.titlesize": 12,
            "axes.titleweight": "bold",
            "axes.titlelocation": "left",
            "axes.spines.top": False,
            "axes.spines.right": False,
            "axes.grid": True,
            "axes.axisbelow": True,
            "grid.color": GRID,
            "grid.linewidth": 0.8,
            "xtick.color": INK_2,
            "ytick.color": INK_2,
            "font.size": 10,
            "legend.frameon": False,
            "savefig.dpi": 200,
            "savefig.bbox": "tight",
        }
    )


# Koma desimal pada sumbu (gaya Indonesia), sama dengan teks laporan.
COMMA = FuncFormatter(lambda x, _pos: f"{x:g}".replace(".", ","))


def _isnan(v: object) -> bool:
    return isinstance(v, float) and math.isnan(v)


def chart_hint_per_problem(problems: list[dict], path: Path) -> None:
    fig, ax = plt.subplots(figsize=(7, 4))
    ordered = sorted(problems, key=lambda r: (r["class_code"], r["student_code"], r["problem_order"]))
    for _, g in groupby(ordered, key=lambda r: (r["class_code"], r["student_code"])):
        g = list(g)
        ax.plot([r["problem_order"] for r in g], [r["max_hint_level"] for r in g],
                color=STUDENT_LINE, linewidth=1, alpha=0.7)  # fmt: skip

    by_order: dict[int, list[int]] = defaultdict(list)
    for r in problems:
        by_order[r["problem_order"]].append(r["max_hint_level"])
    orders = sorted(by_order)
    means = [sum(by_order[o]) / len(by_order[o]) for o in orders]
    ax.plot(orders, means, color=BLUE, linewidth=2.5, marker="o", markersize=6, zorder=3)

    # Legenda tetap ada walau garis kelas juga diberi label langsung.
    ax.plot([], [], color=STUDENT_LINE, linewidth=1, label="Tiap siswa")
    ax.plot([], [], color=BLUE, linewidth=2.5, marker="o", label="Rata-rata kelas")
    ax.legend(loc="upper right")
    ax.annotate(f"{means[-1]:.1f}".replace(".", ","), (orders[-1], means[-1]), xytext=(6, 0),
                textcoords="offset points", va="center", color=INK, fontsize=9)  # fmt: skip
    ax.set_title("Level petunjuk tertinggi per soal")
    ax.set_xlabel("Soal ke- (n = banyak siswa)")
    ax.set_ylabel("Level petunjuk")
    ax.set_xticks(orders, [f"{o}\n(n={len(by_order[o])})" for o in orders], fontsize=8)
    ax.set_yticks(HINT_TICKS, HINT_TICK_LABELS)
    ax.set_ylim(-0.2, 3.3)
    ax.grid(axis="x", visible=False)  # garis tegak mudah tertukar dengan garis siswa
    fig.savefig(path)
    plt.close(fig)


def chart_hint_halves(trend: list[dict], path: Path) -> None:
    data = [t for t in trend if not _isnan(t["change"])]
    # Penurunan terbesar di atas
    data.sort(key=lambda t: (t["change"], t["student_code"]), reverse=True)
    height = max(2.5, 0.32 * len(data) + 1.2)
    fig, ax = plt.subplots(figsize=(7, height))
    y = list(range(len(data)))
    first = [t["hint_first_half"] for t in data]
    second = [t["hint_second_half"] for t in data]
    ax.hlines(y, first, second, color=STUDENT_LINE, linewidth=2, zorder=1)
    ax.scatter(first, y, color=BLUE, s=55, zorder=2, label="Separuh awal soal", edgecolors="white", linewidths=1.5)
    ax.scatter(second, y, color=ORANGE, s=55, zorder=3, label="Separuh akhir soal", edgecolors="white", linewidths=1.5)
    for yi, t in zip(y, data):
        if t["change"] == 0:  # dua titik bertumpuk → beri tahu pembaca
            ax.annotate("tetap", (t["hint_second_half"], yi), xytext=(8, 0), textcoords="offset points",
                        va="center", color=INK_2, fontsize=8)
    ax.set_yticks(y, [t["student_code"] for t in data])
    ax.set_xticks(HINT_TICKS, HINT_TICK_LABELS)
    ax.set_xlim(-0.2, 3.2)
    ax.grid(axis="y", visible=False)
    ax.set_title("Rata-rata level petunjuk: separuh awal vs akhir")
    ax.set_xlabel("Rata-rata level petunjuk tertinggi per soal")
    ax.legend(loc="upper center", bbox_to_anchor=(0.5, -0.12 if len(data) > 6 else -0.25), ncol=2)
    fig.savefig(path)
    plt.close(fig)


def chart_per_step(steps: list[dict], path: Path) -> None:
    labels = [STEP_LABELS[s["step"]] for s in steps]
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9, 3.6))
    panels = [
        (ax1, [s["percent_correct"] for s in steps], "% langkah benar", 100.0, "{:.0f}%"),
        (ax2, [s["mean_tries"] for s in steps], "Rata-rata percobaan", None, "{:.1f}"),
    ]
    for ax, values, title, ymax, fmt in panels:
        heights = [0 if _isnan(v) else v for v in values]
        bars = ax.bar(labels, heights, color=BLUE, width=0.6, edgecolor="white", linewidth=2)
        for bar, v in zip(bars, values):
            text = "–" if _isnan(v) else fmt.format(v).replace(".", ",")
            ax.annotate(text, (bar.get_x() + bar.get_width() / 2, bar.get_height()), xytext=(0, 3),
                        textcoords="offset points", ha="center", va="bottom", color=INK, fontsize=9)  # fmt: skip
        ax.set_title(title)
        ax.grid(axis="x", visible=False)
        ax.tick_params(axis="x", labelsize=8, rotation=20)
        ax.set_ylim(0, ymax * 1.08 if ymax else max(1.0, max(heights, default=0)) * 1.2)
        ax.yaxis.set_major_formatter(COMMA)
    fig.tight_layout(w_pad=3)
    fig.savefig(path)
    plt.close(fig)


def _num(v: object) -> str:
    """Angka gaya Indonesia (koma desimal); NaN → '–'."""
    if isinstance(v, bool):
        return "ya" if v else "tidak"
    if isinstance(v, float):
        return "–" if math.isnan(v) else f"{v:g}".replace(".", ",")
    return str(v)


def _md_table(rows: list[dict], columns: dict[str, str]) -> str:
    head = "| " + " | ".join(columns.values()) + " |"
    sep = "| " + " | ".join("---" for _ in columns) + " |"
    body = ["| " + " | ".join(_num(r[k]) for k in columns) + " |" for r in rows]
    return "\n".join([head, sep, *body])


def _write_csv(path: Path, rows: list[dict], columns: list[str]) -> None:
    """CSV mesin (titik desimal, NaN kosong) agar mudah dibuka di Excel/SPSS."""
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(columns)
        for r in rows:
            w.writerow(
                [
                    "" if _isnan(r[c]) else r[c].isoformat() if isinstance(r[c], datetime) else r[c]
                    for c in columns
                ]
            )


def write_report(logs: list[Log], out: Path, source: str) -> dict:
    out.mkdir(parents=True, exist_ok=True)
    _style()
    problems = per_problem(logs)
    trend = hint_trend(problems)
    steps = per_step(logs)
    o = class_overview(logs, problems, trend)

    _write_csv(out / "per_soal.csv", problems, PROBLEM_COLUMNS)
    _write_csv(out / "tren_petunjuk.csv", trend, TREND_COLUMNS)
    _write_csv(out / "per_langkah.csv", steps, STEP_COLUMNS)

    chart_hint_per_problem(problems, out / "petunjuk_per_soal.png")
    chart_hint_halves(trend, out / "petunjuk_awal_akhir.png")
    chart_per_step(steps, out / "per_langkah.png")

    trend_md = _md_table(
        trend,
        {"student_code": "Siswa", "problems": "Soal", "hint_first_half": "Petunjuk awal",
         "hint_second_half": "Petunjuk akhir", "change": "Selisih"},  # fmt: skip
    )
    steps_md = _md_table(
        [{**s, "step": STEP_LABELS[s["step"]]} for s in steps],
        {"step": "Langkah", "logs": "Log", "percent_correct": "% benar", "mean_tries": "Rata-rata percobaan",
         "percent_used_hint": "% pakai petunjuk"},  # fmt: skip
    )
    text = f"""# Laporan log PeluangKu

Sumber data: `{source}`

> Ringkasan ini **deskriptif**. Angka di bawah menggambarkan pemakaian aplikasi oleh peserta uji coba,
> bukan bukti bahwa aplikasi menurunkan beban kognitif. Beban kognitif diukur dengan angket IL/EL/GL.

## Ringkasan

- Siswa: **{o['students']}**, log langkah: **{o['logs']}**, soal dikerjakan: **{o['problem_attempts']}**
- Soal dengan semua langkah benar: **{_num(o['percent_problems_all_correct'])}%**
- Soal yang pembahasannya dibuka: **{_num(o['percent_problems_opened_discussion'])}%**
- Perbandingan level petunjuk separuh awal vs akhir ({o['students_with_comparison']} siswa dengan ≥ 2 soal):
  turun **{o['students_hint_decreased']}**, tetap **{o['students_hint_same']}**, naik **{o['students_hint_increased']}**;
  median selisih **{_num(o['median_hint_change'])}** (negatif = petunjuk berkurang)

## Level petunjuk per soal (GL03)

![Level petunjuk tertinggi per soal](petunjuk_per_soal.png)

![Separuh awal vs akhir](petunjuk_awal_akhir.png)

{trend_md}

## Per langkah

![Per langkah](per_langkah.png)

{steps_md}

## Catatan metode

- Satu soal = semua log dengan `problem_id` yang sama; soal diurutkan menurut waktu mulai pertamanya.
- Level petunjuk per soal = level tertinggi yang dipakai pada soal itu (0 = tanpa petunjuk).
- Separuh awal = ⌊n/2⌋ soal pertama; soal tengah (n ganjil) masuk separuh akhir (sama dengan `/api/teacher/summary`).
- Log dengan `id` yang sama hanya dihitung sekali.
- Tabel lengkap: `per_soal.csv`, `tren_petunjuk.csv`, `per_langkah.csv`.
"""
    (out / "laporan.md").write_text(text, encoding="utf-8")
    return o


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Laporan deskriptif log PeluangKu.")
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--csv", help="File CSV ekspor (dari /api/teacher/logs?format=csv atau ekspor lokal)")
    src.add_argument("--api", help="URL API backend, mis. https://host/api")
    ap.add_argument("--class", dest="class_code", help="Kode kelas, mis. 8A")
    ap.add_argument("--out", default="laporan", help="Folder hasil (default: laporan)")
    args = ap.parse_args(argv)

    if args.csv:
        logs = load_csv(args.csv)
        source = Path(args.csv).name
        if args.class_code:
            logs = [x for x in logs if x.class_code == args.class_code]
    else:
        token = os.environ.get("PELUANGKU_TEACHER_TOKEN", "")
        if not token:
            print("Isi variabel lingkungan PELUANGKU_TEACHER_TOKEN terlebih dahulu.", file=sys.stderr)
            return 2
        logs = load_api(args.api, token, args.class_code)
        source = f"{args.api} (kelas {args.class_code or 'semua'})"
    if not logs:
        print("Tidak ada log untuk dianalisis.", file=sys.stderr)
        return 1

    overview = write_report(logs, Path(args.out), source)
    print(f"Laporan ditulis ke {Path(args.out) / 'laporan.md'}")
    for k, v in overview.items():
        print(f"  {k}: {v}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
