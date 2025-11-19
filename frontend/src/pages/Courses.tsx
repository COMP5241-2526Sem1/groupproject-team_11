import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, X, Edit, Trash2, Upload, FileSpreadsheet, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/services/api";
import * as XLSX from 'xlsx';
interface Course {
  id: string;
  code: string;
  title: string;
  status: "Open" | "Closed" | "Coming Soon";
  schedule: string;
  students: string;
  year?: string;
  semester?: string;
  weekday?: string;
  classTime?: string;
  capacity?: string;
}
interface StudentRecord {
  name: string;
  student_id: string;
  group?: string;
}
const Courses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([
    {
      id: "1",
      code: "COMP5421",
      title: "SOFTWARE ENGINEERING AND DEVELOPMENT",
      status: "Open",
      schedule: "Sem1 Wed Eve",
      students: "150",
      year: "2025",
      semester: "Sem1",
      weekday: "Wednesday",
      classTime: "18:00-21:00",
    },
  ]);

  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    schedule: "",
    students: "",
    year: "",
    semester: "",
    weekday: "",
    classTime: "",
    capacity: "",
    status: "Open",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [studentList, setStudentList] = useState<StudentRecord[]>([]);
  const [showStudentUploadInfo, setShowStudentUploadInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOiIyNTA0MDc1OEciLCJ1c2VyX25hbWUiOiJUZXN0IFVzZXIiLCJyb2xlIjoidGVhY2hlciIsImV4cCI6MjEyMzMyNTY2OH0.6ZNz0Ym4WaXVWgfO7riGh16fpXhKOOWJzFRX0zX8sBY";

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/courses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      const data = await response.json();
      return data.courses;
    } catch (error) {
      console.error("Error fetching courses:", error);
      alert("Failed to fetch courses. Please try again later.");
      return [];
    }
  };

  useEffect(() => {
    const loadCourses = async () => {
      const fetchedCourses = await fetchCourses();
      setCourses(fetchedCourses);
    };
    loadCourses();
  }, []);
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return; 
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]; 
        // 验证数据格式
        const students: StudentRecord[] = jsonData.map((row) => {
          if (!row.name || !row.student_id) {
            throw new Error("Excel file must contain 'name' and 'student_id' columns");
          }
          return {
            name: String(row.name).trim(),
            student_id: String(row.student_id).trim(),
            group: row.group ? String(row.group).trim() : undefined,
          };
        }); 
        setStudentList(students);
        setFormData(prev => ({ ...prev, students: String(students.length) }));
        alert(`Successfully imported ${students.length} students`);
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        alert("Failed to parse Excel file. Please check the format and try again.");
      }
    };
    reader.readAsBinaryString(file);
  }; 
  const downloadExampleTemplate = () => {
    const exampleData = [
      { name: "John Doe", student_id: "12345678", group: "Group 1" },
      { name: "Jane Smith", student_id: "87654321", group: "Group 2" },
      { name: "Bob Johnson", student_id: "11223344", group: "" },
    ]; 
    const ws = XLSX.utils.json_to_sheet(exampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "student_list_template.xlsx");
  };
  const handleAddCourse = async () => {
    if (!formData.code || !formData.title || !formData.schedule || !formData.students) {
      alert("Please fill in all required fields");
      return;
    }

    const courseData = {
      code: formData.code,
      title: formData.title,
      schedule: formData.schedule,
      students: formData.students,
      year: formData.year,
      semester: formData.semester,
      weekday: formData.weekday,
      classTime: formData.classTime,
      capacity: formData.capacity,
      status: formData.status,
      studentList: studentList.length > 0 ? studentList : undefined,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/courses/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();

      // Update local state with the new course
      const newCourse: Course = {
        id: data.course.id,
        code: data.course.code,
        title: data.course.title,
        status: data.course.status,
        schedule: data.course.schedule,
        students: data.course.students,
        year: data.course.year,
        semester: data.course.semester,
        weekday: data.course.weekday,
        classTime: data.course.classTime,
        capacity: data.course.capacity,
      };

      setCourses([...courses, newCourse]);
      setFormData({ code: "", title: "", schedule: "", students: "", year: "", semester: "", weekday: "", classTime: "", capacity: "", status: "Open" });
      setStudentList([]);
      setShowDialog(false);
    } catch (error) {
      console.error("Error creating course:", error);
      alert("Failed to create course. Please try again later.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditCourse = async (course: Course) => {
    setFormData({
      code: course.code,
      title: course.title,
      schedule: course.schedule,
      students: course.students,
      year: course.year || "",
      semester: course.semester || "",
      weekday: course.weekday || "",
      classTime: course.classTime || "",
      capacity: course.capacity || "",
      status: course.status,
    });
    setEditingId(course.id);
  
    // 尝试从后端加载学生列表
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${course.id}/students`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.students) {
          setStudentList(data.students);
        }
      }
    } catch (error) {
      console.error("Error loading students:", error);
    }
      setShowDialog(true);
  };
    
  const handleUpdateCourse = async () => {
    if (!editingId || !formData.code || !formData.title || !formData.schedule || !formData.students) {
      alert("Please fill in all required fields");
      return;
    }

    const courseData = {
      code: formData.code,
      title: formData.title,
      schedule: formData.schedule,
      students: formData.students,
      year: formData.year,
      semester: formData.semester,
      weekday: formData.weekday,
      classTime: formData.classTime,
      capacity: formData.capacity,
      status: formData.status,
      studentList: studentList.length > 0 ? studentList : undefined,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/courses/update/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setCourses(courses.map(course => (course.id === editingId ? {
          id: data.course.id,
          code: data.course.code,
          title: data.course.title,
          status: data.course.status,
          schedule: data.course.schedule,
          students: data.course.students,
          year: data.course.year,
          semester: data.course.semester,
          weekday: data.course.weekday,
          classTime: data.course.classTime,
          capacity: data.course.capacity,
        } : course)));
        alert(data.message);
        setShowDialog(false);
        setEditingId(null);
        setStudentList([]);
        setFormData({ code: "", title: "", schedule: "", students: "", year: "", semester: "", weekday: "", classTime: "", capacity: "", status: "Open" });
      } else {
        alert("Failed to update course. Please try again later.");
      }
    } catch (error) {
      console.error("Error updating course:", error);
      alert("Failed to update course. Please try again later.");
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/courses/delete/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
          setCourses(courses.filter(course => course.id !== id));
          alert(data.message);
        } else {
          alert("Failed to delete course. Please try again later.");
        }
      } catch (error) {
        console.error("Error deleting course:", error);
        alert("Failed to delete course. Please try again later.");
      }
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingId(null);
    setStudentList([]);
    setShowStudentUploadInfo(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFormData({ code: "", title: "", schedule: "", students: "", year: "", semester: "", weekday: "", classTime: "", capacity: "", status: "Open" });
  };

  // Filter courses based on search query
  const filteredCourses = courses.filter(course => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      course.code?.toLowerCase().includes(query) ||
      course.title?.toLowerCase().includes(query) ||
      course.schedule?.toLowerCase().includes(query) ||
      course.students?.toLowerCase().includes(query) ||
      (course.year && course.year.toLowerCase().includes(query)) ||
      (course.semester && course.semester.toLowerCase().includes(query)) ||
      (course.weekday && course.weekday.toLowerCase().includes(query)) ||
      (course.classTime && course.classTime.toLowerCase().includes(query));
    
    const matchesStatus = statusFilter === "all" || course.status === statusFilter;
    
    // Filter by semester (year + semester combination)
    const courseFullSemester = `${course.year || ""} ${course.semester || ""}`.trim();
    const matchesSemester = semesterFilter === "all" || courseFullSemester === semesterFilter;
    
    return matchesSearch && matchesStatus && matchesSemester;
  });

  // Sort courses: Open -> Coming Soon -> Closed
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    const statusOrder = { "Open": 1, "Coming Soon": 2, "Closed": 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder="Search Your Courses"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={semesterFilter} onValueChange={setSemesterFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Semesters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            <SelectItem value="2025 Sem1">2025 Sem1</SelectItem>
            <SelectItem value="2025 Sem2">2025 Sem2</SelectItem>
            <SelectItem value="2025 Summer Term">2025 Summer Term</SelectItem>
            <SelectItem value="2025 Winter Term">2025 Winter Term</SelectItem>
            <SelectItem value="2024 Sem1">2024 Sem1</SelectItem>
            <SelectItem value="2024 Sem2">2024 Sem2</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="Coming Soon">Coming Soon</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setShowDialog(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Courses
        </Button>
      </div>

      <div className="space-y-4">
        {sortedCourses.length > 0 ? (
          sortedCourses.map((course) => (
            <Card 
              key={course.id} 
              className="p-6 hover:shadow-lg transition-shadow"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => navigate(`/course-detail/${course.id}`)}
                  >
                    <h3 className="text-lg font-bold hover:text-primary transition-colors">{course.code}</h3>
                    <p className="text-sm font-medium">{course.title}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditCourse(course)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteCourse(course.id)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <Badge 
                    variant="secondary"
                    className={
                      course.status === "Open" 
                        ? "bg-green-100 text-green-700 hover:bg-green-100" 
                        : course.status === "Coming Soon"
                        ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                    }
                  >
                    {course.status}
                  </Badge>
                  {course.year && course.semester && (
                    <span>{course.year} {course.semester}</span>
                  )}
                  {course.weekday && course.classTime && (
                    <span>{course.weekday} {course.classTime}</span>
                  )}
                  <span>Stu Num: {course.students}</span>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchQuery 
                ? `No courses found matching "${searchQuery}"` 
                : "No courses yet. Click 'Add Courses' to create one."}
            </p>
          </Card>
        )}
      </div>

      {/* Add Course Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-8 pb-4">
              <h2 className="text-2xl font-bold">
                {editingId ? "Edit Course" : "Create New Course"}
              </h2>
              <button 
                onClick={handleCloseDialog}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 px-8 overflow-y-auto flex-1">
              {/* Course Code */}
              <div>
                <label className="block text-sm font-medium mb-2">Course Code *</label>
                <Input
                  name="code"
                  placeholder="e.g., COMP5421"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>

              {/* Course Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Course Name *</label>
                <Input
                  name="title"
                  placeholder="e.g., SOFTWARE ENGINEERING AND DEVELOPMENT"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>

              {/* Year and Semester */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Year</label>
                  <Input
                    name="year"
                    placeholder="e.g., 2025"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Semester</label>
                  <Select
                    value={formData.semester}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, semester: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sem1">Sem1</SelectItem>
                      <SelectItem value="Sem2">Sem2</SelectItem>
                      <SelectItem value="Summer Term">Summer Term</SelectItem>
                      <SelectItem value="Winter Term">Winter Term</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Weekday and Class Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Weekday</label>
                  <Select
                    value={formData.weekday}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, weekday: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select weekday" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monday">Monday</SelectItem>
                      <SelectItem value="Tuesday">Tuesday</SelectItem>
                      <SelectItem value="Wednesday">Wednesday</SelectItem>
                      <SelectItem value="Thursday">Thursday</SelectItem>
                      <SelectItem value="Friday">Friday</SelectItem>
                      <SelectItem value="Saturday">Saturday</SelectItem>
                      <SelectItem value="Sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Class Time</label>
                  <Input
                    name="classTime"
                    placeholder="e.g., 18:00-21:00"
                    value={formData.classTime}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium mb-2">Schedule *</label>
                <Input
                  name="schedule"
                  placeholder="e.g., Sem1 Wed Eve"
                  value={formData.schedule}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>
            
              {/* Course Status */}
              <div>
                <label className="block text-sm font-medium mb-2">Course Status *</label>
                <Select
                  value={formData.status || "Open"}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Coming Soon">Coming Soon</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Student Capacity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Current Students *</label>
                  <Input
                    name="students"
                    type="number"
                    placeholder="e.g., 150"
                    value={formData.students}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Capacity</label>
                  <Input
                    name="capacity"
                    type="number"
                    placeholder="e.g., 200"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>
              </div>


              {/* Student List Upload Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    Import Student List (Excel)
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStudentUploadInfo(!showStudentUploadInfo)}
                    className="text-blue-600"
                  >
                    <Info className="h-4 w-4 mr-1" />
                    {showStudentUploadInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Info Section (Collapsible) */}
                {showStudentUploadInfo && (
                  <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
                    <div className="space-y-3 text-sm">
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-2">📋 Excel File Format Requirements:</h4>
                        <ul className="list-disc list-inside space-y-1 text-blue-800">
                          <li><strong>Required columns:</strong> <code className="bg-blue-100 px-1 rounded">name</code>, <code className="bg-blue-100 px-1 rounded">student_id</code></li>
                          <li><strong>Optional column:</strong> <code className="bg-blue-100 px-1 rounded">group</code></li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-blue-900 mb-2">ℹ️ About the "group" column:</h4>
                        <ul className="list-disc list-inside space-y-1 text-blue-800">
                          <li>The <code className="bg-blue-100 px-1 rounded">group</code> column can be <strong>empty</strong> or <strong>omitted</strong> when first uploading</li>
                          <li>You can <strong>update</strong> group information later by re-uploading the file with group data</li>
                          <li>Groups are useful for organizing students into teams or discussion groups</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-blue-900 mb-2">📝 Example:</h4>
                        <div className="bg-white p-3 rounded border border-blue-300 overflow-x-auto">
                          <table className="text-xs border-collapse w-full">
                            <thead>
                              <tr className="bg-blue-100">
                                <th className="border border-blue-300 px-2 py-1 text-left">name</th>
                                <th className="border border-blue-300 px-2 py-1 text-left">student_id</th>
                                <th className="border border-blue-300 px-2 py-1 text-left">group</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-blue-300 px-2 py-1">John Doe</td>
                                <td className="border border-blue-300 px-2 py-1">12345678</td>
                                <td className="border border-blue-300 px-2 py-1">Group 1</td>
                              </tr>
                              <tr>
                                <td className="border border-blue-300 px-2 py-1">Jane Smith</td>
                                <td className="border border-blue-300 px-2 py-1">87654321</td>
                                <td className="border border-blue-300 px-2 py-1">Group 2</td>
                              </tr>
                              <tr>
                                <td className="border border-blue-300 px-2 py-1">Bob Johnson</td>
                                <td className="border border-blue-300 px-2 py-1">11223344</td>
                                <td className="border border-blue-300 px-2 py-1 text-gray-400 italic">(empty)</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={downloadExampleTemplate}
                        className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Download Example Template
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Upload Button */}
                <div className="flex gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {studentList.length > 0 ? "Replace Student List" : "Upload Student List"}
                  </Button>
                  {studentList.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setStudentList([]);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Student List Preview */}
                {studentList.length > 0 && (
                  <Card className="mt-3 p-3 bg-green-50 border-green-200">
                    <div className="flex items-start gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-900">
                          ✓ {studentList.length} students imported
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          {studentList.filter(s => s.group).length} with group assignments
                        </p>
                        <div className="mt-2 max-h-40 overflow-y-auto">
                          <table className="text-xs w-full">
                            <thead className="bg-green-100 sticky top-0">
                              <tr>
                                <th className="text-left px-2 py-1">Name</th>
                                <th className="text-left px-2 py-1">Student ID</th>
                                <th className="text-left px-2 py-1">Group</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentList.slice(0, 5).map((student, idx) => (
                                <tr key={idx} className="border-t border-green-200">
                                  <td className="px-2 py-1">{student.name}</td>
                                  <td className="px-2 py-1">{student.student_id}</td>
                                  <td className="px-2 py-1 text-gray-600">{student.group || "-"}</td>
                                </tr>
                              ))}
                              {studentList.length > 5 && (
                                <tr>
                                  <td colSpan={3} className="px-2 py-1 text-center text-gray-500 italic">
                                    ... and {studentList.length - 5} more
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end p-8 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={editingId ? handleUpdateCourse : handleAddCourse}
              >
                {editingId ? "Update Course" : "Create Course"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Courses;


