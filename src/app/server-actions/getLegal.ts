import fs from "fs";

export type LegalData = {
  fullCourtName: string;
  courtType: "Sąd Apelacyjny" | "Sąd Rejonowy" | "Sąd Okręgowy";
  courtCity: string;
  courtData: string;
  mortgageRegistry: boolean;
  commerial: boolean;
}[];

export const getLegal = async () => {
  try {
    const jsonData = JSON.parse(
      fs.readFileSync(
        process.cwd() + "/src/public/D20230125.json"
      ) as unknown as string
    ) as [Record<string, string>];
    // we're trying to parse the JSON generated from the PDF file
    // looking like this
    // (...)
    //   "1": "Sąd Okręgowy w Tarnobrzegu – obejmujący obszar właściwości sądów rejonowych w: Kolbuszowej, Mielcu, Nisku,",
    //   "2": "Stalowej",
    //   "3": "Woli",
    //   "4": "i Tarnobrzegu",
    //   "5": "oraz",
    //   "6": "rozpoznający",
    //   "7": "sprawy",
    //   "8": "z zakresu",
    //   "9": "prawa:",
    //   "10": "cywilnego,",
    //   "11": "rodzinnego",
    //   "DZIENNIK USTAW": "d)"
    // (...)

    const legalDataParsed = jsonData
      .map((item) => {
        // Special case for this one court where its the other way around...
        if (item[2] === "Sąd") {
          const end = item[1];
          const start = Object.keys(item)
            .filter((index) => index !== "1")
            .map((key) => {
              return !isNaN(Number(key)) ? item[key] : false;
            })
            .filter(Boolean)
            // Join all values of the object into a single string
            .join(" ")
            // Remove unnecesary hyphens
            .replace(new RegExp(/- /g), "");
          return `${start} ${end}`;
        }
        // Filter out objects that do not contain the word "sąd" in the first word of the second value
        if (item[1] && item[1]?.split(" ")?.[0].toLowerCase() === "sąd") {
          let fullStringData = Object.keys(item)
            .map((key) => {
              return !isNaN(Number(key)) ? item[key] : false;
            })
            .filter(Boolean)
            // Join all values of the object into a single string
            .join(" ")
            // Remove unnecesary hyphens
            .replace(new RegExp(/- /g), "");
          if (
            [",", ";"].includes(
              // Remove any trailing commas or semicolons
              fullStringData.charAt(fullStringData.length - 1)
            )
          ) {
            fullStringData = fullStringData.slice(0, -1);
          }
          return fullStringData;
        }
        return false;
      })
      // Filter out empty objects
      .filter(Boolean) as string[];
    // now it looks like this:
    // "Sąd Apelacyjny w Białymstoku – obejmujący obszar właściwości sądów okręgowych w: Białymstoku, Łomży, Olsztynie, Ostrołęce i Suwałkach oraz rozpoznający sprawy z zakresu prawa: cywilnego, rodzinnego i opiekuńczego, karnego oraz zgodności z prawdą oświadczeń lustracyjnych, pracy i ubezpieczeń społecznych, a także sprawy gospodarcze oraz inne sprawy z zakresu prawa gospodarczego i cywilnego należące do sądu gospodarczego na podstawie odrębnych ustaw",
    // "Sąd Apelacyjny w Gdańsku – obejmujący obszar właściwości sądów okręgowych: w Bydgoszczy, Elblągu, Gdańsku, Słupsku, Toruniu i we Włocławku oraz rozpoznający sprawy z zakresu prawa: cywilnego, rodzinnego i opiekuńczego, karnego oraz zgodności z prawdą oświadczeń lustracyjnych, pracy i ubezpieczeń społecznych, a także sprawy gospodarcze oraz inne sprawy z zakresu prawa gospodarczego i cywilnego należące do sądu gospodarczego na podstawie odrębnych ustaw",
    // "Sąd Apelacyjny w Katowicach – obejmujący obszar właściwości sądów okręgowych w: Bielsku-Białej, Częstochowie, Gliwicach, Katowicach, Rybniku i Sosnowcu oraz rozpoznający sprawy z zakresu prawa: cywilnego, rodzinnego i opiekuńczego, karnego oraz zgodności z prawdą oświadczeń lustracyjnych, pracy i ubezpieczeń społecznych, a także sprawy gospodarcze oraz inne sprawy z zakresu prawa gospodarczego i cywilnego należące do sądu gospodarczego na podstawie odrębnych ustaw",
    // "Sąd Apelacyjny w Krakowie – obejmujący obszar właściwości sądów okręgowych w: Kielcach, Krakowie, Nowym Sączu i Tarnowie oraz rozpoznający sprawy z zakresu prawa: cywilnego, rodzinnego i opiekuńczego, karnego oraz zgodności z prawdą oświadczeń lustracyjnych, pracy i ubezpieczeń społecznych, a także sprawy gospodarcze oraz inne sprawy z zakresu prawa gospodarczego i cywilnego należące do sądu gospodarczego na podstawie odrębnych ustaw",
    // "Sąd Apelacyjny w Lublinie – obejmujący obszar właściwości sądów okręgowych w: Lublinie, Radomiu, Siedlcach i Zamościu oraz rozpoznający sprawy z zakresu prawa: cywilnego, rodzinnego i opiekuńczego, karnego oraz zgodności z prawdą oświadczeń lustracyjnych, pracy i ubezpieczeń społecznych, a także sprawy gospodarcze oraz inne sprawy z zakresu prawa gospodarczego i cywilnego należące do sądu gospodarczego na podstawie odrębnych ustaw",

    // we need some structure to this data and since "–" (char code 8211) isn't a regular dash (char code 45) we can use this

    const legalData = legalDataParsed.reduce((acc, item) => {
      const [fullCourtName, courtData] = item.split(" – ");
      const courtCity = fullCourtName
        .replace("Sąd ", "")
        .replace("Apelacyjny ", "")
        .replace("Rejonowy", "")
        .replace("Okręgowy", "")
        .trim();
      return [
        ...acc,
        {
          fullCourtName,
          courtType: fullCourtName.replace(courtCity, "").trim() as
            | "Sąd Apelacyjny"
            | "Sąd Rejonowy"
            | "Sąd Okręgowy",
          courtCity,
          courtData,
          mortgageRegistry: courtData.includes("wieczys"),
          commerial: courtData.includes("gospodarcz"),
        },
      ];
    }, [] as LegalData);
    return {
      legalData,
      error: false,
      stats: {
        total: legalData.length,
        courts: legalData.reduce((acc, item) => {
          const type = item.courtType.replace("Sąd ", "").toLowerCase().trim();
          if (acc[type]) {
            acc[type] += 1;
          } else {
            acc[type] = 1;
          }
          return acc;
        }, {} as Record<string, number>),
      },
      message: "",
    };
  } catch (message) {
    return {
      legalData: [{}] as LegalData,
      error: true,
      message,
    };
  }
};
