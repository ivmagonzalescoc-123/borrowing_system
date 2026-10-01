require('dotenv').config();
const migrate = require('./src/config/migrate');

const PORT = process.env.PORT || 5000;

migrate()
  .then(() => {
    const app = require('./src/app');
    const { startSweepSchedule } = require('./src/services/borrowSweep');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      startSweepSchedule();
    });
  })
  .catch((err) => {
    console.error('Failed to set up the database:', err.message);
    process.exit(1);
  });
