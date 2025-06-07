import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'taxa',
  password: 'postgres',
  port: 5432,
  shema: 'inside',
});

export default pool;
