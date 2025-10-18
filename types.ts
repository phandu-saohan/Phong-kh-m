// --- FIX: Define and export all application types in this central file.

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface CommissionRate {
  role: string;
  sales_rate: number; // e.g., 0.05 for 5%
  service_rate: number; // e.g., 0.1 for 10%
}

export interface OneSignalSettings {
  app_id: string | null;
  rest_api_key: string | null;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string; // FIX: Changed from StaffRole to string for dynamic roles
  avatar: string;
  dashboard_layout?: {
    order: string[];
    visible: string[];
  };
}

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number; // in minutes
  description: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
}

export interface TreatmentHistory {
    id: string;
    customerId: string;
    serviceName: string; 
    staffId: string;
    cost: number;
    notes: string;
    // FIX: Standardize to Date object
    treatmentDate: Date;
    staffName?: string; 
}

export interface Feedback {
    id: string;
    appointment_id: string;
    customer_id: string;
    staff_id: string;
    rating: number; // 1 to 5
    comment: string;
    created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  // FIX: Standardize to Date object
  joinDate: Date;
  // FIX: Allow null and standardize to Date object
  lastVisit: Date | null;
  totalSpent: number;
  tags: string[];
  treatmentHistory: TreatmentHistory[];
  feedback: Feedback[];
}

export type AppointmentStatus = 'Đã xác nhận' | 'Hoàn thành' | 'Đã hủy' | 'Chờ xác nhận';

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  service: string;
  staffId: string;
  staffName: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  feedback?: Feedback;
}

export interface SaleItem {
    type: 'service' | 'product';
    itemId: string;
    itemName: string;
    quantity: number;
    price: number;
    technician?: {
        id: string;
        name: string;
    };
}

export interface Sale {
    id: string;
    date: Date;
    customer: {
        id: string;
        name: string;
    };
    staff: {
        id: string;
        name: string;
    };
    items: SaleItem[];
    total: number;
    paymentMethod: 'Tiền mặt' | 'Chuyển khoản' | 'Thẻ';
}

export interface LeadNote {
    // FIX: Standardize to Date object
    date: Date;
    note: string;
}

export type LeadStatus = 'Mới' | 'Đang tư vấn' | 'Tiềm năng' | 'Chốt thành công' | 'Thất bại';
export type LeadSource = 'Facebook' | 'Zalo' | 'Website' | 'Giới thiệu' | 'Khác';

export interface Lead {
    id: string;
    name: string;
    phone: string;
    email?: string;
    avatar: string;
    source: LeadSource;
    status: LeadStatus;
    assignedTo: string | null; 
    // FIX: Allow null and standardize to Date object
    lastContacted: Date | null;
    notes: LeadNote[];
}

export type LeaveRequestStatus = 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối';

export interface LeaveRequest {
    id: string;
    staffId: string;
    staffName: string;
    startDate: Date;
    endDate: Date;
    reason: string;
    status: LeaveRequestStatus;
    manager_notes?: string;
}

export interface TimekeepingRecord {
    id: string;
    staff_id: string;
    check_in_time: Date;
    check_out_time: Date | null;
    duration_hours?: number;
    notes?: string;
    staffName?: string;
}

export type ExpenseStatus = 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối';

export interface Expense {
    id: string;
    expense_date: Date;
    category: string;
    description: string;
    amount: number;
    staff_id: string | null;
    staffName?: string;
    status: ExpenseStatus;
    recorder_name?: string;
}

export type Permission =
    // Dashboard
    | 'view_dashboard'
    // Customers
    | 'view_customers'
    | 'add_customer'
    | 'edit_customer'
    | 'delete_customer'
    // Leads
    | 'view_leads'
    | 'add_lead'
    | 'edit_lead'
    | 'delete_lead'
    // Appointments
    | 'view_appointments'
    | 'add_appointment'
    | 'edit_appointment_status'
    // Staff
    | 'view_staff'
    | 'add_staff'
    | 'edit_staff'
    // Leave
    | 'view_all_leave'
    | 'request_leave'
    | 'approve_leave'
    // Timekeeping
    | 'view_all_timekeeping'
    | 'use_timekeeping'
    // Inventory
    | 'view_inventory'
    | 'add_inventory'
    | 'edit_inventory'
    | 'delete_inventory'
    // Sales
    | 'view_sales'
    | 'create_sale'
    // Expenses
    | 'view_expenses'
    | 'manage_expenses'
    // Reports & Commissions
    | 'view_reports'
    | 'view_commissions'
    // Settings
    | 'manage_settings';

export type RolePermissions = {
    [key: string]: Permission[]; // FIX: Changed key from StaffRole to string
};

// Notification Types
export type NotificationType = 
    | 'new_appointment' 
    | 'appointment_updated'
    | 'completed_sale' 
    | 'low_stock' 
    | 'lead_assigned'
    | 'leave_request_new'
    | 'leave_request_update'
    | 'expense_approval'
    | 'expense_status'
    | 'system_message';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: Date;
  isRead: boolean;
  link?: {
      view: string;
      data?: any;
  };
}