import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { OrderService } from '../../services/order.service';
import { CustomInputComponent } from '../../shared/components/custom-input/custom-input.component';
import { CustomTextareaComponent } from '../../shared/components/custom-textarea/custom-textarea.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

interface FAQ {
  question: string;
  answer: string;
  active?: boolean;
}

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzCollapseModule,
    NzCardModule,
    NzGridModule,
    NzFormModule,
    NzSpinModule,
    NzTagModule,
    NzDividerModule,
    CustomInputComponent,
    CustomTextareaComponent,
    LoadingComponent
  ],
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.css']
})
export class SupportComponent implements OnInit {
  searchQuery: string = '';
  contactForm!: FormGroup;
  private orderService = inject(OrderService);
  private message = inject(NzMessageService);
  private fb = inject(FormBuilder);

  // Order tracking state
  trackingCode: string = '';
  isTracking = false;
  trackedOrder: any = null;
  trackingError: string = '';

  categories = [
    { icon: 'tool', title: 'Hỗ trợ kỹ thuật', desc: 'Hướng dẫn vận hành máy, bảo trì và xử lý lỗi kỹ thuật.' },
    { icon: 'shopping-cart', title: 'Đơn hàng & Giao hàng', desc: 'Theo dõi đơn hàng, chính sách vận chuyển và đổi trả.' },
    { icon: 'safety-certificate', title: 'Chính sách bảo hành', desc: 'Quy trình kích hoạt và yêu cầu bảo hành chính hãng.' },
    { icon: 'user', title: 'Tài khoản & Thanh toán', desc: 'Quản lý thông tin cá nhân và các phương thức thanh toán.' }
  ];

  faqs: FAQ[] = [
    {
      question: 'Làm thế nào để bảo trì máy CNC định kỳ?',
      answer: 'Bảo trì máy CNC cần thực hiện hàng ngày (vệ sinh phoi, kiểm tra mức dầu) và hàng tháng (kiểm tra độ rơ, bôi trơn hệ thống truyền động). Chúng tôi có tài liệu hướng dẫn chi tiết đính kèm cho từng model máy.',
      active: true
    },
    {
      question: 'Chính sách đổi trả sản phẩm như thế nào?',
      answer: 'Bạn có thể đổi trả sản phẩm trong vòng 7 ngày nếu do lỗi của nhà sản xuất. Sản phẩm phải còn nguyên tem mác và chưa qua sử dụng đối với các loại dao cụ.'
    },
    {
      question: 'Làm sao để theo dõi đơn hàng của tôi?',
      answer: 'Sau khi đặt hàng thành công, bạn sẽ nhận mã đơn hàng (TCNC-XXXXXXXX). Nhập mã này vào ô tra cứu trong phần "Theo dõi đơn hàng" ở trang Hỗ trợ để xem trạng thái tức thì.'
    },
    {
      question: 'ToolCNC có cung cấp dịch vụ lắp đặt tận nơi không?',
      answer: 'Có, đối với các dòng máy CNC lớn, chúng tôi có đội ngũ kỹ thuật lắp đặt và hướng dẫn vận hành trực tiếp tại nhà xưởng của bạn trên toàn quốc.'
    }
  ];

  filteredFaqs: FAQ[] = [...this.faqs];

  readonly ORDER_STEPS = [
    { status: 'PENDING',   label: 'Đặt hàng',        icon: 'file-text' },
    { status: 'CONFIRMED', label: 'Đã xác nhận',      icon: 'check-circle' },
    { status: 'SHIPPED',   label: 'Đang vận chuyển',  icon: 'car' },
    { status: 'DELIVERED', label: 'Đã giao hàng',     icon: 'home' },
  ];

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required]],
      message: ['', [Validators.required]]
    });
  }

  onSearch(): void {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredFaqs = [...this.faqs];
    } else {
      this.filteredFaqs = this.faqs.filter(faq =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
      );
    }
  }

  trackOrderByCode(): void {
    const code = this.trackingCode.trim().toUpperCase();
    if (!code) {
      this.message.warning('Vui lòng nhập mã đơn hàng.');
      return;
    }
    this.isTracking = true;
    this.trackedOrder = null;
    this.trackingError = '';

    this.orderService.trackOrder(code).subscribe({
      next: (data) => {
        this.trackedOrder = data;
        this.isTracking = false;
      },
      error: (err) => {
        this.trackingError = err.error?.message || 'Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã tra cứu.';
        this.isTracking = false;
      }
    });
  }

  getStepState(stepStatus: string, currentStatus: string): string {
    const statuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
    const currentIdx = statuses.indexOf(currentStatus?.toUpperCase());
    const stepIdx = statuses.indexOf(stepStatus);
    if (stepIdx < currentIdx) return 'finish';
    if (stepIdx === currentIdx) return 'process';
    return 'wait';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'PENDING': 'Chờ xác nhận', 'CONFIRMED': 'Đã xác nhận',
      'SHIPPED': 'Đang giao', 'DELIVERED': 'Đã giao', 'CANCELLED': 'Đã hủy'
    };
    return map[status?.toUpperCase()] || status;
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      'PENDING': 'orange', 'CONFIRMED': 'geekblue',
      'SHIPPED': 'blue', 'DELIVERED': 'green', 'CANCELLED': 'red'
    };
    return map[status?.toUpperCase()] || 'default';
  }

  isCancelled(): boolean {
    return this.trackedOrder?.status?.toUpperCase() === 'CANCELLED';
  }

  submitForm(): void {
    if (this.contactForm.valid) {
      this.message.success('Cảm ơn bạn! Yêu cầu của bạn đã được gửi thành công. Chúng tôi sẽ phản hồi sớm nhất.');
      this.contactForm.reset();
    } else {
      Object.values(this.contactForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}
