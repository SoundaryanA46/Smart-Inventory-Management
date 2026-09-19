import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import joblib
from pymongo import MongoClient
import warnings
warnings.filterwarnings('ignore')

class InventoryAnalyzer:
    def __init__(self, mongo_uri, db_name):
        """
        Initialize Mongo client with short timeouts so that if MongoDB is
        down/unreachable we fail fast and fall back to synthetic data.
        This keeps the overall report generation well within the Java
        backend timeout instead of hanging for 20–30s on connection attempts.
        """
        self.client = MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=2000,
            connectTimeoutMS=2000,
            socketTimeoutMS=2000,
        )
        self.db = self.client[db_name]
        self.transactions = self.db['transactions']
        
    def fetch_data(self, lookback_days=365):
        """Fetch transaction data from MongoDB"""
        cutoff_date = datetime.now() - timedelta(days=lookback_days)
        
        query = {"transactionDate": {"$gte": cutoff_date}}
        try:
            data = list(self.transactions.find(query))
            df = pd.DataFrame(data)
        except Exception as e:
            # If Mongo is unreachable, generate synthetic sample data so UI can still display
            import sys
            print(f"Warning: failed to fetch from MongoDB ({e}), generating sample dataset instead", file=sys.stderr)
            sample_rows = []
            product_ids = [f"P{100+i}" for i in range(8)]
            product_names = [f"Sample Product {i+1}" for i in range(8)]
            skus = [f"SKU{i+1:03d}" for i in range(8)]
            for i in range(60):
                d = datetime.now() - timedelta(days=np.random.randint(0, lookback_days))
                pid = np.random.choice(product_ids)
                idx = product_ids.index(pid)
                qty = int(np.random.poisson(5)) + 1
                price = float(round(np.random.uniform(5, 150), 2))
                total = qty * price
                sample_rows.append({
                    'transactionDate': d,
                    'createdAt': d,
                    'productId': pid,
                    'productName': product_names[idx],
                    'productSku': skus[idx],
                    'quantity': qty,
                    'totalValue': total,
                    'unitPrice': price
                })
            df = pd.DataFrame(sample_rows)
        
        # Convert date columns
        date_columns = ['transactionDate', 'createdAt']
        for col in date_columns:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col])
        
        return df
    
    def calculate_basic_metrics(self, df):
        """Calculate basic inventory metrics"""
        metrics = {}
        
        # Group by product
        product_stats = df.groupby(['productId', 'productName', 'productSku']).agg({
            'quantity': ['sum', 'mean', 'std'],
            'totalValue': 'sum',
            'unitPrice': 'mean'
        }).reset_index()
        
        product_stats.columns = ['productId', 'productName', 'productSku', 
                                'total_quantity', 'avg_quantity', 'std_quantity',
                                'total_revenue', 'avg_price']
        
        # Identify most needed product (highest sales volume)
        most_needed = product_stats.nlargest(5, 'total_quantity')
        
        # Identify least used product (lowest sales volume)
        least_used = product_stats.nsmallest(5, 'total_quantity')
        
        # Calculate profit (assuming cost is 60% of price for demo)
        product_stats['estimated_cost'] = product_stats['avg_price'] * 0.6
        product_stats['estimated_profit'] = product_stats['total_revenue'] - \
                                          (product_stats['total_quantity'] * product_stats['estimated_cost'])
        
        # Convert DataFrame to JSON-serializable records
        metrics['product_stats'] = product_stats.to_dict('records')
        metrics['most_needed'] = most_needed.to_dict('records')
        metrics['least_used'] = least_used.to_dict('records')
        
        return metrics
    
    def calculate_abc_analysis(self, df):
        """Perform ABC analysis for inventory classification"""
        product_value = df.groupby('productId').agg({
            'totalValue': 'sum',
            'quantity': 'sum'
        }).reset_index()
        
        product_value = product_value.sort_values('totalValue', ascending=False)
        product_value['cumulative_percentage'] = product_value['totalValue'].cumsum() / product_value['totalValue'].sum() * 100
        
        # Classify as A, B, or C items
        product_value['abc_class'] = pd.cut(
            product_value['cumulative_percentage'],
            bins=[0, 80, 95, 100],
            labels=['A', 'B', 'C']
        )

        # Ensure no NaN classes: anything not falling into a bin becomes 'C'
        if 'abc_class' in product_value.columns:
            product_value['abc_class'] = product_value['abc_class'].astype(object)
            product_value['abc_class'] = product_value['abc_class'].where(
                product_value['abc_class'].notna(), 'C'
            )

        # Replace any remaining NaN/inf numeric values with 0 for JSON safety
        product_value = product_value.replace([np.inf, -np.inf], np.nan).fillna(0)

        return product_value
    
    def calculate_forecast_demand(self, df, product_id=None, forecast_days=30):
        """Forecast future demand using moving average"""
        df['date'] = pd.to_datetime(df['transactionDate']).dt.date
        daily_sales = df.groupby(['date', 'productId']).agg({'quantity': 'sum'}).reset_index()
        
        if product_id:
            product_sales = daily_sales[daily_sales['productId'] == product_id]
        else:
            product_sales = daily_sales.groupby('date').agg({'quantity': 'sum'}).reset_index()
        
        # Simple moving average forecast
        forecast_window = 7  # 7-day moving average
        product_sales = product_sales.sort_values('date')
        product_sales['moving_avg'] = product_sales['quantity'].rolling(window=forecast_window).mean()
        
        # Forecast future demand
        last_avg = product_sales['moving_avg'].iloc[-1]
        forecast = pd.DataFrame({
            'date': pd.date_range(start=product_sales['date'].iloc[-1], periods=forecast_days+1)[1:],
            'forecast_quantity': [last_avg] * forecast_days
        })
        
        return forecast
    
    def calculate_reorder_points(self, df, service_level=0.95, lead_time_days=7):
        """Calculate reorder points using statistical methods"""
        try:
            from scipy import stats
            z_score = stats.norm.ppf(service_level)
        except Exception:
            # scipy not available; use approximate z for 0.95
            z_score = 1.645
        
        product_stats = df.groupby('productId').agg({
            'quantity': ['mean', 'std', 'count']
        }).reset_index()
        
        product_stats.columns = ['productId', 'avg_daily_demand', 'std_demand', 'transaction_count']
        
        # Calculate safety stock
        product_stats['safety_stock'] = z_score * product_stats['std_demand'] * np.sqrt(lead_time_days)
        
        # Calculate reorder point
        product_stats['reorder_point'] = (product_stats['avg_daily_demand'] * lead_time_days) + product_stats['safety_stock']
        
        # Calculate economic order quantity (EOQ) approximation
        ordering_cost = 50  # Fixed cost per order
        holding_cost_percentage = 0.25  # 25% holding cost
        
        product_stats['eoq'] = np.sqrt(
            (2 * product_stats['avg_daily_demand'] * 365 * ordering_cost) /
            (product_stats['avg_daily_demand'].mean() * holding_cost_percentage)
        )

        # Clean up any NaN/inf from low-data products
        product_stats = product_stats.replace([np.inf, -np.inf], np.nan).fillna(0)

        return product_stats
    
    def detect_anomalies(self, df):
        """Detect unusual transaction patterns"""
        try:
            from sklearn.ensemble import IsolationForest
            # Prepare features for anomaly detection
            features = df.groupby('productId').agg({
                'quantity': ['mean', 'std', 'count'],
                'totalValue': 'sum'
            }).reset_index()

            features.columns = ['productId', 'qty_mean', 'qty_std', 'transaction_count', 'total_value']

            # Handle missing values
            features = features.fillna(features.mean())

            # Use Isolation Forest for anomaly detection
            iso_forest = IsolationForest(contamination=0.1, random_state=42)
            features['anomaly_score'] = iso_forest.fit_predict(
                features[['qty_mean', 'qty_std', 'transaction_count']]
            )

            # Mark anomalies (where score = -1)
            features['is_anomaly'] = features['anomaly_score'] == -1

            anomalies = features[features['is_anomaly']].to_dict('records')

            return anomalies, features
        except Exception:
            # sklearn not available: return no anomalies and simple features
            features = df.groupby('productId').agg({
                'quantity': ['mean', 'std', 'count'],
                'totalValue': 'sum'
            }).reset_index()
            features.columns = ['productId', 'qty_mean', 'qty_std', 'transaction_count', 'total_value']
            features = features.fillna(0)
            features['is_anomaly'] = False
            return [], features
    
    def generate_smart_report(self, lookback_days=90):
        """Generate comprehensive smart report"""
        df = self.fetch_data(lookback_days)
        
        if df.empty:
            return {"error": "No data available"}
        
        report = {
            "summary": {
                "total_transactions": len(df),
                "total_revenue": df['totalValue'].sum(),
                "total_quantity": df['quantity'].sum(),
                "unique_products": df['productId'].nunique(),
                "date_range": {
                    "start": df['transactionDate'].min().strftime('%Y-%m-%d'),
                    "end": df['transactionDate'].max().strftime('%Y-%m-%d')
                }
            },
            "basic_metrics": self.calculate_basic_metrics(df),
            "abc_analysis": self.calculate_abc_analysis(df).to_dict('records'),
            "reorder_points": self.calculate_reorder_points(df).to_dict('records'),
            "demand_forecast": self.calculate_forecast_demand(df).to_dict('records'),
        }
        
        # Add anomaly detection
        anomalies, anomaly_features = self.detect_anomalies(df)
        report["anomalies"] = anomalies
        report["anomaly_features"] = anomaly_features.to_dict('records')
        
        # Calculate trends
        report["trends"] = self.calculate_trends(df)
        
        # Generate recommendations
        report["recommendations"] = self.generate_recommendations(report)
        
        return report
    
    def calculate_trends(self, df):
        """Calculate sales trends over time"""
        df['month'] = pd.to_datetime(df['transactionDate']).dt.to_period('M')
        monthly_trends = df.groupby('month').agg({
            'quantity': 'sum',
            'totalValue': 'sum'
        }).reset_index()
        
        monthly_trends['month'] = monthly_trends['month'].dt.strftime('%Y-%m')
        
        # Calculate growth rate
        monthly_trends['quantity_growth'] = monthly_trends['quantity'].pct_change() * 100
        monthly_trends['revenue_growth'] = monthly_trends['totalValue'].pct_change() * 100

        # Replace NaN / inf growth values with 0 so JSON is standards-compliant
        # (Jackson in the Java backend rejects NaN/Infinity tokens)
        for col in ['quantity_growth', 'revenue_growth']:
            if col in monthly_trends.columns:
                monthly_trends[col].replace([np.inf, -np.inf], np.nan, inplace=True)
        monthly_trends[['quantity_growth', 'revenue_growth']] = (
            monthly_trends[['quantity_growth', 'revenue_growth']].fillna(0.0)
        )
        
        return monthly_trends.to_dict('records')
    
    def generate_recommendations(self, report):
        """Generate smart recommendations based on analysis"""
        recommendations = []
        
        # ABC Analysis recommendations
        abc_items = report['abc_analysis']
        a_items = [item for item in abc_items if item['abc_class'] == 'A']
        
        if len(a_items) > 0:
            recommendations.append({
                "type": "inventory_focus",
                "priority": "high",
                "message": f"Focus on managing {len(a_items)} 'A' class items (80% of value). Implement tight controls.",
                "items": a_items[:3]  # Top 3 A items
            })
        
        # Reorder point recommendations
        reorder_data = report['reorder_points']
        low_stock_items = [item for item in reorder_data 
                          if item.get('transaction_count', 0) > 10 
                          and item.get('avg_daily_demand', 0) > item.get('safety_stock', 0)]
        
        if low_stock_items:
            recommendations.append({
                "type": "reorder_suggestion",
                "priority": "medium",
                "message": f"{len(low_stock_items)} items may need reordering soon.",
                "items": low_stock_items[:5]
            })
        
        # Anomaly recommendations
        if report.get('anomalies'):
            recommendations.append({
                "type": "anomaly_alert",
                "priority": "high",
                "message": f"Detected {len(report['anomalies'])} unusual transaction patterns that need investigation.",
                "count": len(report['anomalies'])
            })
        
        # Slow-moving items
        slow_items = report['basic_metrics']['least_used']
        if slow_items:
            recommendations.append({
                "type": "slow_moving",
                "priority": "low",
                "message": f"Consider discounting or discontinuing {len(slow_items)} slow-moving items.",
                "items": slow_items
            })
        
        return recommendations

# CLI wrapper: allow calling individual actions and print JSON to stdout
if __name__ == "__main__":
    import argparse
    import json
    from visualization_generator import InventoryVisualizer

    parser = argparse.ArgumentParser(description='Inventory ML CLI')
    parser.add_argument('--action', required=False, default='generate_report', help='Action to perform: generate_report, forecast, abc, reorder, visualize')
    parser.add_argument('--lookback', type=int, default=90)
    parser.add_argument('--productId', type=str, default=None)
    parser.add_argument('--forecastDays', type=int, default=30)
    parser.add_argument('--chartType', type=str, default=None)
    parser.add_argument('--db', type=str, default='your_database_name')
    parser.add_argument('--mongo', type=str, default='mongodb://localhost:27017/')

    args = parser.parse_args()

    analyzer = InventoryAnalyzer(mongo_uri=args.mongo, db_name=args.db)

    action = args.action

    try:
        if action == 'generate_report':
            report = analyzer.generate_smart_report(lookback_days=args.lookback)
            print(json.dumps(report, default=str))

        elif action == 'forecast':
            df = analyzer.fetch_data(args.lookback)
            forecast = analyzer.calculate_forecast_demand(df, product_id=args.productId, forecast_days=args.forecastDays)
            # Convert to records keyed by date
            out = [ { 'date': d.strftime('%Y-%m-%d') if hasattr(d, 'strftime') else str(d), 'forecast_quantity': int(q) } for d,q in zip(forecast['date'], forecast['forecast_quantity']) ] if hasattr(forecast, 'to_dict') else forecast
            print(json.dumps(out, default=str))

        elif action == 'abc':
            df = analyzer.fetch_data(args.lookback)
            abc = analyzer.calculate_abc_analysis(df)
            print(json.dumps(abc.to_dict('records'), default=str))

        elif action == 'reorder':
            df = analyzer.fetch_data(args.lookback)
            reorder = analyzer.calculate_reorder_points(df)
            print(json.dumps(reorder.to_dict('records'), default=str))

        elif action == 'visualize':
            if not args.chartType:
                raise ValueError('chartType is required for visualize action')

            df = analyzer.fetch_data(args.lookback)
            vis = InventoryVisualizer()

            chart_json = None
            ct = args.chartType.lower()
            if ct == 'abc':
                abc = analyzer.calculate_abc_analysis(df)
                chart_json = vis.create_abc_chart(abc.to_dict('records'))
            elif ct == 'heatmap':
                chart_json = vis.create_demand_heatmap(df.to_dict('records'))
            elif ct == 'trend':
                trend = analyzer.calculate_trends(df)
                chart_json = vis.create_trend_analysis(trend)
            elif ct == 'performance':
                metrics = analyzer.calculate_basic_metrics(df)
                product_stats = metrics.get('product_stats')
                # product_stats is a DataFrame; if not, convert
                try:
                    product_records = product_stats.to_dict('records')
                except Exception:
                    product_records = product_stats
                chart_json = vis.create_product_performance_scatter(product_records)
            elif ct == 'anomaly':
                anomalies, features = analyzer.detect_anomalies(df)
                chart_json = vis.create_anomaly_detection_chart(features.to_dict('records'))
            elif ct == 'reorder':
                reorder = analyzer.calculate_reorder_points(df)
                chart_json = vis.create_reorder_point_chart(reorder.to_dict('records'))
            else:
                raise ValueError('Unknown chartType: ' + args.chartType)

            # chart_json is a JSON string
            print(chart_json)

        else:
            raise ValueError('Unknown action: ' + action)

    except Exception as e:
        # For debugging and upstream error handling, print error to stderr and exit non-zero
        import sys, traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(2)