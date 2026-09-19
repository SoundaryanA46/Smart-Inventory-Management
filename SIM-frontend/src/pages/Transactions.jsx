import { useEffect, useState, useMemo, useCallback } from 'react';
import { Filter, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import TransactionService from '@/services/transaction.service';

const PAGE_SIZE = 50;
const DEBOUNCE_MS = 250;

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    productId: '',
    productName: '',
    type: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showSkuDropdown, setShowSkuDropdown] = useState(false);
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [skuFilter, setSkuFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce helper for filter text inputs
  const [debouncedSkuFilter, setDebouncedSkuFilter] = useState('');
  const [debouncedNameFilter, setDebouncedNameFilter] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSkuFilter(skuFilter), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [skuFilter]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedNameFilter(nameFilter), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [nameFilter]);

  useEffect(() => {
    loadTransactions();
  }, []);

  // Load transactions with filters
  const loadTransactions = useCallback(async (overrideFilters) => {
    setLoading(true);
    try {
      const activeFilters = overrideFilters || filters;
      const params = {};

      if (activeFilters.productId) {
        params.productSku = activeFilters.productId;
      }
      if (activeFilters.type) params.type = activeFilters.type;
      if (activeFilters.startDate) params.startDate = new Date(activeFilters.startDate).toISOString();
      if (activeFilters.endDate) params.endDate = new Date(activeFilters.endDate).toISOString();

      const response = await TransactionService.getAll(params);
      setTransactions(response.data || []);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading transactions:', error);
      alert('Error loading transactions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Handle filter input changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear all filters — pass empty filters directly to avoid stale-state bug
  const clearFilters = () => {
    const emptyFilters = { productId: '', productName: '', type: '', startDate: '', endDate: '' };
    setFilters(emptyFilters);
    setSkuFilter('');
    setNameFilter('');
    setShowSkuDropdown(false);
    setShowNameDropdown(false);
    loadTransactions(emptyFilters);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  // Get type variant for badge
  const getTypeVariant = (type) => {
    switch (type) {
      case 'IN': return 'success';
      case 'OUT': return 'danger';
      case 'ADJUSTMENT': return 'info';
      default: return 'default';
    }
  };

  // ── Memoized derived data ──────────────────────────────────────────
  // These were previously computed on EVERY render (causing the browser hang)

  const existingSkus = useMemo(
    () => Array.from(
      new Set(transactions.map(tx => tx.productSku).filter(sku => sku && sku.trim() !== ''))
    ).sort(),
    [transactions]
  );

  const existingProductNames = useMemo(
    () => Array.from(
      new Set(transactions.map(tx => tx.productName).filter(name => name && name.trim() !== ''))
    ).sort(),
    [transactions]
  );

  const { skuToNameMap, nameToSkuMap } = useMemo(() => {
    const s2n = new Map();
    const n2s = new Map();
    transactions.forEach(tx => {
      if (tx.productSku && tx.productName) {
        s2n.set(tx.productSku, tx.productName);
        n2s.set(tx.productName, tx.productSku);
      }
    });
    return { skuToNameMap: s2n, nameToSkuMap: n2s };
  }, [transactions]);

  const filteredSkus = useMemo(
    () => debouncedSkuFilter.trim() === ''
      ? existingSkus
      : existingSkus.filter(sku =>
        sku.toLowerCase().includes(debouncedSkuFilter.toLowerCase())
      ),
    [debouncedSkuFilter, existingSkus]
  );

  const filteredProductNames = useMemo(
    () => debouncedNameFilter.trim() === ''
      ? existingProductNames
      : existingProductNames.filter(name =>
        name.toLowerCase().includes(debouncedNameFilter.toLowerCase())
      ),
    [debouncedNameFilter, existingProductNames]
  );

  // ── Pagination ─────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const paginatedTransactions = useMemo(
    () => transactions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [transactions, currentPage]
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
            <p className="text-muted-foreground">View inventory movement history</p>
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="border border-border rounded-2xl p-6 bg-surface">
            <div className="mb-4">
              <h3 className="font-semibold">Filter Transactions</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Label>Product SKU</Label>
                <Input
                  value={filters.productId}
                  onChange={(e) => {
                    const newSku = e.target.value;
                    handleFilterChange('productId', newSku);
                    setSkuFilter(newSku);
                    setShowSkuDropdown(true);
                    // Auto-fill product name if SKU exactly matches
                    if (newSku && skuToNameMap.has(newSku)) {
                      const matchingName = skuToNameMap.get(newSku);
                      handleFilterChange('productName', matchingName);
                      setNameFilter(matchingName);
                    } else if (newSku === '') {
                      handleFilterChange('productName', '');
                      setNameFilter('');
                    }
                  }}
                  onFocus={() => setShowSkuDropdown(true)}
                  onBlur={() => {
                    // Delay to allow dropdown click
                    setTimeout(() => setShowSkuDropdown(false), 200);
                  }}
                  placeholder="Type or select SKU"
                />
                {showSkuDropdown && filteredSkus.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredSkus.map((sku) => (
                      <button
                        key={sku}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm font-mono"
                        onMouseDown={(e) => {
                          // Prevent onBlur from firing before onClick
                          e.preventDefault();
                        }}
                        onClick={() => {
                          const matchingName = skuToNameMap.get(sku);
                          setSkuFilter(sku);
                          setShowSkuDropdown(false);
                          // Update both fields in a single state update
                          setFilters(prev => ({
                            ...prev,
                            productId: sku,
                            productName: matchingName || prev.productName
                          }));
                          if (matchingName) {
                            setNameFilter(matchingName);
                          }
                        }}
                      >
                        {sku}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <Label>Product Name</Label>
                <Input
                  value={filters.productName}
                  onChange={(e) => {
                    const newName = e.target.value;
                    handleFilterChange('productName', newName);
                    setNameFilter(newName);
                    setShowNameDropdown(true);
                    // Auto-fill SKU if product name exactly matches
                    if (newName && nameToSkuMap.has(newName)) {
                      const matchingSku = nameToSkuMap.get(newName);
                      handleFilterChange('productId', matchingSku);
                      setSkuFilter(matchingSku);
                    } else if (newName === '') {
                      handleFilterChange('productId', '');
                      setSkuFilter('');
                    }
                  }}
                  onFocus={() => setShowNameDropdown(true)}
                  onBlur={() => {
                    // Delay to allow dropdown click
                    setTimeout(() => setShowNameDropdown(false), 200);
                  }}
                  placeholder="Type or select product name"
                />
                {showNameDropdown && filteredProductNames.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredProductNames.map((name) => (
                      <button
                        key={name}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                        onMouseDown={(e) => {
                          // Prevent onBlur from firing before onClick
                          e.preventDefault();
                        }}
                        onClick={() => {
                          const matchingSku = nameToSkuMap.get(name);
                          setNameFilter(name);
                          setShowNameDropdown(false);
                          // Update both fields in a single state update
                          setFilters(prev => ({
                            ...prev,
                            productName: name,
                            productId: matchingSku || prev.productId
                          }));
                          if (matchingSku) {
                            setSkuFilter(matchingSku);
                          }
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label>Type</Label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                >
                  <option value="">All Types</option>
                  <option value="IN">Stock In</option>
                  <option value="OUT">Stock Out</option>
                  <option value="ADJUSTMENT">Adjustment</option>
                </select>
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>

            {/* Apply / Clear Buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={clearFilters}>Clear</Button>
              <Button onClick={() => loadTransactions()}>Apply Filters</Button>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="border border-border rounded-2xl overflow-hidden bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">SKU</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Quantity</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Unit Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Reference</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Performed By</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-12 h-12 text-muted-foreground mb-3" />
                        <p className="text-base font-medium text-foreground mb-1">No transactions found</p>
                        <p className="text-sm text-muted-foreground">Transaction history will appear here.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((tx, index) => (
                    <tr
                      key={tx.id}
                      className={`border-t border-border transition-colors duration-150 ${index % 2 === 0 ? 'bg-surface' : 'bg-muted/30'
                        } hover:bg-muted/50`}
                    >
                      <td className="px-6 py-4 text-sm text-foreground">{new Date(tx.transactionDate).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm font-mono text-foreground">{tx.productSku}</td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{tx.productName}</td>
                      <td className="px-6 py-4 text-sm">
                        <Badge variant={getTypeVariant(tx.type)}>
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">{tx.quantity}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">${tx.unitPrice?.toFixed(2) || '0.00'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-foreground">${tx.totalValue?.toFixed(2) || '0.00'}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{tx.reference || '-'}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{tx.performedBy || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination + Count */}
        {transactions.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, transactions.length)} of {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
