import os
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from docx import Document
import fitz  # PyMuPDF for PDF processing
from src.LLM import ai_assistant

class FileProcessor:
    UPLOAD_FOLDER = './uploads'
    ALLOWED_EXTENSIONS = {'docx', 'pdf'}

    def __init__(self):
        if not os.path.exists(self.UPLOAD_FOLDER):
            os.makedirs(self.UPLOAD_FOLDER)

    def allowed_file(self, filename):
        """Check if the file is allowed."""
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in self.ALLOWED_EXTENSIONS

    def extract_text_from_docx(self, filepath):
        """Extract text from a Word document."""
        doc = Document(filepath)
        return '\n'.join([p.text for p in doc.paragraphs if p.text.strip()])

    def extract_text_from_pdf(self, filepath):
        """Extract text from a PDF file."""
        text = ""
        with fitz.open(filepath) as pdf:
            for page in pdf:
                text += page.get_text()
        return text

    def process_file(self, file):
        """Process the uploaded file and extract text."""
        if not file or not self.allowed_file(file.filename):
            raise ValueError("Invalid file type. Only .docx and .pdf files are allowed.")

        filename = secure_filename(file.filename)
        filepath = os.path.join(self.UPLOAD_FOLDER, filename)
        file.save(filepath)

        try:
            if filename.endswith('.docx'):
                return self.extract_text_from_docx(filepath)
            elif filename.endswith('.pdf'):
                return self.extract_text_from_pdf(filepath)
            else:
                raise ValueError("Unsupported file type.")
        finally:
            os.remove(filepath)  # Clean up the uploaded file

# Flask integration
file_processor = FileProcessor()

app = Flask(__name__)

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

if __name__ == '__main__':
    app.run("0.0.0.0", debug=True)