import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DB_PATH = path.join(process.cwd(), 'database.json');

// Initialize Database structure
const defaultDatabase = {
  users: [
    {
      id: 'u_acme_acc',
      name: 'Alice Accountant',
      email: 'accountant@acme.com',
      password: 'password123',
      role: 'Accountant',
      organizationId: 'org_acme',
      organizationName: 'Acme Corp'
    },
    {
      id: 'u_acme_emp',
      name: 'Bob Employee',
      email: 'employee@acme.com',
      password: 'password123',
      role: 'Employee',
      organizationId: 'org_acme',
      organizationName: 'Acme Corp'
    },
    {
      id: 'u_glob_acc',
      name: 'Gary Accountant',
      email: 'accountant@globex.com',
      password: 'password123',
      role: 'Accountant',
      organizationId: 'org_globex',
      organizationName: 'Globex Industries'
    },
    {
      id: 'u_glob_emp',
      name: 'Emily Employee',
      email: 'employee@globex.com',
      password: 'password123',
      role: 'Employee',
      organizationId: 'org_globex',
      organizationName: 'Globex Industries'
    }
  ],
  expenses: [
    {
      id: 'exp_001',
      userId: 'u_acme_emp',
      userName: 'Bob Employee',
      userEmail: 'employee@acme.com',
      projectName: 'Alpha Upgrade',
      details: 'Server infrastructure upgrade components',
      category: 'Hardware/Materials',
      amount: 14500,
      date: '2026-05-15',
      createdAt: '2026-05-15T10:00:00.000Z',
      organizationId: 'org_acme'
    },
    {
      id: 'exp_002',
      userId: 'u_acme_emp',
      userName: 'Bob Employee',
      userEmail: 'employee@acme.com',
      projectName: 'Client Onboarding',
      details: 'Welcome dinner for prospective key enterprise client',
      category: 'Meals and Entertainment',
      amount: 4200,
      date: '2026-05-20',
      createdAt: '2026-05-20T21:30:00.000Z',
      organizationId: 'org_acme'
    },
    {
      id: 'exp_003',
      userId: 'u_glob_emp',
      userName: 'Emily Employee',
      userEmail: 'employee@globex.com',
      projectName: 'Marketing Summit',
      details: 'Hotel lodging and interstate flights',
      category: 'Travelling',
      amount: 18900,
      date: '2026-05-18',
      createdAt: '2026-05-18T14:45:00.000Z',
      organizationId: 'org_globex'
    }
  ]
};

function readDb() {
  let db;
  try {
    if (!fs.existsSync(DB_PATH)) {
      db = defaultDatabase;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    } else {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      db = JSON.parse(raw);
    }
  } catch (error) {
    console.error('Error reading index file db, using fallback: ', error);
    db = defaultDatabase;
  }

  // Ensure owner user exists and is up to date according to user requests
  if (db && db.users) {
    const ownerEmail = 'shihireganesh0@gmail.com';
    const ownerUserIndex = db.users.findIndex((u: any) => u.email.toLowerCase() === ownerEmail.toLowerCase());
    const ownerData = {
      id: 'u_owner_ganesh',
      name: 'Ganesh Shihire',
      email: ownerEmail,
      password: 'ExpenseTrack@9021#',
      role: 'Owner',
      organizationId: 'org_owner',
      organizationName: 'LedgerForward Admin'
    };
    
    if (ownerUserIndex > -1) {
      const existing = db.users[ownerUserIndex];
      if (existing.role !== 'Owner' || existing.name !== 'Ganesh Shihire' || existing.password !== 'ExpenseTrack@9021#') {
        db.users[ownerUserIndex] = {
          ...existing,
          name: 'Ganesh Shihire',
          password: 'ExpenseTrack@9021#',
          role: 'Owner',
          organizationId: 'org_owner',
          organizationName: 'LedgerForward Admin'
        };
        // Use synchronous write here to avoid concurrency issues during boot/readDb
        try {
          fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
        } catch (e) {
          console.error('Sync write error on database.json inside readDb owner patch:', e);
        }
      }
    } else {
      db.users.push(ownerData);
      try {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
      } catch (e) {
        console.error('Sync write error on database.json inside readDb owner insert:', e);
      }
    }
  }
  return db;
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to db: ', error);
  }
}

async function startServer() {
  const app = express();

  // Important: configure body-parsers with large JSON limit for image uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Helper auth check middleware
  const getAuthUser = (req: express.Request) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const userId = authHeader.substring(7);
    const db = readDb();
    const found = db.users.find((u: any) => u.id === userId);
    return found || null;
  };

  // --- API ROUTES ---

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
       res.status(400).json({ error: 'Email and password are required' });
       return;
    }

    const db = readDb();
    const user = db.users.find(
      (u: any) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );

    if (!user) {
       res.status(401).json({ error: 'Invalid email or password' });
       return;
    }

    if (user.isBlocked) {
       if (user.role === 'Employee') {
          res.status(403).json({ error: 'you are blocked please contact to your accountants' });
       } else if (user.role === 'Accountant') {
          res.status(403).json({ error: 'you are blocked please contact to 9021474371 or shihireganesh0@gmail.com to unblock' });
       } else {
          res.status(403).json({ error: 'you are blocked please contact to your accountants' });
       }
       return;
    }

    // Return profile & ID token (ID functions as Bearer Token for this applet)
    const { password: _, ...profile } = user;
    res.json({
      user: profile,
      token: user.id
    });
  });

  // Auth: Me
  app.get('/api/auth/me', (req, res) => {
    const currentUser = getAuthUser(req);
    if (!currentUser) {
       res.status(401).json({ error: 'Unauthorized' });
       return;
    }
    if (currentUser.isBlocked) {
       if (currentUser.role === 'Employee') {
          res.status(403).json({ error: 'you are blocked please contact to your accountants' });
       } else if (currentUser.role === 'Accountant') {
          res.status(403).json({ error: 'you are blocked please contact to 9021474371 or shihireganesh0@gmail.com to unblock' });
       } else {
          res.status(403).json({ error: 'you are blocked please contact to your accountants' });
       }
       return;
    }
    const { password: _, ...profile } = currentUser;
    res.json({ user: profile });
  });

  // === OWNER ACTIONS: MANAGE ACCOUNTANTS ===

  // Owner: List all accountants in the system
  app.get('/api/owner/accountants', (req, res) => {
    const currentUser = getAuthUser(req);
    if (!currentUser || currentUser.role !== 'Owner') {
       res.status(403).json({ error: 'Forbidden. Owner permissions required.' });
       return;
    }

    const db = readDb();
    const accountants = db.users
      .filter((u: any) => u.role === 'Accountant');

    res.json({ accountants });
  });

  // Owner: Add a new accountant manually (with organization details)
  app.post('/api/owner/accountants', (req, res) => {
    const currentUser = getAuthUser(req);
    if (!currentUser || currentUser.role !== 'Owner') {
       res.status(403).json({ error: 'Forbidden. Owner permissions required.' });
       return;
    }

    const { name, email, password, organizationName, logo, address, phone } = req.body;
    if (!name || !email || !password || !organizationName) {
       res.status(400).json({ error: 'Name, email, password, and organization name are required.' });
       return;
    }

    const db = readDb();
    const normalizedEmail = email.trim().toLowerCase();

    const userExists = db.users.some((u: any) => u.email.toLowerCase() === normalizedEmail);
    if (userExists) {
       res.status(409).json({ error: 'A user with this email address already exists' });
       return;
    }

    const organizationId = `org_${Date.now()}`;
    const newAccountant = {
      id: `u_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: normalizedEmail,
      password: password,
      role: 'Accountant' as const,
      organizationId,
      organizationName: organizationName.trim(),
      isBlocked: false,
      logo: logo ? logo.trim() : '',
      address: address ? address.trim() : '',
      phone: phone ? phone.trim() : ''
    };

    db.users.push(newAccountant);
    writeDb(db);

    const { password: _, ...profile } = newAccountant;
    res.status(201).json({
      message: 'Accountant manual profile setup complete.',
      accountant: profile
    });
  });

  // Owner or Accountant: Edit accountant/organization profile details
  app.put('/api/owner/accountants/:id', (req, res) => {
    const currentUser = getAuthUser(req);
    if (!currentUser) {
       res.status(401).json({ error: 'Unauthorized' });
       return;
    }

    const isOwner = currentUser.role === 'Owner';
    const isSelf = currentUser.id === req.params.id && currentUser.role === 'Accountant';

    if (!isOwner && !isSelf) {
       res.status(403).json({ error: 'Forbidden. You do not have permissions to edit this profile.' });
       return;
    }

    const { name, email, password, organizationName, logo, address, phone } = req.body;

    const db = readDb();
    const idx = db.users.findIndex((u: any) => u.id === req.params.id && u.role === 'Accountant');
    if (idx === -1) {
       res.status(404).json({ error: 'Accountant not found' });
       return;
    }

    const accountant = db.users[idx];

    if (isSelf) {
      if (email && email.trim().toLowerCase() !== accountant.email.toLowerCase()) {
        const normalizedEmail = email.trim().toLowerCase();
        const userExists = db.users.some((u: any) => u.email.toLowerCase() === normalizedEmail && u.id !== accountant.id);
        if (userExists) {
           res.status(409).json({ error: 'A user with this email address already exists' });
           return;
        }
        accountant.email = normalizedEmail;
      }

      if (name) accountant.name = name.trim();
      if (password && password.trim()) accountant.password = password;
      if (organizationName) accountant.organizationName = organizationName.trim();
      if (logo !== undefined) accountant.logo = logo.trim();
      if (address !== undefined) accountant.address = address.trim();
      if (phone !== undefined) accountant.phone = phone.trim();

      db.users[idx] = accountant;

      if (!db.profileRequests) {
        db.profileRequests = [];
      }

      // Remove previous pending request for this accountant
      db.profileRequests = db.profileRequests.filter((r: any) => !(r.accountantId === accountant.id && r.status === 'Pending'));

      const newRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        accountantId: accountant.id,
        accountantName: accountant.name,
        originalData: {
          name: accountant.name,
          email: accountant.email,
          organizationName: accountant.organizationName,
          logo: accountant.logo || '',
          address: accountant.address || '',
          phone: accountant.phone || ''
        },
        requestedData: {
          name: accountant.name,
          email: accountant.email,
          organizationName: accountant.organizationName,
          logo: accountant.logo || '',
          address: accountant.address || '',
          phone: accountant.phone || ''
        },
        status: 'Approved',
        createdAt: new Date().toISOString(),
        processedAt: new Date().toISOString()
      };

      db.profileRequests.push(newRequest);
      writeDb(db);

      const { password: _, ...profile } = accountant;
      res.json({
        message: 'Accountant profile details edited successfully',
        accountant: profile
      });
      return;
    }

    // Direct update logic (performed only by the Owner)
    if (email && email.trim().toLowerCase() !== accountant.email.toLowerCase()) {
      const normalizedEmail = email.trim().toLowerCase();
      const userExists = db.users.some((u: any) => u.email.toLowerCase() === normalizedEmail && u.id !== accountant.id);
      if (userExists) {
         res.status(409).json({ error: 'A user with this email address already exists' });
         return;
      }
      accountant.email = normalizedEmail;
    }

    if (name) accountant.name = name.trim();
    if (password && password.trim()) accountant.password = password;
    if (organizationName) accountant.organizationName = organizationName.trim();
    if (logo !== undefined) accountant.logo = logo.trim();
    if (address !== undefined) accountant.address = address.trim();
    if (phone !== undefined) accountant.phone = phone.trim();

    db.users[idx] = accountant;
    writeDb(db);

    const { password: _, ...profile } = accountant;
    res.json({
      message: 'Accountant profile details edited successfully',
      accountant: profile
    });
  });

  // Accountant: Get current active pending profile request
  app.get('/api/accountant/profile-request', (req, res) => {
    const currentUser = getAuthUser(req);
    if (!currentUser || currentUser.role !== 'Accountant') {
       res.status(403).json({ error: 'Forbidden' });
       return;
    }
    const db = readDb();
    const request = (db.profileRequests || []).find((r: any) => r.accountantId === currentUser.id && r.status === 'Pending');
    res.json({ request: request || null });
  });

  // Owner: List all pending requests
  app.get('/api/owner/profile-requests', (req, res) => {
    const currentUser = getAuthUser(req);
    if (!currentUser || currentUser.role !== 'Owner') {
       res.status(403).json({ error: 'Forbidden. Owner permissions required.' });
       return;
    }

    const db = readDb();
    const requests = (db.profileRequests || []).filter((r: any) => r.status === 'Pending');
    res.json({ requests });
  });

  // Owner: Approve profile request
  app.post('/api/owner/profile-requests/:requestId/approve', (req, res) => {
    const currentUser = getAuthUser(req);
    if (!currentUser || currentUser.role !== 'Owner') {
       res.status(403).json({ error: 'Forbidden. Owner permissions required.' });
       return;
    }

    const db = readDb();
    if (!db.profileRequests) db.profileRequests = [];

    const reqIndex = db.profileRequests.findIndex((r: any) => r.id === req.params.requestId);
    if (reqIndex === -1) {
       res.status(404).json({ error: 'Request not found' });
       return;
    }

    const request = db.profileRequests[reqIndex];
    if (request.status !== 'Pending') {
       res.status(400).json({ error: 'Request is already processed' });
       return;
    }

    // Find Accountant User
    const accIndex = db.users.findIndex((u: any) => u.id === request.accountantId && u.role === 'Accountant');
    if (accIndex === -1) {
       res.status(404).json({ error: 'Accountant user not found associated with this request' });
       return;
    }

    const accountant = db.users[accIndex];
    
    // Apply requested changes
    const updates = request.requestedData;
    accountant.name = updates.name;
    accountant.email = updates.email;
    accountant.organizationName = updates.organizationName;
    if (updates.logo !== undefined) accountant.logo = updates.logo;
    if (updates.address !== undefined) accountant.address = updates.address;
    if (updates.phone !== undefined) accountant.phone = updates.phone;
    if (updates.password) accountant.password = updates.password;

    db.users[accIndex] = accountant;
    
    // Update request status
    request.status = 'Approved';
    request.processedAt = new Date().toISOString();
    db.profileRequests[reqIndex] = request;

    writeDb(db);

    res.json({
      message: 'Profile change request approved and applied successfully.',
      request,
      accountant: { id: accountant.id, name: accountant.name, email: accountant.email }
    });
  });

  // Owner: Reject profile request
  app.post('/api/owner/profile-requests/:requestId/reject', (req, res) => {
    const currentUser = getAuthUser(req);
    if (!currentUser || currentUser.role !== 'Owner') {
       res.status(403).json({ error: 'Forbidden. Owner permissions required.' });
       return;
    }

    const db = readDb();
    if (!db.profileRequests) db.profileRequests = [];

    const reqIndex = db.profileRequests.findIndex((r: any) => r.id === req.params.requestId);
    if (reqIndex === -1) {
       res.status(404).json({ error: 'Request not found' });
       return;
    }

    const request = db.profileRequests[reqIndex];
    if (request.status !== 'Pending') {
       res.status(400).json({ error: 'Request is already processed' });
       return;
    }

    request.status = 'Rejected';
    request.processedAt = new Date().toISOString();
    db.profileRequests[reqIndex] = request;

    writeDb(db);

    res.json({
      message: 'Profile change request rejected successfully.',
      request
    });
  });

  // Owner: Toggle block/unblock state for accountants
  app.post('/api/owner/accountants/:id/toggle-block', (req, res) => {
    const currentUser = getAuthUser(req);
    if (!currentUser || currentUser.role !== 'Owner') {
       res.status(403).json({ error: 'Forbidden. Owner permissions required.' });
       return;
    }

    const db = readDb();
    const acc = db.users.find((u: any) => u.id === req.params.id && u.role === 'Accountant');
    if (!acc) {
       res.status(404).json({ error: 'Accountant of interest not found' });
       return;
    }

    acc.isBlocked = !acc.isBlocked;
    writeDb(db);

    res.json({
      message: `Accountant account has been ${acc.isBlocked ? 'blocked' : 'unblocked'} successfully.`,
      accountant: { id: acc.id, name: acc.name, email: acc.email, isBlocked: !!acc.isBlocked }
    });
  });

  // Admin Accountant: Manage Team (Create new Employees)
  app.post('/api/admin/employees', (req, res) => {
    const currentUser = getAuthUser(req);
    if (!currentUser || currentUser.role !== 'Accountant') {
       res.status(403).json({ error: 'Forbidden. Accountant permissions required.' });
       return;
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
       res.status(400).json({ error: 'Name, email, and password are required' });
       return;
    }

    const db = readDb();
    const normalizedEmail = email.trim().toLowerCase();
    
    // Strict separation: verify if account email already exists across system
    const userExists = db.users.some((u: any) => u.email.toLowerCase() === normalizedEmail);
    if (userExists) {
       res.status(409).json({ error: 'A user with this email address already exists' });
       return;
    }

    // Create and save new employee automatically grouped into accountant's organization
    const newEmployee = {
      id: `u_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: normalizedEmail,
      password: password,
      role: 'Employee' as const,
      organizationId: currentUser.organizationId,
      organizationName: currentUser.organizationName
    };

    db.users.push(newEmployee);
    writeDb(db);

    const { password: _, ...employeeProfile } = newEmployee;
    res.status(201).json({
      message: 'Employee account created successfully',
      employee: { ...employeeProfile, password: newEmployee.password }
    });
  });

  // Admin Accountant: List all employees in organization
  app.get('/api/admin/employees', (req, res) => {
    const currentUser = getAuthUser(req);
    if (!currentUser || currentUser.role !== 'Accountant') {
       res.status(403).json({ error: 'Forbidden. Accountant permissions required.' });
       return;
    }

    const db = readDb();
    // Return teammates within same org
    const team = db.users
      .filter((u: any) => u.organizationId === currentUser.organizationId && u.role === 'Employee');

    res.json({ employees: team });
  });

  // Employee: Submit New Expense
  app.post('/api/expenses', (req, res) => {
    const currentUser = getAuthUser(req);
    if (!currentUser) {
       res.status(401).json({ error: 'Unauthorized' });
       return;
    }

    if (currentUser.isBlocked) {
       res.status(403).json({ error: 'Your account has been deactivated or blocked by your accountant.' });
       return;
    }

    const { projectName, details, category, amount, date, receipt, receiptType, receipts } = req.body;

    if (!projectName || !details || !category || !amount || !date) {
       res.status(400).json({ error: 'Missing mandatory fields' });
       return;
    }

    const parsedAmount = Math.round(Number(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
       res.status(400).json({ error: 'Amount in INR must be a valid positive number' });
       return;
    }

    const db = readDb();
    if (!db.organizationCategories) {
      db.organizationCategories = {};
    }
    const allowableCategories = db.organizationCategories[currentUser.organizationId] || ['Travelling', 'Meals and Entertainment', 'Hardware/Materials', 'Others'];
    if (!allowableCategories.includes(category)) {
       res.status(400).json({ error: 'Invalid expense category' });
       return;
    }

    const newExpense = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      projectName: projectName.trim(),
      details: details.trim(),
      category: category,
      amount: parsedAmount,
      date, // YYYY-MM-DD
      receipt: receipt || undefined, // Base64 receipt data url
      receiptType: receiptType || undefined,
      receipts: receipts || undefined, // array of receipts
      createdAt: new Date().toISOString(),
      organizationId: currentUser.organizationId,
      status: 'Pending' as const
    };

    db.expenses.push(newExpense);
    writeDb(db);

    res.status(201).json({
      message: 'Expense reported successfully',
      expense: newExpense
    });
  });

  // List Expenses (Employee gets own; Accountant gets all in their Org with filter)
  app.get('/api/expenses', (req, res) => {
    const currentUser = getAuthUser(req);
    if (!currentUser) {
       res.status(401).json({ error: 'Unauthorized' });
       return;
    }

    const db = readDb();

    if (currentUser.role === 'Employee') {
      // Return own employee records
      const myExpenses = db.expenses
        .filter((exp: any) => exp.userId === currentUser.id)
        .map((exp: any) => ({ ...exp, status: exp.status || 'Approved' }))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      res.json({ expenses: myExpenses });
    } else {
      // Accountant sees everyone in their same Organization ID
      let orgExpenses = db.expenses.filter((exp: any) => exp.organizationId === currentUser.organizationId);

      // Apply Filters
      const { startDate, endDate, projectName, employeeId, status } = req.query;

      if (startDate) {
        orgExpenses = orgExpenses.filter((exp: any) => exp.date >= (startDate as string));
      }
      if (endDate) {
        orgExpenses = orgExpenses.filter((exp: any) => exp.date <= (endDate as string));
      }
      if (projectName) {
        const queryProject = (projectName as string).toLowerCase().trim();
        orgExpenses = orgExpenses.filter((exp: any) => exp.projectName.toLowerCase().includes(queryProject));
      }
      if (employeeId) {
        orgExpenses = orgExpenses.filter((exp: any) => exp.userId === (employeeId as string));
      }

      // Format expenses and then sort/filter by status
      let mappedExpenses = orgExpenses.map((exp: any) => ({
        ...exp,
        status: exp.status || 'Approved'
      }));

      if (status) {
        mappedExpenses = mappedExpenses.filter((exp: any) => exp.status === (status as string));
      }

      // Sort by newer first
      mappedExpenses.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      res.json({ expenses: mappedExpenses });
    }
  });

  // Accountant: Change status of an expense (Approve / Reject)
  app.patch('/api/expenses/:id/status', (req, res) => {
    const currentUser = getAuthUser(req);
    if (!currentUser || currentUser.role !== 'Accountant') {
       res.status(403).json({ error: 'Forbidden. Accountant permissions required.' });
       return;
    }

    const { status } = req.body;
    if (!status || !['Pending', 'Approved', 'Rejected'].includes(status)) {
       res.status(400).json({ error: 'Invalid status update directive.' });
       return;
    }

    const db = readDb();
    const expense = db.expenses.find((e: any) => e.id === req.params.id && e.organizationId === currentUser.organizationId);
    if (!expense) {
       res.status(404).json({ error: 'Expense log not found under organization bounds' });
       return;
    }

    expense.status = status;
    writeDb(db);

    res.json({ message: `Expense report marked as ${status} successfully.`, expense });
  });

  // Accountant: Toggle block/unblock state for a teammate
  app.post('/api/admin/employees/:id/toggle-block', (req, res) => {
    const currentUser = getAuthUser(req);
    if (!currentUser || currentUser.role !== 'Accountant') {
       res.status(403).json({ error: 'Forbidden. Accountant permissions required.' });
       return;
    }

    const db = readDb();
    const emp = db.users.find((u: any) => u.id === req.params.id && u.organizationId === currentUser.organizationId && u.role === 'Employee');
    if (!emp) {
       res.status(404).json({ error: 'Employee account not found' });
       return;
    }

    emp.isBlocked = !emp.isBlocked;
    writeDb(db);

    res.json({ 
      message: `Teammate successfully ${emp.isBlocked ? 'blocked' : 'unblocked'}.`, 
      employee: { id: emp.id, name: emp.name, email: emp.email, isBlocked: !!emp.isBlocked }
    });
  });

  // Accountant & Employee: Get all categories relative to their organization
  app.get('/api/categories', (req, res) => {
    const currentUser = getAuthUser(req);
    if (!currentUser) {
       res.status(401).json({ error: 'Unauthorized' });
       return;
    }

    const db = readDb();
    if (!db.organizationCategories) {
      db.organizationCategories = {};
    }
    const orgId = currentUser.organizationId;
    const categories = db.organizationCategories[orgId] || ['Travelling', 'Meals and Entertainment', 'Hardware/Materials', 'Others'];
    res.json({ categories });
  });

  // Accountant: Add a dynamic billing/expense category options
  app.post('/api/categories', (req, res) => {
    const currentUser = getAuthUser(req);
    if (!currentUser || currentUser.role !== 'Accountant') {
       res.status(403).json({ error: 'Forbidden. Accountant permissions required.' });
       return;
    }

    const { category } = req.body;
    if (!category || typeof category !== 'string' || !category.trim()) {
       res.status(400).json({ error: 'Valid expense category name is required.' });
       return;
    }

    const db = readDb();
    if (!db.organizationCategories) {
      db.organizationCategories = {};
    }
    const orgId = currentUser.organizationId;
    if (!db.organizationCategories[orgId]) {
      db.organizationCategories[orgId] = ['Travelling', 'Meals and Entertainment', 'Hardware/Materials', 'Others'];
    }

    const trimmedCat = category.trim();
    if (db.organizationCategories[orgId].some((c: string) => c.toLowerCase() === trimmedCat.toLowerCase())) {
       res.status(400).json({ error: 'Category already exists under organization bounds.' });
       return;
    }

    db.organizationCategories[orgId].push(trimmedCat);
    writeDb(db);

    res.json({ 
      message: 'Dynamic category registered successfully',
      categories: db.organizationCategories[orgId] 
    });
  });

  // Accountant: Delete/remove dynamic billing/expense category
  app.post('/api/categories/delete', (req, res) => {
    const currentUser = getAuthUser(req);
    if (!currentUser || currentUser.role !== 'Accountant') {
       res.status(403).json({ error: 'Forbidden. Accountant permissions required.' });
       return;
    }

    const { category } = req.body;
    if (!category) {
       res.status(400).json({ error: 'Category name is required to execute deletion' });
       return;
    }

    const db = readDb();
    if (!db.organizationCategories) {
      db.organizationCategories = {};
    }
    const orgId = currentUser.organizationId;
    if (!db.organizationCategories[orgId]) {
      db.organizationCategories[orgId] = ['Travelling', 'Meals and Entertainment', 'Hardware/Materials', 'Others'];
    }

    db.organizationCategories[orgId] = db.organizationCategories[orgId].filter(
      (c: string) => c.toLowerCase() !== category.trim().toLowerCase()
    );
    writeDb(db);

    res.json({ 
      message: 'Dynamic category removed successfully',
      categories: db.organizationCategories[orgId] 
    });
  });

  // Accountant & Employee: Get all projects relative to their organization
  app.get('/api/projects', (req, res) => {
    const currentUser = getAuthUser(req);
    if (!currentUser) {
       res.status(401).json({ error: 'Unauthorized' });
       return;
    }

    const db = readDb();
    if (!db.organizationProjects) {
      db.organizationProjects = {};
    }
    const orgId = currentUser.organizationId;
    const projects = db.organizationProjects[orgId] || ['Alpha Upgrade', 'Client Onboarding', 'Marketing Summit'];
    res.json({ projects });
  });

  // Accountant: Add a dynamic project option
  app.post('/api/projects', (req, res) => {
    const currentUser = getAuthUser(req);
    if (!currentUser || currentUser.role !== 'Accountant') {
       res.status(403).json({ error: 'Forbidden. Accountant permissions required.' });
       return;
    }

    const { project } = req.body;
    if (!project || typeof project !== 'string' || !project.trim()) {
       res.status(400).json({ error: 'Valid project name is required.' });
       return;
    }

    const db = readDb();
    if (!db.organizationProjects) {
      db.organizationProjects = {};
    }
    const orgId = currentUser.organizationId;
    if (!db.organizationProjects[orgId]) {
      db.organizationProjects[orgId] = ['Alpha Upgrade', 'Client Onboarding', 'Marketing Summit'];
    }

    const trimmedProj = project.trim();
    if (db.organizationProjects[orgId].some((p: string) => p.toLowerCase() === trimmedProj.toLowerCase())) {
       res.status(400).json({ error: 'Project already exists under organization bounds.' });
       return;
    }

    db.organizationProjects[orgId].push(trimmedProj);
    writeDb(db);

    res.json({ 
      message: 'Dynamic project registered successfully',
      projects: db.organizationProjects[orgId] 
    });
  });

  // Accountant: Remove dynamic project option
  app.post('/api/projects/delete', (req, res) => {
    const currentUser = getAuthUser(req);
    if (!currentUser || currentUser.role !== 'Accountant') {
       res.status(403).json({ error: 'Forbidden. Accountant permissions required.' });
       return;
    }

    const { project } = req.body;
    if (!project) {
       res.status(400).json({ error: 'Project name is required to execute deletion' });
       return;
    }

    const db = readDb();
    if (!db.organizationProjects) {
      db.organizationProjects = {};
    }
    const orgId = currentUser.organizationId;
    if (!db.organizationProjects[orgId]) {
      db.organizationProjects[orgId] = ['Alpha Upgrade', 'Client Onboarding', 'Marketing Summit'];
    }

    db.organizationProjects[orgId] = db.organizationProjects[orgId].filter(
      (p: string) => p.toLowerCase() !== project.trim().toLowerCase()
    );
    writeDb(db);

    res.json({ 
      message: 'Dynamic project removed successfully',
      projects: db.organizationProjects[orgId] 
    });
  });

  // --- INTEGRATION WITH VITE FRONTEND ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve client router fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running and listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('[Server Startup Failure]:', error);
});
