import { Suspense } from "react";
import CandidateList from "@/components/CandidateList";

// useSearchParams (used inside CandidateList) requires a Suspense
// boundary around it per Next.js's App Router rules.
export default function HomePage() {
  return (
    <Suspense fallback={<p className="p-6">Loading...</p>}>
      <CandidateList />
    </Suspense>
  );
}