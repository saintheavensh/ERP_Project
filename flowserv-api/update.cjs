const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:admin@localhost:5432/flowserv' });
pool.query("UPDATE item_brand_pricing SET selling_price = 150000 WHERE part_brand_id = '0c937303-f316-40d8-b0e1-6fbe11b1ac16'")
  .then(() => console.log('Updated price'))
  .catch(console.error)
  .finally(()=>pool.end());
