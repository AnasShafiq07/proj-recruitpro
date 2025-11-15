import { AuthTabs } from "@/components/auth/AuthTabs";
import { Link } from "react-router-dom";

const Auth = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-secondary via-background to-background">
      {/* Decorative curved background elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-primary/15 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
      
      <div className="relative z-10 w-full max-w-md px-6 py-8 animate-fade-in">
        <div className="mb-8 text-center">
          <Link to="/">
            <h1 className="text-4xl font-bold text-primary mb-2">RecruitPro</h1>
          </Link>
          <p className="text-muted-foreground">
            A smart hiring platform!
          </p>
        </div>

        <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-xl border border-border/50 p-8">
          <AuthTabs />
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Auth;
