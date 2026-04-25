require('dotenv').config();
const { app } = require('./app');
const { ping, isMySqlEnabled, ensureWorkTaskColumns, ensureWorkTaskExtraTable } = require('./db');

const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, async () => {
  console.log(`HRM backend is running at http://localhost:${PORT}`);

  if (!isMySqlEnabled()) {
    console.log('[DB] MySQL is disabled (USE_MYSQL=false)');
    return;
  }

  const result = await ping();
  if (result.ok) {
    console.log('[DB] MySQL connected successfully');
    try {
      await ensureWorkTaskColumns();
      await ensureWorkTaskExtraTable();
      console.log('[DB] work_tasks columns ensured (progress, receiver_name, assigner_name)');
    } catch (error) {
      console.error('[DB] Ensure work_tasks columns failed:', error.message || error);
    }
  } else {
    console.log(`[DB] MySQL connection failed: ${result.message || 'unknown error'}`);
  }
});
