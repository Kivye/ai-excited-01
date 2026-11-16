import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

async function main() {
  let scriptDirectory = process.cwd();
  try {
    scriptDirectory = dirname(fileURLToPath(import.meta.url));
  } catch {
    // Use the working directory if the script URL is unavailable.
  }

  const assetPath = join(scriptDirectory, 'asset.jpg');
  let bytes: Buffer;
  try {
    bytes = await readFile(assetPath);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Cannot read asset.jpg at ${assetPath}: ${detail}`);
  }

  const expectedSize = 220740;
  if (bytes.length !== expectedSize) {
    throw new Error(`Invalid asset.jpg size: expected ${expectedSize} bytes, received ${bytes.length}`);
  }
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 ||
      bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9) {
    throw new Error('Invalid asset.jpg: JPEG start or end marker is missing');
  }

  const outputDirectory = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  await mkdir(outputDirectory, { recursive: true });
  const outputPath = join(outputDirectory, 'entry.png');
  await writeFile(outputPath, bytes);
  console.log(`Wrote ${bytes.length} bytes to ${outputPath}`);
}

main().catch((error) => {
  console.error(`Asset copy failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
