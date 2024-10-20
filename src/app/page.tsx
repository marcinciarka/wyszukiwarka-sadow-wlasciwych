import { CourtSearch } from "@/app/components/CourtSearch";
import { getLegal } from "@/app/server-actions/getLegal";

export default async function Home() {
  const { legalData, stats } = await getLegal();
  const courtTypes = Object.keys(stats?.courts || {});
  return (
    <div>
      <CourtSearch
        legalData={legalData}
        stats={stats}
        courtTypes={courtTypes}
      />
    </div>
  );
}
