import React, { useState } from 'react';
import Navbar from '../components/Navbar/Navbar';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { validateEmail } from '../utils/helper';
import axiosInstance from '../utils/axiosInstance';
import { Input, Button, Checkbox } from '@heroui/react';

const SignUp = () => {
  const location = useLocation();

  const [firstname, setFirstName] = useState("");
  const [lastname, setLastName] = useState("");
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  
  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!firstname) {
      setError("Please enter your first name");
      return;
    }

    if (!lastname) {
      setError("Please enter your last name");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!password) {
      setError("Please enter your password");
      return;
    }

    setError("");

    try {
      const response = await axiosInstance.post("/create-account", {
        firstName: firstname,
        lastName: lastname,
        email: email,
        password: password,
      });

      if (response.data && response.data.error) {
        setError(response.data.message);
        return;
      }

      if (response.data && response.data.accessToken) {
        localStorage.setItem("token", response.data.accessToken);
        navigate("/chatbot");
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("An unexpected error occurred. Please try again!");
      }
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500">
        <div className="bg-purple-800/30 backdrop-blur-lg p-10 max-w-md w-full rounded-xl shadow-lg space-y-6">
          <h4 className="text-3xl font-semibold text-white text-center">Welcome to NewRun</h4>

          <form onSubmit={handleSignUp} className="space-y-5">
            {/* First Name Input */}
            <Input
              fullWidth
              label="First Name"
              placeholder="Enter your first name"
              radius="lg"
              isClearable
              classNames={{
                label: "text-white/90",
                input: [
                  "bg-transparent",
                  "text-white/90",
                  "placeholder:text-white/30",
                ],
                innerWrapper: "bg-transparent",
                inputWrapper: [
                  "shadow-lg",
                  "bg-white/20",
                  "backdrop-blur-lg",
                  "hover:bg-white/30",
                  "group-data-[focus=true]:bg-white/20",
                  "!cursor-text",
                ],
              }}
              value={firstname}
              onChange={(e) => setFirstName(e.target.value)}
            />

            {/* Last Name Input */}
            <Input
              fullWidth
              label="Last Name"
              placeholder="Enter your last name"
              radius="lg"
              isClearable
              classNames={{
                label: "text-white/90",
                input: [
                  "bg-transparent",
                  "text-white/90",
                  "placeholder:text-white/60",
                ],
                innerWrapper: "bg-transparent",
                inputWrapper: [
                  "shadow-lg",
                  "bg-white/20",
                  "backdrop-blur-lg",
                  "hover:bg-white/30",
                  "group-data-[focus=true]:bg-white/20",
                  "!cursor-text",
                ],
              }}
              value={lastname}
              onChange={(e) => setLastName(e.target.value)}
            />

            {/* Email Address Input */}
            <Input
              fullWidth
              label="Email Address"
              placeholder="Enter your email"
              type="email"
              radius="lg"
              isClearable
              classNames={{
                label: "text-white/90",
                input: [
                  "bg-transparent",
                  "text-white/90",
                  "placeholder:text-white/60",
                ],
                innerWrapper: "bg-transparent",
                inputWrapper: [
                  "shadow-lg",
                  "bg-white/20",
                  "backdrop-blur-lg",
                  "hover:bg-white/30",
                  "group-data-[focus=true]:bg-white/20",
                  "!cursor-text",
                ],
              }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {/* Password Input */}
            <Input
              fullWidth
              label="Password"
              placeholder="Enter your password"
              type="password"
              radius="lg"
              isClearable
              classNames={{
                label: "text-white/90",
                input: [
                  "bg-transparent",
                  "text-white/90",
                  "placeholder:text-white/60",
                ],
                innerWrapper: "bg-transparent",
                inputWrapper: [
                  "shadow-lg",
                  "bg-white/20",
                  "backdrop-blur-lg",
                  "hover:bg-white/30",
                  "group-data-[focus=true]:bg-white/20",
                  "!cursor-text",
                ],
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* Confirm Password Input */}
            <Input
              fullWidth
              label="Confirm Password"
              placeholder="Confirm your password"
              type="password"
              radius="lg"
              isClearable
              classNames={{
                label: "text-white/90",
                input: [
                  "bg-transparent",
                  "text-white/90",
                  "placeholder:text-white/60",
                ],
                innerWrapper: "bg-transparent",
                inputWrapper: [
                  "shadow-lg",
                  "bg-white/20",
                  "backdrop-blur-lg",
                  "hover:bg-white/30",
                  "group-data-[focus=true]:bg-white/20",
                  "!cursor-text",
                ],
              }}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {/* Checkbox for Terms */}
            <Checkbox color="primary" className="text-white">
              I agree with the <span className="text-blue-400">Terms</span> and <span className="text-blue-400">Privacy Policy</span>
            </Checkbox>

            {/* Submit Button */}
            <Button color="primary" variant="solid" type="submit" className="w-full text-white font-bold">
              Sign Up
            </Button>
          </form>

          {/* Divider with OR */}
          <div className="flex items-center justify-center my-4">
            <hr className="flex-grow border-t border-gray-400" />
            <span className="mx-3 text-gray-200">OR</span>
            <hr className="flex-grow border-t border-gray-400" />
          </div>

          {/* Social Buttons */}
          <div className="flex flex-col gap-4">
            <Button variant="shadow" color="danger" className="w-full">
              Continue with Google
            </Button>
            <Button variant="shadow" color="danger" className="w-full">
              Continue with Github
            </Button>
          </div>

          {/* Error Message */}
          {error && <div className="text-red-500 text-center mt-4">{error}</div>}

          <p className="text-white text-center mt-4">
            Already have an account? <Link to='/login' className="text-blue-300 hover:underline">Log In</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default SignUp;
