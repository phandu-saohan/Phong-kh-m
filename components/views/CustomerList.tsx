import React, { useState } from 'react';
import type { Customer, Permission } from '../../types';
import Card from '../common/Card';
import Modal from '../common/Modal';
// FIX: Correctly import `format` from `date-fns`
import { format } from 'date-fns';
import { TrashIcon } from '../icons/Icons';

interface CustomerListProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onAddCustomer: (customerData: Omit<Customer, 'id' | 'joinDate' | 'lastVisit' | 'totalSpent' | 'avatar' | 'treatmentHistory' | 'feedback'>) => void;
  onDeleteCustomer: (customerId: string) => void;
  permissions: Set<Permission>;
}

const CustomerList: React.FC<CustomerListProps> = ({ customers, onSelectCustomer, onAddCustomer, onDeleteCustomer, permissions }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    tags: [] as string[],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCustomer(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim());
    setNewCustomer(prev => ({...prev, tags}));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCustomer.name && newCustomer.phone) {
      onAddCustomer(newCustomer);
      setIsModalOpen(false);
      setNewCustomer({ name: '', phone: '', email: '', tags: [] });
    }
  };

  return (
    <>
      <Card title="Danh sách khách hàng">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <input 
            type="text" 
            placeholder="Tìm kiếm khách hàng..." 
            className="w-full sm:w-1/3 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-clinic-primary"
          />
          {permissions.has('add_customer') && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto bg-clinic-primary text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors">
              + Thêm khách hàng mới
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên khách hàng</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số điện thoại</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tham gia</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng chi tiêu</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap cursor-pointer" onClick={() => onSelectCustomer(customer)}>
                    <div className="flex items-center">
                      <img className="h-10 w-10 rounded-full" src={customer.avatar} alt={customer.name} />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer" onClick={() => onSelectCustomer(customer)}>{customer.phone}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer" onClick={() => onSelectCustomer(customer)}>{format(customer.joinDate, 'dd/MM/yyyy')}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm font-semibold text-clinic-accent cursor-pointer" onClick={() => onSelectCustomer(customer)}>{customer.totalSpent.toLocaleString('vi-VN')}₫</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => onSelectCustomer(customer)} className="text-clinic-primary hover:text-indigo-900">Xem chi tiết</button>
                        {permissions.has('delete_customer') && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteCustomer(customer.id);
                                }} 
                                className="text-red-500 hover:text-red-700"
                                title="Xóa khách hàng"
                            >
                                <TrashIcon />
                            </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Thêm khách hàng mới">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
              <input type="text" name="name" value={newCustomer.name} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
              <input type="tel" name="phone" value={newCustomer.phone} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" name="email" value={newCustomer.email} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Tags (phân cách bằng dấu phẩy)</label>
              <input type="text" name="tags" value={newCustomer.tags.join(', ')} onChange={handleTagsChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-clinic-primary text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm">Lưu</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Hủy</button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default CustomerList;