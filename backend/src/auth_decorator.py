from functools import wraps
from flask import request, jsonify
import jwt

SECRET_KEY = "e"  # Replace with your actual secret key

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"error": "未提供 Token，请先登录"}), 401

        try:
            # Decode the JWT token
            decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            user_id = decoded_token.get("uid")
            user_name = decoded_token.get("user_name")
            role = decoded_token.get("role")

            if not user_id or not role:
                return jsonify({"error": "Token无效"}), 401

            # Attach user_id and role to the request for further use
            request.user_id = user_id
            request.role = role
            request.user_name = user_name

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token已过期，请重新登录"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token无效"}), 401

        return f(*args, **kwargs)

    return decorated_function