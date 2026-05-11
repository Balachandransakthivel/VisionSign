import { Link } from "react-router-dom";
import { Hand, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="pt-16 min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6 float-animation">
          <Hand className="w-10 h-10 text-primary" />
        </div>
        <div className="font-display text-7xl font-bold shimmer-text mb-4">404</div>
        <h1 className="font-display text-2xl font-bold mb-3">Page Not Found</h1>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist. Maybe a sign went unrecognized.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all neon-glow"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
