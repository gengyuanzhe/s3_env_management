import { S3Client } from '@aws-sdk/client-s3';
import { getById } from './storage.js';

const clientCache = new Map();

export async function getS3Client(envId) {
  if (clientCache.has(envId)) return clientCache.get(envId);

  const env = await getById('environments.json', envId);
  if (!env || !env.s3Config) throw new Error(`Environment ${envId} not found or missing S3 config`);

  const { endpoint, ak, sk } = env.s3Config;
  if (!endpoint || !ak || !sk) throw new Error('S3 config incomplete: missing endpoint, ak, or sk');

  const isAWS = /s3[\.\-][\w-]+\.amazonaws\.com/.test(endpoint);
  const regionMatch = endpoint.match(/s3[\.\-]([\w-]+)\.amazonaws\.com/);
  const region = regionMatch ? regionMatch[1] : 'us-east-1';

  const config = {
    region,
    credentials: { accessKeyId: ak, secretAccessKey: sk },
  };

  if (isAWS) {
    // AWS S3: extract region from endpoint, use virtual-hosted-style
    config.region = region;
  } else {
    // S3-compatible (MinIO, etc.): use path-style with explicit endpoint
    config.endpoint = endpoint;
    config.forcePathStyle = true;
  }

  const client = new S3Client(config);

  clientCache.set(envId, client);
  return client;
}

export function invalidateS3Client(envId) {
  clientCache.delete(envId);
}
