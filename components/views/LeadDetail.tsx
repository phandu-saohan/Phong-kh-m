import React, { useState, useEffect, useMemo } from 'react';
import type { Lead, StaffMember, Permission } from '../../types';
import Card from '../common/Card';
import Modal from '../common/Modal';
import { PencilIcon } from '../icons/Icons';
// FIX: Correctly import `format` from `date-fns`
import { format } from 'date-fns';
import { supabase } from '../../lib/supabaseClient';

interface LeadDetailProps {
  lead: Lead;
  staff: StaffMember[];
  onBack: () => void;
  onUpdateLead: (lead: Lead) => void;
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

const LeadDetail: React.FC<LeadDetailProps> = ({ lead, staff, onBack, onUpdateLead, permissions }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedLead, setEditedLead] = useState<Lead>(lead);
  const [newNote, setNewNote] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setEditedLead(lead);
  }, [lead]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedLead(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateLead(editedLead);
    setIsEditModalOpen(false);
  };

  const handleAddNote = () => {
      if (newNote.trim() === '') return;
      const updatedLead = {
          ...lead,
          notes: [...lead.notes, { date: new Date(), note: newNote }],
          lastContacted: new Date()
      };
      onUpdateLead(updatedLead);
      setNewNote('');
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
        const filePath = `public/${lead.id}`;
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true,
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
        
        const avatarUrl = `${publicUrl}?t=${new Date().getTime()}`;

        onUpdateLead({ ...lead, avatar: avatarUrl });

    } catch (error) {
        console.error("Error uploading avatar:", error);
        alert("Không thể tải lên ảnh đại diện. Vui lòng thử lại.");
    } finally {
        setIsUploading(false);
    }
  };

  const assignedStaffName = staff.find(s => s.id === lead.assignedTo)?.name || 'Chưa gán';
  const assignableStaff = useMemo(() => staff.filter(s => ['Tư vấn viên', 'Bác sĩ', 'Quản lý'].includes(s.role)), [staff]);

  return (
    <>
      <div>
        <div className="flex items-center mb-6">
          <button onClick={onBack} className="text-clinic-primary hover:text-indigo-800 mr-4 font-semibold">
            &larr; Quay lại danh sách
          </button>
          <h2 className="text-3xl font-bold text-clinic-text">Chi tiết khách tiềm năng</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
               <div className="flex flex-col items-center text-center">
                <div className="relative group w-24 h-24">
                    <img src={lead.avatar || `https://i.pravatar.cc/150?u=${lead.id}`} alt={lead.name} className="w-24 h-24 rounded-full mb-4 ring-4 ring-indigo-100 group-hover:opacity-75 transition-opacity" />
                    {permissions.has('edit_lead') && (
                        <>
                            <label htmlFor="lead-avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                <PencilIcon className="text-white" />
                            </label>
                            <input
                                type="file"
                                id="lead-avatar-upload"
                                accept="image/png, image/jpeg"
                                onChange={handleAvatarUpload}
                                disabled={isUploading}
                                className="hidden"
                            />
                        </>
                    )}
                </div>
                {isUploading && <p className="text-sm text-gray-500 mb-2">Đang tải lên...</p>}
                <h3 className="text-xl font-semibold mt-4">{lead.name}</h3>
                <span className={`mt-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(lead.status)}`}>{lead.status}</span>
              </div>
              <div className="mt-6 border-t border-clinic-border pt-6">
                  <dl className="space-y-3 text-sm">
                      <div className="flex justify-between"><dt className="text-gray-500">Điện thoại:</dt><dd className="font-medium text-gray-900">{lead.phone}</dd></div>
                      <div className="flex justify-between"><dt className="text-gray-500">Email:</dt><dd className="font-medium text-gray-900">{lead.email || 'N/A'}</dd></div>
                      <div className="flex justify-between"><dt className="text-gray-500">Nguồn:</dt><dd className="font-medium text-gray-900">{lead.source}</dd></div>
                      <div className="flex justify-between"><dt className="text-gray-500">Phụ trách:</dt><dd className="font-medium text-gray-900">{assignedStaffName}</dd></div>
                      <div className="flex justify-between"><dt className="text-gray-500">Liên hệ cuối:</dt><dd className="font-medium text-gray-900">{lead.lastContacted ? format(lead.lastContacted, 'dd/MM/yyyy') : 'N/A'}</dd></div>
                  </dl>
                  {permissions.has('edit_lead') && (
                    <button onClick={() => setIsEditModalOpen(true)} className="mt-6 w-full flex items-center justify-center bg-gray-100 text-gray-700 py-2 px-4 rounded-md text-sm font-semibold hover:bg-gray-200 transition-colors">
                        <PencilIcon />
                        <span className="ml-2">Chỉnh sửa thông tin</span>
                    </button>
                  )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
              <Card title="Lịch sử tương tác & Ghi chú">
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 mb-4">
                      {lead.notes.length > 0 ? lead.notes.slice().reverse().map((note, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg border-l-4 border-indigo-200">
                              <p className="text-xs text-gray-500 mb-1">Ngày: {format(note.date, 'dd/MM/yyyy HH:mm')}</p>
                              <p className="text-sm text-gray-700">{note.note}</p>
                          </div>
                      )) : (
                          <div className="text-center py-8 text-gray-500">
                              <p>Chưa có ghi chú nào.</p>
                          </div>
                      )}
                  </div>
                  {permissions.has('edit_lead') && (
                    <div className="border-t pt-4">
                        <textarea 
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            rows={3} 
                            placeholder="Thêm ghi chú mới..."
                            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-clinic-primary"
                        ></textarea>
                        <button onClick={handleAddNote} className="mt-2 w-full bg-clinic-primary text-white py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors">
                            Thêm ghi chú
                        </button>
                    </div>
                  )}
              </Card>
          </div>
        </div>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Chỉnh sửa khách tiềm năng">
        <form onSubmit={handleEditSubmit}>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Họ và tên</label>
                <input type="text" name="name" id="name" value={editedLead.name} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                <input type="tel" name="phone" id="phone" value={editedLead.phone} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" name="email" id="email" value={editedLead.email || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Trạng thái</label>
                <select 
                    id="status" 
                    name="status" 
                    value={editedLead.status} 
                    onChange={handleInputChange} 
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md disabled:bg-gray-200"
                    disabled={editedLead.status === 'Chốt thành công'}
                >
                    <option>Mới</option>
                    <option>Đang tư vấn</option>
                    <option>Tiềm năng</option>
                    <option>Chốt thành công</option>
                    <option>Thất bại</option>
                </select>
              </div>
              <div>
                <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">Gán cho nhân viên</label>
                <select id="assignedTo" name="assignedTo" value={editedLead.assignedTo || ''} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md">
                    <option value="">-- Chọn nhân viên --</option>
                    {assignableStaff.map(tvv => <option key={tvv.id} value={tvv.id}>{tvv.name}</option>)}
                </select>
            </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-clinic-primary text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm">Lưu thay đổi</button>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Hủy</button>
            </div>
          </form>
      </Modal>
    </>
  );
};

export default LeadDetail;