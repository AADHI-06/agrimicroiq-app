import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { sendEmailVerification, signOut } from 'firebase/auth';

const VerifyEmail = ({ onVerified }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const checkVerification = async () => {
    setLoading(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        onVerified();
      } else {
        setMessage('Email not yet verified. Please check your inbox.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await sendEmailVerification(auth.currentUser);
      setMessage('Verification email sent!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden font-body">
      <div className="editorial-card p-16 max-w-lg w-full mx-4 relative z-10 animate-reveal">
        <div className="mb-12">
          <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em] mb-4">Security Protocol</h3>
          <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase leading-[0.9]">
            Verify Your <span className="opacity-40">Email</span>
          </h1>
          <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.2em] mt-6 leading-relaxed">
            A verification link has been sent to <span className="text-white">{auth.currentUser?.email}</span>. 
            Please confirm your identity to initialize the precision farming dashboard.
          </p>
        </div>

        {message && (
          <div className="border border-green-500/20 bg-green-500/5 text-green-400 px-6 py-4 mb-8 text-[10px] font-black uppercase tracking-widest">
            {message}
          </div>
        )}

        {error && (
          <div className="border border-red-500/20 bg-red-500/5 text-red-500 px-6 py-4 mb-8 text-[10px] font-black uppercase tracking-widest">
            Error: {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <button
            onClick={checkVerification}
            disabled={loading}
            className="button-editorial w-full py-4 text-xs font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all"
          >
            {loading ? 'Processing...' : 'I have verified my email'}
          </button>
          
          <button
            onClick={resendEmail}
            disabled={loading}
            className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] hover:text-orange-500 transition-colors py-2"
          >
            Resend Verification Link
          </button>

          <button
            onClick={handleLogout}
            className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] hover:text-red-500 transition-colors py-2 mt-4"
          >
            Sign Out & Try Again
          </button>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5">
          <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">Identity Assurance v1.0</span>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
