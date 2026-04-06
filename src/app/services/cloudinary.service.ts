import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private http = inject(HttpClient);

  /**
   * Upload ảnh trực tiếp lên Cloudinary (Unsigned).
   * @param file Blob hoặc File ảnh đã được resize/crop
   * @returns Observable chứa kết quả từ Cloudinary (bao gồm secure_url)
   */
  uploadImage(file: Blob | File): Observable<any> {
    const cloudName = environment.cloudinaryCloudName;
    const uploadPreset = environment.cloudinaryUploadPreset;
    
    if (cloudName === 'YOUR_CLOUD_NAME' || uploadPreset === 'YOUR_UPLOAD_PRESET') {
      throw new Error('Vui lòng cấu hình Cloudinary Cloud Name và Upload Preset trong environment.ts');
    }

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'toolcnc/products'); // Gom nhóm ảnh vào thư mục trên Cloudinary

    return this.http.post<any>(url, formData);
  }
}
