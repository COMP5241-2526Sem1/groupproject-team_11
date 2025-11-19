import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const Announcement = () => {
  const announcements = [
    {
      id: 1,
      title: "COMPXXXX assignment has been submitted. View submission details",
      type: "submission",
    },
    {
      id: 2,
      title: "Xth session of COMPXXXX will be held in 1 day. Upload the courseware",
      type: "reminder",
    },
    {
      id: 3,
      title: "There is 1 message from students of COMPXXXX. Click here to view.",
      type: "message",
    },
  ];

  const schedules = [
    { id: 1, title: "HJXXX - Oct 21st - COMPXXXX" },
    { id: 2, title: "FJXXX - Oct 23rd - COMPXXXX" },
    { id: 3, title: "HJXXX - Oct 24th - COMPXXXX" },
  ];

  const materials = [
    { id: 1, title: "Oct 21st - COMPXXXX", released: true },
    { id: 2, title: "Oct 23rd - COMPXXXX", released: true },
    { id: 3, title: "Oct 24th - COMPXXXX", released: true },
  ];

  const homework = [
    { id: 1, title: "Oct 21st - COMPXXXX", released: true },
    { id: 2, title: "Oct 23rd - COMPXXXX", released: true },
    { id: 3, title: "Oct 24th - COMPXXXX", released: true },
  ];

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Task Statistics */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Task status statistics</h3>
            <div className="flex justify-center">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="15"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="15"
                    strokeDasharray="100 251"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="15"
                    strokeDasharray="80 251"
                    strokeDashoffset="-100"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Recent & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">RECENT</h3>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    {announcement.title}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Course Scheduling and Adjustments</h3>
              <div className="space-y-2">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="p-2 border rounded text-sm">
                    {schedule.title}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Course Material Release</h3>
              <div className="space-y-2">
                {materials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-2 border rounded text-sm">
                    <span>{material.title}</span>
                    {material.released && <Badge variant="outline">Release</Badge>}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Homework</h3>
              <div className="space-y-2">
                {homework.map((hw) => (
                  <div key={hw.id} className="flex items-center justify-between p-2 border rounded text-sm">
                    <span>{hw.title}</span>
                    {hw.released && <Badge variant="outline">Release</Badge>}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Announcement;
