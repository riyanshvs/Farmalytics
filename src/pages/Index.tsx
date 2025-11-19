import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-8">
        <div>
          <h1 className="mb-4 text-5xl md:text-7xl font-bold text-primary">Farmalytics</h1>
          <p className="text-xl text-muted-foreground">Your Personalized Farm Analytics Dashboard</p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => navigate("/signin")}
            size="lg"
            className="text-lg px-8 rounded-xl"
          >
            Sign In
          </Button>
          <Button
            onClick={() => navigate("/signup")}
            size="lg"
            variant="outline"
            className="text-lg px-8 rounded-xl"
          >
            Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
