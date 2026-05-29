import { StatusMap } from "../../models/status-tag.model";

export const ORDER_STATUS_MAP: StatusMap = {
  PENDING:   { color: 'warning',    label: 'Đang xử lý' },
  SHIPPING:  { color: 'processing', label: 'Đang giao hàng' },
  COMPLETED: { color: 'success',    label: 'Đã hoàn thành' },
  CANCELLED: { color: 'error',      label: 'Đã hủy' },
  CONFIRMED: { color: 'geekblue',   label: 'Đã xác nhận' },
  DELIVERED: { color: 'success',    label: 'Đã giao hàng' },
  SHIPPED:   { color: 'blue',       label: 'Đang giao' },
};

export const QUOTATION_STATUS_MAP: StatusMap = {
  PENDING:   { color: 'warning',    label: 'Đang chờ' },
  REVIEWED:  { color: 'cyan',       label: 'Đã xem xét' },
  CONTACTED: { color: 'processing', label: 'Đã liên hệ' },
  DONE:      { color: 'success',    label: 'Hoàn tất' },
  REJECTED:  { color: 'error',      label: 'Đã từ chối' },
  SENT:      { color: 'geekblue',   label: 'Đã gửi báo giá' },
};

export const USER_ROLE_MAP: StatusMap = {
  ADMIN:     { color: 'gold',       label: 'Quản trị viên' },
  CUSTOMER:  { color: 'blue',       label: 'Khách hàng' },
};

export const USER_STATUS_MAP: StatusMap = {
  ACTIVE:    { color: 'success',    label: 'Hoạt động' },
  LOCKED:  { color: 'default',    label: 'Khóa' },
  DELETED:  { color: 'error',      label: 'Tạm ngưng' },
};

export const PRODUCT_STATUS_MAP: StatusMap = {
  ACTIVE:    { color: 'blue',       label: 'Hoạt động' },
  INACTIVE:  { color: 'default',    label: 'Tạm ngưng' },
};
