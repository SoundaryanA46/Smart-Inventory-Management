import importlib.util
spec = importlib.util.spec_from_file_location('invmod','ml-scripts/inventory_ml_model.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
InventoryAnalyzer = mod.InventoryAnalyzer
an = InventoryAnalyzer('mongodb://localhost:27017/','your_database_name')
df = an.fetch_data(10)
metrics = an.calculate_basic_metrics(df)
print(type(metrics['product_stats']))
print(len(metrics['product_stats']))
print(metrics['product_stats'][0])
