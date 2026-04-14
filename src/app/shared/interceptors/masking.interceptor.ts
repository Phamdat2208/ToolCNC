import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { MaskingUtil } from '../utils/masking.util';

/**
 * Interceptor tự động giải mã dữ liệu API khi chạy ở môi trường Production.
 */
export const maskingInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map(event => {
      // Chỉ can thiệp vào HttpResponse (phản hồi thành công)
      if (event instanceof HttpResponse) {
        const body = event.body;

        // Kiểm tra xem có cần giải mã hay không (Logic nằm trong MaskingUtil)
        if (MaskingUtil.shouldDecode(body)) {
          const decodedBody = MaskingUtil.decodeData(body as string);
          
          // Trả về phản hồi mới với dữ liệu đã giải mã
          return event.clone({ body: decodedBody });
        }
      }
      return event;
    })
  );
};
