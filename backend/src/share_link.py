import os
import random
import string
import re
import json
from flask import Flask, request, jsonify, url_for
from src.db_connection import release_connection, get_connection
from src.generate_qr_code import generate_qr_code
from flask_caching import Cache

app = Flask(__name__)

# Configure caching
#cache = Cache(app, config={
#    'CACHE_TYPE': 'RedisCache',
#    'CACHE_REDIS_URL': 'redis://49.232.227.144:6379/0',
#    'CACHE_DEFAULT_TIMEOUT': 1800  # Default timeout: 30 minutes
#})

def generate_share_id():
    """Generate a unique share ID."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=8))

@app.route('/share', methods=['POST'])
def create_share_link():
    """Endpoint to create a shareable link and return a QR code."""
    try:

        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "Invalid input. Please provide 'text' in JSON body."}), 400

        text = data['text']
        uid = data.get('uid')
        
        if not uid:
            return jsonify({"error": "Missing required field: uid"}), 400
        
        # Generate a unique share ID
        share_id = generate_share_id()

        # Save the share_id to the database with empty content
        connection = get_connection()
        if connection:
            with connection.cursor() as cursor:
                query1 = "INSERT INTO openend_question (share_id, content) VALUES (%s, '')"
                cursor.execute(query1, (share_id,))
                query2 = "INSERT INTO openend_question_list (share_id, question) VALUES (%s, %s)"
                cursor.execute(query2, (share_id, text))
                
                # Update user_logs table
                from datetime import datetime
                query3 = """
                INSERT INTO user_logs (uid, manipulate, share_id, upload_time)
                VALUES (%s, %s, %s, %s)
                """
                cursor.execute(query3, (uid, 'create_share', share_id, datetime.now()))
                
                connection.commit()

        # Generate the shareable link
        share_url = url_for('view_shared_content', share_id=share_id, _external=True)

        # Generate a QR code for the link
        qr_code_path = os.path.join('static', f'{share_id}.png')
        generate_qr_code(share_url, qr_code_path)

        return jsonify({"share_id": share_id,"share_url": share_url,"qr_code": qr_code_path}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/share/<share_id>', methods=['GET'])
def view_shared_content(share_id):
    """Endpoint to view shared content."""
    try:
        # Retrieve the content from the database using the share_id
        connection = get_connection()
        if connection:
            with connection.cursor() as cursor:
                query = "SELECT content FROM openend_question WHERE share_id = %s AND content != ''"
                cursor.execute(query, (share_id,))
                results = cursor.fetchall()

                if results:
                    content_list = [row[0] for row in results]

        # 返回一个 JSON，包含 share_id 和所有 content 列表
                    return jsonify({
                    "share_id": share_id,
                    "contents": content_list  # 这是一个列表，包含所有非空 content
                    }), 200
                else:
                    return jsonify({"error": "Content not found."}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/share/show/<share_id>', methods=['GET'])
def view_shared_text(share_id):
    """Endpoint to view question associated with a share_id."""
    try:
        # Retrieve the question from the database using the share_id
        connection = get_connection()
        if connection:
            with connection.cursor() as cursor:
                query = "SELECT question FROM openend_question_list WHERE share_id = %s"
                cursor.execute(query, (share_id,))
                result = cursor.fetchone()

                if result:
                    return jsonify({"share_id": share_id, "question": result[0]}), 200
                else:
                    return jsonify({"error": "question not found."}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/share/<share_id>', methods=['POST'])
def insert_shared_content(share_id):
    """Endpoint to insert new shared content in the database."""
    data = request.get_json()
    if not data or 'content' not in data:
        return jsonify({"error": "Invalid input. Please provide 'content' in JSON body."}), 400

    content = data['content']

    try:
        # Insert the new content into the database for the given share_id
        connection = get_connection()
        if connection:
            with connection.cursor() as cursor:
                query = "INSERT INTO openend_question (share_id, content) VALUES (%s, %s)"
                cursor.execute(query, (share_id, content))
                connection.commit()

        return jsonify({"message": "Content inserted successfully."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/share/show/<share_id>/answers', methods=['GET'])
#@cache.cached(timeout=1800)
def get_shared_answers(share_id):
    """Endpoint to get all answers for a share_id and provide word frequency data."""
    try:
        # Retrieve all answers for the given share_id
        connection = get_connection()
        if connection:
            with connection.cursor() as cursor:
                query = "SELECT content FROM openend_question WHERE share_id = %s"
                cursor.execute(query, (share_id,))
                results = cursor.fetchall()

        if not results:
            return jsonify({"error": "No answers found for the given share_id."}), 404

        # Define a list of stop words to exclude
        stop_words = set(["the", "is", "in", "and", "to", "of", "a", "an", "it", "on", "for", "with", "as", "by", "at", "this", "that", "these", "those", "be", "are", "was", "were", "has", "have", "had", "do", "does", "did", "but", "or", "if", "then", "so", "because", "about", "from", "up", "down", "out", "over", "under", "again", "further", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "than", "too", "very"])

        # Process results for word frequency and individual answers
        word_frequency = {}
        answers = [row[0] for row in results]

        for answer in answers:
            # Count word frequencies, excluding stop words
            words = re.findall(r'\b\w+\b', answer.lower())
            for word in words:
                if word not in stop_words:
                    word_frequency[word] = word_frequency.get(word, 0) + 1

        return jsonify({
            "share_id": share_id,
            "word_frequency": word_frequency,
            "answers": answers
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/share/<share_id>', methods=['DELETE'])
def delete_shared_content(share_id):
    """Endpoint to delete shared content and associated questions."""
    try:
        # Get uid from query parameters
        uid = request.args.get('uid')
        
        if not uid:
            return jsonify({"error": "Missing required parameter: uid"}), 400
        
        # Delete content from the database for the given share_id
        connection = get_connection()
        if not connection:
            return jsonify({"error": "Database connection failed."}), 500
        
        with connection.cursor() as cursor:
            # Check if share exists
            cursor.execute("SELECT share_id FROM openend_question_list WHERE share_id = %s", (share_id,))
            result = cursor.fetchone()
            
            if not result:
                return jsonify({"error": "Share content not found."}), 404
            
            # Delete from openend_question_list
            query1 = "DELETE FROM openend_question_list WHERE share_id = %s"
            cursor.execute(query1, (share_id,))

            # Delete from openend_question
            query2 = "DELETE FROM openend_question WHERE share_id = %s"
            cursor.execute(query2, (share_id,))
            
            # Log the deletion in user_logs
            from datetime import datetime
            query3 = """
            INSERT INTO user_logs (uid, manipulate, share_id, upload_time)
            VALUES (%s, %s, %s, %s)
            """
            cursor.execute(query3, (uid, 'delete_share', share_id, datetime.now()))

            connection.commit()

        # Clear the cache for the deleted share_id
        #cache.delete(f'/share/show/{share_id}/answers')

        return jsonify({"message": f"Content with share_id {share_id} deleted successfully."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

@app.route('/api/open-questions/<share_id>', methods=['GET'])
def get_open_question(share_id):
    """Endpoint to retrieve a specific open-ended question by its ID."""
    try:
        connection = get_connection()
        if not connection:
            return jsonify({"success": False, "error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # Query the openend_question_list table for the specific question
            query = """
                SELECT share_id, title
                FROM openend_question_list
                WHERE share_id = %s
            """
            cursor.execute(query, (share_id,))
            question_result = cursor.fetchone()

            if not question_result:
                return jsonify({"success": False, "error": "Open-ended question not found."}), 404

            # Extract data from the question result
            share_id = question_result[0]
            title = question_result[1]

            # Query the openend_question table for slides
            slides_query = """
                SELECT subid, text
                FROM openend_question
                WHERE share_id = %s
            """
            cursor.execute(slides_query, (share_id,))
            slides_results = cursor.fetchall()

            slides = [
                {"id": slide[0], "text": slide[1]}
                for slide in slides_results
            ]

            # Format the response
            response = {
                "success": True,
                "activity": {
                    "id": share_id,
                    "title": title,
                    "type": "Open-ended Question",
                    "activityType": "open-question",
                    "slides": slides,
                    "thumbnail": slides[0]["text"] if slides else ""
                }
            }

            return jsonify(response), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

@app.route('/api/open-questions/create', methods=['POST'])
def create_open_question():
    """Endpoint to create a new open-ended question activity."""
    try:
        data = request.get_json()
        if not data or not all(key in data for key in ['title', 'slides']):
            return jsonify({"success": False, "error": "Invalid input. Please provide 'title' and 'slides' in JSON body."}), 400

        title = data['title']
        slides = data['slides']
        thumbnail = data.get('thumbnail', slides[0]['text'] if slides else "")

        # Generate a unique ID for the activity
        share_id = generate_share_id()

        connection = get_connection()
        if not connection:
            return jsonify({"success": False, "error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # Insert into openend_question_list table
            from datetime import datetime
            #created_at = int(datetime.now().timestamp() * 1000)
            now = datetime.now()
            query1 = """
                INSERT INTO openend_question_list (share_id, title, created_at)
                VALUES (%s, %s, %s)
            """
            #cursor.execute(query1, (share_id, title))
            
            cursor.execute(query1, (share_id, title, now))
            # Insert slides into openend_question table
            query2 = """
                INSERT INTO openend_question (share_id, subid, text)
                VALUES (%s, %s, %s)
            """
            for slide in slides:
                cursor.execute(query2, (share_id, slide['id'], slide['text']))
            connection.commit()

        # Prepare the response
        #from datetime import datetime
        #created_at = int(datetime.now().timestamp() * 1000)
        response = {
            "success": True,
            "activity": {
                "id": share_id,
                "title": title,
                "slides": slides,
                "createdAt": now
            },
            "message": "Activity created successfully!"
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

@app.route('/api/open-questions/update/<share_id>', methods=['PUT'])
def update_open_question(share_id):
    """Endpoint to update an existing open-ended question activity."""
    try:
        data = request.get_json()
        if not data or not all(key in data for key in ['title', 'slides']):
            return jsonify({"success": False, "error": "Invalid input. Please provide 'title' and 'slides' in JSON body."}), 400

        title = data['title']
        slides = data['slides']

        connection = get_connection()
        if not connection:
            return jsonify({"success": False, "error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # Update the title in openend_question_list table
            query1 = """
                UPDATE openend_question_list
                SET title = %s
                WHERE share_id = %s
            """
            cursor.execute(query1, (title, share_id))

            # Delete existing slides for the share_id
            query2 = """
                DELETE FROM openend_question
                WHERE share_id = %s
            """
            cursor.execute(query2, (share_id,))

            # Insert updated slides into openend_question table
            query3 = """
                INSERT INTO openend_question (share_id, subid, text)
                VALUES (%s, %s, %s)
            """
            for slide in slides:
                cursor.execute(query3, (share_id, slide['id'], slide['text']))

            connection.commit()

        # Prepare the response
        from datetime import datetime
        updated_at = int(datetime.now().timestamp() * 1000)
        response = {
            "success": True,
            "activity": {
                "id": share_id,
                "title": title,
                "slides": slides,
                "updatedAt": updated_at
            }
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

@app.route('/api/open-questions/<share_id>/responses', methods=['POST', 'OPTIONS'])
def submit_open_question_response(share_id):
    """Endpoint to submit a response for an open-ended question."""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        connection = get_connection()
        data = request.get_json()
        
        # 验证必需字段
        if not data or not all(key in data for key in ['studentName', 'answers', 'submittedAt']):
            return jsonify({
                "success": False,
                "message": "Invalid input. Please provide all required fields: respondentId, respondentName, answers, submittedAt, isAnonymous."
            }), 400

        
        respondent_name = data['studentName']
        answers = data['answers']
        submitted_at = data['submittedAt']

        # 验证 answers 数组
        if not isinstance(answers, list) or len(answers) == 0:
            return jsonify({
                "success": False,
                "message": "Answers must be a non-empty array."
            }), 400

        connection = get_connection()
        if not connection:
            return jsonify({
                "success": False,
                "message": "Database connection failed."
            }), 500

        with connection.cursor() as cursor:
            # 检查 share_id 是否存在
            cursor.execute("SELECT share_id FROM openend_question_list WHERE share_id = %s", (share_id,))
            question_result = cursor.fetchone()
            
            if not question_result:
                return jsonify({
                    "success": False,
                    "message": f"Open question with ID {share_id} not found."
                }), 404

            # 生成唯一的 response_id
            import datetime
            response_id = f"{share_id}_{respondent_name}_{int(datetime.datetime.now().timestamp())}"

            # 插入每个答案到数据库
            insert_query = """
            INSERT INTO openend_question_response (share_id, subid, text)
            VALUES (%s, %s, %s)
            """
            
            for answer_item in answers:
                if not isinstance(answer_item, dict) or 'slideId' not in answer_item or 'answer' not in answer_item:
                    return jsonify({
                        "success": False,
                        "message": "Each answer must contain 'slideId' and 'answer'."
                    }), 400

                slide_id = answer_item['slideId']
                answer_value = answer_item['answer']

                # 将答案转换为字符串存储
                if isinstance(answer_value, (list, dict)):
                    answer_str = json.dumps(answer_value)
                else:
                    answer_str = str(answer_value)

                # 转换时间戳为 datetime 对象
                submitted_datetime = datetime.datetime.fromtimestamp(submitted_at / 1000)

                # 插入答案
                cursor.execute(
                    insert_query,
                    (share_id, slide_id, answer_str)
                )

            connection.commit()

        return jsonify({
            "success": True,
            "message": "Response submitted successfully.",
            "responseId": response_id
        }), 201

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
    finally:
        if connection:
            release_connection(connection)

@app.route('/api/open-questions/<share_id>/share', methods=['POST'])
def share_open_question(share_id):
    """Endpoint to generate a shareable link for an open-ended question."""
    if request.method == 'OPTIONS':
        return '', 200
    try:
        data = request.get_json()
        if not data or 'title' not in data or 'slides' not in data:
            return jsonify({"success": False, "error": "Invalid input. Please provide 'title' and 'slides' in JSON body."}), 400

        title = data['title']
        slides = data['slides']

        # Generate a unique share ID
        unique_share_id = generate_share_id()

        # Save the share ID and content to the database
        connection = get_connection()
        if not connection:
            return jsonify({"success": False, "error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # Insert the share ID and content into the database
            #query = """
            #    INSERT INTO openend_question_shares (share_id, question_id, title, slides)
            #    VALUES (%s, %s, %s, %s)
            #"""
            #cursor.execute(query, (unique_share_id, share_id, title, json.dumps(slides)))
            
            # Insert the unique_share_id into openend_question_list table
            query_update = """
                UPDATE openend_question_list
                SET unique_id = %s
                WHERE share_id = %s
            """
            cursor.execute(query_update, (unique_share_id, share_id))

            connection.commit()

        # Generate the shareable link
        base_url = request.host_url.rstrip('/')
        share_link = f"{base_url}/response/{share_id}?shareId={unique_share_id}"

        response = {
            "success": True,
            "shareLink": share_link
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

@app.route('/api/open-questions', methods=['GET'])
def get_all_open_questions():
    """Endpoint to retrieve all open-ended questions."""
    try:
        connection = get_connection()
        if not connection:
            return jsonify({"success": False, "error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # Query to retrieve all open-ended questions
            query = """
                SELECT share_id, title, created_at
                FROM openend_question_list
            """
            cursor.execute(query)
            results = cursor.fetchall()

            # Format the results into the required structure
            activities = [
                {
                    "id": row[0],
                    "title": row[1],
                    "thumbnail": row[1],
                    "createdAt": int(row[2].timestamp() * 1000) if row[2] else None
                }
                for row in results
            ]

        return jsonify({"activities": activities}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

@app.route('/api/open-questions/<share_id>/results', methods=['GET'])
def get_open_question_results(share_id):
    """Endpoint to retrieve all responses for an open-ended question."""
    try:
        connection = get_connection()
        if not connection:
            return jsonify({"success": False, "error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # 检查 share_id 是否存在
            cursor.execute("SELECT share_id FROM openend_question_list WHERE share_id = %s", (share_id,))
            question_result = cursor.fetchone()
            
            if not question_result:
                return jsonify({"success": False, "error": f"Open question with ID {share_id} not found."}), 404

            # 查询所有响应，按 student_name 分组
            query = """
                SELECT share_id, subid, text
                FROM openend_question_response
                WHERE share_id = %s
                ORDER BY share_id, subid
            """
            cursor.execute(query, (share_id,))
            results = cursor.fetchall()

            if not results:
                return jsonify({"success": True, "responses": []}), 200

            # 按 student_name 组织数据
            responses_dict = {}
            for row in results:
                share_id, subid, text = row
                
                if share_id not in responses_dict:
                    responses_dict[share_id] = {
                        "shareId": share_id,
                        "answers": {},
                        "submittedAt": 1231233
                    }
                
                # 将 subid 作为 key，text 作为 value
                responses_dict[share_id]["answers"][str(subid)] = text
            # 转换为列表格式
            responses = list(responses_dict.values())

            return jsonify({
                "success": True,
                "responses": responses
            }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

@app.route('/api/open-questions/<share_id>', methods=['DELETE'])
def delete_open_question(share_id):
    """Endpoint to delete an open-ended question by its share_id."""
    try:
        connection = get_connection()
        if not connection:
            return jsonify({"success": False, "error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # Delete from openend_question_list table
            query1 = "DELETE FROM openend_question_list WHERE share_id = %s"
            cursor.execute(query1, (share_id,))

            # Delete from openend_question table
            query2 = "DELETE FROM openend_question WHERE share_id = %s"
            cursor.execute(query2, (share_id,))

            connection.commit()

        return jsonify({"success": True}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)


if __name__ == '__main__':
    app.run("0.0.0.0", debug=True)