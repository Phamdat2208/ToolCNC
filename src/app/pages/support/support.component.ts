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
import { ToastService } from '../../shared/services/toast.service';
import { HelperService } from '../../services/helper.service';

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
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);
  private helperService = inject(HelperService);

  // Order tracking state
  trackingCode: string = '';
  isTracking = false;
  trackedOrder: any = null;
  trackingError: string = '';

  categories = [
    { icon: 'tool', title: 'Dao phay Ngón', desc: 'Kỹ thuật chọn số lưỡi cắt, lớp phủ (TiAlN, DLC) và chế độ cắt tối ưu.' },
    { icon: 'code-sandbox', title: 'Chip tiện & Cán dao', desc: 'Tra cứu mã chip (CNMG, DNMG...), hình học chip và cách bẻ phoi.' },
    { icon: 'setting', title: 'Phụ kiện & Đồ gá', desc: 'Hướng dẫn sử dụng đầu kẹp BT, bầu kẹp ER, ê tô và thiết bị đo.' },
    { icon: 'reconciliation', title: 'Kỹ thuật Gia công', desc: 'Công thức tính toán Vc, Fz, Ap/Ae cho vật liệu thép, nhôm, inox.' }
  ];

  faqs: FAQ[] = [
    {
      question: 'Làm thế nào để chọn đúng số lưỡi cắt cho dao phay?',
      answer: 'Dao 2-3 lưỡi thường dùng cho phay rãnh vì không gian thoát phoi rộng. Dao 4-6 lưỡi dùng cho phay mặt hoặc phay biên để đạt được độ bóng bề mặt cao và tốc độ tiến dao nhanh hơn.',
      active: true
    },
    {
      question: 'Ý nghĩa của mã chip tiện CNMG 120408 là gì?',
      answer: 'C: Hình thoi 80 độ; N: Góc sau 0 độ; M: Dung sai; G: Kiểu kẹp; 12: Chiều dài cạnh cắt; 04: Độ dày chip; 08: Bán kính mũi dao (R0.8mm). Đây là loại chip phổ biến cho tiện thô và bán tinh.',
      active: false
    },
    {
      question: 'Khi nào nên sử dụng bầu kẹp nhiệt (Shrink-fit)?',
      answer: 'Bầu kẹp nhiệt nên dùng khi gia công tốc độ cao (High-speed machining) và yêu cầu độ đồng tâm (run-out) cực thấp (<0.003mm). Nó giúp tăng tuổi thọ dao lên 15-20% so với bầu kẹp ER thông thường.',
      active: false
    },
    {
      question: 'Giải pháp xử lý khi dao phay bị mòn nhanh khi gia công Inox?',
      answer: 'Inox có tính truyền nhiệt kém, nên sử dụng dao có lớp phủ chịu nhiệt cao (AlTiN/TiAlN). Giảm vận tốc cắt (Vc) và tăng lượng tưới nguội trực tiếp vào vùng cắt để tránh hiện tượng lẹo dao.',
      active: false
    },
    {
      question: 'Làm sao để tính tốc độ vòng quay trục chính (n)?',
      answer: 'Công thức: n = (Vc * 1000) / (π * D). Trong đó Vc là vận tốc cắt (m/phút) khuyến cáo của nhà sản xuất và D là đường kính của dao (mm).',
      active: false
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
      this.toastService.showWarning('Vui lòng nhập mã đơn hàng.');
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
    this.contactForm.markAllAsTouched();
    if (this.contactForm.invalid) {
      this.helperService.scrollToInvalidControl();
      return;
    }
    if (this.contactForm.valid) {
      this.toastService.showSuccess('Cảm ơn bạn! Yêu cầu của bạn đã được gửi thành công. Chúng tôi sẽ phản hồi sớm nhất.');
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
