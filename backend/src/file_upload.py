from flask import Flask, request, jsonify, send_file
import os
from werkzeug.utils import secure_filename
from datetime import datetime
from src.db_connection import get_connection, release_connection

app = Flask(__name__)

# 上传文件夹配置
UPLOAD_FOLDER = './uploads'

# 如果文件夹不存在，就创建它
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# 允许上传的文件类型
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'xlsx', 'docx', 'ppt', 'pptx', 'doc'}

def allowed_file(filename):
    """检查文件类型是否允许"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def _save_file(file, manipulate):
    """内部方法：保存文件并记录到数据库"""
    # 1. 检查文件名是否为空
    if file.filename == '':
        return None, "No selected file"

    # 2. 检查文件类型是否允许
    if not allowed_file(file.filename):
        return None, "File type not allowed"

    # 3. 安全地获取文件名（防止恶意路径）
    filename = secure_filename(file.filename)

    # 4. 为避免文件名冲突，添加时间戳
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    name, ext = os.path.splitext(filename)
    unique_filename = f"{name}_{timestamp}{ext}"

    # 5. 拼接保存路径
    filepath = os.path.join(UPLOAD_FOLDER, unique_filename)

    try:
        # 6. 保存文件到服务器的 uploads 文件夹
        file.save(filepath)

        # 7. 更新 user_logs 表
        connection = get_connection()
        if connection:
            with connection.cursor() as cursor:
                query = """
                INSERT INTO user_logs (uid, manipulate, filename, filepath, upload_time)
                VALUES (%s, %s, %s, %s, %s)
                """
                cursor.execute(query, ("1", manipulate, unique_filename, filepath, datetime.now()))
                connection.commit()
                release_connection(connection)

        return {
            "message": "File uploaded successfully",
            "filename": unique_filename,
            "saved_path": filepath
        }, None

    except Exception as e:
        # 如果出错，删除已保存的文件
        if os.path.exists(filepath):
            os.remove(filepath)
        return None, str(e)

@app.route('/api/upload/content', methods=['POST'])
def upload_content():
    """上传课程内容文件"""
    # 1. 检查是否有文件部分
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']

    # 2. 获取用户ID
    #uid = request.form.get('uid')

    #if not uid:
        #return jsonify({"error": "Missing required field: uid"}), 400

    # 3. 保存文件
    result, error = _save_file(file, 'upload_content')
    if error:
        return jsonify({"error": error}), 400

    return jsonify(result), 200

@app.route('/api/upload/assignment', methods=['POST'])
def upload_assignment():
    """上传作业文件"""
    # 1. 检查是否有文件部分
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']

    # 2. 获取用户ID
    #uid = request.form.get('uid')

    #if not uid:
    #    return jsonify({"error": "Missing required field: uid"}), 400

    # 3. 保存文件
    result, error = _save_file(file, 'upload_assignment')

    if error:
        return jsonify({"error": error}), 400

    return jsonify(result), 200

@app.route('/api/upload/quiz', methods=['POST'])
def upload_quiz():
    """上传测试文件"""
    # 1. 检查是否有文件部分
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']

    # 2. 获取用户ID
    #uid = request.form.get('uid')

    #if not uid:
        #return jsonify({"error": "Missing required field: uid"}), 400

    # 3. 保存文件
    result, error = _save_file(file, 'upload_quiz')

    if error:
        return jsonify({"error": error}), 400

    return jsonify(result), 200

@app.route('/api/download/<filename>', methods=['GET'])
def download_file(filename):
    try:
        # 正确的方式：直接使用 uploads 目录
        #file_path = os.path.join(UPLOAD_FOLDER, filename)
        file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../uploads', filename))
        # 检查文件是否存在
        if not os.path.exists(file_path):
            return jsonify({"error": f"File not found: {filename}"}), 404
        
        # 返回文件，设置正确的文件名
        return send_file(
            file_path, 
            as_attachment=True,
            download_name=filename  # 或者从原始文件名提取
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/delete/<filename>', methods=['DELETE'])
def delete_file(filename):
    """文件删除接口"""
    connection = get_connection()
    try:
        # 1. 获取用户ID（用于日志记录）
        #uid = request.args.get('uid')
        
        #if not uid:
        #    return jsonify({"error": "Missing required parameter: uid"}), 400

        # 2. 构建文件路径
        file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../uploads', filename))

        # 3. 检查文件是否存在
        if not os.path.exists(file_path):
            return jsonify({"error": "File not found"}), 404

        # 4. 删除文件
        os.remove(file_path)

        # 5. 记录删除操作到 user_logs 表
        connection = get_connection()
        if connection:
            with connection.cursor() as cursor:
                query = """
                INSERT INTO user_logs (uid, manipulate, filename, filepath, upload_time)
                VALUES (%s, %s, %s, %s, %s)
                """
                cursor.execute(query, ("1", 'delete', filename, file_path, datetime.now()))
                connection.commit()

        # 6. 返回成功响应
        return jsonify({
            "message": "File deleted successfully",
            "filename": filename
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

@app.route('/api/files', methods=['GET'])
def list_files():
    """列出所有已上传的文件"""
    try:
        files = []
        for filename in os.listdir(UPLOAD_FOLDER):
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.isfile(file_path):
                file_info = {
                    "filename": filename,
                    "size": os.path.getsize(file_path),
                    "modified_time": datetime.fromtimestamp(os.path.getmtime(file_path)).strftime('%Y-%m-%d %H:%M:%S')
                }
                files.append(file_info)
        
        return jsonify({"files": files}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run("0.0.0.0", debug=True)
