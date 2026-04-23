const dayMs = 24 * 60 * 60 * 1000;

const departments = [
  { id: 'DEP-001', code: 'PB-A', name: 'Phòng ban A', active: true },
  { id: 'DEP-002', code: 'PB-B', name: 'Phòng ban B', active: true },
  { id: 'DEP-003', code: 'PB-C', name: 'Phòng ban C', active: false }
];

const titles = [
  { id: 'TTL-001', name: 'Chuyên viên', active: true },
  { id: 'TTL-002', name: 'Tổ trưởng', active: true },
  { id: 'TTL-003', name: 'Quản lý', active: true }
];

const workplaces = [
  { id: 'WPL-001', name: 'Văn phòng A', active: true },
  { id: 'WPL-002', name: 'Văn phòng B', active: true }
];

const employees = Array.from({ length: 44 }, (_, i) => {
  const n = i + 1;
  const statuses = ['active', 'probation', 'intern', 'trainee', 'onboarding', 'inactive'];
  const depts = ['Phòng ban A', 'Phòng ban B', 'Phòng ban C'];
  const titleRows = [
    'Chuyên viên kỹ thuật bậc 1',
    'Chuyên viên kỹ thuật bậc 2',
    'Chuyên viên',
    'Nhà quản lý',
    'Kỹ thuật viên VT1'
  ];

  return {
    id: `EMP-${String(n).padStart(3, '0')}`,
    code: `NV${String(n).padStart(3, '0')}`,
    fullName: `Nhân viên ${n}`,
    email: `nhanvien${n}@company.vn`,
    phone: `090${String(1000000 + n).slice(0, 7)}`,
    department: depts[n % depts.length],
    title: titleRows[n % titleRows.length],
    status: statuses[n % statuses.length],
    age: 20 + (n % 25),
    createdAt: new Date(Date.now() - n * dayMs).toISOString()
  };
});

const candidates = [
  {
    id: 'C-001',
    fullName: 'Nguyễn Gia Hân',
    email: 'han.nguyen@gmail.com',
    appliedRole: 'Frontend Developer',
    stage: 'interview',
    phone: '0901111111',
    source: 'google-form',
    appliedAt: new Date(Date.now() - 2 * dayMs).toISOString(),
    city: 'Hà Nội',
    yearsOfExperience: 3,
    skills: ['Angular', 'RxJS', 'NgRx'],
    summary: 'Đã từng làm hệ thống CRM nội bộ 3 năm.'
  },
  {
    id: 'C-002',
    fullName: 'Phạm Trí Đức',
    email: 'duc.pham@gmail.com',
    appliedRole: 'Backend Developer',
    stage: 'screening',
    phone: '0902222222',
    source: 'linkedin',
    appliedAt: new Date(Date.now() - 7 * dayMs).toISOString(),
    city: 'Đà Nẵng',
    yearsOfExperience: 4,
    skills: ['Node.js', 'NestJS', 'PostgreSQL'],
    summary: 'Kinh nghiệm backend và tích hợp API lớn.'
  }
];

const jobs = [
  { id: 'J-001', title: 'Frontend Developer', department: 'Engineering', openings: 2, postedAt: '2026-04-01', status: 'open' },
  { id: 'J-002', title: 'Backend Developer', department: 'Engineering', openings: 1, postedAt: '2026-04-02', status: 'open' },
  { id: 'J-003', title: 'HR Executive', department: 'HR', openings: 1, postedAt: '2026-04-05', status: 'paused' }
];

const benefits = {
  plans: [
    { id: 'BEN-001', name: 'Bảo hiểm sức khoẻ mở rộng', category: 'health', monthlyBudget: 350000000, enabled: true },
    { id: 'BEN-002', name: 'Phụ cấp ăn trưa', category: 'meal', monthlyBudget: 120000000, enabled: true },
    { id: 'BEN-003', name: 'Phụ cấp đi lại', category: 'allowance', monthlyBudget: 80000000, enabled: false }
  ],
  claims: [
    {
      id: 'CLM-001',
      employeeId: 'EMP-001',
      employeeName: 'Nhân viên 1',
      planId: 'BEN-001',
      planName: 'Bảo hiểm sức khoẻ mở rộng',
      amount: 2500000,
      submittedAt: new Date(Date.now() - 3 * dayMs).toISOString(),
      status: 'processing'
    }
  ]
};

const offboarding = [
  {
    id: 'OFF-001',
    employeeId: 'EMP-012',
    employeeName: 'Nhân viên 12',
    department: 'Phòng ban B',
    lastWorkingDate: new Date(Date.now() + 12 * dayMs).toISOString().slice(0, 10),
    reason: 'resign',
    status: 'handover',
    handoverOwner: 'Lê Hoàng',
    createdAt: new Date(Date.now() - 4 * dayMs).toISOString()
  }
];

const decisions = [
  {
    id: 'DEC-001',
    code: 'QD-0001',
    type: 'transfer',
    employeeId: 'EMP-001',
    employeeName: 'Nhân viên 1',
    departmentFrom: 'Phòng ban A',
    departmentTo: 'Phòng ban B',
    titleFrom: 'Chuyên viên',
    titleTo: 'Chuyên viên',
    effectiveDate: new Date(Date.now() + 5 * dayMs).toISOString().slice(0, 10),
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * dayMs).toISOString(),
    note: 'Điều động theo nhu cầu dự án.'
  }
];

const reports = [
  {
    id: 'RPT-001',
    name: 'Báo cáo headcount theo trạng thái',
    kind: 'headcount',
    description: 'Tổng hợp nhân sự theo trạng thái',
    lastRunAt: null
  },
  {
    id: 'RPT-002',
    name: 'Báo cáo biến động nhân sự (turnover)',
    kind: 'turnover',
    description: 'Theo dõi tiếp nhận/nghỉ việc theo thời gian',
    lastRunAt: null
  }
];

module.exports = {
  departments,
  titles,
  workplaces,
  employees,
  candidates,
  jobs,
  benefits,
  offboarding,
  decisions,
  reports
};
