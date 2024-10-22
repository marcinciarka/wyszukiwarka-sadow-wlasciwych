import { GetCourtsResponse } from "@/app/server-actions/getCourts";
import { useFuzzySearchList } from "@nozbe/microfuzz/react";
import { RawResult } from "leaflet-geosearch/dist/providers/openStreetMapProvider.js";
import { SearchResult } from "leaflet-geosearch/dist/providers/provider.js";
import { useMemo } from "react";

export const useDistrictFuzzySearch = ({
  districtCourts,
  searchParams,
}: {
  districtCourts: GetCourtsResponse["courtsData"]["districtCourts"];
  searchParams: SearchResult<RawResult> | undefined;
}) => {
  const searchParamsTyped = searchParams?.raw as unknown as {
    address: {
      city: string;
      town: string;
      suburb: string;
      administrative: string;
      city_district: string;
      municipality: string;
    };
  };
  const districtCourtBroadQueryText = useMemo(() => {
    if (!searchParamsTyped) {
      return "";
    }
    return (
      searchParamsTyped.address.city ??
      searchParamsTyped.address.town ??
      searchParamsTyped.address.suburb ??
      searchParamsTyped.address.administrative ??
      searchParamsTyped.address.city_district ??
      searchParamsTyped.address.municipality?.replace("gmina", "").trim()
    );
  }, [searchParamsTyped]);

  const districtCourtNarrowQueryText = useMemo(() => {
    if (!searchParamsTyped) {
      return "";
    }
    return (
      searchParamsTyped.address.municipality?.replace("gmina", "").trim() ??
      searchParamsTyped.address.city_district ??
      searchParamsTyped.address.administrative ??
      searchParamsTyped.address.suburb
    );
  }, [searchParamsTyped]);

  const districtCourtBroadDataFiltered = useFuzzySearchList({
    list: districtCourts,
    queryText: districtCourtBroadQueryText,
    getText: (item) => [item.courtData],
    mapResultItem: ({ item, score, matches: [highlightRanges] }) => ({
      item,
      highlightRanges,
      score,
    }),
  });

  const districtCourtNarrowDataFiltered = useFuzzySearchList({
    list: districtCourts,
    queryText: districtCourtNarrowQueryText,
    getText: (item) => [item.courtData],
    mapResultItem: ({ item, score, matches: [highlightRanges] }) => ({
      item,
      highlightRanges,
      score,
    }),
  });

  const districtCourtBroadNameFiltered = useFuzzySearchList({
    list: districtCourts,
    queryText: districtCourtBroadQueryText,
    getText: (item) => [item.fullCourtName],
    mapResultItem: ({ item, score, matches: [highlightRanges] }) => ({
      item,
      highlightRanges,
      score,
    }),
  });

  const districtCourtNarrowNameFiltered = useFuzzySearchList({
    list: districtCourts,
    queryText: districtCourtNarrowQueryText,
    getText: (item) => [item.fullCourtName],
    mapResultItem: ({ item, score, matches: [highlightRanges] }) => ({
      item,
      highlightRanges,
      score,
    }),
  });
  return {
    districtCourtBroadDataFiltered,
    districtCourtNarrowDataFiltered,
    districtCourtBroadNameFiltered,
    districtCourtNarrowNameFiltered,
  };
};
