import React, { useState, useMemo, useEffect } from 'react';
import type { TimekeepingRecord, StaffMember, Permission } from '../../types';
import Card from '../common/Card';
import Modal from '../common/Modal';
import { format, isToday, startOfMonth, endOfMonth, parse, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { PencilIcon, TrashIcon } from '../icons/Icons';

interface TimekeepingProps {
  timekeepingRecords: TimekeepingRecord[];
  staff: StaffMember[];
  currentUser: StaffMember;
  onCheckIn: (staffId: string) => void;
  onCheckOut: (recordId: string) => void;
  onAddTimekeeping: (record: Omit<TimekeepingRecord, 'id' | 'staffName'>) => void;
  onUpdateTimekeeping: (record: TimekeepingRecord) => void;
  onDeleteTimekeeping: (recordId: string) => void;
  permissions: Set<Permission>;
}

// Helper to format date for datetime-local input
const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return '';
    try {
        const d = new Date(date);
        // Adjust for timezone offset to display correctly in the input
        const tzOffset = d.getTimezoneOffset() * 60000;
        const localDate = new Date(d.getTime() - tzOffset);
        return localDate.toISOString().slice(0, 16);
    } catch (e) {
        return '';
    }
};

const Timekeeping: React.FC<TimekeepingProps> = ({ 
    timekeepingRecords, 
    staff, 
    currentUser, 
    onCheckIn, 
    onCheckOut, 
    onAddTimekeeping, 
    onUpdateTimekeeping, 
    onDeleteTimekeeping, 
    permissions 
}) => {
  const today = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
  const [selectedStaffId, setSelectedStaffId] = useState(permissions.has('view_all_timekeeping') ? 'all' : currentUser.id);
  const [activeDateFilter, setActiveDateFilter] = useState<'day' | 'week' | 'month' | 'custom'>('month');


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Partial<TimekeepingRecord> | null>(null);

  const activeCheckIn = useMemo(() => {
    return timekeepingRecords.find(record =>
      record.staff_id === currentUser.id &&
      isToday(record.check_in_time) &&
      !record.check_out_time
    );
  }, [timekeepingRecords, currentUser.id]);

  const filteredRecords = useMemo(() => {
    const start = parse(startDate, 'yyyy-MM-dd', new Date());
    start.setHours(0,0,0,0);
    const end = parse(endDate, 'yyyy-MM-dd', new Date());
    end.setHours(23, 59, 59, 999);

    return timekeepingRecords
      .filter(record => {
        const recordDate = record.check_in_time;
        if (!permissions.has('view_all_timekeeping') && record.staff_id !== currentUser.id) {
            return false;
        }
        const staffMatch = selectedStaffId === 'all' || record.staff_id === selectedStaffId;
        const dateMatch = recordDate >= start && recordDate <= end;
        return staffMatch && dateMatch;
      })
      .sort((a, b) => b.check_in_time.getTime() - a.check_in_time.getTime());
  }, [timekeepingRecords, startDate, endDate, selectedStaffId, permissions, currentUser.id]);
  
  const handleDateFilterClick = (filter: 'day' | 'week' | 'month') => {
      const today = new Date();
      let start, end;
      if (filter === 'day') {
          start = startOfDay(today);
          end = endOfDay(today);
      } else if (filter === 'week') {
          start = startOfWeek(today, { weekStartsOn: 1 });
          end = endOfWeek(today, { weekStartsOn: 1 });
      } else { // month
          start = startOfMonth(today);
          end = endOfMonth(today);
      }
      setStartDate(format(start, 'yyyy-MM-dd'));
      setEndDate(format(end, 'yyyy-MM-dd'));
      setActiveDateFilter(filter);
  };
  
  const handleManualDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      if (name === 'startDate') {
          setStartDate(value);
      } else {
          setEndDate(value);
      }
      setActiveDateFilter('custom');
  };

  const handleCheckInClick = () => {
    if (!activeCheckIn) {
      onCheckIn(currentUser.id);
    }
  };

  const handleCheckOutClick = () => {
    if (activeCheckIn) {
      onCheckOut(activeCheckIn.id);
    }
  };
  
  const formatDuration = (hours: number | undefined) => {
    if (hours === undefined || hours === null) return 'N/A';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h} giờ ${m} phút`;
  }

  const handleOpenAddModal = () => {
    setCurrentRecord({
        staff_id: staff[0]?.id || '',
        check_in_time: new Date(),
        check_out_time: null,
        notes: ''
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: TimekeepingRecord) => {
    setCurrentRecord(record);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentRecord(null);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRecord || !currentRecord.staff_id || !currentRecord.check_in_time) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc.');
        return;
    }
    
    if (currentRecord.check_out_time && currentRecord.check_out_time < currentRecord.check_in_time) {
        alert('Thời gian kết thúc ca phải sau thời gian vào ca.');
        return;
    }

    if (isEditing) {
        onUpdateTimekeeping(currentRecord as TimekeepingRecord);
    } else {
        onAddTimekeeping(currentRecord as Omit<TimekeepingRecord, 'id' | 'staffName'>);
    }
    handleCloseModal();
  };

  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let finalValue: any = value;
    if (name === 'check_in_time' || name === 'check_out_time') {
        finalValue = value ? new Date(value) : null;
    }
    setCurrentRecord(prev => prev ? { ...prev, [name]: finalValue } : null);
  };

  return (
    <>
    <div>
      <h2 className="text-3xl font-bold text-clinic-text mb-6">Chấm công nhân viên</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card title="Thao tác" className="lg:col-span-1">
          <div className="flex flex-col items-center justify-center h-full">
             <p className="text-lg font-medium mb-2">Xin chào, {currentUser.name}!</p>
             <p className="text-gray-500 mb-4">Bây giờ là: <span className="font-bold">{format(new Date(), 'HH:mm, dd/MM/yyyy')}</span></p>
            {activeCheckIn ? (
                <>
                <p className="text-sm text-green-600 mb-4">Bạn đã vào ca lúc: {format(activeCheckIn.check_in_time, 'HH:mm')}</p>
                <button
                    onClick={handleCheckOutClick}
                    className="w-full bg-clinic-secondary text-white py-3 rounded-lg text-lg font-semibold hover:bg-pink-600 transition-colors shadow-lg"
                >
                    Kết thúc ca
                </button>
                </>
            ) : (
                <button
                    onClick={handleCheckInClick}
                    className="w-full bg-clinic-primary text-white py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
                >
                    Vào ca
                </button>
            )}
          </div>
        </Card>
        
        <Card title="Lịch sử chấm công" className="lg:col-span-2">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-grow">
                     <div className="flex items-center border rounded-md bg-gray-100 p-1 mb-4 w-fit">
                        <button onClick={() => handleDateFilterClick('day')} className={`px-3 py-1 text-sm rounded-md ${activeDateFilter === 'day' ? 'bg-white shadow' : 'text-gray-600'}`}>Hôm nay</button>
                        <button onClick={() => handleDateFilterClick('week')} className={`px-3 py-1 text-sm rounded-md ${activeDateFilter === 'week' ? 'bg-white shadow' : 'text-gray-600'}`}>Tuần này</button>
                        <button onClick={() => handleDateFilterClick('month')} className={`px-3 py-1 text-sm rounded-md ${activeDateFilter === 'month' ? 'bg-white shadow' : 'text-gray-600'}`}>Tháng này</button>
                    </div>
                     {permissions.has('view_all_timekeeping') ? (
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
                            <div>
                                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                                <input type="date" id="start-date" name="startDate" value={startDate} onChange={handleManualDateChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"/>
                            </div>
                            <div>
                                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                                <input type="date" id="end-date" name="endDate" value={endDate} onChange={handleManualDateChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"/>
                            </div>
                            <div>
                                <label htmlFor="staff-select" className="block text-sm font-medium text-gray-700 mb-1">Nhân viên</label>
                                <select id="staff-select" value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                                    <option value="all">Tất cả nhân viên</option>
                                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border">
                            <div>
                                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                                <input type="date" id="start-date" name="startDate" value={startDate} onChange={handleManualDateChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"/>
                            </div>
                            <div>
                                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                                <input type="date" id="end-date" name="endDate" value={endDate} onChange={handleManualDateChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"/>
                            </div>
                        </div>
                    )}
                </div>
                {permissions.has('view_all_timekeeping') && (
                    <button onClick={handleOpenAddModal} className="ml-4 flex-shrink-0 bg-clinic-primary text-white px-3 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors">
                        + Thêm chấm công
                    </button>
                )}
            </div>

            <div className="overflow-x-auto max-h-[60vh]">
                <table className="min-w-full bg-white">
                    <thead className="bg-gray-50 sticky top-0">
                    <tr>
                        {permissions.has('view_all_timekeeping') && <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Nhân viên</th>}
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Vào ca</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Kết thúc ca</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Tổng thời gian</th>
                         {permissions.has('view_all_timekeeping') && <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {filteredRecords.map(record => (
                        <tr key={record.id}>
                            {permissions.has('view_all_timekeeping') && <td className="py-4 px-4 text-sm font-medium text-gray-900">{record.staffName}</td>}
                            <td className="py-4 px-4 text-sm text-gray-500">{format(record.check_in_time, 'dd/MM/yyyy')}</td>
                            <td className="py-4 px-4 text-sm text-gray-500">{format(record.check_in_time, 'HH:mm:ss')}</td>
                            <td className="py-4 px-4 text-sm text-gray-500">{record.check_out_time ? format(record.check_out_time, 'HH:mm:ss') : 'Đang trong ca'}</td>
                            <td className="py-4 px-4 text-sm font-semibold text-clinic-primary">{formatDuration(record.duration_hours)}</td>
                            {permissions.has('view_all_timekeeping') && (
                                <td className="py-4 px-4 text-sm">
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => handleOpenEditModal(record)} className="text-gray-500 hover:text-clinic-primary"><PencilIcon /></button>
                                        <button onClick={() => onDeleteTimekeeping(record.id)} className="text-gray-500 hover:text-red-500"><TrashIcon /></button>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                    {filteredRecords.length === 0 && (
                        <tr>
                            <td colSpan={permissions.has('view_all_timekeeping') ? 6 : 4} className="text-center py-8 text-gray-500">
                                Không có dữ liệu chấm công.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </Card>
      </div>
    </div>

    {isModalOpen && currentRecord && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditing ? 'Chỉnh sửa chấm công' : 'Thêm chấm công'}>
            <form onSubmit={handleModalSubmit}>
                <div className="p-6 space-y-4">
                    {permissions.has('view_all_timekeeping') && (
                        <div>
                            <label htmlFor="staff_id" className="block text-sm font-medium text-gray-700">Nhân viên</label>
                            <select id="staff_id" name="staff_id" value={currentRecord.staff_id} onChange={handleModalChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required>
                                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label htmlFor="check_in_time" className="block text-sm font-medium text-gray-700">Thời gian vào ca</label>
                        <input type="datetime-local" id="check_in_time" name="check_in_time" value={formatDateForInput(currentRecord.check_in_time)} onChange={handleModalChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                    </div>
                     <div>
                        <label htmlFor="check_out_time" className="block text-sm font-medium text-gray-700">Thời gian kết thúc ca</label>
                        <input type="datetime-local" id="check_out_time" name="check_out_time" value={formatDateForInput(currentRecord.check_out_time)} onChange={handleModalChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                     <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Ghi chú</label>
                        <textarea id="notes" name="notes" value={currentRecord.notes || ''} onChange={handleModalChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
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

export default Timekeeping;