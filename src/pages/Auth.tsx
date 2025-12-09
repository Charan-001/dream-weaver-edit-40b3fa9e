import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import lotteryLogo from "@/assets/lottery-logo.png";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { loginSchema, registerSchema } from "@/lib/validation";

type AuthStep = 'credentials' | 'otp';

const Auth = () => {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get('mode');
  const [isLogin, setIsLogin] = useState(mode === 'register' ? false : true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<AuthStep>('credentials');
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });
  const { toast } = useToast();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setIsLoading(true);

    try {
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
          setIsLoading(false);
          return;
        }

        // Sign up with Supabase using OTP
        const { error } = await supabase.auth.signUp({
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
          setIsLoading(false);
          return;
        }

        // Send OTP for email verification
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: formData.email,
          options: {
            shouldCreateUser: false,
          },
        });

        if (otpError) {
          toast({
            title: "Failed to send OTP",
            description: otpError.message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: "OTP Sent",
          description: "Please check your email for the verification code",
        });
        setStep('otp');
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
          setIsLoading(false);
          return;
        }

        // Verify password first
        const { error: passwordError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (passwordError) {
          toast({
            title: "Login Failed",
            description: passwordError.message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Sign out and send OTP for verification
        await supabase.auth.signOut();

        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: formData.email,
          options: {
            shouldCreateUser: false,
          },
        });

        if (otpError) {
          toast({
            title: "Failed to send OTP",
            description: otpError.message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: "OTP Sent",
          description: "Please check your email for the verification code",
        });
        setStep('otp');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (otp.length !== 6) {
        toast({
          title: "Invalid OTP",
          description: "Please enter a 6-digit OTP",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: otp,
        type: 'email',
      });

      if (error) {
        toast({
          title: "Verification Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!isLogin) {
        toast({
          title: "Registration Successful",
          description: "Your email has been verified. Welcome to DL Raffle!",
        });
      }

      // Check if user is admin
      if (data.user) {
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
            title: isLogin ? "Login Successful" : "Registration Successful",
            description: "Welcome to DL Raffle",
          });
          navigate("/dashboard");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        toast({
          title: "Failed to resend OTP",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "OTP Resent",
        description: "Please check your email for the new verification code",
      });
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setOtp("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 md:px-8 lg:px-12 py-8 md:py-12">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-4 pb-8">
            <img src={lotteryLogo} alt="DL Raffle Logo" className="w-24 h-24 mx-auto" />
            <CardTitle className="text-2xl font-bold">
              {step === 'otp' 
                ? "Verify Email" 
                : isLogin 
                  ? "Login" 
                  : "Register"}
            </CardTitle>
            {step === 'otp' && (
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code sent to {formData.email}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {step === 'credentials' ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
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
                        disabled={isLoading}
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
                        disabled={isLoading}
                      />
                      <p className="text-xs text-muted-foreground">
                        Please enter a valid phone number. Ticket details will be sent to this number.
                      </p>
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                        disabled={isLoading}
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
                        disabled={isLoading}
                      />
                      <Label htmlFor="terms" className={`text-sm ${validationErrors.termsAccepted ? "text-destructive" : ""}`}>
                        I accept the terms and conditions
                      </Label>
                    </div>
                    {validationErrors.termsAccepted && <p className="text-xs text-destructive">{validationErrors.termsAccepted}</p>}
                  </>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Sending OTP..." : isLogin ? "Send OTP" : "Register & Send OTP"}
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
                      disabled={isLoading}
                    >
                      {isLogin ? "Register" : "Login"}
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <InputOTP
                    value={otp}
                    onChange={setOtp}
                    maxLength={6}
                    disabled={isLoading}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </Button>

                <div className="flex flex-col items-center space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="text-sm text-primary hover:underline font-medium"
                    disabled={isLoading}
                  >
                    Resend OTP
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToCredentials}
                    className="text-sm text-muted-foreground hover:underline"
                    disabled={isLoading}
                  >
                    ← Back to {isLogin ? "Login" : "Registration"}
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default Auth;
