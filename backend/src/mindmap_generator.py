from flask import Flask, request, jsonify
from src.LLM import ai_assistant
from flask_caching import Cache
from src.db_connection import get_connection, release_connection
import uuid
from datetime import datetime


app = Flask(__name__)

# Configure caching
#cache = Cache(app, config={
#    'CACHE_TYPE': 'RedisCache',
#    'CACHE_REDIS_URL': 'redis://49.232.227.144:6379/0',
#    'CACHE_DEFAULT_TIMEOUT': 1800  # Default timeout: 30 minutes
#})

@app.route('/api/generate_mindmap', methods=['POST'])
def generate_mindmap():
    """Endpoint to generate a Markdown mindmap based on user-provided JSON."""
    data = request.get_json()
    if not data or 'content' not in data:
        return jsonify({"error": "Invalid input. Please provide 'content' in JSON body."}), 400

    content = data['content']
    uid = data.get('uid')
    
    if not uid:
        return jsonify({"error": "Missing required field: uid"}), 400

    prompt = (
        f"请为我生成一份 Markdown 格式的思维导图，内容是关于{content}，结构如下：\n"
        "一级标题：\n"
        "二级标题：\n"
        "三级标题，以此类推，表示具体的json相关的内容，详细生成，每一级标题的数量而没有限制，严格按照收到的数据生成。\n"
        "请使用标准的 Markdown 语法：一级标题用 #，二级用 ##，三级用 ###，以此类推。内容全部使用英文。"
    )

    try:
        # Call the AI assistant to generate the mindmap
        mindmap = ai_assistant(prompt)
        
        # Generate a unique mind_map_id
        mind_map_id = str(uuid.uuid4())
        
        # Store the result in database
        connection = get_connection()
        if connection:
            try:
                with connection.cursor() as cursor:
                    # Insert into mind_map_result table
                    query1 = """
                    INSERT INTO mind_map_result (mind_map_id, markdown_content, created_time)
                    VALUES (%s, %s, %s)
                    """
                    cursor.execute(query1, (mind_map_id, mindmap, datetime.now()))
                    
                    # Update user_logs table
                    query2 = """
                    INSERT INTO user_logs (uid, manipulate, mind_map_id, upload_time)
                    VALUES (%s, %s, %s, %s)
                    """
                    cursor.execute(query2, (uid, 'generate_mindmap', mind_map_id, datetime.now()))
                    
                    connection.commit()
            finally:
                release_connection(connection)
        
        return jsonify({
            "mind_map_id": mind_map_id,
            "mindmap": mindmap
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mindmap/<mind_map_id>', methods=['GET'])

def get_mindmap(mind_map_id):
    """Endpoint to retrieve a specific mindmap by its ID."""
    try:
        connection = get_connection()
        if not connection:
            return jsonify({"error": "Database connection failed."}), 500
        
        with connection.cursor() as cursor:
            query = """
            SELECT markdown_content, created_time
            FROM mind_map_result
            WHERE mind_map_id = %s
            """
            cursor.execute(query, (mind_map_id,))
            result = cursor.fetchone()
            
            if not result:
                return jsonify({"error": "Mindmap not found."}), 404
            
            return jsonify({
                "mind_map_id": mind_map_id,
                "markdown_content": result[0],
                "created_time": result[1].strftime('%Y-%m-%d %H:%M:%S') if result[1] else None
            }), 200
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

if __name__ == '__main__':
    app.run("0.0.0.0", debug=True)