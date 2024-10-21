import { CourtSearchWrapper } from "@/app/components/CourtSearchWrapper";
import { getCourts } from "@/app/server-actions/getCourts";

export default async function SadyHome() {
  const { courtsData, stats } = await getCourts();
  return (
    <CourtSearchWrapper
      districtCourts={courtsData.districtCourts}
      stats={stats}
    />
  );
}
