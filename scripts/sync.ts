import path from 'node:path';
import fs from 'node:fs';

// 1. Resolve project root independent of working directory
const projectRoot = path.resolve(__dirname, '..');

// 2. Load .env file from project root if present
const envPath = path.join(projectRoot, '.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envPath);
}

// 3. Ensure DATABASE_URL is absolute so SQLite finds the DB regardless of caller directory
if (process.env.DATABASE_URL?.startsWith('file:')) {
  const dbRel = process.env.DATABASE_URL.slice(5);
  if (!path.isAbsolute(dbRel)) {
    process.env.DATABASE_URL = `file:${path.resolve(projectRoot, dbRel)}`;
  }
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
  console.log(`[SoloQ Sync CLI] Hora: ${new Date().toISOString()}`);
  console.log('====================================================');

  try {
    const result = await syncAllPlayers('cli-cron');
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('----------------------------------------------------');
    console.log(`[SoloQ Sync CLI] Completado en ${elapsedSec}s.`);
    console.log(`[SoloQ Sync CLI] Invocadores sincronizados: ${result.count}`);

    if (result.errors.length > 0) {
      console.warn(`[SoloQ Sync CLI] Errores en jugadores (${result.errors.length}):`);
      for (const err of result.errors) {
        console.warn(`  - ${err}`);
      }
      process.exit(1);
    } else {
      console.log(`[SoloQ Sync CLI] Todas las cuentas se sincronizaron con éxito.`);
      process.exit(0);
    }
  } catch (err: any) {
    console.error('[SoloQ Sync CLI] Error fatal durante la ejecución:', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
