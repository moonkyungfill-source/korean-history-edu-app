import {
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from './config';

/**
 * 이미지 업로드 (Base64)
 */
export async function uploadImageBase64(
  userId: string,
  generationId: string,
  base64Data: string,
  fileName: string = 'original.png'
): Promise<string> {
  const storageRef = ref(storage, `student-works/${userId}/${generationId}/${fileName}`);

  // Base64 데이터에서 헤더 제거
  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');

  await uploadString(storageRef, base64Content, 'base64', {
    contentType: 'image/png',
  });

  return getDownloadURL(storageRef);
}

/**
 * 이미지 업로드 (File)
 */
export async function uploadImageFile(
  userId: string,
  generationId: string,
  file: File,
  fileName?: string
): Promise<string> {
  const finalFileName = fileName || file.name;
  const storageRef = ref(storage, `student-works/${userId}/${generationId}/${finalFileName}`);

  await uploadBytes(storageRef, file, {
    contentType: file.type,
  });

  return getDownloadURL(storageRef);
}

/**
 * 영상 업로드
 */
export async function uploadVideo(
  userId: string,
  generationId: string,
  videoBlob: Blob,
  fileName: string = 'video.mp4'
): Promise<string> {
  const storageRef = ref(storage, `student-works/${userId}/${generationId}/${fileName}`);

  await uploadBytes(storageRef, videoBlob, {
    contentType: 'video/mp4',
  });

  return getDownloadURL(storageRef);
}

/**
 * 피드백용 주석 이미지 업로드
 */
export async function uploadAnnotatedImage(
  generationId: string,
  base64Data: string
): Promise<string> {
  const storageRef = ref(storage, `admin-feedback/${generationId}/annotated.png`);

  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');

  await uploadString(storageRef, base64Content, 'base64', {
    contentType: 'image/png',
  });

  return getDownloadURL(storageRef);
}

/**
 * 임시 파일 업로드 (이미지 검색용)
 */
export async function uploadTempFile(
  userId: string,
  file: File
): Promise<string> {
  const timestamp = Date.now();
  const storageRef = ref(storage, `uploads/${userId}/${timestamp}_${file.name}`);

  await uploadBytes(storageRef, file, {
    contentType: file.type,
  });

  return getDownloadURL(storageRef);
}

/**
 * 파일 삭제
 */
export async function deleteFile(filePath: string): Promise<void> {
  const storageRef = ref(storage, filePath);
  await deleteObject(storageRef);
}

/**
 * 파일 URL 가져오기
 */
export async function getFileUrl(filePath: string): Promise<string> {
  const storageRef = ref(storage, filePath);
  return getDownloadURL(storageRef);
}
