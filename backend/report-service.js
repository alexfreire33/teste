// report-service.js
export async function getSurveyReport(pool, originLastIds = {}) {
  const origins = Object.keys(originLastIds);
  if (origins.length === 0) return {};

  const hasLastIds = Object.values(originLastIds).some(id => id !== null);

  const query = `
    WITH params AS (
      SELECT 
        unnest($1::text[]) AS origin, 
        unnest($2::bigint[]) AS min_id
    )
    SELECT 
      usr.origin,
      usr.created_at AS period,
      COUNT(*) AS total,
      MAX(usr.id) AS new_max_id
    FROM 
      inside.users_surveys_responses_aux usr
    ${hasLastIds ? `JOIN params p ON usr.origin = p.origin AND usr.id > p.min_id` : ''}
    WHERE 
      usr.origin = ANY($1::text[])
    GROUP BY 
      usr.origin, usr.created_at
    ORDER BY 
      usr.origin, usr.created_at;
  `;

  const values = [origins];
  if (hasLastIds) {
    values.push(origins.map(origin => originLastIds[origin] || 0));
  } else {
    values.push([]);
  }

  const result = await pool.query(query, values);

  return result.rows.reduce((acc, row) => {
    if (!acc[row.origin]) {
      acc[row.origin] = {
        periods: {},
        last_id: row.new_max_id
      };
    }
    acc[row.origin].periods[row.period] = row.total;
    if (row.new_max_id > acc[row.origin].last_id) {
      acc[row.origin].last_id = row.new_max_id;
    }
    return acc;
  }, {});
}
