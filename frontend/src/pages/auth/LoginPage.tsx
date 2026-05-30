import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { forgotPassword } from '../../api/auth';
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [showForgot, setShowForgot]         = useState(false);
  const [forgotEmail, setForgotEmail]       = useState('');
  const [forgotLoading, setForgotLoading]   = useState(false);
  const [forgotError, setForgotError]       = useState('');
  const [tempPassword, setTempPassword]     = useState('');

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      const res = await forgotPassword(forgotEmail);
      setTempPassword(res.tempPassword);
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-primary/20">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">WorkTrack</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to continue to your account</p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => { setShowForgot(true); setTempPassword(''); setForgotError(''); setForgotEmail(''); }}
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Reset Password</h2>
            <p className="text-sm text-gray-500 mb-4">Enter your email to receive a temporary password.</p>

            {tempPassword ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                  <p className="font-semibold mb-1">Your temporary password:</p>
                  <p className="text-lg font-mono tracking-widest text-green-800">{tempPassword}</p>
                  <p className="mt-2 text-xs text-green-600">Use this to log in, then change your password from your profile.</p>
                </div>
                <Button className="w-full" onClick={() => setShowForgot(false)}>Close</Button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-4">
                {forgotError && (
                  <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{forgotError}</div>
                )}
                <Input
                  label="Email address"
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  required
                  autoFocus
                />
                <div className="flex gap-3">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowForgot(false)}>Cancel</Button>
                  <Button type="submit" loading={forgotLoading} className="flex-1">Reset</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
