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

app.get('/api/health', async (req, res) => {
  const mysql = await db.ping();
  res.json({ ok: true, service: 'hrm-backend', at: new Date().toISOString(), mysql });
});

app.post('/api/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dữ liệu đăng nhập không hợp lệ.' });
  }

  if (!db.isMySqlEnabled()) {
    return res.status(503).json({ message: 'Hệ thống yêu cầu bật USE_MYSQL=true để đăng nhập.' });
  }

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
  const status = String(req.query.status || '').trim();
  const department = String(req.query.department || '').trim();

  if (!db.isMySqlEnabled()) {
    return res.status(503).json({ message: 'Hệ thống yêu cầu bật USE_MYSQL=true.' });
  }

  try {
    const rows = await db.listEmployees({ status, department });
    return res.json(rows);
  } catch (error) {
    console.error('List employees from MySQL failed:', error);
    return res.status(500).json({ message: 'Lỗi truy vấn danh sách nhân viên.' });
  }
});

app.post('/api/employees', async (req, res) => {
  if (!db.isMySqlEnabled()) {
    return res.status(503).json({ message: 'Hệ thống yêu cầu bật USE_MYSQL=true.' });
  }

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
  if (!db.isMySqlEnabled()) {
    return res.status(503).json({ message: 'Hệ thống yêu cầu bật USE_MYSQL=true.' });
  }

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

    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên.' });
    }

    return res.json(updated);
  } catch (error) {
    console.error('Update employee failed:', error);
    return res.status(500).json({ message: 'Lỗi cập nhật nhân viên.' });
  }
});

app.get('/api/employees/managers', async (req, res) => {
  if (!db.isMySqlEnabled()) {
    return res.status(503).json({ message: 'Hệ thống yêu cầu bật USE_MYSQL=true.' });
  }

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
  if (!db.isMySqlEnabled()) {
    return res.status(503).json({ message: 'Hệ thống yêu cầu bật USE_MYSQL=true.' });
  }

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
  if (!db.isMySqlEnabled()) {
    return res.status(503).json({ message: 'Hệ thống yêu cầu bật USE_MYSQL=true.' });
  }

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
  if (!db.isMySqlEnabled()) {
    return res.status(503).json({ message: 'Hệ thống yêu cầu bật USE_MYSQL=true.' });
  }

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

app.post('/api/payroll/calculate', (req, res) => {
  const schema = z.object({ grossSalary: z.number().positive() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'grossSalary phải là số dương.' });
  }

  return res.json(calculatePayroll(parsed.data.grossSalary));
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
