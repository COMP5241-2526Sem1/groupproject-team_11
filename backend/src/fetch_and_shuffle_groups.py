from src.db_connection import release_connection, get_connection
import random

def fetch_and_shuffle_groups(course_id):
    """Fetch unique groups from the course table, shuffle them, and return."""
    connection = get_connection()

    if not connection:
        raise Exception("Failed to connect to the database.")

    try:
        cursor = connection.cursor()

        # Construct the table name dynamically
        table_name = f"student_list_c{course_id}"

        # Fetch all groups from the table
        cursor.execute(f"SELECT DISTINCT `group` FROM {table_name}")
        rows = cursor.fetchall()

        # Extract groups from the query result and shuffle them
        groups = [row[0] for row in rows]
        random.shuffle(groups)

        return groups

    finally:
        release_connection(connection)