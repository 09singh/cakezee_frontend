import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

import useAuth from "../../../hooks/useAuth";

function StaffLogin() {
  const navigate = useNavigate();
  const { loginStaff } = useAuth();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    // Remove previous error when user starts typing
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await loginStaff(
        formData.email,
        formData.password
      );

      console.log("Staff login successful:", response.user);

      // Role-based redirect
      switch (response.user.role) {
        case "admin":
          navigate("/admin");
          break;

        case "kitchen":
          navigate("/kitchen");
          break;

        case "delivery":
          navigate("/delivery");
          break;

        default:
          setError("Your account does not have staff access.");
      }
    } catch (error) {
      console.error("Staff login failed:", error);

      const message =
        error.response?.data?.message ||
        "Unable to sign in. Please check your email and password.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f6f2] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2f211c] text-white shadow-sm">
            <ShieldCheck size={27} strokeWidth={1.8} />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#2f211c]">
            Cakezee
          </h1>

          <p className="mt-1 text-sm text-[#81756e]">
            Staff Management Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-[#e9e1da] bg-white p-6 shadow-[0_10px_40px_rgba(47,33,28,0.06)] sm:p-8">

          <div className="mb-7">
            <h2 className="text-xl font-semibold text-[#2f211c]">
              Staff Login
            </h2>

            <p className="mt-1.5 text-sm leading-6 text-[#81756e]">
              Sign in using your authorized staff account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#443630]"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9c918a]"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="staff@cakezee.com"
                  autoComplete="email"
                  required
                  className="h-12 w-full rounded-xl border border-[#e4dcd5] bg-[#fffdfb] pl-11 pr-4 text-sm text-[#2f211c] outline-none transition placeholder:text-[#aaa09a] focus:border-[#8b7165] focus:ring-2 focus:ring-[#8b7165]/10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#443630]"
                >
                  Password
                </label>

                <button
                  type="button"
                  className="text-xs font-medium text-[#76594d] hover:text-[#2f211c]"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9c918a]"
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="h-12 w-full rounded-xl border border-[#e4dcd5] bg-[#fffdfb] pl-11 pr-12 text-sm text-[#2f211c] outline-none transition placeholder:text-[#aaa09a] focus:border-[#8b7165] focus:ring-2 focus:ring-[#8b7165]/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#968a83] transition hover:text-[#443630]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-sm leading-5 text-red-600">
                  {error}
                </p>
              </div>
            )}

            {/* Login */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#2f211c] text-sm font-semibold text-white transition hover:bg-[#443029] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Security note */}
          <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#faf7f4] p-3.5">
            <ShieldCheck
              size={18}
              className="mt-0.5 shrink-0 text-[#76594d]"
            />

            <p className="text-xs leading-5 text-[#81756e]">
              This portal is only for authorized Cakezee staff.
              Your account permissions are determined by your assigned role.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-[#9a8e87]">
          Cakezee Management Portal
        </p>
      </div>
    </div>
  );
}

export default StaffLogin;