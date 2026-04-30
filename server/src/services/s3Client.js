import { S3Client } from '@aws-sdk/client-s3';
import { getById } from './storage.js';

const clientCache = new Map();

export async function getS3Client(envId) {
  if (clientCache.has(envId)) return clientCache.get(envId);

  const env = await getById('environments.json', envId);
  if (!env || !env.s3Config) throw new Error(`Environment ${envId} not found or missing S3 config`);

  const { endpoint, ak, sk } = env.s3Config;
  if (!endpoint || !ak || !sk) throw new Error('S3 config incomplete: missing endpoint, ak, or sk');

  const client = new S3Client({
    endpoint,
    region: 'us-east-1',
    credentials: { accessKeyId: ak, secretAccessKey: sk },
    forcePathStyle: true,
  });

  clientCache.set(envId, client);
  return client;
}

export function invalidateS3Client(envId) {
  clientCache.delete(envId);
}
