import { LegalData } from "@/app/server-actions/getLegal";
import courtLevelOne from "@/public/img/court-1.svg";
import courtLevelTwo from "@/public/img/court-2.svg";
import courtLevelThree from "@/public/img/court-3.svg";
import { HighlightRanges } from "@nozbe/microfuzz";
import { Highlight } from "@nozbe/microfuzz/react";
import Image from "next/image";

export const Court = ({
  court,
  highlightCourtName,
  highlightCourtData,
  onClick,
  active,
}: {
  court: LegalData[number];
  highlightCourtName?: HighlightRanges | null;
  highlightCourtData?: HighlightRanges | null;
  onClick?: () => void;
  active?: boolean;
}) => {
  const departmentLabelClass = {
    "Sąd Apelacyjny": "bg-white shadow-sm text-pink-800",
    "Sąd Okręgowy": "bg-white shadow-sm text-teal-800",
    "Sąd Rejonowy": "bg-white shadow-sm text-blue-800",
  }[court.courtType];
  return (
    <div
      key={court.fullCourtName}
      className={`max-w-full bg-white hover:shadow-lg rounded-lg p-6 border bg-gradient-to-br to-60% ${
        {
          "Sąd Apelacyjny": "from-pink-100",
          "Sąd Okręgowy": "from-teal-100",
          "Sąd Rejonowy": "from-blue-100",
        }[court.courtType]
      } ${onClick ? "cursor-pointer" : ""} ${
        active
          ? {
              "Sąd Apelacyjny": "border-pink-800",
              "Sąd Okręgowy": "border-teal-600",
              "Sąd Rejonowy": "border-blue-500",
            }[court.courtType]
          : "border-gray-200"
      }`}
      onClick={onClick}
    >
      <h2
        className={`text-xl font-bold ${
          {
            "Sąd Apelacyjny": "text-pink-800",
            "Sąd Okręgowy": "text-teal-600",
            "Sąd Rejonowy": "text-blue-500",
          }[court.courtType]
        } mb-2`}
      >
        {court.courtType === "Sąd Apelacyjny" && (
          <Image
            src={courtLevelOne}
            alt={court.courtType}
            className="w-8 h-8 inline rounded-lg"
          />
        )}
        {court.courtType === "Sąd Okręgowy" && (
          <Image
            src={courtLevelTwo}
            alt={court.courtType}
            className="w-8 h-8 inline rounded-lg"
          />
        )}
        {court.courtType === "Sąd Rejonowy" && (
          <Image
            src={courtLevelThree}
            alt={court.courtType}
            className="w-8 h-8 inline rounded-lg"
          />
        )}
        {highlightCourtName ? (
          <Highlight
            className="font-bold"
            text={court.fullCourtName}
            ranges={highlightCourtName}
          />
        ) : (
          court.fullCourtName
        )}
      </h2>
      {court.commerial ? (
        <>
          <p
            className={`text-xs font-bold text-black inline-block mb-1 p-2 ${departmentLabelClass} rounded-lg`}
          >
            Wydział Gospodarczy
          </p>
          <br />
        </>
      ) : null}
      {court.mortgageRegistry ? (
        <>
          <p
            className={`text-xs font-bold text-black inline-block mb-1 p-2 ${departmentLabelClass} rounded-lg`}
          >
            Wydział Ksiąg Wieczystych
          </p>
          <br />
        </>
      ) : null}
      {highlightCourtData ? (
        <p className="text-sm">
          <Highlight
            className="font-bold"
            text={court.courtData}
            ranges={highlightCourtData}
          />
        </p>
      ) : (
        <p className="text-sm">{court.courtData}</p>
      )}
    </div>
  );
};
