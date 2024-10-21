"use client";

import { Court } from "@/app/components/Court";
import { useMemo, useState } from "react";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import { SearchResult } from "leaflet-geosearch/dist/providers/provider.js";
import { RawResult } from "leaflet-geosearch/dist/providers/openStreetMapProvider.js";
import { GetCourtsResponse } from "@/app/server-actions/getCourts";
import Link from "next/link";
import { findDistrictCourt } from "@/app/handlers/findDistrictCourt";
import { useDistrictFuzzySearch } from "@/app/handlers/useDistrictFuzzySearch";
import { safeEncodeUrl } from "@/app/handlers/urlEncodersDecoders";

export const CourtSearch = ({
  districtCourts,
  stats,
}: {
  districtCourts: GetCourtsResponse["courtsData"]["districtCourts"];
  stats: GetCourtsResponse["stats"];
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
  const handleSearchUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGeoSearchString(e.target.value);
    if (searchParams) {
      setGeoSearchResults([]);
      setSearchParams(undefined);
    }
  };
  const handleReset = async () => {
    setSearchParams(undefined);
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
  };

  const handleSetSearchParams = (params: SearchResult<RawResult>) => {
    setSearchParams(params);
  };

  const fuzzySearchResults = useDistrictFuzzySearch({
    districtCourts,
    searchParams,
  });

  const districtCourtFiltered = useMemo(() => {
    return findDistrictCourt(fuzzySearchResults);
  }, [fuzzySearchResults]);

  return (
    <>
      <div className="flex justify-center mt-10">
        <div className="text-center rounded-lg p-6 w-full md:w-[80%]">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Wyszukiwarka Sądów Właściwych
          </h1>
          <h3 className="text-xl text-gray-500 mb-6">
            {stats?.total} sądów w bazie, w tym {stats.courts?.districtCourts}{" "}
            sądów rejonowych, {stats.courts?.regionalCourts} okręgowych i{" "}
            {stats.courts?.appealCourts} apelacyjnych.
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-center">
            <input
              value={geoSearchString}
              onChange={handleSearchUpdate}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              type="text"
              placeholder="Szukaj (kod pocztowy, adres, miejscowość, etc)"
              className="w-full border border-gray-300 rounded-lg px-5 py-4 focus:outline-none focus:ring focus:ring-blue-500 size-lg"
            />
            <button
              className="bg-blue-500 w-full md:w-auto mt-2 md:mt-0 text-white rounded-lg px-6 py-4 ml-0 md:ml-2"
              onClick={handleSearch}
            >
              Szukaj
            </button>
            <button
              className="bg-red-500 w-full md:w-auto text-white mt-2 md:mt-0  ml-0 md:ml-2 rounded-lg px-6 py-4 ml-2"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto">
                {geoSearchResults.map((result) => (
                  <button
                    key={result.raw.place_id}
                    className={`w-full p-2 border hover:bg-gray-100 rounded-lg mb-2 text-sm ${
                      result.raw.place_id === searchParams?.raw.place_id
                        ? "border-blue-500 text-blue-500"
                        : "border-gray-200"
                    }`}
                    onClick={() => handleSetSearchParams(result)}
                  >
                    <p>{result.label.replace(", Polska", "").trim()}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {!!searchParams && (
        <>
          <p className="text-center text-gray-600 font-bold">
            Wybierz sąd rejonowy.
          </p>
          <p className="text-center text-gray-600 mx-3">
            Po kliknięciu w odpowiedni sąd zobaczysz strukturę sądów wchodzących
            w jego skład,
            <br />
            począwszy od sądu rejonowego, poprzez sąd okręgowy, aż do sądu
            apelacyjnego.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 p-4">
            {districtCourtFiltered.map(
              ({ item, highlightCourtData, highlightCourtName }) => (
                <Link
                  key={item.fullCourtName}
                  href={`/sad/${safeEncodeUrl(item.fullCourtName)}`}
                >
                  <Court
                    court={item}
                    highlightCourtData={highlightCourtData}
                    highlightCourtName={highlightCourtName}
                  />
                </Link>
              )
            )}
          </div>
        </>
      )}
      {!searchParams && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 p-4 mx-auto">
          {districtCourts.map((item) => (
            <Link
              key={item.fullCourtName}
              href={`/sad/${safeEncodeUrl(item.fullCourtName)}`}
            >
              <Court court={item} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
};
