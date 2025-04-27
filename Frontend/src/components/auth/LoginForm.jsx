import React, {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {toast} from "react-hot-toast";
import {EyeIcon, EyeSlashIcon} from "@heroicons/react/24/outline";
import axios from "../../utils/axios";
import {assets} from "../../assets/assets";
import {useAuth} from "../../context/AuthContext"; // Add this import

const LoginForm = () => {
  const navigate = useNavigate();
  const {login} = useAuth(); // Add this line
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const validateField = (name, value) => {
    let newErrors = {...errors};

    switch (name) {
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          newErrors.email = "Email is required";
        } else if (!emailRegex.test(value)) {
          newErrors.email = "Please enter a valid email address";
        } else {
          delete newErrors.email;
        }
        break;

      case "password":
        if (!value) {
          newErrors.password = "Password is required";
        } else if (value.length < 6) {
          newErrors.password = "Password must be at least 6 characters";
        } else {
          delete newErrors.password;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const {name, value} = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix all errors before submitting");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("/auth/login", formData);

      if (response.data.token) {
        login(response.data.user, response.data.token);
        toast.success("Welcome back!");
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.msg || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-md border border-base-navgray px-3 py-2 focus:outline-none focus:ring-1 transition-colors duration-200 ${
                errors.email
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-primary focus:ring-primary"
              }`}
              required
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500 animate-fadeIn">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder= "Password"
                value={formData.password}
                onChange={handleChange}
                className={`mt-1 block w-full mb-6 rounded-md shadow-md border border-base-navgray px-3 py-2 pr-10 focus:outline-none focus:ring-1 transition-colors duration-200 ${
                  errors.password
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-primary focus:ring-primary"
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400"/>
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400"/>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500 animate-fadeIn">
                {errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || Object.keys(errors).length > 0}
            className={`w-full bg-base-black text-base-white py-3 px-4 rounded-md transition-all duration-300
            ${
              loading
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-primary-hover"
            }
            transform hover:scale-[1.02] active:scale-[0.98]`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/auth/register"
            className="text-primary hover:text-primary-hover font-medium transition-colors duration-200"
          >
            Sign up
          </Link>
        </p>
      </div>
    </>
  );
};

export default LoginForm;
