import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { finalize, forkJoin, Observable } from 'rxjs';
import { CartService } from '../../../services/cart.service';
import { ProductService } from '../../../services/product.service';
import { ToastService } from '../../services/toast.service';
import { UrlUtils } from '../../utils/url-utils';
import { LoadingComponent } from '../loading/loading.component';
import { QuantityInputComponent } from '../quantity-input/quantity-input.component';
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
    NzInputNumberModule,
    LoadingComponent,
    QuantityInputComponent
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
  private router = inject(Router);
  private toastService = inject(ToastService);

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
        this.toastService.showError('Không thể tải thông tin sản phẩm');
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
      this.toastService.showWarning('Vui lòng chọn ít nhất một mã hàng');
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
          this.toastService.showSuccess(`Đã thêm ${successCount} mã hàng vào giỏ hàng`);
          this.modalRef.close(true);
        } else {
          this.toastService.showError('Không thể thêm sản phẩm vào giỏ hàng');
        }
      },
      error: (err: any) => {
        console.error('Lỗi kết nối', err);
        this.toastService.showError('Có lỗi xảy ra khi thêm vào giỏ hàng');
      }
    });
  }
}
