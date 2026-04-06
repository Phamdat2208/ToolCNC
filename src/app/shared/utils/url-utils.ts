import { environment } from '../../../environments/environment';

export class UrlUtils {
  /**
   * Trả về URL hình ảnh đầy đủ.
   * Nếu URL là tương đối (ví dụ: /uploads/...), nó sẽ được gộp với apiUrl.
   * Nếu URL đã là tuyệt đối (http...), nó sẽ được giữ nguyên.
   */
  static getFullUrl(url: string | null | undefined): string {
    if (!url) return '';
    
    // 1. Xử lý trường hợp URL bị gắn cứng localhost từ Backend (Lỗi lịch sử)
    // Nếu URL chứa localhost hoặc 127.0.0.1, chúng ta sẽ "nắn" lại thành đường dẫn tương đối
    if (url.includes('localhost:') || url.includes('127.0.0.1:')) {
      const uploadsIndex = url.indexOf('/uploads/');
      if (uploadsIndex !== -1) {
        url = url.substring(uploadsIndex);
      }
    }
    
    // 2. Nếu là URL tuyệt đối (Cloudinary, v.v.), trả về ngay
    if (url.startsWith('http')) return url;
    
    // 3. Nếu là URL tương đối, nối với apiUrl từ môi trường
    const baseUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;
    const relativeUrl = url.startsWith('/') ? url : '/' + url;
    
    return baseUrl + relativeUrl;
  }
}
