import { environment } from "../../../environments/environment";

/**
 * Tiện ích hỗ trợ mã hóa/giải mã dữ liệu để che giấu cấu trúc API trong tab Network.
 */
export class MaskingUtil {
  /**
   * Giải mã chuỗi Base64 trở lại thành đối tượng JSON.
   * Hỗ trợ đầy đủ UTF-8 (tiếng Việt).
   */
  static decodeData(encodedData: string): any {
    if (!encodedData || typeof encodedData !== 'string') return encodedData;

    try {
      // Decode base64
      const binaryString = window.atob(encodedData);
      
      // Chuyển đổi từ binary string sang UTF-8 string
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const decodedString = new TextDecoder().decode(bytes);
      return JSON.parse(decodedString);
    } catch (error) {
      console.error('Lỗi khi giải mã dữ liệu API:', error);
      return encodedData;
    }
  }

  /**
   * Kiểm tra xem phản hồi có cần phải giải mã hay không.
   * Chỉ thực hiện trên Production và khi dữ liệu trả về là chuỗi.
   */
  static shouldDecode(body: any): boolean {
    return environment.production && typeof body === 'string';
  }
}