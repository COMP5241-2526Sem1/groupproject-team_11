import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Timer = () => {
  const [minutes, setMinutes] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Format time display (MM:SS)
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const sec = (secs % 60).toString().padStart(2, "0");
    return `${mins}:${sec}`;
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle countdown
  useEffect(() => {
    if (isRunning && totalSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTotalSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (audioRef.current) {
              audioRef.current.play().catch(() => {});
            }
            alert("Countdown finished!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, totalSeconds]);

  const handleStart = () => {
    if (!isRunning) {
      const mins = parseInt(minutes as any) || 0;
      const secs = parseInt(seconds as any) || 0;
      const total = mins * 60 + secs;

      if (total <= 0) {
        alert("Please set a valid countdown time (greater than 0)");
        return;
      }

      setTotalSeconds(total);
      setIsRunning(true);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTotalSeconds(0);
    setMinutes(1);
    setSeconds(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const display = totalSeconds > 0 ? formatTime(totalSeconds) : "00:00";
  const inputsDisabled = isRunning;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link to="/tools">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h2 className="text-xl font-bold">Custom Countdown Timer</h2>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto p-12 text-center">
        {/* Settings */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Input
            type="number"
            min="0"
            value={minutes}
            onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
            disabled={inputsDisabled}
            className="w-24 text-center text-lg"
            placeholder="min"
          />
          <span className="text-lg text-gray-600">minutes</span>

          <Input
            type="number"
            min="0"
            max="59"
            value={seconds}
            onChange={(e) => setSeconds(Math.min(59, parseInt(e.target.value) || 0))}
            disabled={inputsDisabled}
            className="w-24 text-center text-lg"
            placeholder="sec"
          />
          <span className="text-lg text-gray-600">seconds</span>
        </div>

        {/* Timer Display */}
        <div className="text-9xl font-bold text-blue-900 mb-12 font-mono tracking-wider">
          {display}
        </div>

        {/* Buttons */}
        <div className="flex gap-6 justify-center">
          <Button
            onClick={handleStart}
            disabled={isRunning}
            className="bg-green-500 hover:bg-green-600 text-white px-12 py-3 text-lg"
          >
            Start
          </Button>
          <Button
            onClick={handlePause}
            disabled={!isRunning}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-12 py-3 text-lg"
          >
            Pause
          </Button>
          <Button
            onClick={handleReset}
            className="bg-red-500 hover:bg-red-600 text-white px-12 py-3 text-lg"
          >
            Reset
          </Button>
        </div>
      </Card>

      {/* Alert Sound */}
      <audio
        ref={audioRef}
        preload="auto"
        src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAzMzMzMzMzM5WZmZmZmZmnd7e3t7e3uHh4eHh4eHh5mZmZmZmZmZ3t7e3t7e3uHh4eHh4eHh5mZmZmZmZmZ3t7e3t7e3uHh4eHh4eHh5mZmZmZmZmZ3t7e3t7e3vLy8vLy8vL6+vr6+vr6+vo="
      />
    </div>
  );
};

export default Timer;
