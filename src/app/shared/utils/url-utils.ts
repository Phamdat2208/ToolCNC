import { environment } from '../../../environments/environment';

export class UrlUtils {
  /**
   * Trả về URL hình ảnh đầy đủ.
   * Nếu URL là tương đối (ví dụ: /uploads/...), nó sẽ được gộp với apiUrl.
   * Nếu URL đã là tuyệt đối (http...), nó sẽ được giữ nguyên.
   */
  static getFullUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    
    // Đảm bảo không bị lặp dấu /
    const baseUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;
    const relativeUrl = url.startsWith('/') ? url : '/' + url;
    
    return baseUrl + relativeUrl;
  }
}
