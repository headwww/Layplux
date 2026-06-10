import { rollup } from 'rollup';
import { loadConfigFile } from 'rollup/loadConfigFile';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(__dirname, '../rollup.config.mjs');

export async function buildUmd() {
  const { options, warnings } = await loadConfigFile(configPath);
  warnings.flush();
  for (const optionsObj of options) {
    const bundle = await rollup(optionsObj);
    await Promise.all(optionsObj.output.map((o) => bundle.write(o)));
    await bundle.close();
  }
}
