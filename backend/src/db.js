const mysql = require('mysql2/promise');

const useMySql = String(process.env.USE_MYSQL || 'false').toLowerCase() === 'true';

let pool = null;

function isMySqlEnabled() {
  return useMySql;
}

function getPool() {
  if (!isMySqlEnabled()) return null;

  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'hrm',
      waitForConnections: true,
      connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
      namedPlaceholders: true,
      timezone: 'Z'
    });
  }

  return pool;
}

async function query(sql, params = {}) {
  const p = getPool();
  if (!p) throw new Error('USE_MYSQL=false');
  const [rows] = await p.execute(sql, params);
  return rows;
}

async function ping() {
  if (!isMySqlEnabled()) return { enabled: false, ok: false, message: 'USE_MYSQL=false' };

  try {
    const rows = await query('SELECT 1 AS ok');
    return { enabled: true, ok: rows?.[0]?.ok === 1 };
  } catch (error) {
    return { enabled: true, ok: false, message: error.message };
  }
}

async function authenticateUser(email, password) {
  const rows = await query(
    `
      SELECT ea.id, ea.employee_id AS employeeId, ea.email, ea.username, ea.password, ea.active,
             e.full_name AS fullName
      FROM employee_accounts ea
      INNER JOIN employees e ON e.id = ea.employee_id
      WHERE ea.email = :email
      LIMIT 1
    `,
    { email }
  );

  const account = rows[0];
  if (!account || !account.active) return null;
  if (String(account.password) !== String(password)) return null;

  const permissionRows = await query(
    `
      SELECT menu_key AS menuKey
      FROM account_menu_permissions
      WHERE account_id = :accountId
      ORDER BY menu_key ASC
    `,
    { accountId: account.id }
  );

  return {
    id: account.id,
    employeeId: account.employeeId,
    email: account.email,
    displayName: account.fullName || account.username || account.email,
    menuPermissions: permissionRows.map((x) => x.menuKey)
  };
}

async function listEmployees({ status, department }) {
  return query(
    `
      SELECT id, code, full_name AS fullName, department, title, status, gender, age,
             education_level AS educationLevel, object_type AS objectType, created_at AS createdAt
      FROM employees
      WHERE (:status = '' OR status = :status)
        AND (:department = '' OR department = :department)
      ORDER BY created_at DESC
    `,
    { status: status || '', department: department || '' }
  );
}

async function getEmployeeById(id) {
  const rows = await query(
    `
      SELECT id, code, full_name AS fullName, email, phone, department, title, status, gender, age,
             education_level AS educationLevel, object_type AS objectType, created_at AS createdAt
      FROM employees
      WHERE id = :id
      LIMIT 1
    `,
    { id }
  );
  return rows[0] || null;
}

async function createEmployee(input) {
  await query(
    `
      INSERT INTO employees (
        id, code, full_name, email, phone, department, title, status, gender, age,
        education_level, object_type, created_at
      ) VALUES (
        :id, :code, :fullName, :email, :phone, :department, :title, :status, :gender, :age,
        :educationLevel, :objectType, NOW()
      )
    `,
    input
  );

  return getEmployeeById(input.id);
}

async function updateEmployee(id, input) {
  await query(
    `
      UPDATE employees
      SET full_name = :fullName,
          email = :email,
          phone = :phone,
          department = :department,
          title = :title,
          status = :status,
          gender = :gender,
          age = :age,
          education_level = :educationLevel,
          object_type = :objectType
      WHERE id = :id
    `,
    { id, ...input }
  );

  return getEmployeeById(id);
}

async function listManagers(q) {
  return query(
    `
      SELECT id, full_name AS name
      FROM employees
      WHERE status IN ('active', 'probation', 'onboarding')
        AND (:q = '' OR LOWER(full_name) LIKE CONCAT('%', :q, '%'))
      ORDER BY full_name ASC
      LIMIT 20
    `,
    { q: (q || '').trim().toLowerCase() }
  );
}

async function getEmployeeAccount(employeeId) {
  const rows = await query(
    `
      SELECT id, employee_id AS employeeId, email, username, password, active
      FROM employee_accounts
      WHERE employee_id = :employeeId
      LIMIT 1
    `,
    { employeeId }
  );

  const account = rows[0];
  if (!account) return null;

  const permissionRows = await query(
    `
      SELECT menu_key AS menuKey
      FROM account_menu_permissions
      WHERE account_id = :accountId
      ORDER BY menu_key ASC
    `,
    { accountId: account.id }
  );

  return {
    employeeId: account.employeeId,
    email: account.email,
    username: account.username,
    password: account.password,
    active: Boolean(account.active),
    menuPermissions: permissionRows.map((x) => x.menuKey)
  };
}

async function upsertEmployeeAccount(employeeId, payload) {
  const p = getPool();
  if (!p) throw new Error('USE_MYSQL=false');

  const conn = await p.getConnection();
  try {
    await conn.beginTransaction();

    const [existingRows] = await conn.execute(
      `SELECT id FROM employee_accounts WHERE employee_id = :employeeId LIMIT 1`,
      { employeeId }
    );

    let accountId;
    if (existingRows.length > 0) {
      accountId = existingRows[0].id;
      await conn.execute(
        `
          UPDATE employee_accounts
          SET email = :email,
              username = :username,
              password = :password,
              active = :active,
              updated_at = NOW()
          WHERE id = :accountId
        `,
        {
          accountId,
          email: payload.email,
          username: payload.username,
          password: payload.password,
          active: payload.active ? 1 : 0
        }
      );
    } else {
      accountId = `ACC-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      await conn.execute(
        `
          INSERT INTO employee_accounts (id, employee_id, email, username, password, active, created_at, updated_at)
          VALUES (:id, :employeeId, :email, :username, :password, :active, NOW(), NOW())
        `,
        {
          id: accountId,
          employeeId,
          email: payload.email,
          username: payload.username,
          password: payload.password,
          active: payload.active ? 1 : 0
        }
      );
    }

    await conn.execute(`DELETE FROM account_menu_permissions WHERE account_id = :accountId`, { accountId });

    for (const menuKey of payload.menuPermissions) {
      await conn.execute(
        `INSERT INTO account_menu_permissions (account_id, menu_key) VALUES (:accountId, :menuKey)`,
        { accountId, menuKey }
      );
    }

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  return getEmployeeAccount(employeeId);
}

async function listJobs() {
  return query(
    `SELECT id, title, department, openings, posted_at AS postedAt, status FROM recruitment_jobs ORDER BY posted_at DESC, id DESC`
  );
}

async function listCandidates() {
  const rows = await query(
    `
      SELECT id, full_name AS fullName, email, applied_role AS appliedRole, stage, phone, source,
             applied_at AS appliedAt, city, years_of_experience AS yearsOfExperience, skills, summary
      FROM recruitment_candidates
      ORDER BY applied_at DESC, id DESC
    `
  );
  return rows.map((r) => ({ ...r, skills: Array.isArray(r.skills) ? r.skills : [] }));
}

async function listPayrolls() {
  return query(
    `
      SELECT id, employee_id AS employeeId, period, gross_salary AS grossSalary,
             insurance_total AS insuranceTotal, personal_income_tax AS personalIncomeTax,
             net_salary AS netSalary, status, created_at AS createdAt
      FROM payroll_records
      ORDER BY period DESC, created_at DESC
    `
  );
}

async function createPayroll(input) {
  await query(
    `
      INSERT INTO payroll_records (
        id, employee_id, period, gross_salary, insurance_total, personal_income_tax, net_salary, status
      ) VALUES (
        :id, :employeeId, :period, :grossSalary, :insuranceTotal, :personalIncomeTax, :netSalary, :status
      )
      ON DUPLICATE KEY UPDATE
        gross_salary = VALUES(gross_salary),
        insurance_total = VALUES(insurance_total),
        personal_income_tax = VALUES(personal_income_tax),
        net_salary = VALUES(net_salary),
        status = VALUES(status),
        updated_at = NOW()
    `,
    input
  );

  const rows = await query(
    `
      SELECT id, employee_id AS employeeId, period, gross_salary AS grossSalary,
             insurance_total AS insuranceTotal, personal_income_tax AS personalIncomeTax,
             net_salary AS netSalary, status, created_at AS createdAt
      FROM payroll_records
      WHERE id = :id
      LIMIT 1
    `,
    { id: input.id }
  );

  return rows[0] || null;
}

async function listPerformanceReviews() {
  return query(
    `
      SELECT id, employee_id AS employeeId, cycle, score, rank_label AS rankLabel,
             reviewer, note, created_at AS createdAt
      FROM performance_reviews
      ORDER BY created_at DESC
    `
  );
}

async function listWorkTasks() {
  return query(
    `
      SELECT id, title, assignee_id AS assigneeId, assignee_name AS assigneeName,
             due_date AS dueDate, priority, status, created_at AS createdAt
      FROM work_tasks
      ORDER BY created_at DESC
    `
  );
}

async function listTrainingCourses() {
  return query(
    `
      SELECT id, code, name, category, start_date AS startDate, end_date AS endDate, status
      FROM training_courses
      ORDER BY start_date DESC
    `
  );
}

async function listFormRequests() {
  return query(
    `
      SELECT id, form_type AS formType, employee_id AS employeeId, employee_name AS employeeName,
             status, payload_json AS payloadJson, submitted_at AS submittedAt
      FROM form_requests
      ORDER BY submitted_at DESC
    `
  );
}

async function listBenefitPlans() {
  return query(
    `SELECT id, name, category, monthly_budget AS monthlyBudget, enabled FROM benefit_plans ORDER BY created_at DESC`
  );
}

async function createBenefitPlan(input) {
  await query(
    `INSERT INTO benefit_plans (id, name, category, monthly_budget, enabled) VALUES (:id, :name, :category, :monthlyBudget, :enabled)`,
    { ...input, enabled: input.enabled ? 1 : 0 }
  );
  const rows = await query(
    `SELECT id, name, category, monthly_budget AS monthlyBudget, enabled FROM benefit_plans WHERE id=:id LIMIT 1`,
    { id: input.id }
  );
  return rows[0] || null;
}

async function listBenefitClaims() {
  return query(
    `
      SELECT id, employee_id AS employeeId, employee_name AS employeeName, plan_id AS planId, plan_name AS planName,
             amount, submitted_at AS submittedAt, status
      FROM benefit_claims
      ORDER BY submitted_at DESC
    `
  );
}

async function updateBenefitClaimStatus(id, status) {
  await query(`UPDATE benefit_claims SET status=:status, updated_at=NOW() WHERE id=:id`, { id, status });
}

async function listOffboarding() {
  return query(
    `
      SELECT id, employee_id AS employeeId, employee_name AS employeeName, department,
             last_working_date AS lastWorkingDate, reason, status, handover_owner AS handoverOwner,
             created_at AS createdAt
      FROM offboarding_cases
      ORDER BY created_at DESC
    `
  );
}

async function createOffboarding(input) {
  await query(
    `
      INSERT INTO offboarding_cases (id, employee_id, employee_name, department, last_working_date, reason, status, handover_owner)
      VALUES (:id, :employeeId, :employeeName, :department, :lastWorkingDate, :reason, :status, :handoverOwner)
    `,
    input
  );
  const rows = await query(
    `
      SELECT id, employee_id AS employeeId, employee_name AS employeeName, department,
             last_working_date AS lastWorkingDate, reason, status, handover_owner AS handoverOwner,
             created_at AS createdAt
      FROM offboarding_cases WHERE id=:id LIMIT 1
    `,
    { id: input.id }
  );
  return rows[0] || null;
}

async function updateOffboardingStatus(id, status) {
  await query(`UPDATE offboarding_cases SET status=:status, updated_at=NOW() WHERE id=:id`, { id, status });
}

async function listDecisions() {
  return query(
    `
      SELECT id, code, type, employee_id AS employeeId, employee_name AS employeeName,
             department_from AS departmentFrom, department_to AS departmentTo,
             title_from AS titleFrom, title_to AS titleTo, effective_date AS effectiveDate,
             status, created_at AS createdAt, note
      FROM hrm_decisions
      ORDER BY created_at DESC
    `
  );
}

async function createDecision(input) {
  await query(
    `
      INSERT INTO hrm_decisions (
        id, code, type, employee_id, employee_name, department_from, department_to, title_from, title_to, effective_date, status, note
      ) VALUES (
        :id, :code, :type, :employeeId, :employeeName, :departmentFrom, :departmentTo, :titleFrom, :titleTo, :effectiveDate, :status, :note
      )
    `,
    input
  );
  const rows = await query(
    `
      SELECT id, code, type, employee_id AS employeeId, employee_name AS employeeName,
             department_from AS departmentFrom, department_to AS departmentTo,
             title_from AS titleFrom, title_to AS titleTo, effective_date AS effectiveDate,
             status, created_at AS createdAt, note
      FROM hrm_decisions WHERE id=:id LIMIT 1
    `,
    { id: input.id }
  );
  return rows[0] || null;
}

async function updateDecisionStatus(id, status) {
  await query(`UPDATE hrm_decisions SET status=:status, updated_at=NOW() WHERE id=:id`, { id, status });
}

async function listReports() {
  return query(
    `SELECT id, name, kind, description, last_run_at AS lastRunAt FROM hrm_reports ORDER BY created_at DESC`
  );
}

async function runReport(id) {
  await query(`UPDATE hrm_reports SET last_run_at=NOW(), updated_at=NOW() WHERE id=:id`, { id });
  const rows = await query(`SELECT id, last_run_at AS lastRunAt FROM hrm_reports WHERE id=:id LIMIT 1`, { id });
  return rows[0] || null;
}

async function listDepartments(q) {
  return query(
    `
      SELECT id, code, name, active
      FROM hrm_departments
      WHERE (:q = '' OR LOWER(name) LIKE CONCAT('%', :q, '%') OR LOWER(code) LIKE CONCAT('%', :q, '%'))
      ORDER BY created_at DESC
    `,
    { q: (q || '').trim().toLowerCase() }
  );
}

async function createDepartment(input) {
  await query(`INSERT INTO hrm_departments (id, code, name, active) VALUES (:id, :code, :name, :active)`, {
    ...input,
    active: input.active ? 1 : 0
  });
  const rows = await query(`SELECT id, code, name, active FROM hrm_departments WHERE id=:id LIMIT 1`, { id: input.id });
  return rows[0] || null;
}

async function toggleDepartment(id) {
  await query(`UPDATE hrm_departments SET active = NOT active, updated_at=NOW() WHERE id=:id`, { id });
}

async function listTitles() {
  return query(`SELECT id, name, active FROM hrm_titles ORDER BY created_at DESC`);
}

async function createTitle(input) {
  await query(`INSERT INTO hrm_titles (id, name, active) VALUES (:id, :name, :active)`, {
    ...input,
    active: input.active ? 1 : 0
  });
  const rows = await query(`SELECT id, name, active FROM hrm_titles WHERE id=:id LIMIT 1`, { id: input.id });
  return rows[0] || null;
}

async function toggleTitle(id) {
  await query(`UPDATE hrm_titles SET active = NOT active, updated_at=NOW() WHERE id=:id`, { id });
}

async function listWorkplaces() {
  return query(`SELECT id, name, active FROM hrm_workplaces ORDER BY created_at DESC`);
}

async function createWorkplace(input) {
  await query(`INSERT INTO hrm_workplaces (id, name, active) VALUES (:id, :name, :active)`, {
    ...input,
    active: input.active ? 1 : 0
  });
  const rows = await query(`SELECT id, name, active FROM hrm_workplaces WHERE id=:id LIMIT 1`, { id: input.id });
  return rows[0] || null;
}

async function toggleWorkplace(id) {
  await query(`UPDATE hrm_workplaces SET active = NOT active, updated_at=NOW() WHERE id=:id`, { id });
}

module.exports = {
  isMySqlEnabled,
  ping,
  authenticateUser,
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  listManagers,
  getEmployeeAccount,
  upsertEmployeeAccount,
  listJobs,
  listCandidates,
  listPayrolls,
  createPayroll,
  listPerformanceReviews,
  listWorkTasks,
  listTrainingCourses,
  listFormRequests,
  listBenefitPlans,
  createBenefitPlan,
  listBenefitClaims,
  updateBenefitClaimStatus,
  listOffboarding,
  createOffboarding,
  updateOffboardingStatus,
  listDecisions,
  createDecision,
  updateDecisionStatus,
  listReports,
  runReport,
  listDepartments,
  createDepartment,
  toggleDepartment,
  listTitles,
  createTitle,
  toggleTitle,
  listWorkplaces,
  createWorkplace,
  toggleWorkplace
};
