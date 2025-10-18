import React, { useState, useMemo } from 'react';
import type { Sale, StaffMember, CommissionRate } from '../../types';
import Card from '../common/Card';
// FIX: Use named imports for `date-fns` functions where possible, and deep imports for functions not available on the root export.
import { endOfMonth, format } from 'date-fns';
import parse from 'date-fns/parse';
import startOfMonth from 'date-fns/startOfMonth';

interface CommissionsProps {
  sales: Sale[];
  staff: StaffMember[];
  commissionRates: CommissionRate[];
}

interface CommissionData {
    staffId: string;
    staffName: string;
    role: string;
    salesRevenue: number; // Revenue from total bills
    serviceRevenue: number; // Revenue from services performed
    commission: number;
}

const Commissions: React.FC<CommissionsProps> = ({ sales, staff, commissionRates }) => {
  const today = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
  const [selectedStaffId, setSelectedStaffId] = useState('all');

  const commissionData = useMemo(() => {
    const start = parse(startDate, 'yyyy-MM-dd', new Date());
    const end = parse(endDate, 'yyyy-MM-dd', new Date());
    end.setHours(23, 59, 59, 999); // Include the whole end day
    
    const ratesMap = commissionRates.reduce((acc, rate) => {
        acc[rate.role] = { sales_rate: rate.sales_rate, service_rate: rate.service_rate };
        return acc;
    }, {} as Record<string, { sales_rate: number; service_rate: number; }>);


    const filteredSales = sales.filter(sale => {
      const saleDate = sale.date;
      if (!saleDate || isNaN(saleDate.getTime())) return false;
      return saleDate >= start && saleDate <= end;
    });

    const commissions: Record<string, CommissionData> = {};

    staff.forEach(s => {
        commissions[s.id] = {
            staffId: s.id,
            staffName: s.name,
            role: s.role,
            salesRevenue: 0,
            serviceRevenue: 0,
            commission: 0,
        };
    });

    filteredSales.forEach(sale => {
        const saleStaffMember = staff.find(s => s.id === sale.staff.id);
        if (saleStaffMember) {
            const salesperson = commissions[saleStaffMember.id];
            if (salesperson) {
                const saleCommissionRate = ratesMap[saleStaffMember.role]?.sales_rate || 0;
                salesperson.salesRevenue += sale.total;
                salesperson.commission += sale.total * saleCommissionRate;
            }
        }
        
        sale.items.forEach(item => {
            if (item.type === 'service' && item.technician) {
                const techStaffMember = staff.find(s => s.id === item.technician!.id);
                 if (techStaffMember) {
                    const technician = commissions[techStaffMember.id];
                     if (technician) {
                        const serviceCommissionRate = ratesMap[techStaffMember.role]?.service_rate || 0;
                        const serviceValue = item.price * item.quantity;
                        technician.serviceRevenue += serviceValue;
                        technician.commission += serviceValue * serviceCommissionRate;
                    }
                 }
            }
        });
    });
    
    let result = Object.values(commissions).filter(data => data.commission > 0);

    if (selectedStaffId !== 'all') {
        result = result.filter(data => data.staffId === selectedStaffId);
    }

    return result.sort((a,b) => b.commission - a.commission);

  }, [sales, staff, startDate, endDate, selectedStaffId, commissionRates]);

  const totalCommission = useMemo(() => commissionData.reduce((sum, item) => sum + item.commission, 0), [commissionData]);
  const totalRevenue = useMemo(() => commissionData.reduce((sum, item) => sum + item.salesRevenue + item.serviceRevenue, 0), [commissionData]);

  return (
    <div>
      <h2 className="text-3xl font-bold text-clinic-text mb-6">Quản lý hoa hồng</h2>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
            <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-clinic-primary"/>
            </div>
            <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-clinic-primary"/>
            </div>
            <div>
                <label htmlFor="staff-select" className="block text-sm font-medium text-gray-700 mb-1">Nhân viên</label>
                <select id="staff-select" value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-clinic-primary">
                    <option value="all">Tất cả nhân viên</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Tổng doanh thu trong kỳ</p>
                <p className="text-2xl font-bold text-clinic-primary">{totalRevenue.toLocaleString('vi-VN')}₫</p>
            </div>
             <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Tổng hoa hồng phải trả</p>
                <p className="text-2xl font-bold text-clinic-accent">{totalCommission.toLocaleString('vi-VN')}₫</p>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhân viên</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu bán hàng</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu dịch vụ</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiền hoa hồng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {commissionData.map(item => (
                <tr key={item.staffId}>
                  <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.staffName}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{item.role}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{item.salesRevenue > 0 ? `${item.salesRevenue.toLocaleString('vi-VN')}₫` : '-'}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{item.serviceRevenue > 0 ? `${item.serviceRevenue.toLocaleString('vi-VN')}₫` : '-'}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm font-semibold text-green-600">{item.commission.toLocaleString('vi-VN')}₫</td>
                </tr>
              ))}
               {commissionData.length === 0 && (
                <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">Không có dữ liệu hoa hồng cho kỳ và nhân viên đã chọn.</td>
                </tr>
               )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Commissions;