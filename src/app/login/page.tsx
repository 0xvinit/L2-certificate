"use client";
import { useAuthModal, useLogout, useSignerStatus, useUser } from "@account-kit/react";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const user = useUser();
  const { openAuthModal } = useAuthModal();
  const signerStatus = useSignerStatus();
  const { logout } = useLogout();
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user || !user.email) return;
      // Create app session cookie as soon as user logs in with Alchemy
      try {
        if (posting) return;
        setPosting(true);
        const resp = await fetch("/api/auth/alchemy", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: user.email }),
        });
        if (resp.ok) {
          // Redirect to dashboard when token set
          window.location.replace("/admin/dashboard");
        }
      } catch {}
      finally { setPosting(false); }
    })();
  }, [user]);

  return (
    <main className="flex min-h-screen flex-col items-center p-24 gap-4 justify-center text-center">
       {signerStatus.isInitializing ? (
        <>Loading...</>
      ) : user ? (
        <div className="flex flex-col gap-2 p-2">
          <p className="text-xl font-bold">Success!</p>
          You're logged in as {user.email ?? "anon"}.
          <button
            className="akui-btn akui-btn-primary mt-6"
            onClick={() => logout()}
          >
            Log out
          </button>
        </div>
      ) : (
        <button className="akui-btn akui-btn-primary" onClick={openAuthModal}>
          Login
        </button>
      )}
    </main>
  );
}
