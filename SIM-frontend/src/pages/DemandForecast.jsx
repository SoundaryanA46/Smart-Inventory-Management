import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, FormControl, InputLabel,
  Select, MenuItem, TextField, Button, Grid, Card, CardContent
} from '@mui/material';
import Plot from 'react-plotly.js';
import axios from 'axios';

const DemandForecast = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [forecastDays, setForecastDays] = useState(30);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data);
      if (response.data.length > 0) {
        setSelectedProduct(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const generateForecast = async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `/api/ml-analysis/forecast/${selectedProduct}?forecastDays=${forecastDays}`
      );
      setForecastData(response.data);
    } catch (error) {
      console.error('Error generating forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderForecastChart = () => {
    if (!forecastData) return null;

    const dates = Object.keys(forecastData).map(key => forecastData[key].date);
    const values = Object.keys(forecastData).map(key => forecastData[key].forecast_quantity);

    return (
      <Plot
        data={[
          {
            x: dates,
            y: values,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Forecast',
            line: { color: '#2196f3', width: 2 }
          }
        ]}
        layout={{
          title: `Demand Forecast - Next ${forecastDays} Days`,
          xaxis: { title: 'Date' },
          yaxis: { title: 'Forecast Quantity' },
          height: 400
        }}
        useResizeHandler={true}
        style={{ width: '100%' }}
      />
    );
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Demand Forecasting
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Select Product</InputLabel>
            <Select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              label="Select Product"
            >
              {products.map(product => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Forecast Days"
            type="number"
            value={forecastDays}
            onChange={(e) => setForecastDays(parseInt(e.target.value))}
            inputProps={{ min: 7, max: 90 }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Button
            fullWidth
            variant="contained"
            onClick={generateForecast}
            disabled={loading || !selectedProduct}
            sx={{ height: '56px' }}
          >
            {loading ? 'Generating...' : 'Generate Forecast'}
          </Button>
        </Grid>
      </Grid>

      {forecastData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Forecast Summary
            </Typography>
            <Box display="flex" gap={3}>
              <Typography>
                Average Daily Demand: {(Object.values(forecastData).reduce((a, b) => a + b.forecast_quantity, 0) / forecastDays).toFixed(2)}
              </Typography>
              <Typography>
                Total Forecast: {Object.values(forecastData).reduce((a, b) => a + b.forecast_quantity, 0).toFixed(0)} units
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {renderForecastChart()}
    </Paper>
  );
};

export default DemandForecast;