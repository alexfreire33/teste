import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'database-1.ck56myso23jy.us-east-1.rds.amazonaws.com',         
  database: 'taxa',
  password: 'postgres',
  port: 5432,
  schema: 'inside',  
});


export default pool;
