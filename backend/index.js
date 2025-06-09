import express from 'express';
import cors from 'cors';
import pool from './db.js';
import { startWebSocketServer } from './ws-server.js';
import { getSurveyReport } from './report-service.js';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/survey-report', async (req, res) => {
  try {
    const start = Date.now();

    const report = await getSurveyReport(pool, req.body.originLastIds);

    const seconds = ((Date.now() - start) / 1000).toFixed(2);
    
    console.log(`Tempo da consulta: ${seconds} segundos`);
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.listen(3001, () => console.log('API rodando na porta 3001'));

startWebSocketServer(pool);
