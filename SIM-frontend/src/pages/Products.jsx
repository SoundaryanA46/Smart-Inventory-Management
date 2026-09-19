import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, Search, X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import AuthService from '@/services/auth.service';
import ProductService from '@/services/product.service';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showCategoryFilterDropdown, setShowCategoryFilterDropdown] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    stockMin: '',
    stockMax: '',
    minStockMin: '',
    minStockMax: '',
    unitPriceMin: '',
    unitPriceMax: ''
  });
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    unit: 'pcs',
    minimumStock: 0,
    unitPrice: 0,
    costPrice: 0,
    supplier: '',
    location: ''
  });
  const [stockForm, setStockForm] = useState({
    type: 'IN',
    quantity: 0,
    unitPrice: 0,
    reference: '',
    notes: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await ProductService.getAll();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ensure numeric fields are properly converted
      const productData = {
        ...formData,
        minimumStock: parseFloat(formData.minimumStock) || 0,
        unitPrice: parseFloat(formData.unitPrice) || 0,
        costPrice: parseFloat(formData.costPrice) || 0
      };
      
      if (editingProduct) {
        await ProductService.update(editingProduct.id, productData);
      } else {
        await ProductService.create(productData);
      }
      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      let errorMessage = 'Error saving product';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'API endpoint not found. Please check if the backend server is running on port 8080.';
        } else if (error.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else {
          errorMessage = error.response.data?.message || error.message || errorMessage;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check if the backend server is running.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      alert(errorMessage);
    }
  };

  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    try {
      await ProductService.adjustStock(selectedProduct.id, {
        type: stockForm.type,
        quantity: parseFloat(stockForm.quantity) || 0,
        unitPrice: parseFloat(stockForm.unitPrice) || selectedProduct.unitPrice || 0,
        reference: stockForm.reference,
        notes: stockForm.notes
      });
      setShowStockForm(false);
      setSelectedProduct(null);
      setStockForm({ type: 'IN', quantity: 0, unitPrice: 0, reference: '', notes: '' });
      loadProducts();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error adjusting stock';
      alert(errorMessage);
    }
  };

  const handleQuickStockAdjustment = async (productId, type, quantity = 1) => {
    try {
      await ProductService.adjustStock(productId, {
        type: type, // 'IN' or 'OUT'
        quantity: parseFloat(quantity) || 1, // Ensure it's a number
        unitPrice: 0, // Will use product's unit price from backend
        reference: '',
        notes: `Quick ${type === 'IN' ? 'add' : 'remove'}`
      });
      loadProducts();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      let errorMessage = 'Error adjusting stock';
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Invalid request. Please check the values.';
        } else if (error.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else {
          errorMessage = error.response.data?.message || error.message || errorMessage;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check if the backend server is running.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      alert(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await ProductService.delete(id);
      loadProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting product');
    }
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      category: '',
      unit: 'pcs',
      minimumStock: 0,
      unitPrice: 0,
      costPrice: 0,
      supplier: '',
      location: ''
    });
    setCategoryFilter('');
    setShowCategoryDropdown(false);
  };

  const openEditForm = (product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      unit: product.unit || 'pcs',
      minimumStock: product.minimumStock || 0,
      unitPrice: product.unitPrice || 0,
      costPrice: product.costPrice || 0,
      supplier: product.supplier || '',
      location: product.location || ''
    });
    setCategoryFilter(product.category || '');
    setShowCategoryDropdown(false);
    setShowForm(true);
  };

  const openStockForm = (product) => {
    setSelectedProduct(product);
    setStockForm({
      type: 'IN',
      quantity: 0,
      unitPrice: product.unitPrice || 0,
      reference: '',
      notes: ''
    });
    setShowStockForm(true);
  };

  // Sort products alphabetically by name
  const sortedProducts = [...products].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
  );

  // Apply search + advanced filters
  const filteredProducts = sortedProducts.filter((p) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      p.name?.toLowerCase().includes(search) ||
      p.sku?.toLowerCase().includes(search) ||
      p.category?.toLowerCase().includes(search);

    if (!matchesSearch) return false;

    // Category filter (exact match)
    if (filters.category && p.category !== filters.category) return false;

    const stock = p.currentStock ?? 0;
    const minStock = p.minimumStock ?? 0;
    const unitPrice = p.unitPrice ?? 0;

    if (filters.stockMin && stock < parseFloat(filters.stockMin)) return false;
    if (filters.stockMax && stock > parseFloat(filters.stockMax)) return false;

    if (filters.minStockMin && minStock < parseFloat(filters.minStockMin)) return false;
    if (filters.minStockMax && minStock > parseFloat(filters.minStockMax)) return false;

    if (filters.unitPriceMin && unitPrice < parseFloat(filters.unitPriceMin)) return false;
    if (filters.unitPriceMax && unitPrice > parseFloat(filters.unitPriceMax)) return false;

    return true;
  });

  // Optionally restrict to products that have crossed minimum stock (current < minimum)
  const displayedProducts = showLowStockOnly
    ? filteredProducts.filter((p) => (p.currentStock ?? 0) < (p.minimumStock ?? 0))
    : filteredProducts;

  // Get unique categories from existing products
  const existingCategories = Array.from(
    new Set(products.map(p => p.category).filter(cat => cat && cat.trim() !== ''))
  ).sort();

  // Filter categories based on input, or show all if input is empty (for form)
  const filteredCategories = categoryFilter.trim() === ''
    ? existingCategories
    : existingCategories.filter(cat =>
        cat.toLowerCase().includes(categoryFilter.toLowerCase())
      );

  // Categories for filter panel dropdown (filter by filters.category)
  const filteredCategoriesForFilter = (filters.category || '').trim() === ''
    ? existingCategories
    : existingCategories.filter(cat =>
        cat.toLowerCase().includes((filters.category || '').toLowerCase())
      );

  const currentUser = AuthService.getCurrentUser();
  const isAdmin = currentUser?.roles?.some(role => role === 'ROLE_ADMIN' || role.includes('ADMIN'));

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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground">Manage your inventory products</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters((prev) => !prev)}
            >
              Filters
            </Button>
            {isAdmin && (
              <Button
                onClick={() => {
                  setShowForm(true);
                  setEditingProduct(null);
                  resetForm();
                  setCategoryFilter('');
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        {/* Category count (when a category filter is selected) */}
        {filters.category && !showLowStockOnly && (
          <div className="text-lg font-semibold tracking-wide text-foreground">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} in "{filters.category}"
          </div>
        )}
        {showLowStockOnly && (
          <div className="text-lg font-semibold tracking-wide text-foreground">
            {displayedProducts.length} product{displayedProducts.length !== 1 ? 's' : ''} below minimum stock
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name, SKU, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="border border-border rounded-2xl p-6 bg-surface">
            <div className="mb-4">
              <h3 className="font-semibold text-foreground">Filter Products</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Category — typeable + dropdown */}
              <div className="relative">
                <Label>Category</Label>
                <Input
                  value={filters.category}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, category: e.target.value }))
                  }
                  onFocus={() => setShowCategoryFilterDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCategoryFilterDropdown(false), 200)}
                  placeholder="Type or select category"
                  className="w-full"
                />
                {showCategoryFilterDropdown && filteredCategoriesForFilter.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm text-muted-foreground"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, category: '' }));
                        setShowCategoryFilterDropdown(false);
                      }}
                    >
                      All Categories
                    </button>
                    {filteredCategoriesForFilter.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, category: cat }));
                          setShowCategoryFilterDropdown(false);
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Stock range */}
              <div>
                <Label>Stock</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.stockMin}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, stockMin: e.target.value }))
                    }
                    min="0"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.stockMax}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, stockMax: e.target.value }))
                    }
                    min="0"
                  />
                </div>
              </div>

              {/* Min Stock range */}
              <div>
                <Label>Min Stock</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minStockMin}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, minStockMin: e.target.value }))
                    }
                    min="0"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.minStockMax}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, minStockMax: e.target.value }))
                    }
                    min="0"
                  />
                </div>
              </div>

              {/* Unit Price range */}
              <div>
                <Label>Unit Price</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.unitPriceMin}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, unitPriceMin: e.target.value }))
                    }
                    min="0"
                    step="0.01"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.unitPriceMax}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, unitPriceMax: e.target.value }))
                    }
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant={showLowStockOnly ? 'default' : 'outline'}
                type="button"
                onClick={() => setShowLowStockOnly((prev) => !prev)}
                title="Show only products where current stock is below minimum"
              >
                Below minimum stock
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setFilters({
                    category: '',
                    stockMin: '',
                    stockMax: '',
                    minStockMin: '',
                    minStockMax: '',
                    unitPriceMin: '',
                    unitPriceMax: ''
                  });
                  setShowLowStockOnly(false);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="border border-border rounded-2xl overflow-hidden bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">SKU</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Stock</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Min Stock</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Unit Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="w-12 h-12 text-muted-foreground mb-3" />
                      <p className="text-base font-medium text-foreground mb-1">
                        {showLowStockOnly ? 'No products below minimum stock' : 'No inventory items yet.'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {showLowStockOnly ? 'All products are above their minimum stock levels.' : 'Start by adding your first product.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedProducts.map((product, index) => {
                  const stockStatus = product.currentStock <= product.minimumStock ? 'danger' : 
                                    product.currentStock <= product.minimumStock * 1.5 ? 'warning' : 'success';
                  return (
                    <tr 
                      key={product.id} 
                      className={`border-t border-border transition-colors duration-150 ${
                        index % 2 === 0 ? 'bg-surface' : 'bg-muted/30'
                      } hover:bg-muted/50`}
                    >
                      <td className="px-6 py-4 text-sm font-mono text-foreground">{product.sku}</td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{product.name}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{product.category || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${product.currentStock <= product.minimumStock ? 'text-destructive' : 'text-foreground'}`}>
                            {product.currentStock} {product.unit}
                          </span>
                          <Badge variant={stockStatus}>
                            {product.currentStock <= product.minimumStock ? 'Low' : 
                             product.currentStock <= product.minimumStock * 1.5 ? 'Warning' : 'In Stock'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{product.minimumStock} {product.unit}</td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">${product.unitPrice?.toFixed(2) || '0.00'}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          {/* Quick stock adjustment buttons - available for all users */}
                          <div className="flex items-center gap-1 border border-border rounded-lg bg-surface">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuickStockAdjustment(product.id, 'OUT', 1)}
                              title="Remove 1 item"
                              className="h-7 w-7 p-0 rounded-r-none"
                            >
                              <span className="text-sm">-</span>
                            </Button>
                            <span className="px-2 text-xs text-muted-foreground min-w-[2rem] text-center font-medium">
                              {product.currentStock}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuickStockAdjustment(product.id, 'IN', 1)}
                              title="Add 1 item"
                              className="h-7 w-7 p-0 rounded-l-none"
                            >
                              <span className="text-sm">+</span>
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openStockForm(product)}
                            title="Advanced Stock Adjustment"
                            className="rounded-lg"
                          >
                            {product.currentStock <= product.minimumStock ? (
                              <ArrowUp className="w-4 h-4 text-destructive" />
                            ) : (
                              <ArrowDown className="w-4 h-4" />
                            )}
                          </Button>
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditForm(product)}
                                className="rounded-lg"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(product.id)}
                                className="rounded-lg"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Product Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-surface rounded-2xl p-5 sm:p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                <Button variant="ghost" size="icon" onClick={() => { 
                  setShowForm(false); 
                  setEditingProduct(null); 
                  resetForm();
                }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>SKU *</Label>
                    <Input
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Description</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="relative">
                    <Label>Category</Label>
                    <Input
                      value={formData.category}
                      onChange={(e) => {
                        setFormData({ ...formData, category: e.target.value });
                        setCategoryFilter(e.target.value);
                        setShowCategoryDropdown(true);
                      }}
                      onFocus={() => setShowCategoryDropdown(true)}
                      onBlur={() => {
                        // Delay to allow dropdown click
                        setTimeout(() => setShowCategoryDropdown(false), 200);
                      }}
                      placeholder="Type or select category"
                    />
                    {showCategoryDropdown && filteredCategories.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredCategories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                            onMouseDown={(e) => {
                              // Prevent onBlur from firing before onClick
                              e.preventDefault();
                            }}
                            onClick={() => {
                              setFormData({ ...formData, category: cat });
                              setCategoryFilter(cat);
                              setShowCategoryDropdown(false);
                            }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Input
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="pcs, kg, liters"
                    />
                  </div>
                  <div>
                    <Label>Minimum Stock *</Label>
                    <Input
                      type="number"
                      value={formData.minimumStock}
                      onChange={(e) => setFormData({ ...formData, minimumStock: parseFloat(e.target.value) || 0 })}
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label>Cost Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label>Supplier</Label>
                    <Input
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { 
                    setShowForm(false); 
                    setEditingProduct(null); 
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stock Adjustment Modal */}
        {showStockForm && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-surface rounded-2xl p-5 sm:p-6 w-full max-w-md mx-4 shadow-xl border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Stock Adjustment</h2>
                <Button variant="ghost" size="icon" onClick={() => { setShowStockForm(false); setSelectedProduct(null); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Product: <span className="font-medium">{selectedProduct.name}</span> ({selectedProduct.sku})
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Current Stock: <span className="font-medium">{selectedProduct.currentStock} {selectedProduct.unit}</span>
              </p>
              <form onSubmit={handleStockAdjustment} className="space-y-4">
                <div>
                  <Label>Type *</Label>
                  <select
                    value={stockForm.type}
                    onChange={(e) => setStockForm({ ...stockForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                    required
                  >
                    <option value="IN">Stock In</option>
                    <option value="OUT">Stock Out</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                  </select>
                </div>
                <div>
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={stockForm.quantity}
                    onChange={(e) => setStockForm({ ...stockForm, quantity: parseFloat(e.target.value) || 0 })}
                    required
                    min="0"
                  />
                </div>
                <div>
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={stockForm.unitPrice}
                    onChange={(e) => setStockForm({ ...stockForm, unitPrice: parseFloat(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div>
                  <Label>Reference</Label>
                  <Input
                    value={stockForm.reference}
                    onChange={(e) => setStockForm({ ...stockForm, reference: e.target.value })}
                    placeholder="Invoice #, Order #, etc."
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input
                    value={stockForm.notes}
                    onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setShowStockForm(false); setSelectedProduct(null); }}>
                    Cancel
                  </Button>
                  <Button type="submit">Adjust Stock</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
