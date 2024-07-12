import React from "react";
import SignUpForm from "../_components/signUpForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { redirect } from "next/navigation";

const SingUpPage = async () => {
  const session = await getServerSession(authOptions);
  if (session) {
    return redirect("/");
  }
  return (
    <main className="flex flex-auto items-center justify-center bg-[#2D2E30] min-h-screen overflow-hidden sm:px-0 px-5">
      <SignUpForm />
    </main>
  );
};

export default SingUpPage;
