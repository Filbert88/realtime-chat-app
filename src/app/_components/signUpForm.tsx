"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Loading from "./Loading";
import { api } from "@/trpc/react";
import { useToast } from "@/components/ui/use-toast";

const SignUpForm: React.FC = () => {
  const { toast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  const validateName = (name: string): string => {
    if (name.length < 3) {
      return "name must be at least 3 characters long.";
    }
    return "";
  };

  const validateEmail = (email: string): string => {
    if (!email.includes("@")) {
      return "Please enter a valid email.";
    }
    return "";
  };

  const validatePassword = (password: string): string => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    return "";
  };

  const validatePhone = (phone: string): string => {
    if (!/^\d+$/.test(phone)) {
      return "Phone number must contain only digits";
    }
    if (phone.length < 10) {
      return "Phone number must be valid (> 10 characters)";
    }
    return "";
  };

  const signupMutation = api.signup.signup.useMutation({
    onMutate:() => {
      setLoading(true);
    },
    onSuccess:() =>{
      toast({
        title: "Signup successful!",
      });
      setLoading(false);
      router.push("/signin");
    },
    onError: () => {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "An error occurred",
      });
    },
  })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const phoneError = validatePhone(phone);
    const passwordError = validatePassword(password);
  
    if (nameError || emailError || phoneError || passwordError) {
      toast({
        variant: "destructive",
        title: nameError || emailError || passwordError || phoneError,
      });
      return;
    }

    console.log({ name: name, email: email, phone: phone, password: password });
    signupMutation.mutate({name, email,phone, password })
  };
  
  if (loading) {
    return <Loading />;
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex w-full max-w-[350px] flex-col gap-5 xl:gap-7">
      <form onSubmit={handleSubmit} className="flex flex-col items-center">
        <div className="text-4xl mb-6 font-bold text-white">Sign Up</div>
        <div className="flex flex-col space-y-6 font-normal w-full">
          <input
            placeholder="name"
            className="py-4 px-5 w-full sm:w-[350px] text-black rounded-md"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            placeholder="Email"
            className="py-4 px-5 w-full sm:w-[350px] text-black rounded-md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            placeholder="Phone Number"
            className="py-4 px-5 w-full sm:w-[350px] text-black rounded-md"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <div className="relative w-full sm:w-[350px]">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="py-4 px-5 w-full text-black rounded-md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {password && (
              <div
                className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                onClick={togglePasswordVisibility}
              >
                <Image
                  src="/visible.svg"
                  alt="visible"
                  width={20}
                  height={20}
                />
              </div>
            )}
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 rounded-lg py-3 px-5 w-full sm:w-[350px] text-white bg-[#1F1F1F]"
        >
          Sign Up
        </button>
        <div className="flex flex-row space-x-2 mt-2">
          <div className="text-gray-300">Already have an account?</div>
          <div
            className="hover:underline hover:cursor-pointer text-white"
            onClick={() => router.push("/signin")}
          >
            Sign In.
          </div>
        </div>
      </form>
    </div>
  );
};

export default SignUpForm;
