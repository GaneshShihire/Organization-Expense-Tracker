import { useState, useEffect } from 'react';
import { 
  Building2, ShieldCheck, HelpCircle, Loader2
} from 'lucide-react';
import LoginScreen from './components/LoginScreen';
import EmployeeDashboard from './components/EmployeeDashboard';
import AccountantDashboard from './components/AccountantDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Check persistent login session on boot
  useEffect(() => {
    const savedToken = localStorage.getItem('org_expense_token');
    
    if (!savedToken) {
      setInitializing(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${savedToken}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setToken(savedToken);
        } else {
          // Token expired or invalid
          localStorage.removeItem('org_expense_token');
        }
      } catch (err) {
        console.error('Session verification connect error:', err);
      } finally {
        setInitializing(false);
      }
    };

    verifyToken();
  }, []);

  const handleLoginSuccess = (loggedInUser: User, sessionToken: string) => {
    setUser(loggedInUser);
    setToken(sessionToken);
    localStorage.setItem('org_expense_token', sessionToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('org_expense_token');
  };

  // SplashScreen loading
  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <div className="p-3.5 bg-indigo-600 rounded-2xl shadow-indigo-100 shadow-xl text-white mb-4 animate-bounce">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-display font-extrabold text-slate-900 tracking-tight">
            Security Gates Verifying...
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
            Loading profile indices
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Top Universal Navbar banner */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="font-display font-extrabold text-sm tracking-tight text-slate-900">
              LEDGER FORWARD
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50/70 border border-emerald-100 px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>256bit Secure Tunnel</span>
          </div>
        </div>
      </header>

      <main className="pt-4">
        {!user || !token ? (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        ) : user.role === 'Owner' ? (
          <OwnerDashboard user={user} token={token} onLogout={handleLogout} />
        ) : user.role === 'Accountant' ? (
          <AccountantDashboard user={user} token={token} onLogout={handleLogout} onUserUpdate={(updatedUser) => setUser(updatedUser)} />
        ) : (
          <EmployeeDashboard user={user} token={token} onLogout={handleLogout} />
        )}
      </main>

      {/* Corporate footer */}
      <footer className="mt-8 text-center text-[10px] text-slate-400 font-medium">
        <div className="max-w-6xl mx-auto border-t border-slate-200/50 pt-5 px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p>© 2026 LedgerForward Corporate Multi-tenant. Internal Auditing Compliance Standard.</p>
          <div className="flex items-center justify-center gap-4 text-slate-500">
            <span>Security Framework: ISO/IEC 27001</span>
            <span>•</span>
            <span>Version 2.4.0 (Enterprise)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
