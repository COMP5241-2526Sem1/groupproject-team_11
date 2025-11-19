import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Calendar, Users, Bell } from "lucide-react";

const Messages = () => {
  const messages = [
    { id: 1, title: "COMP XXXX - System Reminder", type: "system" },
    { id: 2, title: "COMP XXXX - Student Message", type: "student" },
  ];

  const selectedMessage = {
    title: "COMP XXXX - System Reminder",
    time: "Oct 21st",
    content: `Dear [Teacher's Name],

The submission deadline for the   【Assignment Name or leave blank】  assignment in course COMPXXXX has passed. Students cannot submit anymore.

✅ Status: Closed
📅 Deadline:   【Date & Time】
👥 Class:   【Class Name or "All Students"】
🔔 Start grading now: Go to   【Courses】   for COMPXXXX, and review/submission.`,
  };

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inbox */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">INBOX</h2>
          <div className="space-y-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  message.id === 1
                    ? "bg-accent/10 border-l-4 border-accent"
                    : "hover:bg-muted"
                }`}
              >
                <p className="text-sm">{message.title}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Message Detail */}
        <Card className="lg:col-span-2 p-6">
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold">{selectedMessage.title}</h2>
              <Badge variant="outline">Time: {selectedMessage.time}</Badge>
            </div>

            <div className="bg-muted/30 p-6 rounded-lg whitespace-pre-line leading-relaxed">
              {selectedMessage.content.split('\n').map((line, index) => {
                if (line.includes('✅')) {
                  return (
                    <div key={index} className="flex items-center gap-2 my-2">
                      <CheckSquare className="h-4 w-4 text-green-600" />
                      <span>{line.replace('✅', '')}</span>
                    </div>
                  );
                }
                if (line.includes('📅')) {
                  return (
                    <div key={index} className="flex items-center gap-2 my-2">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      <span>{line.replace('📅', '')}</span>
                    </div>
                  );
                }
                if (line.includes('👥')) {
                  return (
                    <div key={index} className="flex items-center gap-2 my-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span>{line.replace('👥', '')}</span>
                    </div>
                  );
                }
                if (line.includes('🔔')) {
                  return (
                    <div key={index} className="flex items-center gap-2 my-2">
                      <Bell className="h-4 w-4 text-yellow-600" />
                      <span>{line.replace('🔔', '')}</span>
                    </div>
                  );
                }
                return <p key={index} className="my-1">{line}</p>;
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Messages;
