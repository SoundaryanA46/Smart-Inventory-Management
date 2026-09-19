import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np
from plotly.subplots import make_subplots

class InventoryVisualizer:
    @staticmethod
    def create_abc_chart(abc_data):
        """Create ABC analysis Pareto chart"""
        df = pd.DataFrame(abc_data)
        
        fig = make_subplots(specs=[[{"secondary_y": True}]])
        
        # Bar chart for individual values
        fig.add_trace(
            go.Bar(x=df['productId'].astype(str), y=df['totalValue'],
                   name="Product Value", marker_color='blue'),
            secondary_y=False,
        )
        
        # Line for cumulative percentage
        fig.add_trace(
            go.Scatter(x=df['productId'].astype(str), y=df['cumulative_percentage'],
                      name="Cumulative %", line=dict(color='red', width=2)),
            secondary_y=True,
        )
        
        fig.update_layout(
            title="ABC Analysis - Pareto Chart",
            xaxis_title="Products",
            yaxis_title="Total Value",
            hovermode='x unified',
            showlegend=True
        )
        
        fig.update_yaxes(title_text="Total Value", secondary_y=False)
        fig.update_yaxes(title_text="Cumulative Percentage", secondary_y=True)
        
        return fig.to_json()
    
    @staticmethod
    def create_demand_heatmap(transaction_data):
        """Create heatmap of demand patterns"""
        df = pd.DataFrame(transaction_data)
        df['date'] = pd.to_datetime(df['transactionDate'])
        df['day_of_week'] = df['date'].dt.day_name()
        df['hour'] = df['date'].dt.hour
        
        pivot = df.pivot_table(
            values='quantity',
            index='day_of_week',
            columns='hour',
            aggfunc='sum',
            fill_value=0
        )
        
        # Reorder days
        days_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        pivot = pivot.reindex(days_order)
        
        fig = px.imshow(
            pivot,
            labels=dict(x="Hour of Day", y="Day of Week", color="Quantity Sold"),
            title="Demand Heatmap by Day and Hour"
        )
        
        fig.update_xaxes(side="top")
        fig.update_layout(height=500)
        
        return fig.to_json()
    
    @staticmethod
    def create_trend_analysis(trend_data):
        """Create interactive trend analysis chart"""
        df = pd.DataFrame(trend_data)
        
        fig = make_subplots(
            rows=2, cols=1,
            subplot_titles=("Sales Quantity Trend", "Revenue Growth"),
            vertical_spacing=0.15
        )
        
        # Quantity trend
        fig.add_trace(
            go.Scatter(x=df['month'], y=df['quantity'],
                      mode='lines+markers', name='Quantity',
                      line=dict(color='blue', width=2)),
            row=1, col=1
        )
        
        # Revenue growth
        fig.add_trace(
            go.Bar(x=df['month'], y=df['revenue_growth'],
                   name='Revenue Growth %',
                   marker_color=['green' if x > 0 else 'red' for x in df['revenue_growth']]),
            row=2, col=1
        )
        
        fig.update_layout(
            height=600,
            showlegend=True,
            hovermode='x unified'
        )
        
        return fig.to_json()
    
    @staticmethod
    def create_product_performance_scatter(product_stats):
        """Create scatter plot of product performance"""
        df = pd.DataFrame(product_stats)
        
        fig = px.scatter(
            df,
            x='total_quantity',
            y='total_revenue',
            size='avg_price',
            color='estimated_profit',
            hover_data=['productName', 'productSku'],
            title="Product Performance Matrix",
            labels={
                'total_quantity': 'Total Quantity Sold',
                'total_revenue': 'Total Revenue',
                'avg_price': 'Average Price',
                'estimated_profit': 'Estimated Profit'
            }
        )
        
        fig.update_layout(
            height=500,
            hovermode='closest'
        )
        
        return fig.to_json()
    
    @staticmethod
    def create_anomaly_detection_chart(anomaly_features):
        """Create 3D scatter plot for anomaly detection"""
        df = pd.DataFrame(anomaly_features)
        
        fig = px.scatter_3d(
            df,
            x='qty_mean',
            y='qty_std',
            z='transaction_count',
            color='is_anomaly',
            symbol='is_anomaly',
            hover_data=['productId', 'total_value'],
            title="Anomaly Detection in Transactions",
            labels={
                'qty_mean': 'Average Quantity',
                'qty_std': 'Quantity Std Dev',
                'transaction_count': 'Transaction Count',
                'is_anomaly': 'Is Anomaly'
            }
        )
        
        fig.update_layout(
            height=600,
            scene=dict(
                xaxis_title="Avg Quantity",
                yaxis_title="Quantity Std Dev",
                zaxis_title="Transaction Count"
            )
        )
        
        return fig.to_json()
    
    @staticmethod
    def create_reorder_point_chart(reorder_data):
        """Create reorder point visualization"""
        df = pd.DataFrame(reorder_data)
        
        fig = go.Figure()
        
        # Add bars for average daily demand
        fig.add_trace(go.Bar(
            x=df['productId'].astype(str)[:10],  # Show top 10
            y=df['avg_daily_demand'][:10],
            name='Avg Daily Demand',
            marker_color='lightblue'
        ))
        
        # Add line for reorder points
        fig.add_trace(go.Scatter(
            x=df['productId'].astype(str)[:10],
            y=df['reorder_point'][:10],
            name='Reorder Point',
            line=dict(color='red', width=2)
        ))
        
        # Add line for safety stock
        fig.add_trace(go.Scatter(
            x=df['productId'].astype(str)[:10],
            y=df['safety_stock'][:10],
            name='Safety Stock',
            line=dict(color='orange', width=2, dash='dash')
        ))
        
        fig.update_layout(
            title="Reorder Point Analysis (Top 10 Products)",
            xaxis_title="Products",
            yaxis_title="Units",
            barmode='group',
            height=500
        )
        
        return fig.to_json()

# Example usage
if __name__ == "__main__":
    visualizer = InventoryVisualizer()
    # Load data and generate visualizations
    # charts = visualizer.create_abc_chart(data)