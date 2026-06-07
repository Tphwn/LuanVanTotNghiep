require('dotenv').config();
const app = require('./src/app');

const getPort = () => {
  const envPort = Number(process.env.PORT);
  return Number.isNaN(envPort) ? 5000 : envPort;
};

let currentPort = getPort();

const startServer = () => {
  const server = app.listen(currentPort, () => {
    console.log(`Server đang chạy ở port ${currentPort}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      const nextPort = currentPort + 1;
      console.warn(`Port ${currentPort} đang bị sử dụng. Chuyển sang port ${nextPort}...`);
      currentPort = nextPort;
      startServer();
    } else {
      console.error(error);
      process.exit(1);
    }
  });
};

startServer();