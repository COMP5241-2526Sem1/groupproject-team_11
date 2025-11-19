from flask import Blueprint, jsonify, request
from src.db_connection import get_connection, release_connection
import json
import uuid

scales_question_bp = Blueprint('scales_question', __name__)

@scales_question_bp.route('/api/scales-questions/<id>', methods=['GET'])
def get_scales_question(id):
    """Endpoint to retrieve a specific scales question by its ID."""
    try:
        connection = get_connection()
        if not connection:
            return jsonify({"success": False, "error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # Query the scale_questions table for the specific question
            query = """
                SELECT scale_id, title, type, activity_type, thumbnail
                FROM scale_questions
                WHERE scale_id = %s
            """
            cursor.execute(query, (id,))
            question_result = cursor.fetchone()

            if not question_result:
                return jsonify({"success": False, "error": "Scales question not found."}), 404

            # Extract data from the question result
            scale_id, title, q_type, activity_type, thumbnail = question_result

            # Query the scale_detail table for slides
            slides_query = """
                SELECT subid, text, scaleoption, scalemin, scalemax
                FROM scale_detail
                WHERE scale_id = %s
            """
            cursor.execute(slides_query, (scale_id,))
            slides_results = cursor.fetchall()

            slides = []
            for slide in slides_results:
                subid, text, scaleoption, scalemin, scalemax = slide
                slides.append({
                    "id": subid,
                    "text": text,
                    "scaleOptions": json.loads(scaleoption),
                    "scaleMin": scalemin,
                    "scaleMax": scalemax
                })

            # Format the response
            response = {
                "success": True,
                "activity": {
                    "id": scale_id,
                    "title": title,
                    "type": q_type,
                    "activityType": activity_type,
                    "thumbnail": thumbnail,
                    "slides": slides
                }
            }

            return jsonify(response), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        if connection:
            release_connection(connection)

@scales_question_bp.route('/api/scales-questions/create', methods=['POST'])
def create_scales_question():
    """Endpoint to create a new scales question activity."""
    try:
        data = request.get_json()
        if not data or not all(key in data for key in ['title', 'type', 'activityType', 'thumbnail', 'slides']):
            return jsonify({"success": False, "error": "Invalid input. Please provide 'title', 'type', 'activityType', 'thumbnail', and 'slides' in JSON body."}), 400

        title = data['title']
        q_type = data['type']
        activity_type = data['activityType']
        thumbnail = data['thumbnail']
        slides = data['slides']

        # Generate a unique ID for the activity
        scale_id = f"sq_{str(uuid.uuid4())[:8]}"

        connection = get_connection()
        if not connection:
            return jsonify({"success": False, "error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # Insert into scale_questions table
            from datetime import datetime
            now = datetime.now()
            query1 = """
                INSERT INTO scale_questions (scale_id, title, type, activity_type, thumbnail, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query1, (scale_id, title, q_type, activity_type, thumbnail, now))

            # Insert slides into scale_detail table
            query2 = """
                INSERT INTO scale_detail (scale_id, subid, text, scaleoption, scalemin, scalemax)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            for slide in slides:
                cursor.execute(query2, (
                    scale_id,
                    slide['id'],
                    slide['text'],
                    json.dumps(slide['scaleOptions']),
                    slide['scaleMin'],
                    slide['scaleMax']
                ))

            connection.commit()

        # Prepare the response
        response = {
            "success": True,
            "activity": {
                "id": scale_id,
                "title": title,
                "slides": slides,
                "createdAt": now
            }
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        if connection:
            release_connection(connection)

@scales_question_bp.route('/api/scales-questions/update/<id>', methods=['PUT'])
def update_scales_question(id):
    """Endpoint to update an existing scales question activity."""
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
            # Update the title in scale_questions table
            query1 = """
                UPDATE scale_questions
                SET title = %s
                WHERE scale_id = %s
            """
            cursor.execute(query1, (title, id))

            # Delete existing slides for the scale_id
            query2 = """
                DELETE FROM scale_detail
                WHERE scale_id = %s
            """
            cursor.execute(query2, (id,))

            # Insert updated slides into scale_detail table
            query3 = """
                INSERT INTO scale_detail (scale_id, subid, text, scaleoption, scalemin, scalemax)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            for slide in slides:
                cursor.execute(query3, (
                    id,
                    slide['id'],
                    slide['text'],
                    json.dumps(slide['scaleOptions']),
                    slide['scaleMin'],
                    slide['scaleMax']
                ))

            connection.commit()

        # Prepare the response
        from datetime import datetime
        updated_at = int(datetime.now().timestamp() * 1000)
        response = {
            "success": True,
            "activity": {
                "id": id,
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

@scales_question_bp.route('/api/scales-questions/<id>/share', methods=['POST'])
def share_scales_question(id):
    """Endpoint to generate a shareable link for a scales question."""
    try:
        data = request.get_json()
        if not data or not all(key in data for key in ['title', 'slides']):
            return jsonify({"success": False, "error": "Invalid input. Please provide 'title' and 'slides' in JSON body."}), 400

        title = data['title']
        slides = data['slides']

        # Generate a unique share token
        import random
        import string
        share_token = ''.join(random.choices(string.ascii_letters + string.digits, k=8))

        connection = get_connection()
        if not connection:
            return jsonify({"success": False, "error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # Insert the share details into a new table for shared scales questions
            query = """
                UPDATE scale_questions
                SET share_token = %s
                WHERE scale_id = %s
            """
            cursor.execute(query, (share_token, id))
            connection.commit()

        # Generate the shareable link
        base_url = request.host_url.rstrip('/')
        share_link = f"{base_url}/response/{id}?shareToken={share_token}"

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

@scales_question_bp.route('/api/scales-questions/<id>/responses', methods=['POST', 'OPTIONS'])
def submit_scales_question_response(id):
    """Endpoint to submit a response for a scales question."""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        connection = get_connection()
        data = request.get_json()
        
        # 验证必需字段
        if not data or not all(key in data for key in ['studentName', 'answers', 'submittedAt']):
            return jsonify({
                "success": False,
                "message": "Invalid input. Please provide all required fields: studentName, answers, submittedAt."
            }), 400

        student_name = data['studentName']
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
            # 检查 scale_id 是否存在
            cursor.execute("SELECT scale_id FROM scale_questions WHERE scale_id = %s", (id,))
            question_result = cursor.fetchone()
            
            if not question_result:
                return jsonify({
                    "success": False,
                    "message": f"Scales question with ID {id} not found."
                }), 404

            # 生成唯一的 response_id
            response_id = f"{id}_{student_name}_{str(uuid.uuid4())[:8]}"

            # 转换时间戳为 datetime 对象
            from datetime import datetime
            submitted_datetime = datetime.fromtimestamp(submitted_at / 1000)

            # 插入每个答案到数据库
            insert_query = """
            INSERT INTO scale_response (scale_id, studentname, subid, value, submitted_at)
            VALUES (%s, %s, %s, %s, %s)
            """
            
            for answer_item in answers:
                if not isinstance(answer_item, dict) or 'slideId' not in answer_item or 'value' not in answer_item:
                    return jsonify({
                        "success": False,
                        "message": "Each answer must contain 'slideId' and 'value'."
                    }), 400

                slide_id = answer_item['slideId']
                value = answer_item['value']

                # 插入答案
                cursor.execute(
                    insert_query,
                    (id, student_name, slide_id, value, submitted_datetime)
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

@scales_question_bp.route('/api/scales-questions/<id>/results', methods=['GET'])
def get_scales_question_results(id):
    """Endpoint to retrieve all responses for a scales question."""
    try:
        connection = get_connection()
        if not connection:
            return jsonify({"success": False, "error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # 检查 scale_id 是否存在
            cursor.execute("SELECT scale_id FROM scale_questions WHERE scale_id = %s", (id,))
            question_result = cursor.fetchone()
            
            if not question_result:
                return jsonify({"success": False, "error": f"Scales question with ID {id} not found."}), 404

            # 查询所有响应，按 studentname 分组
            query = """
                SELECT studentname, subid, value, submitted_at
                FROM scale_response
                WHERE scale_id = %s
                ORDER BY studentname, subid
            """
            cursor.execute(query, (id,))
            results = cursor.fetchall()

            if not results:
                return jsonify({"success": True, "responses": []}), 200

            # 按 studentname 组织数据
            responses_dict = {}
            for row in results:
                student_name, subid, value, submitted_at = row
                
                if student_name not in responses_dict:
                    responses_dict[student_name] = {
                        "studentName": student_name,
                        "answers": {},
                        "submittedAt": int(submitted_at.timestamp() * 1000) if submitted_at else None
                    }
                
                # 将 subid 作为 key，value 作为 value，存储为字典格式
                responses_dict[student_name]["answers"][str(subid)] = value

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

@scales_question_bp.route('/api/scales-questions', methods=['GET'])
def get_all_scales_questions():
    """Endpoint to retrieve all scales questions."""
    try:
        connection = get_connection()
        if not connection:
            return jsonify({"success": False, "error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # Query to retrieve all scales questions
            query = """
                SELECT scale_id, title, thumbnail, created_at
                FROM scale_questions
            """
            cursor.execute(query)
            results = cursor.fetchall()

            # Format the results into the required structure
            activities = [
                {
                    "id": row[0],
                    "title": row[1],
                    "thumbnail": row[2],
                    "createdAt": int(row[3].timestamp() * 1000) if row[3] else None
                }
                for row in results
            ]

        return jsonify({"activities": activities}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

@scales_question_bp.route('/api/scales-questions/<id>', methods=['DELETE'])
def delete_scale_question(id):
    """Endpoint to delete a scale question by its ID."""
    try:
        connection = get_connection()
        if not connection:
            return jsonify({"success": False, "error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # Delete from scale_detail table
            query1 = "DELETE FROM scale_detail WHERE scale_id = %s"
            cursor.execute(query1, (id,))

            # Delete from scale_questions table
            query2 = "DELETE FROM scale_questions WHERE scale_id = %s"
            cursor.execute(query2, (id,))

            connection.commit()

        return jsonify({"success": True}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)