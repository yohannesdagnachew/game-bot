const COIN_MULTIPLIER = 10;

//Free service limits
const FREE_LIKE_LIMIT = 10;
const FREE_SEND_MESSAGE_LIMIT = 3;
const FREE_USERNAME_SHARING_LIMIT = 1;

// Costs in ETB
const COST_PER_LIKE_ETB = 1;
const COST_PER_MESSAGE_ETB = 5;
const COST_PER_USERNAME_SHARING_ETB = 20;

const COIN_OPTIONS = {
  100: 10000,
  300: 35000,
  500: 60000,
  1000: 150000,
};

const TEST_USERNAMES = [
  "batelecom",
  "jo_d_m",
  "zelalem_12",
  "cewaey",
  "bin21",
  "bottester_12",
];

const CITIES = {
  ADDIS_ABABA: "Addis Ababa",
  DIRE_DAWA: "Dire Dawa",
  MEKELLE: "Mekelle",
  BAHIR_DAR: "Bahir Dar",
  ADAMA: "Adama",
  HAWASSA: "Hawassa",

  GONDAR: "Gondar",
  AXUM: "Aksum", // also spelled "Axum"
  LALIBELA: "Lalibela",
  HARAR: "Harar",
  DESSIE: "Dessie",
  JIMMA: "Jimma",
  JIJIGA: "Jijiga",

  WOLAITA_SODO: "Wolaita Sodo",
  ARBA_MINCH: "Arba Minch",
  NEKEMTE: "Nekemte",
  SEMERA: "Semera",
  GAMBELA: "Gambela",
  ASSOSA: "Asosa", // fixed from "Assosa"
  SHASHEMENE: "Shashamane",

  DEBRE_BIRHAN: "Debre Berhan", // fixed from "Debre Birhan"
  DEBRE_MARKOS: "Debre Markos",
  KOMBOLCHA: "Kombolcha",
  WELDIYA: "Woldiya", // also spelled "Woldia"/"Weldiya"
  HOSAENA: "Hosaena", // also written "Hosanna"/"Hossana"
  DILLA: "Dilla",
  BALE_ROBE: "Robe (Bale)",
  ADIGRAT: "Adigrat",
  GINCHI: "Ginchi",
  BUTAJIRA: "Butajira",

  ZIWAY: "Ziway",
  WULBAREG: "Wulbareg",
  MOYALE: "Moyale",
  METU: "Metu",
  BISHOFTU: "Bishoftu",
  TULO: "Tulo",
  GEBRE_GURACHA: "Gebre Guracha",
  OROMIA: "Oromia",
  BULE_HORA: "Bule Hora",
  AFAR: "Afar",
  SENDAFA: "Sendafa",
  DODOLA: "Dodola",
  SNNPR: "South Region",
  MAURITANIA: "Mauritania",
};

const ACCOUNT_TYPE = {
  REAL: "real",
  DUMMY: "dummy",
  TEST: "test",
};

const MODELS_NAME = {
  USER: "Users",
  MESSAGE: "Messages",
  COMPLAINT: "Complaints",
  LIKE: "Likes",
  PASS: "Passes",
  MATCH: "Matches",
  TRANSACTION: "Transactions",
  DIRECTMESSAGE: "DirectMessages",
};

const SUPPORTED_LANGUAGES = {
  ENGLISH: "English",
  AMHARIC: "አማርኛ",
  AFAAN_OROMOO: "Afaan Oromoo",
  TIGRIGNA: "ትግርኛ",
};

const SUPPORTED_RELIGIONS = {
  CHRISTIAN_ORTHODOX: "Orthodox",
  MUSLIM: "Muslim",
  CHRISTIAN_PROTESTANT: "Protestant",
  CHRISTIAN_CATHOLIC: "Catholic",
  CHRISTIAN: "Christian",
  OTHER: "Other",
};

const COMPLAINT_STATUSES = {
  PENDING: "Pending",
  REVIEWED: "Reviewed",
  RESOLVED: "Resolved",
};

const COMPLAINT_REASONS = {
  INAPPROPRIATE_PHOTOS: "Inappropriate Photos",
  HARASSMENT_OR_BULLYING: "Harassment or Bullying",
  FAKE_PROFILE: "Fake Profile",
  SPAM: "Spam",
  BUG_TECHNICAL_ISSUE: "Bug/Technical Issue",
  PAYMENT_SUBSCRIPTION_ISSUE: "Payment/Subscription Issue",
  FEATURE_REQUEST: "Feature Request",
  OTHER: "Other",
};

const SUPPORTED_GENDERS = {
  MALE: "Male",
  FEMALE: "Female",
};

const DIRECT_MESSAGE_STATUS = {
  SENT: "sent",
  DELIVERED: "delivered",
  SEEN: "seen",
};

const PAYMENT_METHOD = {
  BANK: { value: "bank", name: "Bank" },
  TELEBIRR: { value: "telebirr", name: "Telebirr" },
  CBEBIRR: { value: "cbebirr", name: "CBE Birr" },
  MPESA: { value: "mpesa", name: "M-Pesa" },
  // AMOLE: { value: "amole", name: "Amole" }, // Temporarly Disabled By Chapa
  // AWASHBIRR: { value: "awashbirr", name: "Awash BIRR" }, // Temporarly Disabled By Chapa
  // EBIRR: { value: "ebirr", name: "Ebirr" }, // Temporarly Disabled By Chapa
};

const PAYMENT_STATUS = {
  SUCCESS: "success",
  FAILED: "failed",
  PENDING: "pending",
};

const ERRORMESSAGES = {
  GENERIC: "An error occurred. Please try again later.",
  USER_NOT_FOUND: "User not found.",
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again later.",
  FAILED_TO_LIKE: "❌ Failed to like. Try again later.",
};

const FEE = {
  LIKE: 100,
  DIRECTMESSAGE: 500,
  LIKEBACK: 100,
};



export {
  MODELS_NAME,
  SUPPORTED_LANGUAGES,
  SUPPORTED_GENDERS,
  COMPLAINT_REASONS,
  COMPLAINT_STATUSES,
  SUPPORTED_RELIGIONS,
  ERRORMESSAGES,
  ACCOUNT_TYPE,
  TEST_USERNAMES,
  CITIES,
  COIN_OPTIONS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  COIN_MULTIPLIER,
  DIRECT_MESSAGE_STATUS,

  FREE_LIKE_LIMIT,
  FREE_SEND_MESSAGE_LIMIT,
  FREE_USERNAME_SHARING_LIMIT,

  COST_PER_LIKE_ETB,
  COST_PER_MESSAGE_ETB,
  COST_PER_USERNAME_SHARING_ETB,
  FEE,
};      
