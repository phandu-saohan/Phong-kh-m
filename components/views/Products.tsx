import React, { useState } from 'react';
import type { Product, Permission } from '../../types';
import Card from '../common/Card';
import Modal from '../common/Modal';
import { PencilIcon, TrashIcon } from '../icons/Icons';

interface ProductsProps {
    products: Product[];
    onAddProduct: (productData: Omit<Product, 'id'>) => void;
    onUpdateProduct: (product: Product) => void;
    onDeleteProduct: (productId: string) => void;
    permissions: Set<Permission>;
}

const Products: React.FC<ProductsProps> = ({ products, onAddProduct, onUpdateProduct, onDeleteProduct, permissions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Omit<Product, 'id'> | Product | null>(null);

    const emptyProductForm = {
        name: '',
        brand: '',
        price: 0,
        stock: 0,
    };

    const handleOpenAddModal = () => {
        setCurrentProduct(emptyProductForm);
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (product: Product) => {
        setCurrentProduct(product);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentProduct(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!currentProduct) return;
        const { name, value } = e.target;
        const isNumberField = ['price', 'stock'].includes(name);
        setCurrentProduct({ ...currentProduct, [name]: isNumberField ? Number(value) : value });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentProduct) return;

        if (isEditing) {
            onUpdateProduct(currentProduct as Product);
        } else {
            onAddProduct(currentProduct as Omit<Product, 'id'>);
        }
        handleCloseModal();
    };

  return (
    <>
    <Card title="Quản lý sản phẩm">
        <div className="flex justify-between items-center mb-4">
            <input 
                type="text" 
                placeholder="Tìm kiếm sản phẩm..." 
                className="w-1/3 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-clinic-primary"
            />
            {permissions.has('add_inventory') && (
                <button onClick={handleOpenAddModal} className="bg-clinic-primary text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors">
                    + Thêm sản phẩm mới
                </button>
            )}
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
                <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên sản phẩm</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thương hiệu</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tồn kho</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{product.brand}</td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{product.price.toLocaleString('vi-VN')}₫</td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{product.stock}</td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-4">
                            {permissions.has('edit_inventory') && (
                                <button onClick={() => handleOpenEditModal(product)} className="text-clinic-primary hover:text-indigo-900 flex items-center">
                                <PencilIcon />
                                <span className="ml-1">Chỉnh sửa</span>
                                </button>
                            )}
                            {permissions.has('delete_inventory') && (
                                <button 
                                    onClick={() => onDeleteProduct(product.id)} 
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                    title="Xóa sản phẩm"
                                >
                                    <TrashIcon />
                                    <span className="ml-1">Xóa</span>
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

    {currentProduct && (
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditing ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Tên sản phẩm</label>
                <input type="text" name="name" id="name" value={currentProduct.name} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
             <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Thương hiệu</label>
                <input type="text" name="brand" id="brand" value={currentProduct.brand} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">Giá (VND)</label>
                  <input type="number" name="price" id="price" value={currentProduct.price} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
              </div>
              <div>
                  <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Tồn kho</label>
                  <input type="number" name="stock" id="stock" value={currentProduct.stock} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-clinic-primary text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">Lưu</button>
            <button type="button" onClick={handleCloseModal} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">Hủy</button>
          </div>
        </form>
      </Modal>
    )}
    </>
  );
};

export default Products;
