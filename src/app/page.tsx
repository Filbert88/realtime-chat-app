"use client";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/trpc/react";
import Loading from "./_components/Loading";
import Toast from "./_components/Toast";
import { ToastState } from "./_components/Toast";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { IoSend } from "react-icons/io5";
import { FaRocketchat } from "react-icons/fa6";

export default function Home() {
  const [uniqueID, setUniqueID] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState>({
    isOpen: false,
    message: "",
    type: "error",
  });
  const { data: session } = useSession();
  console.log("ini session", session);

  const addIdMutation = api.signup.addId.useMutation({
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: () => {
      setToast({
        isOpen: true,
        message: "ID added successfully!",
        type: "success",
      });
      setLoading(false);
    },
    onError: (error) => {
      setLoading(false);
      setToast({ isOpen: true, message: error.message, type: "error" });
    },
  });

  const handleAddId = async () => {
    console.log(session?.user?.id);
    console.log(uniqueID);

    if (!uniqueID.trim()) {
      setToast({
        isOpen: true,
        message: "Please enter a valid unique ID.",
        type: "error",
      });
      return;
    }

    if (session?.user?.id && uniqueID) {
      await addIdMutation.mutateAsync({
        userId: session.user.id,
        appID: uniqueID,
      });
    }
  };

  const handleSignOut = () => {
    void signOut();
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Hi&#44;{" "}
          <span className="capitalize text-[hsl(280,100%,70%)]">
            {session?.user?.name}
          </span>
        </h1>
        <div className="flex flex-col items-center gap-2">
          <div className="text-xl font-semibold">
            Before continue&#44; let&apos;s make your ID
          </div>
          <div className="flex flex-row items-center gap-4">
            <input
              placeholder="Your unique ID"
              className="rounded-lg bg-white/20 p-3"
              value={uniqueID}
              onChange={(e) => setUniqueID(e.target.value)}
            />
            <button onClick={handleAddId} className="">
              <IoSend />
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-col items-center justify-center gap-4">
            <Link
              href="/chat"
              className="flex items-center justify-center rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
            >
              Let&apos;s Chat
              <FaRocketchat className="ml-3" />
            </Link>
          </div>
        </div>
        <button onClick={handleSignOut}>Sign Out</button>
      </div>
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        closeToast={() => setToast({ ...toast, isOpen: false })}
      />
    </main>
  );
}
