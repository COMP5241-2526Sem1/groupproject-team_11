import os
import pandas as pd
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import uuid
from flask_caching import Cache
from src.db_connection import get_connection, release_connection
import json
from src.LLM import ai_assistant
from decimal import Decimal

app = Flask(__name__)

UPLOAD_FOLDER = './uploads'
ALLOWED_EXTENSIONS = {'xlsx'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    """Check if the file is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def calculate_statistics(df):
    """Calculate statistics for the uploaded grades."""
    stats = {}

    # Ensure 'total_score' column exists
    if 'total_score' not in df.columns:
        raise ValueError("The Excel file must contain a 'total_score' column.")

    # Calculate overall statistics for total scores
    total_scores = df['total_score']
    stats['highest_score'] = total_scores.max()
    stats['lowest_score'] = total_scores.min()
    stats['average_score'] = total_scores.mean()
    stats['median_score'] = total_scores.median()
    stats['mode_score'] = total_scores.mode().tolist()

    # Calculate score distribution
    bins = [0, 60, 70, 80, 90, 100]
    labels = ['<60', '60-69', '70-79', '80-89', '90-100']
    score_distribution = df['total_score'].value_counts(bins=bins, sort=False).to_dict()
    stats['score_distribution'] = dict(zip(labels, score_distribution.values()))
    # Calculate per-question statistics if question columns exist
    question_stats = {}
    question_columns = [col for col in df.columns if col.startswith('question_')]
    for question in question_columns:
        question_scores = df[question]
        question_stats[question] = {
            'highest_score': question_scores.max(),
            'lowest_score': question_scores.min(),
            'average_score': question_scores.mean(),
            'median_score': question_scores.median(),
            'mode_score': question_scores.mode().tolist()
        }

    stats['question_statistics'] = question_stats

    return stats

# Configure caching
#cache = Cache(app, config={
#    'CACHE_TYPE': 'RedisCache',
#    'CACHE_REDIS_URL': 'redis://49.232.227.144:6379/0',
#    'CACHE_DEFAULT_TIMEOUT': 1800  # Cache timeout: 30 minutes
#})

#cache = Cache(app, config={
#    'CACHE_TYPE': 'SimpleCache',
#    'CACHE_DEFAULT_TIMEOUT': 1800  # Cache timeout: 30 minutes
#})

@app.route('/upload_grades', methods=['POST'])
def upload_grades():
    """Endpoint to upload student grades and calculate statistics."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Only .xlsx files are allowed."}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    try:
        # Read the Excel file
        df = pd.read_excel(filepath)

        # Calculate statistics
        stats = calculate_statistics(df)

        # Generate a unique quiz analysis ID
        quiz_anal_id = str(uuid.uuid4())

        # Cache the statistics with the generated ID
        #cache.set(quiz_anal_id, stats)

        # Store the quiz_anal_id and filename in the database
        connection = get_connection()
        if connection:
            try:
                with connection.cursor() as cursor:
                    # Insert into upload_quiz_analysis_records table
                    query1 = """
                    INSERT INTO upload_quiz_analysis_records (quiz_anal_id, filename)
                    VALUES (%s, %s)
                    """
                    cursor.execute(query1, (quiz_anal_id, filename))

                    # Insert into quiz_anal_score_statistics table
                    query2 = """
                    INSERT INTO quiz_anal_score_statistics (
                        quiz_anal_id, max_score, min_score, avg_score, median_score, mode_score, score_ranges
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """
                    cursor.execute(query2, (
                        quiz_anal_id,
                        stats['highest_score'],
                        stats['lowest_score'],
                        stats['average_score'],
                        stats['median_score'],
                        json.dumps(stats['mode_score']),
                        json.dumps(stats['score_distribution'])
                    ))

                    # Insert into quiz_anal_each_question_statistics table
                    for question, question_stats in stats['question_statistics'].items():
                        query3 = """
                        INSERT INTO quiz_anal_each_question_statistics (
                            quiz_anal_id, question_name, max_score, min_score, avg_score, score_dist
                        )
                        VALUES (%s, %s, %s, %s, %s, %s)
                        """
                        cursor.execute(query3, (
                            quiz_anal_id,
                            question,
                            question_stats['highest_score'],
                            question_stats['lowest_score'],
                            question_stats['average_score'],
                            json.dumps(question_stats['mode_score'])
                        ))

                    connection.commit()
            finally:
                release_connection(connection)

        return jsonify({"quiz_anal_id": quiz_anal_id}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Remove the uploaded file
        os.remove(filepath)

@app.route('/upload_grades/<quiz_anal_id>', methods=['GET'])
def get_grades_statistics(quiz_anal_id):
    """Endpoint to retrieve all statistics data from the database by quiz_anal_id."""
    # Check cache first
    #cache_key = f"stats_{quiz_anal_id}"
    #cached_data = cache.get(cache_key)
    #if cached_data:
    #    return jsonify({"statistics": cached_data}), 200
    
    connection = get_connection()
    if connection:
        try:
            with connection.cursor() as cursor:
                # Query quiz_anal_score_statistics table
                query1 = """
                SELECT max_score, min_score, avg_score, median_score, mode_score, score_ranges
                FROM quiz_anal_score_statistics
                WHERE quiz_anal_id = %s
                """
                cursor.execute(query1, (quiz_anal_id,))
                score_stats = cursor.fetchone()

                # Query quiz_anal_each_question_statistics table
                query2 = """
                SELECT question_name, max_score, min_score, avg_score, score_dist
                FROM quiz_anal_each_question_statistics
                WHERE quiz_anal_id = %s
                """
                cursor.execute(query2, (quiz_anal_id,))
                question_stats = cursor.fetchall()

                if not score_stats:
                    return jsonify({"error": "Statistics not found for the given quiz_anal_id."}), 404

                # Format the response
                response = {
                    "highest_score": score_stats[0],
                    "lowest_score": score_stats[1],
                    "average_score": score_stats[2],
                    "median_score": score_stats[3],
                    "mode_score": json.loads(score_stats[4]) if score_stats[4] else [],
                    "score_distribution": json.loads(score_stats[5]) if score_stats[5] else {},
                    "question_statistics": {}
                }

                # Add question statistics
                for question in question_stats:
                    response["question_statistics"][question[0]] = {
                        "highest_score": question[1],
                        "lowest_score": question[2],
                        "average_score": question[3],
                        "mode_score": json.loads(question[4]) if question[4] else []
                    }

                # Cache the response
                #cache.set(cache_key, response)

                return jsonify({"statistics": response}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            release_connection(connection)
    else:
        return jsonify({"error": "Database connection failed."}), 500

@app.route('/analyze_grades_with_ai/<quiz_anal_id>', methods=['GET'])
def analyze_grades_with_ai(quiz_anal_id):
    """Endpoint to analyze grades using AI and return detailed insights."""
    # Check cache first
    #cache_key = f"ai_analysis_{quiz_anal_id}"
    #cached_analysis = cache.get(cache_key)
    #if cached_analysis:
    #    return jsonify({"ai_analysis": cached_analysis}), 200
    
    # Retrieve statistics from database by quiz_anal_id
    connection = get_connection()
    if not connection:
        return jsonify({"error": "Database connection failed."}), 500

    try:
        with connection.cursor() as cursor:
            # Query quiz_anal_score_statistics table
            query1 = """
            SELECT max_score, min_score, avg_score, median_score, mode_score, score_ranges
            FROM quiz_anal_score_statistics
            WHERE quiz_anal_id = %s
            """
            cursor.execute(query1, (quiz_anal_id,))
            score_stats = cursor.fetchone()

            # Query quiz_anal_each_question_statistics table
            query2 = """
            SELECT question_name, max_score, min_score, avg_score, score_dist
            FROM quiz_anal_each_question_statistics
            WHERE quiz_anal_id = %s
            """
            cursor.execute(query2, (quiz_anal_id,))
            question_stats = cursor.fetchall()

            if not score_stats:
                return jsonify({"error": "Statistics not found for the given quiz_anal_id."}), 404

            # Convert Decimal to float
            def convert_decimal(obj):
                return float(obj) if isinstance(obj, Decimal) else obj

            # Format statistics data
            stats = {
                "highest_score": convert_decimal(score_stats[0]),
                "lowest_score": convert_decimal(score_stats[1]),
                "average_score": convert_decimal(score_stats[2]),
                "median_score": convert_decimal(score_stats[3]),
                "mode_score": json.loads(score_stats[4]) if score_stats[4] else [],
                "score_distribution": json.loads(score_stats[5]) if score_stats[5] else {},
                "question_statistics": {}
            }

            # Add question statistics
            for question in question_stats:
                stats["question_statistics"][question[0]] = {
                    "highest_score": convert_decimal(question[1]),
                    "lowest_score": convert_decimal(question[2]),
                    "average_score": convert_decimal(question[3]),
                    "mode_score": json.loads(question[4]) if question[4] else []
                }

        # Prepare prompt for AI analysis
        prompt = (
            "以下是一次考试全班的成绩统计数据，请对这些成绩进行详细分析，包括哪道题失分多，总结共性问题等内容，"
            "并给出详细的分析结果。统计数据如下：\n"
            f"{json.dumps(stats, ensure_ascii=False)}"
        )

        # Call AI model for analysis
        ai_analysis = ai_assistant(prompt)

        # Update the database with AI analysis
        with connection.cursor() as cursor:
            query = """
            UPDATE upload_quiz_analysis_records
            SET ai_anal = %s
            WHERE quiz_anal_id = %s
            """
            cursor.execute(query, (ai_analysis, quiz_anal_id))
            connection.commit()

        # Cache the AI analysis
        #cache.set(cache_key, ai_analysis)

        return jsonify({"ai_analysis": ai_analysis}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        release_connection(connection)

@app.route('/update_ai_analysis/<quiz_anal_id>', methods=['GET'])
def update_ai_analysis(quiz_anal_id):
    """Endpoint to retrieve the AI analysis from the database by quiz_anal_id."""
    # Check cache first
    #cache_key = f"db_ai_analysis_{quiz_anal_id}"
    #cached_analysis = cache.get(cache_key)
    #if cached_analysis:
    #    return jsonify({"ai_analysis": cached_analysis}), 200
    
    # Query the database for the AI analysis
    connection = get_connection()
    if connection:
        try:
            with connection.cursor() as cursor:
                query = """
                SELECT ai_anal
                FROM upload_quiz_analysis_records
                WHERE quiz_anal_id = %s
                """
                cursor.execute(query, (quiz_anal_id,))
                result = cursor.fetchone()

                if result and result[0]:
                    # Cache the result
                    #cache.set(cache_key, result[0])
                    return jsonify({"ai_analysis": result[0]}), 200
                else:
                    return jsonify({"error": "AI analysis not found for the given quiz_anal_id."}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            release_connection(connection)
    else:
        return jsonify({"error": "Database connection failed."}), 500

@app.route('/delete_quiz_analysis/<quiz_anal_id>', methods=['DELETE'])
def delete_quiz_analysis(quiz_anal_id):
    """Endpoint to delete a specific quiz analysis by quiz_anal_id."""
    try:
        # Connect to the database
        connection = get_connection()
        if connection:
            with connection.cursor() as cursor:
                # Delete the record from upload_quiz_analysis_records table
                query = """
                DELETE FROM upload_quiz_analysis_records
                WHERE quiz_anal_id = %s
                """
                cursor.execute(query, (quiz_anal_id,))
                connection.commit()

                # Check if any rows were affected
                if cursor.rowcount == 0:
                    return jsonify({"error": "No record found with the given quiz_anal_id."}), 404

        return jsonify({"message": "Quiz analysis deleted successfully."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

if __name__ == '__main__':
    app.run("0.0.0.0", debug=True)