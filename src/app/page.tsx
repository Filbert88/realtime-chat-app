"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { IoIosLogOut } from "react-icons/io";
import { signOut } from "next-auth/react";

const handleSignOut = () => {
  void signOut();
};
export default function Page() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleChat = () => {
    router.push("/chat");
  };
  const userName = session?.user?.name;
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-800 text-white">
      <div className="mb-4 text-5xl font-bold">Hi There</div>
      {session ? (
        <div className="mb-6 text-xl">
          You are logged in as
          <span className="ml-1 font-semibold">{userName}</span>{" "}
        </div>
      ) : (
        <div>
          <p className="mb-8 text-xl">New here? Join us today!</p>
          <div className="flex flex-row justify-center gap-4">
            <button
              className="mb-4 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
              onClick={() => router.push("/signin")}
            >
              Sign In
            </button>
            <button
              className="mb-4 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
              onClick={() => router.push("/signup")}
            >
              Sign Up
            </button>
          </div>
        </div>
      )}

      <button
        className="rounded bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-700"
        onClick={handleChat}
      >
        Chat Now
      </button>

      <button className="absolute bottom-16 text-2xl" onClick={handleSignOut}>
        <IoIosLogOut />
      </button>
    </div>
  );
}
