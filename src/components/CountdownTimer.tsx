"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 10,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Target date set to 10 days from now
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 10);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeBlocks = [
    { label: "Days", value: timeLeft.days, color: "from-cyan-500 to-blue-500" },
    { label: "Hours", value: timeLeft.hours, color: "from-blue-500 to-indigo-500" },
    { label: "Minutes", value: timeLeft.minutes, color: "from-indigo-500 to-purple-500" },
    { label: "Seconds", value: timeLeft.seconds, color: "from-purple-500 to-pink-500" },
  ];

  return (
    <div className="w-full my-8">
      <div className="flex items-center justify-center gap-2 mb-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">
        <Clock className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: "10s" }} />
        <span>Target Launch Countdown</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
        {timeBlocks.map((block, index) => (
          <div
            key={index}
            className="relative group glass-card rounded-2xl p-4 sm:p-5 text-center transition-all duration-300 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10"
          >
            {/* Subtle glow border */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${block.color} opacity-0 group-hover:opacity-30 blur rounded-2xl transition duration-500`} />

            <div className="relative">
              <span className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-mono">
                {String(block.value).padStart(2, "0")}
              </span>
              <span className="block text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">
                {block.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
