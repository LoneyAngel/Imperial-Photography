import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const localPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(localPath)) {
  dotenv.config({ path: localPath, override: true });
}

