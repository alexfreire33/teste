import { WebSocketServer } from 'ws';
import { getSurveyReport } from './report-service.js';

export function startWebSocketServer(pool) {
    const wss = new WebSocketServer({ port: 3002 });

    wss.on('connection', (ws) => {
        ws.on('message', async (message) => {
            const { type, data } = JSON.parse(message);

            if (type === 'INIT') {
                let isClosed = false;

                const sendUpdates = async () => {
                    if (isClosed) return;

                    try {
                        const start = Date.now();

                        const update = await getSurveyReport(pool, data);

                        const seconds = ((Date.now() - start) / 1000).toFixed(2);
                        console.log(`Tempo da consulta: ${seconds} segundos`);

                        if (ws.readyState === ws.OPEN) {
                            ws.send(JSON.stringify({ type: 'UPDATE', data: update }));
                        }
                    } catch (err) {
                        console.error('Erro ao buscar relatório:', err);
                    }

                    // Espera 2 segundos DEPOIS da execução terminar
                    setTimeout(sendUpdates, 2000);
                };

                sendUpdates();

                ws.on('close', () => {
                    isClosed = true;
                });
            }
        });
    });

    console.log('WebSocket rodando na porta 3002');
}
