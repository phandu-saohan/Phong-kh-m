import type { Permission } from '../types';

interface PermissionDetail {
    id: Permission;
    label: string;
    description: string;
}

// FIX: Define and export allPermissions to make this file a module.
export const allPermissions: PermissionDetail[] = [
    { id: 'view_dashboard', label: 'Xem Bảng điều khiển', description: 'Cho phép xem trang tổng quan với các số liệu chính.' },
    // Customers
    { id: 'view_customers', label: 'Xem Khách hàng', description: 'Cho phép xem danh sách và chi tiết khách hàng.' },
    { id: 'add_customer', label: 'Thêm Khách hàng', description: 'Cho phép tạo hồ sơ khách hàng mới.' },
    { id: 'edit_customer', label: 'Sửa Khách hàng', description: 'Cho phép chỉnh sửa thông tin khách hàng hiện có.' },
    { id: 'delete_customer', label: 'Xóa Khách hàng', description: 'Cho phép xóa hồ sơ khách hàng.' },
    // Leads
    { id: 'view_leads', label: 'Xem Khách tiềm năng', description: 'Cho phép xem danh sách và chi tiết khách tiềm năng.' },
    { id: 'add_lead', label: 'Thêm Khách tiềm năng', description: 'Cho phép tạo khách tiềm năng mới.' },
    { id: 'edit_lead', label: 'Sửa Khách tiềm năng', description: 'Cho phép chỉnh sửa thông tin khách tiềm năng.' },
    { id: 'delete_lead', label: 'Xóa Khách tiềm năng', description: 'Cho phép xóa khách tiềm năng.' },
    // Appointments
    { id: 'view_appointments', label: 'Xem Lịch hẹn', description: 'Cho phép xem tất cả lịch hẹn.' },
    { id: 'add_appointment', label: 'Thêm Lịch hẹn', description: 'Cho phép tạo lịch hẹn mới.' },
    { id: 'edit_appointment_status', label: 'Đổi trạng thái Lịch hẹn', description: 'Cho phép thay đổi trạng thái của lịch hẹn (xác nhận, hoàn thành, hủy).' },
    // Staff
    { id: 'view_staff', label: 'Xem Nhân viên', description: 'Cho phép xem danh sách nhân viên.' },
    { id: 'add_staff', label: 'Thêm Nhân viên', description: 'Cho phép tạo hồ sơ nhân viên mới và tài khoản đăng nhập.' },
    { id: 'edit_staff', label: 'Sửa Nhân viên', description: 'Cho phép chỉnh sửa thông tin nhân viên.' },
    // Leave
    { id: 'view_all_leave', label: 'Xem tất cả đơn nghỉ phép', description: 'Cho phép xem đơn nghỉ phép của tất cả nhân viên.' },
    { id: 'request_leave', label: 'Tạo đơn nghỉ phép', description: 'Cho phép nhân viên tự tạo đơn xin nghỉ phép cho bản thân.' },
    { id: 'approve_leave', label: 'Duyệt đơn nghỉ phép', description: 'Cho phép phê duyệt hoặc từ chối đơn nghỉ phép.' },
    // Timekeeping
    { id: 'view_all_timekeeping', label: 'Xem tất cả chấm công', description: 'Cho phép xem lịch sử chấm công của tất cả nhân viên.' },
    { id: 'use_timekeeping', label: 'Sử dụng chấm công', description: 'Cho phép nhân viên tự chấm công vào/ra ca.' },
    // Inventory
    { id: 'view_inventory', label: 'Xem Kho (Dịch vụ/Sản phẩm)', description: 'Cho phép xem danh sách dịch vụ và sản phẩm.' },
    { id: 'add_inventory', label: 'Thêm vào Kho', description: 'Cho phép thêm dịch vụ hoặc sản phẩm mới.' },
    { id: 'edit_inventory', label: 'Sửa trong Kho', description: 'Cho phép chỉnh sửa dịch vụ hoặc sản phẩm.' },
    { id: 'delete_inventory', label: 'Xóa khỏi Kho', description: 'Cho phép xóa dịch vụ hoặc sản phẩm.' },
    // Sales
    { id: 'view_sales', label: 'Xem Bán hàng', description: 'Cho phép xem lịch sử hóa đơn.' },
    { id: 'create_sale', label: 'Tạo Hóa đơn', description: 'Cho phép tạo hóa đơn bán hàng mới.' },
     // Expenses
    { id: 'view_expenses', label: 'Xem Chi phí', description: 'Cho phép xem danh sách chi phí của phòng khám.' },
    { id: 'manage_expenses', label: 'Quản lý Chi phí', description: 'Cho phép thêm, sửa, và xóa các khoản chi phí.' },
    // Reports & Commissions
    { id: 'view_reports', label: 'Xem Báo cáo', description: 'Cho phép truy cập và xem các báo cáo.' },
    { id: 'view_commissions', label: 'Xem Hoa hồng', description: 'Cho phép xem báo cáo hoa hồng của nhân viên.' },
    // Settings
    { id: 'manage_settings', label: 'Quản lý Cài đặt', description: 'Cho phép thay đổi cài đặt hệ thống, bao gồm cả phân quyền.' },
];