import {execSync} from 'child_process';
import {join} from 'path';

module.exports = async () => {
  execSync('npx prisma db push --skip-generate', {
    cwd: join(__dirname, '..'),
    stdio: 'inherit',
    env: process.env,
  });
};
