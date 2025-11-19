from flask import Blueprint, request, jsonify
from src.db_connection import get_connection, release_connection
from datetime import datetime
from src.auth_decorator import login_required

course_routes = Blueprint('course_routes', __name__)

@course_routes.route('/api/courses/create', methods=['POST'])
##@login_required
def create_course():
    """Endpoint to create a new course."""
    #user_id = request.user_id  # 从装饰器中获取     

    data = request.get_json()

    # Validate required fields only
    required_fields = ["code", "title", "schedule", "students", "status"]
    if not data or not all(field in data for field in required_fields):
        return jsonify({"success": False, "message": "Invalid input. Please provide all required fields."}), 400

    course_code = data['code']
    course_title = data['title']
    schedule = data['schedule']
    students = data['students']
    year = data.get('year', '')
    semester = data.get('semester', '')
    weekday = data.get('weekday', '')
    class_time = data.get('classTime', '')
    capacity = data.get('capacity', '')
    status = data['status']
    student_list = data.get('studentList', [])  # Optional student list

    try:
        # Get database connection
        connection = get_connection()
        cursor = connection.cursor()

        # Insert course into the database
        cursor.execute(
            """
            INSERT INTO course (cid, cname, schedule, studentNumber, year, semester, weekday, class_time, capacity, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (course_code, course_title, schedule, students, year, semester, weekday, class_time, capacity, status, datetime.now())
        )

        # Create a new table for the course's student list
        student_list_table = f"student_list_{course_code}"
        create_table_query = f"""
            CREATE TABLE IF NOT EXISTS {student_list_table} (
                uid VARCHAR(255) NOT NULL,
                username VARCHAR(255) NOT NULL,
                grade FLOAT DEFAULT NULL,
                cname VARCHAR(255) NOT NULL,
                cid VARCHAR(255) NOT NULL,
                `group` VARCHAR(255) DEFAULT NULL,
                PRIMARY KEY (uid)
            )
        """
        cursor.execute(create_table_query)

        # Insert student list if provided
        if student_list:
            insert_student_query = f"""
                INSERT INTO {student_list_table} (uid, username, cname, cid, `group`)
                VALUES (%s, %s, %s, %s, %s)
            """
            for student in student_list:
                student_id = student.get('student_id')
                student_name = student.get('name')
                student_group = student.get('group', None)
                
                if student_id and student_name:
                    cursor.execute(insert_student_query, (student_id, student_name, course_title, course_code, student_group))

        # Commit the transaction
        connection.commit()

        # Respond with success
        return jsonify({
            "course": {
                "id": course_code,
                "code": course_code,
                "title": course_title,
                "schedule": schedule,
                "students": students,
                "year": year,
                "semester": semester,
                "weekday": weekday,
                "classTime": class_time,
                "capacity": capacity,
                "status": status
            }
        }), 201

    except Exception as e:
        if connection:
            connection.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            release_connection(connection)

@course_routes.route('/api/courses/delete/<id>', methods=['DELETE'])
#@login_required
def delete_course(id):
    """Endpoint to delete a course by its cid."""
    #user_id = request.user_id  # 从装饰器中获取     
    try:
        # Get database connection
        connection = get_connection()
        cursor = connection.cursor()

        # Delete the course from the database
        cursor.execute("DELETE FROM course WHERE cid = %s", (id,))

        # Check if any row was deleted
        if cursor.rowcount == 0:
            return jsonify({"success": False, "message": "Course not found."}), 404

        # Commit the transaction
        connection.commit()

        # Respond with success
        return jsonify({"success": True, "message": "Course deleted successfully"}), 200

    except Exception as e:
        if connection:
            connection.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            release_connection(connection)

@course_routes.route('/api/courses/update/<editingId>', methods=['PUT'])
##@login_required
def update_course(editingId):
    """Endpoint to update a course by its cid."""
    #user_id = request.user_id  # 从装饰器中获取
    data = request.get_json()

    # Validate required fields only
    required_fields = ["code", "title", "schedule", "students", "status"]
    if not data or not all(field in data for field in required_fields):
        return jsonify({"success": False, "message": "Invalid input. Please provide all required fields."}), 400

    new_course_code = data['code']
    course_title = data['title']
    schedule = data['schedule']
    students = data['students']
    year = data.get('year', '')
    semester = data.get('semester', '')
    weekday = data.get('weekday', '')
    class_time = data.get('classTime', '')
    capacity = data.get('capacity', '')
    status = data['status']
    student_list = data.get('studentList', [])  # Optional student list

    try:
        # Get database connection
        connection = get_connection()
        cursor = connection.cursor()

        # Update the course in the database
        cursor.execute(
            """
            UPDATE course
            SET cid = %s, cname = %s, schedule = %s, studentNumber = %s, year = %s, semester = %s, 
                weekday = %s, class_time = %s, capacity = %s, status = %s
            WHERE cid = %s
            """,
            (new_course_code, course_title, schedule, students, year, semester, weekday, class_time, capacity, status, editingId)
        )

        # Check if any row was updated
        if cursor.rowcount == 0:
            return jsonify({"success": False, "message": "Course not found."}), 404

        # If course code changed, rename the student list table
        if new_course_code != editingId:
            old_student_list_table = f"student_list_{editingId}"
            new_student_list_table = f"student_list_{new_course_code}"
            
            # Check if old table exists
            cursor.execute(f"SHOW TABLES LIKE '{old_student_list_table}'")
            if cursor.fetchone():
                cursor.execute(f"RENAME TABLE {old_student_list_table} TO {new_student_list_table}")
                
                # Update cid in the student list table
                cursor.execute(f"UPDATE {new_student_list_table} SET cid = %s, cname = %s WHERE cid = %s", 
                             (new_course_code, course_title, editingId))
        
        # Update student list if provided
        if student_list:
            student_list_table = f"student_list_{new_course_code}"
            
            # Create table if it doesn't exist
            create_table_query = f"""
                CREATE TABLE IF NOT EXISTS {student_list_table} (
                    uid VARCHAR(255) NOT NULL,
                    username VARCHAR(255) NOT NULL,
                    grade FLOAT DEFAULT NULL,
                    cname VARCHAR(255) NOT NULL,
                    cid VARCHAR(255) NOT NULL,
                    `group` VARCHAR(255) DEFAULT NULL,
                    PRIMARY KEY (uid)
                )
            """
            cursor.execute(create_table_query)
            
            # Clear existing students
            cursor.execute(f"DELETE FROM {student_list_table}")
            
            # Insert updated student list
            insert_student_query = f"""
                INSERT INTO {student_list_table} (uid, username, cname, cid, `group`)
                VALUES (%s, %s, %s, %s, %s)
            """
            for student in student_list:
                student_id = student.get('student_id')
                student_name = student.get('name')
                student_group = student.get('group', None)
                
                if student_id and student_name:
                    cursor.execute(insert_student_query, (student_id, student_name, course_title, new_course_code, student_group))

        # Commit the transaction
        connection.commit()

        # Respond with success
        return jsonify({
            "success": True,
            "message": "Course updated successfully",
            "course": {
                "id": new_course_code,
                "code": new_course_code,
                "title": course_title,
                "schedule": schedule,
                "students": students,
                "year": year,
                "semester": semester,
                "weekday": weekday,
                "classTime": class_time,
                "capacity": capacity,
                "status": status
            }
        }), 200

    except Exception as e:
        if connection:
            connection.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            release_connection(connection)

@course_routes.route('/api/courses', methods=['GET'])
#@login_required
    
def get_courses():
    """Endpoint to fetch the list of courses."""
    #user_id = request.user_id  # 从装饰器中获取
    #role = request.role
    try:
        # Get database connection
        connection = get_connection()
        cursor = connection.cursor()

        # Query all courses from the database
        cursor.execute(
            """
            SELECT cid, cid AS code, cname AS title, schedule, studentNumber AS students, year, semester, 
                   weekday, class_time AS classTime, capacity, status
            FROM course 
            """
            #where uid = %s
        )
        courses = cursor.fetchall()

        # Format the courses into a list of dictionaries
        course_list = []
        for course in courses:
            course_dict = {
                "id": course[0],
                "code": course[1],
                "title": course[2],
                "schedule": course[3],
                "students": course[4],
                "status": course[10]
            }
            
            # Add optional fields only if they have values
            if course[5]:  # year
                course_dict["year"] = course[5]
            if course[6]:  # semester
                course_dict["semester"] = course[6]
            if course[7]:  # weekday
                course_dict["weekday"] = course[7]
            if course[8]:  # classTime
                course_dict["classTime"] = course[8]
            if course[9]:  # capacity
                course_dict["capacity"] = course[9]
            
            course_list.append(course_dict)

        # Respond with the course list
        return jsonify({"success": True,"courses": course_list}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            release_connection(connection)

@course_routes.route('/api/courses/<courseId>/students', methods=['GET'])
#@login_required
def get_course_students(courseId):
    """Endpoint to fetch the student list for a specific course."""
    try:
        # Get database connection
        connection = get_connection()
        cursor = connection.cursor()

        # Query students from the course-specific student list table
        student_list_table = f"student_list_{courseId}"
        query = f"""
            SELECT username, uid, `group`
            FROM {student_list_table}
        """
        cursor.execute(query)
        students = cursor.fetchall()

        # Format the students into a list of dictionaries
        student_list = []
        for student in students:
            student_dict = {
                "name": student[0],
                "student_id": student[1]
            }
            
            # Add group field only if it has a value
            if student[2]:
                student_dict["group"] = student[2]
            
            student_list.append(student_dict)

        # Respond with the student list
        return jsonify({"success": True, "students": student_list}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            release_connection(connection)

@course_routes.route('/api/courses/<courseId>/students/create', methods=['POST'])
#@login_required
def add_course_student(courseId):
    """Endpoint to add a student to a specific course."""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not all(field in data for field in ['name', 'courseId']):
            return jsonify({"success": False, "message": "Invalid input. Please provide 'name' and 'courseId'."}), 400
        
        student_name = data['name']
        course_id = data['courseId']
        student_id = data.get('student_id', student_name)  # Use name as ID if not provided
        student_group = data.get('group', None)
        
        # Verify courseId matches the URL parameter
        if course_id != courseId:
            return jsonify({"success": False, "message": "CourseId mismatch."}), 400
        
        # Get database connection
        connection = get_connection()
        cursor = connection.cursor()
        
        # Get course details
        cursor.execute("SELECT cname FROM course WHERE cid = %s", (course_id,))
        course_result = cursor.fetchone()
        
        if not course_result:
            return jsonify({"success": False, "message": "Course not found."}), 404
        
        course_name = course_result[0]
        
        # Insert student into the course's student list table
        student_list_table = f"student_list_{course_id}"
        
        # Create table if it doesn't exist
        create_table_query = f"""
            CREATE TABLE IF NOT EXISTS {student_list_table} (
                uid VARCHAR(255) NOT NULL,
                username VARCHAR(255) NOT NULL,
                grade FLOAT DEFAULT NULL,
                cname VARCHAR(255) NOT NULL,
                cid VARCHAR(255) NOT NULL,
                `group` VARCHAR(255) DEFAULT NULL,
                PRIMARY KEY (uid)
            )
        """
        cursor.execute(create_table_query)
        
        # Insert the student
        insert_query = f"""
            INSERT INTO {student_list_table} (uid, username, cname, cid, `group`)
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(insert_query, (student_id, student_name, course_name, course_id, student_group))
        
        # Commit the transaction
        connection.commit()
        
        # Respond with success
        return jsonify({
            "success": True,
            "message": "Student added successfully",
            "student": {
                "name": student_name,
                "student_id": student_id,
                "group": student_group
            }
        }), 201
        
    except Exception as e:
        if connection:
            connection.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    
    finally:
        if cursor:
            cursor.close()
        if connection:
            release_connection(connection)

@course_routes.route('/api/courses/<courseId>/students/delete/<studentId>', methods=['DELETE'])
#@login_required
def delete_course_student(courseId, studentId):
    """Endpoint to delete a student from a specific course."""
    try:
        # Get database connection
        connection = get_connection()
        cursor = connection.cursor()
        
        # Verify course exists
        cursor.execute("SELECT cid FROM course WHERE cid = %s", (courseId,))
        if not cursor.fetchone():
            return jsonify({"success": False, "message": "Course not found."}), 404
        
        # Delete student from the course's student list table
        student_list_table = f"student_list_{courseId}"
        
        # Check if the table exists
        cursor.execute(f"SHOW TABLES LIKE '{student_list_table}'")
        if not cursor.fetchone():
            return jsonify({"success": False, "message": "Student list table not found."}), 404
        
        # Delete the student
        delete_query = f"DELETE FROM {student_list_table} WHERE uid = %s"
        cursor.execute(delete_query, (studentId,))
        
        # Check if any row was deleted
        if cursor.rowcount == 0:
            return jsonify({"success": False, "message": "Student not found in this course."}), 404
        
        # Commit the transaction
        connection.commit()
        
        # Respond with success
        return jsonify({
            "success": True,
            "message": "Student deleted successfully"
        }), 200
        
    except Exception as e:
        if connection:
            connection.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    
    finally:
        if cursor:
            cursor.close()
        if connection:
            release_connection(connection)

@course_routes.route('/api/courses/<courseId>/groups', methods=['GET'])
#@login_required
def get_course_groups(courseId):
    """Endpoint to fetch all unique groups for a specific course."""
    try:
        # Get database connection
        connection = get_connection()
        cursor = connection.cursor()
        
        # Verify course exists
        cursor.execute("SELECT cid FROM course WHERE cid = %s", (courseId,))
        if not cursor.fetchone():
            return jsonify({"success": False, "message": "Course not found."}), 404
        
        # Query unique groups from the course's student list table
        student_list_table = f"student_list_{courseId}"
        
        # Check if the table exists
        cursor.execute(f"SHOW TABLES LIKE '{student_list_table}'")
        if not cursor.fetchone():
            return jsonify({"success": True, "groups": []}), 200
        
        # Get distinct groups
        query = f"""
            SELECT DISTINCT `group`
            FROM {student_list_table}
            WHERE `group` IS NOT NULL AND `group` != ''
            ORDER BY `group`
        """
        cursor.execute(query)
        groups_data = cursor.fetchall()
        
        # Format the groups into a list of dictionaries
        groups_list = [
            {
                "id": group[0],
                "name": group[0]
            }
            for group in groups_data
        ]
        
        # Respond with the groups list
        return jsonify({"success": True, "groups": groups_list}), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    
    finally:
        if cursor:
            cursor.close()
        if connection:
            release_connection(connection)