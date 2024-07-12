"use client";
import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import Loading from "../_components/Loading";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";
import { IoSend } from "react-icons/io5";
import { FaRocketchat } from "react-icons/fa6";
import { redirect } from "next/navigation";

const CreateIDPage = () => {
  const { toast } = useToast();
  const [uniqueID, setUniqueID] = useState("");
  const [loading, setLoading] = useState<boolean>(false);

  const { data: session } = useSession();

  console.log("ini session", session);

  const { data: user, isLoading: userLoading } = api.user.getUser.useQuery(
    { id: session?.user?.id ?? "" },
    {
      enabled: !!session?.user?.id,
    },
  );
  useEffect(() => {
    if (!session && !loading && !userLoading) {
      toast({
        title: "User has created the ID. You can chatting now ^.^",
      });
      redirect("/");
    } else if (session && user?.appID && !loading && !userLoading) {
      redirect("/chat");
    }
  }, [session, user?.appID, loading, userLoading]);

  const addIdMutation = api.signup.addId.useMutation({
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: () => {
      toast({
        title: "ID added successfully!",
      });
      setLoading(false);
    },
    onError: (error) => {
      setLoading(false);
      toast({
        variant: "destructive",
        title: error.message,
      });
    },
  });

  const handleAddId = async () => {
    console.log(session?.user?.id);
    console.log(uniqueID);

    if (!uniqueID.trim()) {
      toast({
        variant: "destructive",
        title: "Please enter a valid unique ID",
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

  const handleChatClick = () => {
    if (!user?.appID) {
      toast({
        variant: "destructive",
        title: "Please submit your unique ID before continuing",
      });
    } else {
      redirect("/chat");
    }
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
            <button
              onClick={handleChatClick}
              className="flex items-center justify-center rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
            >
              Let&apos;s Chat
              <FaRocketchat className="ml-3" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CreateIDPage;
