import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import { Buffer } from 'buffer';
import { API_BASE } from './config';


export const uploadVideo = async (videoUri: string): Promise<string | null> => {
  if (!videoUri) return null;
  try {
    console.log('Uploading file from:', videoUri);
    const fileUploadUrl = `${API_BASE}/upload/video`;
    const uploadResult = await FileSystem.uploadAsync(fileUploadUrl, videoUri, {
      httpMethod: 'POST',
      fieldName: 'video',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    });
    if (uploadResult.status !== 200) {
      throw new Error('Video upload failed');
    }
    const result = JSON.parse(uploadResult.body);
    return result.fileUrl || null;
  } catch (error: any) {
    Alert.alert('Error', error.message);
    return null;
  }
};


export const uploadMetadata = async (metadata: any) => {
  try {
    
    const metadataResponse = await fetch(`${API_BASE}/upload/metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata),
    });

    if (!metadataResponse.ok) {
      throw new Error('Metadata upload failed');
    }

    

    console.log(metadataResponse);
    
    const { video_url, averages } = await metadataResponse.json();

    console.log(video_url);
    console.log(averages);

    
    const videoResponse = await fetch(`${API_BASE}${video_url}`);
    if (!videoResponse.ok) {
      throw new Error('Video download failed');
    }

    
    const blob = await videoResponse.blob();
    const base64DataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read blob'));
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });

    
    const base64String = (base64DataUrl as string).split(',')[1];
    const fileUri = `${FileSystem.cacheDirectory}processedVideo.mp4`;
    
    await FileSystem.writeAsStringAsync(fileUri, base64String, {
      encoding: FileSystem.EncodingType.Base64,
    });

    
    return {
      videoUri: fileUri,
      averages: averages || [],
    };

  } catch (error) {
    console.error('Processing failed:', error);
    throw error;
  }
};