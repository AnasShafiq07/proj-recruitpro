import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const SignupForm = () => {
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  // -------------------------------
  // ✅ EMAIL CHECKING USEEFFECT
  // -------------------------------
  useEffect(() => {
    if (!email) {
      setEmailExists(false);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        setCheckingEmail(true);

        const res = await fetch(
          `http://127.0.0.1:8000/auth/check-email?email=${email}`
        );

        const exists = await res.json();  
        // FastAPI: False = exists, True = does not exist
        setEmailExists(exists === false);
      } catch (err) {
        console.error("Email check error:", err);
      } finally {
        setCheckingEmail(false);
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [email]);

  // -------------------------------
  // ✅ HANDLE SUBMIT
  // -------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (emailExists) {
      toast({
        title: "Email already exists",
        description: "Please use a different email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create the company
      const companyResponse = await fetch("http://127.0.0.1:8000/auth/company/signup/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: companyName }),
      });

      if (!companyResponse.ok) {
        const errorData = await companyResponse.json();
        throw new Error(errorData.detail || "Company signup failed");
      }
      const companyData = await companyResponse.json();
      const company_id = companyData.company_id;

      // Create admin user
      const hrResponse = await fetch("http://127.0.0.1:8000/auth/admin/signup/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          role: "admin",
          password,
          company_id,
        }),
      });

      if (!hrResponse.ok) {
        const errorData = await hrResponse.json();
        throw new Error(errorData.detail || "HR signup failed");
      }

      const hrData = await hrResponse.json();
      localStorage.setItem("authToken", hrData.access_token);
      localStorage.setItem("refreshToken", hrData.refresh_token);

      toast({
        title: "Signup successful!",
        description: "Welcome to RecruitPro.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">

      <div className="space-y-2">
        <Label htmlFor="signup-name">Full Name</Label>
        <Input
          id="signup-name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-company">Company Name</Label>
        <Input
          id="signup-company"
          type="text"
          placeholder="Your Company Inc."
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>

        <div className="relative">
          <Input
            id="signup-email"
            type="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`h-12 ${
              emailExists ? "border-red-500 focus-visible:ring-red-500" : ""
            }`}
          />
          {checkingEmail && (
            <span className="absolute right-3 top-3 text-sm text-gray-500">
              Checking...
            </span>
          )}
        </div>

        {emailExists && (
          <p className="text-sm text-red-500">This email is already registered</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="Create a strong password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-confirm">Confirm Password</Label>
        <Input
          id="signup-confirm"
          type="password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="h-12"
        />
      </div>

      <Button type="submit" className="w-full h-12 text-base" disabled={isLoading || emailExists}>
        {isLoading ? "Creating account..." : "Sign Up"}
      </Button>
    </form>
  );
};
