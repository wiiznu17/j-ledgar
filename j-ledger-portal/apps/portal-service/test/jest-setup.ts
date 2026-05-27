process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://ledger_admin:8FJeaiIYKPXDVMtt@localhost:5432/jledger_test';
process.env.NODE_ENV = 'test';
process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';
