const BASE = import.meta.env.DEV ? 'http://localhost:34567/api' : '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.details || 'Request failed');
  }
  return res;
}

export async function getEnvironments() {
  const res = await request('/environments');
  return res.json();
}

export async function getEnvironment(id) {
  const res = await request(`/environments/${id}`);
  return res.json();
}

export async function parseAndAddEnvironment(text) {
  const res = await request('/environments/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return res.json();
}

export async function updateEnvironment(id, data) {
  const res = await request(`/environments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteEnvironment(id) {
  const res = await request(`/environments/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function getCommands() {
  const res = await request('/commands');
  return res.json();
}

export async function createCommand(data) {
  const res = await request('/commands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateCommand(id, data) {
  const res = await request(`/commands/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteCommand(id) {
  const res = await request(`/commands/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function listBuckets(envId) {
  const res = await request(`/s3/${envId}/buckets`);
  return res.json();
}

export async function createBucket(envId, name) {
  const res = await request(`/s3/${envId}/buckets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function deleteBucket(envId, bucket) {
  const res = await request(`/s3/${envId}/buckets/${encodeURIComponent(bucket)}`, { method: 'DELETE' });
  return res.json();
}

export async function listObjects(envId, bucket, prefix = '') {
  const res = await request(`/s3/${envId}/buckets/${encodeURIComponent(bucket)}/objects?prefix=${encodeURIComponent(prefix)}`);
  return res.json();
}

export async function uploadObject(envId, { bucket, key, file, mode, partSize }, onProgress) {
  const form = new FormData();
  form.append('bucket', bucket);
  form.append('key', key);
  form.append('file', file);
  form.append('mode', mode || 'normal');
  form.append('partSize', partSize || '5');

  const xhr = new XMLHttpRequest();
  return new Promise((resolve, reject) => {
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(JSON.parse(xhr.responseText).error || 'Upload failed'));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.open('POST', `${BASE}/s3/${envId}/upload`);
    xhr.send(form);
  });
}

export async function deleteObject(envId, bucket, key) {
  const res = await request(`/s3/${envId}/buckets/${encodeURIComponent(bucket)}/objects`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  });
  return res.json();
}

export async function downloadObject(envId, bucket, key) {
  const res = await request(`/s3/${envId}/download?bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(key)}`);
  return res;
}

// Settings
export async function getSettings() {
  const res = await request('/settings');
  return res.json();
}

export async function updateSettings(data) {
  const res = await request('/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

// SSH
export async function launchSsh({ externalIp, credentials }) {
  const res = await request('/ssh/launch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ externalIp, credentials }),
  });
  return res.json();
}

// Files
export async function listLocalFiles(dir) {
  const res = await request(`/files/list?dir=${encodeURIComponent(dir)}`);
  return res.json();
}

// Upload from local path
export async function uploadFromLocal(envId, { bucket, key, localFilePath, mode, partSize }) {
  const res = await request(`/s3/${envId}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket, key, localFilePath, mode: mode || 'normal', partSize: partSize || '5' }),
  });
  return res.json();
}

// Download to local dir
export async function downloadToLocal(envId, bucket, key, saveToDir) {
  const res = await request(`/s3/${envId}/download?bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(key)}&saveToDir=${encodeURIComponent(saveToDir)}`);
  return res.json();
}
