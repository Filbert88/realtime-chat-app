"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import Loading from "./Loading";

interface Errors {
  email: string;
  password: string;
}

interface Touched {
  email: boolean;
  password: boolean;
}

const SigninForm: React.FC = () => {
  const { toast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<Errors>({ email: "", password: "" });
  const [touched, setTouched] = useState<Touched>({
    email: false,
    password: false,
  });
  const [loading, setLoading] = useState<boolean>(false);

  const handleBlur = (field: keyof Touched): void => {
    setTouched({ ...touched, [field]: true });
    if (field === "email") {
      setErrors({ ...errors, email: validateEmail(email) });
    } else {
      setErrors({ ...errors, password: validatePassword(password) });
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setPassword(e.target.value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateEmail = (email: string): string => {
    if (!email) {
      return "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      return "Please enter a valid email.";
    }
    return "";
  };

  const validatePassword = (password: string): string => {
    if (!password) {
      return "Password is required.";
    } else if (password.length < 4 || password.length > 60) {
      return "Your password must contain between 4 and 60 characters.";
    }
    return "";
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      setTouched({ email: true, password: true });
      toast({
        variant: "destructive",
        title: emailError || passwordError,
      });
      return;
    }

    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    console.log(result);
    if (result?.error) {
      toast({
        variant: "destructive",
        title: result.error,
      });
      setLoading(false);
    } else {
      router.refresh();
      router.push("/");
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="flex w-full max-w-[350px] flex-col gap-5 xl:gap-7">
      <form onSubmit={handleSubmit} className="flex flex-col items-center">
        <div className="mb-6 text-4xl font-bold text-white">Sign In</div>
        <div className="flex w-full flex-col items-center font-normal">
          <input
            placeholder="Email"
            className="w-full rounded-md px-5 py-4 text-black sm:w-[350px]"
            value={email}
            onChange={handleEmailChange}
            onBlur={() => handleBlur("email")}
            required
          />
          {touched.email && errors.email && (
            <div className="mt-1 w-full text-sm text-red">{errors.email}</div>
          )}
        </div>
        <div className="relative mt-6 w-full sm:w-[350px]">
          <input
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            className="w-full rounded-md px-5 py-4 text-black"
            value={password}
            onChange={handlePasswordChange}
            onBlur={() => handleBlur("password")}
            required
          />
          {password && (
            <div
              className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3"
              onClick={togglePasswordVisibility}
            >
              <Image
                src="/visible.svg"
                alt="Toggle visibility"
                width={20}
                height={20}
              />
            </div>
          )}
        </div>
        {touched.password && errors.password && (
          <div className="mt-1 w-full text-sm text-red">{errors.password}</div>
        )}
        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-[#1F1F1F] px-5 py-3 text-white sm:w-[350px]"
        >
          Sign In
        </button>
        <div className="mt-2 flex flex-row space-x-2">
          <div className="text-gray-300">New here?</div>
          <a
            className="text-white hover:cursor-pointer hover:underline"
            onClick={() => router.push("/signup")}
          >
            Sign up now.
          </a>
        </div>
      </form>
    </div>
  );
};

export default SigninForm;
