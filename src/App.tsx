import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import FindLost from "./pages/FindLost";
import UploadFound from "./pages/UploadFound";
import Matching from "./pages/Matching";
import MatchResult from "./pages/MatchResult";
import VerifyOwnership from "./pages/VerifyOwnership";
import Recovery from "./pages/Recovery";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/find-lost" element={<FindLost />} />
          <Route path="/upload-found" element={<UploadFound />} />
          <Route path="/matching" element={<Matching />} />
          <Route path="/match-result" element={<MatchResult />} />
          <Route path="/verify-ownership" element={<VerifyOwnership />} />
          <Route path="/recovery" element={<Recovery />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
