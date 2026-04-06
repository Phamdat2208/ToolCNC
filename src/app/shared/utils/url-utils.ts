import { environment } from '../../../environments/environment';

export class UrlUtils {
  /**
   * Trả về URL hình ảnh đầy đủ.
   * Nếu URL là tương đối (ví dụ: /uploads/...), nó sẽ được gộp với apiUrl.
   * Nếu URL đã là tuyệt đối (http...), nó sẽ được giữ nguyên.
   */
  static getFullUrl(url: string | null | undefined): string {
    if (!url) return '';
    
    // Nếu URL chứa localhost hoặc 127.0.0.1, đây là lỗi từ server trả về đường dẫn tuyệt đối local.
    // Chúng ta cần trích xuất phần đường dẫn tương đối (ví dụ: /uploads/...)
    if (url.includes('localhost:8080') || url.includes('127.0.0.1:8080')) {
      const parts = url.split('/uploads/');
      if (parts.length > 1) {
        url = '/uploads/' + parts[1];
      }
    }
    
    if (url.startsWith('http')) return url;
    
    // Đảm bảo không bị lặp dấu /
    const baseUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;
    const relativeUrl = url.startsWith('/') ? url : '/' + url;
    
    return baseUrl + relativeUrl;
  }
}
