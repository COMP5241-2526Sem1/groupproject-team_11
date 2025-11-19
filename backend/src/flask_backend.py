from flask import Flask, request, jsonify
from flask_cors import CORS
from src.LLM import ai_assistant
from src.db_connection import release_connection, get_connection    
from src.fetch_and_shuffle_groups import fetch_and_shuffle_groups
from src.random_student_selector import fetch_random_usernames
from src.student_importer import StudentImporter
from src.file_processor import FileProcessor
from src.share_link import get_open_question_results, submit_open_question_response, delete_open_question, get_all_open_questions, get_open_question, create_open_question, update_open_question, share_open_question
from src.activities import get_all_classroom_quizzes, create_activity, view_activity, submit_answers, get_all_activities, delete_activity, grade_activity, submit_responses,get_quiz_results, update_classroom_quiz, get_classroom_quiz_responses, get_homepage_classroom_quizzes

from src.grade_statistics import upload_grades, get_grades_statistics, analyze_grades_with_ai, update_ai_analysis, delete_quiz_analysis
from src.poll_results import get_poll_results, get_text_poll_results
from src.discussion_api import create_discussion, like_discussion, add_reply, get_discussions

from src.studentpoll import submit_poll_response, create_student_poll, view_student_poll, submit_poll_answers,get_polls,update_student_poll,delete_poll
from src.mindmap_generator import generate_mindmap
from src.course_routes import course_routes
from src.file_upload import upload_content, upload_assignment, upload_quiz, download_file, delete_file, list_files
import uuid
from datetime import datetime
from src.mindmap_api import mindmap_bp
from src.scales_question import scales_question_bp
import time
from src.new_topic import create_new_topic, ai_assistant_chat

app = Flask(__name__)
CORS(app)  # 允许所有来源的跨域请求s

student_importer = StudentImporter()
file_processor = FileProcessor()

@app.route('/api/ai/chat', methods=['POST'])
def process_text():
    """Endpoint to process user input text and return AI response with chat history."""
    connection = None
    cursor = None

    try:
        # 处理纯JSON数据
        data = request.get_json()
        if not data or 'message' not in data or 'context' not in data:
            return jsonify({"success": False, "error": "Invalid input. Please provide 'message' and 'context' in JSON body."}), 400

        user_input = data['message']
        context = data['context']
        conversation_history = data.get('conversationHistory', [])  # Allow conversationHistory to be optional

        # 构建完整的对话上下文
        prompt = "you are a teaching assistant. "

        # 将历史记录加入上下文
        if conversation_history:
            prompt += "\n\n历史对话记录:\n"
            for i, hist in enumerate(conversation_history, 1):
                role = "用户" if hist['role'] == 'user' else "AI"
                prompt += f"{i}. {role}: {hist['content']}\n"

        prompt += f"\n当前用户输入: {user_input}"

        # 调用 AI 助手生成回复
        #time.sleep(1)
        answer = ai_assistant(prompt)

        # 返回响应
        response = {
            "success": True,
            "reply": answer
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            release_connection(connection)
    

@app.route('/ppt_assistant', methods=['POST'])
def ppt_process_text():
    """Endpoint to process user input text and return AI response."""


    data = request.get_json()
    if not data or 'message' not in data:  # 改为检查 'message'，与前端一致
        return jsonify({"error": "Invalid input. Please provide 'message' in JSON body."}), 400

    user_input = data['message']  # 前端发送的是 message 字段
    topic_id = data.get('topicId', '')  # 可选字段
    attachments = data.get('attachments', [])
    conversation_history = data.get('conversationHistory', [])
    prompt = "you are a PPT AI assistant plugin designed to help teachers generate courseware PPTs and related content. Now, you are given a piece of text, and your task is to generate a PPT outline. You must clearly label the content of each page and strictly adhere to the original text, Only generate the PPT outline, with no extra content. and use English."
    text = f"{prompt}{user_input}"

    try:
        # Call the AI assistant with the constructed text
        answer = ai_assistant(text)
        return jsonify({
        "user_input": user_input,
        "content": answer,  # 推荐字段名与前端保持一致
        "topicId": topic_id,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


    

@app.route('/random_student_selection', methods=['POST'])
def random_student_selection():
    """Endpoint to shuffle groups from a course."""
    data = request.get_json()
    if not data or 'course_id' not in data:
        return jsonify({"error": "Invalid input. Please provide 'course_id' in JSON body."}), 400

    course_id = data['course_id']
    num_students = data.get('num_students')  # Default to 1 if not provided

    try:
        # Fetch and shuffle groups using the shared utility function
        name = fetch_random_usernames(course_id, num_students)


        return jsonify({"students": name})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/group_shuffle', methods=['POST'])
def group_shuffle():
    """Endpoint to shuffle groups from a course."""
    data = request.get_json()
    if not data or 'course_id' not in data:
        return jsonify({"error": "Invalid input. Please provide 'course_id' in JSON body."}), 400

    course_id = data['course_id']

    try:
        # Fetch and shuffle groups using the shared utility function
        groups = fetch_and_shuffle_groups(course_id)
        return jsonify({"shuffled_groups": groups})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/import_students', methods=['POST'])
def import_students():
    """Endpoint to import student data from an Excel file."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    try:
        student_importer.import_students(file)
        return jsonify({"message": "Student data imported successfully"}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except ConnectionError as ce:
        return jsonify({"error": str(ce)}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/upload_course_material', methods=['POST'])
def upload_course_material():
    """Endpoint to upload course material and generate PPT outline."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    try:
        # Extract text from the uploaded file
        extracted_text = file_processor.process_file(file)

        # Generate PPT outline using the LLM
        prompt = "You are a PPT AI assistant plugin designed to help teachers generate courseware PPTs and related content. Now, you are given a piece of text, and your task is to generate a PPT outline. You must clearly label the content of each page and strictly adhere to the original text, Only generate the PPT outline, with no extra content. and use English."
        text = f"{prompt}\n{extracted_text}"
        ppt_outline = ai_assistant(text)

        return jsonify({"ppt_outline": ppt_outline}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/topic/new', methods=['POST'])
def create_new_topic():
    """Endpoint to create a new topic with a generated chatId."""
    # Default user identifier for single-user input
    uid = "1"
    chat_id = str(uuid.uuid4())  # Generate a new chatId
    welcome_message = "Welcome to your new topic!"  # Optional welcome message

    try:
        # Get database connection
        connection = get_connection()
        cursor = connection.cursor()

        # Insert the welcome message into chat_history
        cursor.execute(
            """
            INSERT INTO chat_history (uid, chat_id, chat_context, chattime)
            VALUES (%s, %s, %s, %s)
            """,
            (uid, chat_id, welcome_message, datetime.now())
        )

        # Commit the transaction
        connection.commit()

        return jsonify({
            "chatId": chat_id,
            "welcomeMessage": welcome_message
        }), 201

    except Exception as e:
        if connection:
            connection.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            release_connection(connection)

# Register the share link endpoints
app.add_url_rule('/api/open-questions/create', view_func=create_open_question, methods=['POST'])
app.add_url_rule('/api/open-questions/<share_id>', view_func=get_open_question, methods=['GET'])
app.add_url_rule('/api/open-questions/update/<share_id>', view_func=update_open_question, methods=['PUT'])
app.add_url_rule('/api/open-questions/<share_id>/share', view_func=share_open_question, methods=['POST'])
app.add_url_rule('/api/open-questions', view_func=get_all_open_questions, methods=['GET'])

app.add_url_rule('/api/open-questions/<share_id>/responses',view_func=submit_open_question_response, methods=['POST', 'OPTIONS'])
app.add_url_rule('/api/open-questions/<share_id>/results',view_func=get_open_question_results, methods=['GET'])


app.add_url_rule('/api/open-questions/<share_id>', view_func=delete_open_question, methods=['DELETE'])

# Register the activities endpoints
app.add_url_rule('/api/activities', view_func=create_activity, methods=['POST'])
app.add_url_rule('/api/activities/<activity_id>', view_func=view_activity, methods=['GET'])
app.add_url_rule('/api/activities/<activity_id>', view_func=submit_answers, methods=['POST'])
app.add_url_rule('/api/all_activities', view_func=get_all_activities, methods=['GET'])

# Register the updated activities endpoints
app.add_url_rule('/api/classroom_quiz', view_func=create_activity, methods=['POST', 'OPTIONS'])
app.add_url_rule('/api/classroom_quiz/<classroom_quiz_id>', view_func=view_activity, methods=['GET'])
app.add_url_rule('/api/classroom_quiz/<classroom_quiz_id>', view_func=submit_answers, methods=['POST'])
app.add_url_rule('/api/classroom_quiz/<classroom_quiz_id>', view_func=delete_activity, methods=['DELETE'])
app.add_url_rule('/api/classroom_quiz/<classroom_quiz_id>/grade', view_func=grade_activity, methods=['POST'])
app.add_url_rule('/api/classroom_quiz/<classroom_quiz_id>/responses', view_func=submit_responses, methods=['POST'])
app.add_url_rule('/api/classroom_quiz/<classroom_quiz_id>/results', view_func=get_quiz_results, methods=['GET'])
app.add_url_rule('/api/classroom_quiz', view_func=get_all_classroom_quizzes, methods=['GET'])
app.add_url_rule('/api/classroom_quiz/<quizId>/responses', view_func=get_classroom_quiz_responses, methods=['GET'])

app.add_url_rule('/api/homepage_classroom_quiz', view_func=get_homepage_classroom_quizzes, methods=['GET'])
# Register the updated classroom quiz update endpoint
app.add_url_rule('/api/classroom_quiz/update/<classroom_quiz_id>', view_func=update_classroom_quiz, methods=['PUT'])

# Register the grade statistics endpoints
app.add_url_rule('/api/upload_grades', view_func=upload_grades, methods=['POST'])
app.add_url_rule('/api/upload_grades/<quiz_anal_id>', view_func=get_grades_statistics, methods=['GET'])
app.add_url_rule('/api/analyze_grades_with_ai/<quiz_anal_id>', view_func=analyze_grades_with_ai, methods=['GET'])
app.add_url_rule('/api/update_ai_analysis/<quiz_anal_id>', view_func=update_ai_analysis, methods=['GET'])

app.add_url_rule('/api/delete_quiz_analysis/<quiz_anal_id>', view_func=delete_quiz_analysis, methods=['DELETE'])

# Register the student poll endpoints
app.add_url_rule('/api/polls/create', view_func=create_student_poll, methods=['POST'])
app.add_url_rule('/api/studentpoll/<poll_id>', view_func=view_student_poll, methods=['GET'])
app.add_url_rule('/api/studentpoll/<poll_id>', view_func=submit_poll_answers, methods=['POST'])


# Register the poll results endpoints
app.add_url_rule('/api/studentpoll/<poll_id>/results', view_func=get_poll_results, methods=['GET'])
app.add_url_rule('/api/studentpoll/<poll_id>/text_results', view_func=get_text_poll_results, methods=['GET'])

app.add_url_rule('/api/polls/<poll_id>/responses', view_func=submit_poll_response, methods=['POST','OPTIONS'])

# Register the mindmap generation endpoint
app.add_url_rule('/api/generate_mindmap', view_func=generate_mindmap, methods=['POST'])


# Register the course_routes Blueprint
app.register_blueprint(course_routes)

# Register the file upload endpoints
app.add_url_rule('/api/upload/content', view_func=upload_content, methods=['POST'])
app.add_url_rule('/api/upload/assignment', view_func=upload_assignment, methods=['POST'])
app.add_url_rule('/api/upload/quiz', view_func=upload_quiz, methods=['POST'])
app.add_url_rule('/api/download/<filename>', view_func=download_file, methods=['GET'])
app.add_url_rule('/api/delete/<filename>', view_func=delete_file, methods=['DELETE'])
app.add_url_rule('/api/files', view_func=list_files, methods=['GET'])

# Register the new endpoint for retrieving all polls
app.add_url_rule('/api/polls', view_func=get_polls, methods=['GET'])

# Register the new endpoint for updating a poll
app.add_url_rule('/api/polls/update/<poll_id>', view_func=update_student_poll, methods=['PUT'])

# Register the new endpoint for deleting a poll and its related data
app.add_url_rule('/api/polls/delete/<poll_id>', view_func=delete_poll, methods=['DELETE'])

# Register the discussion endpoints
app.add_url_rule('/api/discussions/create', view_func=create_discussion, methods=['POST'])
app.add_url_rule('/api/discussions/<post_id>/like', view_func=like_discussion, methods=['PUT'])
app.add_url_rule('/api/discussions/<post_id>/replies', view_func=add_reply, methods=['POST'])
app.add_url_rule('/api/discussions', view_func=get_discussions, methods=['GET'])

# Register the mindmap blueprint
app.register_blueprint(mindmap_bp)

# Register the scales question blueprint
app.register_blueprint(scales_question_bp)

# Register the new topic and AI assistant chat endpoints
app.add_url_rule('/api/ass_topic/new', view_func=create_new_topic, methods=['POST'])
app.add_url_rule('/api/ai_ass/chat', view_func=ai_assistant_chat, methods=['POST'])

if __name__ == '__main__':
    app.run("0.0.0.0", port=3000, debug=True)