import { Suspense } from "react";

import { HomeScreen } from "@/components/home/HomeScreen";
import { LandingPage } from "@/components/landing/LandingPage";
import { getCurrentUser } from "@/lib/server/auth";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeForVisitor />
    </Suspense>
  );
}

/** Signed-in users get the scanner; everyone else gets the landing page. */
async function HomeForVisitor() {
  const user = await getCurrentUser();
  return user ? <HomeScreen /> : <LandingPage />;
}
