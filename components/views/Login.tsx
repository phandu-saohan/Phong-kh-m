import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ClinicIcon } from '../icons/Icons';
import Card from '../common/Card';
import Modal from '../common/Modal';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // State for Forgot Password Modal
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    
    setLoading(false);
  };
  
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage('');
    setResetError('');

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin, // Redirect user back to the app after password reset
    });

    if (error) {
        setResetError('Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.');
        console.error('Password reset error:', error);
    } else {
        setResetMessage('Đã gửi liên kết đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư.');
    }

    setResetLoading(false);
  };


  return (
    <>
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md px-4">
        <div className="flex justify-center items-center mb-6">
          <ClinicIcon className="h-10 w-10 text-clinic-primary" />
          <span className="ml-3 text-3xl font-bold text-clinic-text">ClinicCRM</span>
        </div>
        <Card>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Địa chỉ Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-clinic-primary focus:ring-clinic-primary border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Nhớ đăng nhập
                </label>
              </div>

              <div className="text-sm">
                <a 
                  href="#" 
                  onClick={(e) => {
                      e.preventDefault();
                      setIsForgotPasswordOpen(true);
                  }} 
                  className="font-medium text-clinic-primary hover:text-indigo-500"
                >
                  Quên mật khẩu?
                </a>
              </div>
            </div>
            
            {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                    Lỗi đăng nhập: {error}
                </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-clinic-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-clinic-primary disabled:bg-indigo-300"
              >
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>

    <Modal isOpen={isForgotPasswordOpen} onClose={() => setIsForgotPasswordOpen(false)} title="Đặt lại mật khẩu">
        <form onSubmit={handleForgotPassword}>
            <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">Nhập địa chỉ email của bạn. Chúng tôi sẽ gửi cho bạn một liên kết để đặt lại mật khẩu.</p>
                <div>
                    <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <div className="mt-1">
                        <input
                        id="reset-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-clinic-primary focus:border-clinic-primary sm:text-sm"
                        />
                    </div>
                </div>
                {resetMessage && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{resetMessage}</p>}
                {resetError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{resetError}</p>}
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-clinic-primary text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-indigo-300"
                >
                    {resetLoading ? 'Đang gửi...' : 'Gửi liên kết'}
                </button>
                <button type="button" onClick={() => setIsForgotPasswordOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">
                    Hủy
                </button>
            </div>
        </form>
    </Modal>
    </>
  );
};

export default Login;
