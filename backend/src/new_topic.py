from flask import Flask, request, jsonify
import uuid
from src.LLM import ai_assistant

app = Flask(__name__)

@app.route('/api/ass_topic/new', methods=['POST'])
def create_new_topic():
    """Endpoint to create a new topic."""
    try:
        # Parse the JSON request body
        data = request.get_json()
        if not data or 'uid' not in data:
            return jsonify({"success": False, "error": "Invalid input. Please provide 'uid' in JSON body."}), 400

        uid = data['uid']

        # Generate a unique chat ID
        chat_id = str(uuid.uuid4())

        # Prepare the response
        response = {
            "success": True,
            "chat_id": chat_id,
            "welcomeMessage": "Hello there, how can I assist you today?",
            "conversationHistory": []
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/ai_ass/chat', methods=['POST'])
def ai_assistant_chat():
    """Endpoint to handle AI assistant chat messages."""
    try:
        # Parse the JSON request body
        data = request.get_json()
        if not data or not all(key in data for key in ['uid', 'message', 'chat_id']):
            return jsonify({"success": False, "error": "Invalid input. Please provide 'uid', 'message', and 'chat_id' in JSON body."}), 400

        uid = data['uid']
        message = data['message']
        chat_id = data['chat_id']

        # Call the AI assistant to generate a response
        content = ai_assistant(message)

        # Prepare the response
        response = {
            "success": True,
            "content": content,
            "chatId": chat_id,
            "conversationHistory": []
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=3000, debug=True)