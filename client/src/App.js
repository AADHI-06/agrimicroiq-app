import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import FarmCreation from './pages/FarmCreation';
import Dashboard from './pages/Dashboard';
import { FarmProvider } from './context/FarmContext';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Force reload to get latest emailVerified status
        await currentUser.reload();
        setUser(auth.currentUser);
        setEmailVerified(auth.currentUser.emailVerified);
      } else {
        setUser(null);
        setEmailVerified(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setEmailVerified(false);
  };

  const handleVerified = () => {
    setEmailVerified(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 font-body">
        <div className="text-white text-xl animate-pulse tracking-[0.5em] font-black uppercase">Initializing...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={() => {}} />;
  }

  if (!emailVerified) {
    return <VerifyEmail onVerified={handleVerified} />;
  }

  return (
    <FarmProvider>
      <div className="min-h-screen bg-[#050505] text-white font-body selection:bg-orange-500/30">
        <nav className="bg-black/80 backdrop-blur-xl border-b border-white/5 px-8 py-5 flex items-center justify-between sticky top-0 z-50">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setCurrentRoute('dashboard')}
          >
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <h1 className="text-xl font-black tracking-tighter italic uppercase">
              AgriMicro <span className="opacity-40 italic-none">IQ</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setCurrentRoute('create-farm')} 
                className={`text-[9px] font-black uppercase tracking-[0.3em] transition-all hover:text-white ${currentRoute === 'create-farm' ? 'text-white' : 'text-white/30'}`}
              >
                New Deployment
              </button>
              <button 
                onClick={() => setCurrentRoute('dashboard')} 
                className={`text-[9px] font-black uppercase tracking-[0.3em] transition-all hover:text-white ${currentRoute === 'dashboard' ? 'text-white' : 'text-white/30'}`}
              >
                Command Center
              </button>
            </div>

            <div className="h-4 w-px bg-white/10" />

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em] mb-0.5">Active Operator</div>
                <div className="text-[9px] font-black text-white/60 lowercase">{user.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-white/30 hover:text-red-500 px-4 py-2 rounded-sm text-[8px] font-black uppercase tracking-widest transition-all"
              >
                Terminate
              </button>
            </div>
          </div>
        </nav>
        
        <main className="p-8 max-w-[1600px] mx-auto">
          {currentRoute === 'dashboard' ? (
            <Dashboard user={user} onLogout={handleLogout} onNavigate={setCurrentRoute} />
          ) : (
            <FarmCreation onComplete={() => setCurrentRoute('dashboard')} />
          )}
        </main>
      </div>
    </FarmProvider>
  );
}

export default App;
