require('dotenv').config();
const { app } = require('./app');
const { ping, isMySqlEnabled } = require('./db');

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
  } else {
    console.log(`[DB] MySQL connection failed: ${result.message || 'unknown error'}`);
  }
});
