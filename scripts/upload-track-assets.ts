import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { TRACK_ASSETS } from '../src/data/trackAssets';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER;

if (!connectionString) {
  throw new Error('Missing AZURE_STORAGE_CONNECTION_STRING');
}

if (!containerName) {
  throw new Error('Missing AZURE_STORAGE_CONTAINER');
}

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.ogg':
      return 'audio/ogg';
    case '.wav':
      return 'audio/wav';
    case '.mp3':
      return 'audio/mpeg';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    default:
      return 'application/octet-stream';
  }
}

async function uploadBuffer(
  containerClient: ContainerClient,
  blobName: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: {
      blobContentType: contentType,
      blobCacheControl: 'public, max-age=31536000, immutable',
    },
  });
}

async function main(): Promise<void> {
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  await containerClient.createIfNotExists({ access: 'blob' });

  for (const [trackId, asset] of Object.entries(TRACK_ASSETS)) {
    const localAudioPath = path.join(rootDir, 'public', asset.localAudioPath);
    const audioBuffer = await fs.readFile(localAudioPath);
    await uploadBuffer(containerClient, asset.blobAudioPath, audioBuffer, contentTypeFor(localAudioPath));
    console.log(`Uploaded audio for track ${trackId}: ${asset.blobAudioPath}`);

    const imageResponse = await fetch(asset.sourceImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download cover for track ${trackId}: ${imageResponse.status} ${imageResponse.statusText}`);
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const imageType = imageResponse.headers.get('content-type') || contentTypeFor(asset.blobCoverPath);
    await uploadBuffer(containerClient, asset.blobCoverPath, imageBuffer, imageType);
    console.log(`Uploaded cover for track ${trackId}: ${asset.blobCoverPath}`);
  }

  const accountNameMatch = connectionString.match(/AccountName=([^;]+)/i);
  if (accountNameMatch) {
    console.log(`Base URL: https://${accountNameMatch[1]}.blob.core.windows.net/${containerName}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});