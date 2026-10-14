// Set before importing AppModule. Never inherit real credentials or DB URLs.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-jwt-secret-do-not-use-in-production';
process.env.DATABASE_URL = 'postgresql://unused:unused@127.0.0.1:1/unused';
process.env.SWAGGER_ENABLED = 'false';
