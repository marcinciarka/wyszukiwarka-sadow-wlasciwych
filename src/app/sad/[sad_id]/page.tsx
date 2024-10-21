import { Court } from "@/app/components/Court";
import { safeDecodeUrl } from "@/app/handlers/urlEncodersDecoders";
import { getCourts } from "@/app/server-actions/getCourts";
import createFuzzySearch from "@nozbe/microfuzz";
import { IconArrowBackUp } from "@tabler/icons-react";
import Link from "next/link";

const normalizeCity = (city?: string) => {
  return city?.replace("w ", "").replace("we ", "").replace("dla ", "").trim();
};

const parseCourtDataToPlaces = (courtData: string) => {
  return courtData
    .split(/,| i we | i | w | w: | we | oraz /)
    .map((item) => item.replaceAll(":", ""))
    .map((item) => item.trim())
    .filter(
      (item) => item.slice(0, 1) === item.slice(0, 1).toLocaleUpperCase()
    );
};

export default async function ViewSad({
  params,
}: {
  params: { sad_id: string };
}) {
  const { courtsData } = await getCourts();
  const parsedCourtId = safeDecodeUrl(params.sad_id);
  const selectedDistrictCourt = courtsData.districtCourts.find(
    ({ fullCourtNameEncoded }) => fullCourtNameEncoded === params.sad_id
  );
  if (!selectedDistrictCourt) {
    return (
      <div className="flex justify-center mt-10">
        <div className="text-center rounded-lg p-6 w-full md:w-[80%]">
          <h1 className="text-3xl font-bold text-gray-800 mb-10">
            Wyszukiwarka Sądów Właściwych
          </h1>
          <Link href="/">
            <button className="bg-blue-500 w-full md:w-auto mt-2 mb-6 text-white rounded-lg px-6 py-3">
              wróć do wyszukiwarki sądów
              <IconArrowBackUp className="ml-2 inline" />
            </button>
          </Link>
          <h2 className="text-2xl text-gray-500 mb-3">
            Nie znaleziono sądu o podanym identyfikatorze:{" "}
            <span className="font-bold">{parsedCourtId}</span>
          </h2>
        </div>
      </div>
    );
  }
  const districtCourtFuzzySearch = createFuzzySearch(
    courtsData.districtCourts,
    {
      getText: (item) => [item.fullCourtName],
    }
  );

  const regionalCourtFuzzySearch = createFuzzySearch(
    courtsData.regionalCourts,
    {
      getText: (item) => [item.courtData],
    }
  );

  const appealCourtFuzzySearch = createFuzzySearch(courtsData.appealCourts, {
    getText: (item) => [item.courtData],
  });

  const attachedRegionalCourtSearch = regionalCourtFuzzySearch(
    normalizeCity(selectedDistrictCourt?.courtCity)
  );
  const attachedRegionalCourt = attachedRegionalCourtSearch[0];
  const attachedAppealCourtSearch = appealCourtFuzzySearch(
    normalizeCity(attachedRegionalCourt.item.courtCity)
  );
  const attachedAppealCourt = attachedAppealCourtSearch[0];
  // now we have the appeal court, and we must find all regional courts that are attached to this appeal court

  const appealCourtRegionalCourts = parseCourtDataToPlaces(
    attachedAppealCourt.item.courtData
  );

  const finalRegionalCourtsList = appealCourtRegionalCourts.map(
    (regionalCourtCity) => {
      return regionalCourtFuzzySearch(regionalCourtCity)[0];
    }
  );

  const finalDistrictCourtList = finalRegionalCourtsList
    .map((regionalCourt) => {
      const regionalCourtDistrictCourts = parseCourtDataToPlaces(
        regionalCourt.item.courtData
      );
      const districtCourtSearches = regionalCourtDistrictCourts.map((place) => {
        return districtCourtFuzzySearch(place)[0];
      });
      return districtCourtSearches;
    })
    .reduce((acc, item) => [...acc, ...item], []);

  const attachedRegionalCourtCities = parseCourtDataToPlaces(
    attachedRegionalCourt.item.courtData
  );

  const regionalCourtsAttachedToSelectedDistrictCourtFuzzySearch =
    attachedRegionalCourtCities.map((city) => {
      return districtCourtFuzzySearch(city)[0];
    });

  return (
    <>
      <div className="flex justify-center mt-10">
        <div className="text-center rounded-lg p-6 w-full md:w-[80%]">
          <h1 className="text-3xl font-bold text-gray-800 mb-10">
            Wyszukiwarka Sądów Właściwych
          </h1>
          <Link href="/">
            <button className="bg-blue-500 w-full md:w-auto mt-2 mb-6 text-white rounded-lg px-6 py-3">
              wróć do wyszukiwarki sądów
              <IconArrowBackUp className="ml-2 inline" />
            </button>
          </Link>
          <h2 className="text-2xl text-gray-500 mb-3">
            Struktura w oparciu o:{" "}
            <span className="font-bold">{parsedCourtId}</span>
          </h2>
        </div>
      </div>
      <h4 className="text-3xl font-bold text-center text-gray-800 mt-10 mb-4">
        Sądy Rejonowe
      </h4>
      <h4 className="text-xl text-center text-gray-800 mt-4 mb-4">
        Ramką zaznaczone są sądy zależne od wybranego sądu rejonowego. Grubą
        ramką zaznaczony jest wybrany sąd rejonowy.
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {finalDistrictCourtList
          .filter(
            (item) =>
              item?.item.fullCourtNameEncoded ===
              selectedDistrictCourt.fullCourtNameEncoded
          )
          .map((districtCourt) =>
            districtCourt ? (
              <Link
                key={districtCourt.item.fullCourtNameEncoded}
                href={`/sad/${districtCourt.item.fullCourtNameEncoded}`}
              >
                <Court
                  court={districtCourt.item}
                  highlightCourtName={districtCourt.matches[0]}
                  uncertain={districtCourt.score > 1}
                  active
                  superActive
                />
              </Link>
            ) : null
          )}
        {finalDistrictCourtList
          .filter((item) =>
            regionalCourtsAttachedToSelectedDistrictCourtFuzzySearch
              .map((it) => it?.item.fullCourtNameEncoded)
              .includes(item?.item.fullCourtNameEncoded)
          )
          .map((districtCourt) =>
            districtCourt ? (
              <Link
                key={districtCourt.item.fullCourtNameEncoded}
                href={`/sad/${districtCourt.item.fullCourtNameEncoded}`}
              >
                <Court
                  court={districtCourt.item}
                  highlightCourtName={districtCourt.matches[0]}
                  uncertain={districtCourt.score > 1}
                  active
                />
              </Link>
            ) : null
          )}
        {finalDistrictCourtList
          .filter((item) => {
            return (
              !regionalCourtsAttachedToSelectedDistrictCourtFuzzySearch
                .map((it) => it?.item.fullCourtNameEncoded)
                .includes(item?.item.fullCourtNameEncoded) &&
              item?.item.fullCourtNameEncoded !==
                selectedDistrictCourt.fullCourtNameEncoded
            );
          })
          .map((districtCourt) =>
            districtCourt ? (
              <Link
                key={districtCourt.item.fullCourtNameEncoded}
                href={`/sad/${districtCourt.item.fullCourtNameEncoded}`}
              >
                <Court
                  court={districtCourt.item}
                  highlightCourtName={districtCourt.matches[0]}
                  uncertain={districtCourt.score > 1}
                  active={regionalCourtsAttachedToSelectedDistrictCourtFuzzySearch
                    .map((item) => item?.item.fullCourtNameEncoded)
                    .includes(districtCourt.item.fullCourtNameEncoded)}
                  superActive={
                    districtCourt.item.fullCourtNameEncoded ===
                    selectedDistrictCourt.fullCourtNameEncoded
                  }
                />
              </Link>
            ) : null
          )}
      </div>
      <h4 className="text-3xl font-bold text-center text-gray-800 mt-10 mb-4">
        Sądy Okręgowe
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {finalRegionalCourtsList.map((regionalCourt) => (
          <Court
            key={regionalCourt.item.fullCourtNameEncoded}
            court={regionalCourt.item}
            highlightCourtData={regionalCourt.matches[0]}
            uncertain={regionalCourt.score > 1}
            active={
              regionalCourt.item.fullCourtNameEncoded ===
              attachedRegionalCourt.item.fullCourtNameEncoded
            }
          />
        ))}
      </div>
      <h4 className="text-3xl font-bold text-center text-gray-800 mt-10 mb-4">
        Sąd Apelacyjny
      </h4>
      <div className="mx-auto w-[80%] md:w-[60%] lg:w-[50%] xl:w-[40%] mb-64">
        <Court
          court={attachedAppealCourt.item}
          highlightCourtData={attachedAppealCourt.matches[0]}
          active
        />
      </div>
    </>
  );
}
