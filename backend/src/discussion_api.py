from flask import Flask, request, jsonify
from flask_cors import CORS
import datetime
import random
import string
from src.db_connection import get_connection, release_connection
import json

app = Flask(__name__)

# Enable CORS for the Flask app
CORS(app)

def generate_post_id():
    """Generate a unique post ID."""
    return 'post_' + ''.join(random.choices(string.digits, k=3))

@app.route('/api/discussions/create', methods=['POST'])
def create_discussion():
    """Endpoint to create a new discussion post."""
    if request.method == 'OPTIONS':
        return '', 200
    data = request.get_json()

    # Validate input
    required_fields = ["type", "title", "content", "isAnonymous", "authorId", "authorName", "userRole"]
    if not data or not all(field in data for field in required_fields):
        return jsonify({"success": False, "message": "Invalid input. Please provide all required fields."}), 400

    # Extract data
    diss_id = generate_post_id()
    created_at = datetime.datetime.utcnow()

    try:
        connection = get_connection()
        if connection:
            with connection.cursor() as cursor:
                # Insert data into the discussions table
                query = """
                INSERT INTO discussions (diss_id, type, title, content, isAnonymous, authorId, authorName, userRole, createAt, likes, likeBy, replies)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(query, (
                    diss_id, data["type"], data["title"], data["content"], data["isAnonymous"],
                    data["authorId"], data["authorName"], data["userRole"], created_at, 0, "[]", "[]"
                ))
                connection.commit()

        post = {
            "id": diss_id,
            "authorName": data["authorName"],
            "authorId": data["authorId"],
            "userRole": data["userRole"],
            "isAnonymous": data["isAnonymous"],
            "type": data["type"],
            "title": data["title"],
            "content": data["content"],
            "createdAt": created_at,
            "likes": 0,
            "likedBy": [],
            "replies": []
        }

        # Return response
        return jsonify({
            "success": True,
            "message": "Discussion posted successfully!",
            "post": post
        }), 201

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if connection:
            release_connection(connection)

@app.route('/api/discussions/<post_id>/like', methods=['PUT'])
def like_discussion(post_id):
    """Endpoint to like a discussion post."""
    data = request.get_json()

    # Validate input
    if not data or 'userId' not in data:
        return jsonify({"success": False, "message": "Invalid input. Please provide 'userId'."}), 400

    user_id = data['userId']

    try:
        connection = get_connection()
        if connection:
            with connection.cursor() as cursor:
                # Fetch current likes and likedBy
                query = "SELECT likes, likeBy FROM discussions WHERE diss_id = %s"
                cursor.execute(query, (post_id,))
                result = cursor.fetchone()

                if not result:
                    return jsonify({"success": False, "message": "Post not found."}), 404

                likes, liked_by = result
                liked_by = json.loads(liked_by) if liked_by else []

                # Check if user already liked the post
                if user_id in liked_by:
                    # Unlike the post
                    liked_by.remove(user_id)
                    likes -= 1
                else:
                    # Like the post
                    liked_by.append(user_id)
                    likes += 1

                # Update likes and likedBy
                update_query = "UPDATE discussions SET likes = %s, likeBy = %s WHERE diss_id = %s"
                cursor.execute(update_query, (likes, json.dumps(liked_by), post_id))
                connection.commit()

        # Return updated likes and likedBy
        return jsonify({
            "success": True,
            "likes": likes,
            "likedBy": liked_by
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if connection:
            release_connection(connection)

@app.route('/api/discussions/<post_id>/replies', methods=['POST'])
def add_reply(post_id):
    """Endpoint to add a reply to a discussion post."""
    data = request.get_json()

    # Validate input
    required_fields = ["content", "isAnonymous", "authorId", "authorName", "userRole"]
    if not data or not all(field in data for field in required_fields):
        return jsonify({"success": False, "message": "Invalid input. Please provide all required fields."}), 400

    # Generate reply ID and timestamp
    reply_id = 'reply_' + ''.join(random.choices(string.digits, k=3))
    created_at = datetime.datetime.utcnow().isoformat() + 'Z'

    try:
        connection = get_connection()
        if connection:
            with connection.cursor() as cursor:
                # Fetch current replies
                query = "SELECT replies FROM discussions WHERE diss_id = %s"
                cursor.execute(query, (post_id,))
                result = cursor.fetchone()

                if not result:
                    return jsonify({"success": False, "message": "Post not found."}), 404

                replies = json.loads(result[0]) if result[0] else []

                # Create the new reply
                reply = {
                    "id": reply_id,
                    "authorName": data["authorName"],
                    "authorId": data["authorId"],
                    "userRole": data["userRole"],
                    "isAnonymous": data["isAnonymous"],
                    "content": data["content"],
                    "createdAt": created_at,
                    "likes": 0,
                    "likedBy": []
                }

                # Append the new reply to the list
                replies.append(reply)

                # Update the database
                update_query = "UPDATE discussions SET replies = %s WHERE diss_id = %s"
                cursor.execute(update_query, (json.dumps(replies), post_id))
                connection.commit()

        # Return the new reply
        return jsonify({
            "success": True,
            "reply": reply
        }), 201

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if connection:
            release_connection(connection)

@app.route('/api/discussions', methods=['GET'])
def get_discussions():
    """Endpoint to fetch all discussions and questions."""
    try:
        connection = get_connection()
        if connection:
            with connection.cursor() as cursor:
                # Fetch public discussions
                cursor.execute("SELECT diss_id, title, authorName, authorId, createAt, type, likes, replies FROM discussions WHERE type = 'discussion'")
                discussions = cursor.fetchall()

                public_discussions = []
                for discussion in discussions:
                    diss_id, title, author_name, author_id, created_at, diss_type, likes, replies = discussion
                    replies = json.loads(replies) if replies else []

                    formatted_replies = [
                        {
                            "id": reply["id"],
                            "authorName": reply["authorName"],
                            "content": reply["content"],
                            "createdAt": reply["createdAt"]
                        }
                        for reply in replies
                    ]

                    public_discussions.append({
                        "id": diss_id,
                        "title": title,
                        "authorName": author_name,
                        "authorId": author_id,
                        "createdAt": created_at,
                        "type": diss_type,
                        "likes": likes,
                        "replies": formatted_replies
                    })

                # Fetch questions
                cursor.execute("SELECT diss_id, title, authorName, authorId, createAt, type, content, likes, replies FROM discussions ")
                questions = cursor.fetchall()

                formatted_questions = [
                    {
                        "id": question[0],
                        "title": question[1],
                        "authorName": question[2],
                        "authorId": question[3],
                        "createdAt": question[4],
                        "type": question[5],
                        "content": question[6],
                        "likes": question[7],
                        "replies": []
                    }
                    for question in questions
                ]

        return jsonify({
            "success": True,
            "message": "Discussions fetched successfully",
            "publicDiscussions": public_discussions,
            "questions": formatted_questions
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if connection:
            release_connection(connection)

if __name__ == '__main__':
    app.run(debug=True)