import os
import random
import string
import json
from flask import Flask, request, jsonify, url_for
from flask_cors import CORS
from src.db_connection import get_connection,release_connection
from src.generate_qr_code import generate_qr_code

app = Flask(__name__)

# Enable CORS for the Flask app
CORS(app)

def generate_activity_id():
    """Generate a unique activity ID."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=10))

@app.route('/api/classroom_quiz', methods=['POST', 'OPTIONS'])
def create_activity():
    """Endpoint to create an activity and return its details."""

    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.get_json()
    if not data or not all(key in data for key in ['title', 'type', 'classroom_quizType']):
        return jsonify({"error": "Invalid input. Please provide 'title', 'type', and 'classroom_quizType' in JSON body."}), 400

    title = data['title']
    classroom_quiz_type = data['type']
    classroom_quiz_category = data['classroom_quizType']
    classroom_quiz_id = generate_activity_id()
    uid = data.get('uid', '1')  # Default to '1' if not provided

    questions_data = data.get('questions', [])  # List of questions with their details
    try:
        # Save the activity details to the database
        connection = get_connection()
        if connection:
            with connection.cursor() as cursor:
                query = "INSERT INTO class_quizzes (quiz_id, title, type, activity_type, uid) VALUES (%s, %s, %s, %s, %s)"
                query2 = "INSERT INTO questions (quiz_id, question_id, question_text, question_type, options, true_answer, points) VALUES (%s, %s, %s, %s, %s, %s, %s)"
                cursor.execute(query, (classroom_quiz_id, title, classroom_quiz_type, classroom_quiz_category, uid))


                for q in questions_data:
                    question_id = q.get('id')
                    question_text = q.get('text')
                    question_type = q.get('type')
                    options = q.get('options')  # 可能为 None（如简答题）
                    true_answer = q.get('correctAnswer')  # 新增字段
                    points = q.get('points', 0)  # 默认值为 0

                    # 如果 options 是列表，转为 JSON 字符串存入（或直接存 list，根据你的字段类型）
                    options_json = None
                    if options and isinstance(options, list):
                        options_json = json.dumps(options)  # 或者用 json.dumps(options) 更规范

                    # Validate and convert true_answer to JSON if necessary
                    true_answer_json = None
                    if true_answer is not None:
                        if isinstance(true_answer, (dict, list)):
                            true_answer_json = json.dumps(true_answer)
                        elif isinstance(true_answer, str):
                            try:
                                # Attempt to parse the string as JSON
                                json.loads(true_answer)
                                true_answer_json = true_answer
                            except json.JSONDecodeError:
                                # If parsing fails, treat it as a plain string
                                true_answer_json = json.dumps(true_answer)

                    cursor.execute(query2, (classroom_quiz_id, question_id, question_text, question_type, options_json, true_answer_json, points))
                
                # Update user_logs table
                from datetime import datetime
                query3 = """
                INSERT INTO user_logs (uid, manipulate, quiz_id, upload_time)
                VALUES (%s, %s, %s, %s)
                """
                cursor.execute(query3, (uid, 'create_activity', classroom_quiz_id, datetime.now()))
                
                connection.commit()

        # Generate the activity link
        activity_url = url_for('view_activity', activity_id=classroom_quiz_id, _external=True)

        # Generate a QR code for the activity link
        qr_code_path = os.path.join('static', f'{classroom_quiz_id}.png')
        generate_qr_code(activity_url, qr_code_path)

        return jsonify({"success": True, "activity_id": classroom_quiz_id, "activity_url": activity_url, "qr_code": qr_code_path}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/classroom_quiz/<classroom_quiz_id>', methods=['GET'])
def view_activity(classroom_quiz_id):
    """Endpoint to view activity details."""
    try:
        # Retrieve the activity details from the database using the activity_id
        connection = get_connection()
        if connection:
            with connection.cursor() as cursor:
                query = "SELECT title, type, activity_type FROM class_quizzes WHERE quiz_id = %s"
                cursor.execute(query, (classroom_quiz_id,))
                result = cursor.fetchone()
                if not result:
                    return jsonify({"error": "Activity not found."}), 404
                
                
                questions_query = """
                    SELECT question_id, question_text, question_type, options, true_answer, points
                    FROM questions
                    WHERE quiz_id = %s
                """
                cursor.execute(questions_query, (classroom_quiz_id,))
                questions_results = cursor.fetchall()  # 这是一个列表，每个元素是一个题目 dict

                questions_results = [
                    {
                        "id": question[0],
                        "text": question[1],
                        "type": question[2],
                        "options": json.loads(question[3]) if question[3] else [],
                        "correctAnswer": question[4],
                        "points": question[5]
                    }
                    for question in questions_results
                ]

                # 3. 整合返回数据
                response = {
                    "activity_id": classroom_quiz_id,
                    "title": result[0],
                    "type": result[1],
                    "classroom_quiztype": result[2],
                    "questions": questions_results  # 包含所有题目信息
                }

                return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/classroom_quiz/<classroom_quiz_id>', methods=['POST'])
def submit_answers(classroom_quiz_id):
    """Endpoint for users to submit answers for a specific activity."""
    data = request.get_json()
    if not data or not all(key in data for key in ['user_id', 'answers']):
        return jsonify({"error": "Invalid input. Please provide 'user_id' and 'answers' in JSON body."}), 400

    user_id = data['user_id']
    answers = data['answers']  # List of answers
    quiz_id = data['classroom_quiz_id']
    try:
        # Insert each answer into the database
        connection = get_connection()
        if connection:
            with connection.cursor() as cursor:
                query = "INSERT INTO answers (quiz_id, question_id, uid, answer_content,question_type) VALUES (%s, %s, %s, %s, %s)"
                for answer in answers:
                    
                    question_id = answer.get('question_id')
                    user_answer = answer.get('answer')
                    question_type = answer.get('question_type')

                    if not all([quiz_id, question_id, user_answer]):
                        return jsonify({"error": "Each answer must include 'quiz_id', 'question_id', and 'answer'."}), 400

                    cursor.execute(query, (quiz_id, question_id, user_id, user_answer, question_type))
                connection.commit()

        return jsonify({"message": "Answers submitted successfully."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

@app.route('/api/classroom_quiz/<classroom_quiz_id>', methods=['DELETE'])
def delete_activity(classroom_quiz_id):
    """Endpoint to delete an activity by its ID."""
    try:
        # Get uid from query parameters
        #uid = request.args.get('uid')
        
        #if not uid:
            #return jsonify({"error": "Missing required parameter: uid"}), 400
        
        connection = get_connection()
        if not connection:
            return jsonify({"error": "Database connection failed."}), 500
        
        with connection.cursor() as cursor:
            # Check if activity exists
            cursor.execute("SELECT quiz_id FROM class_quizzes WHERE quiz_id = %s", (classroom_quiz_id,))
            result = cursor.fetchone()
            
            if not result:
                return jsonify({"error": "Activity not found."}), 404
            
            # Delete the activity from class_quizzes table
            cursor.execute("DELETE FROM questions WHERE quiz_id = %s", (classroom_quiz_id,))
            cursor.execute("DELETE FROM class_quizzes WHERE quiz_id = %s", (classroom_quiz_id,))
            
            query1 = "DELETE FROM answers WHERE quiz_id = %s"
            cursor.execute(query1, (classroom_quiz_id,))

            # Delete from class_room_quiz_result table
            query2 = "DELETE FROM class_room_quiz_result WHERE quiz_id = %s"
            cursor.execute(query2, (classroom_quiz_id,))

            

            
            # Log the deletion in user_logs
            #from datetime import datetime
            #uid = request.args.get('uid', '1')  # Default to '1' if not provided
            #query = """
            #INSERT INTO user_logs (uid, manipulate, quiz_id, upload_time)
            #VALUES (%s, %s, %s, %s)
            #"""
            #cursor.execute(query, (uid, 'delete_activity', classroom_quiz_id, datetime.now()))
            
            connection.commit()
        
        return jsonify({"message": "Activity deleted successfully.", "classroom_quiz_id": classroom_quiz_id}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

@app.route('/api/classroom_quiz/<classroom_quiz_id>/grade', methods=['POST'])

def grade_activity(classroom_quiz_id):
    """Endpoint to grade user answers and store results."""
    from LLM import ai_assistant
    if request.method == 'OPTIONS':
        return '', 200
    try:
        connection = get_connection()
        if not connection:
            return jsonify({"error": "Database connection failed."}), 500
        
        with connection.cursor() as cursor:
            # Get all answers with their corresponding questions for this quiz
            cursor.execute("""
                SELECT a.student_name, a.question_id, a.answer_content, a.question_type, 
                       q.true_answer, q.points, q.question_text
                FROM answers a
                JOIN questions q ON a.quiz_id = q.quiz_id AND a.question_id = q.question_id
                WHERE a.quiz_id = %s
                ORDER BY a.student_name, a.question_id
            """, (classroom_quiz_id,))
            
            all_answers = cursor.fetchall()
            
            if not all_answers:
                return jsonify({"error": "No answers found for this quiz."}), 404
            
            # Group answers by user
            user_results = {}
            
            for answer_row in all_answers:
                uid = answer_row[0]
                question_id = answer_row[1]
                
                user_answer = answer_row[2]
                question_type = answer_row[3]
                true_answer = answer_row[4]
                points = answer_row[5]
                question_text = answer_row[6]
                
                # Initialize user if not exists
                if uid not in user_results:
                    user_results[uid] = 0
                
                # Check answer based on question type
                is_correct = False
                
                # Check answer based on question type
                normalized_question_type = question_type.lower()

                if normalized_question_type in ['true/false', 'multiplechoice', 'single choice', 'multiple choice']:
                    # Direct comparison for true/false and multiple choice
                    #true_answer_list = json.loads(true_answer)  # 例如：["0"]
                    print(f"[DEBUG] user_answer = {user_answer}, type = {type(user_answer)}")
                    print(f"[DEBUG] true_answer = {true_answer}, type = {type(true_answer)}")
        # 2. 判断用户答案（字符串）是否在正确答案列表中
                    #is_correct = str(user_answer).strip() in [str(x).strip() for x in true_answer_list]
                    is_correct = (str(user_answer).strip().lower() == str(true_answer).strip().lower().strip("[]"))
                    print (str(user_answer).strip().lower(), str(true_answer).strip().lower().strip("[]"))
                    print(f"[DEBUG] is_correct = {is_correct}")
                    if is_correct:
                        user_results[uid] += int(points)
                elif normalized_question_type in ['shortanswer', 'short answer', 'text']:
                    # Combine all short answer questions for AI evaluation
                    combined_prompt = ""
                    for answer_row in all_answers:
                        combined_prompt += f"题目是{answer_row[6]},学生作答{answer_row[2]}\n"
                    combined_prompt += "请判断每个学生的答案是否正确，并返回一个JSON数组，每个元素包含学生ID、问题ID和是否正确（true/false）。"

                    # Use AI to evaluate all answers at once
                    ai_response = ai_assistant(combined_prompt).strip()
                    try:
                        evaluation_results = json.loads(ai_response)  # Parse AI response
                        for result in evaluation_results:
                            student_id = result['student_id']
                            question_id = result['question_id']
                            is_correct = result['is_correct']

                            if is_correct:
                                user_results[student_id] += int(points)
                    except json.JSONDecodeError:
                        print("AI response parsing failed:", ai_response)
                
                if is_correct:
                    user_results[uid] += int(points)
            
            # Store results in class_room_result table
            results = []
            rank = 1

            # Sort user_results by total_points in descending order
            sorted_results = sorted(user_results.items(), key=lambda x: x[1], reverse=True)

            #for student_name, total_points in sorted_results:
            #    cursor.execute("""
            #        INSERT INTO class_room_quiz_result (student_name, quiz_id, true_number)
            #        VALUES (%s, %s, %s)
            #        ON DUPLICATE KEY UPDATE true_number = %s
            #    """, (student_name, classroom_quiz_id, total_points, total_points))
#
            #    results.append({
            #        "student_name": student_name,
            #        "score": total_points,
            #        "rank": rank
            #    })
            #    rank += 1

            # Calculate the percentage score for each student
            for student_name, total_points in sorted_results:
                # Fetch the total possible points for the quiz
                cursor.execute("SELECT SUM(points) FROM questions WHERE quiz_id = %s", (classroom_quiz_id,))
                max_points = cursor.fetchone()[0] or 0

                if max_points > 0:
                    percentage_score = f"{total_points}/{max_points} ({(total_points / max_points) * 100:.2f}%)"
                else:
                    percentage_score = "0/0 (0.00%)"

                # Store the result in the database
                cursor.execute(
                    """
                    INSERT INTO class_room_quiz_result (student_name, quiz_id, true_number, percentage_score)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE true_number = %s, percentage_score = %s
                    """,
                    (student_name, classroom_quiz_id, total_points, percentage_score, total_points, percentage_score)
                )

                results.append({
                    "student_name": student_name,
                    "score": total_points,
                    "percentage": percentage_score,
                    "rank": rank
                })
                rank += 1

            connection.commit()
            
            # Return leaderboard in the specified format
            return jsonify({"leaderboard": results}), 200
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)




@app.route('/api/all_activities', methods=['GET'])
def get_all_activities():
    """Endpoint to get all activities from multiple tables with pagination and search."""
    try:
        # Get query parameters
        uid = request.args.get('uid')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        activity_type = request.args.get('type', '')
        search_keyword = request.args.get('search', '')
        
        if not uid:
            return jsonify({"error": "Missing required parameter: uid"}), 400
        
        if page < 1:
            page = 1
        if limit < 1 or limit > 100:
            limit = 20
        
        offset = (page - 1) * limit
        
        connection = get_connection()
        if not connection:
            return jsonify({"error": "Database connection failed."}), 500
        
        all_activities = []
        
        with connection.cursor() as cursor:
            # Query class_quizzes table
            if not activity_type or activity_type == 'quiz':
                query = """
                    SELECT quiz_id as id, title, 'quiz' as activityType, created_at
                    FROM class_quizzes
                    WHERE uid = %s
                """
                params = [uid]
                
                if search_keyword:
                    query += " AND title LIKE %s"
                    params.append(f"%{search_keyword}%")
                
                cursor.execute(query, params)
                results = cursor.fetchall()
                for row in results:
                    all_activities.append({
                        "id": row[0],
                        "title": row[1],
                        "activityType": row[2],
                        "edited": int(row[3].timestamp() * 1000) if row[3] else None,
                        "questions": [],  # 默认空列表
                        "timerMinutes": 0,  # 默认值
                        "timerSeconds": 0  # 默认值
                    })
            
            # Query openend_question_list table
            if not activity_type or activity_type == 'openend':
                query = """
                    SELECT share_id as id, title, 'openend' as activityType, created_at
                    FROM openend_question_list
                    WHERE uid = %s
                """
                params = [uid]
                
                if search_keyword:
                    query += " AND title LIKE %s"
                    params.append(f"%{search_keyword}%")
                
                cursor.execute(query, params)
                results = cursor.fetchall()
                for row in results:
                    all_activities.append({
                        "id": row[0],
                        "title": row[1],
                        "activityType": row[2],
                        "edited": int(row[3].timestamp() * 1000) if row[3] else None,
                        "questions": [],  # 默认空列表
                        "timerMinutes": 0,  # 默认值
                        "timerSeconds": 0  # 默认值
                    })
            
            # Query other tables (poll, mindmap, scale) similarly...
        

            if not activity_type or activity_type == 'poll':
                query = """
                    SELECT poll_id as id, title, 'poll' as activityType, created_at
                    FROM student_poll
                    WHERE uid = %s
                """
                params = [uid]
                
                if search_keyword:
                    query += " AND title LIKE %s"
                    params.append(f"%{search_keyword}%")
                
                cursor.execute(query, params)
                results = cursor.fetchall()
                for row in results:
                    all_activities.append({
                        "id": row[0],
                        "title": row[1],
                        "activityType": row[2],
                        "edited": int(row[3].timestamp() * 1000) if row[3] else None,
                        "questions": [],  # 默认空列表
                        "timerMinutes": 0,  # 默认值
                        "timerSeconds": 0  # 默认值
                    })

            if not activity_type or activity_type == 'mindmap':
                query = """
                    SELECT mind_map_id as id, title, 'mindmap' as activityType, updated_time
                    FROM mind_map_result
                    WHERE uid = %s
                """
                params = [uid]
                
                if search_keyword:
                    query += " AND title LIKE %s"
                    params.append(f"%{search_keyword}%")
                
                cursor.execute(query, params)
                results = cursor.fetchall()
                for row in results:
                    all_activities.append({
                        "id": row[0],
                        "title": row[1],
                        "activityType": row[2],
                        "edited": int(row[3].timestamp() * 1000) if row[3] else None,
                        "questions": [],  # 默认空列表
                        "timerMinutes": 0,  # 默认值
                        "timerSeconds": 0  # 默认值
                    })

            if not activity_type or activity_type == 'scale':
                query = """
                    SELECT scale_id as id, title, 'scale' as activityType, created_time
                    FROM scale
                    WHERE uid = %s
                """
                params = [uid]
                
                if search_keyword:
                    query += " AND title LIKE %s"
                    params.append(f"%{search_keyword}%")
                
                cursor.execute(query, params)
                results = cursor.fetchall()
                for row in results:
                    all_activities.append({
                        "id": row[0],
                        "title": row[1],
                        "activityType": row[2],
                        "edited": int(row[3].timestamp() * 1000) if row[3] else None,
                        "questions": [],  # 默认空列表
                        "timerMinutes": 0,  # 默认值
                        "timerSeconds": 0  # 默认值
                    })
        # Sort by edited (newest first)
        all_activities.sort(key=lambda x: x['edited'] or 0, reverse=True)
        
        # Calculate total count and pagination
        total_count = len(all_activities)
        total_pages = (total_count + limit - 1) // limit
        
        # Apply pagination
        paginated_activities = all_activities[offset:offset + limit]
        
        return jsonify({
            "success": True,
            "data": paginated_activities,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "totalPages": total_pages
            }
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

@app.route('/api/classroom_quiz/<classroom_quiz_id>/responses', methods=['POST'])
def submit_responses(classroom_quiz_id):
    """Endpoint to submit responses for a specific classroom quiz."""
    connection = get_connection()
    if request.method == 'OPTIONS':
        return '', 200
    try:
        # Parse the JSON request body
        data = request.get_json()
        
        if not data or not all(key in data for key in ['quiz_id', 'studentName', 'answers', 'submittedAt']):
            return jsonify({"error": "Invalid input. Please provide 'quiz_id', 'studentName', 'answers', and 'submittedAt' in JSON body."}), 400

        quiz_id = data['quiz_id']
        student_name = data['studentName'].strip()
        answers = data['answers']  # List of answers
        submitted_at = data['submittedAt']

        # Validate answers
        if not isinstance(answers, list) or not all('question_id' in ans and 'answer' in ans for ans in answers):
            return jsonify({"error": "Each answer must include 'question_id' and 'answer'."}), 400

        # Insert responses into the database
        connection = get_connection()
        if connection:
            with connection.cursor() as cursor:
                query = """
                INSERT INTO answers (quiz_id, question_id, student_name, answer_content, submitted_at,question_type)
                VALUES (%s, %s, %s, %s, FROM_UNIXTIME(%s), %s)
                """
                for answer in answers:
                    cursor.execute(query, (quiz_id, answer['question_id'], student_name, answer['answer'], submitted_at // 1000, answer.get('question_type')))
                connection.commit()

        return jsonify({"success": True, "message": "Responses submitted successfully."}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

@app.route('/api/classroom_quiz/<classroom_quiz_id>/results', methods=['GET'])
def get_quiz_results(classroom_quiz_id):
    """Endpoint to fetch all responses for a specific classroom quiz."""
    try:
        connection = get_connection()
        if not connection:
            return jsonify({"success": False, "error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # Fetch all responses for the given quiz ID
            query = """
            SELECT student_name, question_id, answer_content, submitted_at
            FROM answers
            WHERE quiz_id = %s
            ORDER BY submitted_at
            """
            cursor.execute(query, (classroom_quiz_id,))
            rows = cursor.fetchall()

            if not rows:
                return jsonify({"success": True, "responses": []}), 200

            # Organize responses by student
            responses = {}
            for row in rows:
                student_name = row[0]
                question_id = row[1]
                answer_content = row[2]
                submitted_at = int(row[3].timestamp() * 1000) if row[3] else None

                if student_name not in responses:
                    responses[student_name] = {
                        "studentName": student_name,
                        "answers": {},
                        "submittedAt": submitted_at
                    }

                responses[student_name]["answers"][question_id] = answer_content

            # Convert responses to a list
            response_list = list(responses.values())

            return jsonify({"classroom_quiz_id": classroom_quiz_id, "success": True, "responses": response_list}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

@app.route('/api/classroom_quiz/<quizId>/responses', methods=['GET'])
def get_classroom_quiz_responses(quizId):
    """Endpoint to fetch all responses for a specific classroom quiz with the required format."""
    try:
        connection = get_connection()
        if not connection:
            return jsonify({"error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # Fetch all responses for the given quiz ID
            query = """
            SELECT student_name, question_id, answer_content, submitted_at, uid
            FROM answers
            WHERE quiz_id = %s
            ORDER BY submitted_at, student_name
            """
            cursor.execute(query, (quizId,))
            rows = cursor.fetchall()

            # Organize responses by student
            responses_dict = {}
            for row in rows:
                student_name = row[0]
                question_id = row[1]
                answer_content = row[2]
                submitted_at = row[3]
                student_id = row[4] if row[4] else student_name
                
                # Create unique response ID
                response_id = f"{quizId}_{student_id}"
                
                if response_id not in responses_dict:
                    responses_dict[response_id] = {
                        "id": response_id,
                        "quizId": quizId,
                        "studentId": student_id,
                        "answers": {},
                        "submittedAt": int(submitted_at.timestamp() * 1000) if submitted_at else None
                    }
                
                # Try to parse answer_content as JSON, otherwise use as-is
                try:
                    parsed_answer = json.loads(answer_content) if isinstance(answer_content, str) else answer_content
                except (json.JSONDecodeError, TypeError):
                    parsed_answer = answer_content
                
                responses_dict[response_id]["answers"][question_id] = parsed_answer

            # Convert to list
            responses_list = list(responses_dict.values())

            return jsonify({"responses": responses_list}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

@app.route('/api/classroom_quiz', methods=['GET'])
def get_all_classroom_quizzes():
    """Endpoint to retrieve all classroom quizzes."""
    try:
        connection = get_connection()
        if not connection:
            return jsonify({"success": False, "error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # Query to retrieve all classroom quizzes
            query = """
                SELECT quiz_id, title, created_at
                FROM class_quizzes
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

@app.route('/api/classroom_quiz/update/<classroom_quiz_id>', methods=['PUT'])
def update_classroom_quiz(classroom_quiz_id):
    """Endpoint to update a classroom quiz by its ID."""
    try:
        # Parse the JSON request body
        data = request.get_json()
        if not data or not all(key in data for key in ['title', 'type', 'classroom_quizType']):
            return jsonify({"error": "Invalid input. Please provide 'title', 'type', and 'classroom_quizType' in JSON body."}), 400

        title = data['title']
        classroom_quiz_type = data['type']
        classroom_quiz_category = data['classroom_quizType']

        connection = get_connection()
        if not connection:
            return jsonify({"error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # Check if the quiz exists
            cursor.execute("SELECT quiz_id FROM class_quizzes WHERE quiz_id = %s", (classroom_quiz_id,))
            result = cursor.fetchone()
            if not result:
                return jsonify({"error": "Classroom quiz not found."}), 404

            # Update the classroom quiz details
            update_query = """
            UPDATE class_quizzes
            SET title = %s, type = %s, activity_type = %s
            WHERE quiz_id = %s
            """
            cursor.execute(update_query, (title, classroom_quiz_type, classroom_quiz_category, classroom_quiz_id))
            connection.commit()

        return jsonify({"success": True, "message": "Classroom quiz updated successfully."}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

@app.route('/api/homepage_classroom_quiz', methods=['GET'])
def get_homepage_classroom_quizzes():
    """Endpoint to retrieve all classroom quizzes with their questions for homepage."""
    try:
        connection = get_connection()
        if not connection:
            return jsonify({"error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # Query to retrieve all classroom quizzes
            cursor.execute("""
                SELECT quiz_id, title, type
                FROM class_quizzes
                ORDER BY created_at DESC
            """)
            quizzes = cursor.fetchall()

            # Format the results
            quizzes_list = []
            for quiz in quizzes:
                quiz_id = quiz[0]
                quiz_title = quiz[1]
                quiz_type = quiz[2]

                # Fetch questions for this quiz
                cursor.execute("""
                    SELECT question_id, question_text, question_type, options, true_answer, points
                    FROM questions
                    WHERE quiz_id = %s
                    ORDER BY question_id
                """, (quiz_id,))
                questions = cursor.fetchall()

                # Format questions
                formatted_questions = []
                for question in questions:
                    question_data = {
                        "id": question[0],
                        "text": question[1],
                        "type": question[2],
                        "options": json.loads(question[3]) if question[3] else None,
                        "correctAnswer": question[4],
                        "points": question[5] if question[5] is not None else 10
                    }
                    formatted_questions.append(question_data)

                # Add quiz with questions to the list
                quizzes_list.append({
                    "id": quiz_id,
                    "title": quiz_title,
                    "type": quiz_type,
                    "questions": formatted_questions
                })

        return jsonify({"quizzes": quizzes_list}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

# Ensure the app runs correctly
if __name__ == '__main__':
    app.run("0.0.0.0", debug=True)