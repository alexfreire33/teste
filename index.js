import express from 'express';
import pool from './db.js';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(express.json());

// Configure o CORS antes de todas as rotas
app.use(cors({
  origin: 'http://localhost:3000', // Permite apenas seu frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.post('/survey-report', async (req, res) => {
    try {
        const { originLastIds = {} } = req.body;
        const origins = Object.keys(originLastIds);

        if (origins.length === 0) {
            return res.status(400).json({ error: 'Nenhuma origem especificada' });
        }

        const query = `
      SELECT 
        origin,
        TO_CHAR(created_at, 'MM/YYYY') AS period,
        COUNT(*) AS total,
        MAX(id) AS new_max_id
      FROM 
        inside.users_surveys_responses_aux
      WHERE 
        origin = ANY($1::text[])
        ${Object.values(originLastIds).some(id => id !== null) ? `
          AND id > ANY(
            SELECT COALESCE(min_id, 0) FROM (
              SELECT 
                unnest($1::text[]) AS origin, 
                unnest($2::bigint[]) AS min_id
            ) AS params 
            WHERE params.origin = inside.users_surveys_responses_aux.origin
          )
        ` : ''}
      GROUP BY 
        origin, TO_CHAR(created_at, 'MM/YYYY')
      ORDER BY 
        origin, TO_CHAR(created_at, 'MM/YYYY');
    `;

        const values = [origins];
        if (Object.values(originLastIds).some(id => id !== null)) {
            values.push(origins.map(origin => originLastIds[origin] || 0));
        }

        const result = await pool.query(query, values);

        // Formata a resposta no formato solicitado
        const report = result.rows.reduce((acc, row) => {
            if (!acc[row.origin]) {
                acc[row.origin] = {
                    periods: {},
                    last_id: row.new_max_id
                };
            }
            acc[row.origin].periods[row.period] = row.total;
            // Atualiza o last_id se for maior
            if (row.new_max_id > acc[row.origin].last_id) {
                acc[row.origin].last_id = row.new_max_id;
            }
            return acc;
        }, {});

        console.log('Resultado do relatório:', JSON.stringify(report, null, 2));
        res.json(report);
        var d = 0;
    } catch (err) {
        console.error('Erro ao gerar relatório:', err);
        res.status(500).json({
            error: 'Erro interno no servidor',
            details: process.env.NODE_ENV === 'development' ? err.message : null
        });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});