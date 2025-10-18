import React, { useState, useMemo } from 'react';
import Card from '../common/Card';
import { BarChart, Bar, PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, XAxis, YAxis, LineChart, Line } from 'recharts';
import type { Sale, StaffMember, Service, Product, Customer, Expense } from '../../types';
import { endOfMonth, format, parse, startOfMonth } from 'date-fns';


interface ReportsProps {
  sales: Sale[];
  staff: StaffMember[];
  services: Service[];
  products: Product[];
  customers: Customer[];
  expenses: Expense[];
}

const COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#D946EF'];

const Reports: React.FC<ReportsProps> = ({ sales, staff, services, products, customers, expenses }) => {
  const today = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));

  const { filteredSales, filteredExpenses, filteredCustomers } = useMemo(() => {
    const start = parse(startDate, 'yyyy-MM-dd', new Date());
    const end = parse(endDate, 'yyyy-MM-dd', new Date());
    end.setHours(23, 59, 59, 999);

    const salesInRange = sales.filter(sale => {
      const saleDate = sale.date;
      return saleDate >= start && saleDate <= end;
    });
    
    const expensesInRange = expenses.filter(exp => {
      const expDate = exp.expense_date;
      return exp.status === 'Đã duyệt' && expDate >= start && expDate <= end;
    });

    const customersInRange = customers.filter(c => {
        const joinDate = c.joinDate;
        return joinDate >= start && joinDate <= end;
    });

    return { filteredSales: salesInRange, filteredExpenses: expensesInRange, filteredCustomers: customersInRange };
  }, [sales, expenses, customers, startDate, endDate]);


  const keyMetrics = useMemo(() => {
    const totalRevenue = filteredSales.reduce((acc, sale) => acc + sale.total, 0);
    const totalSales = filteredSales.length;
    const totalExpenses = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);
    const profit = totalRevenue - totalExpenses;
    const newCustomers = filteredCustomers.length;
    
    return { totalRevenue, totalSales, totalExpenses, profit, newCustomers };
  }, [filteredSales, filteredExpenses, filteredCustomers]);

  const revenueSplitData = useMemo(() => {
    let serviceRevenue = 0;
    let productRevenue = 0;
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.type === 'service') {
          serviceRevenue += item.price * item.quantity;
        } else {
          productRevenue += item.price * item.quantity;
        }
      });
    });
    return [
      { name: 'Dịch vụ', value: serviceRevenue },
      { name: 'Sản phẩm', value: productRevenue },
    ].filter(d => d.value > 0);
  }, [filteredSales]);
  
  const expenseByCategoryData = useMemo(() => {
    const categoryMap: { [key: string]: number } = {};
    filteredExpenses.forEach(exp => {
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
    });
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [filteredExpenses]);


  const revenueByStaff = useMemo(() => {
    const staffRevenue: { [key: string]: number } = {};
    filteredSales.forEach(sale => {
        staffRevenue[sale.staff.name] = (staffRevenue[sale.staff.name] || 0) + sale.total;
    });
     return Object.entries(staffRevenue)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
  }, [filteredSales]);


  return (
    <div>
        <h2 className="text-3xl font-bold text-clinic-text mb-6">Báo cáo & Phân tích</h2>
        
        <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                    <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-clinic-primary"/>
                </div>
                <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                    <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-clinic-primary"/>
                </div>
            </div>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 text-center">
            <Card className="py-4">
                <p className="text-sm text-gray-500">Doanh thu</p>
                <p className="text-xl font-bold text-clinic-primary">{keyMetrics.totalRevenue.toLocaleString('vi-VN')}₫</p>
            </Card>
            <Card className="py-4">
                <p className="text-sm text-gray-500">Chi phí</p>
                <p className="text-xl font-bold text-red-500">{keyMetrics.totalExpenses.toLocaleString('vi-VN')}₫</p>
            </Card>
            <Card className="py-4">
                <p className="text-sm text-gray-500">Lợi nhuận</p>
                <p className={`text-xl font-bold ${keyMetrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{keyMetrics.profit.toLocaleString('vi-VN')}₫</p>
            </Card>
             <Card className="py-4">
                <p className="text-sm text-gray-500">Số hóa đơn</p>
                <p className="text-xl font-bold text-clinic-text">{keyMetrics.totalSales}</p>
            </Card>
            <Card className="py-4">
                <p className="text-sm text-gray-500">Khách hàng mới</p>
                <p className="text-xl font-bold text-clinic-text">{keyMetrics.newCustomers}</p>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <Card title="Tỷ trọng Doanh thu">
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={revenueSplitData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {revenueSplitData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value.toLocaleString('vi-VN')}₫`} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </Card>
             <Card title="Phân tích Chi phí">
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={expenseByCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                            {expenseByCategoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value.toLocaleString('vi-VN')}₫`} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </Card>
            <Card title="Hiệu suất bán hàng (Top 10 nhân viên)" className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueByStaff} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <XAxis dataKey="name" tick={{fontSize: 12}}/>
                        <YAxis tickFormatter={(value) => new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(value)}/>
                        <Tooltip formatter={(value: number) => `${value.toLocaleString('vi-VN')}₫`} />
                        <Legend />
                        <Bar dataKey="value" name="Doanh thu" fill="#10B981" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </div>
    </div>
  );
};

export default Reports;