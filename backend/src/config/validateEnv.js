const REQUIRED_IN_PRODUCTION = ['MONGODB_URI', 'JWT_SECRET', 'PLATFORM_API_KEY'];

function validateEnv() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key] || !String(process.env[key]).trim());

  if (missing.length > 0) {
    console.error(
      `[config] Missing required environment variable(s) for production: ${missing.join(', ')}. ` +
        'Refusing to start.'
    );
    process.exit(1);
  }
}

module.exports = validateEnv;
