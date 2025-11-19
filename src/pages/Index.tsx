import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import bg from "@/assets/farm-field-bg.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="absolute inset-0 bg-black/25" />

      <div className="relative z-10 text-center space-y-8 px-4">
        <div>
          <h1 className="mb-4 text-5xl md:text-7xl font-bold text-white">Farmalytics</h1>
          <p className="text-xl text-white/90">Your Personalized Farm Analytics Dashboard</p>
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

        {/* center hero image removed per request; background image remains */}
      </div>
    </div>
  );
};

export default Index;
