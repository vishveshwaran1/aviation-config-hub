import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LogoData from "@/assets/image.png";
import LoginBg from "@/assets/login-bg.jpg";
import FlightIcon from "@/assets/icon.png";

const Login = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn({ email, password });
      toast.success("Logged in successfully");
    } catch (error: any) {
      toast.error(error.error || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gray-50 bg-cover bg-center"
      style={{ backgroundImage: `url(${LoginBg})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

      <div className="relative w-full max-w-md p-4">
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Header Section */}
          <div className="relative h-32 bg-[#dbeafe] p-6">
            <div className="relative z-10">
              <h1 className="text-xl font-bold text-[#4f46e5]">Welcome to Aerotrend !</h1>
              <p className="mt-1 text-sm text-[#6b7280]">Sign in to continue</p>
            </div>

            {/* Plane Decoration */}
            <div className="absolute right-4 top-4 opacity-80">
              <img src={FlightIcon} alt="Flight Icon" className="h-24 w-24 object-contain opacity-90" />
              {/* Dotted trail effect (simulated) */}
              <div className="absolute -left-4 top-12 h-1 w-1 rounded-full bg-slate-400" />
              <div className="absolute -left-8 top-16 h-1 w-1 rounded-full bg-slate-400" />
              <div className="absolute -left-12 top-20 h-1 w-1 rounded-full bg-slate-400" />
            </div>
          </div>

          {/* Logo Section */}
          <div className="relative -mt-10 ml-8 mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md p-1">
              <div className="h-full w-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                <img src={LogoData} alt="Logo" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="px-8 pb-8 pt-2">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter email"
                  className="h-11 border-gray-300 focus:border-blue-500 rounded-md"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter Password"
                  className="h-11 border-gray-300 focus:border-blue-500 rounded-md"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="remember" className="data-[state=checked]:bg-blue-600 border-gray-300" />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-600"
                >
                  Remember me
                </label>
              </div>

              <Button type="submit" className="w-full h-11 bg-[#4f46e5] hover:bg-[#4338ca] text-white text-base font-medium rounded-md" disabled={loading}>
                {loading ? "Logging in..." : "Log In"}
              </Button>

              <div className="text-center pt-2">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                  <Lock className="h-3 w-3" />
                  <Link to="/forgot-password">Forgot your password?</Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
