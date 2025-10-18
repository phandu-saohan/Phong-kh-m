import React from 'react';
import { CustomersIcon, SalesIcon, TimekeepingIcon } from '../icons/Icons';
import type { Permission } from '../../types';

interface BottomNavProps {
    currentView: string;
    onNavigate: (view: string) => void;
    userPermissions: Set<Permission>;
}

type NavItemProps = {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center space-y-1 w-full h-full transition-colors ${
            active ? 'text-clinic-primary' : 'text-gray-500 hover:text-clinic-primary'
        }`}
    >
        {icon}
        <span className="text-xs font-medium">{label}</span>
    </button>
);

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate, userPermissions }) => {

    const navItems = [
        { id: 'customers', icon: <CustomersIcon />, label: 'Khách hàng', permission: 'view_customers' },
        { id: 'sales', icon: <SalesIcon />, label: 'Bán hàng', permission: 'view_sales' },
        { id: 'timekeeping', icon: <TimekeepingIcon />, label: 'Chấm công', permission: 'use_timekeeping' },
    ];

    const visibleItems = navItems.filter(item => userPermissions.has(item.permission as Permission));

    return (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-clinic-border shadow-lg md:hidden z-50">
            <div className="flex justify-around items-center h-full">
                {visibleItems.map(item => (
                    <NavItem
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        active={currentView === item.id || (currentView === 'customer-detail' && item.id === 'customers') || (currentView === 'create-sale' && item.id === 'sales')}
                        onClick={() => onNavigate(item.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default BottomNav;