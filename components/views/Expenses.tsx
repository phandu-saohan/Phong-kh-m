import React, { useState, useMemo } from 'react';
import type { Expense, StaffMember, Permission, ExpenseStatus } from '../../types';
import Card from '../common/Card';
import Modal from '../common/Modal';
import { format, parse, startOfMonth, endOfMonth } from 'date-fns';
import { PencilIcon, TrashIcon, CheckIcon, XIcon } from '../icons/Icons';

interface ExpensesProps {
    expenses: Expense[];
    staff: StaffMember[];
    onAddExpense: (expenseData: Omit<Expense, 'id' | 'staffName' | 'status'>) => void;
    onUpdateExpense: (expense: Expense) => void;
    onDeleteExpense: (expenseId: string) => void;
    permissions: Set<Permission>;
    currentUser: StaffMember;
}

const expenseCategories = [
    'Marketing & Quảng cáo',
    'Vật tư & Thiết bị',
    'Thuê mặt bằng',
    'Lương nhân viên',
    'Tiện ích (Điện, nước, internet)',
    'Sửa chữa & Bảo trì',
    'Đào tạo & Phát triển',
    'Chi phí hành chính',
    'Khác',
];

const getStatusClass = (status: ExpenseStatus) => {
  switch (status) {
    case 'Chờ duyệt': return 'bg-yellow-100 text-yellow-800';
    case 'Đã duyệt': return 'bg-green-100 text-green-800';
    case 'Từ chối': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};


const Expenses: React.FC<ExpensesProps> = ({ expenses, staff, onAddExpense, onUpdateExpense, onDeleteExpense, permissions, currentUser }) => {
    const today = new Date();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentExpense, setCurrentExpense] = useState<Partial<Expense> | null>(null);
    const [recorderType, setRecorderType] = useState<'staff' | 'other'>('staff');


    const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
    const [selectedStaffId, setSelectedStaffId] = useState('all');

    const emptyExpenseForm = {
        expense_date: new Date(),
        category: expenseCategories[0],
        description: '',
        amount: 0,
        staff_id: currentUser.id,
        recorder_name: '',
    };
    
    const { pendingExpenses, filteredExpenses } = useMemo(() => {
        const start = parse(startDate, 'yyyy-MM-dd', new Date());
        start.setHours(0,0,0,0);
        const end = parse(endDate, 'yyyy-MM-dd', new Date());
        end.setHours(23, 59, 59, 999);

        const pending: Expense[] = [];
        const filtered: Expense[] = [];

        expenses.forEach(exp => {
             // Populate pending list for managers
            if (exp.status === 'Chờ duyệt') {
                pending.push(exp);
            }

            // Populate main history list based on filters
            const expDate = exp.expense_date;
            const staffMatch = selectedStaffId === 'all' || exp.staff_id === selectedStaffId;
            const dateMatch = expDate >= start && expDate <= end;
            if (staffMatch && dateMatch) {
                filtered.push(exp);
            }
        });

        return { 
            pendingExpenses: pending.sort((a,b) => a.expense_date.getTime() - b.expense_date.getTime()), 
            filteredExpenses: filtered.sort((a,b) => b.expense_date.getTime() - a.expense_date.getTime())
        };
    }, [expenses, startDate, endDate, selectedStaffId]);

    const handleOpenAddModal = () => {
        setCurrentExpense(emptyExpenseForm);
        setRecorderType('staff');
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (expense: Expense) => {
        setCurrentExpense(expense);
        setRecorderType(expense.staff_id ? 'staff' : 'other');
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentExpense(null);
    };
    
    const handleStatusUpdate = (expense: Expense, newStatus: ExpenseStatus) => {
        if(window.confirm(`Bạn có chắc muốn ${newStatus === 'Đã duyệt' ? 'DUYỆT' : 'TỪ CHỐI'} khoản chi phí này?`)) {
            onUpdateExpense({ ...expense, status: newStatus });
        }
    };


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!currentExpense) return;
        const { name, value } = e.target;
        
        let processedValue: string | number | Date | null = value;
        if (name === 'amount') {
            processedValue = Number(value);
        } else if (name === 'expense_date') {
            processedValue = parse(value, 'yyyy-MM-dd', new Date());
        }

        setCurrentExpense({ ...currentExpense, [name]: processedValue });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentExpense || !currentExpense.category || !currentExpense.amount) return;
        
        const payload: Omit<Expense, 'id' | 'staffName' | 'status'> = {
            expense_date: currentExpense.expense_date!,
            category: currentExpense.category!,
            description: currentExpense.description!,
            amount: currentExpense.amount!,
            staff_id: recorderType === 'staff' ? currentExpense.staff_id! : null,
            recorder_name: recorderType === 'other' ? currentExpense.recorder_name : undefined,
        };

        if (isEditing) {
            onUpdateExpense({ ...(currentExpense as Expense), ...payload });
        } else {
            onAddExpense(payload);
        }
        handleCloseModal();
    };

    const totalExpenses = useMemo(() => 
        filteredExpenses
            .filter(exp => exp.status === 'Đã duyệt') // Only sum approved expenses
            .reduce((sum, exp) => sum + exp.amount, 0),
    [filteredExpenses]);

    const PendingApprovalCard = () => (
        currentUser.role === 'Quản lý' && pendingExpenses.length > 0 ? (
            <Card title={`Chi phí cần duyệt (${pendingExpenses.length})`} className="mb-6 border-yellow-400 border-2">
                 <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead className="bg-yellow-50">
                            <tr>
                                <th className="py-2 px-3 text-left text-xs font-medium text-yellow-800 uppercase">Ngày</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-yellow-800 uppercase">Mô tả</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-yellow-800 uppercase">Người ghi nhận</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-yellow-800 uppercase">Số tiền</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-yellow-800 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-yellow-200">
                            {pendingExpenses.map(expense => (
                                <tr key={expense.id}>
                                    <td className="py-3 px-3 text-sm text-gray-600">{format(expense.expense_date, 'dd/MM/yyyy')}</td>
                                    <td className="py-3 px-3 text-sm text-gray-800 font-medium">{expense.description}</td>
                                    <td className="py-3 px-3 text-sm text-gray-600">{expense.staffName}</td>
                                    <td className="py-3 px-3 text-sm font-semibold text-red-600">{expense.amount.toLocaleString('vi-VN')}₫</td>
                                    <td className="py-3 px-3 text-sm">
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => handleStatusUpdate(expense, 'Đã duyệt')} className="flex items-center px-3 py-1 bg-green-500 text-white rounded-md text-xs font-semibold hover:bg-green-600" title="Duyệt">
                                                <CheckIcon className="h-4 w-4 mr-1"/> Duyệt
                                            </button>
                                            <button onClick={() => handleStatusUpdate(expense, 'Từ chối')} className="flex items-center px-3 py-1 bg-red-500 text-white rounded-md text-xs font-semibold hover:bg-red-600" title="Từ chối">
                                                <XIcon className="h-4 w-4 mr-1"/> Từ chối
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </Card>
        ) : null
    );

    return (
        <>
            <h2 className="text-3xl font-bold text-clinic-text mb-6">Quản lý chi phí</h2>

            <PendingApprovalCard />

            <Card>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-auto">
                        <div>
                            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                            <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"/>
                        </div>
                        <div>
                            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                            <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"/>
                        </div>
                        <div>
                            <label htmlFor="staff-select" className="block text-sm font-medium text-gray-700 mb-1">Người ghi nhận</label>
                            <select id="staff-select" value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                                <option value="all">Tất cả</option>
                                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                     {permissions.has('manage_expenses') && (
                        <button onClick={handleOpenAddModal} className="w-full md:w-auto bg-clinic-primary text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors">
                            + Thêm chi phí
                        </button>
                    )}
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg mb-6">
                    <p className="text-sm text-gray-500">Tổng chi phí đã duyệt trong kỳ</p>
                    <p className="text-2xl font-bold text-clinic-primary">{totalExpenses.toLocaleString('vi-VN')}₫</p>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <caption className="text-lg font-semibold text-left p-4 bg-gray-50">Lịch sử chi phí</caption>
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Người ghi nhận</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredExpenses.map(expense => {
                                const canEdit = currentUser.role === 'Quản lý' || (expense.staff_id === currentUser.id && expense.status === 'Chờ duyệt');
                                return (
                                <tr key={expense.id}>
                                    <td className="py-4 px-4 text-sm text-gray-500">{format(expense.expense_date, 'dd/MM/yyyy')}</td>
                                    <td className="py-4 px-4 text-sm text-gray-900">{expense.category}</td>
                                    <td className="py-4 px-4 text-sm text-gray-500">{expense.staffName}</td>
                                    <td className="py-4 px-4 text-sm font-semibold text-red-600">{expense.amount.toLocaleString('vi-VN')}₫</td>
                                    <td className="py-4 px-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(expense.status)}`}>
                                            {expense.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-sm">
                                        <div className="flex items-center space-x-2">
                                            {canEdit && <button onClick={() => handleOpenEditModal(expense)} className="text-gray-500 hover:text-clinic-primary" title="Sửa"><PencilIcon /></button>}
                                            {canEdit && <button onClick={() => onDeleteExpense(expense.id)} className="text-gray-500 hover:text-red-500" title="Xóa"><TrashIcon /></button>}
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                     {filteredExpenses.length === 0 && <p className="text-center text-gray-500 py-6">Không có dữ liệu chi phí cho bộ lọc này.</p>}
                </div>
            </Card>

            {currentExpense && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditing ? 'Chỉnh sửa chi phí' : 'Thêm chi phí mới'}>
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-4">
                             <div>
                                <label className="block text-sm font-medium">Người ghi nhận</label>
                                <div className="mt-2 flex rounded-md shadow-sm">
                                    <button type="button" onClick={() => setRecorderType('staff')} className={`px-4 py-2 border rounded-l-md text-sm ${recorderType === 'staff' ? 'bg-clinic-primary text-white border-clinic-primary' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Nhân viên</button>
                                    <button type="button" onClick={() => setRecorderType('other')} className={`px-4 py-2 border-t border-b border-r rounded-r-md text-sm -ml-px ${recorderType === 'other' ? 'bg-clinic-primary text-white border-clinic-primary' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Người khác</button>
                                </div>
                            </div>
                            {recorderType === 'staff' ? (
                                <div>
                                    <label htmlFor="staff_id" className="block text-sm font-medium">Chọn nhân viên</label>
                                    <select name="staff_id" id="staff_id" value={currentExpense.staff_id || ''} onChange={handleInputChange} className="mt-1 block w-full" required>
                                        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            ) : (
                                 <div>
                                    <label htmlFor="recorder_name" className="block text-sm font-medium">Tên người ghi nhận</label>
                                    <input type="text" name="recorder_name" id="recorder_name" value={currentExpense.recorder_name || ''} onChange={handleInputChange} className="mt-1 block w-full" required />
                                </div>
                            )}
                            <div>
                                <label htmlFor="expense_date" className="block text-sm font-medium">Ngày chi</label>
                                <input type="date" name="expense_date" id="expense_date" value={format(currentExpense.expense_date || new Date(), 'yyyy-MM-dd')} onChange={handleInputChange} className="mt-1 block w-full" required />
                            </div>
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium">Danh mục</label>
                                <select name="category" id="category" value={currentExpense.category} onChange={handleInputChange} className="mt-1 block w-full" required>
                                    {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="amount" className="block text-sm font-medium">Số tiền (VND)</label>
                                <input type="number" name="amount" id="amount" value={currentExpense.amount} onChange={handleInputChange} className="mt-1 block w-full" required min="0" />
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium">Mô tả</label>
                                <textarea name="description" id="description" value={currentExpense.description} onChange={handleInputChange} rows={3} className="mt-1 block w-full" required></textarea>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-clinic-primary text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm">Lưu</button>
                            <button type="button" onClick={handleCloseModal} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Hủy</button>
                        </div>
                    </form>
                </Modal>
            )}
        </>
    );
};

export default Expenses;