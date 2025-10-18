import React, { useState, useMemo } from 'react';
import type { Lead, StaffMember, Permission } from '../../types';
import Card from '../common/Card';
import Modal from '../common/Modal';
// FIX: Correctly import `format` from `date-fns`
import { format } from 'date-fns';
import { TrashIcon } from '../icons/Icons';

interface LeadsProps {
  leads: Lead[];
  staff: StaffMember[];
  onSelectLead: (lead: Lead) => void;
  onAddLead: (leadData: Omit<Lead, 'id' | 'lastContacted' | 'notes' | 'status' | 'avatar'>) => void;
  onUpdateLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  permissions: Set<Permission>;
}

const getStatusClass = (status: Lead['status']) => {
  switch (status) {
    case 'Mới': return 'bg-gray-200 text-gray-800';
    case 'Đang tư vấn': return 'bg-blue-100 text-blue-800';
    case 'Tiềm năng': return 'bg-yellow-100 text-yellow-800';
    case 'Chốt thành công': return 'bg-green-100 text-green-800';
    case 'Thất bại': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const Leads: React.FC<LeadsProps> = ({ leads, staff, onSelectLead, onAddLead, onUpdateLead, onDeleteLead, permissions }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'Facebook' as Lead['source'],
    assignedTo: '',
  });

  const [filters, setFilters] = useState({
    status: 'Tất cả',
    source: 'Tất cả',
    assignedTo: 'Tất cả',
  });

  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'lastContacted' | 'status' | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewLead(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLead.name && newLead.phone) {
      onAddLead(newLead);
      setIsModalOpen(false);
      setNewLead({ name: '', phone: '', email: '', source: 'Facebook', assignedTo: '' });
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAssignLead = (lead: Lead, newStaffId: string) => {
    const updatedLead = { 
        ...lead, 
        assignedTo: newStaffId || null,
        // Update last contacted date on assignment change
        lastContacted: new Date(), 
    };
    onUpdateLead(updatedLead);
  };

  const requestSort = (key: 'name' | 'lastContacted' | 'status') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const filteredAndSortedLeads = useMemo(() => {
    let filtered = [...leads];

    if (filters.status !== 'Tất cả') {
        filtered = filtered.filter(lead => lead.status === filters.status);
    }
    if (filters.source !== 'Tất cả') {
        filtered = filtered.filter(lead => lead.source === filters.source);
    }
    if (filters.assignedTo !== 'Tất cả') {
        filtered = filtered.filter(lead => lead.assignedTo === filters.assignedTo);
    }

    if (sortConfig.key) {
        filtered.sort((a, b) => {
            let comparison = 0;
            
            if (sortConfig.key === 'lastContacted') {
                const aTime = a.lastContacted ? a.lastContacted.getTime() : -Infinity;
                const bTime = b.lastContacted ? b.lastContacted.getTime() : -Infinity;
                comparison = aTime - bTime;
            } else {
                // For string properties like 'name' and 'status'
                const aValue = a[sortConfig.key] || '';
                const bValue = b[sortConfig.key] || '';
                if (aValue < bValue) { comparison = -1; }
                if (aValue > bValue) { comparison = 1; }
            }
    
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
    }

    return filtered;
  }, [leads, filters, sortConfig]);


  const assignableStaff = useMemo(() => staff.filter(s => ['Tư vấn viên', 'Bác sĩ', 'Quản lý'].includes(s.role)), [staff]);
  const leadSources: Lead['source'][] = ['Facebook', 'Zalo', 'Website', 'Giới thiệu', 'Khác'];
  const leadStatuses: Lead['status'][] = ['Mới', 'Đang tư vấn', 'Tiềm năng', 'Chốt thành công', 'Thất bại'];


  const SortIndicator = ({ columnKey }: { columnKey: 'name' | 'status' | 'lastContacted' }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <>
      <Card title="Khách hàng tiềm năng">
        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Tìm kiếm khách tiềm năng..."
            className="w-1/3 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-clinic-primary"
          />
          {permissions.has('add_lead') && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-clinic-primary text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors">
              + Thêm khách tiềm năng
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-4 p-4 bg-gray-50 rounded-lg border border-clinic-border">
          <div className="flex-1">
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select id="status-filter" name="status" value={filters.status} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-clinic-primary">
              <option>Tất cả</option>
              {leadStatuses.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="source-filter" className="block text-sm font-medium text-gray-700 mb-1">Nguồn</label>
            <select id="source-filter" name="source" value={filters.source} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-clinic-primary">
              <option>Tất cả</option>
              {leadSources.map(source => <option key={source} value={source}>{source}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="assignedTo-filter" className="block text-sm font-medium text-gray-700 mb-1">Người phụ trách</label>
            <select id="assignedTo-filter" name="assignedTo" value={filters.assignedTo} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-clinic-primary">
              <option value="Tất cả">Tất cả</option>
              {assignableStaff.map(tvv => <option key={tvv.id} value={tvv.id}>{tvv.name}</option>)}
            </select>
          </div>
        </div>


        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs">
                    <button onClick={() => requestSort('name')} className="font-medium text-gray-500 uppercase tracking-wider flex items-center hover:text-gray-700">
                        Tên khách hàng<span className="ml-1 text-gray-400"><SortIndicator columnKey="name" /></span>
                    </button>
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nguồn</th>
                 <th className="py-3 px-4 text-left text-xs">
                    <button onClick={() => requestSort('status')} className="font-medium text-gray-500 uppercase tracking-wider flex items-center hover:text-gray-700">
                        Trạng thái<span className="ml-1 text-gray-400"><SortIndicator columnKey="status" /></span>
                    </button>
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người phụ trách</th>
                <th className="py-3 px-4 text-left text-xs">
                    <button onClick={() => requestSort('lastContacted')} className="font-medium text-gray-500 uppercase tracking-wider flex items-center hover:text-gray-700">
                        Liên hệ cuối<span className="ml-1 text-gray-400"><SortIndicator columnKey="lastContacted" /></span>
                    </button>
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap cursor-pointer" onClick={() => onSelectLead(lead)}>
                    <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                    <div className="text-sm text-gray-500">{lead.phone}</div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer" onClick={() => onSelectLead(lead)}>{lead.source}</td>
                  <td className="py-4 px-4 whitespace-nowrap cursor-pointer" onClick={() => onSelectLead(lead)}>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                     {permissions.has('edit_lead') ? (
                        <select
                            value={lead.assignedTo || ''}
                            onChange={(e) => handleAssignLead(lead, e.target.value)}
                            onClick={(e) => e.stopPropagation()} // Ngăn không cho sự kiện click của hàng được kích hoạt
                            className="w-full p-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-clinic-primary bg-transparent"
                        >
                            <option value="">Chưa gán</option>
                            {assignableStaff.map(tvv => (
                                <option key={tvv.id} value={tvv.id}>{tvv.name}</option>
                            ))}
                        </select>
                     ) : (
                        <span>{staff.find(s => s.id === lead.assignedTo)?.name || 'Chưa gán'}</span>
                     )}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer" onClick={() => onSelectLead(lead)}>{lead.lastContacted ? format(lead.lastContacted, 'dd/MM/yyyy') : 'N/A'}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                     <div className="flex items-center space-x-4">
                        <button onClick={() => onSelectLead(lead)} className="text-clinic-primary hover:text-indigo-900">Xem chi tiết</button>
                        {permissions.has('delete_lead') && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteLead(lead.id);
                                }} 
                                className="text-red-500 hover:text-red-700"
                                title="Xóa khách tiềm năng"
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Thêm khách hàng tiềm năng">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Họ và tên</label>
              <input type="text" name="name" id="name" value={newLead.name} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm" required />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
              <input type="tel" name="phone" id="phone" value={newLead.phone} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm" required />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email (Tùy chọn)</label>
              <input type="email" name="email" id="email" value={newLead.email} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm" />
            </div>
            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700">Nguồn</label>
              <select id="source" name="source" value={newLead.source} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm rounded-md">
                <option>Facebook</option>
                <option>Zalo</option>
                <option>Website</option>
                <option>Giới thiệu</option>
                <option>Khác</option>
              </select>
            </div>
            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">Gán cho nhân viên</label>
              <select id="assignedTo" name="assignedTo" value={newLead.assignedTo} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm rounded-md">
                <option value="">-- Chọn nhân viên --</option>
                {assignableStaff.map(tvv => <option key={tvv.id} value={tvv.id}>{tvv.name}</option>)}
              </select>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-clinic-primary text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">Lưu</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm">Hủy</button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Leads;