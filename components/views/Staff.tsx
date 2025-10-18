import React, { useState, useMemo } from 'react';
import type { StaffMember, Permission, Role, TimekeepingRecord } from '../../types';
import Card from '../common/Card';
import Modal from '../common/Modal';
import { PencilIcon } from '../icons/Icons';
import { isToday } from 'date-fns';

interface StaffProps {
    staff: StaffMember[];
    roles: Role[];
    onAddStaff: (staffData: Omit<StaffMember, 'id' | 'avatar'>, password: string) => void;
    onUpdateStaff: (staff: StaffMember) => void;
    permissions: Set<Permission>;
    timekeepingRecords: TimekeepingRecord[];
}

const Staff: React.FC<StaffProps> = ({ staff, roles, onAddStaff, onUpdateStaff, permissions, timekeepingRecords }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentStaff, setCurrentStaff] = useState<Omit<StaffMember, 'id' | 'avatar'> | StaffMember | null>(null);
    const [password, setPassword] = useState('');

    const emptyStaffForm = {
        name: '',
        email: '',
        phone: '',
        role: roles.find(r => r.name === 'Lễ tân')?.name || roles[0]?.name || '',
    };

    const staffWithStatus = useMemo(() => {
        return staff.map(member => {
            const isOnline = timekeepingRecords.some(record => 
                record.staff_id === member.id && isToday(record.check_in_time) && !record.check_out_time
            );
            return { ...member, isOnline };
        });
    }, [staff, timekeepingRecords]);

    const handleOpenAddModal = () => {
        setCurrentStaff(emptyStaffForm);
        setPassword('');
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (staffMember: StaffMember) => {
        setCurrentStaff(staffMember);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentStaff(null);
        setPassword('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!currentStaff) return;
        const { name, value } = e.target;
        setCurrentStaff({ ...currentStaff, [name]: value });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentStaff) return;

        if (isEditing) {
            onUpdateStaff(currentStaff as StaffMember);
        } else {
            if (!password) {
                alert('Vui lòng nhập mật khẩu cho nhân viên mới.');
                return;
            }
            onAddStaff(currentStaff as Omit<StaffMember, 'id' | 'avatar'>, password);
        }
        handleCloseModal();
    };

  return (
    <>
    <Card title="Quản lý nhân viên">
        <div className="flex justify-between items-center mb-4">
            <input 
                type="text" 
                placeholder="Tìm kiếm nhân viên..." 
                className="w-1/3 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-clinic-primary"
            />
            {permissions.has('add_staff') && (
                <button onClick={handleOpenAddModal} className="bg-clinic-primary text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors">
                    + Thêm nhân viên
                </button>
            )}
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
                <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên nhân viên</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số điện thoại</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {staffWithStatus.map(member => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img className="h-10 w-10 rounded-full" src={member.avatar} alt={member.name} />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{member.role}</td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{member.phone}</td>
                    <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                            {member.isOnline ? 'Online' : 'Offline'}
                        </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                        {permissions.has('edit_staff') && (
                            <button onClick={() => handleOpenEditModal(member)} className="text-clinic-primary hover:text-indigo-900 flex items-center">
                            <PencilIcon />
                            <span className="ml-1">Chỉnh sửa</span>
                            </button>
                        )}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
    </Card>

    {currentStaff && (
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditing ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Tên nhân viên</label>
                <input type="text" name="name" id="name" value={currentStaff.name} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" name="email" id="email" value={currentStaff.email} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required disabled={isEditing} />
            </div>
             {!isEditing && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                <input type="password" name="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
              </div>
            )}
            <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                <input type="tel" name="phone" id="phone" value={currentStaff.phone} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">Vai trò</label>
                <select name="role" id="role" value={currentStaff.role} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md">
                    {roles.map(role => <option key={role.id} value={role.name}>{role.name}</option>)}
                </select>
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

export default Staff;