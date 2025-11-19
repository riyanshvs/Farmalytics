import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

const ComingSoon = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-6xl font-bold text-primary">Coming Soon</h1>
        <p className="text-xl text-muted-foreground max-w-md">
          This feature is currently under development. Stay tuned!
        </p>
        <Button
          onClick={() => navigate("/dashboard")}
          size="lg"
          className="mt-8"
        >
          <Home className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default ComingSoon;
