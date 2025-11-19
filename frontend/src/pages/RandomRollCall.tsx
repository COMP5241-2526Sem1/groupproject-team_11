import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Loader, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "@/services/api";

interface Student {
  id: string;
  name: string;
  courseId?: string;
  selected?: boolean;
}

interface Course {
  id: string;
  code: string;
  title: string;
  status: "Open" | "Closed" | "Coming Soon";
  students?: string[]; // 课程学生 ID 列表
}

const RandomRollCall = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [newStudentName, setNewStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [selectCount, setSelectCount] = useState("1");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 从后端加载课程列表
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/courses`);
        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.success && data.courses) {
          setCourses(data.courses);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        alert("Failed to fetch courses. Please try again later.");
      }
    };
    fetchCourses();
  }, []);

  // 过滤 Open 状态的课程
  const openCourses = courses.filter((c) => c.status === "Open");

  // 当选择课程时，自动加载该课程的学生
  const handleCourseChange = async (courseId: string) => {
    setSelectedCourse(courseId);
    
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/students`);
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success && data.students) {
        setStudents(data.students.map((s: any) => ({
          id: s.id,
          name: s.name,
          courseId: courseId,
          selected: false,
        })));
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      alert("Failed to fetch students. Please try again later.");
      setStudents([]);
    }
  };

  // 添加学生
  const handleAddStudent = async () => {
    if (!newStudentName.trim()) {
      alert("Please enter student name");
      return;
    }
    
    if (!selectedCourse) {
      alert("Please select a course first");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/courses/${selectedCourse}/students/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newStudentName.trim(),
          courseId: selectedCourse,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.student) {
        const newStudent: Student = {
          id: data.student.id,
          name: data.student.name,
          courseId: selectedCourse,
          selected: false,
        };
        setStudents([...students, newStudent]);
        setNewStudentName("");
      }
    } catch (error) {
      console.error("Error adding student:", error);
      alert("Failed to add student. Please try again later.");
    }
  };

  // 删除学生
  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this student?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/courses/${selectedCourse}/students/delete/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setStudents(students.filter((s) => s.id !== id));
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student. Please try again later.");
    }
  };

  // 处理 Excel 文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // 动态导入 xlsx 库
      const XLSX = await import("xlsx") as any;
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

          // 提取学生名字（假设有 'name' 或 '姓名' 列）
          const newStudents: Student[] = jsonData
            .map((row, index) => ({
              id: `excel_${Date.now()}_${index}`,
              name: row.name || Object.values(row)[0]?.toString() || "",
              courseId: selectedCourse,
              selected: false,
            }))
            .filter((s) => s.name.trim() !== "");

          setStudents([...students, ...newStudents]);
          alert(`Successfully imported ${newStudents.length} students`);
        } catch (error) {
          console.error("Error parsing Excel file:", error);
          alert("Failed to parse Excel file. Make sure it has a valid format.");
        }
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      console.error("Error loading xlsx library:", error);
      alert("Please install 'xlsx' package: npm install xlsx");
    }

    // 重置 input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 随机抽取学生
  const handleRollCall = async () => {
    const count = parseInt(selectCount) || 1;

    if (students.length === 0) {
      alert("Please add students first");
      return;
    }

    if (count > students.length) {
      alert(`Cannot select ${count} students. Only ${students.length} students available.`);
      return;
    }

    setLoading(true);
    setShowResult(false);

    // 模拟加载延迟
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 随机选择指定数量的学生
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    if (count === 1) {
      setSelectedStudent(selected[0]);
    } else {
      setSelectedStudents(selected);
    }

    setLoading(false);
    setShowResult(true);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/tools">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Random Roll Call</h1>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Left Column - Course Selection & Count */}
        <div className="col-span-1 space-y-6">
          {/* Course Filter */}
          <Card className="p-6">
            <h2 className="text-sm font-semibold mb-3">Filter Courses</h2>
            <Select value={selectedCourse} onValueChange={handleCourseChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {openCourses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCourse && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Selected:</p>
                <p className="text-sm font-semibold">
                  {courses.find((c) => c.id === selectedCourse)?.code}
                </p>
              </div>
            )}
          </Card>

          {/* Select Count */}
          <Card className="p-6">
            <h2 className="text-sm font-semibold mb-3">Select Count</h2>
            <div className="space-y-2">
              <Input
                type="number"
                min="1"
                max={students.length}
                value={selectCount}
                onChange={(e) => setSelectCount(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Available: {students.length}
              </p>
            </div>
          </Card>
        </div>

        {/* Right Column - Roll Call Result */}
        <div className="col-span-2">
          <Card className="p-8 flex flex-col" style={{ height: "584px" }}>
            {loading ? (
              // Loading State
              <div className="flex flex-col items-center justify-center gap-4 flex-1">
                <div className="relative w-20 h-20">
                  <Loader className="w-20 h-20 animate-spin text-blue-600" />
                </div>
                <p className="text-lg font-semibold text-muted-foreground">
                  Rolling call...
                </p>
              </div>
            ) : showResult && (selectedStudent || selectedStudents.length > 0) ? (
              // Result State
              <div className="flex flex-col gap-4 w-full flex-1 min-h-0">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    {parseInt(selectCount) === 1 ? "Selected Student" : `Selected ${parseInt(selectCount)} Students`}
                  </p>
                </div>

                {parseInt(selectCount) === 1 && selectedStudent ? (
                  // Single student result - centered
                  <div className="flex items-center justify-center flex-1 min-h-0">
                    <div className="bg-gradient-to-br from-blue-50 to-green-50 border-4 border-green-500 rounded-lg p-8 w-full max-w-md">
                      <div className="flex items-center justify-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                          <span className="text-white text-4xl font-bold">
                            {selectedStudent.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="text-left">
                          <p className="text-4xl font-bold text-green-600">
                            {selectedStudent.name}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            ID: {selectedStudent.id}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Multiple students result - 2 columns grid with scroll
                  <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-3">
                      {selectedStudents.map((student, index) => (
                        <div
                          key={student.id}
                          className="bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-l-green-500 rounded-lg p-4 flex flex-col items-center text-center"
                        >
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-2">
                            <span className="text-white text-2xl font-bold">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <p className="text-lg font-bold text-green-600">
                            #{index + 1}
                          </p>
                          <p className="text-sm font-semibold text-gray-700 mt-1">
                            {student.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {student.id}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleRollCall}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6"
                >
                  Roll Again
                </Button>
              </div>
            ) : (
              // Initial State
              <div className="flex flex-col items-center justify-center gap-4 text-center flex-1">
                <p className="text-lg font-semibold text-muted-foreground">
                  Ready to roll call?
                </p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Select a course from the left panel, then click the button below to randomly select one.
                </p>
                <Button
                  onClick={handleRollCall}
                  disabled={students.length === 0}
                  className="w-full md:w-64 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-lg py-6 mt-4"
                >
                  Start Roll Call
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RandomRollCall;
