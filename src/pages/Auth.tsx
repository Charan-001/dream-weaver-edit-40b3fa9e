import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import lotteryLogo from "@/assets/lottery-logo.png";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { loginSchema, registerSchema } from "@/lib/validation";

const Auth = () => {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get('mode');
  const [isLogin, setIsLogin] = useState(mode === 'register' ? false : true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    if (!isLogin) {
      // Validate registration with zod
      const result = registerSchema.safeParse(formData);
      
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setValidationErrors(errors);
        toast({
          title: "Validation Error",
          description: "Please fix the errors in the form",
          variant: "destructive",
        });
        return;
      }

      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: formData.name,
            phone: formData.phone,
          },
        },
      });

      if (error) {
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Registration Successful",
        description: "You can now log in with your credentials",
      });
      setIsLogin(true);
      setFormData({
        name: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
        termsAccepted: false,
      });
      setValidationErrors({});
    } else {
      // Validate login with zod
      const result = loginSchema.safeParse({
        email: formData.email,
        password: formData.password,
      });
      
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setValidationErrors(errors);
        toast({
          title: "Validation Error",
          description: "Please enter valid email and password",
          variant: "destructive",
        });
        return;
      }

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Check if user is admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleData) {
        toast({
          title: "Admin Login Successful",
          description: "Welcome to Admin Panel",
        });
        navigate("/admin");
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome to DL Raffle",
        });
        navigate("/dashboard");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 md:px-8 lg:px-12 py-8 md:py-12">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-4 pb-8">
            <img src={lotteryLogo} alt="DL Raffle Logo" className="w-24 h-24 mx-auto" />
            <CardTitle className="text-2xl font-bold">
              {isLogin ? "Login" : "Register"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={validationErrors.name ? "border-destructive" : ""}
                    />
                    {validationErrors.name && <p className="text-xs text-destructive">{validationErrors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your 10-digit phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className={validationErrors.phone ? "border-destructive" : ""}
                    />
                    {validationErrors.phone && <p className="text-xs text-destructive">{validationErrors.phone}</p>}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email ID</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={validationErrors.email ? "border-destructive" : ""}
                />
                {validationErrors.email && <p className="text-xs text-destructive">{validationErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={isLogin ? "Enter your password" : "Min 8 characters"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={validationErrors.password ? "border-destructive" : ""}
                />
                {validationErrors.password && <p className="text-xs text-destructive">{validationErrors.password}</p>}
              </div>

              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      className={validationErrors.confirmPassword ? "border-destructive" : ""}
                    />
                    {validationErrors.confirmPassword && <p className="text-xs text-destructive">{validationErrors.confirmPassword}</p>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={formData.termsAccepted}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, termsAccepted: checked as boolean })
                      }
                    />
                    <Label htmlFor="terms" className={`text-sm ${validationErrors.termsAccepted ? "text-destructive" : ""}`}>
                      I accept the terms and conditions
                    </Label>
                  </div>
                  {validationErrors.termsAccepted && <p className="text-xs text-destructive">{validationErrors.termsAccepted}</p>}
                </>
              )}

              <Button type="submit" className="w-full" size="lg">
                {isLogin ? "Login" : "Register"}
              </Button>

              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                  {isLogin ? "New user?" : "Existing user?"}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setValidationErrors({});
                    }}
                    className="ml-2 text-primary hover:underline font-medium"
                  >
                    {isLogin ? "Register" : "Login"}
                  </button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default Auth;
