import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Grid, Paper, Typography, Card, CardContent,
  Box, Tabs, Tab, CircularProgress, Alert, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Button, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import Plot from 'react-plotly.js';
import { ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import api from '@/services/api';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const MLAnalyticsDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [report, setReport] = useState(null);
  const [charts, setCharts] = useState({});
  const [selectedProduct, setSelectedProduct] = useState('');
  const [forecastDays, setForecastDays] = useState(30);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      setReport(null);

      const response = await api.get('/api/ml-analysis/generate-report', {
        params: { lookbackDays: 90 },
      });

      const data = response?.data;
      if (data?.error) {
        throw new Error(data.error);
      }

      setReport(data);
    } catch (error) {
      console.error('Error fetching report:', error);

      // Provide a friendlier message for client-side timeouts,
      // while still surfacing backend error text when available.
      const isTimeout =
        error?.code === 'ECONNABORTED' ||
        /timeout/i.test(error?.message || '');

      const message =
        (error?.response?.data && (error.response.data.error || error.response.data.message)) ||
        (isTimeout
          ? 'Report generation took too long. Please try again.'
          : error.message) ||
        'Failed to generate report';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const loadVisualizations = async () => {
    // Only load visualization types that are actually rendered.
    // This avoids unnecessary heavy Python calls (e.g. heatmap, reorder).
    const chartTypes = ['abc', 'trend', 'performance', 'anomaly'];
    const chartPromises = chartTypes.map(type =>
      api.get(`/api/ml-analysis/visualizations/${type}`)
        .then(res => {
          try {
            if (typeof res.data === 'string') return { type, data: JSON.parse(res.data) };
            return { type, data: res.data };
          } catch (e) {
            // If parsing fails, return null for that chart
            return { type, data: null };
          }
        })
        .catch(() => ({ type, data: null }))
    );

    const results = await Promise.all(chartPromises);
    const chartData = {};
    results.forEach(result => {
      chartData[result.type] = result.data;
    });
    setCharts(chartData);
  };

  // Load the main report as soon as the page mounts. This is a lightweight
  // Java-only aggregation and should not block other endpoints.
  useEffect(() => {
    fetchReport();
  }, []);

  // Lazily load Python-backed visualizations only when the user explicitly
  // opens the "Visualizations" tab, and only once per visit.
  useEffect(() => {
    if (activeTab === 2 && Object.keys(charts).length === 0) {
      loadVisualizations();
    }
  }, [activeTab, charts]);

  // Build charts from report data so visualizations always show (no dependency on Python API)
  const reportCharts = useMemo(() => {
    if (!report?.basic_metrics) return null;
    const most = report.basic_metrics.most_needed || [];
    const least = report.basic_metrics.least_used || [];
    const barColor = '#2196f3';
    const barColorLow = '#ff9800';

    const mostNeededChart = most.length ? {
      data: [{ x: most.map(p => p.productName || p.productId), y: most.map(p => Number(p.total_quantity)), type: 'bar', name: 'Quantity', marker: { color: barColor } }],
      layout: { title: 'Top 5 Products by Volume', xaxis: { title: 'Product' }, yaxis: { title: 'Quantity' }, margin: { t: 40, b: 120 } },
    } : null;

    const leastUsedChart = least.length ? {
      data: [{ x: least.map(p => p.productName || p.productId), y: least.map(p => Number(p.total_quantity)), type: 'bar', name: 'Quantity', marker: { color: barColorLow } }],
      layout: { title: 'Bottom 5 Products by Volume', xaxis: { title: 'Product' }, yaxis: { title: 'Quantity' }, margin: { t: 40, b: 120 } },
    } : null;

    const revenueChart = most.length ? {
      data: [{ x: most.map(p => p.productName || p.productId), y: most.map(p => Number(p.total_revenue || 0)), type: 'bar', name: 'Revenue', marker: { color: '#4caf50' } }],
      layout: { title: 'Revenue by Top Products', xaxis: { title: 'Product' }, yaxis: { title: 'Revenue ($)' }, margin: { t: 40, b: 120 } },
    } : null;

    const summaryBar = (report.summary && (most.length || least.length)) ? {
      data: [{
        x: ['Revenue ($)', 'Transactions'],
        y: [Number(report.summary.total_revenue || 0), Number(report.summary.total_transactions || 0)],
        type: 'bar',
        marker: { color: ['#4caf50', '#2196f3'] },
      }],
      layout: { title: 'Summary Metrics', xaxis: { title: '' }, yaxis: { title: 'Value' }, margin: { t: 40 } },
    } : null;

    return { mostNeededChart, leastUsedChart, revenueChart, summaryBar };
  }, [report]);

  const exportReportPdf = () => {
    const doc = new jsPDF();
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    doc.setFontSize(18);
    doc.text('Smart Inventory Analytics Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${dateStr}`, 14, 30);
    let y = 40;
    if (report?.summary) {
      doc.setFontSize(14);
      doc.text('Summary', 14, y);
      y += 8;
      doc.setFontSize(10);
      doc.text(`Total Revenue: $${Number(report.summary.total_revenue || 0).toLocaleString()}`, 14, y);
      y += 6;
      doc.text(`Total Transactions: ${report.summary.total_transactions ?? 0}`, 14, y);
      y += 6;
      doc.text(`Unique Products: ${report.summary.unique_products ?? 0}`, 14, y);
      y += 6;
      doc.text(`Date Range: ${report.summary.date_range?.start ?? ''} to ${report.summary.date_range?.end ?? ''}`, 14, y);
      y += 12;
    }
    if (report?.basic_metrics?.most_needed?.length) {
      doc.setFontSize(14);
      doc.text('Most Needed (Top 5 by Volume)', 14, y);
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [['Product', 'Quantity', 'Revenue ($)']],
        body: report.basic_metrics.most_needed.map(p => [p.productName || p.productId || '', Number(p.total_quantity ?? 0).toLocaleString(), Number(p.total_revenue ?? 0).toLocaleString()]),
      });
      y = doc.lastAutoTable.finalY + 10;
    }
    if (report?.basic_metrics?.least_used?.length) {
      doc.setFontSize(14);
      doc.text('Least Used (Bottom 5)', 14, y);
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [['Product', 'Quantity', 'Revenue ($)']],
        body: report.basic_metrics.least_used.map(p => [p.productName || p.productId || '', Number(p.total_quantity ?? 0).toLocaleString(), Number(p.total_revenue ?? 0).toLocaleString()]),
      });
      y = doc.lastAutoTable.finalY + 10;
    }
    if (report?.recommendations?.length) {
      doc.setFontSize(14);
      doc.text('Recommendations', 14, y);
      y += 8;
      doc.setFontSize(10);
      report.recommendations.forEach(rec => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`[${(rec.priority || '').toUpperCase()}] ${(rec.type || '').replace(/_/g, ' ')}`, 14, y);
        y += 6;
        doc.text(rec.message || '', 14, y, { maxWidth: 180 });
        y += 8;
      });
    }
    doc.save(`inventory_report_${dateStr}.pdf`);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderSummaryCards = () => {
    if (!report?.summary) return null;

    const metrics = [
      { label: 'Total Revenue', value: `$${report.summary.total_revenue.toLocaleString()}`, color: '#4caf50' },
      { label: 'Total Transactions', value: report.summary.total_transactions, color: '#2196f3' },
      { label: 'Unique Products', value: report.summary.unique_products, color: '#ff9800' },
      { label: 'Date Range', value: `${report.summary.date_range.start} to ${report.summary.date_range.end}`, color: '#9c27b0' },
    ];

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ bgcolor: metric.color, color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {metric.label}
                </Typography>
                <Typography variant="h4">
                  {metric.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderRecommendations = () => {
    if (!report?.recommendations) return null;

    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Smart Recommendations
        </Typography>
        <Grid container spacing={2}>
          {report.recommendations.map((rec, index) => (
            <Grid item xs={12} key={index}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Chip
                      label={(rec.priority || '').toUpperCase()}
                      color={
                        rec.priority === 'high' ? 'error' :
                          rec.priority === 'medium' ? 'warning' : 'success'
                      }
                      size="small"
                    />
                    <Typography variant="h6">
                      {(rec.type || '').replace(/_/g, ' ').toUpperCase()}
                    </Typography>
                  </Box>
                  <Typography sx={{ mb: 1 }}>{rec.message}</Typography>
                  {rec.items && Array.isArray(rec.items) && rec.items.length > 0 && (
                    <Box sx={{ mt: 1.5 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Specific products:
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Product</TableCell>
                              <TableCell align="right">Quantity</TableCell>
                              <TableCell align="right">Revenue</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {rec.items.map((item, i) => (
                              <TableRow key={i}>
                                <TableCell>{item.productName || item.productId}</TableCell>
                                <TableCell align="right">{item.total_quantity != null ? Number(item.total_quantity).toLocaleString() : '—'}</TableCell>
                                <TableCell align="right">{item.total_revenue != null ? `$${Number(item.total_revenue).toLocaleString()}` : '—'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  const renderProductAnalysis = () => {
    if (!report?.basic_metrics) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Most Needed Products (Top 5)
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.basic_metrics.most_needed.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell>{product.productName}</TableCell>
                      <TableCell align="right">{product.total_quantity}</TableCell>
                      <TableCell align="right">${product.total_revenue?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Least Used Products (Bottom 5)
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.basic_metrics.least_used.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell>{product.productName}</TableCell>
                      <TableCell align="right">{product.total_quantity}</TableCell>
                      <TableCell align="right">${product.total_revenue?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderVisualizations = () => {
    // Prefer charts built from report data (always available); fall back to API charts if present
    const rc = reportCharts || {};
    return (
      <>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Visual Insights
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use these charts to quickly understand portfolio performance, demand patterns, and anomalies across your inventory.
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {rc.summaryBar && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Summary KPIs
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  High-level view of total revenue and transactions for the selected period to gauge overall business health.
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <Plot
                    data={rc.summaryBar.data}
                    layout={{ ...rc.summaryBar.layout, height: 320 }}
                    useResizeHandler
                    style={{ width: '100%' }}
                  />
                </Box>
              </Paper>
            </Grid>
          )}
          {rc.mostNeededChart && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Top Demand Drivers
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Highlights the products with the highest demand so you can prioritize purchasing and stock allocation.
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <Plot
                    data={rc.mostNeededChart.data}
                    layout={{ ...rc.mostNeededChart.layout, height: 320 }}
                    useResizeHandler
                    style={{ width: '100%' }}
                  />
                </Box>
              </Paper>
            </Grid>
          )}
          {rc.leastUsedChart && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Slow-Moving Stock
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Shows products with the lowest movement so you can reduce overstock and free up working capital.
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <Plot
                    data={rc.leastUsedChart.data}
                    layout={{ ...rc.leastUsedChart.layout, height: 320 }}
                    useResizeHandler
                    style={{ width: '100%' }}
                  />
                </Box>
              </Paper>
            </Grid>
          )}
          {rc.revenueChart && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Revenue by Top Products
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Breaks down revenue contribution by top-performing products to identify your most valuable items.
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <Plot
                    data={rc.revenueChart.data}
                    layout={{ ...rc.revenueChart.layout, height: 320 }}
                    useResizeHandler
                    style={{ width: '100%' }}
                  />
                </Box>
              </Paper>
            </Grid>
          )}
          {charts.trend && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Demand &amp; Inventory Trends
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Visualizes how demand or stock levels evolve over time to reveal seasonality and long-term trends.
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <Plot
                    data={charts.trend.data}
                    layout={{ ...charts.trend.layout, height: 400 }}
                    useResizeHandler
                    style={{ width: '100%' }}
                  />
                </Box>
              </Paper>
            </Grid>
          )}
          {charts.performance && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Forecast Performance
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Compares predicted versus actual behavior to measure how well the ML model is performing.
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <Plot
                    data={charts.performance.data}
                    layout={{ ...charts.performance.layout, height: 400 }}
                    useResizeHandler
                    style={{ width: '100%' }}
                  />
                </Box>
              </Paper>
            </Grid>
          )}
          {charts.abc && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" gutterBottom>
                  ABC Segmentation
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Groups items into A, B, and C classes based on their impact on overall consumption or revenue.
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <Plot
                    data={charts.abc.data}
                    layout={{ ...charts.abc.layout, height: 400 }}
                    useResizeHandler
                    style={{ width: '100%' }}
                  />
                </Box>
              </Paper>
            </Grid>
          )}
          {charts.anomaly && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Anomaly Detection
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Flags unusual spikes or drops in demand or stock so you can quickly investigate potential issues.
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <Plot
                    data={charts.anomaly.data}
                    layout={{ ...charts.anomaly.layout, height: 500 }}
                    useResizeHandler
                    style={{ width: '100%' }}
                  />
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </>
    );
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Generating Smart Report... This may take up to 60 seconds.
          </Typography>
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Alert severity="error">{error}</Alert>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              startIcon={<ArrowLeft size={16} />}
            >
              Back to Dashboard
            </Button>
            <Button variant="contained" onClick={fetchReport}>
              Retry
            </Button>
          </Box>
        </Container>
      </Layout>
    );
  }

  if (!report) {
    return (
      <Layout>
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Alert severity="info">
            No report data is currently available. Try refreshing the analysis.
          </Alert>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              startIcon={<ArrowLeft size={16} />}
            >
              Back to Dashboard
            </Button>
            <Button variant="contained" onClick={fetchReport}>
              Generate Report
            </Button>
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Smart Inventory Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Explore machine learning driven insights on demand, revenue, and inventory risk to support better decisions.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              startIcon={<ArrowLeft size={16} />}
            >
              Back to Dashboard
            </Button>
            <Button
              variant="contained"
              onClick={fetchReport}
              disabled={loading}
            >
              Refresh Analysis
            </Button>
            <Button variant="outlined" onClick={exportReportPdf}>
              Export Report (PDF)
            </Button>
          </Box>
        </Box>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }} className="ml-analytics-tabs">
          <Tab label="Overview" />
          <Tab label="Product Analysis" />
          <Tab label="Visualizations" />
          <Tab label="Recommendations" />
        </Tabs>

        {activeTab === 0 && (
          <>
            {renderSummaryCards()}
            {renderRecommendations()}
            {renderVisualizations()}
          </>
        )}

        {activeTab === 1 && renderProductAnalysis()}

        {activeTab === 2 && renderVisualizations()}

        {activeTab === 3 && renderRecommendations()}
      </Container>
    </Layout>
  );
};

export default MLAnalyticsDashboard;