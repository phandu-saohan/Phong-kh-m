import React, { useState, useEffect } from 'react';
import type { Customer, TreatmentHistory, Appointment, Permission } from '../../types';
import Card from '../common/Card';
import Modal from '../common/Modal';
import { PencilIcon } from '../icons/Icons';
// FIX: Correctly import `format` from `date-fns`
import { format } from 'date-fns';
import { supabase } from '../../lib/supabaseClient';
import StarRating from '../common/StarRating';

interface CustomerDetailProps {
  customer: Customer;
  onBack: () => void;
  onUpdateCustomer: (customer: Customer) => void;
  appointments: Appointment[];
  permissions: Set<Permission>;
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({ customer, onBack, onUpdateCustomer, appointments, permissions }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  
  const [editedCustomer, setEditedCustomer] = useState<Customer>(customer);
  const [selectedTreatment, setSelectedTreatment] = useState<TreatmentHistory | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);


  useEffect(() => {
    setEditedCustomer(customer);
  }, [customer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim());
    setEditedCustomer(prev => ({...prev, tags}));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCustomer(editedCustomer);
    setIsEditModalOpen(false);
  };

  const handleOpenNoteModal = (treatment: TreatmentHistory) => {
    setSelectedTreatment(treatment);
    setNoteContent(treatment.notes);
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = async () => {
    if (!selectedTreatment) return;

    // Persist the note change to the database first
    const { error } = await supabase
      .from('treatment_history')
      .update({ notes: noteContent })
      .eq('id', selectedTreatment.id);

    if (error) {
      console.error("Error updating treatment note:", error);
      alert("Không thể lưu ghi chú. Vui lòng thử lại.");
      return;
    }

    // Then, update the local state to reflect the change immediately
    const updatedHistory = customer.treatmentHistory.map(item => 
      item.id === selectedTreatment.id ? { ...item, notes: noteContent } : item
    );
    
    const updatedCustomer = { ...customer, treatmentHistory: updatedHistory };
    onUpdateCustomer(updatedCustomer); // This updates state in App.tsx
    
    setIsNoteModalOpen(false);
    setSelectedTreatment(null);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
        const filePath = `public/${customer.id}`;
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true, // Overwrite existing file if any
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // Add a timestamp to bypass browser cache if the URL hasn't changed
        const avatarUrl = `${publicUrl}?t=${new Date().getTime()}`;

        onUpdateCustomer({ ...customer, avatar: avatarUrl });

    } catch (error) {
        console.error("Error uploading avatar:", error);
        alert("Không thể tải lên ảnh đại diện. Vui lòng thử lại.");
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <>
      <div>
        <div className="flex items-center mb-6">
          <button onClick={onBack} className="text-clinic-primary hover:text-indigo-800 mr-4 font-semibold">
            &larr; Quay lại danh sách
          </button>
          <h2 className="text-3xl font-bold text-clinic-text">Chi tiết khách hàng</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <div className="flex flex-col items-center text-center">
                 <div className="relative group w-24 h-24">
                    <img src={customer.avatar} alt={customer.name} className="w-24 h-24 rounded-full mb-4 ring-4 ring-indigo-100 group-hover:opacity-75 transition-opacity" />
                    {permissions.has('edit_customer') && (
                        <>
                            <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                <PencilIcon className="text-white" />
                            </label>
                            <input
                                type="file"
                                id="avatar-upload"
                                accept="image/png, image/jpeg"
                                onChange={handleAvatarUpload}
                                disabled={isUploading}
                                className="hidden"
                            />
                        </>
                    )}
                </div>
                {isUploading && <p className="text-sm text-gray-500 mb-2">Đang tải lên...</p>}
                <h3 className="text-xl font-semibold mt-4">{customer.name}</h3>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {customer.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="mt-6 border-t border-clinic-border pt-6">
                  <dl className="space-y-3 text-sm">
                      <div className="flex justify-between"><dt className="text-gray-500">Điện thoại:</dt><dd className="font-medium text-gray-900">{customer.phone}</dd></div>
                      <div className="flex justify-between"><dt className="text-gray-500">Email:</dt><dd className="font-medium text-gray-900">{customer.email}</dd></div>
                      <div className="flex justify-between"><dt className="text-gray-500">Ngày tham gia:</dt><dd className="font-medium text-gray-900">{customer.joinDate ? format(customer.joinDate, 'dd/MM/yyyy') : 'N/A'}</dd></div>
                      <div className="flex justify-between"><dt className="text-gray-500">Lần cuối đến:</dt><dd className="font-medium text-gray-900">{customer.lastVisit ? format(customer.lastVisit, 'dd/MM/yyyy') : 'N/A'}</dd></div>
                      <div className="flex justify-between items-center"><dt className="text-gray-500">Tổng chi tiêu:</dt><dd className="font-bold text-lg text-clinic-secondary">{customer.totalSpent.toLocaleString('vi-VN')}₫</dd></div>
                  </dl>
                  {permissions.has('edit_customer') && (
                    <button onClick={() => setIsEditModalOpen(true)} className="mt-6 w-full flex items-center justify-center bg-gray-100 text-gray-700 py-2 px-4 rounded-md text-sm font-semibold hover:bg-gray-200 transition-colors">
                        <PencilIcon />
                        <span className="ml-2">Chỉnh sửa thông tin</span>
                    </button>
                  )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
              <Card title="Lịch sử điều trị">
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                      {customer.treatmentHistory.length > 0 ? customer.treatmentHistory.map(treatment => (
                          <div key={treatment.id} className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start">
                                  <div>
                                      <p className="font-semibold text-clinic-primary">{treatment.serviceName}</p>
                                      <p className="text-sm text-gray-500">Thực hiện bởi: {treatment.staffName} - Ngày: {treatment.treatmentDate ? format(treatment.treatmentDate, 'dd/MM/yyyy') : 'N/A'}</p>
                                  </div>
                                  <p className="text-sm font-semibold text-gray-800">{treatment.cost.toLocaleString('vi-VN')}₫</p>
                              </div>
                              <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md border-l-4 border-indigo-200 flex justify-between items-start">
                                <p><strong>Ghi chú:</strong> {treatment.notes || <i>Chưa có ghi chú</i>}</p>
                                {permissions.has('edit_customer') && (
                                    <button onClick={() => handleOpenNoteModal(treatment)} className="text-clinic-primary hover:text-indigo-800 flex-shrink-0 ml-4">
                                        <PencilIcon />
                                    </button>
                                )}
                              </div>
                          </div>
                      )) : (
                          <div className="text-center py-8 text-gray-500">
                              <p>Chưa có lịch sử điều trị.</p>
                          </div>
                      )}
                  </div>
              </Card>
              <Card title="Lịch sử đánh giá">
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                      {customer.feedback.length > 0 ? [...customer.feedback].reverse().map(fb => {
                          const appointment = appointments.find(a => a.id === fb.appointment_id);
                          return (
                            <div key={fb.id} className="p-4 border border-gray-200 rounded-lg bg-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-clinic-primary">{appointment?.service || 'Dịch vụ không xác định'}</p>
                                        <p className="text-sm text-gray-500">Ngày: {appointment ? format(appointment.startTime, 'dd/MM/yyyy') : 'N/A'}</p>
                                    </div>
                                    <StarRating rating={fb.rating} size="sm" />
                                </div>
                                {fb.comment && (
                                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                        <p><strong>Bình luận:</strong> {fb.comment}</p>
                                    </div>
                                )}
                            </div>
                          );
                      }) : (
                          <div className="text-center py-8 text-gray-500">
                              <p>Chưa có đánh giá nào.</p>
                          </div>
                      )}
                  </div>
              </Card>
          </div>
        </div>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Chỉnh sửa thông tin khách hàng">
        <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Họ và tên</label>
                <input type="text" name="name" id="name" value={editedCustomer.name} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm" required />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                <input type="tel" name="phone" id="phone" value={editedCustomer.phone} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm" required />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" name="email" id="email" value={editedCustomer.email} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm" />
              </div>
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (phân cách bằng dấu phẩy)</label>
                <input type="text" name="tags" id="tags" value={editedCustomer.tags.join(', ')} onChange={handleTagsChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm" />
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-clinic-primary text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">Lưu thay đổi</button>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">Hủy</button>
            </div>
          </form>
      </Modal>

      <Modal isOpen={isNoteModalOpen} onClose={() => setIsNoteModalOpen(false)} title={`Ghi chú cho: ${selectedTreatment?.serviceName}`}>
        <div className="p-6">
            <textarea 
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={5}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm"
                placeholder="Nhập ghi chú điều trị..."
            />
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button onClick={handleSaveNote} type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-clinic-primary text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">Lưu</button>
            <button type="button" onClick={() => setIsNoteModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm">Hủy</button>
        </div>
      </Modal>
    </>
  );
};

export default CustomerDetail;