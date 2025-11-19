import random
from src.db_connection import release_connection, get_connection

def fetch_random_usernames(course_id, num_students):
    """Fetch random usernames from the student_list_c{course_id} table."""
    connection = get_connection()
    if not connection:
        
        raise Exception("Failed to connect to the database.")

    try:
        cursor = connection.cursor()

        # Construct the table name dynamically
        table_name = f"student_list_c{course_id}"

        # Fetch all usernames from the table
        cursor.execute(f"SELECT username FROM {table_name}")
        rows = cursor.fetchall()

        # Extract usernames from the query result
        usernames = [row[0] for row in rows]

        # Randomly select the specified number of usernames
        if len(usernames) < num_students:
            print("Not enough students in the table to select from.")
            return

        selected_usernames = random.sample(usernames, num_students)

        return selected_usernames

    
    finally:
        release_connection(connection)

