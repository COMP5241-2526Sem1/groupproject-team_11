import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Shuffle } from "lucide-react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "@/services/api";

interface Group {
  id: string;
  name: string;
  order?: number;
}

interface Course {
  id: string;
  code: string;
  title: string;
  status: "Open" | "Closed" | "Coming Soon";
}

const RandomSort = () => {
  const [courses, setCourses] = useState<Course[]>([]);

  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [sortedGroups, setSortedGroups] = useState<Group[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  // 当选择课程时，自动加载该课程的小组
  const handleCourseChange = async (courseId: string) => {
    setSelectedCourse(courseId);
    setSortedGroups([]);
    setShowResult(false);
    
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/groups`);
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success && data.groups) {
        setGroups(data.groups.map((g: any) => ({
          id: g.id,
          name: g.name,
        })));
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      alert("Failed to fetch groups. Please try again later.");
      setGroups([]);
    }
  };

  // 随机排序小组
  const handleRandomSort = async () => {
    if (groups.length === 0) {
      alert("Please select a course first");
      return;
    }

    setIsLoading(true);
    setShowResult(false);

    // 模拟加载延迟
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 随机排序
    const shuffled = [...groups]
      .sort(() => Math.random() - 0.5)
      .map((group, index) => ({
        ...group,
        order: index + 1,
      }));

    setSortedGroups(shuffled);
    setIsLoading(false);
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
        <h1 className="text-3xl font-bold">Random Sort</h1>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Left Column - Course Selection & Groups */}
        <div className="col-span-1 space-y-6">
          {/* Course Selection */}
          <Card className="p-6 h-48">
            <h2 className="text-sm font-semibold mb-3">Select Course</h2>
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
            <div className="mt-3 min-h-20">
              {selectedCourse && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Selected:</p>
                  <p className="text-sm font-semibold">
                    {courses.find((c) => c.id === selectedCourse)?.code}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Groups List */}
          <Card className="p-6 h-80 mb-20 flex flex-col">
            <h2 className="text-sm font-semibold mb-3">Groups</h2>
            <p className="text-sm font-semibold text-muted-foreground mb-3">
              Total: {groups.length}
            </p>
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="overflow-y-auto flex-1 pr-2">
                {groups.length > 0 ? (
                  <div className="space-y-1 pr-2">
                    {groups.map((group, index) => (
                      <div
                        key={group.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-sm"
                      >
                        <span className="text-sm font-medium">{group.name}</span>
                        <span className="text-xs text-muted-foreground">
                          #{index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Select a course to view groups</p>
                  </div>
                )}
              </div>
              <div className="h-4"></div>
            </div>
          </Card>
        </div>

        {/* Right Column - Sort & Results */}
        <div className="col-span-2">
          <Card className="p-8 flex flex-col h-auto" style={{ height: "584px" }}>
            {isLoading ? (
              // Loading State
              <div className="flex flex-col items-center justify-center gap-4 flex-1">
                <div className="relative w-20 h-20">
                  <Shuffle className="w-20 h-20 animate-spin text-blue-600" />
                </div>
                <p className="text-lg font-semibold text-muted-foreground">
                  Sorting groups...
                </p>
              </div>
            ) : showResult && sortedGroups.length > 0 ? (
              // Result State
              <>
                <div className="text-center mb-4">
                  <p className="text-lg text-muted-foreground mb-2">Sorted Order</p>
                  <p className="text-sm font-semibold text-blue-600">
                    {courses.find((c) => c.id === selectedCourse)?.code}
                  </p>
                </div>

                <div className="space-y-2 overflow-y-auto flex-1 mb-4">
                  {sortedGroups.map((group) => (
                    <div
                      key={group.id}
                      className="bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-l-blue-500 rounded-lg p-3 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                          {group.order}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-blue-600">
                          {group.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Position: #{group.order}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleRandomSort}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2"
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  Sort Again
                </Button>
              </>
            ) : (
              // Initial State
              <div className="flex flex-col items-center justify-center gap-4 text-center flex-1">
                <div className="text-5xl mb-4">🎲</div>
                <p className="text-lg font-semibold text-muted-foreground">
                  Ready to sort groups?
                </p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Select a course from the left panel, then click the button below to randomly sort the groups.
                </p>
                <Button
                  onClick={handleRandomSort}
                  disabled={groups.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 mt-4"
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  Start Sort
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RandomSort;
