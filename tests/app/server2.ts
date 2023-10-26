/**
 * This server is immune to SIGTERM
 */
import { HOST, PORT, SERVER_URL } from './constants';
import createApp from './createApp';

const APP_NAME = 'server2';

const app = createApp(APP_NAME);

const server = app.listen(PORT, HOST, () => {
  console.log(`${APP_NAME}: '${SERVER_URL}`);
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log(`\nShutting down ${APP_NAME} gracefully.`);
  });
});

process.on('SIGTERM', () => {
  console.log('I am immortal!');
});
