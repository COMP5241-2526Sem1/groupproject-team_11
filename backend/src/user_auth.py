from flask import Blueprint, request, jsonify
import jwt
import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from src.db_connection import get_connection, release_connection

# Create a Blueprint for user authentication
user_auth = Blueprint('user_auth', __name__)

SECRET_KEY = "e"  # Replace with a secure key

@user_auth.route('/api/register', methods=['POST'])
def register():
    """Endpoint for user registration."""
    data = request.get_json()
    required_fields = ['uid', 'user_name', 'password', 'email', 'role']

    # Validate input
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields."}), 400

    uid = data['uid']
    user_name = data['user_name']
    password = data['password']
    email = data['email']
    role = data['role']

    # Hash the password
    hashed_password = generate_password_hash(password)

    connection = None
    cursor = None

    try:
        # Insert user into the database
        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO users (uid, user_name, password, email, role)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (uid, user_name, hashed_password, email, role)
        )
        connection.commit()
        return jsonify({"message": "User registered successfully."}), 201

    except Exception as e:
        if connection:
            connection.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            release_connection(connection)

@user_auth.route('/api/login', methods=['POST'])
def login():
    """Endpoint for user login."""
    data = request.get_json()
    required_fields = ['uid', 'password']

    # Validate input
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields."}), 400

    uid = data['uid']
    password = data['password']

    connection = None
    cursor = None

    try:
        # Fetch user from the database
        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute(
            """
            SELECT user_name, password, email, role
            FROM users
            WHERE uid = %s
            """,
            (uid,)
        )
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "Invalid UID or password."}), 401

        user_name, hashed_password, email, role = user

        # Check the password
        if not check_password_hash(hashed_password, password):
            return jsonify({"error": "Invalid UID or password."}), 401

        # Generate a JWT token
        token = jwt.encode(
            {
                "uid": uid,
                "user_name": user_name,
                "role": role,
                "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=5)
            },
            SECRET_KEY,
            algorithm="HS256"
        )

        return jsonify({
            "token": token,
            "user": {
                "uid": uid,
                "user_name": user_name,
                "email": email,
                "role": role
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            release_connection(connection)

# Function to generate a token for testing
def generate_test_token():
    """Generate a JWT token for a test user."""
    test_user = {
        "uid": "25040758G",
        "user_name": "Test User",
        "role": "teacher",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=100000)
    }
    token = jwt.encode(test_user, SECRET_KEY, algorithm="HS256")
    return token

# Example usage
if __name__ == "__main__":
    print("Generated Test Token:", generate_test_token())