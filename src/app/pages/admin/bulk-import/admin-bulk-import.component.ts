import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerComponent } from "ng-zorro-antd/divider";
import { NzEmptyComponent } from "ng-zorro-antd/empty";
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzUploadChangeParam, NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { forkJoin, lastValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { BrandService } from '../../../services/brand.service';
import { CategoryService } from '../../../services/category.service';
import { CloudinaryService } from '../../../services/cloudinary.service';
import { ProductService } from '../../../services/product.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-admin-bulk-import',
  standalone: true,
  imports: [CommonModule, NzUploadModule, NzButtonModule, NzIconModule, NzTableModule, NzTagModule, NzToolTipModule, NzGridModule, NzAlertModule, NzDividerComponent, NzEmptyComponent],
  templateUrl: './admin-bulk-import.component.html',
  styleUrls: ['./admin-bulk-import.component.css']
})
export class AdminBulkImportComponent {
  @Output() onComplete = new EventEmitter<void>();
  
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private cloudinaryService = inject(CloudinaryService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private location = inject(Location);

  productsPreview: any[] = [];
  selectedImages: Map<string, { file: File, url: string }> = new Map();
  isSaving = false;
  uploadProgress = 0;

  get selectedImageKeys(): string[] {
    return Array.from(this.selectedImages.keys());
  }

  // Lấy danh sách tên file là Ảnh chính trong Excel
  get mainImageKeys(): string[] {
    const mainFiles = new Set(this.productsPreview.map(p => p.imageUrl?.toLowerCase()).filter(img => img && !img.startsWith('http')));
    return this.selectedImageKeys.filter(key => mainFiles.has(key));
  }

  // Lấy danh sách tên file thuộc Thư viện ảnh trong Excel
  get galleryImageKeys(): string[] {
    const galleryFiles = new Set<string>();
    this.productsPreview.forEach(p => {
      if (p.imageGallery) {
        p.imageGallery.forEach((img: string) => {
          if (img && !img.startsWith('http')) galleryFiles.add(img.toLowerCase());
        });
      }
    });
    return this.selectedImageKeys.filter(key => galleryFiles.has(key));
  }

  // Lấy các file đã chọn nhưng không khớp với bất kỳ ô nào trong Excel
  get unmatchedImageKeys(): string[] {
    const mainFiles = new Set(this.productsPreview.map(p => p.imageUrl?.toLowerCase()).filter(img => img && !img.startsWith('http')));
    const galleryFiles = new Set<string>();
    this.productsPreview.forEach(p => {
      if (p.imageGallery) {
        p.imageGallery.forEach((img: string) => {
          if (img && !img.startsWith('http')) galleryFiles.add(img.toLowerCase());
        });
      }
    });
    
    return this.selectedImageKeys.filter(key => !mainFiles.has(key) && !galleryFiles.has(key));
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    this.parseExcel(file as any);
    return false; // Prevent automatic upload
  };

  beforeUploadImages = (file: NzUploadFile): boolean => {
    const filename = file.name.toLowerCase();
    
    // Nếu tệp đã tồn tại, giải phóng URL cũ trước khi thay thế
    if (this.selectedImages.has(filename)) {
      URL.revokeObjectURL(this.selectedImages.get(filename)!.url);
    }
    
    const url = URL.createObjectURL(file as any);
    this.selectedImages.set(filename, { file: file as any, url });
    return false; 
  };

  removeImage(filename: string) {
    if (this.selectedImages.has(filename)) {
      URL.revokeObjectURL(this.selectedImages.get(filename)!.url);
      this.selectedImages.delete(filename);
    }
  }

  back() {
    this.location.back();
  }

  clearUnmatchedImages() {
    this.unmatchedImageKeys.forEach(key => this.removeImage(key));
  }

  handleFileChange(info: NzUploadChangeParam): void {
    // Optional: handle status changes if needed
  }

  private parseExcel(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      this.processRawData(jsonData);
    };
    reader.readAsArrayBuffer(file);
  }

  private processRawData(data: any[]) {
    if (data.length < 2) {
      this.toastService.showError('Tệp Excel trống hoặc không đúng định dạng.');
      return;
    }

    const rows = data.slice(1); // Skip header row
    this.productsPreview = rows.filter(row => row[0]) // Filter out rows with no name
      .map(row => {
        const baseStock = Number(row[4]) || 0;
        const variantsStr = row[10] ? String(row[10]) : ''; // Column K
        const variants = this.parseVariants(variantsStr, Number(row[2]) || 0, baseStock);

        const specsStr = row[9] ? String(row[9]) : ''; // Column J
        const specs = this.parseSpecifications(specsStr);

        return {
          name: row[0],
          sku: row[1],
          price: Number(row[2]) || 0,
          oldPrice: Number(row[3]) || null,
          totalStock: Number(row[4]) || 0,
          categoryId: Number(row[5]) || null,
          brandId: Number(row[6]) || null,
          imageUrl: row[7] || null,
          imageGallery: this.parseGallery(row[11] ? String(row[11]) : ''), // Column L
          description: row[8] || '',
          specifications: specs,
          hasVariants: variants.length > 0,
          variants: variants
        };
      });
  }

  private parseSpecifications(str: string): string {
    if (!str || str.trim() === '') return '[]';
    
    // Kiểm tra nếu là JSON
    try {
      const parsed = JSON.parse(str);
      // Trường hợp 1: Nếu là mảng đúng chuẩn [ {key, value} ]
      if (Array.isArray(parsed)) return str;
      
      // Trường hợp 2: Nếu là đối tượng { "A": "B" }, tự động chuyển sang mảng
      if (typeof parsed === 'object' && parsed !== null) {
        const pairs = Object.entries(parsed).map(([key, value]) => ({ 
          key: key.trim(), 
          value: String(value).trim() 
        }));
        return JSON.stringify(pairs);
      }
    } catch (e) {
      // Không phải JSON, tiếp tục xử lý dạng "Key: Value | Key: Value"
    }

    const pairs = str.split('|').map(p => {
      const parts = p.split(':');
      if (parts.length >= 2) {
        return { key: parts[0].trim(), value: parts.slice(1).join(':').trim() };
      }
      return null;
    }).filter(p => p !== null);

    return JSON.stringify(pairs);
  }

  private parseGallery(str: string): string[] {
    if (!str || str.trim() === '') return [];
    // Tách theo dấu phẩy hoặc dấu gạch đứng
    return str.split(/[|,]/)
      .map(img => img.trim())
      .filter(img => img.length > 0);
  }

  private parseVariants(str: string, defaultPrice: number = 0, defaultStock: number = 0): any[] {
    if (!str || str.trim() === '') return [];
    
    // Format: "Name,Price,Stock | Name,Price,Stock"
    return str.split('|').map(v => {
      const parts = v.split(',');
      const priceStr = parts[1]?.trim();
      const stockStr = parts[2]?.trim();
      
      return {
        variantName: parts[0]?.trim(),
        price: priceStr ? Number(priceStr) : defaultPrice,
        stock: stockStr ? Number(stockStr) : defaultStock,
        sku: null // Backend will auto-generate if null
      };
    }).filter(v => v.variantName);
  }

  clearPreview() {
    this.productsPreview = [];
    // Giải phóng tất cả URL trước khi xóa map
    this.selectedImages.forEach(img => URL.revokeObjectURL(img.url));
    this.selectedImages.clear();
  }

  isImageMatched(imageUrl: string): 'matched' | 'missing' | 'none' {
    if (!imageUrl) return 'none';
    if (imageUrl.startsWith('http')) return 'matched';
    const filename = imageUrl.toLowerCase();
    return this.selectedImages.has(filename) ? 'matched' : 'missing';
  }

  getGalleryStatus(gallery: string[]): { matched: number, total: number } {
    if (!gallery || gallery.length === 0) return { matched: 0, total: 0 };
    
    let matched = 0;
    gallery.forEach(img => {
      if (img.startsWith('http') || this.selectedImages.has(img.toLowerCase())) {
        matched++;
      }
    });
    return { matched, total: gallery.length };
  }

  get isImportInvalid(): boolean {
    if (this.productsPreview.length === 0) return true;
    
    return this.productsPreview.some(product => {
      // Kiểm tra ảnh chính
      if (this.isImageMatched(product.imageUrl) === 'missing') return true;
      
      // Kiểm tra ảnh bổ sung
      const galleryStatus = this.getGalleryStatus(product.imageGallery);
      if (galleryStatus.total > 0 && galleryStatus.matched < galleryStatus.total) return true;
      
      return false;
    });
  }

  downloadTemplate() {
    this.toastService.showInfo('Đang chuẩn bị dữ liệu mẫu mới nhất...');
    
    // Gọi API lấy dữ liệu thực tế để người dùng tra cứu ID
    forkJoin({
      categories: this.categoryService.getCategories(),
      brands: this.brandService.getBrands()
    }).subscribe({
      next: (res) => {
        this.generateExcelFile(res.categories, res.brands);
      },
      error: () => {
        this.toastService.showWarning('Không thể lấy dữ liệu tra cứu, tệp mẫu sẽ ở dạng mặc định.');
        this.generateExcelFile([], []);
      }
    });
  }

  private generateExcelFile(categories: any[], brands: any[]) {
    // 1. Sheet Chính: Dữ liệu sản phẩm (Dùng Emoji làm tiêu đề cho trực quan)
    const dataHeader = [
      '📦 Tên sản phẩm (*)', '🏷️ SKU (Tự động nếu trống)', '💰 Giá bán (*)', '📉 Giá cũ', '🔢 Tồn kho (*)', 
      '📂 ID Danh mục (*)', '🏢 ID Thương hiệu (*)', '🖼️ Ảnh chính (URL/Tên file)', '📝 Mô tả ngắn', '⚙️ Thông số (JSON)', 
      '✨ Biến thể (Tên,Giá,Kho | ...)', '🖼️ Ảnh bổ sung (Cách nhau bởi dấu phẩy)'
    ];
    
    const sampleData = [
      ['Mũi taro M12x1.75 - Thép HSS-E', 'TARO-M12-HSS', 150000, 180000, 100, 10, 1, 'm12-taro.jpg', 'Chất lượng tiêu chuẩn Đức.', '{"Vật liệu": "HSS-E"}', 'Ren thô,150000,50 | Ren mịn,160000,50', 'm12_side1.jpg, m12_side2.jpg'],
    ];

    const wsData = XLSX.utils.aoa_to_sheet([dataHeader, ...sampleData]);

    // 2. Sheet Phụ: Hướng dẫn & Bảng tra cứu ID (Đây là phần quan trọng)
    const guideRows: any[] = [
      ['HƯỚNG DẪN NHẬP LIỆU CHI TIẾT', '', ''],
      ['', '', ''],
      ['Tên cột', 'Yêu cầu', 'Mô tả chi tiết & Ví dụ'],
      ['📦 Tên sản phẩm', 'BẮT BUỘC', 'Tên đầy đủ của sản phẩm công cụ.'],
      ['💰 Giá bán', 'BẮT BUỘC', 'Giá thực tế khách hàng trả. Ví dụ: 150000'],
      ['📉 Giá cũ', 'TÙY CHỌN', 'Giá niêm yết cũ. Nếu > Giá bán, hệ thống sẽ hiện gạch ngang (Sale).'],
      ['📂 ID Danh mục', 'BẮT BUỘC', 'Lấy mã số tương ứng trong bảng tra cứu phía dưới.'],
      ['🏢 ID Thương hiệu', 'BẮT BUỘC', 'Lấy mã số tương ứng trong bảng tra cứu phía dưới.'],
      ['🖼️ Ảnh chính', 'TÙY CHỌN', 'Tên file (ví dụ: product.jpg) hoặc URL ảnh (http...).'],
      ['📝 Mô tả', 'TÙY CHỌN', 'Mô tả chi tiết về sản phẩm.'],
      ['⚙️ Thông số', 'TÙY CHỌN', 'Định dạng: Tên: Giá trị | Tên: Giá trị. Ví dụ: Vật liệu: Thép'],
      ['✨ Biến thể', 'TÙY CHỌN', 'Định dạng: Tên,Giá,Kho | Tên,Giá,Kho (Dùng dấu | để tách các loại)'],
      ['🖼️ Ảnh bổ sung', 'TÙY CHỌN', 'Tên file hoặc URL, cách nhau bởi dấu phẩy. Ví dụ: slide1.jpg, slide2.png'],
      ['', '', ''],
      ['-------------------------------------------', '', ''],
      ['BẢNG TRA CỨU ID HỆ THỐNG (Cập nhật mới nhất)', '', ''],
      ['', '', ''],
      ['1. DANH MỤC SẢN PHẨM', '', ''],
      ['ID số', 'Tên Danh mục', ''],
    ];

    // Điền danh sách danh mục (Hiển thị dạng cây đầy đủ)
    const flattenedCats = this.flattenCategories(categories);
    flattenedCats.forEach(c => guideRows.push([c.id, c.fullName, '']));
    
    guideRows.push(['', '', '']);
    guideRows.push(['2. THƯƠNG HIỆU', '', '']);
    guideRows.push(['ID số', 'Tên Thương hiệu', '']);
    
    // Điền danh sách thương hiệu
    brands.forEach(b => guideRows.push([b.id, b.name, '']));

    const wsGuide = XLSX.utils.aoa_to_sheet(guideRows);

    // Cấu hình độ rộng cột
    wsData['!cols'] = [
      { wch: 35 }, { wch: 25 }, { wch: 12 }, { wch: 14 }, { wch: 13 }, 
      { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 30 }, { wch: 20 }, 
      { wch: 40 }, { wch: 40 }
    ];
    wsGuide['!cols'] = [{ wch: 45 }, { wch: 50 }, { wch: 30 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsData, 'Dữ liệu sản phẩm');
    XLSX.utils.book_append_sheet(wb, wsGuide, 'Bảng Tra Cứu ID (HDSD)');

    XLSX.writeFile(wb, 'ToolCNC_Products_Template.xlsx');
    this.toastService.showSuccess('Mẫu thêm mới hàng loạt sản phẩm đã được tải về!');
  }

  private flattenCategories(categories: any[], parentName: string = ''): any[] {
    let result: any[] = [];
    categories.forEach(cat => {
      const fullName = parentName ? `${parentName} > ${cat.name}` : cat.name;
      result.push({ id: cat.id, fullName: fullName });
      if (cat.children && cat.children.length > 0) {
        result = result.concat(this.flattenCategories(cat.children, fullName));
      }
    });
    return result;
  }

  async saveBulk() {
    if (this.isImportInvalid) return;

    this.isSaving = true;
    this.uploadProgress = 0;
    const namesToCheck = this.productsPreview.map(p => p.name);
    
    this.productService.checkDuplicates(namesToCheck).subscribe({
      next: async (duplicates) => {
        let listToSave = [...this.productsPreview];
        
        if (duplicates && duplicates.length > 0) {
          const duplicateSet = new Set(duplicates.map(n => n.toLowerCase()));
          listToSave = listToSave.filter(p => !duplicateSet.has(p.name.toLowerCase()));
          
          this.toastService.showWarning(`Bỏ qua ${duplicates.length} sản phẩm đã tồn tại tên trên hệ thống.`);
          
          if (listToSave.length === 0) {
            this.toastService.showError('Tất cả sản phẩm trong danh sách đều đã tồn tại!');
            this.isSaving = false;
            return;
          }
        }

        try {
          this.toastService.showInfo(`Bắt đầu tải ảnh cho ${listToSave.length} sản phẩm mới...`);
          
          // Tính tổng số ảnh cần tải (bao gồm cả gallery) của danh sách đã lọc
          let totalToUpload = 0;
          listToSave.forEach(p => {
            if (this.isImageMatched(p.imageUrl) === 'matched' && !p.imageUrl.startsWith('http')) {
              totalToUpload++;
            }
            if (p.imageGallery) {
              p.imageGallery.forEach((img: string) => {
                if (!img.startsWith('http') && this.selectedImages.has(img.toLowerCase())) {
                  totalToUpload++;
                }
              });
            }
          });
          
          let uploadedCount = 0;

          for (let i = 0; i < listToSave.length; i++) {
            const product = listToSave[i];
            const matchStatus = this.isImageMatched(product.imageUrl);

            // 1.1 Tải ảnh chính
            if (matchStatus === 'matched' && !product.imageUrl.startsWith('http')) {
              const imageData = this.selectedImages.get(product.imageUrl.toLowerCase())!;
              try {
                const res = await lastValueFrom(this.cloudinaryService.uploadImage(imageData.file)) as any;
                product.imageUrl = res.secure_url;
                uploadedCount++;
                this.uploadProgress = totalToUpload > 0 ? Math.round((uploadedCount / totalToUpload) * 100) : 100;
              } catch (err) {
                console.error(`Lỗi tải ảnh chính cho ${product.name}`, err);
              }
            }

            // 1.2 Tải ảnh bổ sung (Gallery)
            if (product.imageGallery && product.imageGallery.length > 0) {
              const newGallery: string[] = [];
              for (let imgUrl of product.imageGallery) {
                if (imgUrl.startsWith('http')) {
                  newGallery.push(imgUrl);
                } else {
                  const filename = imgUrl.toLowerCase();
                  if (this.selectedImages.has(filename)) {
                    try {
                      const imageData = this.selectedImages.get(filename)!;
                      const res = await lastValueFrom(this.cloudinaryService.uploadImage(imageData.file)) as any;
                      newGallery.push(res.secure_url);
                      uploadedCount++;
                      this.uploadProgress = totalToUpload > 0 ? Math.round((uploadedCount / totalToUpload) * 100) : 100;
                    } catch (err) {
                      console.error(`Lỗi tải ảnh bổ sung ${imgUrl} cho ${product.name}`, err);
                    }
                  }
                }
              }
              product.imageGallery = newGallery;
            }
          }

          // 2. Gọi API nạp hàng loạt dữ liệu đã có URL Cloudinary (danh sách đã lọc)
          this.productService.createProductsBulk(listToSave).subscribe({
            next: () => {
              this.toastService.showSuccess(`Đã nạp thành công ${listToSave.length} sản phẩm mới!`);
              this.isSaving = false;
              this.isSaving = false;
              this.clearPreview();
              this.onComplete.emit();
              this.router.navigate(['/admin/products']);
            },
            error: (err) => {
              this.isSaving = false;
              this.toastService.showError(err.error || 'Có lỗi xảy ra khi lưu vào database');
            }
          });

        } catch (error) {
          this.isSaving = false;
          this.toastService.showError('Có lỗi xảy ra trong quá trình nạp ảnh.');
        }
      },
      error: () => {
        this.isSaving = false;
        this.toastService.showError('Không thể kiểm tra trùng lặp sản phẩm.');
      }
    });
  }
}
