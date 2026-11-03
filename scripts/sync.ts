import path from 'node:path';
import fs from 'node:fs';

// 1. Resolve project root independent of working directory and ensure cwd is root
const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

// 2. Load .env file from project root if present
const envPath = path.join(projectRoot, '.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envPath);
}

// 3. Resolve and verify DATABASE_URL points to an existing SQLite database
let dbFilePath = path.resolve(projectRoot, 'dev.db');
if (process.env.DATABASE_URL?.startsWith('file:')) {
  const dbRel = process.env.DATABASE_URL.slice(5);
  dbFilePath = path.isAbsolute(dbRel) ? dbRel : path.resolve(projectRoot, dbRel);
  process.env.DATABASE_URL = `file:${dbFilePath}`;
} else {
  process.env.DATABASE_URL = `file:${dbFilePath}`;
}

if (!fs.existsSync(dbFilePath)) {
  console.error(`[SoloQ Sync CLI] Error fatal: La base de datos SQLite no existe en "${dbFilePath}".`);
  console.error(`[SoloQ Sync CLI] Abortando sincronización para evitar crear un archivo dev.db vacío.`);
  process.exit(1);
}

// 4. Import sync logic and Prisma client after environment is fully configured
import { syncAllPlayers } from '../src/lib/sync';
import { prisma } from '../src/lib/db';

async function main() {
  const startTime = Date.now();
  console.log('====================================================');
  console.log(`[SoloQ Sync CLI] Iniciando sincronización...`);
  console.log(`[SoloQ Sync CLI] PID: ${process.pid}`);
  console.log(`[SoloQ Sync CLI] Raíz de proyecto: ${projectRoot}`);
  console.log(`[SoloQ Sync CLI] Base de datos: ${dbFilePath}`);
  console.log(`[SoloQ Sync CLI] Hora: ${new Date().toISOString()}`);
  console.log('====================================================');

  try {
    const result = await syncAllPlayers('cli-cron');
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('----------------------------------------------------');
    console.log(`[SoloQ Sync CLI] Completado en ${elapsedSec}s.`);
    console.log(`[SoloQ Sync CLI] Invocadores sincronizados: ${result.count}`);
    if (result.errors.length > 0) {
      console.warn(`[SoloQ Sync CLI] Advertencias (${result.errors.length}):`);
      result.errors.forEach((err) => console.warn(`  - ${err}`));
    }
    console.log('====================================================');
    process.exit(0);
  } catch (error: any) {
    console.error('----------------------------------------------------');
    console.error(`[SoloQ Sync CLI] Error en sincronización:`, error?.message || error);
    console.log('====================================================');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
