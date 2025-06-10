import request from 'supertest';
import { app } from 'app.js'; // <- Note a extensão .js
import { buildQuery, formatReport } from 'survey-report.service.js'; // <- Extensão .js

// Mock do pool
jest.mock('db.js', () => ({
    query: jest.fn()
}));
describe('Survey Report API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /survey-report', () => {
        it('deve retornar 400 se nenhuma origem for fornecida', async () => {
            const response = await request(app)
                .post('/survey-report')
                .send({});
            
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: 'Nenhuma origem especificada' });
        });

        it('deve construir a query corretamente', () => {
            const origins = ['email', 'wpp'];
            const originLastIds = { email: 100, wpp: 200 };
            
            const { query, values } = buildQuery(origins, originLastIds);
            
            expect(query).toContain('origin = ANY($1::text[])');
            expect(query).toContain('id > ANY');
            expect(values).toEqual([['email', 'wpp'], [100, 200]]);
        });

        it('deve formatar o relatório corretamente', () => {
            const mockRows = [
                { origin: 'email', period: '01/2024', total: 50, new_max_id: 100 },
                { origin: 'email', period: '02/2024', total: 60, new_max_id: 110 },
                { origin: 'wpp', period: '01/2024', total: 30, new_max_id: 200 }
            ];
            
            const report = formatReport(mockRows);
            
            expect(report).toEqual({
                email: {
                    periods: {
                        '01/2024': 50,
                        '02/2024': 60
                    },
                    last_id: 110
                },
                wpp: {
                    periods: {
                        '01/2024': 30
                    },
                    last_id: 200
                }
            });
        });

        it('deve retornar o relatório com sucesso', async () => {
            const mockRows = [
                { origin: 'email', period: '01/2024', total: 50, new_max_id: 100 }
            ];
            
            db.query.mockResolvedValue({ rows: mockRows });
            
            const response = await request(app)
                .post('/survey-report')
                .send({ originLastIds: { email: 90 } });
            
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                email: {
                    periods: { '01/2024': 50 },
                    last_id: 100
                }
            });
        });

        it('deve retornar 500 em caso de erro no banco', async () => {
            db.query.mockRejectedValue(new Error('DB error'));
            
            const response = await request(app)
                .post('/survey-report')
                .send({ originLastIds: { email: 90 } });
            
            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Erro interno no servidor');
        });
    });
});
