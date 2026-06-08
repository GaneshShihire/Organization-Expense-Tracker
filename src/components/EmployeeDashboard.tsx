import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, FileText, IndianRupee, Calendar, Image as ImageIcon, 
  Trash2, CheckCircle, RefreshCcw, FolderHeart, Eye, LogOut, ChevronRight
} from 'lucide-react';
import { User, Expense, ExpenseCategory } from '../types';

interface EmployeeDashboardProps {
  user: User;
  token: string;
  onLogout: () => void;
}

export default function EmployeeDashboard({ user, token, onLogout }: EmployeeDashboardProps) {
  // Blocking check
  const [blockedLocal, setBlockedLocal] = useState(!!user.isBlocked);

  // Expense Form State
  const [projectName, setProjectName] = useState('');
  const [details, setDetails] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Travelling');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [receiptType, setReceiptType] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState<string | null>(null);
  const [uploadedReceipts, setUploadedReceipts] = useState<Array<{ data: string; type: string; name: string }>>([]);

  // Dynamic category options state
  const [categoriesList, setCategoriesList] = useState<string[]>(['Travelling', 'Meals and Entertainment', 'Hardware/Materials', 'Others']);
  
  // Dynamic projects list state
  const [projectsList, setProjectsList] = useState<string[]>(['Alpha Upgrade', 'Client Onboarding', 'Marketing Summit']);

  // Status and Lists
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Drag and Drop active feedback
  const [dragActive, setDragActive] = useState(false);

  // Receipt Modal state
  const [activeReceiptsList, setActiveReceiptsList] = useState<Array<{ data: string; type: string; name?: string }> | null>(null);
  const [activeReceiptsIndex, setActiveReceiptsIndex] = useState<number>(0);
  const [activeReceiptName, setActiveReceiptName] = useState<string | null>(null);

  // Load employee's own past submissions
  const fetchExpensesList = async () => {
    setLoadingList(true);
    try {
      const response = await fetch('/api/expenses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.status === 403) {
        setBlockedLocal(true);
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses || []);
      }
    } catch (err) {
      console.error('Error fetching employee expenses:', err);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchCategoriesList = async () => {
    try {
      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.status === 403) {
        setBlockedLocal(true);
        return;
      }
      if (response.ok) {
        const data = await response.json();
        if (data.categories && data.categories.length > 0) {
          setCategoriesList(data.categories);
          // Set default to first available dynamic category if current isn't in there
          if (!data.categories.includes(category)) {
            setCategory(data.categories[0] as ExpenseCategory);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProjectsList = async () => {
    try {
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.status === 403) {
        setBlockedLocal(true);
        return;
      }
      if (response.ok) {
        const data = await response.json();
        if (data.projects && data.projects.length > 0) {
          setProjectsList(data.projects);
          if (!projectName || !data.projects.includes(projectName)) {
            setProjectName(data.projects[0]);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  useEffect(() => {
    fetchExpensesList();
    fetchCategoriesList();
    fetchProjectsList();
  }, []);

  // Handle Drag & Drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFiles = (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    
    const fileList = Array.from(files);
    const validFiles: File[] = [];
    
    for (const file of fileList) {
      // Increased single file size limit to 25MB as requested
      if (file.size > 25 * 1024 * 1024) {
        setError(`File "${file.name}" is too large. Maximum size permissible is 25MB per file.`);
        return;
      }
      validFiles.push(file);
    }

    if (uploadedReceipts.length + validFiles.length > 10) {
      setError('You can upload a maximum of 10 proof documents per expense report.');
      return;
    }

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const newAttachment = {
            data: e.target.result as string,
            type: file.type,
            name: file.name
          };
          setUploadedReceipts(prev => {
            const updated = [...prev, newAttachment];
            // Backward compatibility syncing for the first loaded receipt
            if (updated.length > 0) {
              setReceiptBase64(updated[0].data);
              setReceiptType(updated[0].type);
              setReceiptName(updated[0].name);
            }
            return updated;
          });
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeReceiptIndex = (indexToRemove: number) => {
    setUploadedReceipts(prev => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (updated.length > 0) {
        setReceiptBase64(updated[0].data);
        setReceiptType(updated[0].type);
        setReceiptName(updated[0].name);
      } else {
        setReceiptBase64(null);
        setReceiptType(null);
        setReceiptName(null);
      }
      return updated;
    });
  };

  const removeAllReceipts = () => {
    setUploadedReceipts([]);
    setReceiptBase64(null);
    setReceiptType(null);
    setReceiptName(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitSuccess(null);

    if (!projectName.trim()) {
      setError('Project Name is required.');
      return;
    }
    if (!details.trim()) {
      setError('Expense details description is required.');
      return;
    }
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please provide a valid expense amount in INR (Greater than 0).');
      return;
    }
    if (!date) {
      setError('Date of expense is required.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectName,
          details,
          category,
          amount: parsedAmount,
          date,
          receipt: receiptBase64, // backward-compatibility first fallback
          receiptType,
          receipts: uploadedReceipts // array of multiple receipts
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setSubmitSuccess('Your expense report was successfully submitted to the Accountant dashboard!');
      
      // Reset form fields
      setProjectName('');
      setDetails('');
      setCategory('Travelling');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      removeAllReceipts();

      // Refresh index history table
      await fetchExpensesList();
    } catch (err: any) {
      setError(err.message || 'System error reported while submitting');
    } finally {
      setLoading(false);
    }
  };

  // Helper metrics
  const totalSubmitted = expenses.reduce((sum, item) => sum + item.amount, 0);

  // Category Colors Map
  const categoryColors: Record<ExpenseCategory, string> = {
    'Travelling': 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]',
    'Meals and Entertainment': 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]',
    'Hardware/Materials': 'bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]',
    'Others': 'bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]'
  };

  const getCategoryColor = (cat: string) => {
    return categoryColors[cat] || 'bg-indigo-50 text-indigo-700 border-indigo-150';
  };

  if (blockedLocal) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-slate-850 rounded-3xl p-8 border border-rose-500/30 shadow-2xl text-center">
          <span className="inline-flex p-4 bg-rose-500/10 text-rose-500 rounded-full mb-4 animate-bounce">
            <svg className="w-8 h-8 font-extrabold" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </span>
          <h2 className="text-xl font-display font-extrabold text-rose-500 tracking-tight">Access Restricted</h2>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            Your accountant has deactivated or suspended your employee expense submission profile.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Please contact your accountant or organization administrator for resolution.
          </p>
          <button 
            onClick={onLogout}
            className="mt-6 w-full py-2.5 bg-slate-700 hover:bg-slate-600 transition font-bold text-xs rounded-xl"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50/80 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Employee Portal ({user.organizationName})
          </span>
          <h1 className="text-2xl font-display font-extrabold text-slate-900 mt-2">
            Welcome, {user.name}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
        </div>
        
        <button
          onClick={onLogout}
          className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-100 rounded-xl text-sm font-semibold transition"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-5 border border-slate-100 shadow-sm rounded-2xl flex flex-col">
          <span className="text-xs font-semibold text-slate-400">Total Reported (INR)</span>
          <span className="text-2xl font-display font-bold text-slate-900 mt-2">
            ₹{totalSubmitted.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="bg-white p-5 border border-slate-100 shadow-sm rounded-2xl flex flex-col">
          <span className="text-xs font-semibold text-slate-400">Submitted Proofs</span>
          <span className="text-2xl font-display font-bold text-slate-900 mt-2">
            {expenses.length} Receipts
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* SUBMISSION FORM SECTION */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <PlusCircle className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-display font-bold text-slate-900">Submit New Expense Proof</h2>
          </div>

          {submitSuccess && (
            <div className="mb-4 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-start gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800 font-medium">{submitSuccess}</div>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start gap-2.5">
              <Trash2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Project Name</label>
                <select
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {projectsList.map(proj => (
                    <option key={proj} value={proj}>{proj}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Expense Details</label>
              <textarea
                required
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Include a short description of the products or activities paid for..."
                className="mt-1 block w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1 text-xs font-bold text-slate-600 uppercase tracking-wide">
                  <IndianRupee className="w-3.5 h-3.5 text-slate-500" /> Amount in INR
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 2400"
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-1 text-xs font-bold text-slate-600 uppercase tracking-wide">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> Date of Expense
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Drag & Drop Receipt upload */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Receipt Attachments ({uploadedReceipts.length})</label>
                {uploadedReceipts.length > 0 && (
                  <button
                    type="button"
                    onClick={removeAllReceipts}
                    className="text-[10px] text-rose-600 hover:underline font-bold"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed ${
                  dragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
                } rounded-2xl p-5 text-center transition cursor-pointer relative mb-3 hover:bg-slate-50/10`}
              >
                <input
                  type="file"
                  id="receipt-file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center">
                  <ImageIcon className="w-8 h-8 text-indigo-500 mb-2" />
                  <span className="text-xs font-bold text-slate-700">Drag Multiple Google Pay / billing sheets here, or browse</span>
                  <span className="text-[10px] text-slate-400 mt-1">Supports up to 10 files (Up to 25MB per file)</span>
                </div>
              </div>

              {/* Uploaded attachments list */}
              {uploadedReceipts.length > 0 && (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto mb-3 text-slate-700">
                  {uploadedReceipts.map((rcpt, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/60 flex items-center justify-between gap-3 text-xs animate-fade-in">
                      <div className="flex items-center gap-2 overflow-hidden truncate">
                        {rcpt.type?.startsWith('image/') ? (
                          <img 
                            src={rcpt.data} 
                            alt="Attachment info" 
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0 border border-indigo-100">
                            <FileText className="w-4 h-4 text-indigo-500" />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-semibold text-slate-800 truncate">{rcpt.name || 'uploaded_invoice'}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Proof #{idx + 1} ({rcpt.type?.split('/')[1] || 'attachment'})</p>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeReceiptIndex(idx)}
                        className="p-1.5 hover:bg-slate-100 hover:text-rose-600 rounded-lg border border-slate-100 transition shrink-0"
                        title="Remove attachment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              id="btn-submit-expense"
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 transition font-bold text-sm text-white rounded-xl shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Reporting Details...' : 'Submit Expense Report'}
            </button>
          </form>
        </div>


        {/* SUBMISSIONS HISTORY SECTION */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex-1 min-h-[400px]">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h2 className="text-md font-display font-bold text-slate-900">Your Timeline</h2>
              </div>
              <button 
                onClick={fetchExpensesList}
                disabled={loadingList}
                className="text-slate-400 hover:text-indigo-600 hover:rotate-180 transition-all p-1"
                title="Refresh logs list"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>

            {loadingList ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <svg className="animate-spin h-6 w-6 text-indigo-500 mb-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-xs">Updating receipt records...</span>
              </div>
            ) : expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center">
                <FolderHeart className="w-10 h-10 text-slate-300 mb-2" />
                <span className="text-xs font-medium">No previous record reported.</span>
                <span className="text-[10px] text-slate-400 mt-1">Use the left form to submit your fast proof of payment.</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {expenses.map((exp) => (
                  <div 
                    key={exp.id} 
                    className="p-3 bg-slate-50 hover:bg-indigo-50/10 border border-slate-100 rounded-xl transition flex flex-col gap-2 relative group"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <div>
                        <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded mr-1.5 uppercase">
                          {exp.projectName}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 font-mono">
                          {exp.date}
                        </span>
                        <p className="text-xs text-slate-800 font-medium mt-1">{exp.details}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900 block font-mono">
                          ₹{exp.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] mt-1 border-t border-slate-200/50 pt-1.5 font-semibold">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block border px-1.5 py-0.5 rounded-full font-medium ${getCategoryColor(exp.category)}`}>
                          {exp.category}
                        </span>
                        
                        <span className={`inline-block border px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                          exp.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : exp.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {exp.status || 'Pending'}
                        </span>
                      </div>

                      {exp.receipts && exp.receipts.length > 0 ? (
                        <button
                          onClick={() => {
                            setActiveReceiptsList(exp.receipts || null);
                            setActiveReceiptsIndex(0);
                            setActiveReceiptName(`${exp.projectName}_${exp.date}`);
                          }}
                          className="flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 animate-fade-in"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Receipts ({exp.receipts.length})</span>
                        </button>
                      ) : exp.receipt ? (
                        <button
                          onClick={() => {
                            setActiveReceiptsList([{ data: exp.receipt!, type: exp.receiptType || 'image/jpeg', name: 'receipt' }]);
                            setActiveReceiptsIndex(0);
                            setActiveReceiptName(`${exp.projectName}_${exp.date}`);
                          }}
                          className="flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 animate-fade-in"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Receipt</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px]">No attachment</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RECEIPT PREVIEW MODAL ON SCREEN OVERLAY */}
      {activeReceiptsList && activeReceiptsList.length > 0 && (
        <div 
          onClick={() => setActiveReceiptsList(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-display font-extrabold text-slate-800 text-xs truncate uppercase tracking-wide">
                Receipt Attachments: {activeReceiptName} {activeReceiptsList.length > 1 ? `(${activeReceiptsIndex + 1}/${activeReceiptsList.length})` : ''}
              </h3>
              <button 
                onClick={() => setActiveReceiptsList(null)}
                className="bg-slate-200/60 hover:bg-slate-200 p-1.5 rounded-full text-slate-500 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>
            
            {/* Multiple receipts switcher tracker */}
            {activeReceiptsList.length > 1 && (
              <div className="bg-slate-100 flex items-center justify-between px-4 py-2 border-b border-slate-200 gap-2">
                <button
                  type="button"
                  disabled={activeReceiptsIndex === 0}
                  onClick={() => setActiveReceiptsIndex(prev => Math.max(0, prev - 1))}
                  className="px-2.5 py-1 bg-white text-[10px] font-bold text-slate-700 rounded shadow-sm hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  ◀ Previous
                </button>
                <div className="flex gap-1 overflow-x-auto py-1">
                  {activeReceiptsList.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveReceiptsIndex(idx)}
                      className={`w-4 h-4 rounded text-[10px] font-bold transition flex items-center justify-center ${activeReceiptsIndex === idx ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={activeReceiptsIndex === activeReceiptsList.length - 1}
                  onClick={() => setActiveReceiptsIndex(prev => Math.min(activeReceiptsList.length - 1, prev + 1))}
                  className="px-2.5 py-1 bg-white text-[10px] font-bold text-slate-700 rounded shadow-sm hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  Next ▶
                </button>
              </div>
            )}

            <div className="p-4 bg-slate-950 flex justify-center items-center h-[50vh] overflow-y-auto">
              {activeReceiptsList[activeReceiptsIndex].data.startsWith('data:application/pdf') ? (
                <div className="text-center text-white py-12 flex flex-col items-center">
                  <FileText className="w-16 h-16 text-indigo-400 mb-3" />
                  <p className="text-sm font-semibold">{activeReceiptsList[activeReceiptsIndex].name || 'PDF Invoice Attachment'}</p>
                  <a 
                    href={activeReceiptsList[activeReceiptsIndex].data} 
                    download={activeReceiptsList[activeReceiptsIndex].name || `receipt_${activeReceiptName}_${activeReceiptsIndex + 1}.pdf`}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold rounded-lg transition"
                  >
                    Download Invoice PDF
                  </a>
                </div>
              ) : (
                <img 
                  referrerPolicy="no-referrer"
                  src={activeReceiptsList[activeReceiptsIndex].data} 
                  alt={`Receipt Preview ${activeReceiptsIndex + 1}`} 
                  className="max-h-[45vh] max-w-full object-contain rounded-lg shadow-md"
                />
              )}
            </div>
            
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between px-4 text-center">
              <span className="text-[9px] text-slate-400 truncate max-w-[50%]">
                {activeReceiptsList[activeReceiptsIndex].name || `Attachment_${activeReceiptsIndex + 1}`}
              </span>
              <a 
                href={activeReceiptsList[activeReceiptsIndex].data} 
                download={activeReceiptsList[activeReceiptsIndex].name || `receipt_${activeReceiptsIndex + 1}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <span>Download Proof Attachment File</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
