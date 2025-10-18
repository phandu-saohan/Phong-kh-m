import React, { useState, useRef } from 'react';
import type { Sale, Permission } from '../../types';
import Card from '../common/Card';
import Modal from '../common/Modal';
import InvoiceDetail from './InvoiceDetail';
import { EyeIcon, PdfIcon } from '../icons/Icons';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface SalesProps {
  sales: Sale[];
  onNavigateToCreate: () => void;
  permissions: Set<Permission>;
}

const Sales: React.FC<SalesProps> = ({ sales, onNavigateToCreate, permissions }) => {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const componentRef = useRef<HTMLDivElement>(null);

  const handleGeneratePdf = () => {
    const input = componentRef.current;
    if (!input || !selectedSale) return;

    html2canvas(input, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const imgHeight = pdfWidth / ratio;
        
        // Check if the content fits on one page, otherwise we might need to handle multi-page.
        // For a standard invoice, it's usually fine.
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
        pdf.save(`hoa-don-${selectedSale.id}.pdf`);
    });
  };


  return (
    <>
      <Card title="Lịch sử bán hàng">
        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Tìm kiếm hóa đơn..."
            className="w-1/3 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-clinic-primary"
          />
          {permissions.has('create_sale') && (
            <button
              onClick={onNavigateToCreate}
              className="bg-clinic-primary text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              + Tạo hóa đơn mới
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã HD</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhân viên Sale</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thanh toán</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sales.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-clinic-primary">{sale.id}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{format(sale.date, 'dd/MM/yyyy')}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900">{sale.customer.name}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{sale.staff.name}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {sale.total.toLocaleString('vi-VN')}₫
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{sale.paymentMethod}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                       <button onClick={() => setSelectedSale(sale)} className="text-gray-500 hover:text-clinic-primary flex items-center">
                         <EyeIcon />
                         <span className="ml-1">Xem</span>
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      {selectedSale && (
        <Modal isOpen={!!selectedSale} onClose={() => setSelectedSale(null)} title={`Chi tiết Hóa đơn ${selectedSale.id}`}>
            <InvoiceDetail sale={selectedSale} ref={componentRef} />
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                    onClick={handleGeneratePdf}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-clinic-primary text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm"
                >
                    <PdfIcon />
                    <span className="ml-2">Tải PDF</span>
                </button>
                <button 
                    type="button" 
                    onClick={() => setSelectedSale(null)} 
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                >
                    Đóng
                </button>
            </div>
        </Modal>
      )}
    </>
  );
};

export default Sales;
