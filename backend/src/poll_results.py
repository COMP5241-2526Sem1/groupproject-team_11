import json
from flask import Flask, request, jsonify
from src.db_connection import release_connection, get_connection
import matplotlib.pyplot as plt
import os
import re
from flask_caching import Cache

app = Flask(__name__)

# Configure caching
#cache = Cache(app, config={
#    'CACHE_TYPE': 'RedisCache',
#    'CACHE_REDIS_URL': 'redis://49.232.227.144:6379/0',
#    'CACHE_DEFAULT_TIMEOUT': 3600  # Default timeout: 1 hour
#})

@app.route('/api/studentpoll/<poll_id>/results', methods=['GET'])
#@cache.cached(timeout=3600)
def get_poll_results(poll_id):
    """Endpoint to get poll results and return data for interactive charts."""
    try:
        # Retrieve poll answers from the database
        connection = get_connection()
        if connection:
            with connection.cursor() as cursor:
                query = """
                SELECT question_id, question_type, answer
                FROM poll_answer
                WHERE poll_id = %s AND question_type IN ('Single Choice', 'Multiple Choice', 'Scale')
                """
                cursor.execute(query, (poll_id,))
                results = cursor.fetchall()

        if not results:
            return jsonify({"error": "No results found for the given poll_id."}), 404

        # Process results by question type
        data = {}
        for question_id, question_type, answer in results:
            if question_id not in data:
                data[question_id] = {"type": question_type, "answers": []}
            data[question_id]["answers"].append(answer)

        # Prepare data for interactive charts
        chart_data = []
        for question_id, details in data.items():
            question_type = details["type"]
            answers = details["answers"]

            # Count answer frequencies
            answer_counts = {}
            for ans in answers:
                if question_type == "multiple_choice":
                    # Split multiple choice answers into individual options
                    options = ans.split(",")
                    for option in options:
                        answer_counts[option] = answer_counts.get(option, 0) + 1
                else:
                    answer_counts[ans] = answer_counts.get(ans, 0) + 1

            # Append data for this question
            chart_data.append({
                "question_id": question_id,
                "question_type": question_type,
                "answer_counts": answer_counts
            })

        return jsonify({"chart_data": chart_data}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/studentpoll/<poll_id>/text_results', methods=['GET'])
#@cache.cached(timeout=3600)
def get_text_poll_results(poll_id):
    """Endpoint to get text poll results and return data for word cloud generation."""
    try:
        # Retrieve text answers from the database
        connection = get_connection()
        if connection:
            with connection.cursor() as cursor:
                query = """
                SELECT user_id, answer
                FROM poll_answer
                WHERE poll_id = %s AND question_type = 'Text'
                """
                cursor.execute(query, (poll_id,))
                results = cursor.fetchall()

        if not results:
            return jsonify({"error": "No text answers found for the given poll_id."}), 404

        # Define a list of stop words to exclude
        stop_words = set(["the", "is", "in", "and", "to", "of", "a", "an", "it", "on", "for", "with", "as", "by", "at", "this", "that", "these", "those", "be", "are", "was", "were", "has", "have", "had", "do", "does", "did", "but", "or", "if", "then", "so", "because", "about", "from", "up", "down", "out", "over", "under", "again", "further", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "than", "too", "very"])

        # Process results for word frequency and individual answers
        word_frequency = {}
        user_answers = []

        for user_id, answer in results:
            user_answers.append({"user_id": user_id, "answer": answer})

            # Count word frequencies, excluding stop words
            words = re.findall(r'\b\w+\b', answer.lower())
            for word in words:
                if word not in stop_words:
                    word_frequency[word] = word_frequency.get(word, 0) + 1

        return jsonify({
            "word_frequency": word_frequency,
            "user_answers": user_answers
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run("0.0.0.0", debug=True)