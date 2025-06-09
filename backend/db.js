import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'postgres',         
  database: 'taxa',
  password: 'postgres',
  port: 5432,
  schema: 'inside',  
});


export default pool;
