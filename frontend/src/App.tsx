import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Homepage from "./pages/Homepage";
import Courses from "./pages/Courses";
import Activities from "./pages/Activities";
import Discussion from "./pages/Discussion";
import Tools from "./pages/Tools";
import AIAssistant from "./pages/AIAssistant";
import Quiz from "./pages/Quiz";
import OpinionPoll from "./pages/OpinionPoll";
import TakePoll from "./pages/TakePoll";
import OpenQuestion from "./pages/OpenQuestion";
import ScalesQuestion from "./pages/ScalesQuestion";
import MindMap from "./pages/MindMap";
import CourseDetail from "./pages/CourseDetail";
import CourseReplay from "./pages/CourseReplay";
import Timer from "./pages/Timer";
import RandomRollCall from "./pages/RandomRollCall";
import RandomSort from "./pages/RandomSort";
import NotFound from "./pages/NotFound";
import MobileResponse from "./pages/MobileResponse";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Homepage /></Layout>} />
          <Route path="/courses" element={<Layout><Courses /></Layout>} />
          <Route path="/activities" element={<Layout><Activities /></Layout>} />
          <Route path="/discussion" element={<Layout><Discussion /></Layout>} />
          <Route path="/tools" element={<Layout><Tools /></Layout>} />
          <Route path="/ai-assistant" element={<Layout><AIAssistant /></Layout>} />
          <Route path="/quiz" element={<Layout><Quiz /></Layout>} />
          <Route path="/opinion-poll" element={<Layout><OpinionPoll /></Layout>} />
          <Route path="/opinion-poll/:pollId" element={<TakePoll />} />
          <Route path="/response/:activityId" element={<MobileResponse />} />
          <Route path="/open-question" element={<Layout><OpenQuestion /></Layout>} />
          <Route path="/scales-question" element={<Layout><ScalesQuestion /></Layout>} />
          <Route path="/mind-map" element={<Layout><MindMap /></Layout>} />
          <Route path="/timer" element={<Layout><Timer /></Layout>} />
          <Route path="/random-roll-call" element={<Layout><RandomRollCall /></Layout>} />
          <Route path="/random-sort" element={<Layout><RandomSort /></Layout>} />
          <Route path="/course-detail/:id" element={<Layout><CourseDetail /></Layout>} />
          <Route path="/course-replay" element={<Layout><CourseReplay /></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
