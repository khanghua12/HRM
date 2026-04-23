require('dotenv').config();
const { app } = require('./app');

const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, () => {
  console.log(`HRM backend is running at http://localhost:${PORT}`);
});
