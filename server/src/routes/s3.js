import { Router } from 'express';
import multer from 'multer';
import {
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getS3Client } from '../services/s3Client.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/:envId/buckets', async (req, res) => {
  try {
    const client = await getS3Client(req.params.envId);
    const result = await client.send(new ListBucketsCommand({}));
    res.json(result.Buckets || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:envId/buckets', async (req, res) => {
  try {
    const client = await getS3Client(req.params.envId);
    await client.send(new CreateBucketCommand({ Bucket: req.body.name }));
    res.json({ success: true, name: req.body.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:envId/buckets/:bucket', async (req, res) => {
  try {
    const client = await getS3Client(req.params.envId);
    await client.send(new DeleteBucketCommand({ Bucket: req.params.bucket }));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:envId/buckets/:bucket/objects', async (req, res) => {
  try {
    const client = await getS3Client(req.params.envId);
    const result = await client.send(new ListObjectsV2Command({
      Bucket: req.params.bucket,
      Prefix: req.query.prefix || '',
    }));
    res.json(result.Contents || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:envId/upload', upload.single('file'), async (req, res) => {
  try {
    const { bucket, key, mode, partSize } = req.body;
    const file = req.file;
    if (!file || !bucket || !key) return res.status(400).json({ error: 'bucket, key, file required' });

    const client = await getS3Client(req.params.envId);

    if (mode === 'multipart' && file.size > 5 * 1024 * 1024) {
      const partBytes = (parseInt(partSize) || 5) * 1024 * 1024;
      const mpu = await client.send(new CreateMultipartUploadCommand({ Bucket: bucket, Key: key }));
      const parts = [];
      let partNum = 1;
      for (let offset = 0; offset < file.buffer.length; offset += partBytes) {
        const chunk = file.buffer.slice(offset, Math.min(offset + partBytes, file.buffer.length));
        const result = await client.send(new UploadPartCommand({
          Bucket: bucket, Key: key, UploadId: mpu.UploadId,
          PartNumber: partNum, Body: chunk,
        }));
        parts.push({ PartNumber: partNum, ETag: result.ETag });
        partNum++;
      }
      await client.send(new CompleteMultipartUploadCommand({
        Bucket: bucket, Key: key, UploadId: mpu.UploadId,
        MultipartUpload: { Parts: parts },
      }));
    } else {
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: file.buffer }));
    }

    res.json({ success: true, key, size: file.size });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:envId/download', async (req, res) => {
  try {
    const { bucket, key } = req.query;
    if (!bucket || !key) return res.status(400).json({ error: 'bucket and key required' });

    const client = await getS3Client(req.params.envId);
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

    const filename = key.split('/').pop();
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', result.ContentType || 'application/octet-stream');
    if (result.ContentLength) res.setHeader('Content-Length', result.ContentLength);

    for await (const chunk of result.Body) {
      res.write(chunk);
    }
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:envId/buckets/:bucket/objects', async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'key required' });
    const client = await getS3Client(req.params.envId);
    await client.send(new DeleteObjectCommand({ Bucket: req.params.bucket, Key: key }));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
