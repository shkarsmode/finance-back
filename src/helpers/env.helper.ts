import { existsSync } from 'fs';
import { resolve } from 'path';

export function getEnvPath(dest: string): string {
    const isProduction: boolean = false;
    const fallback: string = resolve(`${dest}/.env`);
    const filename: string = isProduction ? `.env` : '.env.dev';
    let filePath: string = resolve(`${dest}/${filename}`);

    if (!existsSync(filePath)) {
        filePath = fallback;
    }

    return filePath;
}
