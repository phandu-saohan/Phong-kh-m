import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { StaffMember, Notification } from '../../types';
import { 
    LogoutIcon, BellIcon, MenuIcon, AppointmentsIcon, 
    ShoppingCartIcon, ExclamationIcon, InfoIcon, LeadsIcon, LeaveIcon, ExpensesIcon
} from '../icons/Icons';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface HeaderProps {
  currentUser: StaffMember;
  onLogout: () => void;
  viewTitle: string;
  onToggleSidebar: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigate: (view: string, data?: any) => void;
}

const NotificationIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
    switch (type) {
        case 'new_appointment':
            return <AppointmentsIcon className="h-5 w-5 text-blue-500" />;
        case 'appointment_updated':
            return <AppointmentsIcon className="h-5 w-5 text-indigo-500" />;
        case 'completed_sale':
            return <ShoppingCartIcon className="h-5 w-5 text-green-500" />;
        case 'low_stock':
            return <ExclamationIcon className="h-5 w-5 text-yellow-500" />;
        case 'lead_assigned':
            return <LeadsIcon className="h-5 w-5 text-purple-500" />;
        case 'leave_request_new':
        case 'leave_request_update':
            return <LeaveIcon className="h-5 w-5 text-teal-500" />;
        case 'expense_approval':
        case 'expense_status':
            return <ExpensesIcon className="h-5 w-5 text-orange-500" />;
        case 'system_message':
        default:
            return <InfoIcon className="h-5 w-5 text-gray-500" />;
    }
};

const Header: React.FC<HeaderProps> = ({ 
    currentUser, 
    onLogout, 
    viewTitle, 
    onToggleSidebar, 
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onNavigate
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);
  
  // Close notification panel on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    onMarkAsRead(notification.id);
    if (notification.link) {
      onNavigate(notification.link.view, notification.link.data);
    }
    setIsNotificationsOpen(false);
  };


  return (
    <header className="h-20 bg-white border-b border-clinic-border flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
      <div className="flex items-center">
        <button 
          onClick={onToggleSidebar} 
          className="lg:hidden p-2 rounded-full hover:bg-gray-100 text-gray-500 mr-2"
          aria-label="Mở menu"
        >
          <MenuIcon />
        </button>
        <h1 className="text-xl font-semibold text-clinic-text hidden sm:block">{viewTitle}</h1>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="relative" ref={notificationRef}>
            <button 
                onClick={() => setIsNotificationsOpen(prev => !prev)}
                className="relative p-2 rounded-full hover:bg-gray-100 text-gray-500"
                aria-label="Thông báo"
            >
                <BellIcon />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-5 w-5 text-xs flex items-center justify-center rounded-full bg-red-500 text-white transform -translate-y-1/2 translate-x-1/2 ring-2 ring-white">
                        {unreadCount}
                    </span>
                )}
            </button>
            {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-clinic-border z-50">
                    <div className="p-3 flex justify-between items-center border-b">
                        <h3 className="font-semibold text-gray-700">Thông báo</h3>
                        {unreadCount > 0 && (
                             <button onClick={onMarkAllAsRead} className="text-sm text-clinic-primary hover:underline">Đánh dấu tất cả đã đọc</button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(notification => (
                                <div 
                                    key={notification.id} 
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`flex items-start p-3 hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-indigo-50' : ''}`}
                                >
                                    <div className="flex-shrink-0 mt-1">
                                        <NotificationIcon type={notification.type} />
                                    </div>
                                    <div className="ml-3 w-0 flex-1">
                                        <p className="text-sm text-gray-700">{notification.message}</p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {formatDistanceToNow(notification.timestamp, { addSuffix: true, locale: vi })}
                                        </p>
                                    </div>
                                    {!notification.isRead && (
                                        <div className="ml-2 flex-shrink-0 mt-1">
                                            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full block"></span>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-6 text-sm">Không có thông báo mới.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
        <div className="flex items-center">
            <img src={currentUser.avatar} className="w-10 h-10 rounded-full" alt={currentUser.name} />
            <div className="ml-3 text-right hidden md:block">
                <p className="font-semibold text-sm">{currentUser.name}</p>
                <p className="text-xs text-gray-500">{currentUser.role}</p>
            </div>
        </div>
        <button onClick={onLogout} className="flex items-center p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-600" title="Đăng xuất">
          <LogoutIcon />
        </button>
      </div>
    </header>
  );
};

export default Header;