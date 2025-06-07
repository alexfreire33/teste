import React, { useState, useEffect } from 'react';
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
  Alert
} from '@mui/material';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const API_URL = 'http://localhost:3001/survey-report';

function App() {
  const [originLastIds, setOriginLastIds] = useState({
    email: '',
    wpp: '',
    MOBILE: ''
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Filtra apenas as origens com IDs válidos
      const filteredIds = Object.fromEntries(
        Object.entries(originLastIds)
          .filter(([_, value]) => value !== '')
          .map(([key, value]) => [key, Number(value)])
      );
      
      const response = await axios.post(API_URL, { originLastIds: filteredIds });
      setReportData(response.data);
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
        <Button
          variant="contained"
          color="primary"
          onClick={fetchData}
          disabled={loading}
          sx={{ mt: 3 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Carregar Dados'}
        </Button>
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