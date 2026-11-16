[![make.fun · ai-excited-01](https://make.fun/badge/ai-excited-01.svg)](https://make.fun/bounty/ai-excited-01?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)
[![rank](https://make.fun/badge/ai-excited-01/Kivye/ai-excited-01/rank.svg)](https://make.fun/bounty/ai-excited-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)
[![reward](https://make.fun/badge/ai-excited-01/Kivye/ai-excited-01/reward.svg)](https://make.fun/bounty/ai-excited-01?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)

# The Big Squeeze

Dua plush teal dan oranye berpelukan dalam hujan konfeti dan kilau hangat. Seluruh gambar 768 × 768 dibuat secara prosedural: bulu, cahaya, ekspresi, dan encoder PNG dengan CRC32 sendiri. Hanya standard library Node.js, tanpa dependensi atau aset eksternal.

## Menjalankan

Gunakan Node.js 22.21.0 atau lebih baru:

```sh
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts
```

Hasil: `out/entry.png`, maksimum 1 MiB. Tanpa variabel lingkungan, hasil ditulis ke `/output/entry.png`. Render deterministik.
