import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, filter, take } from 'rxjs';

/**
 * Điều phối việc refresh token giữa nhiều nguồn gọi khác nhau
 * (HTTP interceptor khi bị 401, và AuthService khi tự động refresh ngầm
 * trước lúc access token hết hạn).
 *
 * Đảm bảo tại một thời điểm chỉ có DUY NHẤT 1 request /auth/refresh
 * được gửi đi, dù có nhiều nơi trong app cùng muốn refresh.
 */
@Injectable({ providedIn: 'root' })
export class TokenRefreshCoordinatorService {
  private isRefreshing = false;
  private refreshResultSubject = new BehaviorSubject<string | null | 'FAILED'>(null);

  /**
   * Thử giành quyền thực hiện refresh.
   * Trả về true nếu nơi gọi được phép tiến hành gọi API refresh.
   * Trả về false nếu đã có nơi khác đang refresh rồi -> nơi gọi nên
   * dùng waitForResult() để chờ kết quả thay vì tự gọi API.
   */
  tryAcquireLock(): boolean {
    if (this.isRefreshing) {
      return false;
    }
    this.isRefreshing = true;
    this.refreshResultSubject.next(null);
    return true;
  }

  /** Gọi khi refresh thành công, phát token mới cho các nơi đang chờ. */
  resolveSuccess(newToken: string) {
    this.isRefreshing = false;
    this.refreshResultSubject.next(newToken);
  }

  /** Gọi khi refresh thất bại, báo cho các nơi đang chờ biết để họ tự xử lý lỗi. */
  resolveFailure() {
    this.isRefreshing = false;
    this.refreshResultSubject.next('FAILED');
  }

  /**
   * Chờ kết quả của lần refresh đang diễn ra (do nơi khác thực hiện).
   * Emit giá trị token (string) nếu thành công, hoặc lỗi nếu thất bại.
   */
  waitForResult(): Observable<string> {
    return new Observable<string>(observer => {
      const sub = this.refreshResultSubject
        .pipe(
          filter((result): result is string | 'FAILED' => result !== null),
          take(1)
        )
        .subscribe(result => {
          if (result === 'FAILED') {
            observer.error(new Error('REFRESH_TOKEN_FAILED'));
          } else {
            observer.next(result);
            observer.complete();
          }
        });

      return () => sub.unsubscribe();
    });
  }

  get refreshing(): boolean {
    return this.isRefreshing;
  }
}