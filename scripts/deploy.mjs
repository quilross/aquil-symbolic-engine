import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function deploy() {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!apiToken) {
    console.error('CLOUDFLARE_API_TOKEN is not set.');
    process.exit(1);
  }

  console.log('Starting Cloudflare deployment...');

  try {
    const { stdout, stderr } = await execAsync('npx wrangler deploy', {
      env: {
        ...process.env,
        CLOUDFLARE_API_TOKEN: apiToken,
      },
    });

    console.log('Wrangler stdout:', stdout);
    if (stderr) {
      console.error('Wrangler stderr:', stderr);
    }
    console.log('Deployment successful!');
  } catch (error) {
    console.error('Failed to deploy Cloudflare worker:', error);
    process.exit(1);
  }
}

deploy();
