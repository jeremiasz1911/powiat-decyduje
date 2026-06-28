import { File, Paths } from 'expo-file-system';
import { FirebaseError } from 'firebase/app';
import { getDownloadURL, ref, uploadBytes, uploadString } from 'firebase/storage';
import { Platform } from 'react-native';

import { auth, app, storage } from '@/src/lib/firebase';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

type StorageUploadMetadata = {
  name?: string;
  bucket?: string;
  downloadTokens?: string;
};

function inferContentType(uri: string): string {
  const normalized = uri.toLowerCase();
  if (normalized.endsWith('.png') || normalized.includes('image/png')) {
    return 'image/png';
  }
  if (normalized.endsWith('.webp') || normalized.includes('image/webp')) {
    return 'image/webp';
  }
  if (normalized.endsWith('.heic') || normalized.includes('image/heic')) {
    return 'image/heic';
  }
  return 'image/jpeg';
}

function inferExtension(contentType: string): string {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  if (contentType === 'image/heic') return 'heic';
  return 'jpg';
}

function resolveContentType(uri: string, fileType?: string): string {
  const normalizedType = fileType?.trim();
  if (normalizedType && normalizedType.startsWith('image/')) {
    return normalizedType;
  }
  return inferContentType(uri);
}

async function resolveReadableFile(uri: string): Promise<File> {
  const contentType = inferContentType(uri);
  const extension = inferExtension(contentType);
  const source = new File(uri);

  if (!uri.startsWith('content://') && !uri.startsWith('ph://')) {
    if (!source.exists) {
      throw new Error('Nie udało się odczytać pliku zdjęcia.');
    }
    return source;
  }

  const destination = new File(Paths.cache, `project-upload-${Date.now()}.${extension}`);
  if (destination.exists) {
    destination.delete();
  }
  destination.create({ overwrite: true, intermediates: true });
  source.copy(destination);

  if (!destination.exists) {
    throw new Error('Nie udało się przygotować zdjęcia do wysłania.');
  }

  return destination;
}

function decodeBase64ToUint8Array(base64: string): Uint8Array {
  const normalized = base64.replace(/\s/g, '');
  const binaryString = globalThis.atob(normalized);
  const bytes = new Uint8Array(binaryString.length);
  for (let index = 0; index < binaryString.length; index += 1) {
    bytes[index] = binaryString.charCodeAt(index);
  }
  return bytes;
}

async function getAuthIdToken(): Promise<string> {
  const user = auth?.currentUser;
  if (!user) {
    throw new Error('Musisz być zalogowany, aby wysłać zdjęcie.');
  }
  return user.getIdToken();
}

function buildDownloadUrl(bucket: string, metadata: StorageUploadMetadata): string {
  if (!metadata.name) {
    throw new Error('Serwer nie zwrócił metadanych wysłanego zdjęcia.');
  }

  const downloadToken = metadata.downloadTokens?.split(',')[0]?.trim();
  const encodedName = encodeURIComponent(metadata.name);
  if (downloadToken) {
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedName}?alt=media&token=${downloadToken}`;
  }

  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedName}?alt=media`;
}

function getStorageBucket(): string {
  const bucket = app.options.storageBucket?.trim();
  if (!bucket) {
    throw new Error('Firebase Storage bucket nie jest skonfigurowany.');
  }

  // Niektóre .env mają legacy appspot.com, a projekt używa firebasestorage.app (404 przy REST).
  if (bucket.endsWith('.appspot.com') && app.options.projectId) {
    return `${app.options.projectId}.firebasestorage.app`;
  }

  return bucket;
}

async function postStorageUpload(
  uploadUrl: string,
  idToken: string,
  contentType: string,
  body: Uint8Array
): Promise<StorageUploadMetadata> {
  const authHeaders = [`Bearer ${idToken}`, `Firebase ${idToken}`];
  let lastError: Error | null = null;

  for (const authorization of authHeaders) {
    const metadata = await new Promise<StorageUploadMetadata | null>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl);
      xhr.setRequestHeader('Authorization', authorization);
      xhr.setRequestHeader('Content-Type', contentType);
      xhr.responseType = 'json';
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve((xhr.response ?? {}) as StorageUploadMetadata);
          return;
        }

        if (xhr.status === 401 || xhr.status === 403) {
          lastError = new Error(
            'Brak uprawnień do wysłania zdjęcia. Wdróż reguły Firebase Storage: npm run storage:deploy'
          );
          resolve(null);
          return;
        }

        if (xhr.status === 404) {
          lastError = new Error(
            `Nie znaleziono bucketa Firebase Storage. Sprawdź EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET (${getStorageBucket()}).`
          );
          resolve(null);
          return;
        }

        lastError = new Error(
          `Nie udało się wysłać zdjęcia (HTTP ${xhr.status}). ${xhr.responseText ?? ''}`.trim()
        );
        resolve(null);
      };
      xhr.onerror = () => {
        lastError = new Error('Błąd sieci podczas wysyłania zdjęcia.');
        resolve(null);
      };
      xhr.send(body);
    });

    if (metadata) {
      return metadata;
    }
  }

  throw lastError ?? new Error('Nie udało się wysłać zdjęcia.');
}

async function uploadNativeBytesViaRestApi(
  userId: string,
  body: Uint8Array,
  contentType: string,
  extension: string
): Promise<string> {
  const bucket = getStorageBucket();

  if (body.byteLength > MAX_IMAGE_BYTES) {
    throw new Error('Zdjęcie jest za duże (maks. 10 MB).');
  }

  const objectPath = `projects/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(objectPath)}`;
  const idToken = await getAuthIdToken();
  const metadata = await postStorageUpload(uploadUrl, idToken, contentType, body);

  return buildDownloadUrl(bucket, metadata);
}

async function uploadNativeViaRestApi(userId: string, imageUri: string): Promise<string> {
  const file = await resolveReadableFile(imageUri);
  const contentType = resolveContentType(imageUri, file.type);
  const extension = inferExtension(contentType);
  const base64 = await file.base64();

  if (!base64) {
    throw new Error('Nie udało się odczytać pliku zdjęcia.');
  }

  const body = decodeBase64ToUint8Array(base64);
  return uploadNativeBytesViaRestApi(userId, body, contentType, extension);
}

async function fileUriToBlob(fileUri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onerror = async () => {
      try {
        const fallbackResponse = await fetch(fileUri);
        if (!fallbackResponse.ok) {
          reject(new Error(`Nie udało się odczytać zdjęcia (HTTP ${fallbackResponse.status}).`));
          return;
        }
        resolve(await fallbackResponse.blob());
      } catch {
        reject(new Error('Nie udało się odczytać wybranego zdjęcia.'));
      }
    };
    xhr.onload = () => {
      if (!xhr.response) {
        reject(new Error('Nie udało się odczytać wybranego zdjęcia.'));
        return;
      }
      resolve(xhr.response as Blob);
    };
    xhr.responseType = 'blob';
    xhr.open('GET', fileUri, true);
    xhr.send();
  });
}

function formatStorageError(error: unknown): Error {
  if (error instanceof FirebaseError) {
    if (error.code === 'storage/unauthorized') {
      return new Error(
        'Brak uprawnień do wysłania zdjęcia. Wdróż reguły Firebase Storage: npm run storage:deploy'
      );
    }
    if (error.code === 'storage/unknown') {
      return new Error(
        'Nie udało się wysłać zdjęcia do Firebase Storage. Sprawdź połączenie sieciowe i konfigurację Storage.'
      );
    }
    return new Error(`Błąd wysyłania obrazu: ${error.code} — ${error.message}`);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Nieznany błąd wysyłania obrazu.');
}

export async function uploadProjectImage(userId: string, imageUri: string): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage nie jest skonfigurowany.');
  }

  const contentType = inferContentType(imageUri);
  const extension = inferExtension(contentType);
  const fileRef = ref(
    storage,
    `projects/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
  );

  try {
    if (imageUri.startsWith('data:')) {
      const match = imageUri.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        throw new Error('Niepoprawny format danych obrazu.');
      }

      const [, dataContentType, base64Data] = match;

      if (Platform.OS === 'web') {
        await uploadString(fileRef, base64Data, 'base64', { contentType: dataContentType });
        return getDownloadURL(fileRef);
      }

      const body = decodeBase64ToUint8Array(base64Data);
      return uploadNativeBytesViaRestApi(
        userId,
        body,
        dataContentType,
        inferExtension(dataContentType)
      );
    }

    if (Platform.OS === 'web') {
      const blob = await fileUriToBlob(imageUri);
      if (blob.size > MAX_IMAGE_BYTES) {
        throw new Error('Zdjęcie jest za duże (maks. 10 MB).');
      }
      await uploadBytes(fileRef, blob, { contentType: blob.type || contentType });
      return getDownloadURL(fileRef);
    }

    return uploadNativeViaRestApi(userId, imageUri);
  } catch (error) {
    throw formatStorageError(error);
  }
}

export async function uploadProjectImages(userId: string, imageUris: string[]): Promise<string[]> {
  const uploads = imageUris.map((uri) => uploadProjectImage(userId, uri));
  return Promise.all(uploads);
}
