import { redirect } from "next/navigation";

// On harbor-index.org the root is served by middleware (rewrite to
// /blog/harbor-index); this stub covers any direct hit and keeps the route
// buildable now that the leaderboard homepage has been removed.
export default function Home() {
  redirect("/blog/harbor-index");
}
