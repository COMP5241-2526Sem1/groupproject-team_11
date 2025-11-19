import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const CourseReplay = () => {
  const navigate = useNavigate();

  const teachers = Array(24).fill("Teacher: XXXXXXXX");

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-sidebar text-sidebar-foreground p-4 flex items-center">
        <Button
          variant="ghost"
          className="text-sidebar-foreground hover:bg-sidebar-active"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Course Replay
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 grid grid-cols-[1fr_280px] gap-6 overflow-hidden">
        {/* Video Area */}
        <Card className="flex items-center justify-center bg-muted/20 border-2">
          <p className="text-muted-foreground text-lg">The class recording will be displayed here.</p>
        </Card>

        {/* Teacher List */}
        <Card className="p-4 overflow-y-auto">
          <div className="space-y-2">
            {teachers.map((teacher, index) => (
              <div key={index} className="text-sm py-1">
                {teacher}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI Summary Section */}
      <Card className="mx-8 mb-8 p-6">
        <h2 className="text-xl font-bold mb-4">AI SUMMARY</h2>
        <p className="text-muted-foreground">XXXXXXXXXXXXXXXXXXXXXXXXX</p>
      </Card>
    </div>
  );
};

export default CourseReplay;
