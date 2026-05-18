import { LoadingState } from "@/components/system/loading-state";

export default function Loading() {
  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-6xl">
        <LoadingState />
      </div>
    </div>
  );
}