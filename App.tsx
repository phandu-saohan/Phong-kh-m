import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import Dashboard from './components/views/Dashboard';
import CustomerList from './components/views/CustomerList';
import CustomerDetail from './components/views/CustomerDetail';
import Appointments from './components/views/Appointments';
import Staff from './components/views/Staff';
import Services from './components/views/Services';
import Products from './components/views/Products';
import Sales from './components/views/Sales';
import CreateSale from './components/views/CreateSale';
import Reports from './components/views/Reports';
import Commissions from './components/views/Commissions';
import Settings from './components/views/Settings';
import Leads from './components/views/Leads';
import LeadDetail from './components/views/LeadDetail';
import LeaveManagement from './components/views/LeaveManagement';
import Timekeeping from './components/views/Timekeeping';
import Expenses from './components/views/Expenses';
import Login from './components/views/Login';
import { supabase } from './lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { allPermissions } from './data/mockData';
import { format } from 'date-fns';

import type { Customer, StaffMember, Service, Product, Appointment, Sale, Lead, LeaveRequest, RolePermissions, TreatmentHistory, Feedback, TimekeepingRecord, Permission, Role, Notification, CommissionRate, Expense, OneSignalSettings } from './types';

type ViewState = {
    name: string;
    data?: any;
};

// Make OneSignal globally available for the SDK
declare global {
    interface Window {
        OneSignal: any;
    }
}


const viewTitles: { [key: string]: string } = {
    dashboard: 'Bảng điều khiển',
    customers: 'Khách hàng',
    'customer-detail': 'Chi tiết khách hàng',
    appointments: 'Lịch hẹn',
    staff: 'Nhân viên',
    services: 'Dịch vụ',
    products: 'Sản phẩm',
    sales: 'Bán hàng',
    'create-sale': 'Tạo hóa đơn',
    reports: 'Báo cáo',
    commissions: 'Hoa hồng',
    settings: 'Cài đặt',
    leads: 'Khách tiềm năng',
    'lead-detail': 'Chi tiết khách tiềm năng',
    leave: 'Quản lý nghỉ phép',
    timekeeping: 'Chấm công',
    expenses: 'Quản lý chi phí',
};

const getErrorMessage = (error: unknown): string => {
    // 1. Log the raw error for debugging purposes, in case the user needs to provide more info
    console.error("Raw error received by getErrorMessage:", error);

    // 2. Handle null or undefined explicitly
    if (error === null || error === undefined) {
        return 'Lỗi không xác định.';
    }

    // 3. Handle standard Error objects (most common case)
    if (error instanceof Error) {
        if (error.message.toLowerCase().includes('failed to fetch')) {
            return 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
        }
        return error.message;
    }

    // 4. Handle plain strings
    if (typeof error === 'string') {
        return error;
    }

    // 5. Handle objects, which are the trickiest
    if (typeof error === 'object') {
        const err = error as { [key: string]: any };

        // Supabase/PostgREST specific error structure
        if (typeof err.message === 'string' && (err.details || err.hint || err.code)) {
            const parts = [err.message];
            if (err.details) parts.push(`Chi tiết: ${err.details}`);
            if (err.hint) parts.push(`Gợi ý: ${err.hint}`);
            if (err.code) parts.push(`Mã lỗi: ${err.code}`);
            return parts.join('\n');
        }

        // Any other object with a meaningful message property
        if (typeof err.message === 'string') {
            return err.message;
        }
        
        // Handle objects with a meaningful toString() method (like ProgressEvent)
        // Check if toString() is defined and doesn't return the default useless string.
        if (typeof err.toString === 'function' && err.toString() !== '[object Object]' && err.toString() !== '') {
            try {
                return err.toString();
            } catch {
                // ignore if toString throws
            }
        }
        
        // Fallback to JSON.stringify for serializable objects
        try {
            const jsonString = JSON.stringify(error, null, 2);
            if (jsonString !== '{}') {
                return jsonString; // Return the full JSON if it's not empty
            }
        } catch {
            // Ignore circular reference errors, proceed to manual inspection
        }
        
        // Last resort: manual inspection of object keys
        const keys = Object.keys(error);
        if (keys.length > 0) {
            const props = keys.slice(0, 5).map(key => {
                try {
                    return `${key}: ${String(err[key])}`;
                } catch {
                    return `${key}: [không thể đọc]`;
                }
            }).join(', ');
            return `Lỗi không xác định với đối tượng: { ${props}${keys.length > 5 ? ', ...' : ''} }`;
        }
    }

    // Final, absolute fallback for any other type (number, boolean, etc.)
    try {
        const stringified = String(error);
        if (stringified !== '[object Object]') {
            return stringified;
        }
    } catch {
        // Fallthrough to the final error message
    }

    return 'Đã xảy ra một lỗi không thể hiển thị chi tiết.';
};


const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [currentUser, setCurrentUser] = useState<StaffMember | null>(null);
    const [view, setView] = useState<ViewState>({ name: 'dashboard' });
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const oneSignalInitialized = useRef(false);


    // --- Data State ---
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [rolePermissions, setRolePermissions] = useState<RolePermissions>({});
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [timekeepingRecords, setTimekeepingRecords] = useState<TimekeepingRecord[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [commissionRates, setCommissionRates] = useState<CommissionRate[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [oneSignalSettings, setOneSignalSettings] = useState<OneSignalSettings | null>(null);


    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const dataPromises = {
                staff: supabase.from('staff').select('*'),
                customers: supabase.from('customers').select('*'),
                services: supabase.from('services').select('*'),
                products: supabase.from('products').select('*'),
                appointments: supabase.from('appointments').select('*'),
                sales: supabase.from('sales').select('*'),
                sale_items: supabase.from('sale_items').select('*'),
                leads: supabase.from('leads').select('*'),
                leave_requests: supabase.from('leave_requests').select('*'),
                role_permissions: supabase.from('role_permissions').select('*'),
                treatment_history: supabase.from('treatment_history').select('*'),
                feedback: supabase.from('feedback').select('*'),
                timekeeping: supabase.from('timekeeping').select('*'),
                commission_rates: supabase.from('commission_rates').select('*'),
                expenses: supabase.from('expenses').select('*'),
                app_settings: supabase.from('app_settings').select('*').eq('id', 1).single(),
            };

            const promiseEntries = Object.entries(dataPromises);
            const results = await Promise.allSettled(promiseEntries.map(entry => entry[1]));
            
            const fetchedData: { [key: string]: { data: any, error: any } } = {};

            results.forEach((result, index) => {
                const key = promiseEntries[index][0];
                if (result.status === 'rejected') {
                    console.error(`Error fetching ${key}:`, result.reason);
                    alert(`Không thể tải dữ liệu cho '${key}'. Lỗi: ${result.reason?.message || 'Lỗi mạng không xác định'}. Vui lòng kiểm tra kết nối và thử lại.`);
                    fetchedData[key] = { data: key === 'app_settings' ? null : [], error: result.reason };
                } else {
                    if (result.value.error) {
                        console.error(`Error fetching ${key}:`, result.value.error.message);
                        fetchedData[key] = { data: key === 'app_settings' ? null : [], error: result.value.error };
                    } else {
                        fetchedData[key] = { data: result.value.data, error: null };
                    }
                }
            });
    
            const staffData = fetchedData.staff.data || [];
            const customersData = fetchedData.customers.data || [];
            const servicesData = fetchedData.services.data || [];
            const productsData = fetchedData.products.data || [];
            const appointmentsData = fetchedData.appointments.data || [];
            const salesData = fetchedData.sales.data || [];
            const saleItemsData = fetchedData.sale_items.data || [];
            const leadsData = fetchedData.leads.data || [];
            const leaveRequestsData = fetchedData.leave_requests.data || [];
            const rolePermissionsData = fetchedData.role_permissions.data || [];
            const treatmentHistoryData = fetchedData.treatment_history.data || [];
            const feedbackData = fetchedData.feedback.data || [];
            const timekeepingData = fetchedData.timekeeping.data || [];
            const commissionRatesData = fetchedData.commission_rates.data || [];
            const expensesData = fetchedData.expenses.data || [];
            const appSettingsData = fetchedData.app_settings.data || null;

            if (appSettingsData) {
                setOneSignalSettings({
                    app_id: appSettingsData.onesignal_app_id,
                    rest_api_key: appSettingsData.onesignal_rest_api_key,
                });
            }

            setFeedback(feedbackData);
            setCommissionRates(commissionRatesData);
            
            const hydratedRoles = rolePermissionsData.map(r => ({
                id: r.role,
                name: r.role,
                permissions: Array.isArray(r.permissions) ? r.permissions : []
            }));
            setRoles(hydratedRoles);

            const hydratedStaff = staffData.map(s => ({
                ...s,
                avatar: s.avatar || `https://i.pravatar.cc/150?u=${s.id}`
            }));
            setStaff(hydratedStaff);

            const hydratedExpenses = expensesData.map(exp => ({
                ...exp,
                expense_date: new Date(exp.expense_date),
                staffName: exp.staff_id 
                    ? hydratedStaff.find(s => s.id === exp.staff_id)?.name || 'Nhân viên không xác định'
                    : exp.recorder_name || 'Người ngoài',
            }));
            setExpenses(hydratedExpenses);

            const hydratedTimekeeping = timekeepingData.map(record => ({
                ...record,
                check_in_time: new Date(record.check_in_time),
                check_out_time: record.check_out_time ? new Date(record.check_out_time) : null,
                staffName: hydratedStaff.find(s => s.id === record.staff_id)?.name || 'N/A'
            }));
            setTimekeepingRecords(hydratedTimekeeping);
            
            const hydratedAppointments = appointmentsData.map(apt => ({
                ...apt,
                customerId: apt.customer_id,
                customerName: customersData.find(c => c.id === apt.customer_id)?.name || 'N/A',
                service: apt.service_name,
                staffId: apt.staff_id,
                staffName: hydratedStaff.find(s => s.id === apt.staff_id)?.name || 'N/A',
                startTime: new Date(apt.start_time),
                endTime: new Date(apt.end_time),
                feedback: feedbackData.find(f => f.appointment_id === apt.id),
            }));
            setAppointments(hydratedAppointments);

            const hydratedCustomers = customersData.map(c => {
                 const history = treatmentHistoryData
                    .filter(th => th.customer_id === c.id)
                    .map(th => ({
                        ...th,
                        id: th.id,
                        customerId: th.customer_id,
                        serviceName: th.service_name,
                        staffId: th.staff_id,
                        treatmentDate: new Date(th.treatment_date),
                        staffName: hydratedStaff.find(s => s.id === th.staff_id)?.name || 'N/A'
                    }));
                const customerFeedback = feedbackData.filter(f => f.customer_id === c.id);
                return {
                    ...c,
                    avatar: c.avatar || `https://i.pravatar.cc/150?u=${c.id}`,
                    joinDate: new Date(c.join_date),
                    lastVisit: c.last_visit ? new Date(c.last_visit) : null,
                    totalSpent: c.total_spent || 0,
                    treatmentHistory: history,
                    feedback: customerFeedback,
                };
            });
            setCustomers(hydratedCustomers);
            

            const hydratedSales = salesData.map(sale => {
                const saleCustomer = hydratedCustomers.find(c => c.id === sale.customer_id);
                const saleStaff = hydratedStaff.find(s => s.id === sale.staff_id);
                const items = saleItemsData
                    .filter(item => item.sale_id === sale.id)
                    .map(item => ({
                        ...item,
                        itemId: item.item_id,
                        itemName: item.item_name,
                        technician: item.technician_id ? {
                            id: item.technician_id,
                            name: hydratedStaff.find(s => s.id === item.technician_id)?.name || 'N/A'
                        } : undefined
                    }));

                return {
                    ...sale,
                    id: sale.invoice_id,
                    date: new Date(sale.sale_date),
                    customer: { id: sale.customer_id, name: saleCustomer?.name || 'N/A'},
                    staff: { id: sale.staff_id, name: saleStaff?.name || 'N/A'},
                    items,
                    paymentMethod: sale.payment_method
                };
            });
            setSales(hydratedSales);

             const hydratedLeads = leadsData.map(lead => ({
                ...lead,
                avatar: lead.avatar || `https://i.pravatar.cc/150?u=${lead.id}`,
                assignedTo: lead.assigned_to,
                lastContacted: lead.last_contacted ? new Date(lead.last_contacted) : null,
                notes: Array.isArray(lead.notes) ? lead.notes.map((n: any) => ({ ...n, date: new Date(n.date) })) : [],
            }));
            setLeads(hydratedLeads);

            const hydratedLeaveRequests = leaveRequestsData.map(req => ({
                ...req,
                staffId: req.staff_id,
                staffName: hydratedStaff.find(s => s.id === req.staff_id)?.name || 'N/A',
                startDate: new Date(req.start_date),
                endDate: new Date(req.end_date),
                manager_notes: req.manager_notes,
            }));
            setLeaveRequests(hydratedLeaveRequests);
            
            const perms = hydratedRoles.reduce((acc, r) => {
                acc[r.name] = r.permissions;
                return acc;
            }, {} as RolePermissions);
            setRolePermissions(perms);
            
            setServices(servicesData);
            setProducts(productsData);
            
            if (session?.user) {
                const user = hydratedStaff.find(s => s.email.toLowerCase() === session.user.email?.toLowerCase());
                setCurrentUser(user || null);
            }

        } catch (error) {
            console.error("A critical error occurred in the data fetching process:", error);
            alert(`Đã xảy ra lỗi nghiêm trọng khi tải dữ liệu. Vui lòng thử tải lại trang. Lỗi: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setLoading(false);
        }
    }, [session]);
    
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [session, fetchData]);

    // --- OneSignal Integration ---
    useEffect(() => {
        // Step 1: Initialize the SDK only once when settings are available.
        if (oneSignalSettings?.app_id && !oneSignalInitialized.current) {
            // Mark as initialized immediately to prevent this block from re-running.
            oneSignalInitialized.current = true;
            
            window.OneSignal = window.OneSignal || [];
            // The push method queues operations until the SDK is fully loaded.
            window.OneSignal.push(() => {
                window.OneSignal.init({
                    appId: oneSignalSettings.app_id,
                });
            });
        }

        // Step 2: Log the user in with their ID once the SDK is initialized and the user is available.
        // This part can run multiple times if the user changes, which is safe.
        if (oneSignalInitialized.current && currentUser?.id) {
             window.OneSignal.push(() => {
                window.OneSignal.login(currentUser.id);
            });
        }
    // This effect runs whenever the settings or the current user might have changed.
    }, [oneSignalSettings, currentUser]);
    
    const sendPushNotification = useCallback(async (targetUserIds: string[], heading: string, content: string) => {
        if (!oneSignalSettings?.rest_api_key || !oneSignalSettings?.app_id || targetUserIds.length === 0) {
            console.warn("OneSignal not configured or no target users. Skipping push notification.");
            return;
        }

        try {
            await fetch('https://onesignal.com/api/v1/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authorization': `Basic ${oneSignalSettings.rest_api_key}`,
                },
                body: JSON.stringify({
                    app_id: oneSignalSettings.app_id,
                    include_external_user_ids: targetUserIds,
                    headings: { "en": heading },
                    contents: { "en": content },
                }),
            });
        } catch (error) {
            console.error("Failed to send push notification:", error);
        }
    }, [oneSignalSettings]);


    // --- Real-time Notification Generation ---
    useEffect(() => {
        const LOW_STOCK_THRESHOLD = 5;
        const managerIds = staff.filter(s => s.role === 'Quản lý').map(s => s.id);

        const lowStockProductInfo = new Map<string, { name: string, stock: number }>();
        products.forEach(product => {
            if (product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD) {
                lowStockProductInfo.set(product.id, { name: product.name, stock: product.stock });
            }
        });

        setNotifications(prevNotifications => {
            const newNotifications = [...prevNotifications];
            const handledProductIds = new Set<string>();
            let notificationsChanged = false;

            // Update or keep existing low stock notifications
            const updatedNotifications = newNotifications.map(notification => {
                if (notification.type === 'low_stock') {
                    const productId = notification.id.replace('stock-', '');
                    handledProductIds.add(productId);

                    const productInfo = lowStockProductInfo.get(productId);
                    if (productInfo) {
                        // Product is still low on stock, update message if needed
                        const newMessage = `Sản phẩm "${productInfo.name}" sắp hết hàng (còn ${productInfo.stock}).`;
                        if (notification.message !== newMessage) {
                            notificationsChanged = true;
                            return { ...notification, message: newMessage, timestamp: new Date(), isRead: false };
                        }
                        return notification;
                    } else {
                        // Product is no longer low on stock, mark for removal
                        notificationsChanged = true;
                        return null;
                    }
                }
                return notification;
            }).filter(Boolean) as Notification[]; // Filter out nulls

            // Add notifications for newly low stock products
            lowStockProductInfo.forEach((info, productId) => {
                if (!handledProductIds.has(productId)) {
                    // This is a new low stock item
                    const message = `Sản phẩm "${info.name}" sắp hết hàng (còn ${info.stock}).`;
                    if (managerIds.length > 0) {
                        sendPushNotification(managerIds, 'Cảnh báo tồn kho', message);
                    }
                    updatedNotifications.unshift({
                        id: `stock-${productId}`,
                        type: 'low_stock',
                        message,
                        timestamp: new Date(),
                        isRead: false,
                        link: { view: 'products' }
                    });
                    notificationsChanged = true;
                }
            });

            return notificationsChanged ? updatedNotifications : prevNotifications;
        });
    }, [products, staff, sendPushNotification]);

    useEffect(() => {
        const checkUpcomingAppointments = () => {
            const now = new Date();
            const upcomingThreshold = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes

            appointments.forEach(apt => {
                if (apt.status === 'Đã xác nhận' && apt.startTime > now && apt.startTime <= upcomingThreshold) {
                    const notificationId = `apt-${apt.id}`;
                    const message = `Lịch hẹn với ${apt.customerName} sắp bắt đầu lúc ${format(apt.startTime, 'HH:mm')}.`;

                    let alreadyNotified = false;
                    setNotifications(prev => {
                        alreadyNotified = prev.some(n => n.id === notificationId);
                        if (!alreadyNotified) {
                           return [{
                                id: notificationId, type: 'new_appointment', message,
                                timestamp: new Date(), isRead: false, link: { view: 'appointments' }
                            }, ...prev];
                        }
                        return prev;
                    });
                    
                    if (!alreadyNotified && apt.staffId) {
                        sendPushNotification([apt.staffId], 'Nhắc nhở lịch hẹn', message);
                    }
                }
            });
        };

        const intervalId = setInterval(checkUpcomingAppointments, 60000); // Check every minute
        checkUpcomingAppointments();

        return () => clearInterval(intervalId);
    }, [appointments, sendPushNotification]);

    const userPermissions = useMemo(() => {
        if (!currentUser) {
            return new Set<Permission>();
        }
        if (currentUser.role === 'Quản lý') {
            return new Set(allPermissions.map(p => p.id));
        }
        if (!rolePermissions[currentUser.role]) {
            return new Set<Permission>();
        }
        return new Set(rolePermissions[currentUser.role]);
    }, [currentUser, rolePermissions]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        if (window.OneSignal) {
            window.OneSignal.logout();
        }
        setCurrentUser(null);
        setView({ name: 'dashboard' });
    };

    const handleNavigate = (viewName: string, data?: any) => {
        setView({ name: viewName, data });
        setIsSidebarOpen(false);
    };
    
    const handleMarkNotificationAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const handleMarkAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };
    
    // --- CRUD Handlers ---

    const handleAddRole = async (roleData: Omit<Role, 'id'>) => {
        const trimmedName = roleData.name.trim();
        if (roles.some(r => r.name.toLowerCase() === trimmedName.toLowerCase())) {
            alert(`Vai trò "${trimmedName}" đã tồn tại.`);
            return;
        }
        const { error } = await supabase.from('role_permissions').insert({
            role: trimmedName,
            permissions: roleData.permissions,
        });

        if (error) {
            console.error("Error adding role:", error);
            alert(`Không thể thêm vai trò: ${getErrorMessage(error)}`);
            return;
        }
        await fetchData();
        alert('Đã thêm vai trò thành công.');
    };
    
    const handleUpdateRole = async (roleData: Role) => {
        const { error } = await supabase.from('role_permissions').update({
            permissions: roleData.permissions
        }).eq('role', roleData.id);

        if (error) {
            console.error("Error updating role:", error);
            alert(`Không thể cập nhật vai trò: ${getErrorMessage(error)}`);
            return;
        }
        await fetchData();
        alert('Cập nhật vai trò thành công!');
    };
    
    const handleDeleteRole = async (roleId: string) => {
        if (roleId === 'Quản lý') {
            alert('Không thể xóa vai trò "Quản lý".');
            return;
        }

        const { count, error: checkError } = await supabase.from('staff').select('*', { count: 'exact', head: true }).eq('role', roleId);
        
        if (checkError || (count && count > 0)) {
            alert(`Không thể xóa vai trò "${roleId}" vì vẫn còn ${count} nhân viên được gán vai trò này.`);
            return;
        }
        
        if (window.confirm(`Bạn có chắc chắn muốn xóa vai trò "${roleId}"?`)) {
            const { error } = await supabase.from('role_permissions').delete().eq('role', roleId);
            if (error) {
                console.error("Error deleting role:", error);
                alert(`Không thể xóa vai trò: ${getErrorMessage(error)}`);
            } else {
                await fetchData();
                alert('Đã xóa vai trò thành công.');
            }
        }
    };


    const handleAddCustomer = async (customerData: Omit<Customer, 'id' | 'joinDate' | 'lastVisit' | 'totalSpent' | 'avatar' | 'treatmentHistory' | 'feedback'>) => {
        const { data, error } = await supabase.from('customers').insert({
            name: customerData.name,
            phone: customerData.phone,
            email: customerData.email,
            tags: customerData.tags,
            avatar: `https://i.pravatar.cc/150?u=${customerData.phone}`
        }).select().single();

        if (error) {
            console.error("Error adding customer:", error);
            alert(`Không thể thêm khách hàng: ${getErrorMessage(error)}`);
            return;
        }

        const newCustomer: Customer = {
            ...data,
            avatar: data.avatar || `https://i.pravatar.cc/150?u=${data.phone}`,
            joinDate: new Date(data.join_date),
            lastVisit: data.last_visit ? new Date(data.last_visit) : null,
            totalSpent: data.total_spent || 0,
            treatmentHistory: [],
            feedback: []
        };
        setCustomers(prev => [newCustomer, ...prev]);
    };

    const handleUpdateCustomer = async (updatedCustomer: Customer) => {
        const { data, error } = await supabase.from('customers')
            .update({
                name: updatedCustomer.name,
                phone: updatedCustomer.phone,
                email: updatedCustomer.email,
                tags: updatedCustomer.tags,
                avatar: updatedCustomer.avatar,
            })
            .eq('id', updatedCustomer.id).select().single();
        
        if (error) {
            console.error("Error updating customer:", error);
            alert(`Không thể cập nhật khách hàng: ${getErrorMessage(error)}`);
            return;
        }
        
        const freshCustomer: Customer = {
            ...updatedCustomer,
            ...data,
            avatar: data.avatar || `https://i.pravatar.cc/150?u=${data.id}`,
            joinDate: new Date(data.join_date),
            lastVisit: data.last_visit ? new Date(data.last_visit) : null,
            totalSpent: data.total_spent || 0,
        };

        setCustomers(prev => prev.map(c => c.id === freshCustomer.id ? freshCustomer : c));
        if (view.name === 'customer-detail' && view.data.id === freshCustomer.id) {
            setView({ name: 'customer-detail', data: freshCustomer });
        }
    };

    const handleDeleteCustomer = async (customerId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa khách hàng này? Hành động này không thể hoàn tác và có thể ảnh hưởng đến các báo cáo liên quan.')) {
            const { error } = await supabase.from('customers').delete().eq('id', customerId);
            if (error) {
                console.error('Error deleting customer:', error);
                alert(`Không thể xóa khách hàng: ${getErrorMessage(error)}`);
            } else {
                setCustomers(prev => prev.filter(c => c.id !== customerId));
                alert('Đã xóa khách hàng thành công.');
            }
        }
    };
    
    const handleAddStaff = async (staffData: Omit<StaffMember, 'id' | 'avatar'>, password: string) => {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: staffData.email,
            password: password,
        });

        if (authError) {
            alert(`Lỗi tạo tài khoản: ${getErrorMessage(authError)}`);
            return;
        }

        if (authData.user) {
             const { data, error } = await supabase.from('staff').insert({
                id: authData.user.id,
                name: staffData.name,
                email: staffData.email,
                phone: staffData.phone,
                role: staffData.role,
                avatar: `https://i.pravatar.cc/150?u=${authData.user.id}`
             }).select().single();

             if (error) {
                 console.error('Error creating staff profile:', error);
                 alert(`Tạo tài khoản thành công nhưng không thể tạo hồ sơ nhân viên. Lỗi: ${getErrorMessage(error)}`);
                 return;
             }
             if (data) {
                 await fetchData();
             }
        }
    };

    const handleUpdateStaff = async (staffData: StaffMember) => {
        const { data, error } = await supabase.from('staff').update({
            name: staffData.name,
            phone: staffData.phone,
            role: staffData.role
        }).eq('id', staffData.id).select().single();

        if (error) {
            console.error('Error updating staff:', error);
            alert(`Không thể cập nhật nhân viên: ${getErrorMessage(error)}`);
            return;
        }

        await fetchData();
    };

    const handleAddService = async (serviceData: Omit<Service, 'id'>) => {
        const { data, error } = await supabase.from('services').insert(serviceData).select().single();
        if (error) {
            console.error('Error adding service:', error);
            alert(`Không thể thêm dịch vụ: ${getErrorMessage(error)}`);
            return;
        }
        setServices(prev => [data, ...prev]);
    };
    
    const handleUpdateService = async (serviceData: Service) => {
        const { data, error } = await supabase.from('services').update(serviceData).eq('id', serviceData.id).select().single();
        if (error) {
            console.error('Error updating service:', error);
            alert(`Không thể cập nhật dịch vụ: ${getErrorMessage(error)}`);
            return;
        }
        setServices(prev => prev.map(s => s.id === data.id ? data : s));
    };

    const handleDeleteService = async (serviceId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này? Hành động này sẽ ảnh hưởng đến các hóa đơn và lịch hẹn trong quá khứ.')) {
            const { error } = await supabase.from('services').delete().eq('id', serviceId);
            if (error) {
                console.error('Error deleting service:', error);
                alert(`Không thể xóa dịch vụ: ${getErrorMessage(error)}`);
            } else {
                setServices(prev => prev.filter(s => s.id !== serviceId));
                alert('Đã xóa dịch vụ thành công.');
            }
        }
    };

    const handleAddProduct = async (productData: Omit<Product, 'id'>) => {
        const { data, error } = await supabase.from('products').insert(productData).select().single();
        if (error) {
            console.error('Error adding product:', error);
            alert(`Không thể thêm sản phẩm: ${getErrorMessage(error)}`);
            return;
        }
        setProducts(prev => [data, ...prev]);
    };

    const handleUpdateProduct = async (productData: Product) => {
        const { data, error } = await supabase.from('products').update(productData).eq('id', productData.id).select().single();
        if (error) {
            console.error('Error updating product:', error);
            alert(`Không thể cập nhật sản phẩm: ${getErrorMessage(error)}`);
            return;
        }
        setProducts(prev => prev.map(p => p.id === data.id ? data : p));
    };

    const handleDeleteProduct = async (productId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này sẽ ảnh hưởng đến các hóa đơn trong quá khứ.')) {
            const { error } = await supabase.from('products').delete().eq('id', productId);
            if (error) {
                console.error('Error deleting product:', error);
                alert(`Không thể xóa sản phẩm: ${getErrorMessage(error)}`);
            } else {
                setProducts(prev => prev.filter(p => p.id !== productId));
                alert('Đã xóa sản phẩm thành công.');
            }
        }
    };

    const handleAddAppointment = async (apt: Omit<Appointment, 'id' | 'customerName' | 'staffName'>) => {
         const { data, error } = await supabase.from('appointments').insert({
             customer_id: apt.customerId,
             service_name: apt.service,
             staff_id: apt.staffId,
             start_time: apt.startTime.toISOString(),
             end_time: apt.endTime.toISOString(),
             status: apt.status
         }).select().single();

        if (error) {
            console.error('Error adding appointment:', error);
            alert(`Không thể thêm lịch hẹn: ${getErrorMessage(error)}`);
            return;
        }
        
        const customer = customers.find(c => c.id === apt.customerId);
        if (customer && apt.staffId) {
            const message = `Lịch hẹn mới với ${customer.name} lúc ${format(apt.startTime, 'HH:mm dd/MM/yyyy')}.`;
            setNotifications(prev => [{
                id: `new-apt-${data.id}`,
                type: 'new_appointment',
                message,
                timestamp: new Date(),
                isRead: false,
                link: { view: 'appointments' }
            }, ...prev.slice(0, 49)]);
            sendPushNotification([apt.staffId], 'Lịch hẹn mới', message);
        }
        
        await fetchData();
    };

    const handleAddAppointmentForLead = async (leadId: string, aptData: Omit<Appointment, 'id' | 'customerName' | 'staffName' | 'customerId' | 'feedback'>) => {
        try {
            const lead = leads.find(l => l.id === leadId);
            if (!lead) throw new Error("Không tìm thấy khách tiềm năng.");

            const { data: newCustomerData, error: customerError } = await supabase
                .from('customers')
                .insert({
                    name: lead.name,
                    phone: lead.phone,
                    email: lead.email,
                    tags: ['Từ khách tiềm năng'],
                })
                .select()
                .single();
            if (customerError) throw customerError;

            const { error: leadError } = await supabase
                .from('leads')
                .update({ status: 'Chốt thành công' })
                .eq('id', lead.id);
            if (leadError) {
                console.warn("Could not update lead status:", leadError);
            }

            const { data: aptResult, error: aptError } = await supabase
                .from('appointments')
                .insert({
                    customer_id: newCustomerData.id,
                    service_name: aptData.service,
                    staff_id: aptData.staffId,
                    start_time: aptData.startTime.toISOString(),
                    end_time: aptData.endTime.toISOString(),
                    status: aptData.status
                }).select().single();
            if (aptError) throw aptError;

            if (aptData.staffId) {
                const message = `Lịch hẹn mới với ${newCustomerData.name} lúc ${format(aptData.startTime, 'HH:mm dd/MM/yyyy')}.`;
                setNotifications(prev => [{
                    id: `new-apt-${aptResult.id}`,
                    type: 'new_appointment',
                    message,
                    timestamp: new Date(),
                    isRead: false,
                    link: { view: 'appointments' }
                }, ...prev.slice(0, 49)]);
                sendPushNotification([aptData.staffId], 'Lịch hẹn mới', message);
            }

            await fetchData();
            alert('Đã tạo lịch hẹn và chuyển đổi khách tiềm năng thành công!');

        } catch (error) {
            console.error("Error creating appointment for lead:", error);
            alert(`Đã xảy ra lỗi: ${getErrorMessage(error)}`);
        }
    };

    const handleUpdateAppointment = async (apt: Appointment) => {
        const { data, error } = await supabase.from('appointments').update({
            status: apt.status
        }).eq('id', apt.id).select().single();

        if (error) {
            console.error('Error updating appointment:', error);
            alert(`Không thể cập nhật lịch hẹn: ${getErrorMessage(error)}`);
            return;
        }
        
        const message = `Lịch hẹn với ${apt.customerName} lúc ${format(apt.startTime, 'HH:mm')} đã được cập nhật thành "${apt.status}".`;
        if (apt.staffId) {
            setNotifications(prev => [{
                id: `upd-apt-${apt.id}`,
                type: 'appointment_updated',
                message,
                timestamp: new Date(),
                isRead: false,
                link: { view: 'appointments' }
            }, ...prev.slice(0, 49)]);
            sendPushNotification([apt.staffId], 'Cập nhật lịch hẹn', message);
        }
        
        await fetchData();
    };

    const handleCreateSale = async (saleData: Omit<Sale, 'id' | 'date'>) => {
        try {
            const newInvoiceId = `HD${Date.now()}`;
            const saleDate = new Date();
            const { data: newSale, error: saleError } = await supabase.from('sales').insert({
                invoice_id: newInvoiceId,
                sale_date: saleDate.toISOString(),
                customer_id: saleData.customer.id,
                staff_id: saleData.staff.id,
                total: saleData.total,
                payment_method: saleData.paymentMethod,
            }).select().single();

            if (saleError) throw saleError;

            const saleItemsToInsert = saleData.items.map(item => ({
                sale_id: newSale.id,
                item_type: item.type,
                item_id: item.itemId,
                item_name: item.itemName,
                quantity: item.quantity,
                price: item.price,
                technician_id: item.technician?.id
            }));
            const { error: itemsError } = await supabase.from('sale_items').insert(saleItemsToInsert);
            if (itemsError) throw itemsError;

            for (const item of saleData.items) {
                if (item.type === 'product') {
                    const product = products.find(p => p.id === item.itemId);
                    if (product) {
                        const newStock = product.stock - item.quantity;
                        await supabase.from('products').update({ stock: newStock }).eq('id', item.itemId);
                    }
                }
            }
            const customer = customers.find(c => c.id === saleData.customer.id);
            if (customer) {
                const newTotalSpent = customer.totalSpent + saleData.total;
                await supabase.from('customers').update({ 
                    total_spent: newTotalSpent,
                    last_visit: saleDate.toISOString().split('T')[0]
                }).eq('id', customer.id);
            }

            const treatmentHistoryToInsert = saleData.items
                .filter(item => item.type === 'service' && item.technician)
                .map(item => ({
                    customer_id: saleData.customer.id,
                    treatment_date: saleDate.toISOString().split('T')[0],
                    service_name: item.itemName,
                    staff_id: item.technician!.id,
                    cost: item.price,
                    notes: 'Dịch vụ được thực hiện từ hóa đơn ' + newInvoiceId
                }));
            if (treatmentHistoryToInsert.length > 0) {
                await supabase.from('treatment_history').insert(treatmentHistoryToInsert);
            }
            
            const message = `Bạn vừa hoàn thành hóa đơn ${newInvoiceId} cho ${saleData.customer.name}.`;
            setNotifications(prev => [{
                id: `sale-${newInvoiceId}`,
                type: 'completed_sale',
                message,
                timestamp: new Date(),
                isRead: false,
                link: { view: 'sales' }
            }, ...prev.slice(0, 49)]);
            sendPushNotification([saleData.staff.id], 'Hoàn thành hóa đơn', message);

            await fetchData();
            alert('Tạo hóa đơn thành công!');
            setView({ name: 'sales' });

        } catch (error) {
            console.error("Error creating sale:", error);
            alert(`Đã xảy ra lỗi khi tạo hóa đơn: ${getErrorMessage(error)}`);
        }
    };
    
    const handleAddFeedback = async (feedbackData: Omit<Feedback, 'id' | 'created_at'>) => {
        const { data, error } = await supabase.from('feedback').insert(feedbackData).select().single();
        if (error) {
            console.error('Error adding feedback:', error);
            alert(`Không thể thêm đánh giá: ${getErrorMessage(error)}`);
            return;
        }
        await fetchData();
        alert('Cảm ơn bạn đã đánh giá!');
    };
    
    const handleAddLead = async (leadData: Omit<Lead, 'id' | 'lastContacted' | 'notes' | 'status' | 'avatar'>) => {
        const { error } = await supabase.from('leads').insert({
            name: leadData.name,
            phone: leadData.phone,
            email: leadData.email || null,
            source: leadData.source,
            assigned_to: leadData.assignedTo || null,
            status: 'Mới',
            notes: [],
            avatar: `https://i.pravatar.cc/150?u=${leadData.phone}`
        }).select().single();

        if (error) {
            console.error("Error adding lead:", error);
            alert(`Không thể thêm khách tiềm năng: ${getErrorMessage(error)}`);
            return;
        }

        await fetchData();
        alert('Đã thêm khách tiềm năng thành công.');
    };


    const handleUpdateLead = async (updatedLead: Lead) => {
        const { id, name, phone, email, source, status, assignedTo, lastContacted, notes, avatar } = updatedLead;
        const originalLead = leads.find(l => l.id === updatedLead.id);
        
        const { data, error } = await supabase.from('leads')
            .update({
                name, phone, email, source, status, avatar,
                assigned_to: assignedTo,
                last_contacted: lastContacted ? lastContacted.toISOString() : null,
                notes,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating lead:', error);
            alert(`Không thể cập nhật khách hàng tiềm năng: ${getErrorMessage(error)}`);
            return;
        }

        if (originalLead && originalLead.assignedTo !== data.assigned_to && data.assigned_to) {
            const assignee = staff.find(s => s.id === data.assigned_to);
            if (assignee) {
                const message = `Bạn đã được gán cho khách tiềm năng mới: ${data.name}.`;
                const freshLeadData = {
                     ...data,
                    avatar: data.avatar || `https://i.pravatar.cc/150?u=${data.id}`,
                    assignedTo: data.assigned_to,
                    lastContacted: data.last_contacted ? new Date(data.last_contacted) : null,
                    notes: Array.isArray(data.notes) ? data.notes.map((n: any) => ({ ...n, date: new Date(n.date) })) : [],
                };
                setNotifications(prev => [{
                    id: `lead-assign-${data.id}`,
                    type: 'lead_assigned',
                    message,
                    timestamp: new Date(),
                    isRead: false,
                    link: { view: 'lead-detail', data: freshLeadData }
                }, ...prev.slice(0, 49)]);
                sendPushNotification([assignee.id], 'Khách hàng tiềm năng mới', message);
            }
        }

        const freshLead: Lead = {
            ...data,
            avatar: data.avatar || `https://i.pravatar.cc/150?u=${data.id}`,
            assignedTo: data.assigned_to,
            lastContacted: data.last_contacted ? new Date(data.last_contacted) : null,
            notes: Array.isArray(data.notes) ? data.notes.map((n: any) => ({ ...n, date: new Date(n.date) })) : [],
        };
        
        setLeads(prev => prev.map(l => l.id === freshLead.id ? freshLead : l));
        
        if (view.name === 'lead-detail' && view.data.id === freshLead.id) {
            setView({ name: 'lead-detail', data: freshLead });
        }
    };


    const handleDeleteLead = async (leadId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa khách hàng tiềm năng này? Hành động này không thể hoàn tác.')) {
            const { error } = await supabase.from('leads').delete().eq('id', leadId);
            if (error) {
                console.error('Error deleting lead:', error);
                alert(`Không thể xóa khách hàng tiềm năng: ${getErrorMessage(error)}`);
            } else {
                setLeads(prev => prev.filter(l => l.id !== leadId));
                alert('Đã xóa khách hàng tiềm năng thành công.');
            }
        }
    };
    
    const handleAddLeaveRequest = async (requestData: Omit<LeaveRequest, 'id' | 'status' | 'staffName'>) => {
        const { error } = await supabase.from('leave_requests').insert({
            staff_id: requestData.staffId,
            start_date: requestData.startDate.toISOString().split('T')[0],
            end_date: requestData.endDate.toISOString().split('T')[0],
            reason: requestData.reason,
            status: 'Chờ duyệt'
        });

        if (error) {
            console.error("Error adding leave request:", error);
            alert(`Không thể tạo đơn nghỉ phép: ${getErrorMessage(error)}`);
            return;
        }
        
        const managerIds = staff.filter(s => s.role === 'Quản lý').map(s => s.id);
        const staffMember = staff.find(s => s.id === requestData.staffId);
        if (staffMember) {
            const message = `${staffMember.name} vừa tạo một đơn xin nghỉ phép.`;
            setNotifications(prev => [{
                id: `leave-new-${Date.now()}`,
                type: 'leave_request_new',
                message,
                timestamp: new Date(),
                isRead: false,
                link: { view: 'leave' }
            }, ...prev.slice(0, 49)]);

            if (managerIds.length > 0) {
                sendPushNotification(managerIds, 'Đơn nghỉ phép mới', message);
            }
        }
        await fetchData();
        alert('Đã tạo đơn nghỉ phép thành công.');
    };

    const handleUpdateLeaveRequest = async (requestData: LeaveRequest, managerNotes?: string) => {
        try {
            const { data, error } = await supabase
                .from('leave_requests')
                .update({
                    status: requestData.status,
                    manager_notes: managerNotes || null,
                })
                .eq('id', requestData.id)
                .select();

            if (error) {
                throw error;
            }

            if (!data || data.length === 0) {
                throw new Error('Cập nhật không thành công. Đơn nghỉ phép có thể không tồn tại hoặc bạn không có quyền để sửa đổi nó (Lỗi RLS).');
            }

            await fetchData();
            alert('Đã cập nhật trạng thái đơn nghỉ phép.');
            
            if (requestData.staffId) {
                let message = `Đơn nghỉ phép của bạn từ ngày ${format(requestData.startDate, 'dd/MM/yyyy')} đã được ${requestData.status}.`;
                if (requestData.status === 'Từ chối' && managerNotes) {
                    message += ` Lý do: ${managerNotes}`;
                }
                setNotifications(prev => [{
                    id: `leave-update-${requestData.id}`,
                    type: 'leave_request_update',
                    message,
                    timestamp: new Date(),
                    isRead: false,
                    link: { view: 'leave' }
                }, ...prev.slice(0, 49)]);
                sendPushNotification([requestData.staffId], 'Cập nhật đơn nghỉ phép', message);
            }
        } catch (e) {
            console.error("A critical exception occurred while updating leave request:", e);
            alert(`Không thể cập nhật đơn nghỉ phép:\n${getErrorMessage(e)}`);
        }
    };

    const handleCheckIn = async (staffId: string) => {
        try {
            const { data, error } = await supabase.from('timekeeping').insert({ staff_id: staffId }).select().single();
            if (error) {
                console.error('Error checking in:', error);
                alert(`Không thể vào ca. Lỗi: ${getErrorMessage(error)}`);
            } else {
                await fetchData();
                alert('Đã vào ca thành công!');
            }
        } catch (e) {
             console.error('A critical error occurred during check-in:', e);
             alert(`Đã xảy ra lỗi không mong muốn khi vào ca: ${getErrorMessage(e)}`);
        }
    };
    
    const handleCheckOut = async (recordId: string) => {
        try {
            const checkOutTime = new Date();
            const record = timekeepingRecords.find(r => r.id === recordId);
            if (!record) {
                alert('Không thể tìm thấy ca làm việc đang hoạt động để kết thúc.');
                return;
            }

            const duration = (checkOutTime.getTime() - record.check_in_time.getTime()) / (1000 * 60 * 60);
            
            const { error } = await supabase.from('timekeeping').update({ 
                check_out_time: checkOutTime.toISOString(),
                duration_hours: Number(duration.toFixed(2))
            }).eq('id', recordId).select().single();
            
            if (error) {
                console.error('Error checking out:', error);
                alert(`Không thể kết thúc ca. Lỗi: ${getErrorMessage(error)}`);
            } else {
                await fetchData();
                alert('Đã kết thúc ca!');
            }
        } catch (e) {
             console.error('A critical error occurred during check-out:', e);
             alert(`Đã xảy ra lỗi không mong muốn khi kết thúc ca: ${getErrorMessage(e)}`);
        }
    };
    
    const handleAddTimekeepingRecord = async (record: Omit<TimekeepingRecord, 'id' | 'staffName'>) => {
        let duration = null;
        if (record.check_out_time) {
            duration = (record.check_out_time.getTime() - record.check_in_time.getTime()) / (1000 * 60 * 60);
        }

        const { error } = await supabase.from('timekeeping').insert({
            staff_id: record.staff_id,
            check_in_time: record.check_in_time.toISOString(),
            check_out_time: record.check_out_time ? record.check_out_time.toISOString() : null,
            duration_hours: duration ? Number(duration.toFixed(2)) : null,
            notes: record.notes,
        });

        if (error) {
            alert(`Không thể thêm chấm công: ${getErrorMessage(error)}`);
            return;
        }
        await fetchData();
        alert('Đã thêm chấm công thành công.');
    };

    const handleUpdateTimekeepingRecord = async (record: TimekeepingRecord) => {
        let duration = null;
        if (record.check_out_time) {
            duration = (record.check_out_time.getTime() - record.check_in_time.getTime()) / (1000 * 60 * 60);
        }

        const { error } = await supabase.from('timekeeping').update({
            staff_id: record.staff_id,
            check_in_time: record.check_in_time.toISOString(),
            check_out_time: record.check_out_time ? record.check_out_time.toISOString() : null,
            duration_hours: duration ? Number(duration.toFixed(2)) : null,
            notes: record.notes,
        }).eq('id', record.id);
        
        if (error) {
            alert(`Không thể cập nhật chấm công: ${getErrorMessage(error)}`);
            return;
        }
        await fetchData();
        alert('Đã cập nhật chấm công thành công.');
    };

    const handleDeleteTimekeepingRecord = async (recordId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa mục chấm công này?')) {
            const { error } = await supabase.from('timekeeping').delete().eq('id', recordId);
            if (error) {
                alert(`Không thể xóa chấm công: ${getErrorMessage(error)}`);
                return;
            }
            await fetchData();
            alert('Đã xóa chấm công thành công.');
        }
    };
    
    const handleUpdateCommissionRates = async (rates: CommissionRate[]) => {
        const { error } = await supabase.from('commission_rates').upsert(rates, { onConflict: 'role' });
        if (error) {
            console.error('Error updating commission rates:', error);
            alert(`Không thể cập nhật tỷ lệ hoa hồng: ${getErrorMessage(error)}`);
            return;
        }
        await fetchData();
        alert('Đã cập nhật tỷ lệ hoa hồng thành công.');
    };
    
    const handleUpdateOneSignalSettings = async (settings: OneSignalSettings) => {
        const { error } = await supabase.from('app_settings').update({
            onesignal_app_id: settings.app_id,
            onesignal_rest_api_key: settings.rest_api_key
        }).eq('id', 1);

        if (error) {
            alert(`Không thể cập nhật cài đặt OneSignal: ${getErrorMessage(error)}`);
            return;
        }
        await fetchData();
        alert('Đã cập nhật cài đặt OneSignal thành công.');
    };

    const handleAddExpense = async (expenseData: Omit<Expense, 'id' | 'staffName' | 'status'>) => {
        const { error } = await supabase.from('expenses').insert(expenseData);
        if (error) {
            alert(`Không thể thêm chi phí: ${getErrorMessage(error)}`);
            return;
        }
        
        const managerIds = staff.filter(s => s.role === 'Quản lý').map(s => s.id);
        if (managerIds.length > 0) {
            const recorder = staff.find(s => s.id === expenseData.staff_id)?.name || expenseData.recorder_name;
            const message = `${recorder} vừa tạo khoản chi phí "${expenseData.description}" cần duyệt.`;
            setNotifications(prev => [{
                id: `exp-approve-${Date.now()}`,
                type: 'expense_approval',
                message,
                timestamp: new Date(),
                isRead: false,
                link: { view: 'expenses' }
            }, ...prev.slice(0, 49)]);
            sendPushNotification(managerIds, 'Yêu cầu duyệt chi phí', message);
        }

        await fetchData();
    };

    const handleUpdateExpense = async (expenseData: Expense) => {
        const { id, staffName, ...updateData } = expenseData;
        const originalExpense = expenses.find(e => e.id === expenseData.id);

        const payload = {
            ...updateData,
            expense_date: format(updateData.expense_date, 'yyyy-MM-dd'),
        };

        const { error } = await supabase.from('expenses').update(payload).eq('id', id);
        
        if (error) {
            console.error("Error updating expense:", error);
            alert(`Không thể cập nhật chi phí: ${getErrorMessage(error)}`);
            return;
        }

        if (originalExpense && originalExpense.status !== expenseData.status && expenseData.staff_id) {
            const message = `Chi phí "${expenseData.description}" của bạn đã được ${expenseData.status}.`;
            setNotifications(prev => [{
                id: `exp-status-${expenseData.id}`,
                type: 'expense_status',
                message,
                timestamp: new Date(),
                isRead: false,
                link: { view: 'expenses' }
            }, ...prev.slice(0, 49)]);
            sendPushNotification([expenseData.staff_id], 'Cập nhật trạng thái chi phí', message);
        }

        await fetchData();
    };

    const handleDeleteExpense = async (expenseId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa khoản chi phí này?')) {
            const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
            if (error) {
                alert(`Không thể xóa chi phí: ${getErrorMessage(error)}`);
                return;
            }
            await fetchData();
        }
    };

    const handleUpdateDashboardLayout = async (layout: StaffMember['dashboard_layout']) => {
        if (!currentUser) return;

        const { error } = await supabase
            .from('staff')
            .update({ dashboard_layout: layout })
            .eq('id', currentUser.id);

        if (error) {
            alert(`Không thể lưu tùy chỉnh Bảng điều khiển: ${getErrorMessage(error)}`);
            return;
        }
        
        const updatedUser = { ...currentUser, dashboard_layout: layout };
        setCurrentUser(updatedUser);
        setStaff(prev => prev.map(s => s.id === updatedUser.id ? updatedUser : s));
        alert('Đã lưu tùy chỉnh Bảng điều khiển.');
    };


    const renderView = () => {
        if (!currentUser) return null;
        switch (view.name) {
            case 'dashboard': return <Dashboard sales={sales} appointments={appointments} customers={customers} feedback={feedback} staff={staff} timekeepingRecords={timekeepingRecords} currentUser={currentUser} onUpdateLayout={handleUpdateDashboardLayout} />;
            case 'customers': return <CustomerList customers={customers} onSelectCustomer={(c) => handleNavigate('customer-detail', c)} onAddCustomer={handleAddCustomer} onDeleteCustomer={handleDeleteCustomer} permissions={userPermissions} />;
            case 'customer-detail': return <CustomerDetail customer={view.data} onBack={() => handleNavigate('customers')} onUpdateCustomer={handleUpdateCustomer} appointments={appointments} sales={sales} permissions={userPermissions} />;
            case 'appointments': return <Appointments appointments={appointments} customers={customers} services={services} staff={staff} leads={leads} onAddAppointment={handleAddAppointment} onAddAppointmentForLead={handleAddAppointmentForLead} onUpdateAppointment={handleUpdateAppointment} onAddFeedback={handleAddFeedback} permissions={userPermissions} />;
            case 'staff': return <Staff staff={staff} roles={roles} onAddStaff={handleAddStaff} onUpdateStaff={handleUpdateStaff} permissions={userPermissions} timekeepingRecords={timekeepingRecords} />;
            case 'services': return <Services services={services} onAddService={handleAddService} onUpdateService={handleUpdateService} onDeleteService={handleDeleteService} permissions={userPermissions} />;
            case 'products': return <Products products={products} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} permissions={userPermissions} />;
            case 'sales': return <Sales sales={sales} onNavigateToCreate={() => handleNavigate('create-sale')} permissions={userPermissions} />;
            case 'create-sale': return <CreateSale customers={customers} services={services} products={products} staff={staff} onCreateSale={handleCreateSale} onCancel={() => handleNavigate('sales')} />;
            case 'reports': return <Reports sales={sales} staff={staff} services={services} products={products} customers={customers} expenses={expenses} />;
            case 'commissions': return <Commissions sales={sales} staff={staff} commissionRates={commissionRates} />;
            case 'settings': return <Settings roles={roles} commissionRates={commissionRates} oneSignalSettings={oneSignalSettings} onAddRole={handleAddRole} onUpdateRole={handleUpdateRole} onDeleteRole={handleDeleteRole} onUpdateCommissionRates={handleUpdateCommissionRates} onUpdateOneSignalSettings={handleUpdateOneSignalSettings} />;
            case 'leads': return <Leads leads={leads} staff={staff} onSelectLead={(l) => handleNavigate('lead-detail', l)} onAddLead={handleAddLead} onUpdateLead={handleUpdateLead} onDeleteLead={handleDeleteLead} permissions={userPermissions} />;
            case 'lead-detail': return <LeadDetail lead={view.data} staff={staff} onBack={() => handleNavigate('leads')} onUpdateLead={handleUpdateLead} permissions={userPermissions}/>;
            case 'leave': return <LeaveManagement leaveRequests={leaveRequests} staff={staff} onAddLeaveRequest={handleAddLeaveRequest} onUpdateLeaveRequest={handleUpdateLeaveRequest} currentUser={currentUser} permissions={userPermissions}/>;
            case 'timekeeping': return <Timekeeping timekeepingRecords={timekeepingRecords} staff={staff} currentUser={currentUser} onCheckIn={handleCheckIn} onCheckOut={handleCheckOut} onAddTimekeeping={handleAddTimekeepingRecord} onUpdateTimekeeping={handleUpdateTimekeepingRecord} onDeleteTimekeeping={handleDeleteTimekeepingRecord} permissions={userPermissions} />;
            case 'expenses': return <Expenses expenses={expenses} staff={staff} onAddExpense={handleAddExpense} onUpdateExpense={handleUpdateExpense} onDeleteExpense={handleDeleteExpense} permissions={userPermissions} currentUser={currentUser} />;
            default: return <Dashboard sales={sales} appointments={appointments} customers={customers} feedback={feedback} staff={staff} timekeepingRecords={timekeepingRecords} currentUser={currentUser} onUpdateLayout={handleUpdateDashboardLayout} />;
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Đang tải dữ liệu...</div>;
    }

    if (!session) {
        return <Login />;
    }
    
    if (!currentUser) {
         return <div className="flex items-center justify-center h-screen">Đang tải thông tin người dùng... Vui lòng đảm bảo email đăng nhập của bạn có trong danh sách nhân viên.</div>;
    }

    return (
        <div className="flex h-screen bg-clinic-bg">
            <Sidebar 
                currentView={view.name} 
                onNavigate={handleNavigate} 
                currentUser={currentUser} 
                userPermissions={userPermissions}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    currentUser={currentUser} 
                    onLogout={handleLogout}
                    viewTitle={viewTitles[view.name] || 'ClinicCRM'}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    notifications={notifications}
                    onMarkAsRead={handleMarkNotificationAsRead}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    onNavigate={handleNavigate}
                />
                <div className="flex-1 p-4 sm:p-6 pb-20 overflow-y-auto">
                    {renderView()}
                </div>
            </main>
            <BottomNav
                currentView={view.name}
                onNavigate={handleNavigate}
                userPermissions={userPermissions}
            />
        </div>
    );
};

export default App;