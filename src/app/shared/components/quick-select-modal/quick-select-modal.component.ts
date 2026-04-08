import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { Router } from '@angular/router';
import { forkJoin, finalize, Observable } from 'rxjs';
import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { UrlUtils } from '../../utils/url-utils';
import { QuantityInputComponent } from '../quantity-input/quantity-input.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-quick-select-modal',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    NzTableModule, 
    NzButtonModule, 
    NzIconModule, 
    NzSpinModule,
    NzCheckboxModule,
    NzInputNumberModule
  ],
  templateUrl: './quick-select-modal.component.html',
  styleUrl: './quick-select-modal.component.css'
})
export class QuickSelectModalComponent implements OnInit {
  // Use NZ_MODAL_DATA to receive product ID
  readonly modalData = inject(NZ_MODAL_DATA);
  private modalRef = inject(NzModalRef);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private notification = inject(NzNotificationService);
  private router = inject(Router);

  product: any = null;
  isLoading = true;
  isAddingToCart = false;

  get selectedVariants() {
    return this.product?.variants?.filter((v: any) => v.checked) || [];
  }

  get totalSelectedCount() {
    return this.selectedVariants.length;
  }

  get totalPrice() {
    return this.selectedVariants.reduce((sum: number, v: any) => sum + (v.price * (v.selectedQuantity || 1)), 0);
  }

  ngOnInit(): void {
    if (this.modalData && this.modalData.productId) {
      this.loadProduct(this.modalData.productId);
    }
  }

  viewFullDetails() {
    this.modalRef.close();
    this.router.navigate(['/products', this.product.id]);
  }

  loadProduct(id: number) {
    this.isLoading = true;
    this.productService.getProductById(id).subscribe({
      next: (res) => {
        // Initialize local state for each variant
        if (res.variants) {
          res.variants.forEach((v: any) => {
            v.checked = false;
            v.selectedQuantity = 1;
          });
        }
        this.product = res;
        this.isLoading = false;
      },
      error: () => {
        this.notification.error('Lỗi', 'Không thể tải thông tin sản phẩm');
        this.modalRef.close();
      }
    });
  }

  toggleVariant(variant: any) {
    variant.checked = !variant.checked;
  }

  addToCart() {
    const selected = this.selectedVariants;
    if (selected.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ít nhất một mã hàng');
      return;
    }

    this.isAddingToCart = true;
    const img = UrlUtils.getFullUrl(this.product.imageUrl);

    // Prepare an array of observables for each selected variant
    const addRequests: Observable<boolean>[] = selected.map((variant: any) => {
      const cartProduct = { 
        ...this.product,
        price: variant.price,
        variantId: variant.id,
        variantName: variant.variantName
      };
      return this.cartService.addToCart(cartProduct, variant.selectedQuantity, img);
    });

    // Send all requests concurrently using forkJoin
    (forkJoin(addRequests) as Observable<any[]>).pipe(
      finalize(() => this.isAddingToCart = false)
    ).subscribe({
      next: (results) => {
        const successCount = results.filter(res => res).length;
        if (successCount > 0) {
          this.notification.success('Thành công', `Đã thêm ${successCount} mã hàng vào giỏ hàng`);
          this.modalRef.close(true);
        } else {
          this.notification.error('Thất bại', 'Không thể thêm sản phẩm vào giỏ hàng');
        }
      },
      error: (err: any) => {
        console.error('Lỗi kết nối', err);
        this.notification.error('Lỗi kết nối', 'Có lỗi xảy ra khi thêm vào giỏ hàng');
      }
    });
  }
}
