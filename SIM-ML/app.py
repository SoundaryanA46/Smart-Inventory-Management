from flask import Flask, request, jsonify
from functools import wraps
import jwt
import os

app = Flask(__name__)
SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        try:
            jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        except:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated

@app.route('/api/predict', methods=['POST'])
@token_required
def predict():
    """Inventory prediction endpoint"""
    try:
        data = request.get_json()
        # Your prediction logic here
        predictions = {"prediction": "data"}
        return jsonify(predictions), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/train', methods=['POST'])
def train():
    """Model training endpoint"""
    try:
        data = request.get_json()
        # Your training logic here
        return jsonify({"message": "Training started"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)