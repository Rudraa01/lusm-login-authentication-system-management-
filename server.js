// server.js
console.log('Server starting...');
console.log('PORT provided by Hostinger:', process.env.PORT);

// 1. Global error handlers to prevent silent crashes
process.on('uncaughtException', (err) => {
  console.error('Fatal Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Fatal Unhandled Rejection at:', promise, 'reason:', reason);
});

// 2. Use dynamic import() because root package.json has "type": "module"
import('./server/src/index.js').catch(err => {
  console.error('Failed to load server/src/index.js:', err);
});
