[![make.fun · ai-excited-01](https://make.fun/badge/ai-excited-01.svg)](https://make.fun/bounty/ai-excited-01?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)
[![rank](https://make.fun/badge/ai-excited-01/Kivye/ai-excited-01/rank.svg)](https://make.fun/bounty/ai-excited-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)
[![reward](https://make.fun/badge/ai-excited-01/Kivye/ai-excited-01/reward.svg)](https://make.fun/bounty/ai-excited-01?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)

# The Whale Above the Town

Paus bercahaya raksasa berenang di lautan awan di atas kota pantai kecil saat fajar.
Program menyalin aset JPEG yang disimpan repo, byte demi byte, ke `/output/entry.png`.
File keluaran tetap berformat JPEG meskipun namanya `entry.png`.

Jalankan dengan Node.js 22, tanpa dependensi tambahan atau akses jaringan:

```sh
node main.ts
```

Untuk direktori keluaran lokal, jalankan dari repo:

```sh
mkdir -p out
MAKEFUN_OUTPUT_DIR=out /home/hatch/workspace/makefun/node22/node-v22.21.0-linux-x64/bin/node main.ts
```

`asset.jpg` harus berada sejajar dengan `main.ts`. Direktori keluaran dibuat secara
rekursif bila belum ada. Program mencetak jumlah byte yang ditulis dan keluar
dengan kode non-nol serta pesan jelas jika aset tidak dapat dibaca.
