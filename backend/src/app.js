const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { z } = require('zod');
const db = require('./db');

const app = express();

const allowedOrigins = String(process.env.CORS_ORIGIN || '')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true
  })
);
app.use(express.json());
app.use(morgan('dev'));

const insuranceRates = { bhxh: 0.08, bhyt: 0.015, bhtn: 0.01 };
const progressiveTaxBrackets = [
  { cap: 5_000_000, rate: 0.05 },
  { cap: 10_000_000, rate: 0.1 },
  { cap: 18_000_000, rate: 0.15 },
  { cap: 32_000_000, rate: 0.2 },
  { cap: 52_000_000, rate: 0.25 },
  { cap: 80_000_000, rate: 0.3 },
  { cap: Number.POSITIVE_INFINITY, rate: 0.35 }
];

const allowedMenuKeys = ['employees', 'recruitment', 'payroll', 'performance', 'work', 'training', 'forms'];

function calculatePit(taxableIncome) {
  let remaining = taxableIncome;
  let lowerBound = 0;
  let tax = 0;

  for (const bracket of progressiveTaxBrackets) {
    if (remaining <= 0) break;
    const taxableAtBracket = Math.min(remaining, bracket.cap - lowerBound);
    tax += taxableAtBracket * bracket.rate;
    remaining -= taxableAtBracket;
    lowerBound = bracket.cap;
  }

  return tax;
}

function calculatePayroll(grossSalary) {
  const bhxh = grossSalary * insuranceRates.bhxh;
  const bhyt = grossSalary * insuranceRates.bhyt;
  const bhtn = grossSalary * insuranceRates.bhtn;
  const insuranceTotal = bhxh + bhyt + bhtn;
  const taxableIncome = Math.max(0, grossSalary - insuranceTotal);
  const personalIncomeTax = calculatePit(taxableIncome);
  const netSalary = grossSalary - insuranceTotal - personalIncomeTax;

  return {
    grossSalary,
    taxableIncome,
    insurance: { bhxh, bhyt, bhtn, total: insuranceTotal },
    personalIncomeTax,
    netSalary
  };
}

function isFailedWorkTask(task, now) {
  const progress = Math.max(0, Math.min(100, Number(task?.progress) || 0));
  const isCancelled = task?.status === 'cancelled';
  if (isCancelled) return false;

  const hasIncompleteDone = task?.status === 'done' && progress < 100;

  let isOverdueIncomplete = false;
  if (task?.dueDate) {
    const due = new Date(task.dueDate);
    if (!Number.isNaN(due.getTime())) {
      isOverdueIncomplete = due.getTime() < now.getTime() && progress < 100;
    }
  }

  return hasIncompleteDone || isOverdueIncomplete;
}

function calculatePerformanceKpiSummary(payrollRows, tasks, reviews) {
  const payrollNet = payrollRows.map((x) => Number(x.netSalary || 0));
  const maxNet = payrollNet.length ? Math.max(...payrollNet, 1) : 1;
  const avgNet = payrollNet.length ? payrollNet.reduce((s, x) => s + x, 0) / payrollNet.length : 0;
  const kpiPayroll = Math.round(Math.min(100, (avgNet / maxNet) * 100));

  const now = new Date();
  const delayedTaskReasons = tasks
    .filter((task) => isFailedWorkTask(task, now))
    .map((task) => {
      const progress = Math.max(0, Math.min(100, Number(task.progress) || 0));

      let reason = `Công việc đã quá hạn nhưng tiến độ mới đạt ${progress}% (chưa hoàn thành).`;
      if (task.status === 'done' && progress < 100) {
        reason = `Công việc đã được đánh dấu done nhưng tiến độ chỉ ${progress}% (< 100%).`;
      }

      return {
        taskId: task.id,
        title: task.title || 'Không có tiêu đề',
        assigneeName: task.assigneeName || '—',
        dueDate: task.dueDate || now.toISOString(),
        progress,
        reason
      };
    });

  const hasDelayedTasks = delayedTaskReasons.length > 0;
  const workPoints = tasks.map((t) => {
    const statusPoint = t.status === 'done' ? 100 : t.status === 'review' ? 80 : t.status === 'in_progress' ? 60 : t.status === 'todo' ? 30 : 0;
    const priorityWeight = t.priority === 'urgent' ? 1.2 : t.priority === 'high' ? 1.1 : 1;
    return Math.min(100, statusPoint * priorityWeight);
  });

  const rawKpiWork = workPoints.length ? Math.round(workPoints.reduce((s, x) => s + x, 0) / workPoints.length) : 0;
  const kpiWork = hasDelayedTasks ? Math.min(rawKpiWork, 49) : rawKpiWork;

  const kpiReview = reviews.length ? Math.round(reviews.reduce((s, x) => s + Number(x.score || 0), 0) / reviews.length) : 0;
  const kpiTotal = Math.round(kpiPayroll * 0.35 + kpiWork * 0.35 + kpiReview * 0.3);

  return {
    kpiPayroll,
    kpiWork,
    kpiReview,
    kpiTotal,
    reviews,
    workKpiPassed: !hasDelayedTasks,
    delayedTaskReasons
  };
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const employeeCreateSchema = z.object({
  fullName: z.string().min(1),
  department: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(['active', 'onboarding', 'probation', 'intern', 'trainee', 'inactive']).default('onboarding'),
  gender: z.enum(['male', 'female', 'other']).default('other'),
  age: z.number().int().min(16).max(80).default(25),
  educationLevel: z.enum(['Trung cấp', 'Cao đẳng', 'Đại học', 'Sau đại học', 'Khác']).default('Đại học'),
  objectType: z.enum(['Chuyên môn', 'Công tác viên', 'Thực tập sinh', 'Học viên', 'Viên chức']).default('Chuyên môn'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal(''))
});

const accountUpsertSchema = z.object({
  email: z.string().email(),
  username: z.string().min(1),
  password: z.string().min(1),
  active: z.boolean(),
  menuPermissions: z.array(z.enum(allowedMenuKeys)).min(1)
});

const payrollCreateSchema = z.object({
  employeeId: z.string().min(1),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  grossSalary: z.number().positive(),
  status: z.enum(['draft', 'confirmed', 'paid']).default('draft')
});

function ensureMySql(req, res) {
  if (!db.isMySqlEnabled()) {
    res.status(503).json({ message: 'Hệ thống yêu cầu bật USE_MYSQL=true.' });
    return false;
  }
  return true;
}

app.get('/api/health', async (req, res) => {
  const mysql = await db.ping();
  res.json({ ok: true, service: 'hrm-backend', at: new Date().toISOString(), mysql });
});

app.post('/api/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dữ liệu đăng nhập không hợp lệ.' });
  }

  if (!ensureMySql(req, res)) return;

  const { email, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await db.authenticateUser(normalizedEmail, password);
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng, hoặc tài khoản chưa được kích hoạt.' });
    }

    return res.json({
      token: `demo-jwt-${Date.now()}`,
      displayName: user.displayName,
      email: user.email,
      menuPermissions: user.menuPermissions
    });
  } catch (error) {
    console.error('Login with MySQL failed:', error);
    return res.status(500).json({ message: 'Lỗi kết nối dữ liệu đăng nhập.' });
  }
});

app.get('/api/employees', async (req, res) => {
  if (!ensureMySql(req, res)) return;

  const status = String(req.query.status || '').trim();
  const department = String(req.query.department || '').trim();

  try {
    const rows = await db.listEmployees({ status, department });
    return res.json(rows);
  } catch (error) {
    console.error('List employees from MySQL failed:', error);
    return res.status(500).json({ message: 'Lỗi truy vấn danh sách nhân viên.' });
  }
});

app.post('/api/employees', async (req, res) => {
  if (!ensureMySql(req, res)) return;

  const parsed = employeeCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dữ liệu tạo nhân viên không hợp lệ.' });
  }

  const payload = parsed.data;

  try {
    const now = Date.now();
    const id = `EMP-${String(now).slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const code = `NV${String(now).slice(-6)}`;

    const created = await db.createEmployee({
      id,
      code,
      fullName: payload.fullName,
      email: payload.email || null,
      phone: payload.phone || null,
      department: payload.department,
      title: payload.title,
      status: payload.status,
      gender: payload.gender,
      age: payload.age,
      educationLevel: payload.educationLevel,
      objectType: payload.objectType
    });

    return res.status(201).json(created);
  } catch (error) {
    console.error('Create employee failed:', error);
    return res.status(500).json({ message: 'Lỗi tạo nhân viên.' });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  if (!ensureMySql(req, res)) return;

  const parsed = employeeCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dữ liệu cập nhật nhân viên không hợp lệ.' });
  }

  const payload = parsed.data;
  try {
    const updated = await db.updateEmployee(req.params.id, {
      fullName: payload.fullName,
      email: payload.email || null,
      phone: payload.phone || null,
      department: payload.department,
      title: payload.title,
      status: payload.status,
      gender: payload.gender,
      age: payload.age,
      educationLevel: payload.educationLevel,
      objectType: payload.objectType
    });

    if (!updated) return res.status(404).json({ message: 'Không tìm thấy nhân viên.' });

    return res.json(updated);
  } catch (error) {
    console.error('Update employee failed:', error);
    return res.status(500).json({ message: 'Lỗi cập nhật nhân viên.' });
  }
});

app.get('/api/employees/managers', async (req, res) => {
  if (!ensureMySql(req, res)) return;

  const q = String(req.query.q || '').trim();
  try {
    const rows = await db.listManagers(q);
    return res.json(rows);
  } catch (error) {
    console.error('List managers failed:', error);
    return res.status(500).json({ message: 'Lỗi truy vấn quản lý trực tiếp.' });
  }
});

app.get('/api/employees/:id', async (req, res) => {
  if (!ensureMySql(req, res)) return;

  try {
    const item = await db.getEmployeeById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Không tìm thấy nhân viên.' });
    return res.json(item);
  } catch (error) {
    console.error('Get employee by id failed:', error);
    return res.status(500).json({ message: 'Lỗi truy vấn chi tiết nhân viên.' });
  }
});

app.get('/api/employees/:id/account', async (req, res) => {
  if (!ensureMySql(req, res)) return;

  try {
    const account = await db.getEmployeeAccount(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Nhân viên chưa có tài khoản.' });
    }
    return res.json(account);
  } catch (error) {
    console.error('Get employee account failed:', error);
    return res.status(500).json({ message: 'Lỗi truy vấn tài khoản nhân viên.' });
  }
});

app.post('/api/employees/:id/account', async (req, res) => {
  if (!ensureMySql(req, res)) return;

  const parsed = accountUpsertSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dữ liệu tài khoản không hợp lệ.' });
  }

  try {
    const account = await db.upsertEmployeeAccount(req.params.id, parsed.data);
    return res.json(account);
  } catch (error) {
    console.error('Upsert employee account failed:', error);
    return res.status(500).json({ message: 'Lỗi lưu tài khoản nhân viên.' });
  }
});

app.get('/api/recruitment/jobs', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  try {
    const rows = await db.listJobs();
    return res.json(rows);
  } catch (error) {
    console.error('List recruitment jobs failed:', error);
    return res.status(500).json({ message: 'Lỗi truy vấn danh sách tin tuyển dụng.' });
  }
});

app.get('/api/recruitment/candidates', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  try {
    const rows = await db.listCandidates();
    return res.json(rows);
  } catch (error) {
    console.error('List recruitment candidates failed:', error);
    return res.status(500).json({ message: 'Lỗi truy vấn danh sách ứng viên.' });
  }
});

app.get('/api/payroll/records', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  try {
    const rows = await db.listPayrolls();
    return res.json(rows);
  } catch (error) {
    console.error('List payroll records failed:', error);
    return res.status(500).json({ message: 'Lỗi truy vấn dữ liệu bảng lương.' });
  }
});

app.post('/api/payroll/records', async (req, res) => {
  if (!ensureMySql(req, res)) return;

  const parsed = payrollCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dữ liệu tạo bảng lương không hợp lệ.' });
  }

  const payload = parsed.data;
  const computed = calculatePayroll(payload.grossSalary);

  try {
    const row = await db.createPayroll({
      id: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      employeeId: payload.employeeId,
      period: payload.period,
      grossSalary: computed.grossSalary,
      insuranceTotal: computed.insurance.total,
      personalIncomeTax: computed.personalIncomeTax,
      netSalary: computed.netSalary,
      status: payload.status
    });

    return res.status(201).json(row);
  } catch (error) {
    console.error('Create payroll record failed:', error);
    return res.status(500).json({ message: 'Lỗi tạo dữ liệu bảng lương.' });
  }
});

app.post('/api/payroll/calculate', (req, res) => {
  const schema = z.object({ grossSalary: z.number().positive() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'grossSalary phải là số dương.' });
  }

  return res.json(calculatePayroll(parsed.data.grossSalary));
});

app.get('/api/performance/reviews', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  try {
    const rows = await db.listPerformanceReviews();
    return res.json(rows);
  } catch (error) {
    console.error('List performance reviews failed:', error);
    return res.status(500).json({ message: 'Lỗi truy vấn dữ liệu đánh giá.' });
  }
});

app.get('/api/performance/dashboard', async (req, res) => {
  if (!ensureMySql(req, res)) return;

  try {
    const [payrollRows, tasks, reviews] = await Promise.all([
      db.listPayrolls(),
      db.listWorkTasks(),
      db.listPerformanceReviews()
    ]);

    const summary = calculatePerformanceKpiSummary(payrollRows, tasks, reviews);
    return res.json(summary);
  } catch (error) {
    console.error('Get performance dashboard failed:', error);
    return res.status(500).json({ message: 'Lỗi truy vấn dashboard hiệu suất.' });
  }
});

app.get('/api/work/tasks', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  try {
    const rows = await db.listWorkTasks();
    return res.json(rows);
  } catch (error) {
    console.error('List work tasks failed:', error);
    return res.status(500).json({ message: 'Lỗi truy vấn công việc.' });
  }
});

app.post('/api/work/tasks', async (req, res) => {
  if (!ensureMySql(req, res)) return;

  const schema = z.object({
    title: z.string().min(1),
    assigneeName: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    status: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']).default('todo'),
    progress: z.coerce.number().min(0).max(100).optional(),
    receiverName: z.string().nullable().optional(),
    assignerName: z.string().nullable().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dữ liệu công việc không hợp lệ.' });
  }

  try {
    const row = await db.createWorkTask({
      id: `TSK-${Date.now()}`,
      title: parsed.data.title,
      assigneeId: null,
      assigneeName: parsed.data.assigneeName ?? null,
      dueDate: parsed.data.dueDate ?? null,
      priority: parsed.data.priority,
      status: parsed.data.status,
      progress: Math.max(0, Math.min(100, Number(parsed.data.progress) || 0)),
      receiverName: parsed.data.receiverName ?? null,
      assignerName: parsed.data.assignerName ?? null
    });

    return res.status(201).json(row);
  } catch (error) {
    console.error('Create work task failed:', error);
    return res.status(500).json({ message: 'Lỗi tạo công việc.' });
  }
});

app.patch('/api/work/tasks/:id', async (req, res) => {
  if (!ensureMySql(req, res)) return;

  const schema = z.object({
    title: z.string().min(1),
    assigneeName: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    status: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']),
    progress: z.coerce.number().min(0).max(100).optional(),
    receiverName: z.string().nullable().optional(),
    assignerName: z.string().nullable().optional()
  }).partial().extend({
    title: z.string().min(1).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    status: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']).optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dữ liệu cập nhật công việc không hợp lệ.' });
  }

  const normalized = {
    title: parsed.data.title,
    assigneeName: parsed.data.assigneeName ?? null,
    dueDate: parsed.data.dueDate || null,
    priority: parsed.data.priority,
    status: parsed.data.status,
    progress: Math.max(0, Math.min(100, Number(parsed.data.progress) || 0)),
    receiverName: parsed.data.receiverName ?? null,
    assignerName: parsed.data.assignerName ?? null
  };

  console.log('[WORK][PATCH] request', {
    id: req.params.id,
    body: req.body,
    normalized
  });

  try {
    const row = await db.updateWorkTask(req.params.id, normalized);

    console.log('[WORK][PATCH] db.updateWorkTask result', {
      id: req.params.id,
      row
    });

    if (row) {
      return res.json(row);
    }

    const created = await db.createWorkTask({
      id: req.params.id,
      assigneeId: null,
      ...normalized
    });

    return res.status(201).json({ ...created, createdFromPatch: true });
  } catch (error) {
    console.error('Update work task failed:', error);
    return res.status(500).json({ message: 'Lỗi cập nhật công việc.' });
  }
});

app.get('/api/training/courses', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  try {
    const rows = await db.listTrainingCourses();
    return res.json(rows);
  } catch (error) {
    console.error('List training courses failed:', error);
    return res.status(500).json({ message: 'Lỗi truy vấn khoá đào tạo.' });
  }
});

app.get('/api/forms/requests', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  try {
    const rows = await db.listFormRequests();
    return res.json(rows);
  } catch (error) {
    console.error('List form requests failed:', error);
    return res.status(500).json({ message: 'Lỗi truy vấn biểu mẫu.' });
  }
});

app.get('/api/benefits/plans', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  try {
    const rows = await db.listBenefitPlans();
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi truy vấn gói phúc lợi.' });
  }
});

app.post('/api/benefits/plans', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  const schema = z.object({
    name: z.string().min(1),
    category: z.enum(['insurance', 'meal', 'allowance', 'health', 'other']),
    monthlyBudget: z.number().nonnegative(),
    enabled: z.boolean()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Dữ liệu gói phúc lợi không hợp lệ.' });
  try {
    const row = await db.createBenefitPlan({ id: `BEN-${Date.now()}`, ...parsed.data });
    return res.status(201).json(row);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi tạo gói phúc lợi.' });
  }
});

app.get('/api/benefits/claims', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  try {
    const rows = await db.listBenefitClaims();
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi truy vấn claim phúc lợi.' });
  }
});

app.patch('/api/benefits/claims/:id/status', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  const schema = z.object({ status: z.enum(['new', 'processing', 'approved', 'rejected', 'paid']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Trạng thái claim không hợp lệ.' });
  try {
    await db.updateBenefitClaimStatus(req.params.id, parsed.data.status);
    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi cập nhật trạng thái claim.' });
  }
});

app.get('/api/offboarding', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  try {
    const rows = await db.listOffboarding();
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi truy vấn offboarding.' });
  }
});

app.post('/api/offboarding', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  const schema = z.object({
    employeeId: z.string().min(1),
    employeeName: z.string().min(1),
    department: z.string().min(1),
    lastWorkingDate: z.string().min(1),
    reason: z.enum(['resign', 'terminate', 'retire', 'contract-end', 'other']),
    status: z.enum(['initiated', 'handover', 'clearance', 'completed', 'cancelled']),
    handoverOwner: z.string().nullable().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Dữ liệu offboarding không hợp lệ.' });
  try {
    const row = await db.createOffboarding({ id: `OFF-${Date.now()}`, ...parsed.data });
    return res.status(201).json(row);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi tạo offboarding.' });
  }
});

app.patch('/api/offboarding/:id/status', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  const schema = z.object({ status: z.enum(['initiated', 'handover', 'clearance', 'completed', 'cancelled']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Trạng thái offboarding không hợp lệ.' });
  try {
    await db.updateOffboardingStatus(req.params.id, parsed.data.status);
    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi cập nhật trạng thái offboarding.' });
  }
});

app.get('/api/decisions', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  try {
    const rows = await db.listDecisions();
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi truy vấn quyết định.' });
  }
});

app.post('/api/decisions', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  const schema = z.object({
    code: z.string().min(1),
    type: z.enum(['transfer', 'appoint', 'discipline', 'reward', 'salary-adjustment']),
    employeeId: z.string().min(1),
    employeeName: z.string().min(1),
    departmentFrom: z.string().nullable().optional(),
    departmentTo: z.string().nullable().optional(),
    titleFrom: z.string().nullable().optional(),
    titleTo: z.string().nullable().optional(),
    effectiveDate: z.string().min(1),
    status: z.enum(['draft', 'pending', 'approved', 'rejected', 'effective']),
    note: z.string().nullable().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Dữ liệu quyết định không hợp lệ.' });
  try {
    const row = await db.createDecision({ id: `DEC-${Date.now()}`, ...parsed.data });
    return res.status(201).json(row);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi tạo quyết định.' });
  }
});

app.patch('/api/decisions/:id/status', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  const schema = z.object({ status: z.enum(['draft', 'pending', 'approved', 'rejected', 'effective']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Trạng thái quyết định không hợp lệ.' });
  try {
    await db.updateDecisionStatus(req.params.id, parsed.data.status);
    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi cập nhật trạng thái quyết định.' });
  }
});

app.get('/api/reports', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  try {
    const rows = await db.listReports();
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi truy vấn báo cáo.' });
  }
});

app.post('/api/reports/:id/run', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  try {
    const row = await db.runReport(req.params.id);
    return res.json({ ok: true, at: row?.lastRunAt || new Date().toISOString() });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi chạy báo cáo.' });
  }
});

app.get('/api/settings/departments', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  try {
    const rows = await db.listDepartments(String(req.query.q || ''));
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi truy vấn phòng ban.' });
  }
});

app.post('/api/settings/departments', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  const schema = z.object({ code: z.string().min(1), name: z.string().min(1), active: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Dữ liệu phòng ban không hợp lệ.' });
  try {
    const row = await db.createDepartment({ id: `DEP-${Date.now()}`, ...parsed.data });
    return res.status(201).json(row);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi tạo phòng ban.' });
  }
});

app.patch('/api/settings/departments/:id/toggle', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  try {
    await db.toggleDepartment(req.params.id);
    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi đổi trạng thái phòng ban.' });
  }
});

app.get('/api/settings/titles', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  try {
    const rows = await db.listTitles();
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi truy vấn chức danh.' });
  }
});

app.post('/api/settings/titles', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  const schema = z.object({ name: z.string().min(1), active: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Dữ liệu chức danh không hợp lệ.' });
  try {
    const row = await db.createTitle({ id: `TTL-${Date.now()}`, ...parsed.data });
    return res.status(201).json(row);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi tạo chức danh.' });
  }
});

app.patch('/api/settings/titles/:id/toggle', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  try {
    await db.toggleTitle(req.params.id);
    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi đổi trạng thái chức danh.' });
  }
});

app.get('/api/settings/workplaces', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  try {
    const rows = await db.listWorkplaces();
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi truy vấn nơi làm việc.' });
  }
});

app.post('/api/settings/workplaces', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  const schema = z.object({ name: z.string().min(1), active: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Dữ liệu nơi làm việc không hợp lệ.' });
  try {
    const row = await db.createWorkplace({ id: `WPL-${Date.now()}`, ...parsed.data });
    return res.status(201).json(row);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi tạo nơi làm việc.' });
  }
});

app.patch('/api/settings/workplaces/:id/toggle', async (req, res) => {
  if (!ensureMySql(req, res)) return;
  try {
    await db.toggleWorkplace(req.params.id);
    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi đổi trạng thái nơi làm việc.' });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError) {
    return res.status(400).json({ message: 'JSON body không hợp lệ.' });
  }
  console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
});

module.exports = { app };
