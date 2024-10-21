import { CourtsData } from "@/app/server-actions/getCourts";
import { HighlightRanges } from "@nozbe/microfuzz";

type ListType = {
  item: CourtsData[number];
  highlightRanges: HighlightRanges | null;
  score: number;
}[];

export function findDistrictCourt({
  districtCourtBroadNameFiltered,
  districtCourtNarrowNameFiltered,
  districtCourtBroadDataFiltered,
  districtCourtNarrowDataFiltered,
}: {
  districtCourtBroadNameFiltered: ListType;
  districtCourtNarrowNameFiltered: ListType;
  districtCourtBroadDataFiltered: ListType;
  districtCourtNarrowDataFiltered: ListType;
}) {
  const merged = new Map<
    string,
    Omit<
      (typeof districtCourtBroadDataFiltered)[number],
      "highlightRanges" | "score"
    > & {
      highlightCourtData?: HighlightRanges | null;
      highlightCourtName?: HighlightRanges | null;
      dataScore?: number;
      titleScore?: number;
    }
  >();
  districtCourtBroadNameFiltered.forEach(({ highlightRanges, score, item }) => {
    merged.set(item.fullCourtName, {
      item,
      highlightCourtName: highlightRanges,
      titleScore: score,
    });
  });
  districtCourtNarrowNameFiltered.forEach(
    ({ highlightRanges, score, item }) => {
      merged.set(item.fullCourtName, {
        item,
        highlightCourtName: highlightRanges,
        titleScore: score,
      });
    }
  );
  districtCourtBroadDataFiltered.forEach(({ highlightRanges, score, item }) => {
    const existing = merged.get(item.fullCourtName);
    merged.set(item.fullCourtName, {
      item,
      highlightCourtData: highlightRanges,
      highlightCourtName: existing?.highlightCourtName,
      dataScore: score,
      titleScore: existing?.titleScore || 10,
    });
  });
  districtCourtNarrowDataFiltered.forEach(
    ({ highlightRanges, score, item }) => {
      const existing = merged.get(item.fullCourtName);
      merged.set(item.fullCourtName, {
        item,
        highlightCourtData: highlightRanges,
        highlightCourtName: existing?.highlightCourtName,
        dataScore: score,
        titleScore: existing?.titleScore || 10,
      });
    }
  );
  const titleMeanScore =
    Array.from(merged.values()).reduce(
      (acc, { titleScore }) => acc + (titleScore || 0),
      0
    ) / merged.size;
  const dataMeanScore =
    Array.from(merged.values()).reduce(
      (acc, { dataScore }) => acc + (dataScore || 0),
      0
    ) / merged.size;
  return Array.from(merged.values())
    .sort((a, b) => {
      return (
        (a.dataScore || 0) +
        (a.titleScore || 0) -
        ((b.dataScore || 0) + (b.titleScore || 0))
      );
    })
    .filter((item) => {
      if ((item.dataScore || 0) + (item.titleScore || 0) >= 15) {
        return false;
      }
      return (
        (item.dataScore || 0) + (item.titleScore || 0) <
        titleMeanScore + dataMeanScore
      );
    });
}
