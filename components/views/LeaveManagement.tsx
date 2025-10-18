import React, { useState, useMemo } from 'react';
import type { LeaveRequest, StaffMember, LeaveRequestStatus, Permission } from '../../types';
import Card from '../common/Card';
import Modal from '../common/Modal';
// FIX: Correctly import `format` from `date-fns`
import { format } from 'date-fns';
import { CheckIcon, XIcon } from '../icons/Icons';

interface LeaveManagementProps {
  leaveRequests: LeaveRequest[];
  staff: StaffMember[];
  onAddLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'status' | 'staffName'>) => void;
  onUpdateLeaveRequest: (request: LeaveRequest, managerNotes?: string) => void;
  currentUser: StaffMember;
  permissions: Set<Permission>;
}

const getStatusClass = (status: LeaveRequestStatus) => {
  switch (status) {
    case 'Chờ duyệt': return 'bg-yellow-100 text-yellow-800';
    case 'Đã duyệt': return 'bg-green-100 text-green-800';
    case 'Từ chối': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const LeaveManagement: React.FC<LeaveManagementProps> = ({ leaveRequests, staff, onAddLeaveRequest, onUpdateLeaveRequest, currentUser, permissions }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({ staffId: 'all', status: 'all' });
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const defaultNewRequest = {
    staffId: currentUser.id, // Default to current user
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
  };
  const [newRequest, setNewRequest] = useState(defaultNewRequest);

  const filteredRequests = useMemo(() => {
    return leaveRequests.filter(req => {
      // If user is not a manager, they can only see their own requests
      if (!permissions.has('view_all_leave')) {
        return req.staffId === currentUser.id;
      }
      const staffMatch = filters.staffId === 'all' || req.staffId === filters.staffId;
      const statusMatch = filters.status === 'all' || req.status === filters.status;
      return staffMatch && statusMatch;
    });
  }, [leaveRequests, filters, currentUser, permissions]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setNewRequest(prev => ({ ...prev, [name]: value }));
  };
  
  const handleApprove = (request: LeaveRequest) => {
      onUpdateLeaveRequest({ ...request, status: 'Đã duyệt' });
  };

  const handleOpenRejectionModal = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setRejectionReason(''); // Reset reason
    setIsRejectionModalOpen(true);
  };

  const handleConfirmRejection = () => {
    if (selectedRequest) {
        onUpdateLeaveRequest({ ...selectedRequest, status: 'Từ chối' }, rejectionReason);
        setIsRejectionModalOpen(false);
        setSelectedRequest(null);
    }
  };

  
  const handleSubmitNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.staffId || !newRequest.startDate || !newRequest.endDate) {
        alert("Vui lòng điền đầy đủ thông tin.");
        return;
    }
    onAddLeaveRequest({
        staffId: newRequest.staffId,
        startDate: new Date(newRequest.startDate),
        endDate: new Date(newRequest.endDate),
        reason: newRequest.reason,
    });
    setIsModalOpen(false);
    setNewRequest(defaultNewRequest);
  };
  
  return (
    <>
      <Card title="Quản lý nghỉ phép">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            {permissions.has('view_all_leave') && (
                <div>
                    <label htmlFor="staffId-filter" className="text-sm font-medium text-gray-700">Nhân viên</label>
                    <select id="staffId-filter" name="staffId" value={filters.staffId} onChange={handleFilterChange} className="ml-2 w-48 px-3 py-2 border border-gray-300 rounded-md text-sm">
                        <option value="all">Tất cả</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            )}
             <div>
              <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Trạng thái</label>
              <select id="status-filter" name="status" value={filters.status} onChange={handleFilterChange} className="ml-2 w-48 px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="all">Tất cả</option>
                <option value="Chờ duyệt">Chờ duyệt</option>
                <option value="Đã duyệt">Đã duyệt</option>
                <option value="Từ chối">Từ chối</option>
              </select>
            </div>
          </div>
          {permissions.has('request_leave') && (
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-clinic-primary text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors">
                + Tạo đơn nghỉ phép
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhân viên</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày bắt đầu</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày kết thúc</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lý do</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.map(req => (
                <tr key={req.id}>
                  <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.staffName}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{format(req.startDate, 'dd/MM/yyyy')}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{format(req.endDate, 'dd/MM/yyyy')}</td>
                  <td className="py-4 px-4 whitespace-normal text-sm text-gray-500 max-w-xs">
                    <p>{req.reason}</p>
                    {req.manager_notes && (
                        <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-300 text-red-700 text-xs">
                            <p className="font-semibold">Phản hồi của quản lý:</p>
                            <p>{req.manager_notes}</p>
                        </div>
                    )}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(req.status)}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                    {req.status === 'Chờ duyệt' && permissions.has('approve_leave') && (
                      <div className="flex space-x-2">
                        <button onClick={() => handleApprove(req)} className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-100" title="Duyệt">
                          <CheckIcon />
                        </button>
                        <button onClick={() => handleOpenRejectionModal(req)} className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100" title="Từ chối">
                          <XIcon />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tạo đơn nghỉ phép mới">
        <form onSubmit={handleSubmitNewRequest}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="staffId" className="block text-sm font-medium text-gray-700">Nhân viên</label>
              <select 
                id="staffId" 
                name="staffId" 
                value={newRequest.staffId} 
                onChange={handleInputChange} 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-200" 
                required
                disabled={!permissions.has('view_all_leave')}
              >
                {permissions.has('view_all_leave') ? (
                    <>
                        <option value="">-- Chọn nhân viên --</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </>
                ) : (
                    <option value={currentUser.id}>{currentUser.name}</option>
                )}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Ngày bắt đầu</label>
                <input type="date" name="startDate" id="startDate" value={newRequest.startDate} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Ngày kết thúc</label>
                <input type="date" name="endDate" id="endDate" value={newRequest.endDate} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
              </div>
            </div>
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Lý do</label>
              <textarea name="reason" id="reason" value={newRequest.reason} onChange={handleInputChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-clinic-primary text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm">Tạo đơn</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Hủy</button>
          </div>
        </form>
      </Modal>

      {isRejectionModalOpen && selectedRequest && (
          <Modal isOpen={isRejectionModalOpen} onClose={() => setIsRejectionModalOpen(false)} title={`Từ chối đơn của ${selectedRequest.staffName}`}>
              <div className="p-6 space-y-4">
                  <div>
                      <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700">Lý do từ chối (bắt buộc)</label>
                      <textarea 
                          id="rejectionReason"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={4}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Nhập lý do tại sao đơn nghỉ phép bị từ chối..."
                      />
                  </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button 
                      type="button" 
                      onClick={handleConfirmRejection} 
                      disabled={!rejectionReason.trim()}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 disabled:bg-red-300 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                      Xác nhận từ chối
                  </button>
                  <button type="button" onClick={() => setIsRejectionModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">
                      Hủy
                  </button>
              </div>
          </Modal>
      )}
    </>
  );
};

export default LeaveManagement;