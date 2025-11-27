export interface CountryTexts {
  // Normal texts (non-sale)
  normalTitle: string;
  normalDesc: string;
  
  // Sale start texts
  saleTitle: string;
  saleDesc: string;
  
  // Two days before end
  saleTitle2Days: string;
  saleDesc2Days: string;
  
  // Last day
  saleTitleLast: string;
  saleDescLast: string;
}

export interface CountryData {
  accountName: string;
  customerId: string;
  mccId: string;
  developerToken: string;
  texts: CountryTexts;
}

export enum SalePhase {
  START_SALE = "start_sale",
  TWO_DAYS_BEFORE = "two_days_before",
  LAST_DAY = "last_day",
  END_SALE = "end_sale"
}

export const COUNTRY_DATA: Record<string, CountryData> = {
  SNOCKS_NL: {
    accountName: "SNOCKS_NL",
    customerId: "7585673823",
    mccId: "3963045378",
    developerToken: "93VIU4ehzkRJ4tXBqdiHeg",
    texts: {
      normalTitle: "SNOCKS - Alleen het nodige.",
      normalDesc: "SNOCKS - Zó comfy dat je ze altijd aan wilt houden.",
      saleTitle: "Tot 50% korting",
      saleDesc: "Ontdek onze basics in de uitverkoop voor Black Friday met tot 50% korting.",
      saleTitle2Days: "Nog 2 dagen: 50% korting",
      saleDesc2Days: "Nog 2 dagen om onze basics met tot 50% korting te shoppen tijdens Black Friday",
      saleTitleLast: "Laatste dag: 50% korting",
      saleDescLast: "Laatste dag: Shop onze basics met tot 50% korting tijdens de Black Friday Sale"
    }
  },
  SNOCKS_FR: {
    accountName: "SNOCKS_FR",
    customerId: "7052478378",
    mccId: "3963045378",
    developerToken: "93VIU4ehzkRJ4tXBqdiHeg",
    texts: {
      normalTitle: "SNOCKS - Juste l'essentiel.",
      normalDesc: "SNOCKS - Des essentiels en coton bio que tu ne voudras plus quitter.",
      saleTitle: "Jusqu'à -50 % de réduction",
      saleDesc: "Découvrez nos basiques en promotion pour le Black Friday avec jusqu'à -50%.",
      saleTitle2Days: "Plus que 2 jours: -50%",
      saleDesc2Days: "Il ne vous reste que 2 jours pour profiter de jusqu'à -50% sur nos basiques Black Friday",
      saleTitleLast: "Dernier jour: -50%",
      saleDescLast: "Dernier jour : Profitez de jusqu'à -50% sur nos basiques pour Black Friday"
    }
  },
  SNOCKS_IT: {
    accountName: "SNOCKS_IT",
    customerId: "4570652903",
    mccId: "3963045378",
    developerToken: "93VIU4ehzkRJ4tXBqdiHeg",
    texts: {
      normalTitle: "SNOCKS - Solo l'essenziale",
      normalDesc: "SNOCKS - Talmente comodi che non li toglierai più.",
      saleTitle: "Sconti fino al 50% di sconto",
      saleDesc: "Approfitta subito degli sconti del Black Friday fino al 50% sui nostri capi basic.",
      saleTitle2Days: "Mancano 2 giorni: -50%",
      saleDesc2Days: "Mancano solo 2 giorni per approfittare degli sconti Black Friday fino al 50% sui nostri capi basic",
      saleTitleLast: "Ultimo giorno: -50%",
      saleDescLast: "Ultimo giorno: Approfitta degli sconti Black Friday fino al 50% sui nostri capi basic"
    }
  },
  SNOCKS_PL: {
    accountName: "SNOCKS_PL",
    customerId: "1593605425",
    mccId: "3963045378",
    developerToken: "93VIU4ehzkRJ4tXBqdiHeg",
    texts: {
      normalTitle: "SNOCKS – Tylko najważniejsze",
      normalDesc: "SNOCKS – Tak wygodne, że już ich nie zdejmiesz.",
      saleTitle: "Black Friday: do -50 %",
      saleDesc: "Tylko teraz: do -50 % na nasze bestsellery Black Friday",
      saleTitle2Days: "Tylko 2 dni: -50%",
      saleDesc2Days: "Tylko 2 dni do końca Black Friday: Zgarnij do -50% rabatu na nasze bestsellery!",
      saleTitleLast: "Ostatni dzień: -50%",
      saleDescLast: "Ostatni dzień Black Friday: Zgarnij do -50% rabatu na nasze bestsellery"
    }
  },
  SNOCKS_DE_AT: {
    accountName: "SNOCKS_DE_AT",
    customerId: "6863838107",
    mccId: "3963045378",
    developerToken: "93VIU4ehzkRJ4tXBqdiHeg",
    texts: {
      normalTitle: "SNOCKS Deine Basics",
      normalDesc: "SNOCKS - deine liebsten Basics. Viele Teile aus Bio-Baumwolle",
      saleTitle: "SNOCKS - Bis zu 50% reduziert",
      saleDesc: "SNOCKS - bis zu 50% Sale auf deine liebsten Basics. Viele Teile aus Bio-Baumwolle",
      saleTitle2Days: "Nur noch 2 Tage - Bis zu 50%",
      saleDesc2Days: "Nur noch 2 Tage - bis zu 50% Sale auf deine liebsten Snocks-Basics aus Bio-Baumwolle",
      saleTitleLast: "Nur noch heute - Bis zu 50%",
      saleDescLast: "Nur noch heute - bis zu 50% Sale auf deine liebsten Snocks-Basics aus Bio-Baumwolle"
    }
  },
  SNOCKS_CH: {
    accountName: "SNOCKS_CH",
    customerId: "9911532742",
    mccId: "3963045378",
    developerToken: "93VIU4ehzkRJ4tXBqdiHeg",
    texts: {
      normalTitle: "SNOCKS Deine Basics",
      normalDesc: "SNOCKS - deine liebsten Basics. Viele Teile aus Bio-Baumwolle",
      saleTitle: "SNOCKS - Bis zu 50% reduziert",
      saleDesc: "SNOCKS - bis zu 50% Sale auf deine liebsten Basics. Viele Teile aus Bio-Baumwolle",
      saleTitle2Days: "Nur noch 2 Tage - Bis zu 50%",
      saleDesc2Days: "Nur noch 2 Tage - bis zu 50% Sale auf deine liebsten Snocks-Basics aus Bio-Baumwolle",
      saleTitleLast: "Nur noch heute - Bis zu 50%",
      saleDescLast: "Nur noch heute - bis zu 50% Sale auf deine liebsten Snocks-Basics aus Bio-Baumwolle"
    }
  },
  OCEANS_APART_DE_AT: {
    accountName: "OCEANS_APART_DE_AT",
    customerId: "1247881370",
    mccId: "3963045378",
    developerToken: "93VIU4ehzkRJ4tXBqdiHeg",
    texts: {
      normalTitle: "Oceans Apart",
      normalDesc: "Oceans Apart - Activewear for you.",
      saleTitle: "Oceans Apart - Bis zu 50% reduziert",
      saleDesc: "Oceans Apart - bis zu 50% Sale auf deine liebsten Styles.",
      saleTitle2Days: "Nur noch 2 Tage - Bis zu 50%",
      saleDesc2Days: "Nur noch 2 Tage - bis zu 50% Sale auf deine liebsten Oceans Apart Styles",
      saleTitleLast: "Nur noch heute - Bis zu 50%",
      saleDescLast: "Nur noch heute - bis zu 50% Sale auf deine liebsten Oceans Apart Styles"
    }
  }
};

