import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, PlusCircle, Search, LogOut, CheckCircle, 
  XCircle, Mail, Phone, MapPin, Image, UserCheck, UserX, 
  Key, Edit, Loader2, RefreshCw, Layers, X, Eye
} from 'lucide-react';
import { User } from '../types';

interface OwnerDashboardProps {
  user: User;
  token: string;
  onLogout: () => void;
}

export default function OwnerDashboard({ user, token, onLogout }: OwnerDashboardProps) {
  const [accountants, setAccountants] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingAccountantDetails, setViewingAccountantDetails] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tabs: 'directory' | 'add' | 'requests'
  const [activeTab, setActiveTab] = useState<'directory' | 'add' | 'requests'>('directory');

  // Change requests state
  const [profileRequests, setProfileRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Form states for creating new Accountant
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [newLogo, setNewLogo] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editing state
  const [editingAccountant, setEditingAccountant] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editOrgName, setEditOrgName] = useState('');
  const [editLogo, setEditLogo] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchProfileRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await fetch('/api/owner/profile-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProfileRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Error loading pending profile requests', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchAccountants = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/owner/accountants', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Could not retrieve accountant list. Status: ' + response.status);
      }
      const data = await response.json();
      setAccountants(data.accountants || []);
    } catch (err: any) {
      setError(err.message || 'Connecting to server directories broken.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountants();
    fetchProfileRequests();
  }, [token]);

  const handleApproveRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to approve this profile and organization update request? This will overwrite active parameters instantly.")) {
      return;
    }

    try {
      const response = await fetch(`/api/owner/profile-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Approval failed');
      }

      alert(data.message || 'Request approved successfully.');
      fetchProfileRequests();
      fetchAccountants();
    } catch (err: any) {
      alert(err.message || 'Error occurred while processing approval.');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to reject this profile change request?")) {
      return;
    }

    try {
      const response = await fetch(`/api/owner/profile-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Rejection failed');
      }

      alert(data.message || 'Request rejected successfully.');
      fetchProfileRequests();
    } catch (err: any) {
      alert(err.message || 'Error occurred while processing rejection.');
    }
  };

  const handleAddAccountant = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!newName.trim() || !newEmail.trim() || !newPassword.trim() || !newOrgName.trim()) {
      setFormError('Mandatory inputs missing: please provide full name, email password and organization name.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/owner/accountants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          organizationName: newOrgName,
          logo: newLogo,
          address: newAddress,
          phone: newPhone
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server rejected request to create accountant.');
      }

      setFormSuccess(`Accountant profile configured successfully with login matching ${newEmail}`);
      // Reset form
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewOrgName('');
      setNewLogo('');
      setNewAddress('');
      setNewPhone('');
      
      // Refresh list in directory
      fetchAccountants();
      // Auto switch back to directory after brief break
      setTimeout(() => {
        setActiveTab('directory');
        setFormSuccess(null);
      }, 2000);
    } catch (err: any) {
      setFormError(err.message || 'Server setup pipeline failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBlock = async (accountant: User) => {
    try {
      const response = await fetch(`/api/owner/accountants/${accountant.id}/toggle-block`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Request state toggle failed');
      }

      // Update locally
      setAccountants(prev => prev.map(a => {
        if (a.id === accountant.id) {
          return { ...a, isBlocked: !a.isBlocked };
        }
        return a;
      }));
    } catch (err: any) {
      alert(err.message || 'Server error changing status segment.');
    }
  };

  const startEditAccountant = (accountant: User) => {
    setEditingAccountant(accountant);
    setEditName(accountant.name);
    setEditEmail(accountant.email);
    setEditPassword(''); // empty means keep existing password
    setEditOrgName(accountant.organizationName);
    setEditLogo(accountant.logo || '');
    setEditAddress(accountant.address || '');
    setEditPhone(accountant.phone || '');
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccountant) return;

    setEditError(null);
    if (!editName.trim() || !editEmail.trim() || !editOrgName.trim()) {
      setEditError('Mandatory inputs required: name, email, and organization name.');
      return;
    }

    try {
      setIsSavingEdit(true);
      const body: any = {
        name: editName,
        email: editEmail,
        organizationName: editOrgName,
        logo: editLogo,
        address: editAddress,
        phone: editPhone
      };

      if (editPassword.trim()) {
        body.password = editPassword;
      }

      const response = await fetch(`/api/owner/accountants/${editingAccountant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to update accountant profile info.');
      }

      // Update state
      setAccountants(prev => prev.map(a => {
        if (a.id === editingAccountant.id) {
          return {
            ...a,
            name: editName,
            email: editEmail,
            organizationName: editOrgName,
            logo: editLogo,
            address: editAddress,
            phone: editPhone
          };
        }
        return a;
      }));

      setEditingAccountant(null);
    } catch (err: any) {
      setEditError(err.message || 'Transmission failed.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const filteredAccountants = accountants.filter(a => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.organizationName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 mt-6">
      
      {/* OWNER BRAND HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-20 -translate-y-20">
          <Layers className="w-96 h-96" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-bold text-indigo-300">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
              LedgerForward Owner Console
            </div>
            <h1 className="text-2xl md:text-3.5xl font-display font-extrabold tracking-tight">
              Welcome, <span className="text-indigo-300">{user.name}</span>
            </h1>
            <p className="text-xs text-slate-300 font-medium max-w-xl leading-relaxed">
              Platform owner authority. You can manually register accountants, assign credentials, customize their organizational parameters, and control operational blockades.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Email Identity</span>
              <span className="block text-xs font-semibold text-slate-200">{user.email}</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 transition font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer shadow-md shadow-rose-950/10"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* METRIC OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Accountants</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight font-mono">
              {accountants.length}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Orgs</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight font-mono">
              {accountants.filter(a => !a.isBlocked).length}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-rose-50 text-rose-600 rounded-xl">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Blocked Profiles</span>
            <span className="text-2xl font-black text-rose-600 tracking-tight font-mono">
              {accountants.filter(a => a.isBlocked).length}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition" onClick={() => setActiveTab('requests')}>
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending Requests</span>
            <span className="text-2xl font-black text-amber-600 tracking-tight font-mono">
              {profileRequests.length}
            </span>
          </div>
        </div>
      </div>

      {/* REGISTRATION & DIRECTORY NAVIGATION BLOCKS */}
      <div className="bg-slate-100/70 border border-slate-200/50 rounded-2xl p-1.5 shadow-xs flex flex-wrap gap-1.5 mb-8">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'directory'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Accountants Directory ({accountants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('add')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'add'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register New Accountant</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold rounded-xl transition cursor-pointer relative ${
            activeTab === 'requests'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Change Requests ({profileRequests.length})</span>
          {profileRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-bounce">
              {profileRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================
          1. DIRECTORY LIST TAB
          ======================================================== */}
      {activeTab === 'directory' && (
        <div className="space-y-5 animate-fade-in">
          
          {/* SEARCH INSTRUMENTS AND AUTO-REFRESH BUTTON */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Search accountants by name, email, organization info..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-medium pl-9 pr-4 py-3 bg-slate-50 border border-slate-150 rounded-xl outline-hidden focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
            
            <button
              onClick={fetchAccountants}
              className="flex items-center justify-center gap-1.5 border border-slate-200 p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer text-slate-600 text-xs font-bold shrink-0"
              title="Reload data directory"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Reset</span>
            </button>
          </div>

          {/* MAIN CONTENT AREA */}
          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-bold">Scanning corporate ledger directory indices...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl text-center">
              <p className="text-xs font-bold text-rose-700">{error}</p>
              <button
                onClick={fetchAccountants}
                className="mt-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Retry Request
              </button>
            </div>
          ) : filteredAccountants.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm text-xs">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-600">No Accountant profiles matching the criteria.</p>
              <p className="text-slate-400 mt-1 max-w-xs mx-auto">Use the tab menu above to manually configure the very first accountant credentials for system entry.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAccountants.map((acc) => (
                <div 
                  key={acc.id} 
                  className={`bg-white rounded-2xl border ${acc.isBlocked ? 'border-rose-100 bg-rose-50/20' : 'border-slate-100'} p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition duration-200`}
                >
                  <div>
                    {/* TOP HERO PROFILE SEGMENT */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                      <div className="flex items-center gap-3">
                        {acc.logo ? (
                          <img 
                            src={acc.logo} 
                            alt={`${acc.organizationName} Logo`}
                            className="w-10 h-10 rounded-xl object-contain border border-slate-200 bg-slate-50 p-1 shrink-0"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              // Fallback on visual layout load crash
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                            <Building2 className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            {acc.name}
                          </h3>
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mt-0.5">
                            {acc.organizationName}
                          </span>
                        </div>
                      </div>

                      {/* STATUS CHIP */}
                      {acc.isBlocked ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5 text-rose-500 fill-rose-50" />
                          <span>Blocked</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 fill-emerald-50" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>

                    {/* METADATA BLOCK FIELDS */}
                    <div className="space-y-2 text-xs font-medium text-slate-600 mb-6">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{acc.email}</span>
                      </div>
                      
                      {acc.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{acc.phone}</span>
                        </div>
                      )}

                      {acc.address ? (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{acc.address}</span>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 text-slate-400 font-normal">
                          <MapPin className="w-4 h-4 text-slate-300 shrink-0" />
                          <span>No address registered</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ACCOUNT MANAGEMENT ACTION CONTROLS */}
                  <div className="border-t border-slate-150 pt-4 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setViewingAccountantDetails(acc)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition text-xs font-bold py-2 px-2.5 border border-indigo-150 rounded-xl cursor-pointer"
                      title="View complete credentials and organization ID/Password info"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Credentials</span>
                    </button>

                    <button
                      onClick={() => startEditAccountant(acc)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300/80 transition text-slate-700 text-xs font-bold py-2 px-2.5 rounded-xl cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {acc.isBlocked ? (
                      <button
                        onClick={() => handleToggleBlock(acc)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 transition text-xs font-bold py-2 px-2.5 border border-emerald-200 rounded-xl cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Unblock</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleBlock(acc)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 transition text-xs font-bold py-2 px-2.5 border border-rose-200 rounded-xl cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Block</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          2. NEW REGISTRATION FORM TAB
          ======================================================== */}
      {activeTab === 'add' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm max-w-2xl mx-auto animate-fade-in">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="text-indigo-600" />
              <span>Manual Accountant Provisioning Form</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Insert a new accountant credentials. Fill in matching login configuration parameters alongside corporate organization descriptions.
            </p>
          </div>

          <form onSubmit={handleAddAccountant} className="space-y-6">
            
            {/* ALERT BOXES FOR OUTCOMES */}
            {formError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl text-xs font-bold">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl text-xs font-bold">
                {formSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* PRIMARY ACCOUNT CREDENTIALS */}
              <div className="col-span-1 md:col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                A. Admin Login Credentials
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Accountant Full Name*</label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alice Accountant"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full text-xs font-medium pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Login Email Address*</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. accountant@acme.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full text-xs font-medium pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700">Login Access Password*</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Provide a strong credentials phrase"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-xs font-medium pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* B. ORGANIZATION INFRASTRUCTURE DETAILS */}
              <div className="col-span-1 md:col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 mb-1">
                B. Corporate Organization Details
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Organization Name*</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corp Industries"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    className="w-full text-xs font-medium pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Brand Logo Image (Optional)</label>
                <div className="flex items-center gap-2.5 border border-slate-200 px-3.5 py-1.5 bg-slate-50 rounded-xl h-[42px] justify-between">
                  {newLogo ? (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img 
                        src={newLogo} 
                        alt="Company Logo Preview" 
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-lg object-contain bg-white border border-slate-200 p-0.5"
                      />
                      <span className="text-[10px] text-slate-505 truncate font-mono">Custom Logo Selected</span>
                      <button
                        type="button"
                        onClick={() => setNewLogo('')}
                        className="text-rose-500 hover:text-rose-700 font-extrabold text-xs shrink-0 px-1 hover:bg-rose-50 rounded"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">No logo uploaded yet</span>
                  )}

                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id="owner-add-logo-file-uploader"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            alert("Logo image exceeds limit (please upload images smaller than 2MB).");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result && typeof event.target.result === 'string') {
                              setNewLogo(event.target.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    <label 
                      htmlFor="owner-add-logo-file-uploader"
                      className="inline-flex items-center px-2.5 py-1 bg-white border border-slate-250 hover:bg-slate-100 text-indigo-700 font-bold text-[9.5px] rounded-lg transition cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      Upload Image
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Company Office Address (Optional)</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. 5th Floor, Tower B, Silicon Tech Park"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full text-xs font-medium pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Contact Phone Number (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. +91 90210 00000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full text-xs font-medium pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

            </div>

            {/* FORM TRIGGER ACTIONS */}
            <div className="border-t border-slate-100 pt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className="bg-slate-100 hover:bg-slate-200 transition text-slate-700 text-xs font-bold py-2.5 px-5 rounded-xl cursor-pointer"
              >
                Cancel Setup
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 transition text-white text-xs font-bold py-2.5 px-6 rounded-xl cursor-pointer shadow-md shadow-indigo-600/10"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Configuring indices...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Accountant Account</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ========================================================
          3. PENDING REQUESTS REVIEW TAB
          ======================================================== */}
      {activeTab === 'requests' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h2 className="text-base font-display font-black text-slate-800 flex items-center gap-2">
                  <Layers className="text-indigo-600" />
                  <span>Accountant Profile & Organization Change Requests</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Teammates cannot update global entity parameters without owner verification. Review, compare, and approve/reject change intents below.
                </p>
              </div>
              <button
                onClick={fetchProfileRequests}
                className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-600 text-xs font-bold"
                title="Reload pending requests"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingRequests ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingRequests ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                <span className="text-xs font-semibold">Fetching pending requests from servers...</span>
              </div>
            ) : profileRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center max-w-sm mx-auto">
                <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <span className="font-bold text-slate-700 text-sm block">All caught up!</span>
                <span className="text-xs mt-1 text-slate-400 font-medium">There are no pending profile or organization modifications waiting for your permission.</span>
              </div>
            ) : (
              <div className="space-y-6">
                {profileRequests.map((req) => (
                  <div key={req.id} className="bg-slate-50 border border-slate-200/60 rounded-3xl p-5 md:p-6 transition hover:shadow-xs">
                    
                    {/* Header bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-black text-slate-800 text-sm">
                            {req.accountantName}
                          </span>
                          <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                            ID: {req.accountantId}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Submitted on {new Date(req.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject Change</span>
                        </button>
                        <button
                          onClick={() => handleApproveRequest(req.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white transition font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs shadow-emerald-900/10"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve & Apply</span>
                        </button>
                      </div>
                    </div>

                    {/* Comparison table */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      
                      {/* Current details */}
                      <div className="bg-white border border-slate-100 p-4 rounded-2xl relative overflow-hidden">
                        <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-2">Original Profile Details</div>
                        <div className="space-y-2 font-medium text-slate-600">
                          <div>Name: <span className="font-semibold text-slate-800">{req.originalData.name}</span></div>
                          <div>Email: <span className="font-semibold text-slate-800">{req.originalData.email}</span></div>
                          <div>Organization: <span className="font-semibold text-slate-800">{req.originalData.organizationName}</span></div>
                          <div className="truncate">Logo URL: <span className="font-semibold text-slate-800">{req.originalData.logo || 'None'}</span></div>
                          <div>Phone: <span className="font-semibold text-slate-800">{req.originalData.phone || 'None'}</span></div>
                          <div>Address: <span className="font-semibold text-slate-800">{req.originalData.address || 'None'}</span></div>
                        </div>
                      </div>

                      {/* Requested details */}
                      <div className="bg-indigo-50/40 border border-indigo-100 p-4 rounded-2xl relative overflow-hidden">
                        <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2">Requested Profile Updates</div>
                        <div className="space-y-2 font-semibold text-slate-700">
                          <div>Name: <span className={`font-bold ${req.originalData.name !== req.requestedData.name ? 'text-indigo-600' : 'text-slate-800'}`}>{req.requestedData.name}</span></div>
                          <div>Email: <span className={`font-bold ${req.originalData.email !== req.requestedData.email ? 'text-indigo-600' : 'text-slate-800'}`}>{req.requestedData.email}</span></div>
                          <div>Organization: <span className={`font-bold ${req.originalData.organizationName !== req.requestedData.organizationName ? 'text-indigo-600' : 'text-slate-800'}`}>{req.requestedData.organizationName}</span></div>
                          <div className="truncate">Logo URL: <span className={`font-bold ${req.originalData.logo !== req.requestedData.logo ? 'text-indigo-600' : 'text-slate-800'}`}>{req.requestedData.logo || 'None'}</span></div>
                          <div>Phone: <span className={`font-bold ${req.originalData.phone !== req.requestedData.phone ? 'text-indigo-600' : 'text-slate-800'}`}>{req.requestedData.phone || 'None'}</span></div>
                          <div>Address: <span className={`font-bold ${req.originalData.address !== req.requestedData.address ? 'text-indigo-600' : 'text-slate-800'}`}>{req.requestedData.address || 'None'}</span></div>
                          {req.requestedData.password && (
                            <div className="text-amber-700 font-bold text-[11px] bg-amber-50 p-2 rounded-xl border border-amber-100 mt-2">
                              🔑 Master password reset has been requested
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          4. EDIT PROFILE MODAL DIALOGUE
          ======================================================== */}
      {editingAccountant && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden p-6 relative">
            
            <div className="border-b border-slate-100 pb-3 mb-5">
              <h3 className="text-base font-display font-bold text-slate-900">
                Edit Accountant & Org Profile
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                Changes persist instantly in directory indexing files.
              </p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {editError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-lg text-xs font-bold">
                  {editError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Accountant Full Name*</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Login Email Address*</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Change Password (Leave blank to keep existing)</label>
                <input
                  type="password"
                  placeholder="Insert new strong word if desired"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Organization Name*</label>
                <input
                  type="text"
                  required
                  value={editOrgName}
                  onChange={(e) => setEditOrgName(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block text-xs">Organization Brand Logo Image</label>
                <div className="flex items-center gap-2.5 border border-slate-200 px-3.5 py-1.5 bg-slate-50 rounded-xl h-[42px] justify-between">
                  {editLogo ? (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img 
                        src={editLogo} 
                        alt="Company Logo Preview" 
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-lg object-contain bg-white border border-slate-200 p-0.5"
                      />
                      <span className="text-[10px] text-slate-505 truncate font-mono">Custom Logo Selected</span>
                      <button
                        type="button"
                        onClick={() => setEditLogo('')}
                        className="text-rose-500 hover:text-rose-700 font-extrabold text-xs shrink-0 px-1 hover:bg-rose-50 rounded"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">No logo uploaded yet</span>
                  )}

                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id="owner-edit-logo-file-uploader"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            alert("Logo image exceeds limit (please upload images smaller than 2MB).");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result && typeof event.target.result === 'string') {
                              setEditLogo(event.target.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    <label 
                      htmlFor="owner-edit-logo-file-uploader"
                      className="inline-flex items-center px-2.5 py-1 bg-white border border-slate-250 hover:bg-slate-100 text-indigo-700 font-bold text-[9.5px] rounded-lg transition cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      Upload Image
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-bold text-slate-700">Contact Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-bold text-slate-700">Company Address</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* ACTION DIALOGUE SELECTIONS */}
              <div className="border-t border-slate-100 pt-4 mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingAccountant(null)}
                  className="bg-slate-100 hover:bg-slate-200 transition text-slate-700 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs py-2 px-5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          5. VIEW CREDENTIALS & ORGANIZATION DETAILS MODAL
          ======================================================== */}
      {viewingAccountantDetails && (
        <div 
          onClick={() => setViewingAccountantDetails(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden p-6 relative"
          >
            <button 
              onClick={() => setViewingAccountantDetails(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold p-1 hover:bg-slate-50 rounded-full transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="border-b border-slate-100 pb-3 mb-4">
              <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wider font-mono">Company & Accountant Registry Record</span>
              <h3 className="text-base font-display font-bold text-slate-900 mt-1">
                {viewingAccountantDetails.name} Info Sheet
              </h3>
            </div>

            <div className="space-y-4 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-150/50 rounded-2xl">
                {viewingAccountantDetails.logo ? (
                  <img 
                    src={viewingAccountantDetails.logo} 
                    alt="Organization Brand Logo"
                    className="w-12 h-12 rounded-xl object-contain border border-slate-200 bg-white p-1"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Building2 className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <p className="font-extrabold text-slate-900 text-sm">{viewingAccountantDetails.organizationName}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Org ID: {viewingAccountantDetails.organizationId || viewingAccountantDetails.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account ID</span>
                  <p className="font-mono text-slate-800 font-bold text-[10px] select-all break-all">{viewingAccountantDetails.id}</p>
                </div>

                <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Operational State</span>
                  <p className="inline-flex mt-1">
                    {viewingAccountantDetails.isBlocked ? (
                      <span className="text-red-700 bg-red-50 font-bold uppercase tracking-wider text-[9px] border border-red-200 px-2 py-0.5 rounded-full">
                        Suspended
                      </span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 font-bold uppercase tracking-wider text-[9px] border border-emerald-200 px-2 py-0.5 rounded-full">
                        Authorized
                      </span>
                    )}
                  </p>
                </div>

                <div className="p-3 border border-slate-105 rounded-xl bg-slate-50/30 col-span-2">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Staff Access Email</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <p className="font-bold text-slate-800 select-all">{viewingAccountantDetails.email}</p>
                  </div>
                </div>

                <div className="p-3 border border-indigo-100 rounded-2xl bg-indigo-50/20 col-span-2">
                  <span className="block text-[9px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Assigned Security Password</span>
                  <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 border border-indigo-100/65 rounded-xl mt-1.5">
                    <div className="flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <p className="font-mono text-slate-900 font-extrabold text-[13px] select-all">
                        {viewingAccountantDetails.password || '●●●●●●●●'}
                      </p>
                    </div>
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-indigo-600 px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded">
                      Manager
                    </span>
                  </div>
                </div>

                {viewingAccountantDetails.phone && (
                  <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 col-span-2 sm:col-span-1">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Phone</span>
                    <p className="font-bold text-slate-800 mt-0.5">{viewingAccountantDetails.phone}</p>
                  </div>
                )}

                {viewingAccountantDetails.address && (
                  <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 col-span-2 sm:col-span-1">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Registered Address</span>
                    <p className="font-semibold text-slate-700 mt-0.5 line-clamp-2 leading-tight">{viewingAccountantDetails.address}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingAccountantDetails(null)}
                className="w-full bg-slate-900 hover:bg-black transition font-bold text-xs text-white py-2.5 rounded-xl cursor-pointer"
              >
                Dismiss Details Window
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
