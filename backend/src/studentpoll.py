import os
import random
import string
from flask import Flask, request, jsonify, url_for
from src.db_connection import release_connection, get_connection
from src.generate_qr_code import generate_qr_code
import json
from flask_caching import Cache
import datetime
from src.auth_decorator import login_required
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

#cache = Cache(app, config={
#    'CACHE_TYPE': 'RedisCache',
#    'CACHE_REDIS_URL': 'redis://49.232.227.144:6379/0',
#    'CACHE_DEFAULT_TIMEOUT': 3600  # Default timeout: 1 hour
#})
def generate_poll_id():
    """Generate a unique poll ID."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=10))

@app.route('/api/polls/create', methods=['POST'])
##@login_required
def create_student_poll():
    """Endpoint to create a student poll and return its details."""
    #user_id = request.user_id  # 从装饰器中获取     
    data = request.get_json()
    if not data or not all(key in data for key in ['title', 'questions', 'openTime', 'closeTime', 'allowAnonymous', 'createdBy', 'createdAt']):
        return jsonify({"error": "Invalid input. Please provide all required fields."}), 400

    title = data['title']
    description = data.get('description', '')
    questions = data['questions']
    open_time = datetime.datetime.fromtimestamp(data['openTime'] / 1000)
    close_time = datetime.datetime.fromtimestamp(data['closeTime'] / 1000)
    allow_anonymous = data['allowAnonymous']
    created_by = data['createdBy']
    created_at = datetime.datetime.fromtimestamp(data['createdAt'] / 1000)
    poll_id = generate_poll_id()

    try:
        connection = get_connection()
        if connection:
            with connection.cursor() as cursor:
                # Insert poll details
                query = """
                INSERT INTO student_poll (poll_id, title, description, open_time, close_time, allow_anonymous, uid, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(query, (poll_id, title, description, open_time, close_time, allow_anonymous, created_by, created_at))

                # Insert questions
                question_query = """
                INSERT INTO poll_questions (poll_id, question_id, question_text, question_type, is_required, options)
                VALUES (%s, %s, %s, %s, %s, %s)
                """
                for question in questions:
                    question_id = question['id']
                    question_text = question['question']
                    question_type = question['type']
                    is_required = question['required']
                    options = json.dumps(question['options']) if 'options' in question else None
                    cursor.execute(question_query, (poll_id, question_id, question_text, question_type, is_required, options))

                connection.commit()

        return jsonify({
            "success": True,
            "poll": {
                "id": poll_id,
                "title": title,
                "description": description,
                "questions": questions,
                "openTime": int(open_time.timestamp() * 1000),
                "closeTime": int(close_time.timestamp() * 1000),
                "allowAnonymous": allow_anonymous,
                "status": "open",
                "createdBy": created_by,
                "createdAt": int(created_at.timestamp() * 1000)
            }
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if connection:
            release_connection(connection)

@app.route('/api/studentpoll/<poll_id>', methods=['GET'])
#@login_required
def view_student_poll(poll_id):
    """Endpoint to view student poll details."""
    #user_id = request.user_id  # 从装饰器中获取     
    try:
        # Retrieve the poll details from the database using the poll_id
        connection = get_connection()
        if connection:
            with connection.cursor() as cursor:
                # Fetch poll details
                query = "SELECT poll_id, title, description, open_time, close_time, allow_anonymous, uid, created_at FROM student_poll WHERE poll_id = %s"
                cursor.execute(query, (poll_id,))
                result = cursor.fetchone()
                
                if not result:
                    return jsonify({"error": "Poll not found."}), 404
                
                poll_id, title, description, open_time, close_time, allow_anonymous, created_by, created_at = result

                # Fetch questions for the poll
                cursor.execute(
                    """
                    SELECT question_id, question_text, question_type, is_required, options
                    FROM poll_questions
                    WHERE poll_id = %s
                    """,
                    (poll_id,)
                )
                questions = cursor.fetchall()

                formatted_questions = []
                for question in questions:
                    question_id, question_text, question_type, is_required, options = question
                    formatted_questions.append({
                        "id": question_id,
                        "question": question_text,
                        "type": question_type,
                        "options": json.loads(options) if options else [],
                        "required": is_required
                    })

                # Fetch responses for the poll
                cursor.execute(
                    """
                    SELECT uid
                    FROM poll_answer
                    WHERE poll_id = %s
                    """,
                    (poll_id,)
                )
                respondents = cursor.fetchall()

                formatted_responses = []
                for respondent in respondents:
                    user_id = respondent[0]
                    
                    # Fetch all answers for this respondent
                    cursor.execute(
                        """
                        SELECT question_id, answer, question_type, created_at
                        FROM poll_answer
                        WHERE poll_id = %s 
                        ORDER BY created_at
                        """,
                        (poll_id)
                    )
                    answers_data = cursor.fetchall()
                    
                    if answers_data:
                        formatted_answers = []
                        submitted_at = None
                        
                        for answer_row in answers_data:
                            question_id, answer, question_type, created_at = answer_row
                            
                            # Parse answer based on question type
                            if question_type == 'multiple':
                                try:
                                    parsed_answer = json.loads(answer) if isinstance(answer, str) else answer
                                except:
                                    parsed_answer = [answer]
                            else:
                                parsed_answer = answer
                            
                            formatted_answers.append({
                                "questionId": question_id,
                                "answer": parsed_answer
                            })
                            
                            # Use the latest timestamp as submitted_at
                            if submitted_at is None or (created_at and created_at > submitted_at):
                                submitted_at = created_at
                        
                        formatted_responses.append({
                            "id": f"{poll_id}_{user_id}",
                            "respondentId": user_id,
                            "respondentName": user_id,  # Use user_id as name if not available
                            "answers": formatted_answers,
                            "submittedAt": int(submitted_at.timestamp() * 1000) if submitted_at else int(datetime.datetime.now().timestamp() * 1000),
                            "isAnonymous": allow_anonymous
                        })

                # Determine status
                now = datetime.datetime.now()
                if close_time and close_time < now:
                    status = "closed"
                elif open_time and open_time > now:
                    status = "draft"
                else:
                    status = "open"

                # Return complete poll object
                return jsonify({
                    "success": True,
                    "poll": {
                        "id": poll_id,
                        "title": title,
                        "description": description,
                        "status": status,
                        "createdBy": created_by,
                        "createdAt": int(created_at.timestamp() * 1000) if created_at else None,
                        "openTime": int(open_time.timestamp() * 1000) if open_time else None,
                        "closeTime": int(close_time.timestamp() * 1000) if close_time else None,
                        "allowAnonymous": allow_anonymous,
                        "shareLink": f"/api/studentpoll/{poll_id}",
                        "questions": formatted_questions,
                        "responses": formatted_responses,
                        "responseCount": len(formatted_responses)
                    }
                }), 200
                
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

@app.route('/api/studentpoll/<poll_id>', methods=['POST'])
#@login_required
def submit_poll_answers(poll_id):
    """Endpoint for users to submit answers for a specific poll."""
    data = request.get_json()
    if not data or not all(key in data for key in ['user_id', 'answers']):
        return jsonify({"error": "Invalid input. Please provide 'user_id' and 'answers' in JSON body."}), 400

    user_id = data['user_id']
    answers = data['answers']  # List of answers
    poll_id = data['poll_id']
    try:
        # Insert each answer into the database
        connection = get_connection()
        if connection:
            with connection.cursor() as cursor:
                query = "INSERT INTO poll_answer (poll_id, question_id, answer, question_type) VALUES (%s, %s, %s, %s)"
                for answer in answers:
                    question_id = answer.get('question_id')
                    user_answer = answer.get('answer')
                    question_type = answer.get('question_type')

                    if not all([poll_id, question_id, user_answer]):
                        return jsonify({"error": "Each answer must include 'poll_id', 'question_id', and 'answer'."}), 400

                    cursor.execute(query, (poll_id, question_id, user_answer, question_type))
                connection.commit()

        #cache.delete(f"/api/studentpoll/{poll_id}/results")
        #cache.delete(f"/api/studentpoll/{poll_id}/text_results")

        return jsonify({"message": "Answers submitted successfully."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/polls/<poll_id>/responses', methods=['POST','OPTIONS'])
#@login_required
def submit_poll_response(poll_id):
    """Endpoint to submit a poll response."""
    if request.method == 'OPTIONS':
        return '', 200
    data = request.get_json()
    
    # 验证必需字段
    if not data or not all(key in data for key in ['respondentId', 'respondentName', 'answers', 'submittedAt', 'isAnonymous']):
        return jsonify({
            "success": False,
            "message": "Invalid input. Please provide all required fields: respondentId, respondentName, answers, submittedAt, isAnonymous."
        }), 400

    respondent_id = data['respondentId']
    respondent_name = data['respondentName']
    answers = data['answers']
    submitted_at = datetime.datetime.fromtimestamp(data['submittedAt'] / 1000)
    is_anonymous = data['isAnonymous']

    # 验证 answers 数组
    if not isinstance(answers, list) or len(answers) == 0:
        return jsonify({
            "success": False,
            "message": "Answers must be a non-empty array."
        }), 400

    try:
        connection = get_connection()
        if not connection:
            return jsonify({
                "success": False,
                "message": "Database connection failed."
            }), 500

        with connection.cursor() as cursor:
            # 检查 poll 是否存在
            cursor.execute("SELECT poll_id FROM student_poll WHERE poll_id = %s", (poll_id,))
            poll_result = cursor.fetchone()
            
            if not poll_result:
                return jsonify({
                    "success": False,
                    "message": f"Poll with ID {poll_id} not found."
                }), 404

            # 生成唯一的 response_id
            response_id = f"{poll_id}_{respondent_id}_{int(submitted_at.timestamp())}"

            # 插入每个答案到数据库
            insert_query = """
            INSERT INTO poll_answer (poll_id, question_id, answer, question_type, created_at)
            VALUES (%s, %s, %s, %s, %s)
            """
            
            for answer_item in answers:
                if not isinstance(answer_item, dict) or 'questionId' not in answer_item or 'answer' not in answer_item:
                    return jsonify({
                        "success": False,
                        "message": "Each answer must contain 'questionId' and 'answer'."
                    }), 400

                question_id = answer_item['questionId']
                
                answer_value = answer_item['answer']

                # 获取问题类型
                cursor.execute(
                    "SELECT question_type FROM poll_questions WHERE poll_id = %s AND question_id = %s",
                    (poll_id, question_id)
                )
                question_result = cursor.fetchone()
                
                if not question_result:
                    return jsonify({
                        "success": False,
                        "message": f"Question with ID {question_id} not found in poll {poll_id}."
                    }), 404
                
                question_type = question_result[0]

                # 根据答案类型进行处理
                # 如果答案是数字(选项索引)、数组(多选索引)或字符串，都转换为字符串存储
                if isinstance(answer_value, list):
                    # 多选题: 数组转 JSON 字符串
                    answer_str = json.dumps(answer_value)
                elif isinstance(answer_value, (int, float)):
                    # 单选题: 数字索引转字符串
                    answer_str = str(answer_value)
                elif isinstance(answer_value, dict):
                    # 复杂对象转 JSON 字符串
                    answer_str = json.dumps(answer_value)
                else:
                    # 文本题: 直接使用字符串
                    answer_str = str(answer_value)
                

# 按 '_' 分割，得到列表：['q', '1']
                parts = question_id.split('_')

# parts[1] 是字符串 '1'，然后转为整数
                if len(parts) == 2:
                    try:
                        question_num = int(parts[1])  # 得到整数 1
                    except ValueError:
                        pass
                # 插入答案
                cursor.execute(
                    insert_query,
                    (poll_id, question_num, answer_str, question_type, submitted_at)
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

@app.route('/api/studentpoll/<poll_id>', methods=['DELETE'])
#@login_required
def delete_student_poll(poll_id):
    """Endpoint to delete a student poll by its ID."""
    try:
        # Get uid from query parameters
        uid = request.args.get('uid')
        
        if not uid:
            return jsonify({"error": "Missing required parameter: uid"}), 400
        
        connection = get_connection()
        if not connection:
            return jsonify({"error": "Database connection failed."}), 500
        
        with connection.cursor() as cursor:
            # Check if poll exists
            cursor.execute("SELECT poll_id FROM student_polls WHERE poll_id = %s", (poll_id,))
            result = cursor.fetchone()
            
            if not result:
                return jsonify({"error": "Poll not found."}), 404
            
            # Delete the poll from student_polls table
            cursor.execute("DELETE FROM student_polls WHERE poll_id = %s", (poll_id,))
            
            # Log the deletion in user_logs
            from datetime import datetime
            query = """
            INSERT INTO user_logs (uid, manipulate, poll_id, upload_time)
            VALUES (%s, %s, %s, %s)
            """
            cursor.execute(query, (uid, 'delete_poll', poll_id, datetime.now()))
            
            connection.commit()
        
        return jsonify({"message": "Poll deleted successfully.", "poll_id": poll_id}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

@app.route('/api/polls', methods=['GET'])
#@login_required
def get_polls():
    """Endpoint to retrieve all polls with their details."""
    #user_id = request.user_id  # 从装饰器中获取     
    try:
        connection = get_connection()
        if not connection:
            return jsonify({"error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # Query to fetch all polls
            query = """
            SELECT p.poll_id, p.title, p.description, p.open_time, p.close_time, p.allow_anonymous, 
                   p.uid, p.created_at
            FROM student_poll p
            """
            cursor.execute(query)
            polls = cursor.fetchall()

            # Format the response
            result = []
            for poll in polls:
                poll_id, title, description, open_time, close_time, allow_anonymous, created_by, created_at = poll

                # Fetch questions for the poll
                cursor.execute(
                    """
                    SELECT question_id, question_text, question_type, is_required, options
                    FROM poll_questions
                    WHERE poll_id = %s
                    """,
                    (poll_id,)
                )
                questions = cursor.fetchall()

                formatted_questions = []
                for question in questions:
                    question_id, question_text, question_type, is_required, options = question
                    formatted_questions.append({
                        "id": question_id,
                        "question": question_text,
                        "type": question_type,
                        "options": json.loads(options) if options else [],
                        "required": is_required
                    })

                # Fetch responses for the poll
                cursor.execute(
                    """
                    SELECT uid, poll_id,question_id, answer,answer_time, question_type, created_at
                    FROM poll_answer
                    WHERE poll_id = %s
                    """,
                    (poll_id,)
                )
                respondents = cursor.fetchall()

                formatted_responses = []
                for respondent in respondents:
                    user_id = respondent[0]
                    poll_id = respondent[1]
                    question_id = respondent[2]
                    answer = respondent[3]
                    question_type = respondent[5]
                    created_at = respondent[6]
                    # Fetch all answers for this respondent
                    cursor.execute(
                        """
                        SELECT question_id, answer, question_type, created_at
                        FROM poll_answer
                        WHERE poll_id = %s 
                        ORDER BY created_at
                        """,
                        (poll_id)
                    )
                    answers_data = cursor.fetchall()
                    
                    if answers_data:
                        formatted_answers = []
                        submitted_at = None
                        
                        for answer_row in answers_data:
                            question_id, answer, question_type, created_at = answer_row
                            
                            # Parse answer based on question type
                            if question_type == 'multiple':
                                try:
                                    parsed_answer = json.loads(answer) if isinstance(answer, str) else answer
                                except:
                                    parsed_answer = [answer]
                            else:
                                parsed_answer = answer
                            
                            formatted_answers.append({
                                "questionId": question_id,
                                "answer": parsed_answer
                            })
                            
                            # Use the latest timestamp as submitted_at
                            if submitted_at is None or (created_at and created_at > submitted_at):
                                submitted_at = created_at
                        
                        formatted_responses.append({
                            "id": f"{poll_id}_{user_id}",
                            "respondentId": user_id,
                            "respondentName": user_id,  # Use user_id as name if not available
                            "answers": formatted_answers,
                            "submittedAt": int(submitted_at.timestamp() * 1000) if submitted_at else int(datetime.datetime.now().timestamp() * 1000),
                            "isAnonymous": allow_anonymous
                        })

                # Determine status
                now = datetime.datetime.now()
                if close_time and close_time < now:
                    status = "closed"
                elif open_time and open_time > now:
                    status = "draft"
                else:
                    status = "open"

                result.append({
                    "id": poll_id,
                    "title": title,
                    "description": description,
                    "status": status,
                    "createdBy": created_by,
                    "createdAt": int(created_at.timestamp() * 1000) if created_at else None,
                    "openTime": int(open_time.timestamp() * 1000) if open_time else None,
                    "closeTime": int(close_time.timestamp() * 1000) if close_time else None,
                    "allowAnonymous": allow_anonymous,
                    "shareLink": f"/api/studentpoll/{poll_id}",
                    "questions": formatted_questions,
                    "responses": formatted_responses,
                    "responseCount": len(formatted_responses)
                })

        return jsonify({"success": True, "polls": result}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if connection:
            release_connection(connection)

@app.route('/api/polls/update/<poll_id>', methods=['PUT'])
#@login_required
def update_student_poll(poll_id):
    """Endpoint to update a student poll."""
    data = request.get_json()
    if not data or not all(key in data for key in ['title', 'questions', 'openTime', 'closeTime', 'allowAnonymous', 'createdBy', 'createdAt']):
        return jsonify({"error": "Invalid input. Please provide all required fields."}), 400

    title = data['title']
    description = data.get('description', '')
    questions = data['questions']
    open_time = datetime.datetime.fromtimestamp(data['openTime'] / 1000)
    close_time = datetime.datetime.fromtimestamp(data['closeTime'] / 1000)
    allow_anonymous = data['allowAnonymous']
    created_by = data['createdBy']
    created_at = datetime.datetime.fromtimestamp(data['createdAt'] / 1000)

    try:
        connection = get_connection()
        if connection:
            with connection.cursor() as cursor:
                # Update poll details
                update_query = """
                UPDATE student_poll
                SET title = %s, description = %s, open_time = %s, close_time = %s, allow_anonymous = %s, uid = %s, created_at = %s
                WHERE poll_id = %s
                """
                cursor.execute(update_query, (title, description, open_time, close_time, allow_anonymous, created_by, created_at, poll_id))

                # Delete existing questions
                delete_questions_query = "DELETE FROM poll_questions WHERE poll_id = %s"
                cursor.execute(delete_questions_query, (poll_id,))

                # Insert updated questions
                insert_questions_query = """
                INSERT INTO poll_questions (poll_id, question_id, question_text, question_type, is_required, options)
                VALUES (%s, %s, %s, %s, %s, %s)
                """
                for question in questions:
                    question_id = question['id']
                    question_text = question['question']
                    question_type = question['type']
                    is_required = question['required']
                    options = json.dumps(question['options']) if 'options' in question else None
                    cursor.execute(insert_questions_query, (poll_id, question_id, question_text, question_type, is_required, options))

                connection.commit()

        return jsonify({
            "success": True,
            "poll": {
                "id": poll_id,
                "title": title,
                "description": description,
                "questions": questions,
                "openTime": int(open_time.timestamp() * 1000),
                "closeTime": int(close_time.timestamp() * 1000),
                "allowAnonymous": allow_anonymous,
                "status": "open",
                "createdBy": created_by,
                "createdAt": int(created_at.timestamp() * 1000)
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if connection:
            release_connection(connection)

@app.route('/api/polls/delete/<poll_id>', methods=['DELETE'])
#@login_required
def delete_poll(poll_id):
    """Endpoint to delete a poll and its related data from all tables."""
    try:
        connection = get_connection()
        if not connection:
            return jsonify({"error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # Delete from poll_answer
            delete_answers_query = "DELETE FROM poll_answer WHERE poll_id = %s"
            cursor.execute(delete_answers_query, (poll_id,))

            # Delete from poll_questions
            delete_questions_query = "DELETE FROM poll_questions WHERE poll_id = %s"
            cursor.execute(delete_questions_query, (poll_id,))

            # Delete from student_poll
            delete_poll_query = "DELETE FROM student_poll WHERE poll_id = %s"
            cursor.execute(delete_poll_query, (poll_id,))

            connection.commit()

        return jsonify({"success": True, "message": "Poll and related data deleted successfully.", "poll_id": poll_id}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if connection:
            release_connection(connection)

if __name__ == '__main__':
    app.run("0.0.0.0", debug=True)