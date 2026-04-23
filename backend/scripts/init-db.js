require('dotenv').config();
const mysql = require('mysql2/promise');

const defaultMenuPermissions = ['employees', 'recruitment', 'payroll', 'performance', 'work', 'training', 'forms'];

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'hrm',
    namedPlaceholders: true,
    timezone: 'Z'
  });

  try {
    console.log('[DB INIT] Connected to MySQL');
    await conn.beginTransaction();

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(32) NOT NULL UNIQUE,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NULL,
        phone VARCHAR(64) NULL,
        department VARCHAR(128) NOT NULL,
        title VARCHAR(128) NOT NULL,
        status ENUM('active', 'onboarding', 'probation', 'intern', 'trainee', 'inactive') NOT NULL DEFAULT 'onboarding',
        gender ENUM('male', 'female', 'other') NOT NULL DEFAULT 'other',
        age INT NOT NULL DEFAULT 25,
        education_level ENUM('Trung cấp', 'Cao đẳng', 'Đại học', 'Sau đại học', 'Khác') NOT NULL DEFAULT 'Đại học',
        object_type ENUM('Chuyên môn', 'Công tác viên', 'Thực tập sinh', 'Học viên', 'Viên chức') NOT NULL DEFAULT 'Chuyên môn',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS employee_accounts (
        id VARCHAR(64) PRIMARY KEY,
        employee_id VARCHAR(64) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        username VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_employee_accounts_employee FOREIGN KEY (employee_id)
          REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS account_menu_permissions (
        account_id VARCHAR(64) NOT NULL,
        menu_key VARCHAR(64) NOT NULL,
        PRIMARY KEY (account_id, menu_key),
        CONSTRAINT fk_account_menu_permissions_account FOREIGN KEY (account_id)
          REFERENCES employee_accounts(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS recruitment_jobs (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        department VARCHAR(128) NOT NULL,
        openings INT NOT NULL DEFAULT 1,
        posted_at DATE NOT NULL,
        status ENUM('open', 'paused', 'closed') NOT NULL DEFAULT 'open',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS recruitment_candidates (
        id VARCHAR(64) PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        applied_role VARCHAR(255) NOT NULL,
        stage ENUM('sourcing', 'screening', 'interview', 'offer', 'hired', 'rejected') NOT NULL DEFAULT 'screening',
        phone VARCHAR(64) NULL,
        source VARCHAR(100) NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        city VARCHAR(100) NULL,
        years_of_experience INT NOT NULL DEFAULT 0,
        skills JSON NULL,
        summary TEXT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS payroll_records (
        id VARCHAR(64) PRIMARY KEY,
        employee_id VARCHAR(64) NOT NULL,
        period CHAR(7) NOT NULL,
        gross_salary DECIMAL(18,2) NOT NULL,
        insurance_total DECIMAL(18,2) NOT NULL,
        personal_income_tax DECIMAL(18,2) NOT NULL,
        net_salary DECIMAL(18,2) NOT NULL,
        status ENUM('draft', 'confirmed', 'paid') NOT NULL DEFAULT 'draft',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_payroll_employee FOREIGN KEY (employee_id)
          REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE KEY uq_payroll_employee_period (employee_id, period)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS performance_reviews (
        id VARCHAR(64) PRIMARY KEY,
        employee_id VARCHAR(64) NOT NULL,
        cycle VARCHAR(50) NOT NULL,
        score DECIMAL(5,2) NOT NULL,
        rank_label VARCHAR(50) NULL,
        reviewer VARCHAR(255) NULL,
        note TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_performance_employee FOREIGN KEY (employee_id)
          REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS work_tasks (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        assignee_id VARCHAR(64) NULL,
        assignee_name VARCHAR(255) NULL,
        due_date DATE NULL,
        priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
        status ENUM('todo', 'in_progress', 'review', 'done', 'cancelled') NOT NULL DEFAULT 'todo',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS training_courses (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(64) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NULL,
        start_date DATE NULL,
        end_date DATE NULL,
        status ENUM('planned', 'ongoing', 'completed', 'cancelled') NOT NULL DEFAULT 'planned',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS form_requests (
        id VARCHAR(64) PRIMARY KEY,
        form_type VARCHAR(100) NOT NULL,
        employee_id VARCHAR(64) NULL,
        employee_name VARCHAR(255) NULL,
        status ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
        payload_json JSON NULL,
        submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS benefit_plans (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category ENUM('insurance','meal','allowance','health','other') NOT NULL,
        monthly_budget DECIMAL(18,2) NOT NULL,
        enabled TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS benefit_claims (
        id VARCHAR(64) PRIMARY KEY,
        employee_id VARCHAR(64) NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        plan_id VARCHAR(64) NOT NULL,
        plan_name VARCHAR(255) NOT NULL,
        amount DECIMAL(18,2) NOT NULL,
        submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status ENUM('new','processing','approved','rejected','paid') NOT NULL DEFAULT 'new',
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS offboarding_cases (
        id VARCHAR(64) PRIMARY KEY,
        employee_id VARCHAR(64) NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        department VARCHAR(128) NOT NULL,
        last_working_date DATE NOT NULL,
        reason ENUM('resign','terminate','retire','contract-end','other') NOT NULL,
        status ENUM('initiated','handover','clearance','completed','cancelled') NOT NULL DEFAULT 'initiated',
        handover_owner VARCHAR(255) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS hrm_decisions (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(64) NOT NULL UNIQUE,
        type ENUM('transfer','appoint','discipline','reward','salary-adjustment') NOT NULL,
        employee_id VARCHAR(64) NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        department_from VARCHAR(128) NULL,
        department_to VARCHAR(128) NULL,
        title_from VARCHAR(128) NULL,
        title_to VARCHAR(128) NULL,
        effective_date DATE NOT NULL,
        status ENUM('draft','pending','approved','rejected','effective') NOT NULL DEFAULT 'draft',
        note TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS hrm_reports (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        kind VARCHAR(64) NOT NULL,
        description TEXT NULL,
        last_run_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS hrm_departments (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(64) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS hrm_titles (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS hrm_workplaces (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const adminEmployeeId = 'EMP-ADMIN-001';
    const adminAccountId = 'ACC-ADMIN-001';

    await conn.execute(
      `
        INSERT INTO employees (id, code, full_name, email, phone, department, title, status, gender, age, education_level, object_type)
        VALUES (:id, :code, :full_name, :email, :phone, :department, :title, :status, :gender, :age, :education_level, :object_type)
        ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), email=VALUES(email), phone=VALUES(phone), department=VALUES(department), title=VALUES(title), status=VALUES(status)
      `,
      {
        id: adminEmployeeId,
        code: 'NVADMIN',
        full_name: 'System Admin',
        email: 'admin@company.vn',
        phone: '0900000000',
        department: 'Administration',
        title: 'Administrator',
        status: 'active',
        gender: 'other',
        age: 30,
        education_level: 'Đại học',
        object_type: 'Chuyên môn'
      }
    );

    await conn.execute(
      `
        INSERT INTO employee_accounts (id, employee_id, email, username, password, active)
        VALUES (:id, :employee_id, :email, :username, :password, :active)
        ON DUPLICATE KEY UPDATE employee_id=VALUES(employee_id), email=VALUES(email), username=VALUES(username), password=VALUES(password), active=VALUES(active)
      `,
      { id: adminAccountId, employee_id: adminEmployeeId, email: 'admin@company.vn', username: 'admin', password: 'admin123', active: 1 }
    );

    await conn.execute(`DELETE FROM account_menu_permissions WHERE account_id = :accountId`, { accountId: adminAccountId });
    for (const menuKey of defaultMenuPermissions) {
      await conn.execute(`INSERT INTO account_menu_permissions (account_id, menu_key) VALUES (:accountId, :menuKey)`, { accountId: adminAccountId, menuKey });
    }

    await conn.execute(`INSERT IGNORE INTO recruitment_jobs (id,title,department,openings,posted_at,status) VALUES ('J-001','Frontend Developer','Engineering',2,'2026-04-01','open')`);
    await conn.execute(`INSERT IGNORE INTO recruitment_candidates (id,full_name,email,applied_role,stage,phone,source,city,years_of_experience,skills,summary) VALUES ('C-001','Nguyễn Gia Hân','han.nguyen@gmail.com','Frontend Developer','interview','0901111111','google-form','Hà Nội',3,JSON_ARRAY('Angular','RxJS'),'Ứng viên tốt')`);
    await conn.execute(`INSERT IGNORE INTO performance_reviews (id,employee_id,cycle,score,rank_label,reviewer,note) VALUES ('PRV-001',:eid,'2026-Q1',4.2,'A','HR Manager','Hoàn thành tốt KPI')`, { eid: adminEmployeeId });
    await conn.execute(`INSERT IGNORE INTO work_tasks (id,title,assignee_id,assignee_name,due_date,priority,status) VALUES ('TSK-001','Thiết lập quy trình chấm công',:eid,'System Admin',DATE_ADD(CURDATE(), INTERVAL 7 DAY),'high','in_progress')`, { eid: adminEmployeeId });
    await conn.execute(`INSERT IGNORE INTO training_courses (id,code,name,category,start_date,end_date,status) VALUES ('TRN-001','TRN-HRM-01','Onboarding HRM System','internal',CURDATE(),DATE_ADD(CURDATE(), INTERVAL 14 DAY),'ongoing')`);
    await conn.execute(`INSERT IGNORE INTO form_requests (id,form_type,employee_id,employee_name,status,payload_json) VALUES ('FRM-001','leave-request',:eid,'System Admin','pending',JSON_OBJECT('from','2026-05-01','to','2026-05-02'))`, { eid: adminEmployeeId });
    await conn.execute(`INSERT IGNORE INTO benefit_plans (id,name,category,monthly_budget,enabled) VALUES ('BEN-001','Bảo hiểm sức khoẻ mở rộng','health',350000000,1)`);
    await conn.execute(`INSERT IGNORE INTO benefit_claims (id,employee_id,employee_name,plan_id,plan_name,amount,status) VALUES ('CLM-001',:eid,'System Admin','BEN-001','Bảo hiểm sức khoẻ mở rộng',2500000,'processing')`, { eid: adminEmployeeId });
    await conn.execute(`INSERT IGNORE INTO offboarding_cases (id,employee_id,employee_name,department,last_working_date,reason,status,handover_owner) VALUES ('OFF-001',:eid,'System Admin','Administration',DATE_ADD(CURDATE(), INTERVAL 15 DAY),'resign','initiated','HR Lead')`, { eid: adminEmployeeId });
    await conn.execute(`INSERT IGNORE INTO hrm_decisions (id,code,type,employee_id,employee_name,effective_date,status,note) VALUES ('DEC-001','QD-0001','transfer',:eid,'System Admin',DATE_ADD(CURDATE(), INTERVAL 5 DAY),'pending','Điều động theo nhu cầu dự án')`, { eid: adminEmployeeId });
    await conn.execute(`INSERT IGNORE INTO hrm_reports (id,name,kind,description) VALUES ('RPT-001','Báo cáo headcount theo trạng thái','headcount','Tổng hợp nhân sự theo trạng thái')`);
    await conn.execute(`INSERT IGNORE INTO hrm_departments (id,code,name,active) VALUES ('DEP-001','PB-A','Phòng ban A',1)`);
    await conn.execute(`INSERT IGNORE INTO hrm_titles (id,name,active) VALUES ('TTL-001','Chuyên viên',1)`);
    await conn.execute(`INSERT IGNORE INTO hrm_workplaces (id,name,active) VALUES ('WPL-001','Văn phòng A',1)`);

    await conn.commit();
    console.log('[DB INIT] Schema initialized for all features');
  } catch (error) {
    await conn.rollback();
    console.error('[DB INIT] Failed:', error.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
