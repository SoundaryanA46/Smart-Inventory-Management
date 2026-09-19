import { useState } from 'react';
import { Download, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Layout from '@/components/Layout';
import ReportService from '@/services/report.service';

export default function Reports() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const handleDownload = async (type, format) => {
    setLoading(true);
    try {
      if (type === 'products') {
        if (format === 'csv') {
          await ReportService.downloadProductsCSV();
        } else {
          await ReportService.downloadProductsPDF();
        }
      } else {
        const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
        const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
        if (format === 'csv') {
          await ReportService.downloadTransactionsCSV(startDate, endDate);
        } else {
          await ReportService.downloadTransactionsPDF(startDate, endDate);
        }
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Reports</h1>
          <p className="text-muted-foreground">Generate and download inventory reports</p>
        </div>

        {/* Products Report */}
        <div className="border border-border rounded-lg p-6 bg-background">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Products Report</h2>
              <p className="text-sm text-muted-foreground">
                Export all products with their current stock levels, pricing, and details.
              </p>
            </div>
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => handleDownload('products', 'csv')}
              disabled={loading}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
            <Button
              onClick={() => handleDownload('products', 'pdf')}
              disabled={loading}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Transactions Report */}
        <div className="border border-border rounded-lg p-6 bg-background">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Transactions Report</h2>
              <p className="text-sm text-muted-foreground">
                Export transaction history with optional date range filter.
              </p>
            </div>
            <Calendar className="w-8 h-8 text-black dark:text-white" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="datetime-local"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="datetime-local"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => handleDownload('transactions', 'csv')}
              disabled={loading}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
            <Button
              onClick={() => handleDownload('transactions', 'pdf')}
              disabled={loading}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {loading && (
          <div className="text-center text-muted-foreground">
            Generating report...
          </div>
        )}
      </div>
    </Layout>
  );
}
