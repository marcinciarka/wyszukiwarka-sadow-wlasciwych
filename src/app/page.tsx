import { CourtSearchWrapper } from "@/app/components/CourtSearchWrapper";
import { getLegal } from "@/app/server-actions/getLegal";

export default async function Home() {
  const { legalData, stats } = await getLegal();
  const courtTypes = Object.keys(stats?.courts || {});
  return (
    <div>
      <CourtSearchWrapper
        legalData={legalData}
        stats={stats}
        courtTypes={courtTypes}
      />
    </div>
  );
}
