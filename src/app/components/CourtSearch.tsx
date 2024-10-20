"use client";

import { Court } from "@/app/components/Court";
import { LegalData } from "@/app/server-actions/getLegal";
import { useMemo, useState } from "react";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import { SearchResult } from "leaflet-geosearch/dist/providers/provider.js";
import { RawResult } from "leaflet-geosearch/dist/providers/openStreetMapProvider.js";
import { useFuzzySearchList } from "@nozbe/microfuzz/react";

export const CourtSearch = ({
  legalData,
  stats,
  courtTypes,
}: {
  legalData: LegalData;
  stats?: { total: number; courts: Record<string, number> };
  courtTypes: string[];
}) => {
  const geoSearchProvider = new OpenStreetMapProvider({
    params: {
      "accept-language": "pl",
      countrycodes: "pl",
      format: "geojson",
      addressdetails: 1,
    },
  });

  const [geoSearchResults, setGeoSearchResults] = useState<
    SearchResult<RawResult>[]
  >([]);
  const [geoSearchString, setGeoSearchString] = useState("");
  const [searchParams, setSearchParams] = useState<SearchResult<RawResult>>();
  const [regionalSearchParams, setRegionalSearchParams] =
    useState<(typeof legalData)[number]>();
  const [appealSearchParams, setAppealSearchParams] =
    useState<(typeof legalData)[number]>();
  const handleSearchUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGeoSearchString(e.target.value);
    if (searchParams) {
      setGeoSearchResults([]);
      setSearchParams(undefined);
      setRegionalSearchParams(undefined);
      setAppealSearchParams(undefined);
    }
  };
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
  const handleReset = async () => {
    setSearchParams(undefined);
    setRegionalSearchParams(undefined);
    setAppealSearchParams(undefined);
    setGeoSearchResults([]);
    setGeoSearchString("");
  };
  const handleSearch = async () => {
    const geoSearchResultsTemp = await geoSearchProvider.search({
      query: geoSearchString,
    });
    setGeoSearchResults(geoSearchResultsTemp);
    if (geoSearchResultsTemp.length > 0) {
      setSearchParams(geoSearchResultsTemp[0]);
    }
    setRegionalSearchParams(undefined);
    setAppealSearchParams(undefined);
  };
  const handleSetRegionalSearchParams = (
    params: (typeof legalData)[number]
  ) => {
    setRegionalSearchParams(params);
    setAppealSearchParams(undefined);
  };
  const handleSetAppealSearchParams = (params: (typeof legalData)[number]) => {
    setAppealSearchParams(params);
  };

  const handleSetSearchParams = (params: SearchResult<RawResult>) => {
    setSearchParams(params);
    setRegionalSearchParams(undefined);
    setAppealSearchParams(undefined);
  };

  const districtCourtList = useMemo(() => {
    return legalData.filter((court) => court.courtType === "Sąd Rejonowy");
  }, [legalData]);

  const regionalCourtList = useMemo(() => {
    return legalData.filter((court) => court.courtType === "Sąd Okręgowy");
  }, [legalData]);

  const appealCourtList = useMemo(() => {
    return legalData.filter((court) => court.courtType === "Sąd Apelacyjny");
  }, [legalData]);

  const districtCourtQueryText = useMemo(() => {
    if (!searchParamsTyped) {
      return "";
    }
    const broadQuery =
      searchParamsTyped.address.city ??
      searchParamsTyped.address.town ??
      searchParamsTyped.address.suburb ??
      searchParamsTyped.address.administrative ??
      searchParamsTyped.address.city_district ??
      searchParamsTyped.address.municipality?.replace("gmina", "").trim();
    const narrowQuery =
      searchParamsTyped.address.suburb ??
      searchParamsTyped.address.city_district ??
      searchParamsTyped.address.municipality?.replace("gmina", "").trim();

    return `${broadQuery}${
      narrowQuery && narrowQuery !== broadQuery ? ` ${narrowQuery}` : ""
    }`;
  }, [searchParamsTyped]);

  const districtCourtFiltered = useFuzzySearchList({
    list: districtCourtList,
    // If `queryText` is blank, `list` is returned in whole
    queryText: districtCourtQueryText,
    // optional `getText` or `key`, same as with `createFuzzySearch`
    getText: (item) => [item.courtData],
    // arbitrary mapping function, takes `FuzzyResult<T>` as input
    mapResultItem: ({ item, score, matches: [highlightRanges] }) => ({
      item,
      highlightRanges,
      score,
    }),
  });

  const regionalCourtQueryText = useMemo(() => {
    if (!regionalSearchParams) {
      return "";
    }
    return `${regionalSearchParams.courtCity
      .replace("w ", "")
      .replace("we ", "")
      .trim()}`;
  }, [regionalSearchParams]);

  const regionalCourtFiltered = useFuzzySearchList({
    list: regionalCourtList,
    // If `queryText` is blank, `list` is returned in whole
    queryText: regionalCourtQueryText,
    // optional `getText` or `key`, same as with `createFuzzySearch`
    getText: (item) => [item.courtData],
    // arbitrary mapping function, takes `FuzzyResult<T>` as input
    mapResultItem: ({ item, score, matches: [highlightRanges] }) => ({
      item,
      highlightRanges,
      score,
    }),
  });

  const appealCourtQueryText = useMemo(() => {
    if (!appealSearchParams) {
      return "";
    }
    return `${appealSearchParams.courtCity
      .replace("w ", "")
      .replace("we ", "")
      .trim()}`;
  }, [appealSearchParams]);

  const appealCourtFiltered = useFuzzySearchList({
    list: appealCourtList,
    // If `queryText` is blank, `list` is returned in whole
    queryText: appealCourtQueryText,
    // optional `getText` or `key`, same as with `createFuzzySearch`
    getText: (item) => [item.courtData],
    // arbitrary mapping function, takes `FuzzyResult<T>` as input
    mapResultItem: ({ item, score, matches: [highlightRanges] }) => ({
      item,
      highlightRanges,
      score,
    }),
  });

  const finalResults = useMemo(() => {
    return {
      districtCourtResults: districtCourtFiltered.filter(
        (court) => court.score > 0.3 && court.score < 5
      ),
      regionalCourtResults: regionalCourtFiltered.filter(
        (court) => court.score > 0.3 && court.score < 5
      ),
      appealCourtResults: appealCourtFiltered.filter(
        (court) => court.score > 0.3 && court.score < 5
      ),
    };
  }, [districtCourtFiltered, regionalCourtFiltered, appealCourtFiltered]);

  return (
    <>
      <div className="flex justify-center mt-10">
        <div className="text-center rounded-lg p-6 w-[1000px]">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Wyszukiwarka Sądów Właściwych
          </h1>
          <h1 className="text-xl text-gray-500 mb-6">
            {stats?.total} sądów w bazie (
            {courtTypes.map((key, index) =>
              index === courtTypes.length - 1
                ? `${key}: ${stats?.courts[key]}`
                : `${key}: ${stats?.courts[key]}, `
            )}
            )
          </h1>
          <div className="flex flex-row items-center justify-center">
            <input
              value={geoSearchString}
              onChange={handleSearchUpdate}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              type="text"
              placeholder="Szukaj (kod pocztowy lub miejscowość)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            <button
              className="bg-blue-500 text-white rounded-lg px-4 py-2 ml-2"
              onClick={handleSearch}
            >
              Szukaj
            </button>
            <button
              className="bg-red-500 text-white rounded-lg px-4 py-2 ml-2"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
          {geoSearchResults.length > 0 && (
            <div className="mt-4">
              <p className="text-gray-500 mb-3">
                Znaleziono {geoSearchResults.length} miejsc dla &quot;
                {geoSearchString}
                &quot;
              </p>
              <div className="grid grid-cols-4 gap-2">
                {geoSearchResults.map((result) => (
                  <button
                    key={result.raw.place_id}
                    className={`w-full p-2 border hover:bg-gray-100 rounded-lg mb-2 ${
                      result.raw.place_id === searchParams?.raw.place_id
                        ? "border-blue-500 text-blue-500"
                        : "border-gray-200"
                    }`}
                    onClick={() => handleSetSearchParams(result)}
                  >
                    <p>
                      {result.label
                        .replace("gmina", "")
                        .replace("powiat", "")
                        .replace("województwo", "")
                        .replace("Polska", "")
                        .trim()}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {!!searchParams && (
        <>
          <p className="text-center text-gray-500">
            Pokazuje wyniki dla &quot;{districtCourtQueryText}&quot;.
          </p>
          <p className="text-center text-gray-600 font-bold">
            Wybierz sąd rejonowy/okręgowy/apelacyjny.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 p-4">
            {regionalSearchParams ? (
              <Court
                court={regionalSearchParams}
                key={regionalSearchParams.fullCourtName}
                highlightCourtData={
                  finalResults.districtCourtResults.find(
                    (court) =>
                      court.item.fullCourtName ===
                      regionalSearchParams.fullCourtName
                  )?.highlightRanges
                }
                active
              />
            ) : (
              finalResults.districtCourtResults
                .slice(0, 4)
                .map(({ item, highlightRanges }) => (
                  <Court
                    court={item}
                    key={item.fullCourtName}
                    highlightCourtData={highlightRanges}
                    onClick={() => handleSetRegionalSearchParams(item)}
                  />
                ))
            )}
            {regionalSearchParams && appealSearchParams ? (
              <Court
                court={appealSearchParams}
                key={appealSearchParams.fullCourtName}
                highlightCourtData={
                  finalResults.regionalCourtResults.find(
                    (court) =>
                      court.item.fullCourtName ===
                      appealSearchParams.fullCourtName
                  )?.highlightRanges
                }
                active
              />
            ) : (
              finalResults.regionalCourtResults
                .slice(0, 4)
                .map(({ item, highlightRanges }) => (
                  <Court
                    court={item}
                    key={item.fullCourtName}
                    highlightCourtData={highlightRanges}
                    onClick={() => handleSetAppealSearchParams(item)}
                  />
                ))
            )}
            {appealSearchParams &&
              finalResults.appealCourtResults
                .slice(0, 4)
                .map(({ item, highlightRanges }) => (
                  <Court
                    court={item}
                    key={item.fullCourtName}
                    highlightCourtData={highlightRanges}
                    active
                  />
                ))}
          </div>
        </>
      )}
      {!searchParams && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 p-4 mx-auto">
          {legalData.map((court) => (
            <Court court={court} key={court.fullCourtName} />
          ))}
        </div>
      )}
    </>
  );
};
