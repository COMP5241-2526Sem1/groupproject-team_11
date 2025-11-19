import os
from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
from src.db_connection import get_connection, release_connection

# Create a Blueprint for mind map routes
mindmap_bp = Blueprint('mindmap', __name__)

@mindmap_bp.route('/api/mind-maps/<mind_map_id>', methods=['GET'])

def get_mind_map(mind_map_id):
    """Endpoint to retrieve a specific mind map by its ID."""
    if request.method == 'OPTIONS':
        return '', 200
    try:
        connection = get_connection()
        if not connection:
            return jsonify({"success": False, "error": "Database connection failed."}), 500
        
        with connection.cursor() as cursor:
            # Query the mind_map_result table for the specific mind map
            query = """
                SELECT mind_map_id, title, markdownCode, created_time, updated_time
                FROM mind_map_result
                WHERE mind_map_id = %s
            """
            cursor.execute(query, (mind_map_id,))
            result = cursor.fetchone()
            
            if not result:
                return jsonify({"success": False, "error": "Mind map not found."}), 404
            
            # Extract data from the result
            mind_map_id = result[0]
            title = result[1]
            mind_map_data = result[2]  # This should be the markdown content
            created_time = result[3]
            updated_time = result[4]
            
            # Format the response
            response = {
                "success": True,
                "activity": {
                    "id": mind_map_id,
                    "title": title,
                    "type": "Mind Map",
                    "activityType": "mind-map",
                    "thumbnail": title,  # Using title as thumbnail
                    "markdownCode": mind_map_data if mind_map_data else ""
                }
            }
            
            return jsonify(response), 200
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)


@mindmap_bp.route('/api/mind-maps/create', methods=['POST'])
def create_mind_map():
    """Endpoint to create a new mind map activity."""
    try:
        data = request.get_json()
        if not data or not all(key in data for key in ['title', 'markdownCode']):
            return jsonify({"success": False, "error": "Invalid input. Please provide 'title' and 'markdownCode' in JSON body."}), 400

        title = data['title']
        markdown_code = data['markdownCode']
        thumbnail = data.get('thumbnail', title)

        # Generate a unique ID for the mind map
        mind_map_id = f"mm_{generate_unique_id()}"

        connection = get_connection()
        if not connection:
            return jsonify({"success": False, "error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # Insert the new mind map into the mind_map_result table
            query = """
                INSERT INTO mind_map_result (mind_map_id, title, markdownCode, created_time)
                VALUES (%s, %s, %s, NOW())
            """
            cursor.execute(query, (mind_map_id, title, markdown_code))
            connection.commit()

        # Prepare the response
        from datetime import datetime
        created_at = int(datetime.now().timestamp() * 1000)
        response = {
            "success": True,
            "activity": {
                "id": mind_map_id,
                "title": title,
                "markdownCode": markdown_code,
                "createdAt": created_at
            }
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

@mindmap_bp.route('/api/mind-maps/update/<mind_map_id>', methods=['PUT'])
def update_mind_map(mind_map_id):
    """Endpoint to update an existing mind map activity."""
    try:
        data = request.get_json()
        if not data or not all(key in data for key in ['title', 'markdownCode']):
            return jsonify({"success": False, "error": "Invalid input. Please provide 'title' and 'markdownCode' in JSON body."}), 400

        title = data['title']
        markdown_code = data['markdownCode']

        connection = get_connection()
        if not connection:
            return jsonify({"success": False, "error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # Update the mind map in the mind_map_result table
            query = """
                UPDATE mind_map_result
                SET title = %s, markdownCode = %s, updated_time = NOW()
                WHERE mind_map_id = %s
            """
            cursor.execute(query, (title, markdown_code, mind_map_id))
            connection.commit()

        # Prepare the response
        from datetime import datetime
        updated_at = int(datetime.now().timestamp() * 1000)
        response = {
            "success": True,
            "activity": {
                "id": mind_map_id,
                "title": title,
                "markdownCode": markdown_code,
                "updatedAt": updated_at
            }
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

@mindmap_bp.route('/api/mind-maps', methods=['GET'])
def get_all_mind_maps():
    """Endpoint to retrieve all mind maps."""
    try:
        connection = get_connection()
        if not connection:
            return jsonify({"success": False, "error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # Query all mind maps from the mind_map_result table
            query = """
                SELECT mind_map_id, title, markdownCode, UNIX_TIMESTAMP(created_time) * 1000 AS createdAt
                FROM mind_map_result
            """
            cursor.execute(query)
            results = cursor.fetchall()

            # Format the results into a list of dictionaries
            mind_maps = [
                {
                    "id": row[0],
                    "title": row[1],
                    "thumbnail": row[1],  # Using title as thumbnail
                    "createdAt": int(row[3])
                }
                for row in results
            ]

        return jsonify({"success": True, "mindMaps": mind_maps}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        if connection:
            release_connection(connection)

@mindmap_bp.route('/api/mind-maps/<mind_map_id>', methods=['DELETE'])
def delete_mind_map(mind_map_id):
    """Endpoint to delete a mind map by its ID."""
    try:
        connection = get_connection()
        if not connection:
            return jsonify({"success": False, "error": "Database connection failed."}), 500

        with connection.cursor() as cursor:
            # Delete from mind_map_result table
            query = "DELETE FROM mind_map_result WHERE mind_map_id = %s"
            cursor.execute(query, (mind_map_id,))

            connection.commit()

        return jsonify({"success": True}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if connection:
            release_connection(connection)

def generate_unique_id():
    """Generate a unique ID for the mind map."""
    import random
    import string
    return ''.join(random.choices(string.digits, k=3))

# If running as standalone app (for testing)
if __name__ == '__main__':
    app = Flask(__name__)
    CORS(app)
    app.register_blueprint(mindmap_bp)
    app.run("0.0.0.0", debug=True, port=5001)
