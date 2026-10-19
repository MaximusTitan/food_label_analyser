import { getCurrentUser } from "@/lib/server/auth";
import { AccountLinks } from "./AccountLinks";

/** Reads the session, so it must render inside a Suspense boundary. */
export async function AccountMenu() {
  const user = await getCurrentUser();
  return <AccountLinks email={user ? (user.email ?? "") : null} />;
}
