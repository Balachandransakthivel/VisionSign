import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Navbar from "@/components/layout/Navbar";
import Home from "@/pages/Home";
import Translator from "@/pages/Translator";
import History from "@/pages/History";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background grid-bg">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/translator" element={<Translator />} />
          <Route path="/history" element={<History />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "hsl(220, 20%, 9%)",
            border: "1px solid rgba(0, 255, 255, 0.2)",
            color: "hsl(210, 40%, 96%)",
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
