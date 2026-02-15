// Bu dosya Market ve API arasındaki Fiyat Senkronizasyonunu sağlar.
// Fiyatları değiştirmek istersen sadece burayı düzenlemen yeterli.

export const MARKET_PRICES: Record<string, number> = {
  BASIC: 0,
  IONIA: 1500,
  HEXTECH: 2000,
  DARKIN: 3500,
  SHADOW: 3500,
  VOID: 4000,
  FRELJORD: 4000,
  CHALLENGER: 10000,
  SHURIMA: 15000
};

// Ürünlerin nadirlik seviyelerini de buradan yönetebiliriz (İleride lazım olur)
export const ITEM_RARITY: Record<string, string> = {
  BASIC: "common",
  IONIA: "rare",
  HEXTECH: "epic",
  DARKIN: "legendary",
  SHADOW: "epic",
  VOID: "legendary",
  FRELJORD: "epic",
  CHALLENGER: "mythic",
  SHURIMA: "mythic"
};
