import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary via-background to-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      
      <div className="text-center relative z-10 px-6 max-w-3xl animate-fade-in">
        <h1 className="mb-4 text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          rekroot
        </h1>
        <p className="text-2xl text-foreground mb-3">
          Get your new dream job today!
        </p>
        <p className="text-lg text-muted-foreground mb-8">
          26,478 Offers Worldwide
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/auth">
            <Button size="lg" className="h-14 px-8 text-lg group">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg">
              View Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
