import React, { useState, useMemo } from 'react';
import type { Customer, Service, Product, StaffMember, SaleItem, Sale } from '../../types';
import Card from '../common/Card';
import { XIcon } from '../icons/Icons';

interface CreateSaleProps {
  customers: Customer[];
  services: Service[];
  products: Product[];
  staff: StaffMember[];
  onCreateSale: (saleData: Omit<Sale, 'id' | 'date'>) => void;
  onCancel: () => void;
}

const CreateSale: React.FC<CreateSaleProps> = ({ customers, services, products, staff, onCreateSale, onCancel }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [items, setItems] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Tiền mặt' | 'Chuyển khoản' | 'Thẻ'>('Tiền mặt');

  const [itemType, setItemType] = useState<'service' | 'product'>('service');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');

  const technicians = useMemo(() => staff.filter(s => s.role === 'Bác sĩ' || s.role === 'Kỹ thuật viên'), [staff]);

  const handleAddItem = () => {
    if (!selectedItemId) return;
    
    let newItem: SaleItem | null = null;
    
    if (itemType === 'service') {
        const service = services.find(s => s.id === selectedItemId);
        if (!service) return;
        const technician = technicians.find(t => t.id === selectedTechnicianId);
        
        newItem = {
            type: 'service',
            itemId: service.id,
            itemName: service.name,
            quantity: 1,
            price: service.price,
            technician: technician ? { id: technician.id, name: technician.name } : undefined
        };
    } else { // product
        const product = products.find(p => p.id === selectedItemId);
        if (!product || quantity <= 0) {
          alert('Số lượng sản phẩm không hợp lệ.');
          return;
        }
        if (quantity > product.stock) {
            alert(`Số lượng tồn kho không đủ. Tồn kho: ${product?.stock}`);
            return;
        }

        newItem = {
            type: 'product',
            itemId: product.id,
            itemName: product.name,
            quantity: quantity,
            price: product.price,
        };
    }

    if (newItem) {
        setItems(prev => [...prev, newItem!]);
        // Reset form
        setSelectedItemId('');
        setQuantity(1);
        setSelectedTechnicianId('');
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalAmount = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [items]);

  const handleSubmit = () => {
    if (!selectedCustomerId || !selectedStaffId || items.length === 0) {
        alert('Vui lòng điền đầy đủ thông tin: khách hàng, nhân viên và ít nhất một sản phẩm/dịch vụ.');
        return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    const salesperson = staff.find(s => s.id === selectedStaffId);

    if (!customer || !salesperson) return;

    const saleData = {
        customer: { id: customer.id, name: customer.name },
        staff: { id: salesperson.id, name: salesperson.name },
        items,
        total: totalAmount,
        paymentMethod,
    };

    onCreateSale(saleData);
  };
  
  const currentSelectionList = itemType === 'service' ? services : products;

  return (
    <div>
        <div className="flex items-center mb-6">
            <button onClick={onCancel} className="text-clinic-primary hover:text-indigo-800 mr-4 font-semibold">
            &larr; Quay lại danh sách
            </button>
            <h2 className="text-3xl font-bold text-clinic-text">Tạo hóa đơn mới</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card title="Thêm dịch vụ / sản phẩm">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Chọn loại</label>
                            <select value={itemType} onChange={e => { setItemType(e.target.value as 'service' | 'product'); setSelectedItemId(''); }} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm rounded-md">
                                <option value="service">Dịch vụ</option>
                                <option value="product">Sản phẩm</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-gray-700">{itemType === 'service' ? 'Tên dịch vụ' : 'Tên sản phẩm'}</label>
                            <select value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm rounded-md">
                                <option value="">-- Chọn --</option>
                                {currentSelectionList.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </select>
                        </div>
                        {itemType === 'product' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Số lượng</label>
                                <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm" />
                            </div>
                        )}
                        {itemType === 'service' && (
                             <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Kỹ thuật viên</label>
                                <select value={selectedTechnicianId} onChange={e => setSelectedTechnicianId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm rounded-md">
                                    <option value="">-- Tùy chọn --</option>
                                    {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                             </div>
                        )}
                        <div>
                             <button onClick={handleAddItem} className="w-full bg-indigo-100 text-indigo-700 px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-200 transition-colors">
                                Thêm
                            </button>
                        </div>
                    </div>
                </Card>
                <Card title="Chi tiết hóa đơn">
                     <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn giá</th>
                                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SL</th>
                                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thành tiền</th>
                                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                                </tr>
                            </thead>
                             <tbody className="divide-y divide-gray-200">
                                {items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="py-3 px-3 whitespace-normal text-sm">
                                            <p className="font-medium text-gray-900">{item.itemName}</p>
                                            {item.type === 'service' && item.technician && <p className="text-xs text-gray-500">KTV: {item.technician.name}</p>}
                                        </td>
                                        <td className="py-3 px-3 whitespace-nowrap text-sm text-gray-500">{item.price.toLocaleString('vi-VN')}₫</td>
                                        <td className="py-3 px-3 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                                        <td className="py-3 px-3 whitespace-nowrap text-sm text-gray-900 font-semibold">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</td>
                                        <td className="py-3 px-3 whitespace-nowrap text-sm font-medium">
                                            <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700">
                                                <XIcon />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-gray-500">Chưa có dịch vụ/sản phẩm nào.</td>
                                    </tr>
                                )}
                             </tbody>
                        </table>
                     </div>
                </Card>
            </div>
            <div className="lg:col-span-1">
                 <Card title="Thông tin & Thanh toán">
                     <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Khách hàng</label>
                            <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm rounded-md" required>
                                <option value="">-- Chọn khách hàng --</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nhân viên bán hàng</label>
                             <select value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm rounded-md" required>
                                <option value="">-- Chọn nhân viên --</option>
                                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="border-t border-gray-200 pt-4">
                            <div className="flex justify-between items-baseline">
                                <span className="text-lg font-semibold text-gray-800">Tổng cộng:</span>
                                <span className="text-2xl font-bold text-clinic-secondary">{totalAmount.toLocaleString('vi-VN')}₫</span>
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Phương thức thanh toán</label>
                             <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm rounded-md">
                                <option>Tiền mặt</option>
                                <option>Chuyển khoản</option>
                                <option>Thẻ</option>
                            </select>
                        </div>
                        <div className="flex space-x-2 pt-4">
                            <button onClick={onCancel} className="flex-1 text-center bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors">
                                Hủy
                            </button>
                            <button onClick={handleSubmit} className="flex-1 text-center bg-clinic-primary text-white px-4 py-3 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors">
                                Tạo hóa đơn
                            </button>
                        </div>
                     </div>
                 </Card>
            </div>
        </div>
    </div>
  );
};

export default CreateSale;
