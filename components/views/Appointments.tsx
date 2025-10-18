import React, { useState, useMemo } from 'react';
import type { Appointment, Customer, Service, StaffMember, AppointmentStatus, Feedback, Permission, Lead } from '../../types';
import Card from '../common/Card';
import Modal from '../common/Modal';
import { format, isToday, isBefore, startOfDay, parse } from 'date-fns';
import vi from 'date-fns/locale/vi';
import { CalendarIcon, CheckIcon, XIcon } from '../icons/Icons';
import StarRating from '../common/StarRating';

interface AppointmentsProps {
    appointments: Appointment[];
    customers: Customer[];
    services: Service[];
    staff: StaffMember[];
    leads: Lead[];
    onAddAppointment: (apt: Omit<Appointment, 'id' | 'customerName' | 'staffName'>) => void;
    onAddAppointmentForLead: (leadId: string, aptData: Omit<Appointment, 'id' | 'customerName' | 'staffName' | 'customerId' | 'feedback'>) => void;
    onUpdateAppointment: (apt: Appointment) => void;
    onAddFeedback: (feedbackData: Omit<Feedback, 'id' | 'created_at'>) => void;
    permissions: Set<Permission>;
}

const getStatusStyles = (status: AppointmentStatus) => {
    switch (status) {
        case 'Đã xác nhận': return { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-800' };
        case 'Hoàn thành': return { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-800' };
        case 'Đã hủy': return { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-800' };
        case 'Chờ xác nhận':
        default: return { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-800' };
    }
};

// Define a new type for appointments that includes the customer's avatar
interface HydratedAppointment extends Appointment {
    customerAvatar?: string;
}

// Sub-component for displaying today's appointments in a card format
const AppointmentCard: React.FC<{ appointment: HydratedAppointment; onSelect: (apt: Appointment) => void }> = ({ appointment, onSelect }) => {
    const styles = getStatusStyles(appointment.status);
    return (
        <div className={`bg-white rounded-lg shadow-md border-l-4 ${styles.border} p-4 flex flex-col justify-between hover:shadow-lg transition-shadow`}>
            <div>
                <div className="flex justify-between items-start mb-3">
                    <span className="font-bold text-lg text-clinic-primary">{format(appointment.startTime, 'HH:mm')} - {format(appointment.endTime, 'HH:mm')}</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles.bg} ${styles.text}`}>{appointment.status}</span>
                </div>
                <div className="flex items-center mb-3">
                    <img src={appointment.customerAvatar} alt={appointment.customerName} className="w-10 h-10 rounded-full mr-3" />
                    <div>
                        <p className="font-semibold text-clinic-text">{appointment.customerName}</p>
                        <p className="text-sm text-gray-500">Khách hàng</p>
                    </div>
                </div>
                <div className="text-sm text-gray-700 space-y-2 border-t pt-3">
                    <p><strong className="font-medium text-gray-500">Dịch vụ:</strong> {appointment.service}</p>
                    <p><strong className="font-medium text-gray-500">Thực hiện:</strong> {appointment.staffName}</p>
                </div>
            </div>
            <button
                onClick={() => onSelect(appointment)}
                className="mt-4 w-full bg-indigo-50 text-indigo-700 py-2 px-3 rounded-md text-sm font-semibold hover:bg-indigo-100 transition-colors"
            >
                Xem chi tiết
            </button>
        </div>
    );
};

const Appointments: React.FC<AppointmentsProps> = ({ appointments, customers, services, staff, leads, onAddAppointment, onAddAppointmentForLead, onUpdateAppointment, onAddFeedback, permissions }) => {
    const [selectedStaffId, setSelectedStaffId] = useState('all');
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [contactType, setContactType] = useState<'customer' | 'lead'>('customer');
    
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [appointmentForFeedback, setAppointmentForFeedback] = useState<Appointment | null>(null);

    const [historyFilters, setHistoryFilters] = useState({
        startDate: '',
        endDate: '',
        customerId: 'all',
        serviceName: 'all',
        status: 'all' as 'all' | AppointmentStatus,
    });

    const technicians = useMemo(() => staff.filter(s => s.role === 'Bác sĩ' || s.role === 'Kỹ thuật viên'), [staff]);
    const serviceNames = useMemo(() => [...new Set(services.map(s => s.name))], [services]);
    const statuses: AppointmentStatus[] = ['Chờ xác nhận', 'Đã xác nhận', 'Hoàn thành', 'Đã hủy'];


    const { todaysAppointments, pastAppointments } = useMemo(() => {
        const todayStart = startOfDay(new Date());

        let filteredByStaff = appointments;
        if (selectedStaffId !== 'all') {
            filteredByStaff = appointments.filter(apt => apt.staffId === selectedStaffId);
        }
        
        const addAvatar = (apt: Appointment): HydratedAppointment => {
            const customer = customers.find(c => c.id === apt.customerId);
            return {
                ...apt,
                customerAvatar: customer?.avatar || `https://i.pravatar.cc/150?u=${apt.customerId}`,
            }
        };

        const todays = filteredByStaff
            .filter(apt => isToday(apt.startTime))
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
            .map(addAvatar);
        
        const startFilter = historyFilters.startDate ? parse(historyFilters.startDate, 'yyyy-MM-dd', new Date()) : null;
        if (startFilter) startFilter.setHours(0, 0, 0, 0);
        
        const endFilter = historyFilters.endDate ? parse(historyFilters.endDate, 'yyyy-MM-dd', new Date()) : null;
        if (endFilter) endFilter.setHours(23, 59, 59, 999);


        const past = filteredByStaff
            .filter(apt => {
                const isPastAppointment = isBefore(apt.startTime, todayStart);
                const dateMatch = (!startFilter || apt.startTime >= startFilter) && (!endFilter || apt.startTime <= endFilter);
                const customerMatch = historyFilters.customerId === 'all' || apt.customerId === historyFilters.customerId;
                const serviceMatch = historyFilters.serviceName === 'all' || apt.service === historyFilters.serviceName;
                const statusMatch = historyFilters.status === 'all' || apt.status === historyFilters.status;

                // If any date filter is applied, we don't need the isPastAppointment check
                if (startFilter || endFilter) {
                    return dateMatch && customerMatch && serviceMatch && statusMatch;
                }
                
                return isPastAppointment && customerMatch && serviceMatch && statusMatch;
            })
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
            .map(addAvatar);
        
        return { todaysAppointments: todays, pastAppointments: past };
    }, [appointments, selectedStaffId, customers, historyFilters]);


    const handleAddAppointmentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const contactId = formData.get('contactId') as string;
        const serviceName = formData.get('service') as string;
        const staffId = formData.get('staffId') as string;
        const date = formData.get('date') as string;
        const time = formData.get('time') as string;

        const staffMember = staff.find(s => s.id === staffId);
        const service = services.find(s => s.name === serviceName);

        if (!contactId || !staffMember || !service) {
            alert("Thông tin không hợp lệ");
            return;
        }

        const [hours, minutes] = time.split(':').map(Number);
        const startTime = new Date(`${date}T00:00:00`);
        startTime.setHours(hours, minutes, 0, 0);
        const endTime = new Date(startTime.getTime() + service.duration * 60000);
        
        const aptData = {
            service: service.name,
            staffId: staffMember.id,
            startTime,
            endTime,
            status: 'Chờ xác nhận' as AppointmentStatus,
        };

        if (contactType === 'customer') {
            onAddAppointment({ ...aptData, customerId: contactId });
        } else {
            onAddAppointmentForLead(contactId, aptData);
        }
        
        setIsAddModalOpen(false);
    };

    const handleUpdateStatus = (status: AppointmentStatus) => {
        if (selectedAppointment) {
            onUpdateAppointment({ ...selectedAppointment, status });
            setSelectedAppointment(null);
        }
    }
    
    const handleOpenFeedbackModal = (apt: Appointment) => {
        setAppointmentForFeedback(apt);
        setFeedbackRating(0);
        setFeedbackComment('');
        setSelectedAppointment(null);
        setIsFeedbackModalOpen(true);
    };
    
    const handleCloseFeedbackModal = () => {
        setIsFeedbackModalOpen(false);
        setAppointmentForFeedback(null);
    };

    const handleSubmitFeedback = () => {
        if (!appointmentForFeedback || feedbackRating === 0) {
            alert('Vui lòng chọn số sao đánh giá.');
            return;
        }

        onAddFeedback({
            appointment_id: appointmentForFeedback.id,
            customer_id: appointmentForFeedback.customerId,
            staff_id: appointmentForFeedback.staffId,
            rating: feedbackRating,
            comment: feedbackComment,
        });
        
        handleCloseFeedbackModal();
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setHistoryFilters(prev => ({ ...prev, [name]: value }));
    };


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <h2 className="text-3xl font-bold text-clinic-text mb-4 sm:mb-0">Quản lý lịch hẹn</h2>
                <div className="flex items-center space-x-4">
                     <select value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)} className="w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-clinic-primary">
                        <option value="all">Tất cả nhân viên</option>
                        {technicians.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    {permissions.has('add_appointment') && (
                        <button onClick={() => setIsAddModalOpen(true)} className="bg-clinic-primary text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors whitespace-nowrap">
                            + Tạo lịch hẹn
                        </button>
                    )}
                </div>
            </div>

            <Card title="Lịch hẹn hôm nay">
                {todaysAppointments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {todaysAppointments.map(apt => (
                            <AppointmentCard key={apt.id} appointment={apt} onSelect={setSelectedAppointment} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8">Không có lịch hẹn nào hôm nay.</p>
                )}
            </Card>

            <Card title="Lịch sử lịch hẹn">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                        <input type="date" name="startDate" id="startDate" value={historyFilters.startDate} onChange={handleFilterChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"/>
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                        <input type="date" name="endDate" id="endDate" value={historyFilters.endDate} onChange={handleFilterChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"/>
                    </div>
                     <div>
                        <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
                        <select name="customerId" id="customerId" value={historyFilters.customerId} onChange={handleFilterChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                            <option value="all">Tất cả</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700 mb-1">Dịch vụ</label>
                        <select name="serviceName" id="serviceName" value={historyFilters.serviceName} onChange={handleFilterChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                            <option value="all">Tất cả</option>
                            {serviceNames.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                        <select name="status" id="status" value={historyFilters.status} onChange={handleFilterChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                            <option value="all">Tất cả</option>
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dịch vụ</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhân viên</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {pastAppointments.map(apt => {
                                const styles = getStatusStyles(apt.status);
                                return (
                                <tr key={apt.id} className="hover:bg-gray-50">
                                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{format(apt.startTime, 'dd/MM/yyyy')}</td>
                                    <td className="py-4 px-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img src={apt.customerAvatar} alt={apt.customerName} className="w-8 h-8 rounded-full mr-3" />
                                            <span className="text-sm font-medium text-gray-900">{apt.customerName}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{apt.service}</td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{apt.staffName}</td>
                                    <td className="py-4 px-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles.bg} ${styles.text}`}>
                                            {apt.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => setSelectedAppointment(apt)} className="text-clinic-primary hover:text-indigo-900">
                                            Xem
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                     {pastAppointments.length === 0 && (
                        <p className="text-gray-500 text-center py-8">Không có lịch hẹn nào khớp với bộ lọc.</p>
                     )}
                </div>
            </Card>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tạo lịch hẹn mới">
                <form onSubmit={handleAddAppointmentSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Loại liên hệ</label>
                            <div className="mt-2 flex">
                                <label className="flex items-center mr-4">
                                    <input type="radio" value="customer" checked={contactType === 'customer'} onChange={() => setContactType('customer')} className="form-radio" />
                                    <span className="ml-2">Khách hàng hiện tại</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" value="lead" checked={contactType === 'lead'} onChange={() => setContactType('lead')} className="form-radio" />
                                    <span className="ml-2">Khách tiềm năng</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{contactType === 'customer' ? 'Khách hàng' : 'Khách tiềm năng'}</label>
                            <select name="contactId" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm" required>
                                <option value="">-- Chọn --</option>
                                {contactType === 'customer' 
                                 ? customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)
                                 : leads.map(l => <option key={l.id} value={l.id}>{l.name} - {l.phone}</option>)
                                }
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Dịch vụ</label>
                            <select name="service" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm" required>
                                {services.map(s => <option key={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nhân viên thực hiện</label>
                            <select name="staffId" defaultValue={selectedStaffId !== 'all' ? selectedStaffId : ''} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm" required>
                                <option value="">-- Chọn KTV/Bác sĩ --</option>
                                {technicians.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Ngày</label>
                                <input type="date" name="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Giờ</label>
                                <input type="time" name="time" defaultValue="09:00" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm" step="900" required />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-clinic-primary text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm">Lưu</button>
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Hủy</button>
                    </div>
                </form>
            </Modal>
            
            {selectedAppointment && (
                <Modal isOpen={!!selectedAppointment} onClose={() => setSelectedAppointment(null)} title="Chi tiết Lịch hẹn">
                    <div className="p-6 space-y-4">
                        <div className={`p-3 rounded-lg ${getStatusStyles(selectedAppointment.status).bg} ${getStatusStyles(selectedAppointment.status).text}`}>
                            Trạng thái: <span className="font-bold">{selectedAppointment.status}</span>
                        </div>
                        <div><strong className="w-28 inline-block">Khách hàng:</strong> {selectedAppointment.customerName}</div>
                        <div><strong className="w-28 inline-block">Dịch vụ:</strong> {selectedAppointment.service}</div>
                        <div><strong className="w-28 inline-block">Nhân viên:</strong> {selectedAppointment.staffName}</div>
                        <div><strong className="w-28 inline-block">Thời gian:</strong> {format(selectedAppointment.startTime, 'HH:mm dd/MM/yyyy')}</div>
                    </div>
                    
                    {selectedAppointment.feedback && (
                        <div className="bg-yellow-50 px-6 py-4 border-t">
                            <p className="text-sm font-medium text-gray-700 mb-2">Đánh giá của khách hàng:</p>
                            <StarRating rating={selectedAppointment.feedback.rating} />
                            {selectedAppointment.feedback.comment && <p className="text-sm text-gray-600 mt-2 italic">"{selectedAppointment.feedback.comment}"</p>}
                        </div>
                    )}
                    
                    <div className="bg-gray-50 px-6 py-3 border-t">
                        <p className="text-sm font-medium text-gray-700 mb-2">Cập nhật trạng thái:</p>
                        <div className="flex flex-wrap gap-2">
                           {(['Đã xác nhận', 'Hoàn thành', 'Đã hủy'] as AppointmentStatus[]).map(status => (
                               <button 
                                key={status} 
                                onClick={() => handleUpdateStatus(status)} 
                                disabled={selectedAppointment.status === status || !permissions.has('edit_appointment_status')}
                                className={`px-3 py-1 text-sm rounded-full flex items-center ${getStatusStyles(status).bg} ${getStatusStyles(status).text} disabled:opacity-50 disabled:cursor-not-allowed`}>
                                   {status === 'Hoàn thành' ? <CheckIcon/> : status === 'Đã hủy' ? <XIcon/> : <CalendarIcon/>}
                                   <span className="ml-1">{status}</span>
                               </button>
                           ))}
                        </div>
                    </div>
                     <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        {selectedAppointment.status === 'Hoàn thành' && !selectedAppointment.feedback && (
                            <button 
                                onClick={() => handleOpenFeedbackModal(selectedAppointment)}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-500 text-base font-medium text-white hover:bg-yellow-600 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Thêm đánh giá
                            </button>
                        )}
                        <button type="button" onClick={() => setSelectedAppointment(null)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm">Đóng</button>
                    </div>
                </Modal>
            )}
            
            {isFeedbackModalOpen && appointmentForFeedback && (
                <Modal isOpen={isFeedbackModalOpen} onClose={handleCloseFeedbackModal} title={`Đánh giá cho: ${appointmentForFeedback.customerName}`}>
                    <div className="p-6 space-y-4">
                        <p>Dịch vụ: <span className="font-semibold">{appointmentForFeedback.service}</span></p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mức độ hài lòng</label>
                            <div className="mt-2">
                                <StarRating rating={feedbackRating} setRating={setFeedbackRating} size="lg" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="feedback-comment" className="block text-sm font-medium text-gray-700">Bình luận (tùy chọn)</label>
                            <textarea
                                id="feedback-comment"
                                value={feedbackComment}
                                onChange={(e) => setFeedbackComment(e.target.value)}
                                rows={4}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Khách hàng có nhận xét gì về dịch vụ..."
                            />
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button onClick={handleSubmitFeedback} type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-clinic-primary text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm">Lưu đánh giá</button>
                        <button type="button" onClick={handleCloseFeedbackModal} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Hủy</button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Appointments;
