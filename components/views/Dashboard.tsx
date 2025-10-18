import React, { useState, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import Card from '../common/Card';
import Modal from '../common/Modal';
import type { Sale, Appointment, Customer, Feedback, StaffMember, TimekeepingRecord } from '../../types';
import { isToday, isThisMonth, subMonths, format, getMonth, getYear, startOfDay, endOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MenuIcon } from '../icons/Icons';

interface DashboardProps {
  sales: Sale[];
  appointments: Appointment[];
  customers: Customer[];
  feedback: Feedback[];
  staff: StaffMember[];
  timekeepingRecords: TimekeepingRecord[];
  currentUser: StaffMember;
  onUpdateLayout: (layout: StaffMember['dashboard_layout']) => void;
}

const WIDGETS_CONFIG = [
  { id: 'todaysRevenue', title: 'Doanh thu hôm nay', type: 'stat' },
  { id: 'todaysAppointments', title: 'Lịch hẹn hôm nay', type: 'stat' },
  { id: 'newCustomersThisMonth', title: 'Khách hàng mới (tháng)', type: 'stat' },
  { id: 'onlineStaff', title: 'Nhân viên Online', type: 'stat' },
  { id: 'satisfactionRate', title: 'Tỷ lệ hài lòng', type: 'stat' },
  { id: 'revenueChart', title: 'Tổng quan doanh thu', type: 'chart' },
  { id: 'serviceChart', title: 'Dịch vụ phổ biến', type: 'chart' },
  { id: 'upcomingAppointments', title: 'Lịch hẹn sắp tới', type: 'list' },
  { id: 'topStaff', title: 'Nhân viên hoạt động tốt', type: 'list' },
];

const DEFAULT_LAYOUT = {
  order: WIDGETS_CONFIG.map(w => w.id),
  visible: WIDGETS_CONFIG.map(w => w.id),
};


const DashboardCustomizationModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    onSave: (layout: StaffMember['dashboard_layout']) => void,
    currentLayout: StaffMember['dashboard_layout']
}> = ({ isOpen, onClose, onSave, currentLayout }) => {
    
    const [order, setOrder] = useState(currentLayout?.order || DEFAULT_LAYOUT.order);
    const [visible, setVisible] = useState(new Set(currentLayout?.visible || DEFAULT_LAYOUT.visible));
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleVisibilityChange = (id: string, isChecked: boolean) => {
        setVisible(prev => {
            const newSet = new Set(prev);
            if (isChecked) {
                newSet.add(id);
            } else {
                newSet.delete(id);
            }
            return newSet;
        });
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        dragItem.current = index;
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        dragOverItem.current = index;
    };
    
    const handleDrop = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        
        const newOrder = [...order];
        const draggedItemContent = newOrder.splice(dragItem.current, 1)[0];
        newOrder.splice(dragOverItem.current, 0, draggedItemContent);
        
        dragItem.current = null;
        dragOverItem.current = null;
        
        setOrder(newOrder);
    };

    const handleSave = () => {
        onSave({ order, visible: Array.from(visible) });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tùy chỉnh Bảng điều khiển">
            <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">Kéo thả để sắp xếp lại thứ tự. Bỏ chọn để ẩn khỏi Bảng điều khiển.</p>
                <div className="space-y-2">
                    {order.map((widgetId, index) => {
                        const widget = WIDGETS_CONFIG.find(w => w.id === widgetId);
                        if (!widget) return null;
                        return (
                            <div 
                                key={widget.id}
                                className="flex items-center p-3 bg-gray-100 rounded-md border"
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnter={(e) => handleDragEnter(e, index)}
                                onDragEnd={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <MenuIcon className="h-5 w-5 text-gray-400 cursor-move mr-3" />
                                <input
                                    type="checkbox"
                                    checked={visible.has(widget.id)}
                                    onChange={(e) => handleVisibilityChange(widget.id, e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-clinic-primary focus:ring-clinic-primary"
                                />
                                <span className="ml-3 text-sm font-medium text-gray-800">{widget.title}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button onClick={handleSave} type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-clinic-primary text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm">Lưu</button>
                <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Hủy</button>
            </div>
        </Modal>
    )
};


const Dashboard: React.FC<DashboardProps> = ({ sales, appointments, customers, feedback, staff, timekeepingRecords, currentUser, onUpdateLayout }) => {
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  
  const userLayout = useMemo(() => (
    (currentUser.dashboard_layout && currentUser.dashboard_layout.order && currentUser.dashboard_layout.visible)
      ? currentUser.dashboard_layout
      : DEFAULT_LAYOUT
  ), [currentUser.dashboard_layout]);


  // --- Data Calculation Memos ---
  const { todaysRevenue, revenueChange } = useMemo(() => {
    const todaysSales = sales.filter(s => isToday(s.date));
    const startOfYesterday = startOfDay(subMonths(new Date(), 1));
    startOfYesterday.setDate(startOfYesterday.getDate() -1);
    const endOfYesterday = endOfDay(subMonths(new Date(), 1));
    endOfYesterday.setDate(endOfYesterday.getDate() - 1);
    const yesterdaySales = sales.filter(s => s.date >= startOfYesterday && s.date <= endOfYesterday);
    const todaysRevenue = todaysSales.reduce((acc, sale) => acc + sale.total, 0);
    const yesterdaysRevenue = yesterdaySales.reduce((acc, sale) => acc + sale.total, 0);
    let revenueChange = 0;
    if (yesterdaysRevenue > 0) revenueChange = ((todaysRevenue - yesterdaysRevenue) / yesterdaysRevenue) * 100;
    else if (todaysRevenue > 0) revenueChange = 100;
    return { todaysRevenue, revenueChange };
  }, [sales]);

  const { todaysAppointmentsCount, pendingAppointmentsCount } = useMemo(() => {
    const todaysAppointments = appointments.filter(apt => isToday(apt.startTime));
    return { todaysAppointmentsCount: todaysAppointments.length, pendingAppointmentsCount: todaysAppointments.filter(apt => apt.status === 'Chờ xác nhận').length };
  }, [appointments]);

  const newCustomersThisMonth = useMemo(() => customers.filter(c => isThisMonth(c.joinDate)).length, [customers]);
  
  const satisfactionRate = useMemo(() => {
    if (!feedback || feedback.length === 0) return { percentage: 0, count: 0 };
    const averageRating = feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;
    return { percentage: (averageRating / 5) * 100, count: feedback.length };
  }, [feedback]);

  const onlineStaffCount = useMemo(() => staff.filter(s => timekeepingRecords.some(r => r.staff_id === s.id && isToday(r.check_in_time) && !r.check_out_time)).length, [staff, timekeepingRecords]);

  const revenueData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));
    const monthlyRevenue = months.map(month => ({ name: format(month, 'MMM', { locale: vi }), DoanhThu: 0, year: getYear(month), month: getMonth(month) }));
    sales.forEach(sale => {
      const saleMonthData = monthlyRevenue.find(m => m.month === getMonth(sale.date) && m.year === getYear(sale.date));
      if (saleMonthData) saleMonthData.DoanhThu += sale.total;
    });
    return monthlyRevenue.map(({ name, DoanhThu }) => ({ name, DoanhThu }));
  }, [sales]);

  const serviceData = useMemo(() => {
    const serviceCount: { [key: string]: number } = {};
    sales.forEach(sale => sale.items.forEach(item => { if (item.type === 'service') serviceCount[item.itemName] = (serviceCount[item.itemName] || 0) + item.quantity; }));
    return Object.entries(serviceCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [sales]);

  const upcomingAppointments = useMemo(() => {
    return appointments.filter(apt => isToday(apt.startTime) && apt.status !== 'Hoàn thành' && apt.status !== 'Đã hủy')
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()).slice(0, 5)
      .map(apt => ({ ...apt, avatar: customers.find(c => c.id === apt.customerId)?.avatar || `https://i.pravatar.cc/150?u=${apt.customerId}` }));
  }, [appointments, customers]);
  
  // --- Widget Component Map ---
  const widgetComponentMap = useMemo(() => ({
    todaysRevenue: (
      <Card key="todaysRevenue">
        <p className="text-sm text-gray-500">Doanh thu hôm nay</p>
        <p className="text-3xl font-bold">{todaysRevenue.toLocaleString('vi-VN')}₫</p>
        <p className={`text-sm mt-1 ${revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>{revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}% so với hôm qua</p>
      </Card>
    ),
    todaysAppointments: (
       <Card key="todaysAppointments">
          <p className="text-sm text-gray-500">Lịch hẹn hôm nay</p>
          <p className="text-3xl font-bold">{todaysAppointmentsCount}</p>
          <p className="text-sm text-gray-500 mt-1">{pendingAppointmentsCount} ca chờ xác nhận</p>
        </Card>
    ),
    newCustomersThisMonth: (
        <Card key="newCustomersThisMonth">
          <p className="text-sm text-gray-500">Khách hàng mới (tháng)</p>
          <p className="text-3xl font-bold">{newCustomersThisMonth}</p>
           <p className="text-sm text-gray-500 mt-1">Trong tháng này</p>
        </Card>
    ),
    onlineStaff: (
         <Card key="onlineStaff">
          <p className="text-sm text-gray-500">Nhân viên Online</p>
          <p className="text-3xl font-bold">{onlineStaffCount}</p>
          <p className="text-sm text-gray-500 mt-1">/ {staff.length} nhân viên</p>
        </Card>
    ),
    satisfactionRate: (
         <Card key="satisfactionRate">
          <p className="text-sm text-gray-500">Tỷ lệ hài lòng</p>
          <p className="text-3xl font-bold">{satisfactionRate.percentage.toFixed(0)}%</p>
          <p className="text-sm text-gray-500 mt-1">Dựa trên {satisfactionRate.count} đánh giá</p>
        </Card>
    ),
    revenueChart: (
        <Card key="revenueChart" title="Tổng quan doanh thu (6 tháng gần nhất)" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis tickFormatter={(v) => new Intl.NumberFormat('vi-VN',{notation:'compact'}).format(v)} /><Tooltip formatter={(v:number) => `${v.toLocaleString('vi-VN')}₫`}/><Legend /><Line type="monotone" dataKey="DoanhThu" stroke="#6366F1" strokeWidth={2} activeDot={{ r: 8 }} /></LineChart>
            </ResponsiveContainer>
        </Card>
    ),
    serviceChart: (
        <Card key="serviceChart" title="Dịch vụ phổ biến">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={serviceData} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} /><Tooltip formatter={(v: number) => `${v} lượt`}/><Bar dataKey="value" name="Số lượt" fill="#EC4899" /></BarChart>
            </ResponsiveContainer>
        </Card>
    ),
    upcomingAppointments: (
        <Card key="upcomingAppointments" title="Lịch hẹn sắp tới">
            {upcomingAppointments.length > 0 ? (
                <div className="space-y-4">{upcomingAppointments.map((apt) => (<div key={apt.id} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg"><div className="flex items-center"><img src={apt.avatar} className="w-10 h-10 rounded-full" alt={apt.customerName} /><div className="ml-3"><p className="font-semibold text-sm">{apt.customerName}</p><p className="text-xs text-gray-500">{apt.service}</p></div></div><span className="text-sm font-medium text-clinic-primary">{format(apt.startTime, 'HH:mm')}</span></div>))}</div>
            ) : <p className="text-gray-500 text-center py-8">Không có lịch hẹn nào sắp tới.</p>}
        </Card>
    ),
    topStaff: (
        <Card key="topStaff" title="Nhân viên hoạt động tốt">
            <p className="text-gray-500 text-center py-8">Tính năng đang được phát triển.</p>
        </Card>
    ),
  }), [sales, appointments, customers, feedback, staff, timekeepingRecords, todaysRevenue, revenueChange, todaysAppointmentsCount, pendingAppointmentsCount, newCustomersThisMonth, onlineStaffCount, satisfactionRate, revenueData, serviceData, upcomingAppointments]);

  // --- Render Logic ---
  const { visibleStats, visibleChartsAndLists } = useMemo(() => {
    const orderedVisibleIds = userLayout.order.filter(id => userLayout.visible.includes(id));
    // FIX: Changed JSX.Element to React.ReactElement to avoid namespace issues.
    const stats: React.ReactElement[] = [];
    // FIX: Changed JSX.Element to React.ReactElement to avoid namespace issues.
    const chartsAndLists: React.ReactElement[] = [];
    
    orderedVisibleIds.forEach(id => {
      const config = WIDGETS_CONFIG.find(w => w.id === id);
      const component = widgetComponentMap[id as keyof typeof widgetComponentMap];
      if (!config || !component) return;

      if(config.type === 'stat') stats.push(component);
      else chartsAndLists.push(component);
    });
    return { visibleStats: stats, visibleChartsAndLists: chartsAndLists };
  }, [userLayout, widgetComponentMap]);


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-clinic-text">Bảng điều khiển</h2>
        <button 
            onClick={() => setIsCustomizeModalOpen(true)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
            Tùy chỉnh
        </button>
      </div>
      
      {visibleStats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
              {visibleStats}
          </div>
      )}
      
      {visibleChartsAndLists.length > 0 && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {visibleChartsAndLists}
          </div>
      )}

      <DashboardCustomizationModal 
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
        onSave={onUpdateLayout}
        currentLayout={userLayout}
      />
    </div>
  );
};

export default Dashboard;
