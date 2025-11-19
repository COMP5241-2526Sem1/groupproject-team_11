from flask import Flask, request, jsonify
from JavaAuthClient import JavaAuthClient
app = Flask(__name__)

java_client = JavaAuthClient(base_url="http://43.163.233.241:8081")


@app.route('/test', methods=['GET'])
def test_connection():
    result = java_client.test_connection()
    return jsonify(result)

# ==================== Register ====================
@app.route('/register/step1', methods=['POST'])
def register_step1():
    data = request.get_json()
    result = java_client.register_step1_check_email(data['email'])
    return jsonify(result)


@app.route('/register/step2', methods=['POST'])
def register_step2():
    data = request.get_json()
    result = java_client.register_step2_captcha_verify(data['email'], data['captcha'])
    return jsonify(result)

@app.route('/register/step3', methods=['POST'])
def register_step3():
    data = request.get_json()
    result = java_client.register_step3_create_account(data['email'], data['password'])
    return jsonify(result)


# ==================== Login ====================
@app.route('/login/email', methods=['POST'])
def login_email():
    data = request.get_json()
    result = java_client.login_by_email(data['email'], data['password'])
    return jsonify(result)

@app.route('/login/username', methods=['POST'])
def login_username():
    data = request.get_json()
    result = java_client.login_by_username(data['username'], data['password'])
    return jsonify(result)

@app.route('/login/user', methods=['POST'])
def login_user():
    data = request.get_json()
    result = java_client.login_by_username_or_email(data['user'], data['password'])
    return jsonify(result)


# ==================== Reset Psw ====================
@app.route('/reset-password/step1', methods=['POST'])
def reset_password_step1():
    data = request.get_json()
    result = java_client.reset_password_step1_check_email(data['email'])
    return jsonify(result)


@app.route('/reset-password/step2', methods=['POST'])
def reset_password_step2():
    data = request.get_json()
    result = java_client.reset_password_step2_captcha_verify(data['email'], data['captcha'])
    return jsonify(result)

@app.route('/reset-password/step3', methods=['POST'])
def reset_password_step3():
    data = request.get_json()
    result = java_client.reset_password_step3_reset_password(data['email'], data['new_password'])
    return jsonify(result)

if __name__ == '__main__':
    app.run()
