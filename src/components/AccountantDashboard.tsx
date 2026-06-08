import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, PlusCircle, CheckCircle, ShieldAlert,
  Calendar, FileDown, Filter, FileSpreadsheet, KeyRound,
  RefreshCcw, LogOut, Download, Eye, DollarSign, Wallet, Loader2,
  Briefcase, FolderOpen, X, Key, Mail
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { User, Expense, ExpenseCategory } from '../types';

interface AccountantDashboardProps {
  user: User;
  token: string;
  onLogout: () => void;
  onUserUpdate?: (updatedUser: User) => void;
}

export default function AccountantDashboard({ user, token, onLogout, onUserUpdate }: AccountantDashboardProps) {
  // Team Management State
  const [employees, setEmployees] = useState<User[]>([]);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPassword, setNewEmpPassword] = useState('');
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamSuccess, setTeamSuccess] = useState<string | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [viewingTeammateDetails, setViewingTeammateDetails] = useState<User | null>(null);

  // Master Expenses and Filters
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [filterProject, setFilterProject] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  
  // Navigation Menu and Status segments (Extended with 'profile', 'projects')
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'team' | 'categories' | 'projects' | 'profile'>('overview');

  // Editable accountant profile states
  const [profileName, setProfileName] = useState(user.name);
  const [profileEmail, setProfileEmail] = useState(user.email);
  const [profileOrgName, setProfileOrgName] = useState(user.organizationName);
  const [profilePassword, setProfilePassword] = useState('');
  const [profileLogo, setProfileLogo] = useState(user.logo || '');
  const [profileAddress, setProfileAddress] = useState(user.address || '');
  const [profilePhone, setProfilePhone] = useState(user.phone || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [pendingRequest, setPendingRequest] = useState<any | null>(null);

  const fetchProfileRequest = async () => {
    try {
      const response = await fetch('/api/accountant/profile-request', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPendingRequest(data.request || null);
      }
    } catch (err) {
      console.error('Error fetching pending profile changes', err);
    }
  };

  // Ensure states reflect actual updated parent/user profile properties
  useEffect(() => {
    setProfileName(user.name);
    setProfileEmail(user.email);
    setProfileOrgName(user.organizationName);
    setProfileLogo(user.logo || '');
    setProfileAddress(user.address || '');
    setProfilePhone(user.phone || '');
    fetchProfileRequest();
  }, [user, token]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!profileName.trim() || !profileEmail.trim() || !profileOrgName.trim()) {
      setProfileError("Full Name, Email and Organization Name are required.");
      return;
    }

    try {
      setProfileLoading(true);
      const body: any = {
        name: profileName.trim(),
        email: profileEmail.trim(),
        organizationName: profileOrgName.trim(),
        logo: profileLogo.trim(),
        address: profileAddress.trim(),
        phone: profilePhone.trim()
      };

      if (profilePassword.trim()) {
        body.password = profilePassword.trim();
      }

      const response = await fetch(`/api/owner/accountants/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server rejected profile updates.');
      }

      setProfileSuccess('Your profile details have been saved and applied successfully!');
      setProfilePassword('');
      if (data.accountant && onUserUpdate) {
        onUserUpdate(data.accountant);
      }
      fetchProfileRequest();
    } catch (err: any) {
      setProfileError(err.message || 'Connecting to server failed.');
    } finally {
      setProfileLoading(false);
    }
  };
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Active Receipt Preview modal overlay
  const [activeReceiptsList, setActiveReceiptsList] = useState<Array<{ data: string; type: string; name?: string }> | null>(null);
  const [activeReceiptsIndex, setActiveReceiptsIndex] = useState<number>(0);
  const [activeReceiptTitle, setActiveReceiptTitle] = useState<string | null>(null);

  // Dynamic categories state
  const [categoriesList, setCategoriesList] = useState<string[]>(['Travelling', 'Meals and Entertainment', 'Hardware/Materials', 'Others']);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySuccess, setCategorySuccess] = useState<string | null>(null);

  // Dynamic projects state
  const [projectsList, setProjectsList] = useState<string[]>(['Alpha Upgrade', 'Client Onboarding', 'Marketing Summit']);
  const [newProjectName, setNewProjectName] = useState('');
  const [projectError, setProjectError] = useState<string | null>(null);
  const [projectSuccess, setProjectSuccess] = useState<string | null>(null);
  const [selectedProjectTabName, setSelectedProjectTabName] = useState<string>('');

  // Load team list (employees in same Org ID)
  const fetchTeamList = async () => {
    try {
      const response = await fetch('/api/admin/employees', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error('Error listing team:', err);
    }
  };

  // Load Categories list
  const fetchCategoriesList = async () => {
    try {
      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.categories) {
          setCategoriesList(data.categories);
        }
      }
    } catch (err) {
      console.error('Error fetching categories list:', err);
    }
  };

  // Load Projects list
  const fetchProjectsList = async () => {
    try {
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.projects) {
          setProjectsList(data.projects);
        }
      }
    } catch (err) {
      console.error('Error fetching projects list:', err);
    }
  };

  // Load Organization Expenses
  const fetchExpensesList = async () => {
    setLoadingExpenses(true);
    try {
      // Build filter queries
      const queryParams = new URLSearchParams();
      if (filterProject.trim()) queryParams.append('projectName', filterProject);
      if (filterEmployeeId) queryParams.append('employeeId', filterEmployeeId);
      if (filterStartDate) queryParams.append('startDate', filterStartDate);
      if (filterEndDate) queryParams.append('endDate', filterEndDate);
      if (filterStatus) queryParams.append('status', filterStatus);

      const response = await fetch(`/api/expenses?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses || []);
      }
    } catch (err) {
      console.error('Error fetching accountant expenses:', err);
    } finally {
      setLoadingExpenses(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError(null);
    setCategorySuccess(null);
    if (!newCategoryName.trim()) {
      setCategoryError('Category name cannot be empty');
      return;
    }
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ category: newCategoryName })
      });
      const data = await response.json();
      if (response.ok) {
        setCategoriesList(data.categories);
        setNewCategoryName('');
        setCategorySuccess('Category registered successfully.');
      } else {
        setCategoryError(data.error || 'Failed to register category');
      }
    } catch (err) {
      console.error('Add category error:', err);
      setCategoryError('System connection error');
    }
  };

  const handleDeleteCategory = async (catToDelete: string) => {
    setCategoryError(null);
    setCategorySuccess(null);
    try {
      const response = await fetch('/api/categories/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ category: catToDelete })
      });
      const data = await response.json();
      if (response.ok) {
        setCategoriesList(data.categories);
        setCategorySuccess('Category removed successfully.');
      } else {
        setCategoryError(data.error || 'Failed to remove category');
      }
    } catch (err) {
      console.error('Delete category error:', err);
      setCategoryError('System connection error');
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjectError(null);
    setProjectSuccess(null);
    if (!newProjectName.trim()) {
      setProjectError('Project name cannot be empty');
      return;
    }
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ project: newProjectName.trim() })
      });
      const data = await response.json();
      if (response.ok) {
        setProjectsList(data.projects);
        setNewProjectName('');
        setProjectSuccess('Dynamic project registered successfully.');
      } else {
        setProjectError(data.error || 'Failed to register project');
      }
    } catch (err) {
      console.error('Add project error:', err);
      setProjectError('System connection error');
    }
  };

  const handleDeleteProject = async (projToDelete: string) => {
    if (!confirm(`Are you sure you want to remove project "${projToDelete}"? This will restrict team members from selecting it on new expense submissions.`)) {
      return;
    }
    setProjectError(null);
    setProjectSuccess(null);
    try {
      const response = await fetch('/api/projects/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ project: projToDelete })
      });
      const data = await response.json();
      if (response.ok) {
        setProjectsList(data.projects);
        setProjectSuccess('Dynamic project removed successfully.');
      } else {
        setProjectError(data.error || 'Failed to remove project');
      }
    } catch (err) {
      console.error('Delete project error:', err);
      setProjectError('System connection error');
    }
  };

  const handleToggleBlockEmployee = async (empId: string) => {
    try {
      const response = await fetch(`/api/admin/employees/${empId}/toggle-block`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchTeamList();
        fetchExpensesList();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to change employee access status.');
      }
    } catch (err) {
      console.error('Error toggling block employee state:', err);
    }
  };

  const handleUpdateExpenseStatus = async (expenseId: string, newStatus: 'Approved' | 'Rejected') => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchExpensesList();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update expense status.');
      }
    } catch (err) {
      console.error('Error changing expense status:', err);
    }
  };

  useEffect(() => {
    fetchTeamList();
    fetchCategoriesList();
    fetchProjectsList();
    fetchExpensesList();
  }, []);

  useEffect(() => {
    fetchExpensesList();
  }, [filterProject, filterEmployeeId, filterStartDate, filterEndDate, filterStatus]);

  // Create new Employee Account (gated and secured)
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeamSuccess(null);
    setTeamError(null);

    if (!newEmpName.trim()) {
      setTeamError('Employee Display Name is required');
      return;
    }
    if (!newEmpEmail.trim()) {
      setTeamError('Security login email is required');
      return;
    }
    if (!newEmpPassword || newEmpPassword.length < 6) {
      setTeamError('Employee security password must be at least 6 characters long');
      return;
    }

    setTeamLoading(true);

    try {
      const response = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newEmpName,
          email: newEmpEmail,
          password: newEmpPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Provisioning failed');
      }

      setTeamSuccess(`Account created successfully for Employee ${newEmpName}! Direct them to log in with: ${newEmpEmail}`);
      
      // Reset team creation state
      setNewEmpName('');
      setNewEmpEmail('');
      setNewEmpPassword('');

      // Refresh list
      await fetchTeamList();
    } catch (err: any) {
      setTeamError(err.message || 'Error occurred while creating teammate credentials');
    } finally {
      setTeamLoading(false);
    }
  };

  // Enhanced Reusable PDF Export Engine (perfect matching with visual PDF structure and receipt alignments)
  const exportReportToPdf = (selectedExpenses: Expense[], reportType: 'Employee' | 'Project' | 'Consolidated' | 'Filtered', targetName: string, targetEmail?: string) => {
    // If it is not an Employee or Project dashboard and contains 0 elements, alert normally
    if (selectedExpenses.length === 0 && reportType !== 'Employee' && reportType !== 'Project') {
      alert("No expenses listed under this criteria to generate custom report.");
      return;
    }

    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    const reportId = `ER-${Math.floor(10000 + Math.random() * 90000)}`;
    const currentDate = new Date().toLocaleDateString('en-GB'); // "03/06/2026" or "dd/mm/yyyy"

    // Calc total amount
    const totalAmount = selectedExpenses.reduce((sum, item) => sum + item.amount, 0);

    // --- PAGE 1: LEDGER COVER & DATA DETAILS ---
    // Drawing corporate accent line at the top
    doc.setFillColor(22, 163, 74); // green accent
    doc.rect(0, 0, 210, 6, 'F');

    // Drawing corporate circular arrow emblem on the left or custom brand logo
    const cx = 45;
    const cy = 48;
    let logoSuccess = false;

    if (user.logo && user.logo.trim()) {
      try {
        // Try embedding the organization logo. If it fails due to CORS or bad format, it catches error gracefully.
        doc.addImage(user.logo.trim(), 'JPEG', 25, 23, 40, 40, undefined, 'FAST');
        logoSuccess = true;
      } catch (err) {
        console.warn("Could not draw custom logo image directly. Falling back to platform emblem.", err);
      }
    }

    if (!logoSuccess) {
      // Draw 3 layers of concentric/overlapping colored rings (to simulate circular arrows)
      doc.setFillColor(34, 197, 94); // Green ring
      doc.ellipse(cx, cy, 21, 21, 'F');
      doc.setFillColor(59, 130, 246); // Blue ring overlay
      doc.ellipse(cx, cy, 19, 19, 'F');
      doc.setFillColor(249, 115, 22); // Orange ring overlay
      doc.ellipse(cx, cy, 17, 17, 'F');
      
      // Punch out inner white container
      doc.setFillColor(255, 255, 255);
      doc.ellipse(cx, cy, 13, 13, 'F');

      // Draw little dark slate pitched house inside center representing renewable energy housing
      doc.setFillColor(51, 65, 85); // Slate
      doc.rect(cx - 8, cy + 0.5, 16, 8, 'F'); // house body
      doc.setFillColor(30, 41, 59); // dark slate roof
      doc.triangle(cx - 10.5, cy + 0.5, cx, cy - 8, cx + 10.5, cy + 0.5, 'F'); // roof triangle
      
      // Windows in the house
      doc.setFillColor(255, 255, 255);
      doc.rect(cx - 5, cy + 2.5, 3, 3, 'F');
      doc.rect(cx + 2, cy + 2.5, 3, 3, 'F');
    }

    // Company/Organization details underneath the logo
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14.5);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(`${user.organizationName}`, 15, 83);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // slate-500
    
    // Use saved address, phone, and contact details instead of hardcoded strings
    const cityAddress = user.address && user.address.trim() ? user.address.trim() : "Sector 44, Mahape, Navi Mumbai, India";
    const userPhoneNum = user.phone && user.phone.trim() ? user.phone.trim() : "9272091652";
    const userCompanyEmail = user.email && user.email.trim() ? user.email.trim() : "accountant@acme.com";

    doc.text(cityAddress, 15, 88);
    doc.text(`Phone: ${userPhoneNum}`, 15, 92);
    doc.text(`Contact: ${userCompanyEmail}`, 15, 96);

    // --- RIGHT SIDE: EXPENSE REPORT TYPOGRAPHY & STATUS BLOCK ---
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(26);
    doc.setTextColor(71, 85, 105);
    doc.text("Expense Report", 195, 28, { align: 'right' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(100, 116, 139);
    doc.text(reportId, 195, 34, { align: 'right' });
    
    // Determine the overall status of the report based on all individual expense statuses
    const statuses = selectedExpenses.map(e => e.status || 'Approved');
    let overallStatus = "Approved";
    let statusLabel = "Approved";
    let statusColor = [22, 163, 74]; // green [R, G, B]
    
    if (statuses.every(s => s === 'Approved')) {
      overallStatus = "Approved";
      statusLabel = "Approved / Reimbursed";
      statusColor = [22, 163, 74];
    } else if (statuses.every(s => s === 'Rejected')) {
      overallStatus = "Rejected";
      statusLabel = "Rejected / Disallowed";
      statusColor = [220, 38, 38];
    } else if (statuses.every(s => s === 'Pending')) {
      overallStatus = "Pending Review";
      statusLabel = "Pending Audit Review";
      statusColor = [217, 119, 6];
    } else {
      overallStatus = "Mixed";
      const approvedCount = statuses.filter(s => s === 'Approved').length;
      const pendingCount = statuses.filter(s => s === 'Pending').length;
      const rejectedCount = statuses.filter(s => s === 'Rejected').length;
      statusLabel = `Mixed (${approvedCount} Appr, ${pendingCount} Pend, ${rejectedCount} Rej)`;
      statusColor = [79, 70, 229]; // indigo
    }

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(statusLabel, 195, 39, { align: 'right' });

    // Amount Sector
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Audit Total Amount", 195, 49, { align: 'right' });

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(21);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(`Rs.${totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 195, 57, { align: 'right' });

    // Review/Verification Date
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    let dateLabel = "Audit Verified On";
    if (overallStatus === "Approved") dateLabel = "Approved On";
    else if (overallStatus === "Rejected") dateLabel = "Rejected On";
    else if (overallStatus === "Pending Review") dateLabel = "Submitted On";
    doc.text(dateLabel, 195, 65, { align: 'right' });

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    doc.text(currentDate, 195, 70, { align: 'right' });

    // Dividers
    doc.setDrawColor(226, 232, 240); // slate-200 divider
    doc.setLineWidth(0.4);
    doc.line(15, 106, 195, 106);

    // --- REPORT TITLE SECTION ---
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Report", 15, 114);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);

    let reportTitle = targetName;
    if (reportType === 'Project') {
      reportTitle = `Project Report: ${targetName}`;
    } else if (reportType === 'Employee') {
      reportTitle = `Employee Audit: ${targetName}`;
    } else if (reportType === 'Filtered') {
      reportTitle = `Custom Filter Audit: ${targetName}`;
    } else {
      reportTitle = `Consolidated Accounts Audit Report`;
    }

    doc.text(reportTitle, 15, 120);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    let reportDesc = `Aggregated site and ledger accounts audits for ${reportType.toLowerCase()} context (${selectedExpenses.length} transactions total).`;
    doc.text(reportDesc, 15, 125);

    // Approved On Date side element
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Approved On", 140, 114);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    doc.text(currentDate, 140, 119.5);

    // Sub-ledger metadata grids
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.3);
    doc.line(15, 131, 195, 131);

    // Metadata headers
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Submitted By", 15, 137);
    doc.text("Report To", 80, 137);
    doc.text("Submitted On", 145, 137);

    // Values
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);

    let submittedByName = "Multiple Teammates";
    let submittedByEmail = "team@injectsolar.com";
    if (reportType === 'Employee') {
      submittedByName = targetName;
      submittedByEmail = targetEmail || (selectedExpenses.length > 0 ? selectedExpenses[0].userEmail : "employee@injectsolar.com");
    } else if (selectedExpenses.length > 0) {
      submittedByName = selectedExpenses[0].userName;
      submittedByEmail = selectedExpenses[0].userEmail;
    }

    doc.text(submittedByName, 15, 142.5);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(submittedByEmail, 15, 146.5);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(user.name || "Accountant", 80, 142.5);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(user.email || "accountant@company.com", 80, 146.5);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(currentDate, 145, 142.5);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Report Duration", 145, 148);
    
    // Sort and calculate chronological dates in range
    const sortedDates = [...selectedExpenses].map(e => e.date).sort();
    const durationStr = sortedDates.length > 0 ? `${sortedDates[0].split('-').reverse().join('/')} - ${sortedDates[sortedDates.length - 1].split('-').reverse().join('/')}` : `${currentDate} - ${currentDate}`;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(durationStr, 145, 153.5);

    // Divider before expense table
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(15, 161, 195, 161);

    // --- EXPENSE SUMMARY SECTION ---
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("EXPENSE SUMMARY", 15, 169);

    // Table Row headers at y = 173
    let y = 173;
    doc.setFillColor(45, 55, 72); // Charcoal slate header
    doc.rect(15, y, 180, 8, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    
    doc.text('S.No', 17, y + 5.5);
    doc.text('Expense Details', 31, y + 5.5);
    doc.text('Category', 95, y + 5.5);
    doc.text('Amount (INR)', 193, y + 5.5, { align: 'right' });

    y += 8;

    if (selectedExpenses.length === 0) {
      // Border separator line
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(15, y, 195, y);

      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text("1.", 17, y + 6);
      doc.text("No reported expense entries found under this ledger period.", 31, y + 6);
      y += 12;
    } else {
      selectedExpenses.forEach((exp, index) => {
        // Check pagination threshold for Page 1 body
        if (y > 262) {
          doc.addPage();
          y = 20;

          // Redraw table header elements on subsequent sheet
          doc.setFillColor(45, 55, 72);
          doc.rect(15, y, 180, 8, 'F');
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(255, 255, 255);
          
          doc.text('S.No', 17, y + 5.5);
          doc.text('Expense Details', 31, y + 5.5);
          doc.text('Category', 95, y + 5.5);
          doc.text('Amount (INR)', 193, y + 5.5, { align: 'right' });
          y += 8;
        }

        // Border separator line
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.2);
        doc.line(15, y, 195, y);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);

        // Value column content placement
        doc.text(`${index + 1}.`, 17, y + 6);

        // Date & Project Detail stack
        const formattedItemDate = exp.date.split('-').reverse().join('/');
        doc.setFont('Helvetica', 'bold');
        doc.text(formattedItemDate, 31, y + 6);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(`Submitted By : ${exp.userName ? exp.userName.toUpperCase() : 'UNKNOWN'}`, 31, y + 10);

        // Category / details description paragraph wrapping
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const rowStatusLabel = exp.status ? `[${exp.status.toUpperCase()}]` : '[PENDING]';
        doc.text(`${exp.category} ${rowStatusLabel}`, 95, y + 6);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        const customWrappedText = doc.splitTextToSize(exp.details, 60);
        doc.text(customWrappedText, 95, y + 10);

        // Price right-aligned stack
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(`Rs.${exp.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 193, y + 7, { align: 'right' });

        const textLines = customWrappedText.length || 1;
        const computedRowSpacing = Math.max(15, 7.5 + (textLines * 3));
        y += computedRowSpacing;
      });
    }

    // Close the table boundary line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(15, y, 195, y);

    // --- PAGE 2: COMPREHENSIVE SETTLEMENT SUMMARY CONTROLLER ---
    doc.addPage();
    let rsy = 20;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("REPORT SUMMARY BY CURRENCY", 15, rsy);

    rsy += 6;

    // Table Border double lines
    doc.setDrawColor(180, 190, 200);
    doc.setLineWidth(0.4);
    doc.line(15, rsy, 195, rsy); 
    
    rsy += 6;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text("TOTAL", 15, rsy);
    doc.text("INR", 193, rsy, { align: 'right' });

    rsy += 3;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.line(15, rsy, 195, rsy); 

    rsy += 8;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Total Expense Amount", 15, rsy);
    doc.text(totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2}), 193, rsy, { align: 'right' });

    rsy += 8;
    doc.text("Non Reimbursable Amount", 15, rsy);
    doc.text("(-) 0.00", 193, rsy, { align: 'right' });

    rsy += 8;
    doc.text("Advance Amount Received", 15, rsy);
    doc.text("(-) 0.00", 193, rsy, { align: 'right' });

    rsy += 4;
    // Solid highlighted box
    doc.setFillColor(241, 245, 249);
    doc.rect(15, rsy, 180, 10, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    let summaryText = "Net Audited Ledger Amount";
    if (overallStatus === "Approved") summaryText = "Total Reimbursed Amount";
    else if (overallStatus === "Rejected") summaryText = "Total Rejected Amount";
    else if (overallStatus === "Pending Review") summaryText = "Total Pending Audit Amount";
    doc.text(summaryText, 18, rsy + 6.5);
    doc.text(`Rs.${totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 192, rsy + 6.5, { align: 'right' });

    rsy += 20;

    // General Summary formula blocks
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("REPORT SUMMARY", 15, rsy);

    rsy += 5;
    doc.setDrawColor(180, 190, 200);
    doc.setLineWidth(0.4);
    doc.line(15, rsy, 195, rsy);

    rsy += 10;
    
    // Total Expense
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Total Expense", 18, rsy);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`Rs.${totalAmount.toLocaleString('en-IN')}`, 18, rsy + 4.5);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text("( - )", 54, rsy + 2.5);

    // Non-Reimbursable
    doc.setTextColor(100, 116, 139);
    doc.text("Non Reimbursable", 70, rsy);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text("Rs.0.00", 70, rsy + 4.5);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text("( - )", 112, rsy + 2.5);

    // Advance
    doc.setTextColor(100, 116, 139);
    doc.text("Advance Received", 128, rsy);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text("Rs.0.00", 128, rsy + 4.5);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text("( = )", 164, rsy + 2.5);

    // Net Reimbursed / audited
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    let formulaSummaryText = "Net Ledger Total";
    if (overallStatus === "Approved") formulaSummaryText = "Total Reimbursed";
    else if (overallStatus === "Rejected") formulaSummaryText = "Total Disallowed";
    else if (overallStatus === "Pending Review") formulaSummaryText = "Pending Total";
    doc.text(formulaSummaryText, 175, rsy);
    doc.setFont('Helvetica', 'bold');
    doc.text(`Rs.${totalAmount.toLocaleString('en-IN')}`, 175, rsy + 4.5);

    rsy += 15;
    doc.setDrawColor(180, 190, 200);
    doc.line(15, rsy, 195, rsy);

    rsy += 24;

    // Signature authorization tracks
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);

    doc.text("Submitted By", 15, rsy);
    doc.text("Approved By", 115, rsy);

    doc.setDrawColor(226, 232, 240);
    doc.line(15, rsy + 14, 75, rsy + 14);
    doc.line(115, rsy + 14, 175, rsy + 14);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(submittedByName, 15, rsy + 18.5);
    doc.text(user.name, 115, rsy + 18.5);

    // --- PAGE 3+: EMBEDDED RECEIPT SCREENS AND PAYMENT PROOFS ---
    const receiptsToRender: Array<{
      exp: Expense;
      data: string;
      name?: string;
      type: string;
    }> = [];

    selectedExpenses.forEach(exp => {
      if (exp.receipts && exp.receipts.length > 0) {
        exp.receipts.forEach((rc, rIdx) => {
          receiptsToRender.push({
            exp,
            data: rc.data,
            name: rc.name || `Proof #${rIdx + 1}`,
            type: rc.type
          });
        });
      } else if (exp.receipt) {
        receiptsToRender.push({
          exp,
          data: exp.receipt,
          name: 'Proof #1',
          type: exp.receiptType || 'image/jpeg'
        });
      }
    });

    receiptsToRender.forEach((receiptItem, idx) => {
      const { exp, data, name } = receiptItem;
      doc.addPage();

      // Flat slate top banner
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 210, 20, 'F');

      // Title header
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(`RECEIPT PROOF: ${exp.projectName.toUpperCase()} (${name}) - [Rs. ${exp.amount.toLocaleString()}]`, 15, 12.5);

      // Grid metadata specs card box
      doc.setFillColor(248, 250, 252);
      doc.rect(15, 28, 180, 20, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, 28, 180, 20, 'D');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(`Teammate Submitter: ${exp.userName} (${exp.userEmail})`, 18, 34);
      doc.text(`Event Logged: ${exp.date.split('-').reverse().join('/')} | Category: ${exp.category}`, 18, 39);
      
      const briefDescText = exp.details.length > 95 ? `${exp.details.substring(0, 92)}...` : exp.details;
      doc.setFont('Helvetica', 'normal');
      doc.text(`Details Description: ${briefDescText}`, 18, 44);

      if (data) {
        if (data.startsWith('data:application/pdf')) {
          // Drawing a beautifully styled container for physical PDF documents that are embedded
          doc.setFillColor(239, 246, 255);
          doc.rect(15, 54, 180, 50, 'F');
          doc.setDrawColor(59, 130, 246);
          doc.rect(15, 54, 180, 50, 'D');

          doc.setFont('Helvetica', 'bold');
          doc.setTextColor(29, 78, 216);
          doc.text("📄 ATTACHED EVIDENCE IS A SYSTEM PDF DOCUMENT", 20, 74);
          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text("You can view, save or print the PDF directly from the transaction timeline overlay link.", 20, 80);
          doc.text(`File reference name: ${name || 'document.pdf'}`, 20, 86);
        } else {
          try {
            let format = 'JPEG';
            if (data.includes('image/png')) format = 'PNG';
            else if (data.includes('image/webp')) format = 'WEBP';

            // Embed images centered nicely maintaining clear visual height scaling in A4 page body limits
            doc.addImage(data, format, 22, 54, 166, 224, undefined, 'FAST');
          } catch (err) {
            console.error("Embedding image attachment failed context:", err);
            doc.setFillColor(254, 242, 242);
            doc.rect(15, 54, 180, 50, 'F');
            doc.setDrawColor(239, 68, 68);
            doc.rect(15, 54, 180, 50, 'D');

            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(220, 38, 38);
            doc.text("⚠️ ATTACHED PROOF LOADING ERROR", 20, 74);
            doc.setFont('Helvetica', 'normal');
            doc.text("Highly compressed content, corrupted payload, or unsupported file type.", 20, 80);
          }
        }
      }
    });

    const fileSafeSegment = `${reportType}_${targetName.replace(/\s+/g, '_')}_Expense_Audit_Ledger.pdf`;
    doc.save(fileSafeSegment);
  };

  // Reusable standalone CSV export generator
  const exportReportToCsv = (selectedExpenses: Expense[], reportType: 'Employee' | 'Project' | 'Consolidated' | 'Filtered', targetName: string, targetEmail?: string) => {
    // If it is not an Employee or Project dashboard and contains 0 elements, alert normally
    if (selectedExpenses.length === 0 && reportType !== 'Employee' && reportType !== 'Project') {
      alert("No expenses listed under this criteria to generate standard CSV data sheets.");
      return;
    }

    const headers = [
      "ID",
      "Employee Name",
      "Employee Email",
      "Project Name",
      "Category",
      "Amount",
      "Currency",
      "Status",
      "Submitted Date",
      "Notes & Purpose"
    ];

    let rows: string[][] = [];
    if (selectedExpenses.length === 0) {
      const empName = reportType === 'Employee' ? targetName : 'N/A';
      const empEmail = reportType === 'Employee' ? (targetEmail || 'N/A') : 'N/A';
      const currentDate = new Date().toLocaleDateString('en-GB');
      rows = [["EMPTY", empName, empEmail, "N/A", "N/A", "0", "INR", "N/A", currentDate, "No expense logs tracked in standard ledger history for this timeline"]];
    } else {
      rows = selectedExpenses.map(item => {
        const empName = item.userName || "Unknown Employee";
        const empEmail = item.userEmail || "N/A";
        const prName = item.projectName || "General Unassigned";
        const categ = item.category || "Travelling";
        const sumVal = item.amount.toString();
        const curr = "INR";
        const stat = item.status || "Approved";
        const dateSub = new Date(item.createdAt).toLocaleDateString('en-GB');
        const descr = item.details ? `"${item.details.replace(/"/g, '""')}"` : '""';

        return [item.id, empName, empEmail, prName, categ, sumVal, curr, stat, dateSub, descr];
      });
    }

    const csvData = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `${reportType}_${targetName.replace(/\s+/g, '_')}_Ledger_Export.csv`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper dispatcher to initiate export for individual employee
  const handleExportEmployeePdf = (emp: User) => {
    const empExpenses = expenses.filter(e => e.userId === emp.id || e.userEmail === emp.email);
    exportReportToPdf(empExpenses, 'Employee', emp.name, emp.email);
  };

  const handleExportEmployeeCsv = (emp: User) => {
    const empExpenses = expenses.filter(e => e.userId === emp.id || e.userEmail === emp.email);
    exportReportToCsv(empExpenses, 'Employee', emp.name, emp.email);
  };

  const handleExportAllEmployeesPdf = () => {
    if (employees.length === 0) {
      alert("No registered employee profiles found to export standard reports.");
      return;
    }
    employees.forEach((emp, index) => {
      setTimeout(() => {
        const empExpenses = expenses.filter(e => e.userId === emp.id || e.userEmail === emp.email);
        exportReportToPdf(empExpenses, 'Employee', emp.name, emp.email);
      }, index * 400); 
    });
  };

  const handleExportAllEmployeesCsv = () => {
    if (employees.length === 0) {
      alert("No registered employee profiles found to export standard spreadsheets.");
      return;
    }
    employees.forEach((emp, index) => {
      setTimeout(() => {
        const empExpenses = expenses.filter(e => e.userId === emp.id || e.userEmail === emp.email);
        exportReportToCsv(empExpenses, 'Employee', emp.name, emp.email);
      }, index * 400);
    });
  };

  const handleExportSelectedProjectsPdf = () => {
    if (selectedProjects.length === 0) {
      alert("Please select at least one project from the selection list first.");
      return;
    }

    const filteredExpenses = expenses.filter(e => {
      const pName = e.projectName ? e.projectName.trim() : 'General Unassigned';
      return selectedProjects.includes(pName);
    });

    if (filteredExpenses.length === 0) {
      alert("The selected projects do not have any logged expense transactions.");
      return;
    }

    const reportLabel = selectedProjects.length === 1 
      ? `Project: ${selectedProjects[0]}` 
      : `${selectedProjects.length} Selected Projects`;

    exportReportToPdf(filteredExpenses, 'Project', reportLabel);
  };

  const handleExportSelectedProjectsCsv = () => {
    if (selectedProjects.length === 0) {
      alert("Please select at least one project from the selection list first.");
      return;
    }

    const filteredExpenses = expenses.filter(e => {
      const pName = e.projectName ? e.projectName.trim() : 'General Unassigned';
      return selectedProjects.includes(pName);
    });

    if (filteredExpenses.length === 0) {
      alert("The selected projects do not have any logged expense transactions.");
      return;
    }

    const reportLabel = selectedProjects.length === 1 
      ? `Project: ${selectedProjects[0]}` 
      : `${selectedProjects.length} Selected Projects`;

    exportReportToCsv(filteredExpenses, 'Project', reportLabel);
  };

  // Extract list of unique projects with totals in order to generate separate reports easily
  const getProjectLedgerBreakdown = () => {
    const tableProjMap: Record<string, Expense[]> = {};
    expenses.forEach(e => {
      const pName = e.projectName ? e.projectName.trim() : 'General Unassigned';
      if (!tableProjMap[pName]) {
        tableProjMap[pName] = [];
      }
      tableProjMap[pName].push(e);
    });

    return Object.entries(tableProjMap).map(([pName, logs]) => ({
      name: pName,
      items: logs,
      totalAmount: logs.reduce((sum, item) => sum + item.amount, 0)
    })).sort((a, b) => b.totalAmount - a.totalAmount);
  };

  const generatePdfReport = () => {
    // Falls back to direct current filter view exports
    if (expenses.length === 0) {
      alert("No expenses listed under current filters to export.");
      return;
    }

    let reportCtxLabel = "General Organizational Ledger";
    let filterType: 'Employee' | 'Project' | 'Consolidated' | 'Filtered' = 'Consolidated';

    if (filterEmployeeId) {
      const empObject = employees.find(e => e.id === filterEmployeeId);
      reportCtxLabel = empObject ? empObject.name : "Teammate Subset";
      filterType = 'Employee';
    } else if (filterProject) {
      reportCtxLabel = filterProject;
      filterType = 'Project';
    } else if (filterStartDate || filterEndDate) {
      reportCtxLabel = `Time Window Logs`;
      filterType = 'Filtered';
    }

    exportReportToPdf(expenses, filterType, reportCtxLabel);
  };

  const generateCsvReport = () => {
    // Falls back to direct current filter view exports
    if (expenses.length === 0) {
      alert("No expenses listed under current filters to export.");
      return;
    }

    let reportCtxLabel = "General Organizational Ledger";
    let filterType: 'Employee' | 'Project' | 'Consolidated' | 'Filtered' = 'Consolidated';

    if (filterEmployeeId) {
      const empObject = employees.find(e => e.id === filterEmployeeId);
      reportCtxLabel = empObject ? empObject.name : "Teammate Subset";
      filterType = 'Employee';
    } else if (filterProject) {
      reportCtxLabel = filterProject;
      filterType = 'Project';
    } else if (filterStartDate || filterEndDate) {
      reportCtxLabel = `Time Window Logs`;
      filterType = 'Filtered';
    }

    exportReportToCsv(expenses, filterType, reportCtxLabel);
  };

  // Metric computations for the accountant visual quality dashboards
  const aggregateExpenseSum = expenses.reduce((sum, item) => sum + item.amount, 0);
  const averageBillAmount = expenses.length > 0 ? Math.round(aggregateExpenseSum / expenses.length) : 0;
  
  // Category Breakdown sum counts
  const categoryChartStats: Record<ExpenseCategory, number> = {
    'Travelling': 0,
    'Meals and Entertainment': 0,
    'Hardware/Materials': 0,
    'Others': 0
  };
  expenses.forEach(item => {
    if (categoryChartStats[item.category] !== undefined) {
      categoryChartStats[item.category] += item.amount;
    }
  });

  const categoryTailwindColors: Record<ExpenseCategory, string> = {
    'Travelling': 'bg-[#166534]',
    'Meals and Entertainment': 'bg-[#92400e]',
    'Hardware/Materials': 'bg-[#1e40af]',
    'Others': 'bg-[#475569]'
  };

  const categoryTextColors: Record<ExpenseCategory, string> = {
    'Travelling': 'text-[#166534] bg-[#dcfce7] border-[#bbf7d0]',
    'Meals and Entertainment': 'text-[#92400e] bg-[#fef3c7] border-[#fde68a]',
    'Hardware/Materials': 'text-[#1e40af] bg-[#dbeafe] border-[#bfdbfe]',
    'Others': 'text-[#475569] bg-[#f1f5f9] border-[#e2e8f0]'
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      
      {/* Top organization bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          {profileLogo ? (
            <img 
              src={profileLogo} 
              alt="Organization Brand Logo" 
              className="w-16 h-16 rounded-2xl object-contain border border-slate-200 bg-slate-50 p-1.5 shrink-0 shadow-xs"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100 shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
          )}
          <div>
            <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50/80 px-2.5 py-1 rounded-full uppercase tracking-widest">
              Accountant Controller Portal
            </span>
            <h1 className="text-2xl font-display font-extrabold text-slate-900 mt-2">
              {profileOrgName || user.organizationName} General Ledger
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Logged in as {profileName || user.name} ({profileEmail || user.email})</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-100 rounded-xl text-sm font-semibold transition bg-slate-50/50"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* METRICS ROW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Audited INR</span>
            <span className="text-2xl font-display font-bold text-slate-950 mt-1 block">
              ₹{aggregateExpenseSum.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-3.5 bg-emerald-50 rounded-2xl text-emerald-600 shadow-sm">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Average Expense Report</span>
            <span className="text-2xl font-display font-bold text-slate-950 mt-1 block">
              ₹{averageBillAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-3.5 bg-indigo-50 rounded-2xl text-indigo-600 shadow-sm">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Managed Core Team</span>
            <span className="text-2xl font-display font-bold text-slate-950 mt-1 block">
              {employees.length} Teammates
            </span>
          </div>
          <div className="p-3.5 bg-sky-50 rounded-2xl text-sky-600 shadow-sm">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* TABS MENU NAVIGATION */}
      <div className="bg-slate-100/80 border border-slate-200/50 rounded-2xl p-1.5 shadow-xs flex flex-wrap gap-1 mb-8">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>General Ledger Overview ({expenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`relative flex items-center gap-2 px-5 py-3 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'approvals'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Approvals Queue</span>
          {expenses.filter(e => e.status === 'Pending').length > 0 && (
            <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
              {expenses.filter(e => e.status === 'Pending').length} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'team'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Logins Directory ({employees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Dynamic Categories ({categoriesList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'projects'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Dynamic Projects ({projectsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Profile & Org Settings</span>
        </button>
      </div>

      {/* 3. TEAM LOGINS DIRECTORY TAB */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          
          {/* TEAM REGISTER PANEL - Accountant can generate logins */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Users className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-display font-bold text-slate-900">Manage Team Logins</h2>
            </div>

            {teamSuccess && (
              <div className="mb-4 bg-emerald-50 border-l-4 border-emerald-500 p-3.5 rounded-r-xl flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-800 font-medium">{teamSuccess}</div>
              </div>
            )}

            {teamError && (
              <div className="mb-4 bg-rose-50 border-l-4 border-rose-500 p-3.5 rounded-r-xl flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-800 font-medium">{teamError}</div>
              </div>
            )}

            {/* Manual Employee sign-up form constraint */}
            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rachel Green"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Login Email</label>
                <input
                  type="email"
                  required
                  placeholder="rachel@organization.com"
                  value={newEmpEmail}
                  onChange={(e) => setNewEmpEmail(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Security Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={newEmpPassword}
                  onChange={(e) => setNewEmpPassword(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                id="btn-register-employee"
                type="submit"
                disabled={teamLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 transition font-bold text-xs text-white rounded-xl shadow-md cursor-pointer flex justify-center items-center gap-1.5 disabled:opacity-50"
              >
                <PlusCircle className="w-4 h-4" />
                {teamLoading ? 'Provisioning ID...' : 'Register Employee'}
              </button>
            </form>
          </div>

          {/* Active Employees Directory list */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Registered Teammates ({employees.length})</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Click on any teammate's card to lookup full credentials, password information, and historic submissions.</p>
              </div>
            </div>
            
            {employees.length === 0 ? (
              <p className="text-xs text-slate-400 mt-2">No employees under current organization register. Use form above to add.</p>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {employees.map(emp => {
                  const empExpensesCount = expenses.filter(e => e.userId === emp.id || e.userEmail === emp.email).length;
                  const isBlocked = !!emp.isBlocked;
                  return (
                    <div 
                      key={emp.id} 
                      onClick={() => setViewingTeammateDetails(emp)}
                      className={`p-3 border rounded-xl flex items-center justify-between text-xs transition cursor-pointer select-none relative group ${
                        isBlocked 
                          ? 'bg-rose-50/75 hover:bg-rose-100/80 border-rose-200/60' 
                          : 'bg-indigo-50/10 hover:bg-indigo-100/15 border-slate-100/80 hover:border-indigo-150'
                      }`}
                      title="Click to view credentials, password, and ledger submissions sheet"
                    >
                      <div className="truncate flex-1 min-w-0 pr-2 pb-0.5">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-800 truncate group-hover:text-indigo-650 transition">{emp.name}</p>
                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded-full border tracking-wide ${
                            isBlocked
                              ? 'bg-rose-100 text-rose-800 border-rose-205'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-205'
                          }`}>
                            {isBlocked ? 'Blocked' : 'Active'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{emp.email}</p>
                        <p className="text-[9px] text-indigo-600 font-semibold mt-1">{empExpensesCount} transactions listed • View credentials</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleBlockEmployee(emp.id)}
                          className={`p-1 font-bold rounded-lg border text-[9px] uppercase tracking-wide px-2 transition cursor-pointer ${
                            isBlocked
                              ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm'
                              : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50 shadow-sm'
                          }`}
                          title={isBlocked ? "Unblock account" : "Suspend / Block account"}
                        >
                          {isBlocked ? 'Activate' : 'Block'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )}

      {/* 4. DYNAMIC CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
          
          {/* CUSTOMIZABLE CATEGORY OPTIONS SECTION */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-750 uppercase tracking-wider">Dynamic Expense Categories</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Customize, add, or remove classification options for your core team dropdown.</p>
            </div>

            {categorySuccess && (
              <div className="bg-emerald-50 text-emerald-800 text-[10px] px-3 py-2 rounded-xl font-medium border border-emerald-100 animate-fade-in">
                {categorySuccess}
              </div>
            )}
            {categoryError && (
              <div className="bg-rose-50 text-rose-800 text-[10px] px-3 py-2 rounded-xl font-medium border border-rose-100 animate-fade-in">
                {categoryError}
              </div>
            )}

            {/* Current categories list */}
            <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pb-1">
              {categoriesList.map((cat) => (
                <div 
                  key={cat} 
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 transition"
                >
                  <span className="truncate max-w-[125px]">{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat)}
                    className="text-slate-400 hover:text-rose-600 font-black text-xs leading-none focus:outline-none transition inline-flex items-center justify-center w-3 h-3 rounded-full hover:bg-rose-50"
                    title={`Delete ${cat} option`}
                  >
                    ×
                  </button>
                </div>
              ))}
              {categoriesList.length === 0 && (
                <span className="text-[10px] text-slate-400 italic">No custom categories registered. New submissions will fall back to legacy.</span>
              )}
            </div>

            {/* Add category form */}
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New custom type (e.g. Legal & Tax)"
                maxLength={40}
                className="flex-1 bg-white rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white rounded-xl transition shadow-sm whitespace-nowrap"
              >
                Add Option
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DYNAMIC PROJECTS MANAGEMENT TAB */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          
          {/* Left Panel: Add Project & Projects List */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Create Project card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Create New Project</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Register a project manually so employees can select it on their submission panel.</p>
              </div>

              {projectSuccess && (
                <div className="bg-emerald-50 text-emerald-800 text-[10px] px-3 py-2 rounded-xl font-medium border border-emerald-100 animate-fade-in">
                  {projectSuccess}
                </div>
              )}
              {projectError && (
                <div className="bg-rose-50 text-rose-800 text-[10px] px-3 py-2 rounded-xl font-medium border border-rose-100 animate-fade-in">
                  {projectError}
                </div>
              )}

              <form onSubmit={handleAddProject} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="New project label (e.g. Solar Phase II)"
                  maxLength={50}
                  className="flex-1 bg-white rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white rounded-xl transition shadow-sm whitespace-nowrap"
                >
                  Create Project
                </button>
              </form>
            </div>

            {/* List of Projects Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Dynamic Projects List</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Select a project to inspect logs, view statistics and manage settings.</p>
              </div>

              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                {projectsList.map((proj) => {
                  const isActive = (selectedProjectTabName || projectsList[0]) === proj;
                  const projExpenses = expenses.filter(e => e.projectName?.toLowerCase() === proj.toLowerCase());
                  const totalAmt = projExpenses.reduce((sum, item) => sum + item.amount, 0);
                  const employeeCount = new Set(projExpenses.map(e => e.userId || e.userEmail)).size;

                  return (
                    <div 
                      key={proj}
                      onClick={() => setSelectedProjectTabName(proj)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer text-left flex items-start justify-between gap-3 ${
                        isActive
                          ? 'bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-100'
                          : 'bg-slate-50/50 hover:bg-slate-100/50 border-slate-200/60'
                      }`}
                    >
                      <div className="truncate flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className={`font-bold text-xs truncate ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>{proj}</p>
                          <span className="text-[8px] bg-slate-100 text-slate-600 border border-slate-200 font-extrabold uppercase px-1.5 py-0.2 rounded-full font-mono">
                            {employeeCount} {employeeCount === 1 ? 'employee' : 'employees'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">
                          Total Budget Tracked: <span className="font-bold text-slate-700">₹{totalAmt.toLocaleString('en-IN')}</span>
                        </p>
                        <p className="text-[8.5px] text-slate-400 font-bold mt-0.5 font-mono">
                          {projExpenses.length} transaction entries listed
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            if (projExpenses.length === 0) {
                              alert("No expense proofs found under this project criteria to generate reports.");
                              return;
                            }
                            exportReportToPdf(projExpenses, 'Project', proj);
                          }}
                          className="p-1.5 bg-white text-indigo-600 border border-slate-200 rounded-lg hover:bg-indigo-600 hover:text-white transition"
                          title={`PDF Ledger Report for "${proj}"`}
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (projExpenses.length === 0) {
                              alert("No expense proofs found under this project criteria to generate reports.");
                              return;
                            }
                            exportReportToCsv(projExpenses, 'Project', proj);
                          }}
                          className="p-1.5 bg-white text-emerald-600 border border-slate-200 rounded-lg hover:bg-emerald-600 hover:text-white transition"
                          title={`CSV Ledger Spreadsheet for "${proj}"`}
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(proj)}
                          className="p-1.5 bg-white text-slate-400 border border-slate-200 hover:border-rose-100 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition text-xs font-black leading-none"
                          title={`Delete project "${proj}" option`}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}

                {projectsList.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs italic">
                    No custom projects registered yet.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Panel: Project-Wise Data Inspection */}
          <div className="lg:col-span-7 space-y-6">
            {(() => {
              const activeProj = selectedProjectTabName || projectsList[0];
              if (!activeProj) {
                return (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center text-slate-400 italic text-xs">
                    Please create or select a project to view detailed ledger transaction records.
                  </div>
                );
              }

              const projExpenses = expenses.filter(e => e.projectName?.toLowerCase() === activeProj.toLowerCase());
              const uniqueEmployees = Array.from(new Set(projExpenses.map(e => e.userName || "Unknown teammate")));

              return (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest font-mono">Project Ledger Workspace</span>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5">{activeProj}</h3>
                    </div>
                    
                    {projExpenses.length > 0 && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => exportReportToPdf(projExpenses, 'Project', activeProj)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-150 text-indigo-700 font-bold text-[10px] rounded-xl hover:bg-indigo-100 transition shadow-xs"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>PDF Report</span>
                        </button>
                        <button
                          onClick={() => exportReportToCsv(projExpenses, 'Project', activeProj)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-150 text-emerald-700 font-bold text-[10px] rounded-xl hover:bg-emerald-100 transition shadow-xs"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>CSV Dataset</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick Stat Indicators */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                    <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 text-left">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">Direct Budget</span>
                      <span className="text-sm font-bold text-slate-800 mt-1 block">
                        ₹{projExpenses.reduce((sum, item) => sum + item.amount, 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 text-left">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">Unique Teammates</span>
                      <span className="text-sm font-bold text-slate-800 mt-1 block font-mono">
                        {uniqueEmployees.length} {uniqueEmployees.length === 1 ? 'Person' : 'People'}
                      </span>
                    </div>
                    <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 text-left col-span-2 sm:col-span-1">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">Pending Claims</span>
                      <span className="text-sm font-bold text-amber-600 mt-1 block font-mono">
                        {projExpenses.filter(e => e.status === 'Pending').length} pending approval
                      </span>
                    </div>
                  </div>

                  {/* Employees Detailed Breakdown */}
                  {uniqueEmployees.length > 0 && (
                    <div className="bg-indigo-50/20 border border-indigo-100/50 rounded-xl p-3 text-left">
                      <p className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider font-mono">People logged in this project:</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {uniqueEmployees.map(emp => (
                          <span key={emp} className="bg-white px-2 py-1 text-[9.5px] font-medium border border-slate-200 text-slate-700 rounded-lg">
                            {emp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Project transactions list */}
                  <div className="text-left">
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 font-mono">Logged Transaction Vouchers</p>
                    <div className="border border-slate-100 rounded-xl overflow-hidden max-h-[260px] overflow-y-auto">
                      <table className="w-full text-left text-xs min-w-[500px]">
                        <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold uppercase text-slate-400 font-mono">
                          <tr>
                            <th className="px-3.5 py-2">Employee Name</th>
                            <th className="px-3.5 py-2">Category</th>
                            <th className="px-3.5 py-2">Date</th>
                            <th className="px-3.5 py-2">Value</th>
                            <th className="px-3.5 py-2 text-right">Approval Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[10.5px]">
                          {projExpenses.map((e) => (
                            <tr key={e.id} className="hover:bg-slate-50/40">
                              <td className="px-3.5 py-2.5 font-bold text-slate-800">{e.userName || 'Unknown Teammate'}</td>
                              <td className="px-3.5 py-2.5 text-slate-600 font-semibold">{e.category}</td>
                              <td className="px-3.5 py-2.5 text-slate-505 font-mono">{new Date(e.createdAt).toLocaleDateString('en-GB')}</td>
                              <td className="px-3.5 py-2.5 font-bold text-slate-900">₹{e.amount.toLocaleString()}</td>
                              <td className="px-3.5 py-2.5 text-right">
                                <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                  e.status === 'Approved'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                    : e.status === 'Rejected'
                                      ? 'bg-rose-50 text-rose-800 border-rose-100'
                                      : 'bg-amber-50 text-amber-805 border-amber-100 animate-pulse'
                                }`}>
                                  {e.status}
                                </span>
                              </td>
                            </tr>
                          ))}

                          {projExpenses.length === 0 && (
                            <tr>
                              <td colSpan={5} className="text-center py-6 text-slate-400 italic">
                                No logged expense entries found for this project in standard ledger tracking history.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              );
            })()}
          </div>

        </div>
      )}

      {/* 1. OVERVIEW & GENERAL LEDGER TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          
          {/* Left panel containing Project list & category breakdown metrics block */}
          <div className="lg:col-span-4 space-y-6">

            {/* Project-wise Expense Reports Segment with Multi-Selection tool */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Project Selection Center</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 animate-pulse">Select project(s) to compile a custom combined PDF report (includes multiple receipt image proofs)</p>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                {selectedProjects.length} Selected
              </span>
            </div>

            {getProjectLedgerBreakdown().length === 0 ? (
              <p className="text-xs text-slate-400 mt-2">No active project ledger events found.</p>
            ) : (
              <>
                {/* Selection helper buttons */}
                <div className="flex items-center justify-between gap-2 text-[10px] border-b border-slate-100/50 pb-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allProjectNames = getProjectLedgerBreakdown().map(p => p.name);
                      setSelectedProjects(allProjectNames);
                    }}
                    className="text-indigo-600 hover:underline font-bold"
                  >
                    Select All Projects
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProjects([])}
                    className="text-rose-600 hover:underline font-bold"
                  >
                    Clear Selection
                  </button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {getProjectLedgerBreakdown().map(proj => {
                    const isChecked = selectedProjects.includes(proj.name);
                    return (
                      <div 
                        key={proj.name} 
                        onClick={() => {
                          if (isChecked) {
                            setSelectedProjects(prev => prev.filter(p => p !== proj.name));
                          } else {
                            setSelectedProjects(prev => [...prev, proj.name]);
                          }
                        }}
                        className={`p-3 border rounded-xl flex items-center justify-between text-xs cursor-pointer select-none transition ${
                          isChecked 
                            ? 'border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/40' 
                            : 'border-slate-100 bg-slate-50 hover:bg-slate-150/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by parent div click
                            className="w-3.5 h-3.5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 pointer-events-none"
                          />
                          <div className="truncate">
                            <p className="font-bold text-slate-800 truncate uppercase tracking-tight">{proj.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">₹{proj.totalAmount.toLocaleString('en-IN')}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">{proj.items.length} logs reported</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              exportReportToPdf(proj.items, 'Project', proj.name);
                            }}
                            className="p-1.5 bg-white border border-slate-200 hover:bg-indigo-600 hover:text-white rounded-lg transition"
                            title={`Export PDF for ${proj.name} immediately`}
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              exportReportToCsv(proj.items, 'Project', proj.name);
                            }}
                            className="p-1.5 bg-white border border-slate-200 hover:bg-emerald-600 hover:text-white rounded-lg transition"
                            title={`Export CSV for ${proj.name} immediately`}
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Combined PDF and CSV action buttons */}
                <div className="grid grid-cols-2 gap-2 mt-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleExportSelectedProjectsPdf}
                    disabled={selectedProjects.length === 0}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold text-xs text-white rounded-xl shadow-md flex justify-center items-center gap-1.5"
                    title="Export selected project logs in PDF format"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Selected PDF ({selectedProjects.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportSelectedProjectsCsv}
                    disabled={selectedProjects.length === 0}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold text-xs text-white rounded-xl shadow-md flex justify-center items-center gap-1.5"
                    title="Export selected project logs in CSV format"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Selected CSV ({selectedProjects.length})</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Quick Micro Bar Chart breakdown indicator for Accountant */}
          {expenses.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-4">Category Expense Allocations</span>
              <div className="space-y-3.5">
                {(Object.keys(categoryChartStats) as ExpenseCategory[]).map(catName => {
                  const amountSpent = categoryChartStats[catName];
                  const allocationPercentage = aggregateExpenseSum > 0 ? (amountSpent / aggregateExpenseSum) * 100 : 0;
                  return (
                    <div key={catName} className="flex items-center justify-between gap-4">
                      <span className="w-32 font-medium text-slate-600 truncate">{catName}</span>
                      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${allocationPercentage}%` }}
                          className={`h-full ${categoryTailwindColors[catName] || 'bg-indigo-600'} rounded-full transition-all duration-300`}
                        />
                      </div>
                      <span className="w-24 text-right font-bold text-slate-900 font-mono">
                        ₹{amountSpent.toLocaleString()} ({Math.round(allocationPercentage)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>


        {/* Right panel (col span 8) is core General Ledger Logs */}
        <div className="lg:col-span-8 space-y-6 animate-fade-in">

          {/* Status Segments bar for showing Approved, Rejected, Pending sections differently */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4.5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Audit Verification Segments</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Verify or list general ledger details grouped by status sections.</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setFilterStatus('')}
                className={`px-3 py-1.5 cursor-pointer text-[10px] font-bold rounded-lg transition ${filterStatus === '' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                All Logs ({expenses.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('Pending')}
                className={`px-3 py-1.5 cursor-pointer text-[10px] font-bold rounded-lg transition ${filterStatus === 'Pending' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Pending ({expenses.filter(e => e.status === 'Pending').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('Approved')}
                className={`px-3 py-1.5 cursor-pointer text-[10px] font-bold rounded-lg transition ${filterStatus === 'Approved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Approved ({expenses.filter(e => e.status === 'Approved').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('Rejected')}
                className={`px-3 py-1.5 cursor-pointer text-[10px] font-bold rounded-lg transition ${filterStatus === 'Rejected' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Rejected ({expenses.filter(e => e.status === 'Rejected').length})
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* 2. MANUAL AUDIT & APPROVALS TAB */}
      {activeTab === 'approvals' && (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-amber-50 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-500 animate-pulse" />
                  <h2 className="text-base font-display font-black text-slate-800">Manual Approvals & Audit Queue</h2>
                </div>
                <p className="text-xs text-slate-450 mt-0.5">Staff-submitted expense reports requiring your manual review and approval</p>
              </div>
              <span className="text-xs bg-amber-50 text-amber-700 font-black px-2.5 py-1 rounded-full border border-amber-200">
                {expenses.filter(e => e.status === 'Pending').length} Pending
              </span>
            </div>

            {expenses.filter(e => e.status === 'Pending').length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
                <CheckCircle className="w-9 h-9 text-emerald-500 mb-2" />
                <p className="text-xs font-bold text-slate-700">Audit compete! All requests resolved.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">All staff transactions have been reviewed and correctly categorized.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {expenses.filter(e => e.status === 'Pending').map((exp) => (
                  <div key={exp.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs shadow-sm">
                    <div className="space-y-1 sm:max-w-[70%]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="bg-slate-200 text-slate-700 font-extrabold px-2 py-0.5 rounded-lg uppercase text-[9px]">
                          {exp.projectName}
                        </span>
                        <span className={`inline-block border px-1.5 py-0.5 rounded-full font-bold text-[9px] ${categoryTextColors[exp.category] || 'bg-slate-55 text-slate-500'}`}>
                          {exp.category}
                        </span>
                      </div>
                      <p className="font-extrabold text-slate-900 text-sm mt-1.5">₹{exp.amount.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-slate-650 font-medium leading-relaxed mt-0.5">{exp.details}</p>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Submitted by <span className="font-bold text-slate-700">{exp.userName}</span> ({exp.userEmail}) on <span className="font-mono">{exp.date}</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-stretch gap-2 shrink-0 sm:min-w-[125px]">
                      {/* VIEW ATTACHMENTS BUTTON */}
                      {exp.receipts && exp.receipts.length > 0 ? (
                        <button
                          onClick={() => {
                            setActiveReceiptsList(exp.receipts || null);
                            setActiveReceiptsIndex(0);
                            setActiveReceiptTitle(`${exp.projectName} - Submitted by ${exp.userName}`);
                          }}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-250 text-indigo-600 hover:bg-slate-50 rounded-xl transition text-[10px] font-bold bg-white"
                          title={`Open ${exp.receipts.length} receipt proof files`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Receipts ({exp.receipts.length})</span>
                        </button>
                      ) : exp.receipt ? (
                        <button
                          onClick={() => {
                            setActiveReceiptsList([{ data: exp.receipt!, type: exp.receiptType || 'image/jpeg', name: 'receipt' }]);
                            setActiveReceiptsIndex(0);
                            setActiveReceiptTitle(`${exp.projectName} - Submitted by ${exp.userName}`);
                          }}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-250 text-indigo-600 hover:bg-slate-50 rounded-xl transition text-[10px] font-bold bg-white"
                          title="Open receipt image proof"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Proof</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-center text-[10px] py-1 bg-white border border-slate-100 rounded-xl">No proof attached</span>
                      )}

                      {/* APPROVAL DECISION SYSTEM */}
                      <div className="flex gap-2 w-full mt-1 sm:mt-0">
                        <button
                          onClick={() => handleUpdateExpenseStatus(exp.id, 'Approved')}
                          className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-[10px] text-center shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateExpenseStatus(exp.id, 'Rejected')}
                          className="flex-1 py-1.5 px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition text-[10px] text-center shadow-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. REST OF GENERAL LEDGER TAB (FULL WIDTH CARD) */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in col-span-12">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col gap-6">
            
            {/* Action Bar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-display font-bold text-slate-900">Organization General Ledger Logs</h2>
                <p className="text-xs text-slate-400 mt-0.5">Filtered list of employee payment proofs and bills</p>
              </div>

              {/* EXPORT ACTION BUTTONS */}
              <div className="flex items-center gap-2">
                <button
                  id="btn-export-pdf"
                  onClick={generatePdfReport}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white rounded-xl shadow-md transition whitespace-nowrap"
                  title="Generate dynamic PDF ledger audit documentation"
                >
                  <FileDown className="w-4 h-4" />
                  Export Ledger (PDF)
                </button>
                <button
                  id="btn-export-csv"
                  onClick={generateCsvReport}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl shadow-xs transition whitespace-nowrap"
                  title="Generate CSV data sheets directly for accountants"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export Ledger (CSV)
                </button>
              </div>
            </div>

            {/* FILTERS MANAGEMENT */}
            <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              
              {/* Project name filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Project Name</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search project..."
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="w-full bg-white rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Employee selected filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Teammate</label>
                <select
                  value={filterEmployeeId}
                  onChange={(e) => setFilterEmployeeId(e.target.value)}
                  className="w-full bg-white rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Team Members</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              {/* Start Date filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">From Date</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full bg-white rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* End Date filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">To Date</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full bg-white rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

            </div>

            {/* LEDGER EXPENSES TABLE CONTAINER */}
            <div>
              {loadingExpenses ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                  <svg className="animate-spin h-7 w-7 text-indigo-600 mb-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-xs">Processing ledgers...</span>
                </div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-3xl text-slate-400 flex flex-col items-center justify-center">
                  <FileSpreadsheet className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold">No organizational expenses match current filter criteria.</p>
                  <button 
                    onClick={() => {
                      setFilterProject('');
                      setFilterEmployeeId('');
                      setFilterStartDate('');
                      setFilterEndDate('');
                    }}
                    className="mt-3 text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold px-3 py-1.5 rounded-xl transition"
                  >
                    Clear Filter Constraints
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border-t border-slate-100">
                  <table className="min-w-full divide-y divide-slate-100 text-xs">
                    <thead>
                      <tr className="text-slate-400 text-left font-bold border-b border-slate-100 uppercase tracking-wider">
                        <th className="py-3.5 px-3">Project / Member</th>
                        <th className="py-3.5 px-3">Expense Details</th>
                        <th className="py-3.5 px-3">Category</th>
                        <th className="py-3.5 px-3 text-center">Status</th>
                        <th className="py-3.5 px-3 text-right">Amount (INR)</th>
                        <th className="py-3.5 px-3 text-center">Receipt</th>
                        <th className="py-3.5 px-3 text-center">Report</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                      {expenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-3">
                            <span className="bg-slate-150 text-slate-700 font-bold px-1.5 py-0.5 rounded mr-1 leading-normal uppercase">
                              {exp.projectName}
                            </span>
                            <div className="font-bold text-slate-900 mt-1.5">{exp.userName}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{exp.date}</div>
                          </td>
                          
                          <td className="py-3.5 px-3 max-w-[200px]">
                            <p className="font-medium text-slate-800 line-clamp-2 leading-relaxed">{exp.details}</p>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className={`inline-block border px-2 py-0.5 rounded-full font-semibold ${categoryTextColors[exp.category] || 'bg-slate-50 text-slate-500'}`}>
                              {exp.category}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] border ${
                              exp.status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : exp.status === 'Rejected'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {exp.status || 'Pending'}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-right font-bold text-slate-950 font-mono text-sm">
                            ₹{exp.amount.toLocaleString('en-IN')}
                          </td>

                          <td className="py-3.5 px-3 text-center">
                            {exp.receipts && exp.receipts.length > 0 ? (
                              <button
                                onClick={() => {
                                  setActiveReceiptsList(exp.receipts || null);
                                  setActiveReceiptsIndex(0);
                                  setActiveReceiptTitle(`${exp.projectName} - Submitted by ${exp.userName}`);
                                }}
                                className="p-2 border border-slate-200 text-indigo-600 hover:text-indigo-800 rounded-xl hover:bg-slate-100 transition inline-flex items-center justify-center gap-1.5"
                                title={`Open proof documentation (${exp.receipts.length} files)`}
                              >
                                <Eye className="w-4 h-4" />
                                <span className="text-[10px] font-mono font-extrabold text-indigo-600">({exp.receipts.length})</span>
                              </button>
                            ) : exp.receipt ? (
                              <button
                                onClick={() => {
                                  setActiveReceiptsList([{ data: exp.receipt!, type: exp.receiptType || 'image/jpeg', name: 'receipt' }]);
                                  setActiveReceiptsIndex(0);
                                  setActiveReceiptTitle(`${exp.projectName} - Submitted by ${exp.userName}`);
                                }}
                                className="p-2 border border-slate-200 text-indigo-600 hover:text-indigo-800 rounded-xl hover:bg-slate-100 transition inline-flex items-center justify-center"
                                title="Open proof documentation"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-slate-300 text-[10px]">No proof</span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => exportReportToPdf([exp], 'Employee', exp.userName || 'Employee', exp.userEmail)}
                                className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 rounded-lg transition"
                                title={`Download separate PDF Report for this submission by ${exp.userName || 'employee'}`}
                              >
                                <FileDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => exportReportToCsv([exp], 'Employee', exp.userName || 'Employee', exp.userEmail)}
                                className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-100 rounded-lg transition"
                                title={`Download separate CSV spreadsheet for this submission by ${exp.userName || 'employee'}`}
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 5. EDIT PROFILE & ORGANIZATION PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 animate-fade-in">
            <div className="border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-base font-display font-black text-slate-800 flex items-center gap-2">
                <Building2 className="text-indigo-600" />
                <span>Organization & Profile Settings</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Keep your accountant controller profile and organization details up to date. Changes reflect on receipts and financial outputs immediately.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {pendingRequest && (
                <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-850 p-4 rounded-2xl text-[11px] space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900 text-xs">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                    <span>Pending Approval Request Awaiting Owner Review</span>
                  </div>
                  <p className="font-medium text-slate-600">
                    You submitted a profile and organization change request to the Owner on <strong>{new Date(pendingRequest.createdAt).toLocaleString()}</strong>. Your active details will not change until authorized:
                  </p>
                  <div className="border border-amber-150 bg-amber-100/40 p-2.5 rounded-xl font-semibold text-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                    <div>Requested Name: <span className="text-slate-900 font-bold">{pendingRequest.requestedData.name}</span></div>
                    <div>Requested Email: <span className="text-slate-900 font-bold">{pendingRequest.requestedData.email}</span></div>
                    <div>Requested Org: <span className="text-slate-900 font-bold">{pendingRequest.requestedData.organizationName}</span></div>
                    <div>Requested Phone: <span className="text-slate-900 font-bold">{pendingRequest.requestedData.phone || 'None'}</span></div>
                  </div>
                </div>
              )}

              {profileError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-xl text-xs font-bold">
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3.5 rounded-xl text-xs font-bold leading-normal">
                  {profileSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block text-xs">Full Name*</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block text-xs">Login Email*</label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 block text-xs">Change Password (leave empty to keep existing)</label>
                  <input
                    type="password"
                    placeholder="Enter new master password sequence if needed"
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block text-xs">Organization / Entity Name*</label>
                  <input
                    type="text"
                    required
                    value={profileOrgName}
                    onChange={(e) => setProfileOrgName(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block text-xs">Brand Logo Image Upload</label>
                  <div className="flex items-center gap-2.5 border border-slate-200 px-3.5 py-1.5 bg-slate-50 rounded-xl h-[42px] justify-between">
                    {profileLogo ? (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img 
                          src={profileLogo} 
                          alt="Company Logo Preview" 
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-lg object-contain bg-white border border-slate-200 p-0.5"
                        />
                        <span className="text-[10px] text-slate-500 truncate font-mono">Custom Logo Saved</span>
                        <button
                          type="button"
                          onClick={() => setProfileLogo('')}
                          className="text-rose-500 hover:text-rose-700 font-extrabold text-xs shrink-0 px-1 hover:bg-rose-50 rounded"
                          title="Remove brand logo"
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
                        id="brand-logo-file-uploader"
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
                                setProfileLogo(event.target.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      <label 
                        htmlFor="brand-logo-file-uploader"
                        className="inline-flex items-center px-2.5 py-1 bg-white border border-slate-250 hover:bg-slate-100 text-indigo-700 font-bold text-[9.5px] rounded-lg transition cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        Upload Image
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 block text-xs">Registered Company Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 90210 00000"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 block text-xs">Registered Office Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 5th Floor, Tower B, Silicon Plaza"
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 transition text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  {profileLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving adjustments...</span>
                    </>
                  ) : (
                    <span>Save Profile Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT PREVIEW FLOATING OVERLAY MODAL */}
      {activeReceiptsList && activeReceiptsList.length > 0 && (
        <div 
          onClick={() => setActiveReceiptsList(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl relative"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-display font-extrabold text-slate-800 text-xs truncate uppercase tracking-wider leading-normal">
                Auditing Proof Attachments: {activeReceiptTitle} {activeReceiptsList.length > 1 ? `(${activeReceiptsIndex + 1}/${activeReceiptsList.length})` : ''}
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
                <div className="text-center text-white py-14 flex flex-col items-center">
                  <FileSpreadsheet className="w-16 h-16 text-indigo-400 mb-3" />
                  <p className="text-sm font-semibold">{activeReceiptsList[activeReceiptsIndex].name || 'PDF Base64 Document'}</p>
                  <a 
                    href={activeReceiptsList[activeReceiptsIndex].data} 
                    download={activeReceiptsList[activeReceiptsIndex].name || "payment_receipt_proof.pdf"}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold rounded-lg transition"
                  >
                    Download PDF Invoice
                  </a>
                </div>
              ) : (
                <img 
                  referrerPolicy="no-referrer"
                  src={activeReceiptsList[activeReceiptsIndex].data} 
                  alt={`Receipt Preview ${activeReceiptsIndex + 1}`} 
                  className="max-h-[45vh] max-w-full object-contain rounded-2xl shadow-md"
                />
              )}
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
              <span className="text-[10px] text-slate-400 truncate max-w-[50%]">
                File: {activeReceiptsList[activeReceiptsIndex].name || `Proof_${activeReceiptsIndex + 1}`}
              </span>
              <a 
                href={activeReceiptsList[activeReceiptsIndex].data} 
                download={activeReceiptsList[activeReceiptsIndex].name || "invoice_proof_attachment"}
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Local Attachment</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          6. VIEW TEAMMATE CREDENTIALS & DETAILS MODAL
          ======================================================== */}
      {viewingTeammateDetails && (
        <div 
          onClick={() => setViewingTeammateDetails(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in animate-duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-2xl w-full overflow-hidden p-6 relative flex flex-col max-h-[85vh]"
          >
            <button 
              onClick={() => setViewingTeammateDetails(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold p-1 hover:bg-slate-50 rounded-full transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="border-b border-slate-100 pb-3 mb-4">
              <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wider font-mono">Teammate Information Sheet</span>
              <h3 className="text-base font-display font-bold text-slate-900 mt-1">
                {viewingTeammateDetails.name} Profile Card
              </h3>
            </div>

            <div className="space-y-4 text-xs font-medium text-slate-600 overflow-y-auto pr-1 flex-1">
              {/* Primary properties cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Employee ID</span>
                  <p className="font-mono text-slate-800 font-bold select-all break-all">{viewingTeammateDetails.id}</p>
                </div>

                <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Membership Status</span>
                  <p className="inline-flex mt-1">
                    {viewingTeammateDetails.isBlocked ? (
                      <span className="text-rose-700 bg-rose-50 font-bold uppercase tracking-wider text-[9px] border border-rose-200 px-2 py-0.5 rounded-full">
                        Blocked / Suspended
                      </span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 font-bold uppercase tracking-wider text-[9px] border border-emerald-200 px-2 py-0.5 rounded-full">
                        Active Teammate
                      </span>
                    )}
                  </p>
                </div>

                <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 col-span-2">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Teammate Login Host Email</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <p className="font-bold text-slate-800 select-all">{viewingTeammateDetails.email}</p>
                  </div>
                </div>

                <div className="p-3 border border-indigo-100 rounded-2xl bg-indigo-50/20 col-span-2">
                  <span className="block text-[9px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Active Login Security Password</span>
                  <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 border border-indigo-100/65 rounded-xl mt-1.5">
                    <div className="flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <p className="font-mono text-slate-900 font-extrabold text-[13px] select-all">
                        {viewingTeammateDetails.password || '●●●●●●●●'}
                      </p>
                    </div>
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-indigo-600 px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded">
                      Staff Member
                    </span>
                  </div>
                </div>
              </div>

              {/* Transactions Submission history list for accountant lookup */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5 mt-4">
                  <h4 className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Submitted Submissions Register</h4>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700">
                    {expenses.filter(e => e.userId === viewingTeammateDetails.id || e.userEmail === viewingTeammateDetails.email).length} reported
                  </span>
                </div>

                {expenses.filter(e => e.userId === viewingTeammateDetails.id || e.userEmail === viewingTeammateDetails.email).length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-6 border border-dashed border-slate-150 rounded-xl">This member has no reported submissions on record.</p>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {expenses.filter(e => e.userId === viewingTeammateDetails.id || e.userEmail === viewingTeammateDetails.email).map(exp => (
                      <div key={exp.id} className="p-2.5 border border-slate-150/70 rounded-xl bg-slate-50/40 flex items-center justify-between text-[11px] hover:bg-slate-50 transition">
                        <div className="truncate flex-1 pr-3">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-slate-200 text-slate-750 font-bold px-1.5 py-0.2 rounded text-[8px] uppercase">
                              {exp.projectName}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">{exp.date}</span>
                          </div>
                          <p className="font-semibold text-slate-850 mt-1 truncate">{exp.details}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Category: <span className="font-bold text-slate-650">{exp.category}</span></p>
                        </div>
                        <div className="text-right flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <div>
                            <span className="text-sm font-bold text-slate-900 block font-mono">₹{exp.amount.toLocaleString()}</span>
                            <span className={`inline-block px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider text-[8px] border mt-1 ${
                              exp.status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : exp.status === 'Rejected'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {exp.status || 'Pending'}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => exportReportToPdf([exp], 'Employee', viewingTeammateDetails.name, viewingTeammateDetails.email)}
                              className="p-1 border border-slate-200 hover:bg-indigo-600 hover:text-white rounded text-slate-655 bg-white transition cursor-pointer"
                              title="Download single PDF"
                            >
                              <FileDown className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => exportReportToCsv([exp], 'Employee', viewingTeammateDetails.name, viewingTeammateDetails.email)}
                              className="p-1 border border-slate-200 hover:bg-emerald-600 hover:text-white rounded text-slate-655 bg-white transition cursor-pointer"
                              title="Download single CSV"
                            >
                              <FileSpreadsheet className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingTeammateDetails(null)}
                className="w-full bg-slate-900 hover:bg-black transition font-bold text-xs text-white py-2.5 rounded-xl cursor-pointer"
              >
                Dismiss Details Sheet
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
