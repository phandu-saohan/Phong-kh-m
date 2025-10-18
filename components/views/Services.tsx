import React, { useState } from 'react';
import type { Service, Permission } from '../../types';
import Card from '../common/Card';
import Modal from '../common/Modal';
import { PencilIcon, TrashIcon } from '../icons/Icons';

interface ServicesProps {
    services: Service[];
    onAddService: (serviceData: Omit<Service, 'id'>) => void;
    onUpdateService: (service: Service) => void;
    onDeleteService: (serviceId: string) => void;
    permissions: Set<Permission>;
}

const Services: React.FC<ServicesProps> = ({ services, onAddService, onUpdateService, onDeleteService, permissions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentService, setCurrentService] = useState<Omit<Service, 'id'> | Service | null>(null);

    const emptyServiceForm = {
        name: '',
        category: '',
        price: 0,
        duration: 0,
        description: '',
    };

    const handleOpenAddModal = () => {
        setCurrentService(emptyServiceForm);
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (service: Service) => {
        setCurrentService(service);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentService(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!currentService) return;
        const { name, value } = e.target;
        const isNumberField = ['price', 'duration'].includes(name);
        setCurrentService({ ...currentService, [name]: isNumberField ? Number(value) : value });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentService) return;

        if (isEditing) {
            onUpdateService(currentService as Service);
        } else {
            onAddService(currentService as Omit<Service, 'id'>);
        }
        handleCloseModal();
    };

  return (
    <>
    <Card title="Quản lý dịch vụ">
        <div className="flex justify-between items-center mb-4">
            <input 
                type="text" 
                placeholder="Tìm kiếm dịch vụ..." 
                className="w-1/3 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-clinic-primary"
            />
            {permissions.has('add_inventory') && (
                <button onClick={handleOpenAddModal} className="bg-clinic-primary text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors">
                    + Thêm dịch vụ mới
                </button>
            )}
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
                <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên dịch vụ</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Danh mục</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời lượng</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {services.map(service => (
                <tr key={service.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.name}</td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{service.category}</td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{service.price.toLocaleString('vi-VN')}₫</td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{service.duration} phút</td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-4">
                            {permissions.has('edit_inventory') && (
                                <button onClick={() => handleOpenEditModal(service)} className="text-clinic-primary hover:text-indigo-900 flex items-center">
                                <PencilIcon />
                                <span className="ml-1">Chỉnh sửa</span>
                                </button>
                            )}
                            {permissions.has('delete_inventory') && (
                                <button 
                                    onClick={() => onDeleteService(service.id)} 
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                    title="Xóa dịch vụ"
                                >
                                    <TrashIcon />
                                    <span className="ml-1">Xóa</span>
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

    {currentService && (
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditing ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Tên dịch vụ</label>
                <input type="text" name="name" id="name" value={currentService.name} onChange={handleInputChange} className="mt-1 block w-full" required />
            </div>
             <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Danh mục</label>
                <input type="text" name="category" id="category" value={currentService.category} onChange={handleInputChange} className="mt-1 block w-full" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">Giá (VND)</label>
                  <input type="number" name="price" id="price" value={currentService.price} onChange={handleInputChange} className="mt-1 block w-full" required />
              </div>
              <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Thời lượng (phút)</label>
                  <input type="number" name="duration" id="duration" value={currentService.duration} onChange={handleInputChange} className="mt-1 block w-full" required />
              </div>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Mô tả</label>
                <textarea name="description" id="description" value={currentService.description || ''} onChange={handleInputChange} rows={3} className="mt-1 block w-full"></textarea>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-clinic-primary text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">Lưu</button>
            <button type="button" onClick={handleCloseModal} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">Hủy</button>
          </div>
        </form>
      </Modal>
    )}

    </>
  );
};

export default Services;
