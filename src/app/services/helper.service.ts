import { Injectable } from '@angular/core';
import type ExcelJS from 'exceljs';

export interface QuotationExcelData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  companyName?: string;
  address?: string;
  note?: string;
  items: {
    name: string;
    variantName?: string;
    quantity: number;
    price: number;
  }[];
  paymentMethod?: string;
  trackingNumber?: string;
}

// ── Color palette ────────────────────────────────────────────────
const C = {
  orange: 'FFEA580C',
  amber: 'FFF59E0B',
  amberLight: 'FFFFF7ED',
  amberBorder: 'FFFED7AA',
  headerBg: 'FF1E293B', // slate-800
  headerText: 'FFFFFFFF',
  sectionBg: 'FFEA580C', // orange-600
  sectionText: 'FFFFFFFF',
  rowOdd: 'FFFAFAFA',
  rowEven: 'FFFFFFFF',
  totalBg: 'FFFF7C00', // deep orange
  totalText: 'FFFFFFFF',
  borderColor: 'FFE2E8F0',
  labelColor: 'FF64748B',
  valueColor: 'FF0F172A',
  subtleBg: 'FFF8FAFC',
};

// ── Reusable style helpers ────────────────────────────────────────
// Note: these only need ExcelJS *types*, never the runtime module,
// so `import type` above is sufficient and keeps them free of the
// dynamic-import concern entirely.
function applyBorder(cell: ExcelJS.Cell, color = C.borderColor) {
  const side: ExcelJS.BorderStyle = 'thin';
  cell.border = {
    top: { style: side, color: { argb: color } },
    left: { style: side, color: { argb: color } },
    bottom: { style: side, color: { argb: color } },
    right: { style: side, color: { argb: color } },
  };
}

function center(cell: ExcelJS.Cell) {
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
}

function left(cell: ExcelJS.Cell) {
  cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
}

function right(cell: ExcelJS.Cell) {
  cell.alignment = { horizontal: 'right', vertical: 'middle' };
}

function fill(cell: ExcelJS.Cell, argb: string) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function font(cell: ExcelJS.Cell, opts: Partial<ExcelJS.Font>) {
  cell.font = { name: 'Arial', size: 10, ...opts };
}

function vndFormat(cell: ExcelJS.Cell) {
  cell.numFmt = '#,##0';
}

@Injectable({ providedIn: 'root' })
export class HelperService {
  // Cache the loaded module so repeated exports don't re-fetch the chunk.
  private exceljsModulePromise: Promise<typeof ExcelJS> | null = null;

  private loadExcelJS(): Promise<typeof ExcelJS> {
    if (!this.exceljsModulePromise) {
      this.exceljsModulePromise = import(
        /* webpackChunkName: "exceljs" */ 'exceljs'
      ).then((mod: any) => (mod.default ?? mod) as typeof ExcelJS);
    }
    return this.exceljsModulePromise;
  }

  public scrollToInvalidControl(modalElement?: HTMLElement | Element) {
    const container = modalElement ?? document;
    const invalidElements = container.querySelectorAll('.ng-invalid');
    const firstInvalidControl = Array.from(invalidElements).find(
      (el) =>
        el.tagName !== 'FORM' &&
        !el.hasAttribute('formGroup') &&
        !el.hasAttribute('formGroupName') &&
        !el.hasAttribute('formArrayName'),
    );
    if (!firstInvalidControl) return;
    firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const inputToFocus = firstInvalidControl.querySelector(
      'input:not([type="hidden"]), textarea, select, [tabindex]:not([tabindex="-1"])',
    ) as HTMLElement;
    setTimeout(() => {
      (inputToFocus ?? (firstInvalidControl as HTMLElement)).focus();
    }, 300);
  }

  public async exportQuotationExcel(
    data: QuotationExcelData,
    fileName = 'Bao_Gia_ToolCNC.xlsx',
  ): Promise<void> {
    // ExcelJS is only pulled into the bundle when this method actually runs.
    const ExcelJS = await this.loadExcelJS();

    const wb = new ExcelJS.Workbook();
    wb.creator = 'ToolCNC System';
    wb.created = new Date();

    const ws = wb.addWorksheet('Báo Giá', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
    });

    // Column widths
    ws.columns = [
      { key: 'a', width: 6 },
      { key: 'b', width: 36 },
      { key: 'c', width: 18 },
      { key: 'd', width: 12 },
      { key: 'e', width: 20 },
      { key: 'f', width: 22 },
    ];

    // ── Helper: merge + style a section header row ──────────────
    const addSectionHeader = (label: string, rowIdx: number) => {
      const row = ws.getRow(rowIdx);
      row.height = 22;
      ws.mergeCells(`A${rowIdx}:F${rowIdx}`);
      const cell = ws.getCell(`A${rowIdx}`);
      cell.value = label;
      fill(cell, C.sectionBg);
      font(cell, { bold: true, color: { argb: C.sectionText }, size: 11 });
      left(cell);
      cell.alignment = { ...cell.alignment, indent: 1 };
    };

    // ── Helper: info row (label | value) ────────────────────────
    const addInfoRow = (label: string, value: string, rowIdx: number) => {
      const row = ws.getRow(rowIdx);
      row.height = 18;
      ws.mergeCells(`A${rowIdx}:B${rowIdx}`);
      ws.mergeCells(`C${rowIdx}:F${rowIdx}`);
      const lCell = ws.getCell(`A${rowIdx}`);
      const vCell = ws.getCell(`C${rowIdx}`);
      lCell.value = label;
      vCell.value = value;
      font(lCell, { bold: true, color: { argb: C.labelColor } });
      font(vCell, { color: { argb: C.valueColor } });
      left(lCell);
      left(vCell);
      lCell.alignment = { ...lCell.alignment, indent: 1 };
      fill(lCell, C.subtleBg);
      [lCell, vCell].forEach((c) => applyBorder(c, C.borderColor));
    };

    let r = 1; // current row pointer

    // ════════════════════════════════════════════════════════════
    // BLOCK 1 — Company header
    // ════════════════════════════════════════════════════════════
    ws.mergeCells(`A${r}:F${r}`);
    const companyCell = ws.getCell(`A${r}`);
    companyCell.value = 'CÔNG TY TNHH TOOLCNC';
    fill(companyCell, C.headerBg);
    font(companyCell, { bold: true, size: 16, color: { argb: C.headerText } });
    center(companyCell);
    ws.getRow(r).height = 36;
    r++;

    ws.mergeCells(`A${r}:F${r}`);
    const addr = ws.getCell(`A${r}`);
    addr.value =
      'Địa chỉ: KCN Cao Quận 9, TP. Hồ Chí Minh  |  ĐT: 0987 654 321  |  Email: contact@toolcnc.com';
    fill(addr, C.headerBg);
    font(addr, { color: { argb: 'FFCBD5E1' }, size: 9 });
    center(addr);
    ws.getRow(r).height = 18;
    r++;

    // ── Orange accent bar ─────────────────────────────────────
    ws.mergeCells(`A${r}:F${r}`);
    fill(ws.getCell(`A${r}`), C.orange);
    ws.getRow(r).height = 4;
    r++;

    r++; // empty

    // ════════════════════════════════════════════════════════════
    // BLOCK 2 — Title
    // ════════════════════════════════════════════════════════════
    ws.mergeCells(`A${r}:F${r}`);
    const titleCell = ws.getCell(`A${r}`);
    titleCell.value = 'BẢNG BÁO GIÁ THIẾT BỊ & DỤNG CỤ CNC';
    fill(titleCell, C.amberLight);
    font(titleCell, { bold: true, size: 14, color: { argb: 'FFEA580C' } });
    center(titleCell);
    applyBorder(titleCell, C.amberBorder);
    ws.getRow(r).height = 30;
    r++;

    const formattedDate = new Date().toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    ws.mergeCells(`A${r}:F${r}`);
    const dateCell = ws.getCell(`A${r}`);
    dateCell.value = `Ngày tạo báo giá: ${formattedDate}${data.trackingNumber ? `   |   Số báo giá: #${data.trackingNumber}` : ''}`;
    font(dateCell, { italic: true, color: { argb: C.labelColor }, size: 9 });
    center(dateCell);
    fill(dateCell, C.amberLight);
    ws.getRow(r).height = 16;
    r++;

    r++; // empty

    // ════════════════════════════════════════════════════════════
    // BLOCK 3 — Customer info
    // ════════════════════════════════════════════════════════════
    addSectionHeader('  👤  THÔNG TIN KHÁCH HÀNG', r++);
    addInfoRow('Họ và tên', data.customerName, r++);
    addInfoRow('Số điện thoại', data.customerPhone, r++);
    addInfoRow('Email', data.customerEmail, r++);
    if (data.companyName) addInfoRow('Tên công ty', data.companyName, r++);
    if (data.address) addInfoRow('Địa chỉ giao hàng', data.address, r++);
    if (data.note) addInfoRow('Ghi chú', data.note, r++);

    r++; // empty

    // ════════════════════════════════════════════════════════════
    // BLOCK 4 — Product table
    // ════════════════════════════════════════════════════════════
    addSectionHeader('  📦  DANH SÁCH CHI TIẾT SẢN PHẨM', r++);

    // Table column headers
    const colHeaders = [
      'STT',
      'Tên sản phẩm',
      'Biến thể',
      'Số lượng',
      'Đơn giá (VND)',
      'Thành tiền (VND)',
    ];
    const headerRow = ws.getRow(r);
    headerRow.height = 24;
    colHeaders.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      fill(cell, C.headerBg);
      font(cell, { bold: true, color: { argb: C.headerText }, size: 10 });
      center(cell);
      applyBorder(cell);
    });
    r++;

    // Data rows
    let totalAmount = 0;
    data.items.forEach((item, idx) => {
      const subtotal = item.price * item.quantity;
      totalAmount += subtotal;
      const rowBg = idx % 2 === 0 ? C.rowOdd : C.rowEven;
      const dataRow = ws.getRow(r);
      // Auto height: ~14px per line, estimate lines from name length / col width (36 chars)
      const nameLines = Math.ceil(item.name.length / 36);
      dataRow.height = Math.max(22, nameLines * 16);

      const cells = [
        idx + 1,
        item.name,
        item.variantName || 'Mặc định',
        item.quantity,
        item.price,
        subtotal,
      ];

      cells.forEach((val, i) => {
        const cell = dataRow.getCell(i + 1);
        cell.value = val;
        fill(cell, rowBg);
        font(cell, { color: { argb: C.valueColor } });
        applyBorder(cell);
        if (i === 0) center(cell);
        else if (i === 1 || i === 2) {
          left(cell);
          cell.alignment = { ...cell.alignment, wrapText: true };
        } else right(cell);
        if (i >= 4) vndFormat(cell);
      });
      r++;
    });

    // Subtotals — merge D:E for label to avoid truncation
    const addSummaryRow = (
      label: string,
      value: number | string,
      isBold = false,
      isTotal = false,
    ) => {
      const row = ws.getRow(r);
      row.height = isTotal ? 28 : 20;
      ws.mergeCells(`A${r}:C${r}`);
      ws.mergeCells(`D${r}:E${r}`);
      const lCell = ws.getCell(`A${r}`);
      const eCell = ws.getCell(`D${r}`);
      const fCell = ws.getCell(`F${r}`);
      lCell.value = '';
      eCell.value = label;
      fCell.value = value;

      if (isTotal) {
        [lCell, eCell, fCell].forEach((c) => {
          fill(c, C.totalBg);
          font(c, { bold: true, size: 12, color: { argb: C.totalText } });
        });
      } else {
        [lCell, eCell, fCell].forEach((c) => {
          fill(c, C.subtleBg);
          font(c, { bold: isBold, color: { argb: C.valueColor } });
        });
      }
      right(eCell);
      right(fCell);
      if (typeof value === 'number') vndFormat(fCell);
      [eCell, fCell].forEach((c) => applyBorder(c));
      r++;
    };

    r++; // gap before totals
    addSummaryRow('Tổng cộng tiền hàng:', totalAmount);
    addSummaryRow('Phí vận chuyển:', 'Miễn phí ✓');
    addSummaryRow('TỔNG CỘNG THANH TOÁN:', totalAmount, true, true);

    // ════════════════════════════════════════════════════════════
    // BLOCK 5 — Payment info (optional)
    // ════════════════════════════════════════════════════════════
    if (data.paymentMethod) {
      r++;
      addSectionHeader('  💳  HÌNH THỨC THANH TOÁN', r++);

      const pmLabel =
        data.paymentMethod === 'cod'
          ? 'Thanh toán khi nhận hàng (COD)'
          : 'Chuyển khoản ngân hàng';
      addInfoRow('Phương thức', pmLabel, r++);

      if (data.paymentMethod === 'transfer') {
        addInfoRow('Chủ tài khoản', 'CONG TY TNHH TOOLCNC', r++);
        addInfoRow('Số tài khoản', '0987654321', r++);
        addInfoRow('Ngân hàng', 'MB Bank', r++);
        addInfoRow('Nội dung chuyển khoản', 'DH DT ' + data.customerPhone, r++);
      }
    }

    // ════════════════════════════════════════════════════════════
    // BLOCK 6 — Footer
    // ════════════════════════════════════════════════════════════
    r++;
    ws.mergeCells(`A${r}:F${r}`);
    const footer = ws.getCell(`A${r}`);
    footer.value =
      'Cảm ơn Quý khách đã tin tưởng lựa chọn dịch vụ của ToolCNC!';
    fill(footer, C.amberLight);
    font(footer, {
      bold: true,
      italic: true,
      color: { argb: 'FFEA580C' },
      size: 11,
    });
    center(footer);
    applyBorder(footer, C.amberBorder);
    ws.getRow(r).height = 28;

    // ── Export ───────────────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
}