import React, { useState, useMemo, useEffect } from 'react';
import Card from '../common/Card';
import type { Role, Permission, CommissionRate, OneSignalSettings } from '../../types';
import { allPermissions } from '../../data/mockData';
import { TrashIcon, ZaloIcon, PencilIcon } from '../icons/Icons';
import { supabase } from '../../lib/supabaseClient';

interface SettingsProps {
    roles: Role[];
    commissionRates: CommissionRate[];
    oneSignalSettings: OneSignalSettings | null;
    onAddRole: (role: Omit<Role, 'id'>) => void;
    onUpdateRole: (role: Role) => void;
    onDeleteRole: (roleId: string) => void;
    onUpdateCommissionRates: (rates: CommissionRate[]) => void;
    onUpdateOneSignalSettings: (settings: OneSignalSettings) => void;
}

const permissionGroupTitles: Record<string, string> = {
    view: 'Xem',
    dashboard: 'Bảng điều khiển',
    customer: 'Khách hàng',
    lead: 'Khách tiềm năng',
    appointment: 'Lịch hẹn',
    staff: 'Nhân viên',
    leave: 'Nghỉ phép',
    timekeeping: 'Chấm công',
    inventory: 'Kho (Dịch vụ & Sản phẩm)',
    sale: 'Bán hàng',
    expenses: 'Quản lý Chi phí',
    report: 'Báo cáo',
    commission: 'Hoa hồng',
    manage: 'Quản lý',
};

type PermissionDetail = (typeof allPermissions)[number];

const RoleEditor: React.FC<{
    selectedRole: Role;
    onSave: (role: Role) => void;
    onDelete: (roleId: string) => void;
    onCancel: () => void;
}> = ({ selectedRole, onSave, onDelete, onCancel }) => {
    const [role, setRole] = useState<Role>(selectedRole);
    
    useEffect(() => {
        setRole(selectedRole);
    }, [selectedRole]);

    const handlePermissionChange = (permissionId: Permission, isChecked: boolean) => {
        setRole(prev => {
            const currentPermissions = new Set(prev.permissions);
            if (isChecked) {
                currentPermissions.add(permissionId);
            } else {
                currentPermissions.delete(permissionId);
            }
            return { ...prev, permissions: Array.from(currentPermissions) };
        });
    };

    const handleSave = () => {
        if (!role.name.trim()) {
            alert('Tên vai trò không được để trống.');
            return;
        }
        onSave(role);
    }
    
    const permissionGroups = useMemo(() => {
        // FIX: Add a type assertion to the initial value of reduce to help TypeScript's inference.
        return allPermissions.reduce<Record<string, PermissionDetail[]>>((acc, perm) => {
            const groupKey = perm.id.split('_')[0];
            const groupName = permissionGroupTitles[groupKey] || groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
            if (!acc[groupName]) {
                acc[groupName] = [];
            }
            acc[groupName].push(perm);
            return acc;
        }, {} as Record<string, PermissionDetail[]>);
    }, []);

    const isManagerRole = role.name === 'Quản lý';
    const isEditing = !!role.id;

    return (
        <div className="p-0 sm:p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-clinic-text">{isEditing ? `Chỉnh sửa vai trò: ${role.name}` : "Tạo vai trò mới"}</h3>
                 {isEditing && !isManagerRole && (
                     <button
                        onClick={() => onDelete(role.id)}
                        className="flex items-center text-sm text-red-500 hover:text-red-700 font-semibold"
                    >
                        <TrashIcon className="mr-1"/> Xóa vai trò
                    </button>
                 )}
            </div>
             <div className="mb-6">
                <label htmlFor="role-name" className="block text-sm font-medium text-gray-700">Tên vai trò</label>
                <input
                    type="text"
                    id="role-name"
                    value={role.name}
                    onChange={e => setRole(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                    disabled={isManagerRole || isEditing}
                    required
                />
             </div>
             {isManagerRole && (
                <div className="mb-6 p-3 bg-indigo-50 text-indigo-700 text-sm rounded-md border border-indigo-200">
                    Vai trò <strong>Quản lý</strong> mặc định có tất cả các quyền và không thể bị chỉnh sửa.
                </div>
             )}
            <div className="space-y-6">
                {Object.entries(permissionGroups).map(([groupName, permissions]) => (
                    <div key={groupName}>
                        <h4 className="font-semibold text-gray-800 border-b pb-2 mb-3">{groupName}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                            {permissions.map(permission => (
                                <label key={permission.id} className="flex items-center space-x-2" title={permission.description}>
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-clinic-primary focus:ring-clinic-primary disabled:opacity-70"
                                        checked={isManagerRole || role.permissions.includes(permission.id)}
                                        disabled={isManagerRole}
                                        onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                                    />
                                    <span className="text-sm text-gray-700">{permission.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-end space-x-3 mt-8 border-t pt-4">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >Hủy</button>
                <button
                    onClick={handleSave}
                    disabled={isManagerRole}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-clinic-primary hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                >Lưu thay đổi</button>
            </div>
        </div>
    )
}


const Settings: React.FC<SettingsProps> = ({ roles, commissionRates, oneSignalSettings, onAddRole, onUpdateRole, onDeleteRole, onUpdateCommissionRates, onUpdateOneSignalSettings }) => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  
  const [clinicInfo, setClinicInfo] = useState({
    name: 'ClinicCRM Aesthetics',
    address: '123 Đường ABC, Phường X, Quận Y, TP. HCM',
    phone: '0987 654 321',
    email: 'info@cliniccrm.vn',
    logo: `https://hpuymoqzgwgthfryvges.supabase.co/storage/v1/object/public/avatars/public/clinic_logo?t=${new Date().getTime()}`
  });
  
  const [zaloInfo, setZaloInfo] = useState({
    oaId: '',
    apiKey: '',
    isConnected: false,
  });

  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [localCommissionRates, setLocalCommissionRates] = useState<CommissionRate[]>([]);
  const [localOneSignalSettings, setLocalOneSignalSettings] = useState<OneSignalSettings>({ app_id: '', rest_api_key: '' });


  useEffect(() => {
    const initialRates = roles.map(role => {
        const existingRate = commissionRates.find(r => r.role === role.name);
        return existingRate || { role: role.name, sales_rate: 0, service_rate: 0 };
    });
    setLocalCommissionRates(initialRates);
  }, [roles, commissionRates]);

  useEffect(() => {
    if (oneSignalSettings) {
        setLocalOneSignalSettings(oneSignalSettings);
    }
  }, [oneSignalSettings]);

  const handleSelectRole = (role: Role) => {
    setSelectedRole(JSON.parse(JSON.stringify(role)));
  };

  const handleAddNewRole = () => {
    setSelectedRole({ id: '', name: '', permissions: [] });
  };
  
  const handleSaveRole = (role: Role) => {
    if (role.id) {
       onUpdateRole(role);
    } else {
        const { id, ...newRoleData } = role;
        onAddRole(newRoleData);
    }
    setSelectedRole(null);
  };

  const handleClinicInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClinicInfo(prev => ({...prev, [name]: value}));
  };

  const handleSaveClinicInfo = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thông tin phòng khám đã được cập nhật (mô phỏng).');
  };

  const handleZaloInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setZaloInfo(prev => ({...prev, [name]: value}));
  };

  const handleConnectZalo = (e: React.FormEvent) => {
    e.preventDefault();
    if (zaloInfo.oaId && zaloInfo.apiKey) {
        setZaloInfo(prev => ({...prev, isConnected: true}));
        alert('Đã kết nối với Zalo OA thành công (mô phỏng).');
    } else {
        alert('Vui lòng nhập OA ID và API Key.');
    }
  };
  
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLogoUploading(true);
    try {
        const filePath = `public/clinic_logo`;
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
        
        const logoUrl = `${publicUrl}?t=${new Date().getTime()}`;

        setClinicInfo(prev => ({ ...prev, logo: logoUrl }));

    } catch (error) {
        console.error("Error uploading logo:", error);
        alert("Không thể tải lên logo. Vui lòng thử lại.");
    } finally {
        setIsLogoUploading(false);
    }
  };
  
  const handleRateChange = (roleName: string, rateType: 'sales_rate' | 'service_rate', value: string) => {
    const newRate = parseFloat(value) / 100;
    if (isNaN(newRate)) return;

    setLocalCommissionRates(prevRates => 
        prevRates.map(rate => 
            rate.role === roleName ? { ...rate, [rateType]: newRate } : rate
        )
    );
  };
  
  const handleSaveCommissionRates = () => {
    onUpdateCommissionRates(localCommissionRates);
  };

  const handleOneSignalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalOneSignalSettings(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSaveOneSignal = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateOneSignalSettings(localOneSignalSettings);
  };


  return (
    <div>
      <h2 className="text-3xl font-bold text-clinic-text mb-6">Cài đặt</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Phân quyền nhân viên" className="lg:col-span-2">
            <div className="flex flex-col lg:flex-row">
                <div className="w-full lg:w-1/4 lg:border-r lg:pr-4 mb-6 lg:mb-0">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Các vai trò</h3>
                    <div className="space-y-2">
                        {roles.map(role => (
                            <button
                                key={role.id}
                                onClick={() => handleSelectRole(role)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${selectedRole?.id === role.id ? 'bg-indigo-100 text-clinic-primary' : 'hover:bg-gray-100 text-gray-700'}`}
                            >
                                {role.name}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleAddNewRole}
                        className="w-full mt-4 px-3 py-2 text-sm font-semibold rounded-md border-2 border-dashed border-gray-300 text-gray-500 hover:border-clinic-primary hover:text-clinic-primary transition-colors"
                    >
                        + Thêm vai trò mới
                    </button>
                </div>
                <div className="w-full lg:w-3/4 lg:pl-4">
                    {selectedRole ? (
                        <RoleEditor 
                            selectedRole={selectedRole}
                            onSave={handleSaveRole}
                            onDelete={onDeleteRole}
                            onCancel={() => setSelectedRole(null)}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 min-h-[200px] lg:min-h-full">
                            <p>Chọn một vai trò để chỉnh sửa hoặc tạo vai trò mới.</p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
        
        <Card title="Cài đặt Hoa hồng" className="lg:col-span-2">
            <div className="space-y-4">
                {localCommissionRates.map(rate => (
                    <div key={rate.role} className="grid grid-cols-3 items-center gap-4 p-3 bg-gray-50 rounded-md">
                        <div className="font-semibold text-gray-800">{rate.role}</div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Hoa hồng Bán hàng (%)</label>
                            <input
                                type="number"
                                value={(rate.sales_rate * 100).toFixed(2)}
                                onChange={(e) => handleRateChange(rate.role, 'sales_rate', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Hoa hồng Dịch vụ (%)</label>
                            <input
                                type="number"
                                value={(rate.service_rate * 100).toFixed(2)}
                                onChange={(e) => handleRateChange(rate.role, 'service_rate', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                ))}
            </div>
             <div className="flex justify-end pt-4 mt-4 border-t">
                <button onClick={handleSaveCommissionRates} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-clinic-primary hover:bg-indigo-700">Lưu thay đổi hoa hồng</button>
            </div>
        </Card>
        
        <Card title="Tích hợp OneSignal (Thông báo đẩy)">
            <form onSubmit={handleSaveOneSignal} className="space-y-4">
                <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-800 rounded-lg">
                    <strong className="font-bold">CẢNH BÁO BẢO MẬT:</strong> Việc lưu trữ REST API Key ở phía client (trình duyệt) tiềm ẩn rủi ro bảo mật nghiêm trọng. Bất kỳ ai cũng có thể xem và sử dụng key này để gửi thông báo. Vui lòng sử dụng tính năng này một cách thận trọng.
                </div>
                <div>
                    <label htmlFor="onesignalAppId" className="block text-sm font-medium text-gray-700">OneSignal App ID</label>
                    <input type="text" name="app_id" id="onesignalAppId" value={localOneSignalSettings.app_id || ''} onChange={handleOneSignalChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Nhập App ID của bạn" />
                </div>
                <div>
                    <label htmlFor="onesignalApiKey" className="block text-sm font-medium text-gray-700">OneSignal REST API Key</label>
                    <input type="password" name="rest_api_key" id="onesignalApiKey" value={localOneSignalSettings.rest_api_key || ''} onChange={handleOneSignalChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Nhập REST API Key"/>
                </div>
                 <div className="flex justify-end pt-2">
                    <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-clinic-primary hover:bg-indigo-700">Lưu Cài đặt OneSignal</button>
                </div>
            </form>
        </Card>

        <Card title="Thông tin phòng khám">
            <form onSubmit={handleSaveClinicInfo} className="space-y-4">
                 <div className="flex flex-col items-center">
                    <div className="relative group w-24 h-24 mb-4">
                        <img 
                            src={clinicInfo.logo} 
                            alt="Clinic Logo" 
                            className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-100 group-hover:opacity-75 transition-opacity" 
                        />
                         <label htmlFor="logo-upload" className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                            <PencilIcon className="text-white" />
                        </label>
                        <input
                            type="file"
                            id="logo-upload"
                            accept="image/png, image/jpeg"
                            onChange={handleLogoUpload}
                            disabled={isLogoUploading}
                            className="hidden"
                        />
                    </div>
                    {isLogoUploading && <p className="text-sm text-gray-500">Đang tải lên...</p>}
                </div>
                <div>
                    <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700">Tên phòng khám</label>
                    <input type="text" name="name" id="clinicName" value={clinicInfo.name} onChange={handleClinicInfoChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="clinicAddress" className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                    <input type="text" name="address" id="clinicAddress" value={clinicInfo.address} onChange={handleClinicInfoChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="clinicPhone" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                    <input type="tel" name="phone" id="clinicPhone" value={clinicInfo.phone} onChange={handleClinicInfoChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="clinicEmail" className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" name="email" id="clinicEmail" value={clinicInfo.email} onChange={handleClinicInfoChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm" />
                </div>
                <div className="flex justify-end pt-2">
                    <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-clinic-primary hover:bg-indigo-700">Lưu thay đổi</button>
                </div>
            </form>
        </Card>
        
        <Card title="Kết nối Zalo OA">
            <form onSubmit={handleConnectZalo} className="space-y-4">
                <div className="flex items-center space-x-3">
                    <ZaloIcon />
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${zaloInfo.isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                        {zaloInfo.isConnected ? 'Đã kết nối' : 'Chưa kết nối'}
                    </span>
                </div>
                <p className="text-sm text-gray-500">Kết nối Zalo Official Account để gửi tin nhắn ZNS cho khách hàng (ví dụ: nhắc lịch hẹn).</p>
                <div>
                    <label htmlFor="zaloOaId" className="block text-sm font-medium text-gray-700">OA ID</label>
                    <input type="text" name="oaId" id="zaloOaId" value={zaloInfo.oaId} onChange={handleZaloInfoChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm" placeholder="Nhập ID của Zalo OA"/>
                </div>
                <div>
                    <label htmlFor="zaloApiKey" className="block text-sm font-medium text-gray-700">API Key</label>
                    <input type="password" name="apiKey" id="zaloApiKey" value={zaloInfo.apiKey} onChange={handleZaloInfoChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm" placeholder="Nhập API Key bí mật"/>
                </div>
                <div className="flex justify-end pt-2">
                    <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-clinic-primary hover:bg-indigo-700">
                        {zaloInfo.isConnected ? 'Cập nhật & Kết nối lại' : 'Lưu & Kết nối'}
                    </button>
                </div>
            </form>
        </Card>
      </div>
    </div>
  );
};

export default Settings;