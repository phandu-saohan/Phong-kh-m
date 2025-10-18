import React, { useMemo } from 'react';
import { 
    DashboardIcon, CustomersIcon, AppointmentsIcon, StaffIcon, ServicesIcon, ProductsIcon,
    SalesIcon, ReportsIcon, CommissionsIcon, SettingsIcon, ClinicIcon, LeadsIcon, LeaveIcon, TimekeepingIcon, ExpensesIcon
} from '../icons/Icons';
import type { StaffMember, Permission } from '../../types';

type NavItemProps = {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
};

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            active 
            ? 'bg-clinic-primary text-white shadow-md' 
            : 'text-gray-600 hover:bg-indigo-50 hover:text-clinic-primary'
        }`}
    >
        {icon}
        <span className="ml-3">{label}</span>
    </button>
);

interface SidebarProps {
    currentView: string;
    onNavigate: (view: string) => void;
    currentUser: StaffMember;
    userPermissions: Set<Permission>;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const permissionMap: Record<string, Permission> = {
    dashboard: 'view_dashboard',
    customers: 'view_customers',
    leads: 'view_leads',
    appointments: 'view_appointments',
    sales: 'view_sales',
    staff: 'view_staff',
    timekeeping: 'use_timekeeping',
    leave: 'request_leave',
    services: 'view_inventory',
    products: 'view_inventory',
    expenses: 'view_expenses',
    reports: 'view_reports',
    commissions: 'view_commissions',
    settings: 'manage_settings',
};


const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, currentUser, userPermissions, isOpen, setIsOpen }) => {
    
    // Enhance the base permissions for a better UI experience
    // This ensures that users who can manage 'all' items can also perform the base action for themselves.
    const displayPermissions = useMemo(() => {
        const newPermissions = new Set(userPermissions);
        if (newPermissions.has('view_all_leave')) {
            newPermissions.add('request_leave');
        }
        if (newPermissions.has('view_all_timekeeping')) {
            newPermissions.add('use_timekeeping');
        }
        return newPermissions;
    }, [userPermissions]);
    
    const mainNavItemsList = [
        { id: 'dashboard', icon: <DashboardIcon />, label: 'Bảng điều khiển', permission: permissionMap.dashboard },
        { id: 'customers', icon: <CustomersIcon />, label: 'Khách hàng', permission: permissionMap.customers },
        { id: 'leads', icon: <LeadsIcon />, label: 'Khách tiềm năng', permission: permissionMap.leads },
        { id: 'appointments', icon: <AppointmentsIcon />, label: 'Lịch hẹn', permission: permissionMap.appointments },
        { id: 'sales', icon: <SalesIcon />, label: 'Bán hàng', permission: permissionMap.sales },
        { id: 'staff', icon: <StaffIcon />, label: 'Nhân viên', permission: permissionMap.staff },
        { id: 'timekeeping', icon: <TimekeepingIcon />, label: 'Chấm công', permission: permissionMap.timekeeping },
        { id: 'leave', icon: <LeaveIcon />, label: 'Quản lý nghỉ phép', permission: permissionMap.leave },
        { id: 'services', icon: <ServicesIcon />, label: 'Dịch vụ', permission: permissionMap.services },
        { id: 'products', icon: <ProductsIcon />, label: 'Sản phẩm', permission: permissionMap.products },
        { id: 'expenses', icon: <ExpensesIcon />, label: 'Chi phí', permission: permissionMap.expenses },
        { id: 'reports', icon: <ReportsIcon />, label: 'Báo cáo', permission: permissionMap.reports },
        { id: 'commissions', icon: <CommissionsIcon />, label: 'Hoa hồng', permission: permissionMap.commissions },
    ];

    const settingsNavItem = { id: 'settings', icon: <SettingsIcon />, label: 'Cài đặt', permission: permissionMap.settings };
    
    const navItems = useMemo(() => {
        const availableItems = mainNavItemsList.filter(item => displayPermissions.has(item.permission));
        // Remove duplicates that might arise from multiple items sharing a permission (e.g., services/products)
        return [...new Map(availableItems.map(item => [item.id, item])).values()];
    }, [displayPermissions]);

    const canViewSettings = useMemo(() => displayPermissions.has(settingsNavItem.permission), [displayPermissions]);

    return (
        <>
        {/* Overlay for mobile */}
        <div 
            className={`fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsOpen(false)}
        ></div>
        <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-clinic-border flex flex-col z-40 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="h-20 flex items-center justify-center border-b border-clinic-border">
                <ClinicIcon className="h-8 w-8 text-clinic-primary" />
                <span className="ml-2 text-2xl font-bold text-clinic-text">ClinicCRM</span>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map(item => (
                    <NavItem 
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        active={currentView === item.id || (currentView === 'customer-detail' && item.id === 'customers') || (currentView === 'lead-detail' && item.id === 'leads') || (currentView === 'create-sale' && item.id === 'sales')}
                        onClick={() => onNavigate(item.id)}
                    />
                ))}
            </nav>
            <div className="p-4 border-t border-clinic-border">
                {canViewSettings && (
                     <NavItem 
                        key={settingsNavItem.id}
                        icon={settingsNavItem.icon}
                        label={settingsNavItem.label}
                        active={currentView === settingsNavItem.id}
                        onClick={() => onNavigate(settingsNavItem.id)}
                    />
                )}
            </div>
        </aside>
        </>
    );
};

export default Sidebar;