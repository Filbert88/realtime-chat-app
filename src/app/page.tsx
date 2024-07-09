"use client";
import Link from "next/link";
import { useState } from "react";
import { getServerAuthSession } from "@/server/auth";
import { api } from "@/trpc/react";
import Loading from "./_components/Loading";
import Toast from "./_components/Toast";
import { ToastState } from "./_components/Toast";
import { useSession } from "next-auth/react";

export default function Home() {
  const [uniqueID, setUniqueID] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState>({
    isOpen: false,
    message: "",
    type: "error",
  });
  const { data: session } = useSession();
  console.log(session);

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

  const handleAddId = () => {
    console.log(session?.user?.id);
    console.log(uniqueID);
    if (session?.user?.id && uniqueID) {
      addIdMutation.mutate({
        userId: session.user.id,
        appID: uniqueID,
      });
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Hi,{" "}
          <span className="capitalize text-[hsl(280,100%,70%)]">
            {session?.user?.name}
          </span>
        </h1>
        <div className="flex flex-col items-center gap-2">
          <div className="text-xl font-semibold">
            Before continue, let's make your ID
          </div>
          <input
            placeholder="Your unique ID"
            className="rounded-lg bg-white/20 p-3"
            value={uniqueID}
            onChange={(e) => setUniqueID(e.target.value)}
          />
          <button
            onClick={handleAddId}
            className="mt-4 rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
          >
            Submit ID
          </button>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-col items-center justify-center gap-4">
            <Link
              href="/chat"
              className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
            >
              Let's Chat
            </Link>
          </div>
        </div>
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
