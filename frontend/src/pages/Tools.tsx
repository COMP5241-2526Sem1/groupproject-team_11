import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Users, Shuffle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

interface Tool {
  id: number;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  link?: string;
  action?: () => void;
}

const Tools = () => {
  const [tools, setTools] = useState<Tool[]>([
    {
      id: 1,
      name: "Timer",
      description: "Countdown timer for class activities",
      icon: Clock,
      link: "/timer",
    },
    {
      id: 2,
      name: "Random Roll Call",
      description: "Randomly select students for participation",
      icon: Users,
      link: "/random-roll-call",
    },
    {
      id: 3,
      name: "Random Sort",
      description: "Randomly sort groups for activities",
      icon: Shuffle,
      link: "/random-sort",
    },
  ]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Teaching Tools</h1>
        <p className="text-lg text-muted-foreground">Utilities to enhance your teaching experience</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          
          // 为每个工具设置不同的颜色
          let bgGradient = "from-blue-100 to-blue-50";
          let hoverGradient = "group-hover:from-blue-200 group-hover:to-blue-100";
          let iconColor = "text-blue-600";
          let buttonBg = "bg-blue-600 hover:bg-blue-700";
          
          if (tool.id === 1) { // Timer - 蓝色
            bgGradient = "from-blue-100 to-blue-50";
            hoverGradient = "group-hover:from-blue-200 group-hover:to-blue-100";
            iconColor = "text-blue-600";
            buttonBg = "bg-blue-600 hover:bg-blue-700";
          } else if (tool.id === 2) { // Random Roll Call - 绿色
            bgGradient = "from-green-100 to-green-50";
            hoverGradient = "group-hover:from-green-200 group-hover:to-green-100";
            iconColor = "text-green-600";
            buttonBg = "bg-green-600 hover:bg-green-700";
          } else if (tool.id === 3) { // Random Sort - 紫色
            bgGradient = "from-purple-100 to-purple-50";
            hoverGradient = "group-hover:from-purple-200 group-hover:to-purple-100";
            iconColor = "text-purple-600";
            buttonBg = "bg-purple-600 hover:bg-purple-700";
          }
          
          const cardContent = (
            <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer group">
              <div className="flex flex-col items-center text-center gap-4 h-full justify-between">
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <div className={`bg-gradient-to-br ${bgGradient} ${hoverGradient} p-4 rounded-lg transition-colors`}>
                    <Icon className={`h-10 w-10 ${iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{tool.name}</h3>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </div>
                </div>

                {tool.link ? (
                  <Link to={tool.link} className="w-full">
                    <Button className={`w-full text-white ${buttonBg}`}>
                      Open Tool
                    </Button>
                  </Link>
                ) : (
                  <Button disabled className="w-full">
                    Coming Soon
                  </Button>
                )}
              </div>
            </Card>
          );

          return <div key={tool.id}>{cardContent}</div>;
        })}
      </div>
    </div>
  );
};

export default Tools;
