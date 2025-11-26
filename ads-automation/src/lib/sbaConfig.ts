export interface SBAFilter {
  name: string;
  contains: string;
  enabled: boolean;
}

export interface SBAConfig {
  accountId: string; // Will be overridden by params or env
  filters: SBAFilter[];
  minClicksRequired: number;
  minChangePercent: number;
  maxAdjustmentPercent: number;
}

export const SBA_CONFIG: SBAConfig = {
  accountId: '6863838107', // Default account ID from n8n
  filters: [
    { name: 'Search_Herren_Socken', contains: '[Search]_Standard_DE_SO_Herren_Socken_Sneaker_Sport/Lauf_Baumwolle_Anzug', enabled: true },
    { name: 'Search_Damen_Socken', contains: '[Search]_Standard_DE_SO_Damen_Socken_Sneaker_Sport/Lauf', enabled: true },
    { name: 'Search_Socken_Sport', contains: '[Search]_Standard_DE_SO_Socken_Sneaker_Sport/Lauf', enabled: true },
    { name: 'Search_Socks_Sneaker', contains: '[Search]_Standard_DE_SO_Socks_Sneaker', enabled: true },
    { name: 'PMax_Generic', contains: '[Performance Max]_Generic_DE_[Socken][Sneaker Socken]', enabled: true },
    { name: 'Shopping_Eigenschutz', contains: '[Shopping]_Standard_DE_Eigenschutz_Socken', enabled: true }
  ],
  minClicksRequired: 30,
  minChangePercent: 5,
  maxAdjustmentPercent: 500
};

