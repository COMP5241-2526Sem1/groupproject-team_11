import os
from dotenv import load_dotenv
import pymysql
from dbutils.pooled_db import PooledDB


# Load environment variables from .env file
#load_dotenv("venv/.env")

# Retrieve database connection details from environment variables
db_config = {
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "database": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
}

# Initialize the connection pool
pool = PooledDB(
    creator=pymysql,
    maxconnections=10,  # Maximum number of connections in the pool
    mincached=2,        # Minimum number of idle connections
    maxcached=5,        # Maximum number of idle connections
    blocking=True,      # Block if no connections are available
    ping=1,             # Ping MySQL server to check if connection is alive
    **db_config
)

def get_connection():
    """Get a connection from the pool."""
    try:
        connection = pool.connection()
        if connection:
            print("Successfully retrieved a connection from the pool.")
        return connection
    except Exception as e:
        print(f"Error getting connection from pool: {e}")
        return None

def release_connection(connection):
    """Release a connection back to the pool."""
    try:
        if connection:
            connection.close()  # Returns connection to the pool
            print("Connection released back to the pool.")
    except Exception as e:
        print(f"Error releasing connection back to pool: {e}")

def main():
    # Example usage of the connection pool
    connection = get_connection()

    if connection:
        try:
            # Create a cursor to execute queries
            cursor = connection.cursor()

            # Example query: Fetch all rows from a table
            cursor.execute("SELECT * FROM course")
            rows = cursor.fetchall()

            # Print the results
            print("=== Query Results ===")
            for row in rows:
                print(row)

            # Close the cursor
            cursor.close()
        except Exception as e:
            print(f"Error executing query: {e}")
        finally:
            # Release the connection back to the pool
            release_connection(connection)

if __name__ == "__main__":
    main()