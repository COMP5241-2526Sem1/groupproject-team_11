import os
import pandas as pd
from werkzeug.utils import secure_filename
from src.db_connection import release_connection, get_connection

class StudentImporter:
    UPLOAD_FOLDER = './uploads'
    ALLOWED_EXTENSIONS = {'xlsx'}

    def __init__(self):
        if not os.path.exists(self.UPLOAD_FOLDER):
            os.makedirs(self.UPLOAD_FOLDER)

    def allowed_file(self, filename):
        """Check if the file is allowed."""
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in self.ALLOWED_EXTENSIONS

    def import_students(self, file):
        """Import student data from an Excel file into the database."""
        if not file or not self.allowed_file(file.filename):
            raise ValueError("Invalid file type. Only .xlsx files are allowed.")

        filename = secure_filename(file.filename)
        filepath = os.path.join(self.UPLOAD_FOLDER, filename)
        file.save(filepath)

        try:
            # Read the Excel file
            df = pd.read_excel(filepath)

            # Check if required columns exist
            required_columns = {'name', 'student_id', 'group'}
            if not required_columns.issubset(df.columns):
                raise ValueError(f"Excel file must contain columns: {required_columns}")

            # Connect to the database
            connection = get_connection()
            if not connection:
                raise ConnectionError("Failed to connect to the database.")

            try:
                cursor = connection.cursor()

                # Insert data into the database
                for _, row in df.iterrows():
                    username = row['name']
                    uid = row['student_id']
                    group = row['group']
                    coursename = row['coursename']
                    cid = row['course_id']


                    # Assuming the database table is named 'students'
                    table_name = f"student_list_c{cid}"
                    sql = f"""
                    INSERT INTO {table_name}
                    (username, uid, `group`, cname, cid)
                    VALUES (%s, %s, %s, %s, %s)
                    """
                    values = (username, uid, group, coursename, cid)
                    cursor.execute(
                        sql,
                        values
                    )

                connection.commit()
            finally:
                release_connection(connection)

        finally:
            # Remove the uploaded file
            os.remove(filepath)