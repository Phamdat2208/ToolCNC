export interface QuotationRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName?: string;
  productId: number;
  productName: string;
  variantId?: number;
  quantity: number;
  note?: string;
}

export interface QuotationResponse {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName?: string;
  productId: number;
  productName: string;
  variantId?: number;
  quantity: number;
  note?: string;
  status: 'PENDING' | 'CONTACTED' | 'DONE' | 'REJECTED';
  createdAt: string;
}
