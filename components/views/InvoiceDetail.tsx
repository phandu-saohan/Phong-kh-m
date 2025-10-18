import React from 'react';
import type { Sale } from '../../types';
// FIX: Correctly import `format` from `date-fns`
import { format } from 'date-fns';
import { ClinicIcon } from '../icons/Icons';

interface InvoiceDetailProps {
    sale: Sale;
}

// Hardcoded clinic info - in a real app, this would come from settings or a global context
const clinicInfo = {
    name: 'ClinicCRM Aesthetics',
    address: '123 Đường ABC, Phường X, Quận Y, TP. HCM',
    phone: '0987 654 321',
    email: 'info@cliniccrm.vn',
};

const InvoiceDetail = React.forwardRef<HTMLDivElement, InvoiceDetailProps>(({ sale }, ref) => {
    
    const subtotal = sale.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <div ref={ref} className="p-8 bg-white text-gray-800 font-sans text-sm max-w-4xl mx-auto">
            {/* Header Section */}
            <header className="flex justify-between items-center pb-4 mb-4 border-b">
                <div className="flex items-center">
                    <ClinicIcon className="h-10 w-10 text-clinic-primary" />
                    <div className="ml-3">
                        <h1 className="text-xl font-bold text-clinic-text">{clinicInfo.name}</h1>
                        <p className="text-xs text-gray-500">{clinicInfo.address}</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-semibold text-gray-700 uppercase">Hóa Đơn</h2>
                    <p className="text-xs text-gray-500">Mã HĐ: #{sale.id}</p>
                </div>
            </header>

            {/* Customer & Invoice Info Section */}
            <section className="grid grid-cols-2 gap-4 mb-8">
                <div>
                    <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">KHÁCH HÀNG</h3>
                    <p className="font-bold text-gray-900">{sale.customer.name}</p>
                </div>
                <div className="text-right">
                     <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">CHI TIẾT</h3>
                    <p className="text-gray-600">Ngày: {format(sale.date, 'dd/MM/yyyy')}</p>
                    <p className="text-gray-600">Nhân viên: {sale.staff.name}</p>
                </div>
            </section>

            {/* Items Table Section */}
            <section>
                <table className="w-full text-left">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-xs font-semibold uppercase text-gray-500 tracking-wider">Dịch vụ / Sản phẩm</th>
                            <th className="p-3 text-xs font-semibold uppercase text-gray-500 tracking-wider text-center">SL</th>
                            <th className="p-3 text-xs font-semibold uppercase text-gray-500 tracking-wider text-right">Đơn giá</th>
                            <th className="p-3 text-xs font-semibold uppercase text-gray-500 tracking-wider text-right">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sale.items.map((item, index) => (
                            <tr key={index} className="border-b border-gray-100">
                                <td className="p-3 align-top">
                                    <p className="font-medium text-gray-800">{item.itemName}</p>
                                    {item.technician && <p className="text-xs text-gray-500">KTV: {item.technician.name}</p>}
                                </td>
                                <td className="p-3 text-center align-top">{item.quantity}</td>
                                <td className="p-3 text-right align-top">{item.price.toLocaleString('vi-VN')}₫</td>
                                <td className="p-3 text-right align-top font-medium">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* Totals Section */}
            <section className="mt-6 flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-gray-600">Tổng tiền hàng:</span>
                        <span className="font-medium text-gray-800">{subtotal.toLocaleString('vi-VN')}₫</span>
                    </div>
                    {/* Placeholder for discounts or taxes if needed in the future */}
                    <div className="flex justify-between items-center text-lg pt-2 border-t mt-2">
                        <span className="font-bold text-gray-900">TỔNG THANH TOÁN:</span>
                        <span className="text-xl font-bold text-clinic-primary">{sale.total.toLocaleString('vi-VN')}₫</span>
                    </div>
                </div>
            </section>

            {/* Notes/Footer Section */}
            <footer className="mt-10 pt-4 border-t text-center">
                <p className="text-xs text-gray-500 italic">Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của chúng tôi!</p>
            </footer>
        </div>
    );
});

export default InvoiceDetail;