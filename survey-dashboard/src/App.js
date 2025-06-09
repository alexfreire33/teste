import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const API_URL = 'http://54.197.94.183:3001/survey-report';
const WS_URL = 'ws://54.197.94.183:3002'; // URL do WebSocket

function App() {
  const [originLastIds, setOriginLastIds] = useState({
    email: sessionStorage.getItem('lastId_email') || '',
    wpp: sessionStorage.getItem('lastId_wpp') || '',
    MOBILE: sessionStorage.getItem('lastId_MOBILE') || ''
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const ws = useRef(null);

  // Salva IDs no sessionStorage quando mudam
  useEffect(() => {
    Object.entries(originLastIds).forEach(([origin, id]) => {
      if (id !== '') {
        sessionStorage.setItem(`lastId_${origin}`, id);
      }
    });
  }, [originLastIds]);

  // Configuração do WebSocket
  useEffect(() => {
    if (!autoRefresh) return;

    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log('WebSocket conectado');
      // Envia os últimos IDs salvos ao conectar
      const idsToSend = {};
      Object.entries(originLastIds).forEach(([origin, id]) => {
        if (id !== '') {
          idsToSend[origin] = Number(id);
        }
      });
      ws.current.send(JSON.stringify({ type: 'INIT', data: idsToSend }));
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'UPDATE') {
        setReportData(prev => {
          // Atualiza os dados e os últimos IDs
          const newData = { ...prev };
          Object.entries(message.data).forEach(([origin, data]) => {
            newData[origin] = data;
            setOriginLastIds(prevIds => ({
              ...prevIds,
              [origin]: data.last_id.toString()
            }));
          });
          return newData;
        });
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Erro na conexão em tempo real');
    };

    ws.current.onclose = () => {
      console.log('WebSocket desconectado');
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [autoRefresh]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Filtra apenas as origens com IDs válidos
      const filteredIds = Object.fromEntries(
        Object.entries(originLastIds)
          .map(([key, value]) => [key, value === '' ? 1 : Number(value)])
      );

      const response = await axios.post(API_URL, { originLastIds: filteredIds });
      setReportData(response.data);

      // Atualiza os últimos IDs no state e sessionStorage
      Object.entries(response.data).forEach(([origin, data]) => {
        setOriginLastIds(prev => ({
          ...prev,
          [origin]: data.last_id.toString()
        }));
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar dados');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIdChange = (origin, value) => {
    setOriginLastIds(prev => ({
      ...prev,
      [origin]: value
    }));
  };

  const handleAutoRefreshChange = (event) => {
    setAutoRefresh(event.target.checked);
    if (!event.target.checked && ws.current) {
      ws.current.close();
    }
  };

  const prepareChartData = (originData) => {
    const periods = Object.keys(originData.periods);
    const totals = Object.values(originData.periods);

    return {
      labels: periods,
      datasets: [
        {
          label: 'Total de Respostas',
          data: totals,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Respostas por Mês',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Total de Respostas'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Mês/Ano'
        }
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard de Pesquisas
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Filtros
        </Typography>
        <Grid container spacing={3}>
          {Object.entries(originLastIds).map(([origin, value]) => (
            <Grid item xs={12} sm={4} key={origin}>
              <TextField
                label={`Último ID (${origin})`}
                type="number"
                fullWidth
                value={value}
                onChange={(e) => handleIdChange(origin, e.target.value)}
                variant="outlined"
              />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              onClick={fetchData}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Carregar Dados'}
            </Button>
          </Grid>
          <Grid item>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={handleAutoRefreshChange}
                  color="primary"
                />
              }
              label="Atualização automática (WebSocket)"
            />
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {reportData && (
        <Grid container spacing={4}>
          {Object.entries(reportData).map(([origin, data]) => (
            <Grid item xs={12} md={6} key={origin}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Origem: {origin} (Último ID: {data.last_id})
                </Typography>
                <div style={{ height: '400px' }}>
                  <Bar data={prepareChartData(data)} options={chartOptions} />
                </div>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

export default App;