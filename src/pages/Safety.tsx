import { SafetyOverview } from "@/components/SafetyOverview";

const Safety = () => {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="font-heading font-bold text-3xl">Safety</h1>
        <SafetyOverview />
      </div>
    </div>
  );
};

export default Safety;


