import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Home, TrendingUp, Wallet, PiggyBank, User, Sparkles, Rocket, Timer, GitCompare, Info, X, Table2
} from "lucide-react";

// ---------- helpers ----------
const uid = () => Math.random().toString(36).slice(2, 9);
const REGION_CURRENCY = { US: "USD", EU: "EUR", UK: "GBP", Canada: "CAD", Other: "USD" };
const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "CAD"];

// ---------- language / localization ----------
// Scoped for now to the app's "first impression" — onboarding, navigation chrome, and the
// Home screen. The detailed Inputs tabs, Results-tab breakdowns, and the long Info-page
// explanations are still English-only; translating those is a much bigger job left for
// later, and the Profile-tab language switcher says so explicitly.
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
];
const STRINGS = {
  en: {
    app_tagline: "See how long your money lasts",
    info_button: "Info",
    nav_home: "Home",
    nav_inputs: "Profile",
    nav_results: "Forecast",
    nav_whatif: "What If",
    net_worth_today: "Net worth today",
    funds_run_out: "Funds run out",
    money_lasts_to: "Money lasts to",
    edit_profile: "Edit profile",
    reset_profile: "Reset profile",
    section_profile: "Profile",
    section_income: "Income & expenses",
    section_cash: "Cash",
    section_investments: "Investments",
    section_retirement: "Retirement",
    section_lumpsums: "Lump sums",
    section_order: "Withdrawal order",
    work_clock: "Work Clock",
    until_ff: "until Financial Freedom",
    stat_invested_wealth: "Current invested wealth",
    stat_annual_spending: "Annual spending",
    stat_real_return: "Expected real return",
    stat_monthly_savings: "Monthly savings",
    fi_label: "Financial independence",
    fi_not_reached: "Not yet reached",
    fi_add_more: "Add more savings or contributions to see a date",
    see_full_plan: "See my full plan →",
    wizard_region: "Where do you live?",
    wizard_taxCountry_eu: "Which country, for tax purposes?",
    wizard_taxCountry_us: "Which US state, for tax purposes?",
    wizard_currentAge: "First up — how old are you today?",
    wizard_multiCurrency: "Do you hold money in more than one currency?",
    wizard_salaryCurrency: "What currency is your salary paid in?",
    wizard_customRates: "Do you want to set your own growth, inflation, and tax rates?",
    wizard_salary: "What's your annual salary, before tax?",
    wizard_salaryGrowth: "How much do you expect your salary to grow, per year?",
    wizard_yearsWorking: "How many more years do you plan to work?",
    wizard_monthlyExpenses: "What do you spend per month — not including any mortgage?",
    wizard_inflation: "What inflation rate should we assume?",
    wizard_taxBracket: "What's your average tax rate — the share of income you actually pay overall?",
    wizard_dividendTaxRate: "And your tax rate specifically on dividend income, if different?",
    wizard_capitalGainsTaxRate: "And your tax rate on capital gains — selling an investment or a house?",
    wizard_cash: "How much cash do you have in the bank (not invested)?",
    wizard_cashRate: "What interest rate does your cash earn?",
    wizard_hasInvestments: "Do you have any investments or trading accounts — stocks, index funds, ETFs?",
    wizard_ownsHome: "Do you own any property — your home, or a rental?",
    wizard_hasRetirementAccount: "Do you have a retirement account — 401(k), IRA, or similar?",
    wizard_hasPension: "Will you get a state or employer pension?",
    wizard_summary: "Review what we've got",
    wizard_yes: "Yes",
    wizard_no: "No",
    wizard_next: "Next →",
    wizard_see_results: "See my results →",
    wizard_back: "← Back",
  },
  fr: {
    app_tagline: "Découvrez combien de temps durera votre argent",
    info_button: "Infos",
    nav_home: "Accueil",
    nav_inputs: "Profil",
    nav_results: "Prévisions",
    nav_whatif: "Simulations",
    net_worth_today: "Patrimoine net aujourd'hui",
    funds_run_out: "Fonds épuisés",
    money_lasts_to: "L'argent dure jusqu'à",
    edit_profile: "Modifier le profil",
    reset_profile: "Réinitialiser le profil",
    section_profile: "Profil",
    section_income: "Revenus et dépenses",
    section_cash: "Liquidités",
    section_investments: "Investissements",
    section_retirement: "Retraite",
    section_lumpsums: "Sommes ponctuelles",
    section_order: "Ordre de retrait",
    work_clock: "Horloge de travail",
    until_ff: "avant la liberté financière",
    stat_invested_wealth: "Patrimoine investi actuel",
    stat_annual_spending: "Dépenses annuelles",
    stat_real_return: "Rendement réel attendu",
    stat_monthly_savings: "Épargne mensuelle",
    fi_label: "Indépendance financière",
    fi_not_reached: "Pas encore atteinte",
    fi_add_more: "Ajoutez plus d'épargne ou de cotisations pour voir une date",
    see_full_plan: "Voir mon plan complet →",
    wizard_region: "Où habitez-vous ?",
    wizard_taxCountry_eu: "Quel pays, à des fins fiscales ?",
    wizard_taxCountry_us: "Quel État américain, à des fins fiscales ?",
    wizard_currentAge: "Pour commencer — quel âge avez-vous aujourd'hui ?",
    wizard_multiCurrency: "Détenez-vous de l'argent dans plusieurs devises ?",
    wizard_salaryCurrency: "Dans quelle devise votre salaire est-il versé ?",
    wizard_customRates: "Voulez-vous définir vous-même vos taux de croissance, d'inflation et d'imposition ?",
    wizard_salary: "Quel est votre salaire annuel, avant impôts ?",
    wizard_salaryGrowth: "De combien pensez-vous que votre salaire augmentera chaque année ?",
    wizard_yearsWorking: "Combien d'années comptez-vous encore travailler ?",
    wizard_monthlyExpenses: "Combien dépensez-vous par mois — hors prêt immobilier ?",
    wizard_inflation: "Quel taux d'inflation devrions-nous supposer ?",
    wizard_taxBracket: "Quel est votre taux d'imposition moyen — la part de vos revenus que vous payez réellement au total ?",
    wizard_dividendTaxRate: "Et votre taux d'imposition spécifique sur les dividendes, si différent ?",
    wizard_capitalGainsTaxRate: "Et votre taux d'imposition sur les plus-values — vente d'un investissement ou d'une maison ?",
    wizard_cash: "Combien de liquidités avez-vous en banque (non investies) ?",
    wizard_cashRate: "Quel taux d'intérêt rapporte votre épargne ?",
    wizard_hasInvestments: "Avez-vous des investissements ou des comptes de trading — actions, fonds indiciels, ETF ?",
    wizard_ownsHome: "Possédez-vous un bien immobilier — votre résidence ou un bien locatif ?",
    wizard_hasRetirementAccount: "Avez-vous un compte retraite — PER, assurance-vie, ou similaire ?",
    wizard_hasPension: "Percevrez-vous une pension d'État ou d'employeur ?",
    wizard_summary: "Vérifiez ce que nous avons noté",
    wizard_yes: "Oui",
    wizard_no: "Non",
    wizard_next: "Suivant →",
    wizard_see_results: "Voir mes résultats →",
    wizard_back: "← Retour",
  },
  it: {
    app_tagline: "Scopri quanto durano i tuoi risparmi",
    info_button: "Info",
    nav_home: "Home",
    nav_inputs: "Profilo",
    nav_results: "Previsioni",
    nav_whatif: "Simulazioni",
    net_worth_today: "Patrimonio netto oggi",
    funds_run_out: "Fondi esauriti",
    money_lasts_to: "I soldi durano fino a",
    edit_profile: "Modifica profilo",
    reset_profile: "Reimposta profilo",
    section_profile: "Profilo",
    section_income: "Entrate e spese",
    section_cash: "Liquidità",
    section_investments: "Investimenti",
    section_retirement: "Pensione",
    section_lumpsums: "Somme una tantum",
    section_order: "Ordine di prelievo",
    work_clock: "Orologio al lavoro",
    until_ff: "all'indipendenza finanziaria",
    stat_invested_wealth: "Patrimonio investito attuale",
    stat_annual_spending: "Spesa annuale",
    stat_real_return: "Rendimento reale atteso",
    stat_monthly_savings: "Risparmio mensile",
    fi_label: "Indipendenza finanziaria",
    fi_not_reached: "Non ancora raggiunta",
    fi_add_more: "Aggiungi più risparmi o contributi per vedere una data",
    see_full_plan: "Vedi il mio piano completo →",
    wizard_region: "Dove vivi?",
    wizard_taxCountry_eu: "Quale paese, ai fini fiscali?",
    wizard_taxCountry_us: "Quale stato USA, ai fini fiscali?",
    wizard_currentAge: "Per iniziare — quanti anni hai oggi?",
    wizard_multiCurrency: "Hai denaro in più di una valuta?",
    wizard_salaryCurrency: "In quale valuta viene pagato il tuo stipendio?",
    wizard_customRates: "Vuoi impostare tu i tassi di crescita, inflazione e tassazione?",
    wizard_salary: "Qual è il tuo stipendio annuo lordo?",
    wizard_salaryGrowth: "Di quanto pensi che crescerà il tuo stipendio ogni anno?",
    wizard_yearsWorking: "Per quanti altri anni pensi di lavorare?",
    wizard_monthlyExpenses: "Quanto spendi al mese — esclusi eventuali mutui?",
    wizard_inflation: "Quale tasso di inflazione dovremmo assumere?",
    wizard_taxBracket: "Qual è la tua aliquota fiscale media — la quota di reddito che effettivamente paghi in totale?",
    wizard_dividendTaxRate: "E la tua aliquota fiscale specifica sui dividendi, se diversa?",
    wizard_capitalGainsTaxRate: "E la tua aliquota fiscale sulle plusvalenze — vendita di un investimento o di una casa?",
    wizard_cash: "Quanta liquidità hai in banca (non investita)?",
    wizard_cashRate: "Che tasso di interesse rende la tua liquidità?",
    wizard_hasInvestments: "Hai investimenti o conti di trading — azioni, fondi indicizzati, ETF?",
    wizard_ownsHome: "Possiedi immobili — la tua casa o un immobile in affitto?",
    wizard_hasRetirementAccount: "Hai un conto pensionistico — fondo pensione o simile?",
    wizard_hasPension: "Riceverai una pensione statale o aziendale?",
    wizard_summary: "Rivedi quello che abbiamo raccolto",
    wizard_yes: "Sì",
    wizard_no: "No",
    wizard_next: "Avanti →",
    wizard_see_results: "Vedi i miei risultati →",
    wizard_back: "← Indietro",
  },
};
// small parametrized phrases where naive concatenation would read wrong in French/Italian
function trQuestionProgress(language, n, m) {
  if (language === "fr") return `Question ${n} sur ${m}`;
  if (language === "it") return `Domanda ${n} di ${m}`;
  return `Question ${n} of ${m}`;
}
function trAge(language, n) {
  if (language === "fr") return `${n} ans`;
  if (language === "it") return `${n} anni`;
  return `age ${n}`;
}
function trFreeAt(language, n) {
  if (language === "fr") return `libre à ${n} ans`;
  if (language === "it") return `libero a ${n} anni`;
  return `free at ${n}`;
}
function trRemaining(language, y, m, d) {
  if (language === "fr") return `${y} an${y === 1 ? "" : "s"} ${m} mois ${d} jour${d === 1 ? "" : "s"} restants !!`;
  if (language === "it") return `${y} ann${y === 1 ? "o" : "i"} ${m} mes${m === 1 ? "e" : "i"} ${d} giorn${d === 1 ? "o" : "i"} rimanenti!!`;
  return `${y} year${y === 1 ? "" : "s"} ${m} month${m === 1 ? "" : "s"} ${d} day${d === 1 ? "" : "s"} remaining!!`;
}
// guesses a starting language from the same location signal used for region/tax-country,
// purely as a starting point — folded directly into guessLocationDefaults below, always
// confirmed (or changed) on the language step regardless
const FX_FALLBACK = { USD: 1, EUR: 1.08, GBP: 1.27, CAD: 0.73 };
// converts an amount from `fromCcy` into `toCcy` using a table of "USD per 1 unit" rates
function convertCurrency(amount, fromCcy, toCcy, rates) {
  if (!amount || !fromCcy || !toCcy || fromCcy === toCcy) return amount || 0;
  const from = rates[fromCcy] ?? FX_FALLBACK[fromCcy] ?? 1;
  const to = rates[toCcy] ?? FX_FALLBACK[toCcy] ?? 1;
  return (amount * from) / to;
}
const fmt = (n, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(Math.round(n || 0));

// ---------------------------------------------------------------------------------
// Nominal vs "today's money" (real terms). Everything the simulation produces is
// nominal — future dollars, inflated year by year, same as what you'd actually see in
// an account statement. That's correct for the underlying math, but on a chart running
// 40+ years into the future it's genuinely misleading to look at: "€2M at 90" sounds
// like a great outcome until you realize inflation alone means it might only buy what
// ~€700k buys today. This pair of helpers strips inflation back out for DISPLAY only —
// it never touches the simulation itself, just how a given year's numbers are shown.
//
// realFactorForAge: how much a dollar in `age`'s year is worth in TODAY's money.
// deflateRecord: applies that factor to every dollar-shaped field in a chart data
// row, leaving non-dollar fields (age, flags, nested explain/shortfall detail — which
// stay in their own year's nominal terms, since they describe specific transactions
// that happened at specific nominal amounts) untouched.
function realFactorForAge(age, currentAge, inflationPct, showReal) {
  if (!showReal) return 1;
  const years = Math.max(0, age - currentAge);
  return 1 / Math.pow(1 + (inflationPct || 0) / 100, years);
}
const NON_DOLLAR_RECORD_KEYS = new Set(["age", "year", "_explain", "_defaulted", "_lumpSumEvents", "_shortfall"]);
function deflateRecord(record, factor) {
  if (!record || factor === 1) return record;
  const out = {};
  for (const k in record) {
    out[k] = NON_DOLLAR_RECORD_KEYS.has(k) || typeof record[k] !== "number" ? record[k] : record[k] * factor;
  }
  return out;
}

// just the symbol/prefix for a currency (e.g. "$", "€", "£", "CA$") — used for input
// suffixes so onboarding doesn't hardcode "$" regardless of where someone lives
function currencySymbol(ccy) {
  try {
    return (0)
      .toLocaleString("en-US", { style: "currency", currency: ccy || "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 })
      .replace(/[\d.,\s]/g, "");
  } catch (e) {
    return "$";
  }
}
// best-effort, fully client-side guess at where someone lives, used only to pre-select
// a sensible default on the very first onboarding question — never transmitted
// anywhere, and always just a starting point the person confirms or changes. Uses the
// device's time zone (reliable for country-level guesses) with browser language as a
// weaker fallback signal. Deliberately says nothing about DISPLAY language — that's a
// completely separate, independent preference (see the `language` state and the flag
// at the top of the app), never inferred from or tied to region/currency/tax country.
function guessLocationDefaults() {
  const CANADA_TZ = new Set([
    "America/Toronto", "America/Vancouver", "America/Edmonton", "America/Winnipeg",
    "America/Halifax", "America/St_Johns", "America/Regina", "America/Montreal",
    "America/Ottawa", "America/Calgary", "America/Whitehorse", "America/Yellowknife",
  ]);
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz === "Europe/London" || tz === "Europe/Belfast") return { region: "UK", taxCountry: undefined };
    if (tz === "Europe/Paris") return { region: "EU", taxCountry: "FR" };
    if (tz === "Europe/Berlin") return { region: "EU", taxCountry: "DE" };
    if (tz === "Europe/Rome") return { region: "EU", taxCountry: "IT" };
    if (tz === "Europe/Madrid") return { region: "EU", taxCountry: "ES" };
    if (tz.startsWith("Europe/")) return { region: "EU", taxCountry: undefined };
    if (CANADA_TZ.has(tz)) return { region: "Canada", taxCountry: "CA" };
    if (tz === "America/New_York") return { region: "US", taxCountry: "US_NY" };
    if (tz.startsWith("America/")) return { region: "US", taxCountry: "US_OTHER" };
    // weaker fallback: browser language, for environments with an unhelpful time zone
    const lang = (typeof navigator !== "undefined" && navigator.language) || "";
    const l = lang.toLowerCase();
    if (l.includes("gb")) return { region: "UK", taxCountry: undefined };
    if (l.includes("ca")) return { region: "Canada", taxCountry: "CA" };
    if (l.includes("us")) return { region: "US", taxCountry: "US_OTHER" };
    if (l.startsWith("fr")) return { region: "EU", taxCountry: "FR" };
    if (l.startsWith("de")) return { region: "EU", taxCountry: "DE" };
    if (l.startsWith("it")) return { region: "EU", taxCountry: "IT" };
    if (l.startsWith("es")) return { region: "EU", taxCountry: "ES" };
    return { region: "Other", taxCountry: undefined };
  } catch (e) {
    return { region: "EU", taxCountry: undefined };
  }
}
const fmtShort = (n) => {
  const abs = Math.abs(n);
  if (abs >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(0) + "k";
  return Math.round(n).toString();
};
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// ---------- mortgage two-way solver: balance + payment are always known;
// given one of {rate, years}, solve for the other via standard amortization math ----------
function solveMortgageYears(balance, payment, annualRatePct) {
  if (balance <= 0) return 0;
  if (payment <= 0) return Infinity;
  const i = (annualRatePct || 0) / 100 / 12;
  if (i <= 0) return balance / payment / 12;
  const interestOnly = i * balance;
  if (payment <= interestOnly) return Infinity;
  const n = -Math.log(1 - (i * balance) / payment) / Math.log(1 + i);
  return n / 12;
}
function solveMortgageRate(balance, payment, years) {
  if (balance <= 0) return 0;
  const n = Math.max(years, 0.0001) * 12;
  if (payment <= 0) return null;
  if (payment * n <= balance) return null; // payment can never cover principal at any positive rate
  let lo = 0,
    hi = 0.05; // monthly rate bounds, 0%–60%/yr
  const g = (i) => (i === 0 ? balance / n - payment : (balance * i) / (1 - Math.pow(1 + i, -n)) - payment);
  for (let iter = 0; iter < 60; iter++) {
    const mid = (lo + hi) / 2;
    if (g(mid) > 0) hi = mid;
    else lo = mid;
  }
  return ((lo + hi) / 2) * 12 * 100;
}
function formatYears(y) {
  if (!isFinite(y)) return "won't pay off at this rate/payment";
  return `${y.toFixed(1)} yrs`;
}
// standard amortization formula: given a loan balance, annual rate, and term in years,
// what's the required monthly payment?
function computeMortgagePayment(balance, annualRatePct, years) {
  if (balance <= 0) return 0;
  const i = (annualRatePct || 0) / 100 / 12;
  const n = Math.max(years, 0.01) * 12;
  if (i <= 0) return balance / n;
  return (balance * i) / (1 - Math.pow(1 + i, -n));
}

// ---------- locked amortization schedule ----------
// Built ONCE from the numbers as they stand right now (balance, monthly payment, rate —
// "floating" mortgages are treated as fixed at whatever rate is currently assumed, since
// this app never changes that rate over the life of the simulation anyway), using the
// same monthly-compounding math as the solvers above. Both the simulation and the "see
// full schedule" UI read off this SAME schedule, instead of each independently re-deriving
// balance/rate/payment year by year — which is what let a mortgage silently amortize
// forever or finish early even when 2-of-3 inputs were consistent at setup time: the
// per-year simulation used to compound annually while the solver above assumed monthly
// compounding, and the two were never actually guaranteed to agree.
//
// Returns { locked: true, years: [{startBalance, interestPaid, principalPaid, endBalance}, ...] }
// for a mortgage that will fully amortize, or { locked: false } if the payment doesn't
// even cover the interest at this rate — there's no finite term to lock to in that case,
// so the caller falls back to the old live year-by-year math (still flagged elsewhere by
// the "payment doesn't cover interest" warning).
function buildMortgageSchedule(startBalance, monthlyPayment, annualRatePct) {
  const bal0 = Math.max(0, startBalance || 0);
  if (bal0 <= 0.01) return { locked: true, years: [] };
  if (monthlyPayment <= 0) return { locked: false };
  const i = (annualRatePct || 0) / 100 / 12;
  const interestOnly = i * bal0;
  if (i > 0 && monthlyPayment <= interestOnly) return { locked: false };

  const years = [];
  let bal = bal0;
  let yearStart = bal0;
  let yearInterest = 0;
  let yearPrincipal = 0;
  let monthInYear = 0;
  const MAX_MONTHS = 1200; // 100-year safety cap, never actually reached given the check above
  for (let m = 0; m < MAX_MONTHS && bal > 0.005; m++) {
    const interest = i > 0 ? bal * i : 0;
    let principal = monthlyPayment - interest;
    if (principal > bal) principal = bal; // final payment: don't overshoot into negative balance
    bal = Math.max(0, bal - principal);
    yearInterest += interest;
    yearPrincipal += principal;
    monthInYear++;
    if (monthInYear === 12 || bal <= 0.005) {
      years.push({ startBalance: yearStart, interestPaid: yearInterest, principalPaid: yearPrincipal, endBalance: bal });
      yearStart = bal;
      yearInterest = 0;
      yearPrincipal = 0;
      monthInYear = 0;
    }
  }
  return { locked: true, years };
}
// looks up a locked schedule at a given, freeze-aware year index (see mortgageScheduleYear
// in runSimulation — a year where the household defaulted doesn't advance this index, so a
// skipped year doesn't desync the schedule from the loan's actual progress). Clamps to a
// fully-paid-off row once the term has passed.
function scheduleYearRow(schedule, yearIdx) {
  if (!schedule || !schedule.locked || schedule.years.length === 0) return null;
  if (yearIdx < schedule.years.length) return schedule.years[yearIdx];
  return { startBalance: 0, interestPaid: 0, principalPaid: 0, endBalance: 0 };
}


function yearsToYMD(yearsFloat) {
  if (yearsFloat == null) return { y: null, m: null, d: null };
  const totalDays = Math.max(0, yearsFloat) * 365.25;
  let y = Math.floor(totalDays / 365.25);
  let remDays = totalDays - y * 365.25;
  let m = Math.floor(remDays / 30.4375);
  let d = Math.round(remDays - m * 30.4375);
  if (d >= 31) {
    d -= 31;
    m += 1;
  }
  if (m >= 12) {
    m -= 12;
    y += 1;
  }
  return { y, m, d };
}
function daysToYMD(days) {
  return yearsToYMD((days || 0) / 365.25);
}
function formatYMD({ y, m, d }) {
  if (y == null) return "—";
  const parts = [];
  if (y) parts.push(`${y}y`);
  if (y || m) parts.push(`${m}m`);
  parts.push(`${d}d`);
  return parts.join(" ");
}

// turns the per-bucket tracked math into short, plain-English lines for the
// year-by-year breakdown, e.g. "Grew 6% on $100,000 = +$6,000" or
// "$500/month × 12 = +$6,000 contributed"
function buildExplainLines(d, currency, lumpSumEvents) {
  if (!d) return [];
  const lines = [];
  const g = (n) => fmt(n, currency);
  if (d.kind === "cash") {
    if (d.growthPct) {
      lines.push(`${d.growthPct}% interest on ${g(d.startBalance)}, after tax = +${g(d.growthAmount)}`);
      if (d.interestTaxPaid > 0) lines.push(`(${g(d.interestTaxPaid)} of that interest went to tax)`);
    }
    if (d.surplusAdded > 0) lines.push(`+${g(d.surplusAdded)} net surplus kept as cash`);
    if (d.withdrawn > 0) lines.push(`−${g(d.withdrawn)} withdrawn to cover a shortfall`);
    if (d.hitCashFloor) lines.push(`🛑 Hit your emergency cash floor — the rest is protected and can't be spent`);
    (lumpSumEvents || []).forEach((ls) => {
      lines.push(`${ls.amount >= 0 ? "+" : "−"}${g(Math.abs(ls.amount))} — ${ls.name || "lump sum"}`);
    });
  } else if (d.kind === "house") {
    if (d.forcedSale) {
      lines.push(`🏠⚠️ Force-sold for ${g(d.saleValue)} — the mortgage couldn't be paid, so the property had to go`);
      if (d.exemptGain > 0) {
        lines.push(`${g(d.capitalGain || 0)} gain, ${g(d.exemptGain)} exempt as a primary residence → only ${g(d.taxableGain || 0)} taxed`);
      }
      lines.push(`${g(d.sellingFee || 0)} agency fee, ${g(d.gainTax || 0)} tax on the gain → ${g(d.forcedProceeds || 0)} left over`);
    } else if (d.sold) {
      lines.push(
        `🏠 Sold for ${g(d.saleValue)} (${g(d.saleEquity)} equity, ${g(d.sellingFee || 0)} agency fee, ${g(
          d.gainTax || 0
        )} tax on a ${g(d.capitalGain || 0)} gain)`
      );
      if (d.exemptGain > 0) {
        lines.push(`🎉 ${g(d.exemptGain)} of that gain was exempt from tax as a primary residence — only ${g(d.taxableGain || 0)} was taxable`);
      }
      if (d.postSaleAction === "rebuy" || d.postSaleAction === "resize") {
        lines.push(`Bought a new home worth ${g(d.newHomeValue)}`);
      } else if (d.postSaleAction === "rent") {
        lines.push(
          `Now renting at ${g(d.newMonthlyRent)}/month (grows with inflation)${
            d.assumedPrimaryRentFallback ? " — no plan was set, so this assumes rent equal to your old mortgage payment" : ""
          }`
        );
      }
      if (d.reinvestedAs === "cd" || d.reinvestedAs === "market") {
        lines.push(
          `${g(d.reinvestedAmount)} put into a ${d.reinvestedAs === "cd" ? "CD" : "market fund"} at ${d.reinvestRate}%/yr`
        );
      }
    } else {
      if (d.growthPct) lines.push(`Value grew ${d.growthPct}% on ${g(d.startBalance)} = +${g(d.growthAmount)}`);
      if (d.rentIncome) lines.push(`+${g(d.rentIncome)} rent collected, after tax (flows to cash)`);
      if (d.mortgagePaymentAnnual) {
        lines.push(`${g(d.principalPaid)} of mortgage paid off (${g(d.interestPaid)} was interest)`);
      }
      if (d.withdrawn) lines.push(`−${g(d.withdrawn)} equity sold (incl. agency fee) to cover a shortfall`);
    }
  } else if (d.kind === "retirement") {
    if (d.growthPct) lines.push(`Grew ${d.growthPct}% on ${g(d.startBalance)} = +${g(d.growthAmount)}`);
    if (d.contribAnnual > 0) lines.push(`+${g(d.contribAnnual)} contributed this year`);
    if (d.withdrawn) lines.push(`−${g(d.withdrawn)} withdrawn`);
  } else {
    if (d.isCD) {
      const r = (d.cdRateThisYear ?? d.growthPct ?? 0).toFixed(2);
      lines.push(`${r}% interest this year on ${g(d.startBalance)}, after tax = +${g(d.growthAmount)}`);
      if (d.interestTaxPaid > 0) lines.push(`(${g(d.interestTaxPaid)} of that interest went to tax)`);
    } else if (d.growthPct) {
      lines.push(`Grew ${d.growthPct}% on ${g(d.startBalance)} = +${g(d.growthAmount)}`);
    }
    if (d.contribAnnual > 0) {
      const periods = Math.round(d.contribPeriods * 10) / 10;
      lines.push(`${g(d.contribPerPeriod)}/${d.contribFrequency} × ${periods} = +${g(d.contribAnnual)} contributed`);
    }
    if (d.surplusInvested > 0) lines.push(`+${g(d.surplusInvested)} surplus income automatically invested`);
    if (d.dividendPaid > 0) lines.push(`Paid out ${g(d.dividendPaid)} in dividends, after tax (flows to cash)`);
    if (d.withdrawn) {
      const taxPct = Math.round((d.withdrawTaxRate || 0) * 100);
      lines.push(`−${g(d.withdrawn)} sold to cover a shortfall${taxPct > 0 ? ` (${taxPct}% tax on the gain portion)` : " (no gain, so no tax)"}`);
    }
  }
  return lines;
}

const PALETTE = ["#3DDC97", "#FFB443", "#4C8DFF", "#FF6B5B", "#7C5CFC", "#FF5C93", "#28C7C7", "#F2545B", "#B98CFF"];

const SECTION_COLORS = {
  profile: "#7C5CFC",
  income: "#FF6B5B",
  cash: "#3DDC97",
  investments: "#FFB443",
  retirement: "#4C8DFF",
  lumpsums: "#0EA5E9",
  order: "#FF5C93",
};

function parseOrderEntry(entry) {
  if (entry === "cash") return { type: "cash", id: null };
  const i = entry.indexOf(":");
  return { type: entry.slice(0, i), id: entry.slice(i + 1) };
}

const REGIONS = ["US", "EU", "UK", "Canada", "Other"];

// Long-run regional averages used to pre-fill assumptions, so people who don't want to
// think about rates still start from something defensible rather than a made-up number.
// Inflation: ECB/PIIE 25-yr euro-area average (2.1%), IMF UK average (~2.5%), long-run
// US CPI and Bank of Canada target-era averages. Cash: blended retail deposit rates
// (FDIC / ECB demand+term deposits / BoE), which historically sit just below inflation.
//
// marketReturn is deliberately NOT the historical average. It's roughly the 25th-percentile
// outcome over a 10-year holding period — i.e. "a somewhat disappointing decade" — which is
// about 3 points below the long-run average once you scale annual volatility (~17%) to a
// 10-year horizon. historicalReturn is kept alongside so the UI can show both honestly.
// Cash rate defaults to 0 everywhere: ordinary checking/savings accounts at a bank pay
// little to nothing in practice almost anywhere today. This used to default to a small
// positive number, which flattered "money just sitting in cash" relative to reality.
// If someone actually has a higher-yield account (a savings account with a real rate, a
// French Livret A/LDDS-type tax-free account, etc.) they can — and should — just edit
// this number on the Cash tab; a note there flags the France case specifically since a
// livret's rate is government-set and worth looking up rather than guessing.
const REGION_DEFAULTS = {
  US: { currency: "USD", inflation: 2.5, cashRate: 0, cdRate: 4.0, cdRateLongRun: 2.0, marketReturn: 7.0, historicalReturn: 10.0, index: "S&P 500", label: "United States" },
  EU: { currency: "EUR", inflation: 2.1, cashRate: 0, cdRate: 2.5, cdRateLongRun: 1.6, marketReturn: 4.0, historicalReturn: 7.0, index: "Euro Stoxx 50", label: "Eurozone" },
  UK: { currency: "GBP", inflation: 2.5, cashRate: 0, cdRate: 4.0, cdRateLongRun: 2.0, marketReturn: 3.5, historicalReturn: 6.5, index: "FTSE 100", label: "United Kingdom" },
  Canada: { currency: "CAD", inflation: 2.0, cashRate: 0, cdRate: 3.5, cdRateLongRun: 1.5, marketReturn: 5.0, historicalReturn: 8.0, index: "S&P/TSX", label: "Canada" },
  Other: { currency: "USD", inflation: 2.5, cashRate: 0, cdRate: 2.5, cdRateLongRun: 1.6, marketReturn: 4.0, historicalReturn: 7.0, index: "global equities", label: "Somewhere else" },
};

// ---------------------------------------------------------------------------------
// Progressive tax-bracket tables, used to compute an "average" (effective) tax rate
// on the fly from each year's actual simulated income, rather than asking everyone to
// guess and type in one flat number up front. Someone can still override with their
// own flat number (that's what "manual" mode is for) — this just makes the DEFAULT
// smarter and regionally honest, and lets it evolve automatically as income changes
// year to year in the simulation (e.g. a much lower rate once retired and living off
// modest withdrawals than while earning full salary).
//
// Assumptions used throughout, deliberately kept simple and stated up front rather
// than hidden in the math: SINGLE filer, no dependents, no itemized deductions beyond
// the standard/personal allowance. Where a country layers national + sub-national tax
// (US states, Canadian provinces) we use a representative MID-tax jurisdiction, since
// the app doesn't ask which state/province — not the cheapest, not the priciest.
// Consistent with the rest of the app's philosophy, defaults lean slightly high
// (conservative) rather than slightly low where a genuine judgment call is needed.
//
// AS OF: 2025 tax year figures (UK: 2025/26). Rates rarely change dramatically year to
// year but thresholds drift with inflation — revisit every year or two, same cadence
// as the inflation/market/CD tables above. This is a planning tool, not a filing tool:
// a defensible ballpark matters far more than precision to the dollar.
//
// "ordinary" brackets apply to salary, pension, rent, and cash/CD interest.
// "dividend" brackets/rate apply only to dividend income, which several regions
// genuinely tax differently from ordinary income.
// ---------------------------------------------------------------------------------
// Progressive tax-bracket tables, used to compute an "average" (effective) tax rate
// on the fly from each year's actual simulated income, rather than asking everyone to
// guess and type in one flat number up front. Someone can still override with their
// own flat number (that's what "manual" mode is for) — this just makes the DEFAULT
// smarter and lets it evolve automatically as income changes year to year in the
// simulation (e.g. a much lower rate once retired and living off modest withdrawals
// than while earning full salary).
//
// Keyed by COUNTRY (or US state), not by the app's broader "region" — a single "EU"
// table was never going to be honest, since France/Germany/Italy/Spain differ from
// each other as much as they differ from the UK. Region still drives currency,
// inflation, and market/CD defaults (those blend reasonably at that level); tax does
// not, so it gets its own, finer-grained selector (profile.taxCountry) whenever the
// region is EU or US.
//
// Assumptions used throughout, deliberately kept simple and stated up front rather
// than hidden in the math: SINGLE filer, no dependents, no itemized deductions beyond
// the standard/personal allowance. Consistent with the rest of the app's philosophy,
// defaults lean slightly high (conservative) rather than slightly low where a genuine
// judgment call is needed.
//
// AS OF: 2025 tax year figures (UK: 2025/26). Rates rarely change dramatically year to
// year but thresholds drift with inflation — revisit every year or two, same cadence
// as the inflation/market/CD tables above. This is a planning tool, not a filing tool:
// a defensible ballpark matters far more than precision to the dollar.
//
// "ordinary" brackets apply to salary, pension, rent, and cash/CD interest.
// "dividend" brackets/rate apply only to dividend income, which several countries
// genuinely tax differently from ordinary income.
const TAX_TABLES = {
  FR: {
    label: "France — barème progressif + ~9pt CSG/CRDS add-on (single, 2025)",
    // official 2025 barème is 0/11/30/41/45; France also levies mandatory CSG/CRDS
    // social contributions on income that aren't captured by the income-tax barème
    // alone, approximated here as a flat add-on rather than modeled exactly
    ordinary: [
      { upTo: 11497, rate: 9 },
      { upTo: 29315, rate: 20 },
      { upTo: 83823, rate: 39 },
      { upTo: 180294, rate: 50 },
      { upTo: Infinity, rate: 54 },
    ],
    // Prélèvement Forfaitaire Unique (PFU / "flat tax"): 12.8% income tax + 17.2%
    // social contributions = 30% flat on dividends AND interest, regardless of
    // income level (an income-tax-barème option also exists but PFU is the default
    // and usually the better deal above the lowest bracket)
    dividend: [{ upTo: Infinity, rate: 30 }],
  },
  DE: {
    label: "Germany (single, 2025)",
    // Germany's real formula is a smooth geometric curve from 14% to 42%, not flat
    // brackets — approximated here with bands that roughly match its shape
    ordinary: [
      { upTo: 12096, rate: 0 },
      { upTo: 20000, rate: 17 },
      { upTo: 68480, rate: 30 },
      { upTo: 277825, rate: 42 },
      { upTo: Infinity, rate: 45 },
    ],
    // flat "Abgeltungsteuer" (25%) + solidarity surcharge (5.5% of the tax) = 26.375%,
    // applied to interest and dividends alike regardless of income level
    dividend: [{ upTo: Infinity, rate: 26.375 }],
  },
  IT: {
    label: "Italy — IRPEF (single, 2025)",
    ordinary: [
      { upTo: 8500, rate: 0 }, // "no tax area" for employees/pensioners
      { upTo: 28000, rate: 23 },
      { upTo: 50000, rate: 35 },
      { upTo: Infinity, rate: 43 },
    ],
    // standard flat "imposta sostitutiva" on most financial income (government
    // bonds get a preferential 12.5%, ignored here as the less common case)
    dividend: [{ upTo: Infinity, rate: 26 }],
  },
  ES: {
    label: "Spain — IRPF, national-average combined state+regional scale (single, 2025)",
    note: "Spain's regional half of IRPF varies by autonomous community (Madrid taxes noticeably less than Catalonia, for instance) — this uses a commonly-cited national-average combined rate. Switch to manual and enter your own if your region differs meaningfully.",
    ordinary: [
      { upTo: 12450, rate: 19 },
      { upTo: 20200, rate: 24 },
      { upTo: 35200, rate: 30 },
      { upTo: 60000, rate: 37 },
      { upTo: 300000, rate: 45 },
      { upTo: Infinity, rate: 47 },
    ],
    // "base del ahorro" — Spain's separate savings-income scale for dividends/interest
    dividend: [
      { upTo: 6000, rate: 19 },
      { upTo: 50000, rate: 21 },
      { upTo: 200000, rate: 23 },
      { upTo: 300000, rate: 27 },
      { upTo: Infinity, rate: 30 },
    ],
  },
  UK: {
    label: "UK income tax + employee National Insurance (single, 2025/26)",
    // income tax + NI blended, used for ordinary income (salary/pension/rent/interest)
    ordinary: [
      { upTo: 12570, rate: 0 },
      { upTo: 50270, rate: 28 },
      { upTo: 125140, rate: 42 },
      { upTo: Infinity, rate: 47 },
    ],
    // pure income-tax bands (NI doesn't apply to dividends) — used only to work out
    // which dividend band someone's income falls into
    incomeTaxBandsOnly: [
      { upTo: 12570, rate: 0 },
      { upTo: 50270, rate: 20 },
      { upTo: 125140, rate: 40 },
      { upTo: Infinity, rate: 45 },
    ],
    dividendByBand: { 0: 0, 20: 8.75, 40: 33.75, 45: 39.35 },
  },
  US_NY: {
    label: "US federal + New York State + NYC (single filer, 2025)",
    // merged federal + NY State + NYC marginal bands, rounded to whole points —
    // one of the highest combined-tax cases in the US, deliberately singled out
    // since "New York" is such a common answer and meaningfully differs from a
    // no-income-tax state
    ordinary: [
      { upTo: 8500, rate: 17 },
      { upTo: 48475, rate: 21 },
      { upTo: 103350, rate: 32 },
      { upTo: 197300, rate: 34 },
      { upTo: 250525, rate: 42 },
      { upTo: 626350, rate: 46 },
      { upTo: 1077550, rate: 48 },
      { upTo: Infinity, rate: 51 },
    ],
    // federal LTCG/qualified-dividend rate (0/15/20%) stacked with NY State + NYC,
    // which — unlike federal — tax dividends as ordinary income with no discount
    dividend: [
      { upTo: 48350, rate: 9 },
      { upTo: 197300, rate: 25 },
      { upTo: 533400, rate: 26 },
      { upTo: Infinity, rate: 31 },
    ],
  },
  US_OTHER: {
    label: "US federal + ~5pt representative state add-on (single filer, 2025)",
    note: "A rough stand-in for 'some US state,' since the app doesn't ask which one — real state income tax ranges from 0% (TX, FL, WA...) to over 10% (CA, NY...). Switch to manual and enter your own if you know your state's rate.",
    ordinary: [
      { upTo: 11925, rate: 15 },
      { upTo: 48475, rate: 17 },
      { upTo: 103350, rate: 27 },
      { upTo: 197300, rate: 29 },
      { upTo: 250525, rate: 37 },
      { upTo: 626350, rate: 40 },
      { upTo: Infinity, rate: 42 },
    ],
    // federal long-term capital gains / qualified dividend brackets (0/15/20%), plus the
    // same ~5pt state add-on used above
    dividend: [
      { upTo: 48350, rate: 5 },
      { upTo: 533400, rate: 20 },
      { upTo: Infinity, rate: 25 },
    ],
  },
  CA: {
    label: "Canada — Federal + Ontario-representative province (single, 2025)",
    ordinary: [
      { upTo: 57375, rate: 20 },
      { upTo: 105775, rate: 30 },
      { upTo: 150000, rate: 34 },
      { upTo: 220000, rate: 39 },
      { upTo: 253414, rate: 42 },
      { upTo: Infinity, rate: 46 },
    ],
    // Canada's dividend tax credit meaningfully lowers the effective rate on eligible
    // dividends relative to ordinary income — approximated here, not exact
    dividend: [
      { upTo: 57375, rate: 2 },
      { upTo: 105775, rate: 14 },
      { upTo: 150000, rate: 21 },
      { upTo: 220000, rate: 27 },
      { upTo: Infinity, rate: 31 },
    ],
  },
  GENERIC_OTHER: {
    label: "Generic blended estimate — not tied to a specific country's law",
    ordinary: [
      { upTo: 15000, rate: 5 },
      { upTo: 45000, rate: 20 },
      { upTo: 100000, rate: 30 },
      { upTo: Infinity, rate: 38 },
    ],
    dividend: [{ upTo: Infinity, rate: 20 }],
  },
};

// EU countries not yet in TAX_TABLES: rather than force them onto one specific
// country's brackets, this marker means "no real table" — the simulation falls
// back to a manual, FIXED rate (seeded once from the average of the four countries
// above, not recalculated as income changes year to year the way the real tables
// are). Less good than a real table, but better than silently using the wrong
// country's law.
const UNSUPPORTED_TAX_COUNTRY = "EU_OTHER";
const EU_TAX_COUNTRY_OPTIONS = [
  { value: "FR", label: "France" },
  { value: "DE", label: "Germany" },
  { value: "IT", label: "Italy" },
  { value: "ES", label: "Spain" },
  { value: UNSUPPORTED_TAX_COUNTRY, label: "Another EU country" },
];
const US_TAX_COUNTRY_OPTIONS = [
  { value: "US_NY", label: "New York (State + NYC)" },
  { value: "US_OTHER", label: "Another US state (generic federal-based estimate)" },
];

function isTaxCountrySupported(code) {
  return !!code && code !== UNSUPPORTED_TAX_COUNTRY && !!TAX_TABLES[code];
}

// which tax table applies for a given profile — region drives currency/inflation/
// markets, but tax now needs the finer-grained country selector for EU and US
function resolveTaxCountry(profile) {
  if (profile.region === "EU") return profile.taxCountry || "DE";
  if (profile.region === "US") return profile.taxCountry || "US_OTHER";
  if (profile.region === "UK") return "UK";
  if (profile.region === "Canada") return "CA";
  return "GENERIC_OTHER";
}

// average effective rate implied by a progressive bracket table at a given income
function effectiveRateFromBrackets(income, brackets) {
  if (!income || income <= 0) return 0;
  let tax = 0;
  let lower = 0;
  for (const b of brackets) {
    if (income <= lower) break;
    const taxable = Math.min(income, b.upTo) - lower;
    tax += taxable * (b.rate / 100);
    lower = b.upTo;
    if (income <= b.upTo) break;
  }
  return (tax / income) * 100;
}

function computeOrdinaryTaxRate(taxCountry, income) {
  const table = TAX_TABLES[taxCountry] || TAX_TABLES.GENERIC_OTHER;
  return effectiveRateFromBrackets(income, table.ordinary);
}

function computeDividendTaxRate(taxCountry, ordinaryIncome) {
  const table = TAX_TABLES[taxCountry] || TAX_TABLES.GENERIC_OTHER;
  if (taxCountry === "UK") {
    const bands = table.incomeTaxBandsOnly;
    for (const b of bands) {
      if (ordinaryIncome <= b.upTo) return table.dividendByBand[b.rate];
    }
    return table.dividendByBand[45];
  }
  if (table.dividend.length === 1 && table.dividend[0].upTo === Infinity) return table.dividend[0].rate;
  return effectiveRateFromBrackets(ordinaryIncome, table.dividend);
}

// ---------------------------------------------------------------------------------
// Capital gains — selling an appreciated investment or house, not dividend/interest
// income. Several countries tax this identically to dividends; a couple of them
// genuinely don't:
//   "sameAsDividend" — most of the EU + US: capital gains and dividends/interest fall
//                       under the same flat or preferential rate, so we just reuse the
//                       dividend table rather than duplicating it
//   "bands"           — UK: Capital Gains Tax is its OWN schedule, separate from both
//                       income tax and dividend tax (18% / 24% as of the Oct 2024
//                       budget, since unified for shares and residential property)
//   "inclusion"        — Canada: not a separate rate at all — only a FRACTION of the
//                       gain counts as taxable income, then it's taxed at the ordinary
//                       marginal rate. The proposed hike from 50% to 66.67% was
//                       cancelled in March 2025, so 50% inclusion stays in force.
const CAPITAL_GAINS_TREATMENT = {
  FR: "sameAsDividend",
  DE: "sameAsDividend",
  IT: "sameAsDividend",
  ES: "sameAsDividend",
  UK: "bands",
  US_NY: "sameAsDividend",
  US_OTHER: "sameAsDividend",
  CA: "inclusion",
  GENERIC_OTHER: "sameAsDividend",
};
const UK_CAPITAL_GAINS_BANDS = [
  { upTo: 50270, rate: 18 }, // basic-rate taxpayer
  { upTo: Infinity, rate: 24 }, // higher-rate taxpayer
];
const CA_CAPITAL_GAINS_INCLUSION_RATE = 0.5;

function computeCapitalGainsTaxRate(taxCountry, ordinaryIncome) {
  const treatment = CAPITAL_GAINS_TREATMENT[taxCountry] || "sameAsDividend";
  if (treatment === "inclusion") {
    // only half the gain is taxable, at the ordinary marginal rate — equivalent to
    // taxing the WHOLE gain at half the ordinary average rate
    return computeOrdinaryTaxRate(taxCountry, ordinaryIncome) * CA_CAPITAL_GAINS_INCLUSION_RATE;
  }
  if (treatment === "bands") {
    // same simplification as the UK dividend lookup: pick the single band implied by
    // ordinary income rather than splitting the gain itself across the boundary
    for (const b of UK_CAPITAL_GAINS_BANDS) {
      if (ordinaryIncome <= b.upTo) return b.rate;
    }
    return UK_CAPITAL_GAINS_BANDS[UK_CAPITAL_GAINS_BANDS.length - 1].rate;
  }
  return computeDividendTaxRate(taxCountry, ordinaryIncome);
}

// ---------------------------------------------------------------------------------
// Primary-residence capital gains exemptions. Only ever applies when a house's usage
// is "primary" — a rental never qualifies anywhere. Deliberately simplified: none of
// these track a holding-period or occupancy-period requirement (the app doesn't record
// a purchase DATE, only a purchase price), so this models the unconditional/simple
// version of each country's rule, not every qualifying nuance.
//   "full"         — the entire gain is exempt, no conditions modeled (France's
//                    résidence principale exemption, the UK's Private Residence
//                    Relief, Germany's owner-occupied exemption, Italy's prima casa
//                    exemption, Canada's Principal Residence Exemption)
//   "allowance"    — a fixed amount of gain is exempt, the rest taxed normally (US
//                    IRC §121: $250,000 for a single filer)
//   "reinvestment" — exempt ONLY if the full sale proceeds are reinvested into a new
//                    primary home (Spain's "reinversión en vivienda habitual") — maps
//                    onto this app's existing "buy a new home" post-sale plan: exempt
//                    if postSaleAction is "rebuy" AND the new home's value is at least
//                    the sale price, otherwise taxed as an ordinary capital gain
//   "none"         — no exemption modeled (countries without a real tax table)
const PRIMARY_RESIDENCE_EXEMPTION = {
  FR: { type: "full" },
  DE: { type: "full" },
  IT: { type: "full" },
  UK: { type: "full" },
  CA: { type: "full" },
  US_NY: { type: "allowance", amount: 250000 },
  US_OTHER: { type: "allowance", amount: 250000 },
  ES: { type: "reinvestment" },
  GENERIC_OTHER: { type: "none" },
};

// returns the portion of a house's capital gain that's exempt from tax under the
// primary-residence rule for this country — 0 for a rental, or if the country has
// no exemption, or (Spain) if the proceeds weren't fully reinvested into a new home
function computeExemptPrimaryResidenceGain({ taxCountry, isPrimary, capitalGain, saleValue, postSaleAction, rebuyValue }) {
  if (!isPrimary || capitalGain <= 0) return 0;
  const rule = PRIMARY_RESIDENCE_EXEMPTION[taxCountry] || PRIMARY_RESIDENCE_EXEMPTION.GENERIC_OTHER;
  if (rule.type === "full") return capitalGain;
  if (rule.type === "allowance") return Math.min(capitalGain, rule.amount);
  if (rule.type === "reinvestment") {
    const fullyReinvested = postSaleAction === "rebuy" && (rebuyValue || 0) >= saleValue;
    return fullyReinvested ? capitalGain : 0;
  }
  return 0;
}

// human-readable summary of a country's primary-residence exemption, for the house
// card and the Info page — kept in one place so the two stay consistent
function primaryResidenceExemptionNote(taxCountry, currency) {
  const rule = PRIMARY_RESIDENCE_EXEMPTION[taxCountry] || PRIMARY_RESIDENCE_EXEMPTION.GENERIC_OTHER;
  const countryLabel = TAX_TABLES[taxCountry]?.label || taxCountry;
  if (rule.type === "full") {
    return `As a primary residence, selling this home is fully exempt from capital gains tax (${countryLabel}'s primary-residence exemption).`;
  }
  if (rule.type === "allowance") {
    return `As a primary residence, up to ${fmt(rule.amount, currency)} of the gain is exempt from capital gains tax (a single-filer allowance); any gain above that is taxed as a normal capital gain.`;
  }
  if (rule.type === "reinvestment") {
    return `Spain only exempts this gain if you fully reinvest the sale proceeds into a new primary home — set "After selling, what happens?" to "Buy a new home" with a value at least equal to the sale price. Otherwise it's taxed as a normal capital gain.`;
  }
  return `We don't have primary-residence exemption rules for this country yet — this sale is taxed as a normal capital gain, same as an investment.`;
}

// one-time seed for an unsupported EU country: the average of the four real EU
// tables at this income, rather than either an arbitrary single country's number
// or the totally generic non-EU fallback
function estimateUnsupportedEURate(income, kind) {
  const codes = ["FR", "DE", "IT", "ES"];
  const fn = kind === "dividend" ? computeDividendTaxRate : kind === "capitalGains" ? computeCapitalGainsTaxRate : computeOrdinaryTaxRate;
  const sum = codes.reduce((s, c) => s + fn(c, income), 0);
  return sum / codes.length;
}


// TODO: this whole Inputs section nav (SECTIONS pills + the once-separated "order"
// row) has been shuffled around a few times and still isn't quite right — worth a
// proper redesign pass (e.g. a persistent sidebar or a different grouping entirely)
// rather than continuing to tweak pill placement.
const SECTIONS = [
  { id: "profile", label: "Profile", icon: <User size={14} /> },
  { id: "income", label: "Income & expenses", icon: <TrendingUp size={14} /> },
  { id: "cash", label: "Cash", icon: <Wallet size={14} /> },
  { id: "investments", label: "Investments", icon: <TrendingUp size={14} /> },
  { id: "retirement", label: "Retirement", icon: <PiggyBank size={14} /> },
  { id: "lumpsums", label: "Lump sums", icon: <Sparkles size={14} /> },
  { id: "order", label: "Withdrawal order", icon: <Home size={14} /> },
];

const SESSION_KEY = "retirement-calc-session-v8";
const PROFILE_KEY = "retirement-calc-profile-v8";
// language is a pure UI/display preference — deliberately stored and loaded completely
// separately from profile/session data, so it can never be tangled up with currency,
// region, or any other financial default. Switching it only changes displayed text.
const LANGUAGE_KEY = "retirement-calc-language-v1";

function withDisplayNames(list, fallbackPrefix) {
  const seen = {};
  return list.map((item, idx) => {
    let name = item.name && item.name.trim() ? item.name.trim() : `${fallbackPrefix} ${idx + 1}`;
    seen[name] = (seen[name] || 0) + 1;
    if (seen[name] > 1) name = `${name} (${seen[name]})`;
    return { ...item, displayName: name };
  });
}

const equityOf = (inv) => (inv.type === "house" ? Math.max(0, inv.amount - (inv.mortgageBalance || 0)) : inv.amount);

// Approximates David Blanchett's "retirement spending smile/smirk" research: real (inflation-
// adjusted) spending isn't flat through retirement — it declines, roughly 1%/yr for the first
// 10 years, then ~2%/yr for the next ~9 years (matching his empirically observed ~26% trough
// around 19 years into retirement), then flattens rather than staying constant forever. We
// deliberately flatten rather than adding a late-life uptick: that uptick is real in Blanchett's
// AVERAGE data (driven by a subset with major healthcare/long-term-care costs), but the MEDIAN
// individual retiree's spending just declines and stays down — a "smirk," not a "smile." A flat
// floor is the more conservative default for an individual plan.
function retirementSpendingMultiplier(yearsIntoRetirement) {
  if (yearsIntoRetirement <= 0) return 1;
  if (yearsIntoRetirement <= 10) return Math.pow(0.99, yearsIntoRetirement);
  const afterTenYears = Math.pow(0.99, 10);
  const extraYears = Math.min(yearsIntoRetirement - 10, 9);
  return afterTenYears * Math.pow(0.98, extraYears);
}

// ---------- full retirement-runway simulation (drives the chart) ----------
function runSimulation({ profile, work, expensesState, cash, investments, retirement, withdrawalOrder, pension, lumpSums, savingsRule }) {
  const years = [];
  let cashBal = cash.amount;
  let invBal = withDisplayNames(investments, "Investment").map((i) => ({
    ...i,
    amount: i.amount,
    costBasis: i.type !== "house" ? i.costBasis ?? i.amount : undefined,
    mortgageBalance: i.mortgageBalance || 0,
    mortgageScheduleYear: 0, // how many years into its LOCKED amortization schedule this mortgage is
    currentRent: i.rent || 0,
  }));
  // lock each mortgage's amortization schedule ONCE, from today's balance/payment/rate —
  // a floating-rate mortgage is locked at today's cash rate too, since this app never
  // actually changes that assumption over time (see the disclaimer on the house card).
  const mortgageSchedules = {};
  invBal.forEach((inv) => {
    if (inv.type !== "house" || (inv.mortgageBalance || 0) <= 0.01) return;
    const rate = inv.mortgageRateType === "floating" ? cash.rate : inv.mortgageRate || 0;
    mortgageSchedules[inv.id] = buildMortgageSchedule(inv.mortgageBalance, inv.mortgagePayment || 0, rate);
  });
  let retBal = withDisplayNames(retirement, "Account").map((r) => ({ ...r, amount: r.amount }));
  let salary = work.salary;
  let finalSalary = work.salary;
  let monthlyExpenses = expensesState.monthly;
  let extraRentExpenseAnnual = 0;
  let ranOutAge = null;
  const retirementStartAge = profile.currentAge + Math.max(0, work.yearsWorking);

  // ---- state pension pro-rata ----
  // Most state pensions pay a fraction based on how many years you contributed. We assume
  // a career starting at `careerStartAge` (default 25) and a full pension requiring
  // contributions up to `fullPensionAge` (default 65). Stopping early therefore scales the
  // pension down proportionally rather than paying out in full.
  const careerStart = pension?.careerStartAge ?? 25;
  const fullPensionAge = pension?.fullPensionAge ?? 65;
  const yearsNeededForFull = Math.max(1, fullPensionAge - careerStart);
  const yearsWorkedBeforeNow = Math.max(0, profile.currentAge - careerStart);
  const totalContributionYears = yearsWorkedBeforeNow + Math.max(0, work.yearsWorking);
  const pensionProRata =
    pension?.proRata === false ? 1 : Math.max(0, Math.min(1, totalContributionYears / yearsNeededForFull));

  for (let age = profile.currentAge; age <= profile.lifeExpectancy; age++) {
    const yearIndex = age - profile.currentAge;
    const workFraction = Math.max(0, Math.min(1, work.yearsWorking - yearIndex));
    const explain = {};

    const grossSalary = workFraction * salary;
    if (workFraction > 0) finalSalary = salary;

    const pensionEnabled = pension && pension.enabled !== false;
    const pensionBase =
      pensionEnabled && age >= (pension.startAge || 9999)
        ? ((pension.percentOfSalary || 0) / 100) * finalSalary * pensionProRata
        : 0;
    // optionally index the pension to inflation from the year it starts
    const pensionYearsRunning = pensionBase > 0 ? Math.max(0, age - (pension.startAge || 0)) : 0;
    const pensionGross =
      pensionBase > 0 && pension.indexed
        ? pensionBase * Math.pow(1 + expensesState.inflation / 100, pensionYearsRunning)
        : pensionBase;

    // ---- work out this year's average tax rate BEFORE taxing anything ----
    // Gather this year's GROSS ordinary income first (tax-free), so a progressive rate
    // can be looked up from the region's bracket table before it's applied to anything.
    // This has to happen in a pass separate from the actual tax application below,
    // because e.g. a CD's gross interest is one of the inputs to the rate, not an
    // output of it. Dividends are handled separately below with their own rate.
    let grossRentTotal = 0;
    const houseGrossRentById = {};
    invBal.forEach((inv) => {
      if (inv.type === "house" && inv.usage === "rental") {
        const grossRent = (inv.currentRent || 0) * 12;
        houseGrossRentById[inv.id] = grossRent;
        grossRentTotal += grossRent;
      }
    });
    const cashStart = cashBal;
    const cashInterestGross = cashStart * (cash.rate / 100);
    const cdGrossRateById = {};
    let cdGrossInterestTotal = 0;
    invBal.forEach((inv) => {
      if (inv.type !== "cd") return;
      // A CD's headline rate is today's market rate — it won't last. Once any lock-in
      // (tenor) expires, the rate glides linearly over 5 years to a long-run rate anchored
      // to inflation, then stays there. See the Info page for the reasoning.
      const tenor = Math.max(0, inv.cdTenorYears ?? 1);
      const longRun = inv.cdLongRunRate ?? Math.max(0, expensesState.inflation - 0.5);
      let cdGrossRate;
      if (yearIndex < tenor) {
        cdGrossRate = inv.growthRate; // still locked at the agreed rate
      } else {
        const t = Math.min(1, (yearIndex - tenor + 1) / 5);
        cdGrossRate = inv.growthRate + (longRun - inv.growthRate) * t;
      }
      cdGrossRateById[inv.id] = cdGrossRate;
      cdGrossInterestTotal += inv.amount * (cdGrossRate / 100);
    });
    const totalOrdinaryGrossIncome = grossSalary + pensionGross + grossRentTotal + cashInterestGross + cdGrossInterestTotal;

    // Either the progressive rate implied by this region's bracket table at this year's
    // actual income (the default, "auto" mode — so it naturally drops once retired and
    // living off smaller withdrawals), or a fixed override if manually set. Either way
    // this ONE rate is the flat proxy used for ordinary income, cash/CD interest, and
    // (as before) capital-gains-style withdrawals elsewhere in this loop — that
    // simplification is carried over from the original model, not new. Dividends get
    // their own separate rate just below, since several countries tax them differently.
    // "auto" only works for a country with a real bracket table — an unsupported EU
    // country falls back to manual automatically, using whatever fixed number was
    // seeded when the country was chosen (it won't move with income like the rest do).
    const taxCountry = resolveTaxCountry(profile);
    const taxCountrySupported = isTaxCountrySupported(taxCountry);
    const taxMode = taxCountrySupported ? profile.taxMode ?? "manual" : "manual"; // old saved profiles predate this field
    const taxRateThisYear = taxMode === "manual" ? profile.taxBracket ?? 24 : computeOrdinaryTaxRate(taxCountry, totalOrdinaryGrossIncome);
    const dividendTaxMode = taxCountrySupported ? profile.dividendTaxMode ?? "manual" : "manual";
    const dividendRateThisYear =
      dividendTaxMode === "manual"
        ? profile.dividendTaxRate ?? profile.taxBracket ?? 24
        : computeDividendTaxRate(taxCountry, totalOrdinaryGrossIncome);
    // capital gains (selling an appreciated investment or house) get their own rate
    // too — several countries tax gains quite differently from ordinary income; see
    // computeCapitalGainsTaxRate for exactly how each supported country works.
    const capitalGainsTaxMode = taxCountrySupported ? profile.capitalGainsTaxMode ?? "manual" : "manual";
    const capitalGainsRateThisYear =
      capitalGainsTaxMode === "manual"
        ? profile.capitalGainsTaxRate ?? profile.taxBracket ?? 24
        : computeCapitalGainsTaxRate(taxCountry, totalOrdinaryGrossIncome);

    const netSalary = grossSalary * (1 - taxRateThisYear / 100);
    const netPension = pensionGross * (1 - taxRateThisYear / 100);

    let extraIncome = 0;
    let totalRentIncome = 0;
    let totalDividendIncome = 0;
    let totalMortgagePayments = 0;
    const mortgagePaymentDetail = [];
    const houseIncomeDetail = {};
    invBal.forEach((inv) => {
      if (inv.type === "house") {
        const balance = inv.mortgageBalance || 0;
        const mortgageActive = balance > 0.01;
        const annualPayment = mortgageActive ? (inv.mortgagePayment || 0) * 12 : 0;
        let netRentIncome = 0;
        if (inv.usage === "rental") {
          const grossRent = houseGrossRentById[inv.id] || 0;
          netRentIncome = grossRent * (1 - taxRateThisYear / 100);
          extraIncome += netRentIncome - annualPayment;
          totalRentIncome += netRentIncome;
        } else {
          extraIncome -= annualPayment;
        }
        if (annualPayment > 0) {
          totalMortgagePayments += annualPayment;
          mortgagePaymentDetail.push({ name: inv.displayName, annual: annualPayment });
        }
        houseIncomeDetail[inv.displayName] = { rentIncome: netRentIncome, mortgagePaymentAnnual: annualPayment };
      } else if (inv.type === "dividend") {
        const grossDiv = inv.amount * ((inv.dividendYield || 0) / 100);
        const netDiv = grossDiv * (1 - dividendRateThisYear / 100);
        extraIncome += netDiv;
        totalDividendIncome += netDiv;
      }
    });

    const yearsIntoRetirement = Math.max(0, age - retirementStartAge);
    const spendingMult = expensesState.spendingDecline?.enabled ? retirementSpendingMultiplier(yearsIntoRetirement) : 1;
    const livingExpensesThisYear = monthlyExpenses * 12 * spendingMult;
    const annualExpenses = livingExpensesThisYear + extraRentExpenseAnnual;

    const cashInterestNet = cashInterestGross * (1 - taxRateThisYear / 100);
    cashBal = cashStart + cashInterestNet;
    const cashGrowthAmount = cashBal - cashStart;

    invBal = invBal.map((inv) => {
      const startBalance = inv.amount;
      // A CD / term deposit pays interest that is taxed the year it's earned (like cash),
      // rather than compounding untaxed and being taxed as a capital gain when sold.
      const isCD = inv.type === "cd";
      const cdGrossRate = isCD ? cdGrossRateById[inv.id] : inv.growthRate;
      const effectiveRate = isCD ? cdGrossRate * (1 - taxRateThisYear / 100) : inv.growthRate;
      const grown = startBalance * (1 + effectiveRate / 100);
      let contribAnnual = 0;
      let contribPerPeriod = 0;
      let contribFrequency = null;
      if (inv.type !== "house") {
        const freqMult = inv.contributionFrequency === "yearly" ? 1 : 12;
        contribPerPeriod = inv.contribution || 0;
        contribFrequency = inv.contributionFrequency === "yearly" ? "year" : "month";
        contribAnnual = workFraction * (contribPerPeriod * freqMult);
      }
      const dividendPaid = inv.type === "dividend" ? startBalance * ((inv.dividendYield || 0) / 100) * (1 - dividendRateThisYear / 100) : 0;
      explain[inv.displayName] = {
        kind: inv.type,
        startBalance,
        growthPct: inv.growthRate,
        growthAmount: grown - startBalance,
        isCD,
        cdRateThisYear: isCD ? cdGrossRate : undefined,
        interestTaxPaid: isCD ? startBalance * (cdGrossRate / 100) * (taxRateThisYear / 100) : 0,
        contribPerPeriod,
        contribFrequency,
        contribPeriods: contribFrequency ? (contribFrequency === "month" ? 12 : 1) * workFraction : 0,
        contribAnnual,
        dividendPaid,
        withdrawn: 0,
      };
      const nextAmount = grown + contribAnnual;
      const nextCostBasis =
        inv.type === "house" ? undefined : isCD ? nextAmount : (inv.costBasis ?? startBalance) + contribAnnual;
      return { ...inv, amount: nextAmount, costBasis: nextCostBasis };
    });
    retBal = retBal.map((r) => {
      const startBalance = r.amount;
      const grown = startBalance * (1 + r.growthRate / 100);
      const contribution = workFraction * (r.contribution || 0);
      explain[r.displayName] = {
        kind: "retirement",
        startBalance,
        growthPct: r.growthRate,
        growthAmount: grown - startBalance,
        contribAnnual: contribution,
        withdrawn: 0,
      };
      return { ...r, amount: grown + contribution };
    });

    const lumpSumThisYear = (lumpSums || []).reduce((s, ls) => (Math.round(ls.age) === age ? s + (ls.amount || 0) : s), 0);
    const lumpSumEvents = (lumpSums || []).filter((ls) => Math.round(ls.age) === age);

    const netCashFlow = netSalary + netPension + extraIncome + lumpSumThisYear - annualExpenses;

    let cashWithdrawn = 0;
    let defaultedThisYear = false;
    let hitCashFloor = false;
    let toCashSurplus = 0;
    let toInvestSurplus = 0;

    // splits any positive amount of cash between the cash pile and a target investment,
    // respecting the min/max cash band — used for regular income surplus AND for
    // windfalls like leftover house-sale proceeds
    const routeSurplus = (amount) => {
      if (amount <= 0) {
        cashBal += amount;
        return { toCash: amount, toInvest: 0 };
      }
      const target = savingsRule ? invBal.find((i) => i.id === savingsRule.targetInvestmentId && i.type !== "house") : null;
      if (!target) {
        cashBal += amount;
        return { toCash: amount, toInvest: 0 };
      }
      const minCash = savingsRule.minCash ?? 0;
      const maxCash = savingsRule.maxCash ?? Infinity;
      const cashPct = Math.min(100, Math.max(0, savingsRule.cashPercent ?? 50)) / 100;
      let toCash, toInvest;
      if (cashBal < minCash) {
        toCash = amount;
        toInvest = 0;
      } else if (cashBal >= maxCash) {
        toCash = 0;
        toInvest = amount;
      } else {
        toCash = amount * cashPct;
        toInvest = amount - toCash;
        if (cashBal + toCash > maxCash) {
          const overflow = cashBal + toCash - maxCash;
          toCash -= overflow;
          toInvest += overflow;
        }
      }
      cashBal += toCash;
      target.amount += toInvest;
      if (target.type !== "house") target.costBasis = (target.costBasis ?? target.amount - toInvest) + toInvest;
      if (explain[target.displayName]) explain[target.displayName].surplusInvested = (explain[target.displayName].surplusInvested || 0) + toInvest;
      return { toCash, toInvest };
    };

    if (netCashFlow >= 0) {
      const result = routeSurplus(netCashFlow);
      toCashSurplus = result.toCash;
      toInvestSurplus = result.toInvest;
    } else {
      let shortfall = -netCashFlow;
      for (const entry of withdrawalOrder) {
        if (shortfall <= 0) break;
        const { type, id } = parseOrderEntry(entry);

        if (type === "cash") {
          const floor = savingsRule?.minCash || 0;
          const available = Math.max(0, cashBal - floor);
          const take = Math.min(available, shortfall);
          cashBal -= take;
          cashWithdrawn += take;
          shortfall -= take;
          if (shortfall > 0 && cashBal > 0.01 && floor > 0) hitCashFloor = true;
        } else if (type === "investment") {
          const inv = invBal.find((i) => i.id === id && i.type !== "house");
          if (!inv || inv.amount <= 0) continue;
          const costBasis = inv.costBasis ?? inv.amount;
          const gainFraction = inv.amount > 0 ? Math.max(0, (inv.amount - costBasis) / inv.amount) : 0;
          const taxRate = Math.min(gainFraction * (capitalGainsRateThisYear / 100), 0.95);
          const grossNeeded = shortfall / (1 - taxRate);
          const take = Math.min(inv.amount, grossNeeded);
          const net = take * (1 - taxRate);
          const basisPortion = inv.amount > 0 ? costBasis * (take / inv.amount) : 0;
          inv.costBasis = Math.max(0, costBasis - basisPortion);
          inv.amount -= take;
          if (explain[inv.displayName]) {
            explain[inv.displayName].withdrawn += take;
            explain[inv.displayName].withdrawTaxRate = taxRate;
          }
          shortfall -= net;
        } else if (type === "retirement") {
          const r = retBal.find((x) => x.id === id);
          if (!r) continue;
          const minAge = r.minAge || 0;
          const belowMinAge = age < minAge;
          if (belowMinAge && !r.earlyAccessAllowed) continue;
          const penaltyRate = belowMinAge && r.earlyAccessAllowed ? (r.earlyPenalty || 0) / 100 : 0;
          const taxRate = r.taxTreatment === "pretax" ? taxRateThisYear / 100 : 0;
          const totalRate = Math.min(taxRate + penaltyRate, 0.95);
          const grossNeeded = shortfall / (1 - totalRate);
          const take = Math.min(r.amount, grossNeeded);
          const net = take * (1 - totalRate);
          r.amount -= take;
          if (explain[r.displayName]) explain[r.displayName].withdrawn += take;
          shortfall -= net;
        } else if (type === "house") {
          const rawInv = invBal.find((i) => i.id === id);
          if (!rawInv || rawInv.sellable === false) continue;
          if (rawInv._sold && rawInv.type !== "house") {
            // already sold and reinvested in a prior year — now behaves like a normal
            // investment, including capital-gains tax on growth since it was reinvested
            if (rawInv.amount <= 0) continue;
            const cb = rawInv.costBasis ?? rawInv.amount;
            const gf = rawInv.amount > 0 ? Math.max(0, (rawInv.amount - cb) / rawInv.amount) : 0;
            const tr = Math.min(gf * (capitalGainsRateThisYear / 100), 0.95);
            const grossNeeded = shortfall / (1 - tr);
            const take = Math.min(rawInv.amount, grossNeeded);
            const net = take * (1 - tr);
            const basisPortion = rawInv.amount > 0 ? cb * (take / rawInv.amount) : 0;
            rawInv.costBasis = Math.max(0, cb - basisPortion);
            rawInv.amount -= take;
            if (explain[rawInv.displayName]) {
              explain[rawInv.displayName].withdrawn += take;
              explain[rawInv.displayName].withdrawTaxRate = tr;
            }
            shortfall -= net;
            continue;
          }
          const inv = rawInv.type === "house" ? rawInv : null;
          if (!inv || inv._sold) continue;
          const equity = Math.max(0, inv.amount - (inv.mortgageBalance || 0));
          if (equity <= 0) continue;
          const feeRate = Math.min(Math.max((inv.sellingFeePercent ?? 4) / 100, 0), 0.5);

          // properties are never partially sold — tapping one liquidates it entirely, this year.
          // "buy a new home" / "rent afterward" plans only apply to a primary residence — a
          // rental's proceeds always just go to cash or get reinvested, regardless of what's stored.
          let effectivePostSaleAction =
            inv.usage === "rental" && (inv.postSaleAction === "rebuy" || inv.postSaleAction === "resize" || inv.postSaleAction === "rent")
              ? "none"
              : inv.postSaleAction;
          // a primary home can't be sold with "no plan" — that would leave you homeless in the
          // model. Fall back to renting, using the old mortgage payment as a rough rent proxy
          // if no rent was ever set. The UI no longer offers "none" for a primary home going
          // forward; this only protects older saved data.
          let assumedPrimaryRentFallback = false;
          if (inv.usage === "primary" && (!effectivePostSaleAction || effectivePostSaleAction === "none")) {
            effectivePostSaleAction = "rent";
            if (!inv.postSaleRent) {
              inv.postSaleRent = inv.mortgagePayment || 0;
              assumedPrimaryRentFallback = true;
            }
          }
          const saleValue = inv.amount;
          const sellingFee = saleValue * feeRate;
          // tax is charged on the ACTUAL gain over the purchase price — not a proportional
          // rate applied to equity, which under-charged whenever a mortgage was outstanding
          const capitalGain = Math.max(0, saleValue - (inv.purchasePrice ?? saleValue));
          // a primary residence gets whatever exemption this country offers (full,
          // a fixed allowance, or — Spain — only if fully reinvested into a new home);
          // a rental never qualifies. See computeExemptPrimaryResidenceGain for the
          // exact rule per country.
          const exemptGain = computeExemptPrimaryResidenceGain({
            taxCountry,
            isPrimary: inv.usage !== "rental",
            capitalGain,
            saleValue,
            postSaleAction: effectivePostSaleAction,
            rebuyValue: inv.rebuyValue,
          });
          const taxableGain = Math.max(0, capitalGain - exemptGain);
          const gainTax = taxableGain * (capitalGainsRateThisYear / 100);
          const netProceeds = Math.max(0, equity - gainTax - sellingFee);
          let cashFromSale = netProceeds;
          let saleNote = { sellingFee, capitalGain, exemptGain, taxableGain, gainTax };
          if (effectivePostSaleAction === "rebuy" || effectivePostSaleAction === "resize") {
            const newValue = effectivePostSaleAction === "resize" ? saleValue * (inv.resizeFactor || 1) : inv.rebuyValue || 0;
            cashFromSale -= newValue;
            inv.amount = newValue;
            inv.mortgageBalance = 0;
            inv.purchasePrice = newValue;
            inv.sellable = false;
            saleNote.newHomeValue = newValue;
            inv._sold = true;
            const applied = Math.min(Math.max(cashFromSale, 0), shortfall);
            shortfall -= applied;
            const remainder = cashFromSale - applied;
            if (remainder > 0) routeSurplus(remainder);
            else cashBal += remainder;
          } else {
            // "rent" (or no housing plan): decide what happens to the proceeds not needed this year
            if (effectivePostSaleAction === "rent") {
              extraRentExpenseAnnual = (inv.postSaleRent || 0) * 12;
              saleNote.newMonthlyRent = inv.postSaleRent || 0;
            }
            inv._sold = true;
            const applied = Math.min(Math.max(cashFromSale, 0), shortfall);
            shortfall -= applied;
            const leftover = cashFromSale - applied;
            if ((inv.reinvestAs === "cd" || inv.reinvestAs === "market") && leftover > 0) {
              inv.amount = leftover;
              inv.type = "market";
              inv.growthRate = inv.reinvestRate || 0;
              inv.mortgageBalance = 0;
              // these proceeds have already been taxed on sale — set the cost basis to the
              // amount reinvested so only FUTURE growth is taxable from here on
              inv.costBasis = leftover;
              saleNote.reinvestedAs = inv.reinvestAs;
              saleNote.reinvestedAmount = leftover;
              saleNote.reinvestRate = inv.reinvestRate || 0;
            } else {
              inv.amount = 0;
              inv.mortgageBalance = 0;
              if (leftover > 0) routeSurplus(leftover);
              else cashBal += leftover;
            }
          }
          if (explain[inv.displayName]) {
            explain[inv.displayName].sold = true;
            explain[inv.displayName].saleValue = saleValue;
            explain[inv.displayName].saleEquity = equity;
            explain[inv.displayName].postSaleAction = effectivePostSaleAction;
            explain[inv.displayName].assumedPrimaryRentFallback = assumedPrimaryRentFallback;
            Object.assign(explain[inv.displayName], saleNote);
          }
        }
      }
      if (shortfall > 0 && ranOutAge === null) ranOutAge = age;
      if (shortfall > 0) defaultedThisYear = true;
    }

    // Fix 2: if we couldn't cover this year's costs, a mortgaged property must be sold —
    // you can't simply stop paying and keep the house. Proceeds cover what they can.
    if (defaultedThisYear) {
      const mortgaged = invBal.find((i) => i.type === "house" && !i._sold && (i.mortgageBalance || 0) > 0.01);
      if (mortgaged) {
        const saleValue = mortgaged.amount;
        const feeRate = Math.min(Math.max((mortgaged.sellingFeePercent ?? 4) / 100, 0), 0.5);
        const sellingFee = saleValue * feeRate;
        const capitalGain = Math.max(0, saleValue - (mortgaged.purchasePrice ?? saleValue));
        // same primary-residence exemption logic as a planned sale — a forced sale
        // has no "reinvest in a new home" plan, so Spain's reinvestment exemption
        // never applies here, but France/Germany/Italy/UK/Canada's unconditional
        // exemption and the US allowance still do
        const exemptGain = computeExemptPrimaryResidenceGain({
          taxCountry,
          isPrimary: mortgaged.usage !== "rental",
          capitalGain,
          saleValue,
          postSaleAction: "rent",
          rebuyValue: 0,
        });
        const taxableGain = Math.max(0, capitalGain - exemptGain);
        const gainTax = taxableGain * (capitalGainsRateThisYear / 100);
        const grossEquity = Math.max(0, saleValue - (mortgaged.mortgageBalance || 0));
        const proceeds = Math.max(0, grossEquity - gainTax - sellingFee);
        mortgaged._sold = true;
        mortgaged.amount = 0;
        mortgaged.mortgageBalance = 0;
        if (mortgaged.usage === "primary") {
          // still need somewhere to live — fall back to renting at the same monthly cost
          extraRentExpenseAnnual = (mortgaged.mortgagePayment || 0) * 12;
        }
        if (proceeds > 0) routeSurplus(proceeds);
        if (explain[mortgaged.displayName]) {
          explain[mortgaged.displayName].forcedSale = true;
          explain[mortgaged.displayName].saleValue = saleValue;
          explain[mortgaged.displayName].sellingFee = sellingFee;
          explain[mortgaged.displayName].capitalGain = capitalGain;
          explain[mortgaged.displayName].exemptGain = exemptGain;
          explain[mortgaged.displayName].taxableGain = taxableGain;
          explain[mortgaged.displayName].gainTax = gainTax;
          explain[mortgaged.displayName].forcedProceeds = proceeds;
        }
      }
    }

    explain["Cash"] = {
      kind: "cash",
      startBalance: cashStart,
      growthPct: cash.rate,
      growthAmount: cashGrowthAmount,
      interestTaxPaid: cashInterestGross - cashInterestNet,
      hitCashFloor,
      surplusAdded: toCashSurplus,
      withdrawn: cashWithdrawn,
      lumpSumAmount: lumpSumThisYear,
    };

    invBal = invBal.map((inv) => {
      if (inv.type !== "house") return inv;
      let nextBalance = inv.mortgageBalance || 0;
      let interestPaid = 0;
      let principalPaid = 0;
      let nextScheduleYear = inv.mortgageScheduleYear || 0;
      if (nextBalance > 0.01 && !defaultedThisYear) {
        const schedule = mortgageSchedules[inv.id];
        const row = scheduleYearRow(schedule, nextScheduleYear);
        if (row) {
          // locked schedule: read this year's numbers off the fixed amortization plan
          // computed once at the top of the simulation, instead of re-deriving them from
          // the current balance/rate/payment — guarantees payoff exactly on schedule.
          interestPaid = row.interestPaid;
          principalPaid = row.principalPaid;
          nextBalance = row.endBalance;
          nextScheduleYear += 1;
        } else {
          // no finite schedule exists (payment doesn't cover interest at this rate) — same
          // live year-by-year math as before; this loan genuinely never amortizes, which is
          // exactly what the "payment doesn't cover interest" warning on the house card flags.
          const rate = inv.mortgageRateType === "floating" ? cash.rate : inv.mortgageRate || 0;
          const annualInterest = nextBalance * (rate / 100);
          const annualPayment = (inv.mortgagePayment || 0) * 12;
          const principal = annualPayment - annualInterest;
          interestPaid = annualInterest;
          principalPaid = Math.max(0, Math.min(principal, nextBalance));
          nextBalance = Math.max(0, nextBalance - principal);
        }
      }
      const detail = houseIncomeDetail[inv.displayName] || {};
      if (explain[inv.displayName]) {
        explain[inv.displayName].rentIncome = detail.rentIncome || 0;
        explain[inv.displayName].mortgagePaymentAnnual = detail.mortgagePaymentAnnual || 0;
        explain[inv.displayName].interestPaid = interestPaid;
        explain[inv.displayName].principalPaid = principalPaid;
      }
      const nextRent = inv.usage === "rental" ? (inv.currentRent || 0) * (1 + expensesState.inflation / 100) : inv.currentRent;
      return { ...inv, mortgageBalance: nextBalance, mortgageScheduleYear: nextScheduleYear, currentRent: nextRent };
    });

    const record = { age, year: new Date().getFullYear() + yearIndex, Cash: Math.max(cashBal, 0) };
    invBal.forEach((inv) => {
      record[inv.displayName] = Math.max(equityOf(inv), 0);
    });
    retBal.forEach((r) => (record[r.displayName] = Math.max(r.amount, 0)));
    // total outstanding mortgage debt across all properties, shown as its own NEGATIVE
    // band on the chart — a mortgaged house otherwise only shows as its (often small)
    // equity sliver, making six-figure debt invisible. Recharts stacks negative-valued
    // series below zero automatically when they share a stackId with positive ones.
    const totalMortgageDebt = invBal.reduce((s, inv) => s + (inv.type === "house" ? inv.mortgageBalance || 0 : 0), 0);
    record.Debt = -totalMortgageDebt;
    record._grossAssets =
      Math.max(cashBal, 0) +
      invBal.reduce((s, i) => s + Math.max(i.amount, 0), 0) +
      retBal.reduce((s, r) => s + Math.max(r.amount, 0), 0);
    record._totalDebt = totalMortgageDebt;
    record._total =
      Math.max(cashBal, 0) +
      invBal.reduce((s, i) => s + Math.max(equityOf(i), 0), 0) +
      retBal.reduce((s, r) => s + Math.max(r.amount, 0), 0);
    record._explain = explain;
    record._defaulted = defaultedThisYear;
    record._lumpSumEvents = lumpSumEvents;
    if (netCashFlow < 0) {
      record._shortfall = {
        total: -netCashFlow,
        livingExpenses: livingExpensesThisYear,
        spendingDeclinePct: spendingMult < 1 ? Math.round((1 - spendingMult) * 1000) / 10 : 0,
        postSaleRentExpense: extraRentExpenseAnnual,
        mortgagePaymentDetail,
        mortgagePayments: totalMortgagePayments,
        salary: netSalary,
        pension: netPension,
        rentIncome: totalRentIncome,
        dividendIncome: totalDividendIncome,
        lumpSum: lumpSumThisYear,
      };
    }
    years.push(record);

    salary *= 1 + work.salaryGrowth / 100;
    monthlyExpenses *= 1 + expensesState.inflation / 100;
    if (extraRentExpenseAnnual > 0) extraRentExpenseAnnual *= 1 + expensesState.inflation / 100;
  }

  return { years, ranOutAge };
}

// ---------- financial independence age (fractional, day-precise) ----------
function computeFI({ profile, work, expensesState, cash, investments, retirement, withdrawalOrder, pension, lumpSums, savingsRule }) {
  const base = { profile, expensesState, cash, investments, retirement, withdrawalOrder, pension, lumpSums, savingsRule };
  const sustainableAt = (yearsWorkingFrac) => {
    const { ranOutAge } = runSimulation({ ...base, work: { ...work, yearsWorking: yearsWorkingFrac } });
    return !ranOutAge;
  };

  let hiInt = null;
  for (let candidateAge = profile.currentAge; candidateAge <= profile.lifeExpectancy; candidateAge++) {
    if (sustainableAt(candidateAge - profile.currentAge)) {
      hiInt = candidateAge;
      break;
    }
  }
  if (hiInt == null) return { fiAge: null };
  if (hiInt === profile.currentAge) return { fiAge: hiInt };

  let loFrac = hiInt - 1 - profile.currentAge;
  let hiFrac = hiInt - profile.currentAge;
  for (let i = 0; i < 16; i++) {
    const mid = (loFrac + hiFrac) / 2;
    if (sustainableAt(mid)) hiFrac = mid;
    else loFrac = mid;
  }
  return { fiAge: profile.currentAge + hiFrac };
}

function freedomMessage(deltaDays, deltaNetWorth, currency) {
  const posTemplates = [
    (d) => `🎉 You just bought yourself ${d} day${d === 1 ? "" : "s"} of freedom!`,
    (d) => `🚀 ${d} day${d === 1 ? "" : "s"} closer to quitting — nice move.`,
    (d) => `🔥 Freedom clock: −${d} day${d === 1 ? "" : "s"}. Keep going!`,
  ];
  const posWithMoney = (d, m) => `💰 Your portfolio gained ${fmt(m, currency)} → you're now ${d} day${d === 1 ? "" : "s"} closer to quitting!`;
  const negTemplates = [
    (d) => `⏳ That move cost you ${d} day${d === 1 ? "" : "s"} of freedom.`,
    (d) => `😬 Your freedom date just slipped by ${d} day${d === 1 ? "" : "s"}.`,
  ];
  if (deltaDays > 0) {
    if (deltaNetWorth > 500 && Math.random() < 0.5) return { text: posWithMoney(deltaDays, deltaNetWorth), positive: true };
    return { text: posTemplates[Math.floor(Math.random() * posTemplates.length)](deltaDays), positive: true };
  }
  if (deltaDays < 0) {
    const d = Math.abs(deltaDays);
    return { text: negTemplates[Math.floor(Math.random() * negTemplates.length)](d), positive: false };
  }
  return null;
}

// ---------- what-if levers: each shows the current baseline value by default,
// and the user overrides it to a new absolute target ----------
const weightedAvgGrowth = (d) => {
  let totalW = d.cash.amount;
  let weightedSum = d.cash.amount * d.cash.rate;
  d.investments
    .filter((i) => i.type !== "house")
    .forEach((i) => {
      totalW += i.amount;
      weightedSum += i.amount * i.growthRate;
    });
  d.retirement.forEach((r) => {
    totalW += r.amount;
    weightedSum += r.amount * r.growthRate;
  });
  return totalW > 0 ? weightedSum / totalW : 0;
};

// weighted average of market/dividend investment rates + retirement accounts — excludes
// cash and CDs, which get their own separate What-If levers
const weightedAvgMarketRate = (d) => {
  let totalW = 0;
  let weightedSum = 0;
  d.investments
    .filter((i) => i.type !== "house" && i.type !== "cd")
    .forEach((i) => {
      totalW += i.amount;
      weightedSum += i.amount * i.growthRate;
    });
  d.retirement.forEach((r) => {
    totalW += r.amount;
    weightedSum += r.amount * r.growthRate;
  });
  return totalW > 0 ? weightedSum / totalW : 0;
};

// weighted average of each CD's LONG-RUN rate (not today's entry rate)
const weightedAvgCDLongRun = (d) => {
  let totalW = 0;
  let weightedSum = 0;
  d.investments
    .filter((i) => i.type === "cd")
    .forEach((i) => {
      const lr = i.cdLongRunRate ?? Math.max(0, d.expensesState.inflation - 0.5);
      totalW += i.amount;
      weightedSum += i.amount * lr;
    });
  return totalW > 0 ? weightedSum / totalW : 0;
};

const LEVERS = [
  {
    id: "spend",
    label: "Monthly spending",
    unit: (c) => `${c}/mo`,
    getCurrent: (d) => d.expensesState.monthly,
    apply: (d, v) => ({ ...d, expensesState: { ...d.expensesState, monthly: Math.max(0, v) } }),
  },
  {
    id: "salary",
    label: "Annual salary",
    unit: (c) => `${c}/yr`,
    getCurrent: (d) => d.work.salary,
    apply: (d, v) => ({ ...d, work: { ...d.work, salary: Math.max(0, v) } }),
  },
  {
    id: "workyears",
    label: "Years still working",
    unit: () => "yrs",
    getCurrent: (d) => d.work.yearsWorking,
    apply: (d, v) => ({ ...d, work: { ...d.work, yearsWorking: Math.max(0, v) } }),
  },
  {
    id: "marketRate",
    label: "Market rate (investments & retirement)",
    unit: () => "%/yr",
    getCurrent: weightedAvgMarketRate,
    apply: (d, v) => {
      const delta = v - weightedAvgMarketRate(d);
      return {
        ...d,
        investments: d.investments.map((i) => (i.type !== "house" && i.type !== "cd" ? { ...i, growthRate: i.growthRate + delta } : i)),
        retirement: d.retirement.map((r) => ({ ...r, growthRate: r.growthRate + delta })),
      };
    },
  },
  {
    id: "cdLongRunRate",
    label: "Long-term CD rate",
    unit: () => "%/yr",
    getCurrent: weightedAvgCDLongRun,
    apply: (d, v) => {
      const delta = v - weightedAvgCDLongRun(d);
      return {
        ...d,
        investments: d.investments.map((i) =>
          i.type === "cd"
            ? { ...i, cdLongRunRate: (i.cdLongRunRate ?? Math.max(0, d.expensesState.inflation - 0.5)) + delta }
            : i
        ),
      };
    },
  },
  {
    id: "cashRate",
    label: "Cash interest rate",
    unit: () => "%/yr",
    getCurrent: (d) => d.cash.rate,
    apply: (d, v) => ({ ...d, cash: { ...d.cash, rate: Math.max(0, v) } }),
  },
  {
    id: "taxrate",
    label: "Average tax rate",
    unit: () => "%",
    getCurrent: (d) =>
      (d.profile.taxMode ?? "manual") === "manual" || !isTaxCountrySupported(resolveTaxCountry(d.profile))
        ? d.profile.taxBracket ?? 24
        : computeOrdinaryTaxRate(resolveTaxCountry(d.profile), d.work.salary),
    // dragging this lever always pins a manual override for the scenario — that's the point
    // of a What-If, even if the baseline profile is on "auto"
    apply: (d, v) => ({ ...d, profile: { ...d.profile, taxMode: "manual", taxBracket: Math.max(0, v) } }),
  },
  {
    id: "dividendTaxRate",
    label: "Dividend tax rate",
    unit: () => "%",
    getCurrent: (d) =>
      (d.profile.dividendTaxMode ?? "manual") === "manual" || !isTaxCountrySupported(resolveTaxCountry(d.profile))
        ? d.profile.dividendTaxRate ?? d.profile.taxBracket ?? 24
        : computeDividendTaxRate(resolveTaxCountry(d.profile), d.work.salary),
    apply: (d, v) => ({ ...d, profile: { ...d.profile, dividendTaxMode: "manual", dividendTaxRate: Math.max(0, v) } }),
  },
  {
    id: "capitalGainsTaxRate",
    label: "Capital gains tax rate",
    unit: () => "%",
    getCurrent: (d) =>
      (d.profile.capitalGainsTaxMode ?? "manual") === "manual" || !isTaxCountrySupported(resolveTaxCountry(d.profile))
        ? d.profile.capitalGainsTaxRate ?? d.profile.taxBracket ?? 24
        : computeCapitalGainsTaxRate(resolveTaxCountry(d.profile), d.work.salary),
    apply: (d, v) => ({ ...d, profile: { ...d.profile, capitalGainsTaxMode: "manual", capitalGainsTaxRate: Math.max(0, v) } }),
  },
  {
    id: "inflation",
    label: "Inflation",
    unit: () => "%/yr",
    getCurrent: (d) => d.expensesState.inflation,
    apply: (d, v) => ({ ...d, expensesState: { ...d.expensesState, inflation: v } }),
  },
  {
    id: "lifeexpectancy",
    label: "Life expectancy",
    unit: () => "yrs",
    getCurrent: (d) => d.profile.lifeExpectancy,
    apply: (d, v) => ({ ...d, profile: { ...d.profile, lifeExpectancy: Math.max(d.profile.currentAge + 1, v) } }),
  },
  {
    id: "extraSavings",
    label: "Extra monthly savings (épargne)",
    unit: (c) => `${c}/mo`,
    getCurrent: () => 0,
    apply: (d, v) => ({ ...d, expensesState: { ...d.expensesState, monthly: Math.max(0, d.expensesState.monthly - (v || 0)) } }),
  },
  { id: "lumpsum", label: "One-time lump sum", special: "lumpsum" },
  { id: "buyhouse", label: "Buy a new investment property", special: "buyhouse" },
  { id: "spendingDecline", label: "Spending declines with age", special: "spendingDecline" },
];

// ---------- reusable UI bits ----------
function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-medium text-stone-500 mb-1">{label}</span>
      {children}
    </label>
  );
}
// gentle, non-blocking sanity warning shown right under a field — never prevents
// entering a value, just flags a number that's likely a typo or a wildly optimistic
// assumption, so nonsense doesn't silently flow through to the results
function Warn({ children }) {
  return (
    <p className="text-[11px] leading-snug -mt-2 mb-3 flex items-start gap-1" style={{ color: "#B23A00" }}>
      <span>⚠️</span>
      <span>{children}</span>
    </p>
  );
}
const inputCls =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-shadow";

function parseLocaleNumber(str) {
  return parseFloat(String(str).trim().replace(",", "."));
}

function NumberInput({ value, onChange, suffix, accent = "#4C8DFF" }) {
  const [draft, setDraft] = useState(String(value ?? 0));

  useEffect(() => {
    if (parseLocaleNumber(draft) !== value) setDraft(String(value ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e) => {
    const v = e.target.value;
    // accept both "." and "," as the decimal separator — iPhones set to a
    // European region only offer a comma on the numeric keyboard
    if (v === "" || /^-?\d*[.,]?\d*$/.test(v)) {
      setDraft(v);
      const num = parseLocaleNumber(v);
      if (!isNaN(num)) onChange(num);
    }
  };

  const handleBlur = () => {
    const num = parseLocaleNumber(draft);
    if (draft === "" || draft === "-" || isNaN(num)) {
      setDraft("0");
      onChange(0);
    } else {
      setDraft(String(num));
      onChange(num);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className={inputCls + (suffix ? " pr-16" : "")}
        style={{ boxShadow: "none" }}
        onFocusCapture={(e) => (e.target.style.boxShadow = `0 0 0 3px ${accent}33`)}
        onBlurCapture={(e) => (e.target.style.boxShadow = "none")}
        value={draft}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={(e) => e.target.select()}
      />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-stone-400">{suffix}</span>}
    </div>
  );
}
function SelectInput({ value, onChange, options }) {
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
function TextInput({ value, onChange }) {
  return (
    <input
      type="text"
      autoComplete="off"
      className={inputCls}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
function SummaryStat({ label, value, color }) {
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-sm">
      <div className="text-xs text-stone-400">{label}</div>
      <div className="text-lg font-semibold" style={{ color: color || "#231D3B", fontFamily: "'Space Grotesk', sans-serif" }}>
        {value}
      </div>
    </div>
  );
}
function StackedChartTooltip({ active, payload, label, currency }) {
  if (!active || !payload || !payload.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="rounded-lg bg-white shadow-lg border border-stone-100 px-3 py-2 text-xs min-w-[160px]">
      <div className="font-semibold text-stone-500 mb-1.5">Age {label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-stone-600">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-medium">{fmt(p.value, currency)}</span>
        </div>
      ))}
      <div className="flex items-center justify-between gap-4 pt-1.5 mt-1 border-t border-stone-100 font-semibold">
        <span>Net worth</span>
        <span>{fmt(total, currency)}</span>
      </div>
    </div>
  );
}
function ClockBlock({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-4xl font-bold tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {value ?? "—"}
      </div>
      <div className="text-[10px] uppercase tracking-wide mt-1" style={{ color: "#C9BEEA" }}>
        {label}
      </div>
    </div>
  );
}

// the language flag — always visible at the top of the app (welcome screen, onboarding,
// and the main app header), completely independent of everything else: tapping it only
// ever changes displayed text, never currency, region, or any financial default. Shows
// only the currently selected flag; tapping opens a small dropdown with the others.
function LanguageFlag({ language, onChange, dark }) {
  const [open, setOpen] = useState(false);
  const FLAGS = { en: "🇬🇧", fr: "🇫🇷", it: "🇮🇹" };
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Change language"
        aria-label="Change language"
        className="text-xl leading-none"
      >
        {FLAGS[language] || "🏳️"}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 rounded-xl shadow-lg overflow-hidden z-30 min-w-[9rem]"
            style={{
              background: dark ? "#2A2150" : "white",
              border: `1px solid ${dark ? "rgba(255,255,255,0.15)" : "#E7E5E4"}`,
            }}
          >
            {LANGUAGES.filter((l) => l.code !== language).map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  onChange(l.code);
                  setOpen(false);
                }}
                className="flex items-center gap-2 px-3.5 py-2.5 text-sm w-full text-left"
                style={{ color: dark ? "white" : "#231D3B" }}
              >
                <span className="text-lg leading-none">{FLAGS[l.code]}</span> {l.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function WizardInput({ value, onChange, suffix }) {
  const [draft, setDraft] = useState(String(value ?? 0));
  useEffect(() => {
    if (parseLocaleNumber(draft) !== value) setDraft(String(value ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <div>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className="w-full text-center text-3xl font-bold rounded-2xl border-2 border-stone-200 focus:border-[#4C8DFF] focus:outline-none px-4 py-5"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        value={draft}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "" || /^-?\d*[.,]?\d*$/.test(v)) {
            setDraft(v);
            const n = parseLocaleNumber(v);
            if (!isNaN(n)) onChange(n);
          }
        }}
        onBlur={() => {
          const n = parseLocaleNumber(draft);
          if (draft === "" || isNaN(n)) {
            setDraft("0");
            onChange(0);
          } else {
            setDraft(String(n));
          }
        }}
        onFocus={(e) => e.target.select()}
      />
      {suffix && <div className="text-center text-xs text-stone-400 mt-2">{suffix}</div>}
    </div>
  );
}

// ---------- onboarding wizard: question list, branching on yes/no answers ----------
function getWizardSteps(a) {
  const rd = REGION_DEFAULTS[a.region] || REGION_DEFAULTS.EU;
  const mainCcySymbol = currencySymbol(rd.currency);
  const salaryCcy = a.multiCurrency ? a.salaryCurrency || rd.currency : rd.currency;
  const salaryCcySymbol = currencySymbol(salaryCcy);
  const cashCcy = a.multiCurrency ? a.cashCurrency || rd.currency : rd.currency;
  const cashCcySymbol = currencySymbol(cashCcy);
  const steps = [
    {
      id: "region",
      type: "region",
      question: "Where do you live?",
      note: "We've guessed this from your device — tap to confirm, or pick a different one if we got it wrong.",
    },
  ];
  if (a.region === "EU") {
    steps.push({ id: "taxCountry", type: "taxcountry", question: "Which country, for tax purposes?", options: EU_TAX_COUNTRY_OPTIONS });
  } else if (a.region === "US") {
    steps.push({ id: "taxCountry", type: "taxcountry", question: "Which US state, for tax purposes?", options: US_TAX_COUNTRY_OPTIONS });
  }
  steps.push(
    { id: "currentAge", type: "number", question: "First up — how old are you today?", suffix: "years old" },
    { id: "multiCurrency", type: "yesno", question: "Do you hold money in more than one currency?" }
  );
  if (a.multiCurrency) {
    steps.push({
      id: "salaryCurrency",
      type: "currency",
      question: "What currency is your salary paid in?",
      note: `Your main currency (for showing results) is ${rd.currency}. If your salary comes in something else, we'll convert it every time you use it.`,
    });
  }
  steps.push(
    {
      id: "customRates",
      type: "yesno",
      question: "Do you want to set your own growth, inflation, and tax rates?",
      note: "If you'd rather not, we'll use deliberately cautious defaults for where you live — not the rosy historical average, but roughly a 25th-percentile decade (i.e. assuming markets do somewhat worse than usual). Your tax rate will also be worked out automatically from your country's tax brackets and your actual income each year, instead of one flat guessed number.",
    },
    { id: "salary", type: "number", question: "What's your annual salary, before tax?", suffix: `${salaryCcySymbol} / year` }
  );
  if (a.customRates) {
    steps.push({ id: "salaryGrowth", type: "number", question: "How much do you expect your salary to grow, per year?", suffix: "%/yr" });
  }
  steps.push({ id: "yearsWorking", type: "number", question: "How many more years do you plan to work?", suffix: "years" });
  steps.push({ id: "monthlyExpenses", type: "number", question: "What do you spend per month — not including any mortgage?", suffix: `${mainCcySymbol} / month` });
  const taxCountryUnsupported = a.region === "EU" && a.taxCountry === UNSUPPORTED_TAX_COUNTRY;
  if (a.customRates) {
    steps.push({ id: "inflation", type: "number", question: "What inflation rate should we assume?", suffix: "%/yr" });
    steps.push({ id: "taxBracket", type: "number", question: "What's your average tax rate — the share of income you actually pay overall?", suffix: "%" });
    steps.push({ id: "dividendTaxRate", type: "number", question: "And your tax rate specifically on dividend income, if different?", suffix: "%" });
    steps.push({ id: "capitalGainsTaxRate", type: "number", question: "And your tax rate on capital gains — selling an investment or a house?", suffix: "%" });
  } else if (taxCountryUnsupported) {
    // no bracket table exists for "another EU country" — ask once for a flat number
    // instead of silently guessing, since it can't be worked out automatically
    steps.push({
      id: "taxBracket",
      type: "number",
      question: "What's your average tax rate — the share of income you actually pay overall?",
      suffix: "%",
      note: "We don't have exact tax brackets for your country yet, so this won't automatically adjust as your income changes each year the way it does for supported countries — it'll just stay fixed at whatever you enter. Edit it any time on the Profile tab.",
    });
    steps.push({ id: "dividendTaxRate", type: "number", question: "And your tax rate specifically on dividend income, if different?", suffix: "%" });
    steps.push({ id: "capitalGainsTaxRate", type: "number", question: "And your tax rate on capital gains — selling an investment or a house?", suffix: "%" });
  }
  steps.push({ id: "cash", type: "number", question: "How much cash do you have in the bank (not invested)?", suffix: cashCcySymbol });
  if (a.customRates) {
    steps.push({ id: "cashRate", type: "number", question: "What interest rate does your cash earn?", suffix: "%/yr" });
  }
  steps.push({ id: "hasInvestments", type: "yesno", question: "Do you have any investments or trading accounts — stocks, index funds, ETFs?" });
  if (a.hasInvestments) {
    steps.push({ id: "investmentsList", type: "investlist", question: "Tell us about your investments" });
  }
  steps.push({ id: "ownsHome", type: "yesno", question: "Do you own any property — your home, or a rental?" });
  if (a.ownsHome) {
    steps.push({ id: "housesList", type: "houselist", question: "Tell us about your property" });
  }
  steps.push({ id: "hasRetirementAccount", type: "yesno", question: "Do you have a retirement account — 401(k), IRA, or similar?" });
  if (a.hasRetirementAccount) {
    steps.push({ id: "retirementList", type: "retirelist", question: "Tell us about your retirement accounts" });
  }
  steps.push({ id: "hasPension", type: "yesno", question: "Will you get a state or employer pension?" });
  if (a.hasPension) {
    steps.push({ id: "pensionDetails", type: "pension", question: "Tell us about your pension" });
  }
  steps.push({ id: "summary", type: "summary", question: "Review what we've got" });
  return steps;
}

const WIZARD_DEFAULTS = {
  region: "EU",
  taxCountry: null,
  currentAge: 30,
  multiCurrency: null,
  customRates: null,
  salary: 60000,
  salaryGrowth: 2,
  yearsWorking: 30,
  monthlyExpenses: 3000,
  inflation: REGION_DEFAULTS.EU.inflation,
  taxBracket: 24,
  dividendTaxRate: 24,
  capitalGainsTaxRate: 24,
  cash: 5000,
  cashCurrency: "EUR",
  cashRate: REGION_DEFAULTS.EU.cashRate,
  hasInvestments: null,
  investmentsList: [{ id: uid(), name: "Investments", amount: 10000, contribution: 300, growthRate: 6, currency: "EUR" }],
  ownsHome: null,
  housesList: [
    {
      id: uid(),
      name: "Primary home",
      usage: "primary",
      value: 300000,
      mortgageBalance: 150000,
      mortgagePayment: 1200,
      mortgageInputMode: "rate",
      mortgageRate: 4.5,
      mortgageYearsLeft: 20,
      rent: 0,
      growthRate: 3,
      currency: "EUR",
      sellable: false,
      postSaleAction: "rent",
      rebuyValue: 0,
      resizeFactor: 1,
      postSaleRent: 0,
      sellingFeePercent: 4,
    },
  ],
  hasRetirementAccount: null,
  retirementList: [
    { id: uid(), name: "Retirement account", balance: 20000, contribution: 0, growthRate: 6, minAge: 60, taxTreatment: "pretax", currency: "EUR" },
  ],
  hasPension: null,
  pensionStartAge: 67,
  pensionPercent: 40,
  pensionIndexed: true,
  salaryCurrency: null,
};

// used as the initial wizard state — starts from WIZARD_DEFAULTS but pre-fills the
// region (and, where possible, the specific tax country) from a client-side-only guess
// at where the person is, so the very first question already has a sensible answer
// selected for them to confirm or change, rather than always starting on "Eurozone."
function detectWizardDefaults() {
  const { region, taxCountry } = guessLocationDefaults();
  const rd = REGION_DEFAULTS[region] || REGION_DEFAULTS.EU;
  return {
    ...WIZARD_DEFAULTS,
    region,
    taxCountry: taxCountry ?? (region === "EU" ? null : region === "US" ? "US_OTHER" : undefined),
    inflation: rd.inflation,
    cashRate: rd.cashRate,
    cashCurrency: rd.currency,
    salaryCurrency: rd.currency,
    investmentsList: WIZARD_DEFAULTS.investmentsList.map((i) => ({ ...i, currency: rd.currency })),
    housesList: WIZARD_DEFAULTS.housesList.map((h) => ({ ...h, currency: rd.currency })),
    retirementList: WIZARD_DEFAULTS.retirementList.map((x) => ({ ...x, currency: rd.currency })),
  };
}

const defaultIndexFundId = uid();
const defaultHouseId = uid();
const defaultRetirementId = uid();

const DEFAULTS = {
  profile: {
    currentAge: 35,
    lifeExpectancy: 90,
    region: "EU",
    taxCountry: "DE",
    currency: "EUR",
    multiCurrency: false,
    taxMode: "auto",
    taxBracket: Math.round(computeOrdinaryTaxRate("DE", 90000)),
    dividendTaxMode: "auto",
    dividendTaxRate: Math.round(computeDividendTaxRate("DE", 90000)),
    capitalGainsTaxMode: "auto",
    capitalGainsTaxRate: Math.round(computeCapitalGainsTaxRate("DE", 90000)),
  },
  work: { salary: 90000, currency: "EUR", yearsWorking: 30, salaryGrowth: 2 },
  expensesState: { monthly: 4000, inflation: 2.5, spendingDecline: { enabled: false } },
  cash: { amount: 20000, rate: 2, currency: "EUR" },
  investments: [
    {
      id: defaultIndexFundId,
      name: "Index Fund",
      type: "market",
      region: "EU",
      currency: "EUR",
      amount: 100000,
      costBasis: 80000,
      growthRate: 6,
      contribution: 500,
      contributionFrequency: "monthly",
    },
    {
      id: defaultHouseId,
      name: "Primary Home",
      type: "house",
      region: "EU",
      currency: "EUR",
      amount: 400000,
      growthRate: 3,
      usage: "primary",
      sellable: false,
      postSaleAction: "rent",
      purchasePrice: 300000,
      mortgageBalance: 220000,
      mortgagePayment: 1800,
      mortgageRateType: "fixed",
      mortgageInputMode: "rate",
      mortgageRate: 4.5,
      rent: 0,
      sellingFeePercent: 4,
    },
  ],
  retirement: [
    {
      id: defaultRetirementId,
      name: "Retirement account",
      currency: "EUR",
      amount: 150000,
      growthRate: 6,
      contribution: 0,
      minAge: 60,
      taxTreatment: "pretax",
      earlyAccessAllowed: false,
      earlyPenalty: 10,
    },
  ],
  withdrawalOrder: ["cash", `investment:${defaultIndexFundId}`, `retirement:${defaultRetirementId}`],
  pension: {
    enabled: true,
    startAge: 67,
    percentOfSalary: 40,
    indexed: true,
    proRata: true,
    careerStartAge: 25,
    fullPensionAge: 65,
  },
  lumpSums: [],
  savingsRule: { cashPercent: 50, minCash: 10000, maxCash: 500000, targetInvestmentId: defaultIndexFundId },
};

function freshDefaults() {
  return JSON.parse(JSON.stringify(DEFAULTS));
}

export default function RetirementCalculator() {
  const [tab, setTab] = useState("home");
  const [activeSection, setActiveSection] = useState("profile");
  const [loaded, setLoaded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStarted, setOnboardingStarted] = useState(false);
  const [wizardStepIndex, setWizardStepIndex] = useState(0);
  const [wizardAnswers, setWizardAnswers] = useState(() => detectWizardDefaults());
  const [toast, setToast] = useState("");
  const [bigCelebration, setBigCelebration] = useState(null);

  // language is completely independent of currency/region/profile data — a pure display
  // preference, changeable any time from the flag at the top of the app, never touched by
  // onboarding or by anything financial. Always starts on English regardless of the
  // device's own language setting — people switch it themselves if they want to; it's
  // loaded/saved to its own separate storage key so a manual choice persists.
  const [language, setLanguage] = useState("en");
  useEffect(() => {
    (async () => {
      try {
        const saved = await window.storage.get(LANGUAGE_KEY, false);
        if (saved && saved.value && STRINGS[saved.value]) setLanguage(saved.value);
      } catch (e) {}
    })();
  }, []);
  const setLanguagePersisted = (code) => {
    setLanguage(code);
    window.storage.set(LANGUAGE_KEY, code, false).catch(() => {});
  };
  // tr(key, fallback): looks up the current language's string, falls back to English,
  // then to whatever English text is already hardcoded at the call site — so any spot
  // not yet wired into STRINGS just keeps showing its original English text unchanged.
  // Used everywhere text is shown, including onboarding — one flag, one lookup, no
  // separate "wizard language" to keep in sync with anything.
  const tr = (key, fallback) => STRINGS[language]?.[key] ?? STRINGS.en[key] ?? fallback ?? key;

  const [profile, setProfile] = useState(DEFAULTS.profile);
  const [work, setWork] = useState(DEFAULTS.work);
  const [expensesState, setExpensesState] = useState(DEFAULTS.expensesState);
  const [cash, setCash] = useState(DEFAULTS.cash);
  const [investments, setInvestments] = useState(DEFAULTS.investments);
  const [retirement, setRetirement] = useState(DEFAULTS.retirement);
  const [withdrawalOrder, setWithdrawalOrder] = useState(DEFAULTS.withdrawalOrder);
  const [pension, setPension] = useState(DEFAULTS.pension);
  const [lumpSums, setLumpSums] = useState(DEFAULTS.lumpSums);
  const [savingsRule, setSavingsRule] = useState(DEFAULTS.savingsRule);
  const [whatIfChanges, setWhatIfChanges] = useState([]);
  const [selectedAge, setSelectedAge] = useState(null);
  const [showNetWorthBreakdown, setShowNetWorthBreakdown] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [mortgageScheduleModalId, setMortgageScheduleModalId] = useState(null); // house id, or null when closed
  const [showMath, setShowMath] = useState(false);
  const [expandedAdvanced, setExpandedAdvanced] = useState({}); // per house-card id: is the "Advanced" section open?
  const [realTermsView, setRealTermsView] = useState(false); // Results chart: nominal (future $) vs today's money
  const [fxRates, setFxRates] = useState(FX_FALLBACK);
  const [fxSource, setFxSource] = useState("fallback"); // "live" | "fallback" | "loading"

  const fetchFxRates = () => {
    setFxSource("loading");
    fetch(`https://api.frankfurter.app/latest?from=USD&to=${SUPPORTED_CURRENCIES.filter((c) => c !== "USD").join(",")}`)
      .then((res) => {
        if (!res.ok) throw new Error("bad response");
        return res.json();
      })
      .then((data) => {
        // frankfurter returns "units of X per 1 USD" — invert to "USD per 1 unit of X"
        const next = { USD: 1 };
        Object.entries(data.rates || {}).forEach(([ccy, perUsd]) => {
          if (perUsd) next[ccy] = 1 / perUsd;
        });
        setFxRates((prev) => ({ ...prev, ...next }));
        setFxSource("live");
      })
      .catch(() => setFxSource("fallback"));
  };
  useEffect(() => {
    fetchFxRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyAll = (data) => {
    if (!data) return;
    if (data.profile) setProfile(data.profile);
    if (data.work) setWork(data.work);
    if (data.expensesState) setExpensesState(data.expensesState);
    if (data.cash) setCash(data.cash);
    if (data.investments) setInvestments(data.investments);
    if (data.retirement) setRetirement(data.retirement);
    if (data.withdrawalOrder) setWithdrawalOrder(data.withdrawalOrder);
    if (data.pension) setPension(data.pension);
    if (data.lumpSums) setLumpSums(data.lumpSums);
    if (data.savingsRule) setSavingsRule(data.savingsRule);
  };
  const collectAll = () => ({
    profile,
    work,
    expensesState,
    cash,
    investments,
    retirement,
    withdrawalOrder,
    pension,
    lumpSums,
    savingsRule,
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  useEffect(() => {
    (async () => {
      // the app auto-saves continuously (see the debounced effect below) — there's no
      // separate explicit "save" step, so this just loads whatever was last saved. The
      // one-time fallback to PROFILE_KEY is only for people who used the app before this
      // was simplified, when an explicit "Save as profile" existed as a separate concept.
      let sessionData = null;
      try {
        const s = await window.storage.get(SESSION_KEY, false);
        if (s && s.value) sessionData = JSON.parse(s.value);
      } catch (e) {}

      if (sessionData) {
        applyAll(sessionData);
        setLoaded(true);
        return;
      }
      let profileData = null;
      try {
        const p = await window.storage.get(PROFILE_KEY, false);
        if (p && p.value) profileData = JSON.parse(p.value);
      } catch (e) {}
      if (profileData) {
        applyAll(profileData);
        setLoaded(true);
      } else {
        setShowOnboarding(true);
        setLoaded(true);
      }
    })();
  }, []);

  // seed the first What-If row with the current baseline value once we know it
  useEffect(() => {
    if (loaded && whatIfChanges.length === 0) {
      const lever = LEVERS[0];
      const baseline = { profile, work, expensesState, cash, investments, retirement, withdrawalOrder, pension };
      setWhatIfChanges([{ id: uid(), leverId: lever.id, value: round2(lever.getCurrent(baseline)) }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // the profile is saved automatically, continuously — there's no separate "Save"
  // step to remember to click. This is the ONLY persistence path going forward.
  const saveTimer = useRef(null);
  // what the Forecast tab last showed (FI days + net worth) — compared against on the
  // NEXT visit to Forecast to decide whether to celebrate or commiserate. Deliberately
  // not tied to any explicit "save": editing happens on Profile, the payoff/feedback
  // moment happens here, passively, just by looking at your numbers again.
  const forecastSnapshot = useRef(null);
  useEffect(() => {
    if (!loaded || showOnboarding) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      window.storage.set(SESSION_KEY, JSON.stringify(collectAll()), false).catch(() => {});
    }, 400);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, work, expensesState, cash, investments, retirement, withdrawalOrder, pension, lumpSums, savingsRule, loaded, showOnboarding]);

  const relaunchOnboarding = () => {
    applyAll(freshDefaults());
    setWhatIfChanges([]);
    setSelectedAge(null);
    setWizardAnswers(detectWizardDefaults());
    setWizardStepIndex(0);
    setOnboardingStarted(false);
    setShowOnboarding(true);
    // a fresh profile shouldn't get compared against the old one's numbers the first
    // time Forecast is viewed again
    forecastSnapshot.current = null;
  };
  // the only explicit action left: wipe everything and go through onboarding again.
  // Regular edits are never "lost" — they're already saved automatically as you make them.
  const resetProfile = () => {
    relaunchOnboarding();
  };

  const wizardAddItem = (listKey, template) =>
    setWizardAnswers((a) => ({ ...a, [listKey]: [...a[listKey], { id: uid(), ...template }] }));
  const wizardUpdateItem = (listKey, id, patch) =>
    setWizardAnswers((a) => ({ ...a, [listKey]: a[listKey].map((it) => (it.id === id ? { ...it, ...patch } : it)) }));
  const wizardRemoveItem = (listKey, id) =>
    setWizardAnswers((a) => ({ ...a, [listKey]: a[listKey].filter((it) => it.id !== id) }));
  const wizardUpdateMortgage = (item, patch) => {
    const merged = { ...item, ...patch };
    if ((merged.mortgageInputMode || "rate") === "years") {
      const solved = solveMortgageRate(merged.mortgageBalance || 0, merged.mortgagePayment || 0, merged.mortgageYearsLeft || 0);
      if (solved != null) merged.mortgageRate = solved;
    }
    wizardUpdateItem("housesList", item.id, merged);
  };

  const finishOnboarding = (a) => {
    const region = a.region || "EU";
    const rd = REGION_DEFAULTS[region] || REGION_DEFAULTS.EU;
    const mainCcy = rd.currency;
    const taxCountry = region === "EU" ? a.taxCountry || "DE" : region === "US" ? a.taxCountry || "US_OTHER" : undefined;
    const resolvedTC = taxCountry || resolveTaxCountry({ region });
    const taxCountrySupported = isTaxCountrySupported(resolvedTC);
    const seedOrdinary = taxCountrySupported
      ? computeOrdinaryTaxRate(resolvedTC, a.salary || 0)
      : estimateUnsupportedEURate(a.salary || 0, "ordinary");
    const seedDividend = taxCountrySupported
      ? computeDividendTaxRate(resolvedTC, a.salary || 0)
      : estimateUnsupportedEURate(a.salary || 0, "dividend");
    const seedCapitalGains = taxCountrySupported
      ? computeCapitalGainsTaxRate(resolvedTC, a.salary || 0)
      : estimateUnsupportedEURate(a.salary || 0, "capitalGains");
    setProfile({
      currentAge: a.currentAge,
      lifeExpectancy: 95,
      region,
      taxCountry,
      currency: mainCcy,
      multiCurrency: !!a.multiCurrency,
      taxMode: a.customRates || !taxCountrySupported ? "manual" : "auto",
      taxBracket: a.customRates || !taxCountrySupported ? a.taxBracket ?? Math.round(seedOrdinary) : Math.round(seedOrdinary),
      dividendTaxMode: a.customRates || !taxCountrySupported ? "manual" : "auto",
      dividendTaxRate:
        a.customRates || !taxCountrySupported
          ? a.dividendTaxRate ?? a.taxBracket ?? Math.round(seedDividend)
          : Math.round(seedDividend),
      capitalGainsTaxMode: a.customRates || !taxCountrySupported ? "manual" : "auto",
      capitalGainsTaxRate:
        a.customRates || !taxCountrySupported
          ? a.capitalGainsTaxRate ?? a.taxBracket ?? Math.round(seedCapitalGains)
          : Math.round(seedCapitalGains),
    });
    setWork({
      salary: a.salary,
      currency: a.multiCurrency ? a.salaryCurrency || mainCcy : mainCcy,
      yearsWorking: a.yearsWorking,
      salaryGrowth: a.customRates ? a.salaryGrowth ?? 2 : 2,
    });
    setExpensesState({ monthly: a.monthlyExpenses, inflation: a.customRates ? a.inflation ?? rd.inflation : rd.inflation });
    setCash({
      amount: a.cash,
      rate: a.customRates ? a.cashRate ?? rd.cashRate : rd.cashRate,
      currency: a.multiCurrency ? a.cashCurrency || mainCcy : mainCcy,
    });

    const newInvestments = [];
    const newOrder = ["cash"];

    if (a.hasInvestments) {
      a.investmentsList.forEach((item) => {
        newInvestments.push({
          id: item.id,
          name: item.name || "Investment",
          type: "market",
          region,
          currency: a.multiCurrency ? item.currency || mainCcy : mainCcy,
          amount: item.amount || 0,
          growthRate: item.growthRate ?? rd.marketReturn,
          contribution: item.contribution || 0,
          contributionFrequency: "monthly",
        });
        newOrder.push(`investment:${item.id}`);
      });
    }
    if (a.ownsHome) {
      a.housesList.forEach((item) => {
        const isPrimary = (item.usage || "primary") !== "rental";
        const sellable = item.sellable !== undefined ? item.sellable : !isPrimary;
        newInvestments.push({
          id: item.id,
          name: item.name || (isPrimary ? "Primary Home" : "Property"),
          type: "house",
          region,
          currency: a.multiCurrency ? item.currency || mainCcy : mainCcy,
          amount: item.value || 0,
          growthRate: item.growthRate ?? 3,
          usage: isPrimary ? "primary" : "rental",
          sellable,
          postSaleAction: sellable ? item.postSaleAction || "none" : "none",
          rebuyValue: item.rebuyValue || 0,
          resizeFactor: item.resizeFactor ?? 1,
          postSaleRent: item.postSaleRent || 0,
          sellingFeePercent: item.sellingFeePercent ?? 4,
          purchasePrice: Math.round((item.value || 0) * 0.7),
          mortgageBalance: item.mortgageBalance || 0,
          mortgagePayment: item.mortgagePayment || 0,
          mortgageRateType: "fixed",
          mortgageInputMode: item.mortgageInputMode || "rate",
          mortgageRate: item.mortgageRate ?? 4.5,
          mortgageYearsLeft: item.mortgageYearsLeft || 20,
          rent: isPrimary ? 0 : item.rent || 0,
        });
        if (sellable) newOrder.push(`house:${item.id}`);
      });
    }
    setInvestments(newInvestments);

    const newRetirement = [];
    if (a.hasRetirementAccount) {
      a.retirementList.forEach((item) => {
        newRetirement.push({
          id: item.id,
          name: item.name || "Retirement account",
          currency: a.multiCurrency ? item.currency || mainCcy : mainCcy,
          amount: item.balance || 0,
          growthRate: item.growthRate ?? rd.marketReturn,
          contribution: item.contribution || 0,
          minAge: item.minAge ?? 60,
          taxTreatment: item.taxTreatment || "pretax",
          earlyAccessAllowed: false,
          earlyPenalty: 10,
        });
        newOrder.push(`retirement:${item.id}`);
      });
    }
    setRetirement(newRetirement);

    setPension({
      enabled: !!a.hasPension,
      startAge: a.pensionStartAge,
      percentOfSalary: a.pensionPercent,
      indexed: a.pensionIndexed !== false,
    });
    setWithdrawalOrder(newOrder);
    setLumpSums([]);

    setShowOnboarding(false);
    setOnboardingStarted(false);
    setTab("results");
  };

  const currency = profile.currency || "EUR";

  // convert every money bucket into the base currency for simulation & totals —
  // the raw state (native currency, as typed) stays untouched for editing
  const convertedCash = useMemo(
    () => ({ ...cash, amount: convertCurrency(cash.amount, cash.currency || currency, currency, fxRates) }),
    [cash, currency, fxRates]
  );
  const convertedInvestments = useMemo(
    () =>
      investments.map((inv) => {
        const c = inv.currency || currency;
        if (c === currency) return inv;
        return {
          ...inv,
          amount: convertCurrency(inv.amount, c, currency, fxRates),
          contribution: convertCurrency(inv.contribution, c, currency, fxRates),
          mortgageBalance: convertCurrency(inv.mortgageBalance, c, currency, fxRates),
          mortgagePayment: convertCurrency(inv.mortgagePayment, c, currency, fxRates),
          purchasePrice: convertCurrency(inv.purchasePrice, c, currency, fxRates),
          rent: convertCurrency(inv.rent, c, currency, fxRates),
          rebuyValue: convertCurrency(inv.rebuyValue, c, currency, fxRates),
          postSaleRent: convertCurrency(inv.postSaleRent, c, currency, fxRates),
        };
      }),
    [investments, currency, fxRates]
  );
  const convertedRetirement = useMemo(
    () =>
      retirement.map((r) => {
        const c = r.currency || currency;
        if (c === currency) return r;
        return { ...r, amount: convertCurrency(r.amount, c, currency, fxRates), contribution: convertCurrency(r.contribution, c, currency, fxRates) };
      }),
    [retirement, currency, fxRates]
  );
  // salary can be paid in a different currency than the one everything else is shown
  // in (e.g. a US salary while retiring somewhere in the Eurozone) — converted the same
  // way as every other money bucket above, right at the simulation boundary
  const convertedWork = useMemo(() => {
    const c = work.currency || currency;
    if (c === currency) return work;
    return { ...work, salary: convertCurrency(work.salary, c, currency, fxRates) };
  }, [work, currency, fxRates]);

  const effectiveSavingsRule = useMemo(() => {
    const validTarget = convertedInvestments.find((i) => i.id === savingsRule.targetInvestmentId && i.type !== "house");
    if (validTarget) return savingsRule;
    const fallback = convertedInvestments.find((i) => i.type !== "house");
    return { ...savingsRule, targetInvestmentId: fallback ? fallback.id : null };
  }, [savingsRule, convertedInvestments]);

  const { years, ranOutAge } = useMemo(
    () =>
      runSimulation({
        profile,
        work: convertedWork,
        expensesState,
        cash: convertedCash,
        investments: convertedInvestments,
        retirement: convertedRetirement,
        withdrawalOrder,
        pension,
        lumpSums,
        savingsRule: effectiveSavingsRule,
      }),
    [profile, convertedWork, expensesState, convertedCash, convertedInvestments, convertedRetirement, withdrawalOrder, pension, lumpSums, effectiveSavingsRule]
  );

  const { fiAge } = useMemo(
    () =>
      computeFI({
        profile,
        work: convertedWork,
        expensesState,
        cash: convertedCash,
        investments: convertedInvestments,
        retirement: convertedRetirement,
        withdrawalOrder,
        pension,
        lumpSums,
        savingsRule: effectiveSavingsRule,
      }),
    [profile, convertedWork, expensesState, convertedCash, convertedInvestments, convertedRetirement, withdrawalOrder, pension, lumpSums, effectiveSavingsRule]
  );

  const yearsToFI = fiAge != null ? fiAge - profile.currentAge : null;
  const daysUntilFI = yearsToFI != null ? Math.max(0, Math.round(yearsToFI * 365.25)) : null;

  let fiY = null,
    fiM = null,
    fiD = null;
  if (yearsToFI != null) {
    const totalDays = Math.max(0, yearsToFI) * 365.25;
    fiY = Math.floor(totalDays / 365.25);
    let remDays = totalDays - fiY * 365.25;
    fiM = Math.floor(remDays / 30.4375);
    fiD = Math.round(remDays - fiM * 30.4375);
    if (fiD >= 31) {
      fiD -= 31;
      fiM += 1;
    }
    if (fiM >= 12) {
      fiM -= 12;
      fiY += 1;
    }
  }

  const whatIfInputs = useMemo(() => {
    let draft = {
      profile,
      work: convertedWork,
      expensesState,
      cash: convertedCash,
      investments: convertedInvestments,
      retirement: convertedRetirement,
      withdrawalOrder,
      pension,
      lumpSums,
      savingsRule: effectiveSavingsRule,
    };
    whatIfChanges.forEach((change) => {
      if (change.leverId === "lumpsum") {
        const signedAmount = (change.amountType === "pay" ? -1 : 1) * Math.abs(change.amountMagnitude || 0);
        draft = {
          ...draft,
          lumpSums: [
            ...draft.lumpSums,
            { id: `whatif-${change.id}`, name: change.name || "Lump sum", age: change.age ?? profile.currentAge, amount: signedAmount },
          ],
        };
        return;
      }
      if (change.leverId === "buyhouse") {
        const value = change.value || 0;
        const deposit = Math.min(change.deposit || 0, value);
        const balance = Math.max(0, value - deposit);
        const payment = computeMortgagePayment(balance, change.mortgageRate || 0, change.loanTermYears || 25);
        const newHouseId = `whatif-house-${change.id}`;
        let nextInvestments = [
          ...draft.investments,
          {
            id: newHouseId,
            name: change.name || "New property",
            type: "house",
            region: profile.region,
            currency: currency,
            amount: value,
            growthRate: 3,
            usage: "rental",
            sellable: true,
            postSaleAction: "none",
            sellingFeePercent: 4,
            purchasePrice: value,
            mortgageBalance: balance,
            mortgagePayment: payment,
            mortgageRateType: "fixed",
            mortgageInputMode: "rate",
            mortgageRate: change.mortgageRate || 0,
            rent: change.rent || 0,
          },
        ];
        let nextCash = draft.cash;
        if ((change.fundingSource || "cash") === "cash") {
          nextCash = { ...draft.cash, amount: Math.max(0, draft.cash.amount - deposit) };
        } else {
          nextInvestments = nextInvestments.map((inv) =>
            inv.id === change.fundingSource ? { ...inv, amount: Math.max(0, inv.amount - deposit) } : inv
          );
        }
        draft = {
          ...draft,
          cash: nextCash,
          investments: nextInvestments,
          withdrawalOrder: [...draft.withdrawalOrder, `house:${newHouseId}`],
        };
        return;
      }
      if (change.leverId === "spendingDecline") {
        draft = { ...draft, expensesState: { ...draft.expensesState, spendingDecline: { enabled: !!change.enabled } } };
        return;
      }
      const lever = LEVERS.find((l) => l.id === change.leverId);
      if (lever) draft = lever.apply(draft, change.value ?? lever.getCurrent(draft));
    });
    return draft;
  }, [profile, convertedWork, expensesState, convertedCash, convertedInvestments, convertedRetirement, withdrawalOrder, pension, lumpSums, effectiveSavingsRule, whatIfChanges, currency]);

  const { fiAge: altFiAge } = useMemo(() => computeFI(whatIfInputs), [whatIfInputs]);
  const { years: altYears, ranOutAge: altRanOutAge } = useMemo(() => runSimulation(whatIfInputs), [whatIfInputs]);

  const altYearsToFI = altFiAge != null ? altFiAge - profile.currentAge : null;
  const altDaysUntilFI = altYearsToFI != null ? Math.max(0, Math.round(altYearsToFI * 365.25)) : null;
  const fiDeltaDays = daysUntilFI != null && altDaysUntilFI != null ? altDaysUntilFI - daysUntilFI : null;
  const altFinalYear = altYears[altYears.length - 1];

  const baselineDraft = {
    profile,
    work,
    expensesState,
    cash: convertedCash,
    investments: convertedInvestments,
    retirement: convertedRetirement,
    withdrawalOrder,
    pension,
    lumpSums,
    savingsRule: effectiveSavingsRule,
  };
  const newLumpSumRow = (id) => ({
    id,
    leverId: "lumpsum",
    name: "Lump sum",
    age: profile.currentAge + 5,
    amountType: "receive",
    amountMagnitude: 10000,
  });
  const newBuyHouseRow = (id) => ({
    id,
    leverId: "buyhouse",
    name: "New property",
    value: 250000,
    deposit: 50000,
    fundingSource: "cash",
    mortgageRate: 4.5,
    loanTermYears: 25,
    rent: 1200,
  });
  const newSpendingDeclineRow = (id) => ({
    id,
    leverId: "spendingDecline",
    enabled: !expensesState.spendingDecline?.enabled,
  });
  const addWhatIfChange = () => {
    const used = whatIfChanges.map((c) => c.leverId);
    const next = LEVERS.find((l) => !used.includes(l.id)) || LEVERS[0];
    if (next.special === "lumpsum") {
      setWhatIfChanges((prev) => [...prev, newLumpSumRow(uid())]);
    } else if (next.special === "buyhouse") {
      setWhatIfChanges((prev) => [...prev, newBuyHouseRow(uid())]);
    } else if (next.special === "spendingDecline") {
      setWhatIfChanges((prev) => [...prev, newSpendingDeclineRow(uid())]);
    } else {
      setWhatIfChanges((prev) => [...prev, { id: uid(), leverId: next.id, value: round2(next.getCurrent(baselineDraft)) }]);
    }
  };
  const removeWhatIfChange = (id) => setWhatIfChanges((prev) => prev.filter((c) => c.id !== id));
  const updateWhatIfChange = (id, patch) =>
    setWhatIfChanges((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (patch.leverId) {
          const lever = LEVERS.find((l) => l.id === patch.leverId);
          if (lever && lever.special === "lumpsum") return newLumpSumRow(c.id);
          if (lever && lever.special === "buyhouse") return newBuyHouseRow(c.id);
          if (lever && lever.special === "spendingDecline") return newSpendingDeclineRow(c.id);
          if (lever) return { id: c.id, leverId: lever.id, value: round2(lever.getCurrent(baselineDraft)) };
        }
        return { ...c, ...patch };
      })
    );

  const investedWealth =
    convertedCash.amount +
    convertedInvestments.filter((i) => i.type !== "house").reduce((s, i) => s + i.amount, 0) +
    convertedRetirement.reduce((s, r) => s + r.amount, 0);
  const annualSpending = expensesState.monthly * 12;

  const realReturn = useMemo(() => {
    const nominal = weightedAvgGrowth({ cash: convertedCash, investments: convertedInvestments, retirement: convertedRetirement });
    return nominal - expensesState.inflation;
  }, [convertedCash, convertedInvestments, convertedRetirement, expensesState.inflation]);

  const monthlySavings = useMemo(() => {
    let total = 0;
    convertedInvestments
      .filter((i) => i.type !== "house")
      .forEach((i) => {
        const freqMult = i.contributionFrequency === "yearly" ? 1 : 12;
        total += (i.contribution || 0) * freqMult;
      });
    convertedRetirement.forEach((r) => (total += r.contribution || 0));
    return total / 12;
  }, [convertedInvestments, convertedRetirement]);

  const seriesKeys = useMemo(() => {
    const invNames = withDisplayNames(investments, "Investment").map((i) => i.displayName);
    const retNames = withDisplayNames(retirement, "Account").map((r) => r.displayName);
    const hasMortgageDebt = investments.some((i) => i.type === "house" && (i.mortgageBalance || 0) > 0);
    // "Debt" is always appended LAST so it never shifts the palette color assigned to
    // any actual asset bucket — it gets a fixed red color of its own (see colorForSeries)
    return hasMortgageDebt ? ["Cash", ...invNames, ...retNames, "Debt"] : ["Cash", ...invNames, ...retNames];
  }, [investments, retirement]);
  const colorForSeries = (key, idx) => (key === "Debt" ? "#FF6B5B" : PALETTE[idx % PALETTE.length]);

  const xTicks = useMemo(() => {
    if (!years.length) return [];
    const first = years[0].age;
    const last = years[years.length - 1].age;
    const span = last - first;
    const step = span <= 10 ? 1 : Math.ceil(span / 8 / 5) * 5;
    const ticks = [];
    for (let a = first; a < last; a += step) ticks.push(a);
    ticks.push(last);
    return ticks;
  }, [years]);

  // position of the "you could stop working" marker along the runway bar, as a %
  const fiPct =
    fiAge != null && profile.lifeExpectancy > profile.currentAge
      ? Math.max(0, Math.min(100, ((fiAge - profile.currentAge) / (profile.lifeExpectancy - profile.currentAge)) * 100))
      : null;

  const currentNetWorth =
    convertedCash.amount + convertedInvestments.reduce((s, i) => s + equityOf(i), 0) + convertedRetirement.reduce((s, r) => s + r.amount, 0);
  const finalYear = years[years.length - 1];

  // fires the celebration (or commiseration) popup by comparing THIS visit to Forecast
  // against the LAST time it was viewed — positive if changes since then moved FI sooner
  // or grew net worth meaningfully, negative if they pushed FI later. Purely passive:
  // there's no "save" to click, arriving at Forecast again is enough to trigger it.
  useEffect(() => {
    if (tab !== "results" || !loaded || showOnboarding) return;
    if (daysUntilFI == null) {
      forecastSnapshot.current = null;
      return;
    }
    const prev = forecastSnapshot.current;
    if (prev) {
      const deltaDays = prev.days - daysUntilFI;
      const deltaNetWorth = currentNetWorth - prev.netWorth;
      if (Math.abs(deltaDays) >= 1 || Math.abs(deltaNetWorth) > 500) {
        const msg = freedomMessage(deltaDays, deltaNetWorth, currency);
        if (msg) setBigCelebration(msg);
      }
    }
    forecastSnapshot.current = { days: daysUntilFI, netWorth: currentNetWorth };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // synthetic "before the simulation starts" record so age = currentAge can still show a diff
  const initialRecord = useMemo(() => {
    const rec = { age: profile.currentAge - 1, Cash: cash.amount };
    withDisplayNames(investments, "Investment").forEach((inv) => {
      rec[inv.displayName] = equityOf(inv);
    });
    withDisplayNames(retirement, "Account").forEach((r) => {
      rec[r.displayName] = r.amount;
    });
    rec._total = cash.amount + investments.reduce((s, i) => s + equityOf(i), 0) + retirement.reduce((s, r) => s + r.amount, 0);
    return rec;
  }, [profile.currentAge, cash, investments, retirement]);

  useEffect(() => {
    if (selectedAge != null && !years.find((y) => y.age === selectedAge)) setSelectedAge(null);
  }, [years, selectedAge]);

  const selectedRecord = selectedAge != null ? years.find((y) => y.age === selectedAge) : null;
  const prevRecord = selectedAge != null ? (selectedAge === profile.currentAge ? initialRecord : years.find((y) => y.age === selectedAge - 1)) : null;

  // display-only versions of the chart data, with inflation stripped back out when the
  // "today's money" toggle is on — the simulation itself always stays in nominal terms,
  // this only affects what's rendered. Nested transaction detail (_explain, _shortfall)
  // is deliberately left nominal either way — see the note above deflateRecord.
  const displayYears = useMemo(
    () => years.map((y) => deflateRecord(y, realFactorForAge(y.age, profile.currentAge, expensesState.inflation, realTermsView))),
    [years, profile.currentAge, expensesState.inflation, realTermsView]
  );
  const displaySelectedRecord = selectedRecord
    ? deflateRecord(selectedRecord, realFactorForAge(selectedRecord.age, profile.currentAge, expensesState.inflation, realTermsView))
    : null;
  const displayPrevRecord = prevRecord
    ? deflateRecord(prevRecord, realFactorForAge(prevRecord.age, profile.currentAge, expensesState.inflation, realTermsView))
    : null;

  // Today-vs-What-if total net worth per year, for the What If comparison chart
  const comparisonData = useMemo(() => {
    const lastAge = Math.max(
      years.length ? years[years.length - 1].age : profile.currentAge,
      altYears.length ? altYears[altYears.length - 1].age : profile.currentAge
    );
    const baseMap = new Map(years.map((y) => [y.age, y._total]));
    const altMap = new Map(altYears.map((y) => [y.age, y._total]));
    const data = [];
    for (let age = profile.currentAge; age <= lastAge; age++) {
      data.push({ age, Today: baseMap.has(age) ? baseMap.get(age) : null, "What if": altMap.has(age) ? altMap.get(age) : null });
    }
    return data;
  }, [years, altYears, profile.currentAge]);

  const invColor = (id) => PALETTE[(investments.findIndex((i) => i.id === id) + 1) % PALETTE.length];
  const retColor = (id) => PALETTE[(1 + investments.length + retirement.findIndex((r) => r.id === id)) % PALETTE.length];

  const orderKeyFor = (inv) => (inv.type === "house" ? `house:${inv.id}` : `investment:${inv.id}`);
  const isOrderable = (inv) => inv.type !== "house" || inv.sellable !== false;

  const updateInvestment = (id, patch) =>
    setInvestments((prev) => {
      const oldInv = prev.find((i) => i.id === id);
      if (oldInv) {
        const newInv = { ...oldInv, ...patch };
        const wasOrderable = isOrderable(oldInv);
        const nowOrderable = isOrderable(newInv);
        const oldKey = orderKeyFor(oldInv);
        const newKey = orderKeyFor(newInv);
        if (wasOrderable && !nowOrderable) {
          setWithdrawalOrder((wo) => wo.filter((e) => e !== oldKey));
        } else if (!wasOrderable && nowOrderable) {
          setWithdrawalOrder((wo) => [...wo, newKey]);
        } else if (wasOrderable && nowOrderable && oldKey !== newKey) {
          setWithdrawalOrder((wo) => wo.map((e) => (e === oldKey ? newKey : e)));
        }
      }
      return prev.map((i) => (i.id === id ? { ...i, ...patch } : i));
    });
  const updateMortgage = (inv, patch) => {
    const merged = { ...inv, ...patch };
    if ((merged.mortgageInputMode || "rate") === "years") {
      const solved = solveMortgageRate(merged.mortgageBalance || 0, merged.mortgagePayment || 0, merged.mortgageYearsLeft || 0);
      if (solved != null) merged.mortgageRate = solved;
    }
    updateInvestment(inv.id, merged);
  };
  const removeInvestment = (id) => {
    setInvestments((prev) => prev.filter((i) => i.id !== id));
    setWithdrawalOrder((prev) => prev.filter((e) => e !== `investment:${id}` && e !== `house:${id}`));
  };
  const addInvestment = () => {
    const newId = uid();
    setInvestments((prev) => [
      ...prev,
      {
        id: newId,
        name: "New Investment",
        type: "market",
        region: profile.region,
        amount: 10000,
        growthRate: 5,
        contribution: 0,
        contributionFrequency: "monthly",
      },
    ]);
    setWithdrawalOrder((prev) => [...prev, `investment:${newId}`]);
  };

  const updateRetirement = (id, patch) =>
    setRetirement((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeRetirement = (id) => {
    setRetirement((prev) => prev.filter((r) => r.id !== id));
    setWithdrawalOrder((prev) => prev.filter((e) => e !== `retirement:${id}`));
  };
  const addRetirement = () => {
    const newId = uid();
    setRetirement((prev) => [
      ...prev,
      {
        id: newId,
        name: "New Account",
        amount: 20000,
        growthRate: 6,
        contribution: 0,
        minAge: 59,
        taxTreatment: "pretax",
        earlyAccessAllowed: false,
        earlyPenalty: 10,
      },
    ]);
    setWithdrawalOrder((prev) => [...prev, `retirement:${newId}`]);
  };

  const updateLumpSum = (id, patch) => setLumpSums((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const removeLumpSum = (id) => setLumpSums((prev) => prev.filter((l) => l.id !== id));
  const addLumpSum = () =>
    setLumpSums((prev) => [...prev, { id: uid(), name: "Lump sum", age: profile.currentAge + 5, amount: 10000 }]);

  const moveWithdrawal = (idx, dir) => {
    setWithdrawalOrder((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const fontLink = (
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap"
    />
  );
  const heroGradient = "linear-gradient(135deg, #1B1435 0%, #2B1E52 45%, #4A2A5E 75%, #7A3B54 100%)";

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm" style={{ background: heroGradient, color: "#D8CFF0" }}>
        {fontLink}
        Loading…
      </div>
    );
  }

  if (showOnboarding && !onboardingStarted) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center text-white"
        style={{ background: heroGradient, fontFamily: "'Inter', sans-serif" }}
      >
        {fontLink}
        <div className="fixed top-4 right-4">
          <LanguageFlag language={language} onChange={setLanguagePersisted} dark />
        </div>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(255,255,255,0.12)" }}>
          <Rocket size={30} color="#FFC24B" />
        </div>
        <h1 className="text-3xl font-bold mb-3 leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Let's get you retirement ready! 🎉
        </h1>
        <p className="text-sm mb-8 max-w-xs" style={{ color: "#D8CFF0" }}>
          A dozen quick questions and we'll build your whole plan — money, home, and pension, all of it.
        </p>
        <button
          onClick={() => setOnboardingStarted(true)}
          className="w-full max-w-xs font-semibold rounded-full py-3.5"
          style={{ background: "#FFC24B", color: "#1B1435" }}
        >
          Get started →
        </button>
        <button
          onClick={() => setShowOnboarding(false)}
          className="mt-4 text-xs underline decoration-dotted"
          style={{ color: "#C9BEEA" }}
        >
          Skip for now, I'll enter things myself
        </button>
        <p className="mt-8 flex items-center gap-1.5 text-[11px] max-w-xs" style={{ color: "#8B7FB0" }}>
          🔒 Everything you enter stays on this phone — nothing is sent to a server, even when you save a
          profile.
        </p>
      </div>
    );
  }

  if (showOnboarding && onboardingStarted) {
    const steps = getWizardSteps(wizardAnswers);
    const step = steps[Math.min(wizardStepIndex, steps.length - 1)];
    const progress = (wizardStepIndex / steps.length) * 100;
    const isLast = wizardStepIndex === steps.length - 1;

    const goNext = () => {
      if (isLast) finishOnboarding(wizardAnswers);
      else setWizardStepIndex((i) => Math.min(i + 1, steps.length - 1));
    };
    const goBack = () => setWizardStepIndex((i) => Math.max(0, i - 1));
    const goToStep = (id) => {
      const idx = steps.findIndex((s) => s.id === id);
      if (idx >= 0) setWizardStepIndex(idx);
    };
    const answerYesNo = (val) => {
      setWizardAnswers((a) => ({ ...a, [step.id]: val }));
      setTimeout(() => {
        if (isLast) finishOnboarding({ ...wizardAnswers, [step.id]: val });
        else setWizardStepIndex((i) => i + 1);
      }, 150);
    };

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#FAF9FE", fontFamily: "'Inter', sans-serif" }}>
        {fontLink}
        <div className="px-6 pt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: "#EEE9F7" }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg, #4C8DFF, #7C5CFC)" }}
              />
            </div>
            <div className="ml-3 shrink-0">
              <LanguageFlag language={language} onChange={setLanguagePersisted} />
            </div>
          </div>
          <div className="text-xs text-stone-400 mt-2">
            {trQuestionProgress(language, wizardStepIndex + 1, steps.length)}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4">
          <h2 className="text-xl font-semibold mb-2 leading-snug" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {step.id === "taxCountry"
              ? tr(wizardAnswers.region === "EU" ? "wizard_taxCountry_eu" : "wizard_taxCountry_us", step.question)
              : tr(`wizard_${step.id}`, step.question)}
          </h2>
          {step.note && <p className="text-xs text-stone-400 mb-5 leading-relaxed">{step.note}</p>}
          {!step.note && <div className="mb-3" />}

          {step.type === "region" ? (
            <div>
              <div className="grid grid-cols-1 gap-2.5">
                {REGIONS.map((r) => {
                  const rd = REGION_DEFAULTS[r];
                  const selected = wizardAnswers.region === r;
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        setWizardAnswers((a) => ({
                          ...a,
                          region: r,
                          inflation: rd.inflation,
                          cashRate: rd.cashRate,
                          cashCurrency: rd.currency,
                          investmentsList: a.investmentsList.map((i) => ({ ...i, currency: rd.currency, growthRate: rd.marketReturn })),
                          housesList: a.housesList.map((h) => ({ ...h, currency: rd.currency })),
                          retirementList: a.retirementList.map((x) => ({ ...x, currency: rd.currency, growthRate: rd.marketReturn })),
                        }));
                        setTimeout(() => setWizardStepIndex((i) => i + 1), 150);
                      }}
                      className="w-full flex items-center justify-between rounded-2xl px-4 py-4 text-left border-2 transition-colors"
                      style={
                        selected
                          ? { background: "#4C8DFF1A", borderColor: "#4C8DFF" }
                          : { background: "white", borderColor: "#E7E5E4" }
                      }
                    >
                      <span className="font-semibold text-sm">{rd.label}</span>
                      <span className="text-xs text-stone-400">{rd.currency}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-stone-400 mt-4 leading-relaxed">
                We'll use this to set your currency and to pre-fill typical long-run inflation and savings rates
                for where you live. You can change any of it later.
              </p>
            </div>
          ) : step.type === "yesno" ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => answerYesNo(true)}
                className="rounded-2xl py-7 text-lg font-semibold"
                style={{ background: "#4C8DFF1A", color: "#1E4FA8" }}
              >
                {tr("wizard_yes", "Yes")}
              </button>
              <button
                onClick={() => answerYesNo(false)}
                className="rounded-2xl py-7 text-lg font-semibold"
                style={{ background: "#FF6B6B1A", color: "#B23A22" }}
              >
                {tr("wizard_no", "No")}
              </button>
            </div>
          ) : step.type === "investlist" ? (
            <div className="text-left">
              {wizardAnswers.investmentsList.map((item, idx) => (
                <div key={item.id} className="rounded-2xl bg-white p-3.5 mb-3 shadow-sm border border-stone-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-stone-400">Investment {idx + 1}</span>
                    {wizardAnswers.investmentsList.length > 1 && (
                      <button onClick={() => wizardRemoveItem("investmentsList", item.id)} className="text-stone-300 hover:text-rose-500">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <Field label="Name">
                    <TextInput value={item.name} onChange={(v) => wizardUpdateItem("investmentsList", item.id, { name: v })} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Amount today">
                      <NumberInput accent="#4C8DFF" value={item.amount} onChange={(v) => wizardUpdateItem("investmentsList", item.id, { amount: v })} />
                    </Field>
                    <Field label="Add per month">
                      <NumberInput accent="#4C8DFF" value={item.contribution} onChange={(v) => wizardUpdateItem("investmentsList", item.id, { contribution: v })} />
                    </Field>
                    {wizardAnswers.customRates && (
                      <Field label={`Expected growth rate (cautious default; ${(REGION_DEFAULTS[wizardAnswers.region] || REGION_DEFAULTS.EU).index} historical avg is ${(REGION_DEFAULTS[wizardAnswers.region] || REGION_DEFAULTS.EU).historicalReturn}%)`}>
                        <NumberInput
                          accent="#4C8DFF"
                          value={item.growthRate ?? 6}
                          suffix="%/yr"
                          onChange={(v) => wizardUpdateItem("investmentsList", item.id, { growthRate: v })}
                        />
                      </Field>
                    )}
                    {wizardAnswers.multiCurrency && (
                      <Field label="Currency">
                        <SelectInput
                          value={item.currency || "EUR"}
                          onChange={(v) => wizardUpdateItem("investmentsList", item.id, { currency: v })}
                          options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
                        />
                      </Field>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={() => wizardAddItem("investmentsList", { name: "Investment", amount: 10000, contribution: 200, growthRate: 6, currency: "EUR" })}
                className="w-full rounded-full py-2.5 text-sm font-semibold mb-4"
                style={{ background: "#4C8DFF1A", color: "#1E4FA8" }}
              >
                + Add another investment
              </button>
              <button
                onClick={goNext}
                className="w-full rounded-full py-3.5 font-semibold text-white"
                style={{ background: "linear-gradient(90deg, #4C8DFF, #7C5CFC)" }}
              >
                {isLast ? tr("wizard_see_results", "See my results →") : tr("wizard_next", "Next →")}
              </button>
            </div>
          ) : step.type === "houselist" ? (
            <div className="text-left">
              {wizardAnswers.housesList.map((item, idx) => {
                const isRental = item.usage === "rental";
                const mode = item.mortgageInputMode || "rate";
                return (
                  <div key={item.id} className="rounded-2xl bg-white p-3.5 mb-3 shadow-sm border border-stone-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-stone-400">Property {idx + 1}</span>
                      {wizardAnswers.housesList.length > 1 && (
                        <button onClick={() => wizardRemoveItem("housesList", item.id)} className="text-stone-300 hover:text-rose-500">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <Field label="Name">
                      <TextInput value={item.name} onChange={(v) => wizardUpdateItem("housesList", item.id, { name: v })} />
                    </Field>
                    <Field label="This is my">
                      <SelectInput
                        value={item.usage || "primary"}
                        onChange={(v) => wizardUpdateItem("housesList", item.id, { usage: v })}
                        options={[
                          { value: "primary", label: "Primary home" },
                          { value: "rental", label: "Rental property" },
                        ]}
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Value today">
                        <NumberInput accent="#4C8DFF" value={item.value} onChange={(v) => wizardUpdateItem("housesList", item.id, { value: v })} />
                      </Field>
                      <Field label="Mortgage left (0 if none)">
                        <NumberInput
                          accent="#4C8DFF"
                          value={item.mortgageBalance}
                          onChange={(v) => wizardUpdateMortgage(item, { mortgageBalance: v })}
                        />
                      </Field>
                    </div>
                    {isRental && (
                      <Field label="Monthly rent it earns">
                        <NumberInput accent="#4C8DFF" value={item.rent || 0} onChange={(v) => wizardUpdateItem("housesList", item.id, { rent: v })} />
                      </Field>
                    )}
                    <Field label="Monthly mortgage payment (0 if none)">
                      <NumberInput
                        accent="#4C8DFF"
                        value={item.mortgagePayment}
                        onChange={(v) => wizardUpdateMortgage(item, { mortgagePayment: v })}
                      />
                    </Field>
                    {(item.mortgageBalance || 0) > 0 && (
                      <>
                        <Field label="I know:">
                          <SelectInput
                            value={mode}
                            onChange={(v) => {
                              if (v === "years") {
                                const implied = solveMortgageYears(item.mortgageBalance || 0, item.mortgagePayment || 0, item.mortgageRate || 0);
                                wizardUpdateItem("housesList", item.id, {
                                  mortgageInputMode: v,
                                  mortgageYearsLeft: isFinite(implied) ? Math.round(implied * 10) / 10 : item.mortgageYearsLeft || 20,
                                });
                              } else {
                                wizardUpdateItem("housesList", item.id, { mortgageInputMode: v });
                              }
                            }}
                            options={[
                              { value: "rate", label: "Interest rate" },
                              { value: "years", label: "Years remaining" },
                            ]}
                          />
                        </Field>
                        {mode === "rate" ? (
                          <Field label="Interest rate">
                            <NumberInput
                              accent="#4C8DFF"
                              value={item.mortgageRate ?? 4.5}
                              suffix="%/yr"
                              onChange={(v) => wizardUpdateItem("housesList", item.id, { mortgageRate: v })}
                            />
                          </Field>
                        ) : (
                          <Field label="Years remaining">
                            <NumberInput
                              accent="#4C8DFF"
                              value={item.mortgageYearsLeft ?? 20}
                              onChange={(v) => {
                                const solved = solveMortgageRate(item.mortgageBalance || 0, item.mortgagePayment || 0, v);
                                wizardUpdateItem("housesList", item.id, {
                                  mortgageYearsLeft: v,
                                  mortgageRate: solved != null ? solved : item.mortgageRate,
                                });
                              }}
                            />
                          </Field>
                        )}
                      </>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {wizardAnswers.customRates && (
                        <Field label="Expected appreciation">
                          <NumberInput
                            accent="#4C8DFF"
                            value={item.growthRate ?? 3}
                            suffix="%/yr"
                            onChange={(v) => wizardUpdateItem("housesList", item.id, { growthRate: v })}
                          />
                        </Field>
                      )}
                      {wizardAnswers.multiCurrency && (
                        <Field label="Currency">
                          <SelectInput
                            value={item.currency || "EUR"}
                            onChange={(v) => wizardUpdateItem("housesList", item.id, { currency: v })}
                            options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
                          />
                        </Field>
                      )}
                    </div>
                    <Field label="Could you sell this if you needed the money?">
                      <SelectInput
                        value={item.sellable === false ? "no" : "yes"}
                        onChange={(v) => wizardUpdateItem("housesList", item.id, { sellable: v === "yes" })}
                        options={[
                          { value: "yes", label: "Yes — include it as a fallback" },
                          { value: "no", label: "No — never sell (e.g. keep the family home)" },
                        ]}
                      />
                    </Field>
                    {item.sellable !== false && (() => {
                      const effAction =
                        item.usage !== "rental" && (!item.postSaleAction || item.postSaleAction === "none")
                          ? "rent"
                          : item.postSaleAction;
                      return (
                        <>
                          {item.usage !== "rental" && (
                            <Field label="If it's sold, what happens?">
                              <SelectInput
                                value={effAction}
                                onChange={(v) => wizardUpdateItem("housesList", item.id, { postSaleAction: v })}
                                options={[
                                  { value: "rebuy", label: "Buy a new home for a set amount" },
                                  { value: "resize", label: "Buy something worth a multiple of the sale price" },
                                  { value: "rent", label: "Rent afterward" },
                                ]}
                              />
                            </Field>
                          )}
                          {wizardAnswers.customRates && (
                            <Field label="Agency / selling fee">
                              <NumberInput
                                accent="#4C8DFF"
                                value={item.sellingFeePercent ?? 4}
                                suffix="% of sale"
                                onChange={(v) => wizardUpdateItem("housesList", item.id, { sellingFeePercent: v })}
                              />
                            </Field>
                          )}
                          {item.usage !== "rental" && effAction === "rebuy" && (
                            <Field label="Value of the new home">
                              <NumberInput
                                accent="#4C8DFF"
                                value={item.rebuyValue || 0}
                                onChange={(v) => wizardUpdateItem("housesList", item.id, { rebuyValue: v })}
                              />
                            </Field>
                          )}
                          {item.usage !== "rental" && effAction === "resize" && (
                            <Field label="Resize factor (0.5 = half, 2 = double)">
                              <NumberInput
                                accent="#4C8DFF"
                                value={item.resizeFactor ?? 1}
                                suffix="×"
                                onChange={(v) => wizardUpdateItem("housesList", item.id, { resizeFactor: v })}
                              />
                            </Field>
                          )}
                          {item.usage !== "rental" && effAction === "rent" && (
                            <Field label="Monthly rent after selling">
                              <NumberInput
                                accent="#4C8DFF"
                                value={item.postSaleRent || 0}
                                onChange={(v) => wizardUpdateItem("housesList", item.id, { postSaleRent: v })}
                              />
                            </Field>
                          )}
                          {(item.usage === "rental" || effAction === "rent") && (
                            <>
                              <Field label="What should happen to the money?">
                                <SelectInput
                                  value={item.reinvestAs || "cash"}
                                  onChange={(v) => wizardUpdateItem("housesList", item.id, { reinvestAs: v })}
                                  options={[
                                    { value: "cash", label: "Keep as cash" },
                                    { value: "cd", label: "Put it in a CD" },
                                    { value: "market", label: "Invest it in the market" },
                                  ]}
                                />
                              </Field>
                              {(item.reinvestAs === "cd" || item.reinvestAs === "market") && (
                                <Field label={item.reinvestAs === "cd" ? "CD interest rate" : "Expected market return"}>
                                  <NumberInput
                                    accent="#4C8DFF"
                                    value={item.reinvestRate || 0}
                                    suffix="%/yr"
                                    onChange={(v) => wizardUpdateItem("housesList", item.id, { reinvestRate: v })}
                                  />
                                </Field>
                              )}
                            </>
                          )}
                          {item.usage !== "rental" && (effAction === "rebuy" || effAction === "resize" || effAction === "rent") && (
                            <p className="text-xs text-stone-400 -mt-1">
                              This only happens once your plan actually needs the money — not on a set date.
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                );
              })}
              <button
                onClick={() =>
                  wizardAddItem("housesList", {
                    name: "Rental property",
                    usage: "rental",
                    value: 250000,
                    mortgageBalance: 100000,
                    mortgagePayment: 900,
                    mortgageInputMode: "rate",
                    mortgageRate: 4.5,
                    mortgageYearsLeft: 20,
                    rent: 1200,
                    growthRate: 3,
                    currency: "EUR",
                    sellable: true,
                    postSaleAction: "none",
                    rebuyValue: 0,
                    resizeFactor: 1,
                    postSaleRent: 0,
                    sellingFeePercent: 4,
                  })
                }
                className="w-full rounded-full py-2.5 text-sm font-semibold mb-4"
                style={{ background: "#4C8DFF1A", color: "#1E4FA8" }}
              >
                + Add another property
              </button>
              <button
                onClick={goNext}
                className="w-full rounded-full py-3.5 font-semibold text-white"
                style={{ background: "linear-gradient(90deg, #4C8DFF, #7C5CFC)" }}
              >
                {isLast ? tr("wizard_see_results", "See my results →") : tr("wizard_next", "Next →")}
              </button>
            </div>
          ) : step.type === "retirelist" ? (
            <div className="text-left">
              {wizardAnswers.retirementList.map((item, idx) => (
                <div key={item.id} className="rounded-2xl bg-white p-3.5 mb-3 shadow-sm border border-stone-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-stone-400">Account {idx + 1}</span>
                    {wizardAnswers.retirementList.length > 1 && (
                      <button onClick={() => wizardRemoveItem("retirementList", item.id)} className="text-stone-300 hover:text-rose-500">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <Field label="Name">
                    <TextInput value={item.name} onChange={(v) => wizardUpdateItem("retirementList", item.id, { name: v })} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Balance today">
                      <NumberInput accent="#4C8DFF" value={item.balance} onChange={(v) => wizardUpdateItem("retirementList", item.id, { balance: v })} />
                    </Field>
                    <Field label="Added per year">
                      <NumberInput accent="#4C8DFF" value={item.contribution} onChange={(v) => wizardUpdateItem("retirementList", item.id, { contribution: v })} />
                    </Field>
                    {wizardAnswers.customRates && (
                      <Field label={`Expected growth rate (cautious default; ${(REGION_DEFAULTS[wizardAnswers.region] || REGION_DEFAULTS.EU).index} historical avg is ${(REGION_DEFAULTS[wizardAnswers.region] || REGION_DEFAULTS.EU).historicalReturn}%)`}>
                        <NumberInput
                          accent="#4C8DFF"
                          value={item.growthRate ?? 6}
                          suffix="%/yr"
                          onChange={(v) => wizardUpdateItem("retirementList", item.id, { growthRate: v })}
                        />
                      </Field>
                    )}
                    <Field label="Minimum withdrawal age">
                      <NumberInput
                        accent="#4C8DFF"
                        value={item.minAge ?? 60}
                        onChange={(v) => wizardUpdateItem("retirementList", item.id, { minAge: v })}
                      />
                    </Field>
                    {wizardAnswers.multiCurrency && (
                      <Field label="Currency">
                        <SelectInput
                          value={item.currency || "EUR"}
                          onChange={(v) => wizardUpdateItem("retirementList", item.id, { currency: v })}
                          options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
                        />
                      </Field>
                    )}
                  </div>
                  <Field label="Tax treatment">
                    <SelectInput
                      value={item.taxTreatment || "pretax"}
                      onChange={(v) => wizardUpdateItem("retirementList", item.id, { taxTreatment: v })}
                      options={[
                        { value: "pretax", label: "Taxed when withdrawn" },
                        { value: "posttax", label: "Already taxed — tax-free withdrawal" },
                      ]}
                    />
                  </Field>
                </div>
              ))}
              <button
                onClick={() =>
                  wizardAddItem("retirementList", {
                    name: "Retirement account",
                    balance: 10000,
                    contribution: 0,
                    growthRate: 6,
                    minAge: 60,
                    taxTreatment: "pretax",
                    currency: "EUR",
                  })
                }
                className="w-full rounded-full py-2.5 text-sm font-semibold mb-4"
                style={{ background: "#4C8DFF1A", color: "#1E4FA8" }}
              >
                + Add another account
              </button>
              <button
                onClick={goNext}
                className="w-full rounded-full py-3.5 font-semibold text-white"
                style={{ background: "linear-gradient(90deg, #4C8DFF, #7C5CFC)" }}
              >
                {isLast ? tr("wizard_see_results", "See my results →") : tr("wizard_next", "Next →")}
              </button>
            </div>
          ) : step.type === "taxcountry" ? (
            <div>
              <div className="grid grid-cols-1 gap-2.5">
                {step.options.map((opt) => {
                  const selected = wizardAnswers.taxCountry === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setWizardAnswers((a) => ({ ...a, taxCountry: opt.value }));
                        setTimeout(() => setWizardStepIndex((i) => i + 1), 150);
                      }}
                      className="w-full flex items-center justify-between rounded-2xl px-4 py-4 text-left border-2 transition-colors"
                      style={
                        selected
                          ? { background: "#4C8DFF1A", borderColor: "#4C8DFF" }
                          : { background: "white", borderColor: "#E7E5E4" }
                      }
                    >
                      <span className="font-semibold text-sm">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-stone-400 mt-4 leading-relaxed">
                This is only used to pick a realistic tax-bracket table — it won't affect your currency or other
                defaults. You can change it any time on the Profile tab.
              </p>
            </div>
          ) : step.type === "currency" ? (
            <div className="grid grid-cols-2 gap-2.5">
              {SUPPORTED_CURRENCIES.map((c) => {
                const selected = (wizardAnswers.salaryCurrency || "") === c;
                return (
                  <button
                    key={c}
                    onClick={() => {
                      setWizardAnswers((a) => ({ ...a, salaryCurrency: c }));
                      setTimeout(() => setWizardStepIndex((i) => i + 1), 150);
                    }}
                    className="rounded-2xl px-4 py-4 text-center border-2 font-semibold text-sm transition-colors"
                    style={
                      selected
                        ? { background: "#4C8DFF1A", borderColor: "#4C8DFF" }
                        : { background: "white", borderColor: "#E7E5E4" }
                    }
                  >
                    {c} ({currencySymbol(c)})
                  </button>
                );
              })}
            </div>
          ) : step.type === "pension" ? (
            <div className="text-left">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Starts at age">
                  <NumberInput
                    accent="#4C8DFF"
                    value={wizardAnswers.pensionStartAge}
                    onChange={(v) => setWizardAnswers((a) => ({ ...a, pensionStartAge: v }))}
                  />
                </Field>
                <Field label="% of final salary">
                  <NumberInput
                    accent="#4C8DFF"
                    value={wizardAnswers.pensionPercent}
                    suffix="%"
                    onChange={(v) => setWizardAnswers((a) => ({ ...a, pensionPercent: v }))}
                  />
                </Field>
              </div>
              <Field label="Does it rise with inflation?">
                <SelectInput
                  value={wizardAnswers.pensionIndexed === false ? "no" : "yes"}
                  onChange={(v) => setWizardAnswers((a) => ({ ...a, pensionIndexed: v === "yes" }))}
                  options={[
                    { value: "yes", label: "Yes — indexed to inflation" },
                    { value: "no", label: "No — fixed amount forever" },
                  ]}
                />
              </Field>
              <div className="rounded-xl px-3 py-2.5 text-[11px] leading-relaxed mb-3" style={{ background: "#FFF8E7", color: "#8A5A00" }}>
                ⚠️ <strong>A rough estimate.</strong> State pensions usually pay less if you contribute fewer
                years — so if you stop working early, we scale it down. We assume you started working at 25 and
                that a full pension needs contributions until 65 (40 years), then reduce proportionally. Real
                systems differ a lot (the UK needs 35 qualifying years, France 43, US Social Security averages
                your top 35), so treat this as an approximation and check your own. You can adjust both ages
                later on the Retirement tab.
              </div>
              <button
                onClick={goNext}
                className="w-full mt-2 rounded-full py-3.5 font-semibold text-white"
                style={{ background: "linear-gradient(90deg, #4C8DFF, #7C5CFC)" }}
              >
                {isLast ? tr("wizard_see_results", "See my results →") : tr("wizard_next", "Next →")}
              </button>
            </div>
          ) : step.type === "summary" ? (
            <div className="text-left">
              {(() => {
                const a = wizardAnswers;
                const rd = REGION_DEFAULTS[a.region] || REGION_DEFAULTS.EU;
                const salaryCcy = a.multiCurrency ? a.salaryCurrency || rd.currency : rd.currency;
                const cashCcy = a.multiCurrency ? a.cashCurrency || rd.currency : rd.currency;
                const taxCountryLabel =
                  a.region === "EU"
                    ? EU_TAX_COUNTRY_OPTIONS.find((o) => o.value === a.taxCountry)?.label
                    : a.region === "US"
                    ? US_TAX_COUNTRY_OPTIONS.find((o) => o.value === a.taxCountry)?.label
                    : null;
                const investTotal = (a.investmentsList || []).reduce((s, i) => s + (i.amount || 0), 0);
                const retireTotal = (a.retirementList || []).reduce((s, r) => s + (r.balance || 0), 0);

                const Row = ({ label, value, editId }) => (
                  <div className="flex items-start justify-between gap-3 py-2.5 border-b border-stone-100">
                    <div>
                      <div className="text-[11px] text-stone-400">{label}</div>
                      <div className="text-sm font-medium text-stone-700">{value}</div>
                    </div>
                    <button onClick={() => goToStep(editId)} className="shrink-0 text-xs font-semibold" style={{ color: "#4C8DFF" }}>
                      Edit
                    </button>
                  </div>
                );

                return (
                  <div className="rounded-2xl bg-white shadow-sm px-4 mb-4">
                    <Row
                      label="Where you live"
                      value={taxCountryLabel ? `${rd.label} — ${taxCountryLabel}` : rd.label}
                      editId="region"
                    />
                    <Row label="Age" value={`${a.currentAge} years old`} editId="currentAge" />
                    <Row
                      label="Salary"
                      value={`${fmt(a.salary || 0, salaryCcy)} / year, before tax`}
                      editId="salary"
                    />
                    <Row label="Years still working" value={`${a.yearsWorking} years`} editId="yearsWorking" />
                    <Row
                      label="Monthly expenses"
                      value={`${fmt(a.monthlyExpenses || 0, rd.currency)} / month`}
                      editId="monthlyExpenses"
                    />
                    <Row label="Cash on hand" value={fmt(a.cash || 0, cashCcy)} editId="cash" />
                    <Row
                      label="Investments"
                      value={
                        a.hasInvestments
                          ? `${(a.investmentsList || []).length} account${(a.investmentsList || []).length === 1 ? "" : "s"}, ${fmt(investTotal, rd.currency)}`
                          : "None"
                      }
                      editId={a.hasInvestments ? "investmentsList" : "hasInvestments"}
                    />
                    <Row
                      label="Property"
                      value={
                        a.ownsHome
                          ? `${(a.housesList || []).length} propert${(a.housesList || []).length === 1 ? "y" : "ies"}`
                          : "None"
                      }
                      editId={a.ownsHome ? "housesList" : "ownsHome"}
                    />
                    <Row
                      label="Retirement accounts"
                      value={
                        a.hasRetirementAccount
                          ? `${(a.retirementList || []).length} account${(a.retirementList || []).length === 1 ? "" : "s"}, ${fmt(retireTotal, rd.currency)}`
                          : "None"
                      }
                      editId={a.hasRetirementAccount ? "retirementList" : "hasRetirementAccount"}
                    />
                    <div className="py-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[11px] text-stone-400">Pension</div>
                          <div className="text-sm font-medium text-stone-700">
                            {a.hasPension ? `${a.pensionPercent}% of final salary from age ${a.pensionStartAge}` : "None"}
                          </div>
                        </div>
                        <button
                          onClick={() => goToStep(a.hasPension ? "pensionDetails" : "hasPension")}
                          className="shrink-0 text-xs font-semibold"
                          style={{ color: "#4C8DFF" }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
              <p className="text-xs text-stone-400 mb-4 leading-relaxed">
                Tap "Edit" on anything that's not right — it'll take you straight back to that question. Everything
                here (and a lot more detail) stays editable on every tab afterward too.
              </p>
              <button
                onClick={goNext}
                className="w-full rounded-full py-3.5 font-semibold text-white"
                style={{ background: "linear-gradient(90deg, #4C8DFF, #7C5CFC)" }}
              >
                Looks good — see my results →
              </button>
            </div>
          ) : (
            <>
              <WizardInput
                value={wizardAnswers[step.id]}
                suffix={step.suffix}
                onChange={(v) => setWizardAnswers((a) => ({ ...a, [step.id]: v }))}
              />
              {step.id === "cash" && wizardAnswers.multiCurrency && (
                <div className="mt-3">
                  <Field label="Currency">
                    <SelectInput
                      value={wizardAnswers.cashCurrency || "EUR"}
                      onChange={(v) => setWizardAnswers((a) => ({ ...a, cashCurrency: v }))}
                      options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
                    />
                  </Field>
                </div>
              )}
              <button
                onClick={goNext}
                className="w-full mt-6 rounded-full py-3.5 font-semibold text-white"
                style={{ background: "linear-gradient(90deg, #4C8DFF, #7C5CFC)" }}
              >
                {isLast ? tr("wizard_see_results", "See my results →") : tr("wizard_next", "Next →")}
              </button>
            </>
          )}
        </div>

        <div className="pb-8 text-center">
          {wizardStepIndex > 0 && (
            <button onClick={goBack} className="text-xs text-stone-400">
              {tr("wizard_back", "← Back")}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#FAF9FE", color: "#231D3B", fontFamily: "'Inter', sans-serif" }}>
      {fontLink}
      <style>{`
        @keyframes riseIn { from { opacity: 0; transform: translateY(8px);} to { opacity: 1; transform: translateY(0);} }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 16px);} to { opacity: 1; transform: translate(-50%, 0);} }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.7); } 60% { opacity: 1; transform: scale(1.06); } 100% { opacity: 1; transform: scale(1); } }
        .rise-in { animation: riseIn 0.5s ease-out; }
        .slide-up-toast { animation: slideUp 0.3s ease-out; }
        .pop-in { animation: popIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* big celebration: only shown when explicitly resaving over an existing profile */}
      {bigCelebration && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-8"
          style={{ background: "rgba(27,20,53,0.75)" }}
          onClick={() => setBigCelebration(null)}
        >
          <div
            className="pop-in rounded-3xl p-8 text-center max-w-xs shadow-2xl"
            style={{
              background: bigCelebration.positive
                ? "linear-gradient(135deg, #3DDC97, #28C7C7)"
                : "linear-gradient(135deg, #FF6B5B, #E5555A)",
            }}
          >
            <div className="text-5xl mb-3">{bigCelebration.positive ? "🎉" : "😬"}</div>
            <div className="text-xl font-bold text-white leading-snug" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {bigCelebration.text}
            </div>
            <button
              onClick={() => setBigCelebration(null)}
              className="mt-5 rounded-full px-6 py-2.5 text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.25)", color: "white" }}
            >
              Nice!
            </button>
          </div>
        </div>
      )}

      {mortgageScheduleModalId &&
        (() => {
          const inv = investments.find((i) => i.id === mortgageScheduleModalId);
          if (!inv) return null;
          const rate = inv.mortgageRateType === "floating" ? cash.rate : inv.mortgageRate || 0;
          const schedule = buildMortgageSchedule(inv.mortgageBalance || 0, inv.mortgagePayment || 0, rate);
          const color = SECTION_COLORS.investments;
          return (
            <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 text-white" style={{ background: heroGradient }}>
                <h2 className="text-lg font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {inv.displayName || inv.name || "Mortgage"} — payment schedule
                </h2>
                <button onClick={() => setMortgageScheduleModalId(null)} className="rounded-full p-1.5" style={{ background: "rgba(255,255,255,0.15)" }}>
                  <X size={18} />
                </button>
              </div>
              <div className="px-5 py-6 max-w-xl mx-auto">
                {!schedule.locked ? (
                  <div className="rounded-2xl px-4 py-3.5 text-sm" style={{ background: "#FFF1EC", color: "#B23A22" }}>
                    ⚠️ At {rate}%/yr, the monthly payment of {fmt(inv.mortgagePayment || 0, inv.currency || currency)} doesn't even cover the
                    interest on {fmt(inv.mortgageBalance || 0, inv.currency || currency)} owed — this loan would never pay itself off, so
                    there's no fixed schedule to show. Raise the payment or lower the rate to see one.
                  </div>
                ) : schedule.years.length === 0 ? (
                  <p className="text-sm text-stone-500">No mortgage balance is owed on this property.</p>
                ) : (
                  <>
                    <p className="text-xs text-stone-400 mb-4 leading-relaxed">
                      Locked in today, using {fmt(inv.mortgageBalance || 0, inv.currency || currency)} owed,{" "}
                      {fmt(inv.mortgagePayment || 0, inv.currency || currency)}/month, and {rate}%/yr — this schedule pays off in{" "}
                      {schedule.years.length} year{schedule.years.length === 1 ? "" : "s"}
                      {inv.mortgageRateType === "floating" ? " (floating rate, currently locked at today's Cash rate — see the note above)" : ""}. It's
                      fixed once you leave this page; editing the balance, payment, or rate afterward re-locks a new schedule from that
                      point on, not a change to years already "paid."
                    </p>
                    <div className="overflow-x-auto -mx-5 px-5">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="text-left text-stone-400 border-b border-stone-200">
                            <th className="py-2 pr-2 font-medium">Year</th>
                            <th className="py-2 pr-2 font-medium text-right">Start balance</th>
                            <th className="py-2 pr-2 font-medium text-right">Interest</th>
                            <th className="py-2 pr-2 font-medium text-right">Principal</th>
                            <th className="py-2 font-medium text-right">End balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schedule.years.map((row, idx) => (
                            <tr key={idx} className="border-b border-stone-100">
                              <td className="py-2 pr-2 text-stone-500">{idx + 1}</td>
                              <td className="py-2 pr-2 text-right">{fmt(row.startBalance, inv.currency || currency)}</td>
                              <td className="py-2 pr-2 text-right" style={{ color }}>
                                {fmt(row.interestPaid, inv.currency || currency)}
                              </td>
                              <td className="py-2 pr-2 text-right" style={{ color: "#1B7A4C" }}>
                                {fmt(row.principalPaid, inv.currency || currency)}
                              </td>
                              <td className="py-2 text-right font-semibold">{fmt(row.endBalance, inv.currency || currency)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

      {showMethodology && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 text-white" style={{ background: heroGradient }}>
            <h2 className="text-lg font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              How this app works
            </h2>
            <button onClick={() => setShowMethodology(false)} className="rounded-full p-1.5" style={{ background: "rgba(255,255,255,0.15)" }}>
              <X size={18} />
            </button>
          </div>

          <div className="px-5 py-6 space-y-6 max-w-xl mx-auto">
            <div className="rounded-2xl px-4 py-3 text-xs leading-relaxed flex items-start gap-2" style={{ background: "#E9FBF2", color: "#1B7A4C" }}>
              <span>🔒</span>
              <span>
                Everything you enter — including a saved profile — stays on this phone only. Nothing is sent to a
                server or stored anywhere else, even though this app is running on a website.
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-stone-500 leading-relaxed">
                {showMath
                  ? "The actual formulas behind every number below."
                  : "No finance degree needed — here's what's actually happening behind every number, in plain English."}
              </p>
              <button
                onClick={() => setShowMath((v) => !v)}
                className="shrink-0 text-xs font-semibold rounded-full px-3 py-1.5 border"
                style={{ borderColor: SECTION_COLORS.profile, color: SECTION_COLORS.profile }}
              >
                {showMath ? "Plain English" : "I don't like plain English, give me the math"}
              </button>
            </div>

            {(showMath
              ? [
                  {
                    color: SECTION_COLORS.income,
                    title: "The year-by-year simulation",
                    math: `netCashFlow = netSalary + netPension + extraIncome + lumpSum − annualExpenses

if netCashFlow ≥ 0:
  surplus is routed to cash/investment (see "Where surplus goes")
else:
  shortfall = −netCashFlow
  drawn from each bucket in withdrawalOrder, in the exact
  sequence you set, until shortfall = 0 or nothing is left`,
                  },
                  {
                    color: SECTION_COLORS.investments,
                    title: "Growth, every single year",
                    math: `balance(t+1) = balance(t) × (1 + rate/100) + contribution

Applied once per year, before that year's withdrawals.

STATE PENSION — pro-rata for stopping early
yearsContributed = (currentAge − careerStartAge) + yearsStillWorking
yearsForFull     = fullPensionAge − careerStartAge      (default 65 − 25 = 40)
proRata          = min(1, yearsContributed / yearsForFull)
pension          = %ofFinalSalary × finalSalary × proRata

Defaults assume a career starting at 25 and a full pension
requiring contributions to 65. Both are editable. This is a
simplification — the UK needs 35 qualifying years, France 43,
and US Social Security averages your top 35 earning years.

CD / TERM DEPOSIT (a "fixed rate" investment)
Interest is taxed the year it's earned, like cash — not
deferred and taxed as a capital gain on sale:
  netInterest = balance × cdRateThisYear/100 × (1 − taxRateThisYear/100)
Its cost basis is kept equal to its balance, so selling it
triggers no further tax.

THE RATE ITSELF CHANGES OVER TIME — it doesn't stay at
today's rate forever. For the years still inside your lock-in
(tenor), you earn the rate you entered. Once the tenor ends,
the rate glides LINEARLY over 5 years to a "long-run" rate,
then stays flat:

  if yearsSinceStart < tenor:
    rate = yourRate                       // still locked in
  else:
    t = min(1, (yearsSinceStart − tenor + 1) / 5)
    rate = yourRate + (longRunRate − yourRate) × t

Why: CD/term deposit rates are set by central banks reacting
to inflation, not a stable long-run mean — so unlike equities,
a historical percentile of past rates isn't a coherent
long-run assumption (2010–2021's near-0% rates only happened
because inflation was persistently low; assuming that forever
alongside 2.5% inflation would be inconsistent). Instead the
long-run rate is anchored to inflation: roughly
  longRunRate ≈ inflation − 0.5 points
which matches the historical real return on 1-year CDs. Both
the tenor and the long-run rate are editable per account.

DEFAULT GROWTH RATE — how it's derived
Historical long-run index returns (total return, dividends
reinvested), then haircut for caution:

  region        historical   default
  US   S&P 500     10.0%      7.0%
  EU   Stoxx 50     7.0%      4.0%
  UK   FTSE 100     6.5%      3.5%
  CA   S&P/TSX      8.0%      5.0%

The default ≈ the 25th-percentile outcome over a 10-year
holding period, i.e. "a somewhat disappointing decade":

  annual σ of equity returns  ≈ 17%
  σ over a 10-yr horizon      = 17 / √10 ≈ 5.5%
  25th percentile             z = −0.674
  haircut                     = 0.674 × 5.5 ≈ 3.0 points

So the default is roughly (historical − 3). It is NOT a
forecast — it's a deliberately cautious planning number.
Every rate is editable.`,
                  },
                  {
                    color: SECTION_COLORS.retirement,
                    title: "Average tax rate — worked out automatically ('Auto' mode)",
                    math: `Rather than one flat guessed number, each simulated year's
tax rate is looked up from a progressive bracket table for
your COUNTRY (finer-grained than the app's broader "region" —
region drives currency/inflation/market defaults, tax needs
more precision than that), applied to that YEAR's actual gross
ordinary income:

grossOrdinaryIncome = grossSalary + grossPension
                    + grossRent + cashInterestGross
                    + cdInterestGross
                    (dividends excluded — taxed separately, below)

taxRateThisYear = effectiveRate(grossOrdinaryIncome, bracketsFor(taxCountry))

effectiveRate(income, brackets):
  tax = 0; lower = 0
  for each {upTo, rate} in brackets (ascending):
    taxable = min(income, upTo) − lower
    tax += taxable × rate/100
    lower = upTo
  return tax / income × 100

This means the rate isn't fixed for the whole plan — it's
naturally much lower once retired and living off modest
withdrawals than while earning full salary, without you having
to remember to change it.

Dividend income gets its OWN rate, dividendRateThisYear, looked
up the same way from a separate table — several countries tax
dividends noticeably differently from ordinary income (a flat
"flat tax"-style rate, or a separate lower band).

SUPPORTED COUNTRIES (real bracket tables, updates with income):
  France, Germany, Italy, Spain — pick one on the Profile tab
    when your region is set to EU
  UK
  US — New York (State + NYC) specifically, or a generic
    federal-plus-representative-state estimate for any other state
  Canada — Federal + Ontario-representative province

Picking "another EU country" doesn't guess a nearby country's
brackets — there's no real table for it, so the rate is instead
FIXED at a one-time estimate (the average of the four supported
EU countries at your income) and won't move as your income
changes across the years the way it does for a supported
country. A small warning banner on the Profile tab flags this.

Assumptions baked into every table: SINGLE filer, no dependents,
no itemized deductions beyond the standard/personal allowance.
Deliberately erring slightly high where a judgment call is
needed, consistent with the rest of the app. Figures are for the
2025 tax year (UK: 2025/26) — revisit every year or two, same as
the inflation/market/CD tables.

Either rate can be pinned to a fixed "manual" number instead —
switch on the Profile tab. Manual mode uses that one number for
every year, exactly like the app worked before this existed.`,
                  },
                  {
                    color: SECTION_COLORS.retirement,
                    title: "Capital gains — its own rate, by country",
                    math: `Selling an appreciated investment or house used to be
taxed at the ordinary rate too — that's been split out into
its own capitalGainsRateThisYear, since most countries treat
gains quite differently from salary/pension income:

capitalGainsRateThisYear = computeCapitalGainsTaxRate(taxCountry, grossOrdinaryIncome)

Per-country treatment:
  France, Germany, Italy, Spain, both US options:
    "sameAsDividend" — capital gains are taxed identically
    (or near enough) to dividends in these countries, so this
    just reuses the dividend rate already computed above.

  UK:
    "bands" — Capital Gains Tax is its OWN schedule, separate
    from both income tax and dividend tax:
      18% if ordinary income ≤ £50,270 (basic rate)
      24% above that (higher rate)
    (as of the Oct 2024 budget — shares and residential
    property now share the same two rates)

  Canada:
    "inclusion" — NOT a separate rate at all. Only half the
    gain is taxable income, taxed at the ordinary rate:
      capitalGainsRate = ordinaryRate(taxCountry, income) × 0.5
    (the proposed hike to a 66.67% inclusion rate was
    cancelled in March 2025 — 50% inclusion stays in force)

Same manual-override toggle as the other two rates, and the
same "another EU country" fallback: a fixed one-time estimate
rather than a real per-year table.`,
                  },
                  {
                    color: SECTION_COLORS.retirement,
                    title: "Taxes on withdrawals",
                    math: `net = gross × (1 − taxRateThisYear/100)

For a "taxed when withdrawn" account covering shortfall S:
totalRate  = min(taxRate + earlyPenaltyRate, 0.95)
grossTaken = S / (1 − totalRate)
netToYou   = grossTaken × (1 − totalRate)   // always equals S

Rent income is taxed the same way before being netted against
expenses:
netRent = grossRent × (1 − taxRateThisYear/100)

Dividend income uses its OWN rate instead (see above):
netDividend = grossDividend × (1 − dividendRateThisYear/100)

Cash interest is taxed annually too:
netInterest  = (balance × cashRate/100) × (1 − taxRateThisYear/100)
cashBalance += netInterest

Selling part of a market/dividend investment is taxed only
on the gain above its cost basis (contributions raise the
basis; growth does not) — at the CAPITAL GAINS rate, not the
ordinary one:
gainFraction = max(0, (value − costBasis) / value)
taxRate      = min(gainFraction × capitalGainsRateThisYear/100, 0.95)
grossSold    = shortfall / (1 − taxRate)
netToYou     = grossSold × (1 − taxRate)`,
                  },
                  {
                    color: SECTION_COLORS.lumpsums,
                    title: "Mortgages — locked amortization schedule",
                    math: `A mortgage's schedule is built ONCE, at the start of the
simulation, from balance/payment/rate as they stand right then
— using proper MONTHLY compounding (i = monthly rate):

interest(month)   = balance × i
principal(month)  = payment − interest(month)   // capped so the
                                                  // final month can't overshoot
balance(month+1)  = max(0, balance(month) − principal(month))

Monthly rows are summed into 12-month blocks to give each
simulated year's {startBalance, interestPaid, principalPaid,
endBalance}. The simulation then just READS that row for the
year, every year — it never re-derives the balance from
balance/rate/payment live. This is deliberate: an earlier
version DID re-derive it live, using ANNUAL compounding, which
doesn't exactly match the monthly-compounding formula used to
solve for the missing rate/years value — so a mortgage that was
mathematically consistent at setup could still finish early or
never quite amortize. Locking the schedule once removes that
mismatch entirely; the loan now provably reaches zero at the
exact month implied by its own numbers.

"Floating" rate mortgages are locked the same way, at today's
Cash-tab interest rate — this app doesn't actually change that
rate over time yet, so there's currently no difference between
"fixed" and "floating" in the simulation.

If payment ≤ interest at that rate, no finite schedule exists
(negative amortization) — that case falls back to the original
live year-by-year math, and is flagged by a warning on the
house card.

A year where the whole plan runs short of money freezes that
year's mortgage progress rather than skipping ahead in the
schedule — so a temporary shortfall delays payoff by exactly as
many years as it froze, rather than desyncing the schedule.

Solve years from rate (i = monthly rate, n = months), used once
to lock the schedule when balance/payment/rate are known:
n = −ln(1 − i·P/M) / ln(1 + i)

Solve rate from years — bisection search on:
P·i / (1 − (1+i)^−n) = M`,
                  },
                  {
                    color: "#0EA5E9",
                    title: "Selling a house (always 100%, never partial)",
                    math: `equity = value − mortgageBalance
capitalGain  = max(0, value − purchasePrice)
exemptGain   = primaryResidenceExemption(taxCountry, capitalGain, ...)
taxableGain  = max(0, capitalGain − exemptGain)
taxRate      = min(taxableGain / max(value, 1) × capitalGainsRateThisYear/100, 0.95)
sellingFee   = value × feePercent/100
netProceeds  = equity − taxableGain×capitalGainsRateThisYear/100 − sellingFee

Leftover proceeds after covering that year's shortfall are
routed through the same cash/investment split as any surplus.

PRIMARY-RESIDENCE EXEMPTION — only applies when a property's
usage is "primary", never a rental. No holding-period or
occupancy-period requirement is modeled (the app only stores a
purchase PRICE, not a purchase date), so this is the simple,
unconditional version of each country's rule:
  France, Germany, Italy, UK, Canada:
    FULL exemption — the entire gain is tax-free
  US:
    ALLOWANCE — $250,000 of gain is exempt (single-filer
    IRC §121 exclusion), anything above that taxed normally
  Spain:
    REINVESTMENT — exempt ONLY if the full sale proceeds go
    into a new primary home: postSaleAction === "rebuy" AND
    rebuyValue ≥ saleValue. Otherwise taxed like any other
    capital gain. Maps directly onto the existing "buy a new
    home" post-sale option — set the re-buy value to at least
    the sale price to qualify.
  Unsupported country: no exemption — taxed as an ordinary
    capital gain, same as an investment.
A rental never gets any of this — its gain is always fully
taxable at capitalGainsRateThisYear.`,
                  },
                  {
                    color: SECTION_COLORS.cash,
                    title: '"Financial Independence" date',
                    math: `for candidateAge in [currentAge .. lifeExpectancy]:
  simulate with yearsWorking = candidateAge − currentAge
  if simulation never runs out of money: candidateAge is sustainable

FI age = earliest sustainable candidateAge, then refined with
16 rounds of binary search over the fractional final working
year, for day-level precision.`,
                  },
                  {
                    color: SECTION_COLORS.profile,
                    title: "Where surplus (or a windfall) goes",
                    math: `if cashBalance < minCash:      100% → cash
if cashBalance ≥ maxCash:      100% → investment
else:                          cashPercent% → cash, rest → investment
                               (capped so cash never exceeds maxCash)

The minimum is a protected floor — withdrawals never draw cash
below it: available = max(0, cashBalance − minCash)`,
                  },
                  {
                    color: "#F2545B",
                    title: "Spending decline with age (optional)",
                    math: `Off by default. Approximates Blanchett (2014, "Exploring
the Retirement Consumption Puzzle") using BLS Consumer
Expenditure Survey data on actual retiree spending.

yearsIn = max(0, age − retirementStartAge)
retirementStartAge = currentAge + yearsStillWorking

if yearsIn ≤ 10:  mult = 0.99 ^ yearsIn
if yearsIn > 10:   mult = 0.99^10 × 0.98 ^ min(yearsIn−10, 9)
   (flat after ~19 years in — no further decline)

livingExpenses(year) = monthlyExpenses × 12 × mult

Applies to living expenses only — mortgage/rent are tracked
and inflated separately and are NOT reduced by this.

Blanchett's data shows real spending falls ~26% by ~19 years
into retirement (his study anchors this near age 84 for a
65-year-old retiree), then — on AVERAGE — ticks back up from
rising healthcare costs, forming a "smile." We deliberately
stop at the flat trough rather than modeling that uptick: the
uptick is driven by a subset with major late-life healthcare
costs: the MEDIAN individual retiree's spending just stays
down (a "smirk," not a "smile"), which is the more honest
default for one person's plan.`,
                  },
                  {
                    color: "#B98CFF",
                    title: "Currency conversion",
                    math: `amountIn(toCcy) = amount × rate[fromCcy] / rate[toCcy]

where rate[X] = value of 1 unit of X in USD
(live from a daily FX API, or an offline fallback table)`,
                  },
                  {
                    color: "#4C8DFF",
                    title: `"Today's money" toggle (Results chart)`,
                    math: `The simulation itself always runs in NOMINAL terms — actual
future dollars, inflated year by year, exactly like a real
account statement would show. The "Today's $" toggle on the
Results chart doesn't change that simulation; it only DEFLATES
what's displayed, for that one view:

realFactor(age) = 1 / (1 + inflation/100) ^ (age − currentAge)
displayedValue  = nominalValue × realFactor(age)

Applied to every dollar-shaped field in each year's chart row
(every bucket, Debt, the net-worth total) using the single
inflation assumption from the Income & Expenses tab. Non-dollar
fields (age, flags, the itemized "what changed" explain/
shortfall detail) are left untouched — they describe specific
transactions that happened at their own year's nominal amount,
so deflating them individually would misrepresent what actually
happened that year, even though the running BALANCE above them
is shown in today's terms.`,
                  },
                ]
              : [
                  {
                    color: SECTION_COLORS.income,
                    title: "The year-by-year simulation",
                    body: "For every year from your current age to your life expectancy, the app adds up everything coming in — salary, state pension (reduced pro-rata if you stop working early — see below), rental income, dividends — and subtracts your expenses and any mortgage payments. If there's money left over, it's added to your cash savings. If there's a shortfall, it's covered automatically by pulling from your accounts, following the exact order you set on the \"Withdrawal order\" screen — your choice for whether cash, a specific fund, a retirement account, or a property gets tapped first, second, and so on.",
                  },
                  {
                    color: SECTION_COLORS.investments,
                    title: "Growth, every single year",
                    body: "Each bucket (cash, each investment, each retirement account, each property) grows by the yearly rate you set for it, compounding automatically. A \"CD / term deposit\" is a special case in two ways: like cash, its interest is taxed every year it's earned rather than when you sell, so there's no further tax when you cash it in — and its rate doesn't stay fixed forever. You earn the rate you set for as long as it's locked in (its \"tenor\"), then it glides gradually, over about 5 years, to a lower \"long-run\" rate rather than assuming today's rate lasts for decades. That's because CD rates track central bank policy, not a stable long-run average — so the long-run rate is anchored to inflation instead (roughly inflation minus 0.5%), which matches history better than either today's rate or a raw historical average would. Both the tenor and the long-run rate are editable. That growth is applied before that year's withdrawals — so money you need this year still earns a full year's return first. The default growth rate for equities is deliberately cautious: rather than the rosy historical average of your region's main index, it's set about 3 points lower — roughly what you'd get in a disappointing decade (statistically, a 25th-percentile 10-year stretch). So the US default is 7% rather than the historical 10%, and the UK 3.5% rather than 6.5%. If markets do average or better, you'll beat this plan rather than fall short of it. Every rate is editable.",
                  },
                  {
                    color: "#F2545B",
                    title: "State pension if you retire early",
                    body: "Most state pensions pay less if you contributed fewer years, so stopping work early shrinks it. We assume you started working at 25 and that a full pension needs contributions until 65 — 40 years — then scale proportionally. Stop at 45 having started at 25 and you'd get 20/40 = half the full pension, not all of it. This matters a lot for the \"when can I stop working\" number, since it's tested by simulating stopping at every age. It's a simplification: real systems vary (UK 35 qualifying years, France 43, US Social Security averages your top 35 earning years), so check yours. Both ages are editable on the Retirement tab, and you can switch the reduction off entirely.",
                  },
                  {
                    color: SECTION_COLORS.retirement,
                    title: "Your average tax rate — automatic, or your own number",
                    body: "By default, your tax rate isn't one number you type in once — it's worked out automatically every simulated year from your country's real tax brackets and that year's actual income, so it's naturally much lower once you're retired and living off modest withdrawals than while you're earning full salary. France, Germany, Italy, Spain, the UK, Canada, and the US (New York specifically, or a generic estimate for any other state) all have real bracket tables you can pick from on the Profile tab. Dividends and capital gains (selling an investment or a house) each get their own separate rate too, since most countries tax them quite differently from ordinary income — see the next two sections. If your country isn't on the list yet (any EU country other than the four listed), the app can't adjust automatically — it uses a single fixed number instead, seeded from a rough average across the countries it does know, and a small warning flags this. You can switch any of the three rates to \"set my own number\" at any time if you'd rather pin a fixed value — that works exactly like the app did before this existed.",
                  },
                  {
                    color: SECTION_COLORS.retirement,
                    title: "Capital gains — why it's not the same as your income tax rate",
                    body: "Selling an investment or a house used to be taxed at your ordinary income rate. That's changed, because in most places it isn't taxed that way in real life. France, Germany, Italy, Spain, and the US all tax capital gains the same way (or close to it) as dividends, so this app just reuses that dividend rate — no extra work for you. The UK is genuinely different: Capital Gains Tax is its own separate schedule from both income tax and dividend tax, currently 18% or 24% depending on your income. Canada is different again — only half of a capital gain counts as taxable income at all, with the other half completely tax-free, so the effective rate ends up being half your ordinary rate. All of this happens automatically in \"Auto\" mode, or you can set your own flat number on the Profile tab.",
                  },
                  {
                    color: SECTION_COLORS.retirement,
                    title: "Taxes on withdrawals",
                    body: "Salary, pension, rent, and cash/CD interest are all taxed at your average tax rate before they can offset your expenses. Dividend income and capital gains (selling an investment or a house) each use their own separate rate instead (see above). A market or dividend investment grows untaxed year to year, and is only taxed — on the gain above what you originally put in, at the capital gains rate — when you actually sell some of it, using the \"cost basis\" you set for that holding. A retirement account marked \"taxed when withdrawn\" is grossed up when you draw from it, so the tax (and any early-withdrawal penalty) comes out of that withdrawal itself, not your other accounts — you always end up with exactly the amount you needed.",
                  },
                  {
                    color: SECTION_COLORS.lumpsums,
                    title: "Mortgages — a locked payment schedule",
                    body: "Your mortgage's full payoff schedule is worked out once, using proper monthly compounding (the same math a bank actually uses), from whatever balance, payment, and rate you've set. From then on the simulation just reads that fixed schedule year by year — it doesn't recalculate the balance live using a rougher approximation, which is what used to let a loan quietly amortize forever or finish early even when the numbers looked consistent. You can enter either the interest rate or the remaining years and the app solves for the other one to build that schedule; tap \"See full payment schedule\" on any mortgaged property to see every year of it — starting balance, interest paid, principal paid, and ending balance. Editing the balance, payment, or rate afterward locks in a fresh schedule from that point forward, like a refinance, rather than quietly drifting off the original one. Floating-rate mortgages are locked the same way, at today's Cash-tab rate — this app doesn't yet simulate rates actually changing over the mortgage's life, so there's currently no real difference between \"fixed\" and \"floating.\" Mortgage payments never increase with inflation — but rent (from a rental property, or after selling and renting) always does.",
                  },
                  {
                    color: "#0EA5E9",
                    title: "Selling a house — and the primary-residence tax break",
                    body: "A property only gets sold if it's marked \"sellable\" and the withdrawal order actually needs it that year. Properties are never partially sold — the whole thing is liquidated at once, for its full market value. Tax applies only to the gain above what you paid for it, not the whole sale price, and a selling/agency fee (4% by default) comes off the top too. If the property is your primary residence, most countries give a real break here, and the app models it: France, Germany, Italy, the UK, and Canada exempt the ENTIRE gain from tax when you sell your primary home. The US exempts the first $250,000 of gain (a single-filer allowance) and taxes anything above that normally. Spain is the odd one out — it only exempts the gain if you reinvest the full proceeds into a new primary home (pick \"Buy a new home\" as your after-selling plan, with a value at least equal to the sale price); otherwise it's taxed like any other gain. None of this applies to a rental — a rental's gain is always fully taxable. The house card shows exactly which of these applies to you once you mark it sellable. Afterward, you can choose to buy a smaller or bigger place, start renting, or just bank the cash — and optionally put any leftover into a CD or the market at a rate you set.",
                  },
                  {
                    color: SECTION_COLORS.cash,
                    title: "\"Financial Independence\" date",
                    body: "This isn't a rule-of-thumb formula (like \"25× your spending\"). The app actually tests, year by year, the earliest age at which you could stop working and still never run out of money all the way to your life expectancy — running the full simulation above, repeatedly, until it finds that point. That's why it always agrees with your Results chart.",
                  },
                  {
                    color: SECTION_COLORS.profile,
                    title: "Where surplus (or a windfall) goes",
                    body: "Any money left over after expenses — plus any leftover cash from selling a property — doesn't just pile up as cash. It splits between cash and an investment you choose, based on the minimum and maximum cash you set on the Cash tab. Below the minimum, everything tops up cash first; above the maximum, everything goes to the investment; in between, it splits by your chosen %. That minimum is also a protected emergency floor — it's never drawn down to cover a shortfall.",
                  },
                  {
                    color: "#F2545B",
                    title: "Spending decline with age (optional)",
                    body: "Off by default. Real research on actual retirees (David Blanchett's work, using U.S. government spending survey data) finds spending doesn't stay flat through retirement — it declines. People spend more in the early, active \"go-go\" years, then gradually less through the \"slow-go\" years, then level off. If you switch this on, your living expenses (not mortgage or rent, which are handled separately) fall by about 1% a year in real terms for the first 10 years of retirement, then about 2% a year for the next 9, then flatten out — roughly a 25% reduction by around 19 years in. We deliberately stop there rather than adding the late-life uptick some research shows: that uptick mostly reflects a minority with major healthcare costs, while most individual retirees' spending just stays down — so flattening out is the more honest assumption for one person's plan rather than an average.",
                  },
                  {
                    color: "#B98CFF",
                    title: "Multiple currencies",
                    body: "If you turn on \"multiple currencies\" in your Profile, each account can be set to its own currency. Everything is converted into your one \"main currency\" (also set in Profile) using live exchange rates fetched automatically, with an offline approximate table as a backup if that fetch fails — so results are always shown as one consistent total.",
                  },
                  {
                    color: "#4C8DFF",
                    title: `"Today's $" vs "Future $" — why €2M at 90 isn't what it looks like`,
                    body: "Every dollar the simulation produces for a future year is a FUTURE dollar — inflated the same way real prices are, year after year. That's mathematically correct, but it's genuinely misleading to just look at: a number like €2,000,000 at age 90 sounds like a huge amount of money, but after 55 years of, say, 2.5% inflation, it might only be able to buy what roughly €500,000–€700,000 buys today. The toggle above the Results chart switches between the two honestly: \"Future $\" shows the literal number your accounts would show that year; \"Today's $\" strips inflation back out, so every year's balance is shown in the same purchasing power as right now — directly comparable to what things cost today. Neither view changes your actual plan or the underlying math; it only changes how the same result is displayed. \"Today's $\" is usually the more useful one for judging whether you're really getting ahead, since a big-sounding number 40 years out can still mean less real buying power than a smaller one 5 years out. The detailed, itemized breakdown you get from tapping a point on the chart stays in that year's own actual (future-dollar) amounts either way, since those describe specific things that happened that year — only the running balances above them switch.",
                  },
                ]
            ).map((s) => (
              <div key={s.title}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <h3 className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {s.title}
                  </h3>
                </div>
                {showMath ? (
                  <pre
                    className="text-[11px] leading-relaxed rounded-xl p-3 overflow-x-auto"
                    style={{ background: "#231D3B", color: "#E9E4F7", fontFamily: "monospace" }}
                  >
                    {s.math}
                  </pre>
                ) : (
                  <p className="text-xs text-stone-500 leading-relaxed pl-4.5">{s.body}</p>
                )}
              </div>
            ))}

            <div className="rounded-2xl px-4 py-3.5 text-xs leading-relaxed" style={{ background: "#FFF1EC", color: "#B23A22" }}>
              This is a simplified planning tool built to help you explore "what if" scenarios — it is not
              financial, tax, or legal advice. Real taxes, investment products, and mortgages are more complex
              than any of the assumptions above. Please talk to a qualified professional before making real
              decisions.
            </div>
          </div>
        </div>
      )}

      {/* hero header */}
      <div className="px-5 pt-8 pb-6 text-white rise-in" style={{ background: heroGradient }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[26px] font-semibold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Retirement Runway
            </h1>
            <p className="text-sm mt-1" style={{ color: "#C9BEEA" }}>
              {tr("app_tagline")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <LanguageFlag language={language} onChange={setLanguagePersisted} dark />
            <button
              onClick={() => setShowMethodology(true)}
              title="How this app calculates your numbers"
              className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium"
              style={{ background: "rgba(255,255,255,0.14)", color: "white" }}
            >
              <Info size={14} /> {tr("info_button")}
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-end gap-6">
          <button onClick={() => setShowNetWorthBreakdown((v) => !v)} className="text-left">
            <div className="text-xs flex items-center gap-1" style={{ color: "#B9ACDD" }}>
              {tr("net_worth_today")} {showNetWorthBreakdown ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </div>
            <div className="text-3xl font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {fmt(currentNetWorth, currency)}
            </div>
          </button>
          <div>
            <div className="text-xs" style={{ color: "#B9ACDD" }}>
              {ranOutAge ? tr("funds_run_out") : tr("money_lasts_to")}
            </div>
            <div className="text-xl font-semibold" style={{ color: ranOutAge ? "#FFB443" : "#3DDC97" }}>
              {trAge(language, ranOutAge || profile.lifeExpectancy)}
            </div>
          </div>
        </div>

        {showNetWorthBreakdown && (
          <div className="mt-3 rounded-xl p-3 text-xs" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="text-[10px] mb-1.5" style={{ color: "#8B7FB0" }}>
              All figures converted to your base currency ({currency}).
            </div>
            <div className="flex justify-between py-1">
              <span style={{ color: "#C9BEEA" }}>
                Cash {cash.currency && cash.currency !== currency ? `(${cash.currency})` : ""}
              </span>
              <span>{fmt(convertedCash.amount, currency)}</span>
            </div>
            {convertedInvestments
              .filter((i) => i.type !== "house")
              .map((inv, idx) => (
                <div key={inv.id} className="flex justify-between py-1">
                  <span style={{ color: "#C9BEEA" }}>
                    {inv.name || "Investment"} {investments[idx]?.currency && investments[idx].currency !== currency ? `(${investments[idx].currency})` : ""}
                  </span>
                  <span>{fmt(inv.amount, currency)}</span>
                </div>
              ))}
            {convertedInvestments
              .filter((i) => i.type === "house")
              .map((inv) => {
                const eq = Math.max(0, inv.amount - (inv.mortgageBalance || 0));
                return (
                  <div key={inv.id} className="py-1">
                    <div className="flex justify-between">
                      <span style={{ color: "#C9BEEA" }}>{inv.name || "Property"} equity</span>
                      <span>{fmt(eq, currency)}</span>
                    </div>
                    <div className="text-[10px]" style={{ color: "#8B7FB0" }}>
                      {fmt(inv.amount, currency)} value − {fmt(inv.mortgageBalance || 0, currency)} mortgage
                    </div>
                  </div>
                );
              })}
            {convertedRetirement.map((r, idx) => (
              <div key={r.id} className="flex justify-between py-1">
                <span style={{ color: "#C9BEEA" }}>
                  {r.name || "Retirement account"} {retirement[idx]?.currency && retirement[idx].currency !== currency ? `(${retirement[idx].currency})` : ""}
                </span>
                <span>{fmt(r.amount, currency)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 mt-1 font-semibold border-t" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
              <span>Total net worth</span>
              <span>{fmt(currentNetWorth, currency)}</span>
            </div>
          </div>
        )}

        <div className="mt-5">
          <div className="relative">
            <div className="h-3 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.12)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(0, Math.min(100, (((ranOutAge ? ranOutAge - profile.currentAge : profile.lifeExpectancy - profile.currentAge)) / Math.max(profile.lifeExpectancy - profile.currentAge, 1)) * 100))}%`,
                  background: "linear-gradient(90deg, #3DDC97, #28C7C7)",
                }}
              />
              {ranOutAge && (
                <div
                  className="h-full"
                  style={{
                    width: `${100 - Math.max(0, Math.min(100, (((ranOutAge - profile.currentAge)) / Math.max(profile.lifeExpectancy - profile.currentAge, 1)) * 100))}%`,
                    background: "repeating-linear-gradient(45deg, #FF6B5B, #FF6B5B 6px, #E5555A 6px, #E5555A 12px)",
                  }}
                />
              )}
            </div>
            {fiAge != null && fiPct != null && (
              <div
                className="absolute top-0 h-3 w-[3px] rounded-full"
                style={{ left: `${fiPct}%`, background: "#FFC24B", boxShadow: "0 0 0 2px rgba(27,20,53,0.45)" }}
              />
            )}
          </div>
          <div className="relative h-4 mt-1.5">
            <span className="absolute left-0 text-[11px]" style={{ color: "#B9ACDD" }}>
              {trAge(language, profile.currentAge)}
            </span>
            {fiAge != null && fiPct != null && (
              <span
                className="absolute text-[11px] font-semibold whitespace-nowrap"
                style={{
                  left: `${fiPct}%`,
                  transform: fiPct > 78 ? "translateX(-100%)" : fiPct < 12 ? "translateX(0)" : "translateX(-50%)",
                  color: "#FFC24B",
                }}
              >
                🎯 {trFreeAt(language, Math.floor(fiAge))}
              </span>
            )}
            <span className="absolute right-0 text-[11px]" style={{ color: "#B9ACDD" }}>
              {trAge(language, profile.lifeExpectancy)}
            </span>
          </div>
        </div>

        <div className="mt-5 flex gap-2 text-xs flex-wrap">
          <button
            onClick={() => setTab("inputs")}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 font-medium"
            style={{ background: "rgba(255,255,255,0.14)", color: "white" }}
          >
            <User size={12} /> {tr("edit_profile")}
          </button>
          <button
            onClick={resetProfile}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 font-medium"
            style={{ background: "rgba(255,255,255,0.14)", color: "white" }}
          >
            <Sparkles size={12} /> {tr("reset_profile")}
          </button>
        </div>
        {toast && <div className="mt-2 text-xs" style={{ color: "#FFC24B" }}>{toast}</div>}
      </div>

      {/* top tab bar: Home / Profile / Forecast / What If */}
      <div className="sticky top-0 z-10 bg-white border-b border-stone-200 flex px-1 pt-2">
        {[
          { id: "home", key: "nav_home", label: "Home" },
          { id: "inputs", key: "nav_inputs", label: "Profile" },
          { id: "results", key: "nav_results", label: "Forecast" },
          { id: "whatif", key: "nav_whatif", label: "What If" },
        ].map((tabDef) => (
          <button
            key={tabDef.id}
            onClick={() => setTab(tabDef.id)}
            className="flex-1 py-2.5 text-[13px] font-semibold rounded-t-lg mx-0.5"
            style={
              tab === tabDef.id
                ? { color: "#231D3B", borderBottom: "3px solid #4C8DFF" }
                : { color: "#A79FC0", borderBottom: "3px solid transparent" }
            }
          >
            {tr(tabDef.key, tabDef.label)}
          </button>
        ))}
      </div>

      {tab === "home" && (
        <div className="px-5 py-6">
          <div className="rounded-3xl p-6 text-center text-white" style={{ background: heroGradient }}>
            <div className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-widest mb-3" style={{ color: "#C9BEEA" }}>
              <Timer size={13} /> {tr("work_clock")}
            </div>
            <div className="flex items-start justify-center gap-3">
              <ClockBlock value={fiY} label="years" />
              <div className="text-2xl pt-1" style={{ color: "#C9BEEA" }}>
                :
              </div>
              <ClockBlock value={fiM} label="months" />
              <div className="text-2xl pt-1" style={{ color: "#C9BEEA" }}>
                :
              </div>
              <ClockBlock value={fiD} label="days" />
            </div>
            <div className="text-sm mt-3" style={{ color: "#C9BEEA" }}>
              {tr("until_ff")}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <SummaryStat label={tr("stat_invested_wealth")} value={fmt(investedWealth, currency)} color="#4C8DFF" />
            <SummaryStat label={tr("stat_annual_spending")} value={fmt(annualSpending, currency)} color="#FF6B5B" />
            <SummaryStat label={tr("stat_real_return")} value={`${realReturn.toFixed(1)}%`} color="#3DDC97" />
            <SummaryStat label={tr("stat_monthly_savings")} value={fmt(monthlySavings, currency)} color="#7C5CFC" />
          </div>

          <div className="mt-4 rounded-2xl p-4" style={{ background: "linear-gradient(120deg, #E9FBF2, #EAF3FF)" }}>
            <div className="text-xs text-stone-500">{tr("fi_label")}</div>
            <div className="text-2xl font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#1B7A4C" }}>
              {fiAge != null ? trAge(language, Math.floor(fiAge)) : tr("fi_not_reached")}
            </div>
            <div className="text-sm font-semibold mt-1" style={{ color: "#1B7A4C" }}>
              {fiAge != null ? trRemaining(language, fiY, fiM, fiD) : tr("fi_add_more")}
            </div>
          </div>

          <button
            onClick={() => setTab("inputs")}
            className="w-full mt-5 rounded-full py-3.5 font-semibold text-white"
            style={{ background: "linear-gradient(90deg, #4C8DFF, #7C5CFC)" }}
          >
            {tr("see_full_plan")}
          </button>

          <p className="text-xs text-stone-400 mt-4 leading-relaxed">
            "Financial Freedom" is the earliest point at which you could stop working and still never run out of
            money through your full life expectancy — tested using the same rules as your Results tab (withdrawal
            order, pension, taxes, mortgages and all), not a rough shortcut. It's an editable estimate, not
            financial advice — tune the assumptions on the Inputs tab.
          </p>
        </div>
      )}

      {tab === "inputs" ? (
        <div>
          <div className="sticky top-[45px] z-10 bg-[#FAF9FE] border-b border-stone-200 px-5 py-3 flex gap-2 overflow-x-auto no-scrollbar">
            {SECTIONS.map((s) => {
              const active = activeSection === s.id;
              const c = SECTION_COLORS[s.id];
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold border transition-colors"
                  style={
                    active
                      ? { background: c, color: "white", borderColor: c }
                      : { background: "white", color: c, borderColor: `${c}55` }
                  }
                >
                  {s.icon}
                  {tr(`section_${s.id}`, s.label)}
                </button>
              );
            })}
          </div>

          <div className="px-5 py-5">
            {activeSection === "profile" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Current age">
                  <NumberInput
                    accent={SECTION_COLORS.profile}
                    value={profile.currentAge}
                    onChange={(v) => setProfile({ ...profile, currentAge: v })}
                  />
                </Field>
                <Field label="Life expectancy">
                  <NumberInput
                    accent={SECTION_COLORS.profile}
                    value={profile.lifeExpectancy}
                    onChange={(v) => setProfile({ ...profile, lifeExpectancy: v })}
                  />
                </Field>
                {profile.lifeExpectancy <= profile.currentAge && (
                  <div className="col-span-2">
                    <Warn>
                      Life expectancy ({profile.lifeExpectancy}) isn't after your current age ({profile.currentAge}) —
                      the simulation won't have any years to run. Set it higher.
                    </Warn>
                  </div>
                )}
                <Field label="Region you live in">
                  <SelectInput
                    value={profile.region}
                    onChange={(v) => {
                      const rd = REGION_DEFAULTS[v] || REGION_DEFAULTS.EU;
                      const newTaxCountry = v === "EU" ? "DE" : v === "US" ? "US_OTHER" : undefined;
                      setProfile({ ...profile, region: v, taxCountry: newTaxCountry, currency: rd.currency });
                      setExpensesState((e) => ({ ...e, inflation: rd.inflation }));
                      setCash((c) => ({ ...c, rate: rd.cashRate, currency: profile.multiCurrency ? c.currency : rd.currency }));
                      setInvestments((prev) => prev.map((i) => (i.type === "house" ? i : { ...i, growthRate: rd.marketReturn })));
                      setRetirement((prev) => prev.map((r) => ({ ...r, growthRate: rd.marketReturn })));
                    }}
                    options={REGIONS.map((r) => ({ value: r, label: REGION_DEFAULTS[r]?.label || r }))}
                  />
                </Field>
                {(profile.region === "EU" || profile.region === "US") && (
                  <Field label={profile.region === "EU" ? "Country (for tax purposes)" : "State (for tax purposes)"}>
                    <SelectInput
                      value={profile.taxCountry || (profile.region === "EU" ? "DE" : "US_OTHER")}
                      onChange={(v) => setProfile({ ...profile, taxCountry: v })}
                      options={profile.region === "EU" ? EU_TAX_COUNTRY_OPTIONS : US_TAX_COUNTRY_OPTIONS}
                    />
                  </Field>
                )}
                <Field label="Main currency (results are shown in this)">
                  <SelectInput
                    value={profile.currency || "EUR"}
                    onChange={(v) => setProfile({ ...profile, currency: v })}
                    options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
                  />
                </Field>
                <Field label="Do you hold money in more than one currency?">
                  <SelectInput
                    value={profile.multiCurrency ? "yes" : "no"}
                    onChange={(v) => {
                      const multi = v === "yes";
                      setProfile({ ...profile, multiCurrency: multi });
                      if (!multi) {
                        setCash((c) => ({ ...c, currency: profile.currency }));
                        setInvestments((prev) => prev.map((i) => ({ ...i, currency: profile.currency })));
                        setRetirement((prev) => prev.map((r) => ({ ...r, currency: profile.currency })));
                        setWork((w) => ({ ...w, currency: profile.currency }));
                      }
                    }}
                    options={[
                      { value: "no", label: "No — everything is in one currency" },
                      { value: "yes", label: "Yes — show currency per account" },
                    ]}
                  />
                </Field>
                {(() => {
                  const resolvedTC = resolveTaxCountry(profile);
                  const supported = isTaxCountrySupported(resolvedTC);
                  return !supported ? (
                    <div className="col-span-2 rounded-xl px-3 py-2.5 text-[11px] leading-relaxed" style={{ background: "#FFF8E7", color: "#8A5A00" }}>
                      ⚠️ We don't have exact tax brackets for this country yet, so your average and dividend tax
                      rates below are fixed numbers you set — they won't automatically adjust as your income
                      changes across the years the way they do for a supported country.
                    </div>
                  ) : null;
                })()}
                <Field label="Average tax rate">
                  <SelectInput
                    value={isTaxCountrySupported(resolveTaxCountry(profile)) ? profile.taxMode ?? "manual" : "manual"}
                    onChange={(v) => setProfile({ ...profile, taxMode: v })}
                    options={
                      isTaxCountrySupported(resolveTaxCountry(profile))
                        ? [
                            { value: "auto", label: `Auto — from ${TAX_TABLES[resolveTaxCountry(profile)]?.label || resolveTaxCountry(profile)}` },
                            { value: "manual", label: "Set my own number" },
                          ]
                        : [{ value: "manual", label: "Fixed number (no bracket table for this country yet)" }]
                    }
                  />
                </Field>
                {(profile.taxMode ?? "manual") === "manual" || !isTaxCountrySupported(resolveTaxCountry(profile)) ? (
                  <Field label="Your average tax rate">
                    <NumberInput
                      accent={SECTION_COLORS.profile}
                      value={profile.taxBracket}
                      suffix="%"
                      onChange={(v) => setProfile({ ...profile, taxBracket: v })}
                    />
                  </Field>
                ) : (
                  <Field label="Current estimate, at today's salary">
                    <div className="rounded-xl bg-white px-4 py-3 text-sm font-semibold shadow-sm" style={{ color: SECTION_COLORS.profile }}>
                      ~{Math.round(computeOrdinaryTaxRate(resolveTaxCountry(profile), work.salary))}%
                    </div>
                  </Field>
                )}
                {((profile.taxMode ?? "manual") === "manual" || !isTaxCountrySupported(resolveTaxCountry(profile))) &&
                  (profile.taxBracket > 65 || profile.taxBracket < 0) && (
                    <div className="col-span-2">
                      <Warn>
                        {profile.taxBracket < 0
                          ? "A negative tax rate isn't meaningful here."
                          : `${profile.taxBracket}% as an AVERAGE (not top-bracket) rate is unusually high — double check this isn't your marginal rate.`}
                      </Warn>
                    </div>
                  )}
                <Field label="Dividend tax rate">
                  <SelectInput
                    value={isTaxCountrySupported(resolveTaxCountry(profile)) ? profile.dividendTaxMode ?? "manual" : "manual"}
                    onChange={(v) => setProfile({ ...profile, dividendTaxMode: v })}
                    options={
                      isTaxCountrySupported(resolveTaxCountry(profile))
                        ? [
                            { value: "auto", label: `Auto — from ${TAX_TABLES[resolveTaxCountry(profile)]?.label || resolveTaxCountry(profile)}` },
                            { value: "manual", label: "Set my own number" },
                          ]
                        : [{ value: "manual", label: "Fixed number (no bracket table for this country yet)" }]
                    }
                  />
                </Field>
                {(profile.dividendTaxMode ?? "manual") === "manual" || !isTaxCountrySupported(resolveTaxCountry(profile)) ? (
                  <Field label="Your dividend tax rate">
                    <NumberInput
                      accent={SECTION_COLORS.profile}
                      value={profile.dividendTaxRate ?? profile.taxBracket}
                      suffix="%"
                      onChange={(v) => setProfile({ ...profile, dividendTaxRate: v })}
                    />
                  </Field>
                ) : (
                  <Field label="Current estimate, at today's salary">
                    <div className="rounded-xl bg-white px-4 py-3 text-sm font-semibold shadow-sm" style={{ color: SECTION_COLORS.profile }}>
                      ~{Math.round(computeDividendTaxRate(resolveTaxCountry(profile), work.salary))}%
                    </div>
                  </Field>
                )}
                <Field label="Capital gains tax rate">
                  <SelectInput
                    value={isTaxCountrySupported(resolveTaxCountry(profile)) ? profile.capitalGainsTaxMode ?? "manual" : "manual"}
                    onChange={(v) => setProfile({ ...profile, capitalGainsTaxMode: v })}
                    options={
                      isTaxCountrySupported(resolveTaxCountry(profile))
                        ? [
                            { value: "auto", label: `Auto — from ${TAX_TABLES[resolveTaxCountry(profile)]?.label || resolveTaxCountry(profile)} rules` },
                            { value: "manual", label: "Set my own number" },
                          ]
                        : [{ value: "manual", label: "Fixed number (no bracket table for this country yet)" }]
                    }
                  />
                </Field>
                {(profile.capitalGainsTaxMode ?? "manual") === "manual" || !isTaxCountrySupported(resolveTaxCountry(profile)) ? (
                  <Field label="Your capital gains tax rate">
                    <NumberInput
                      accent={SECTION_COLORS.profile}
                      value={profile.capitalGainsTaxRate ?? profile.taxBracket}
                      suffix="%"
                      onChange={(v) => setProfile({ ...profile, capitalGainsTaxRate: v })}
                    />
                  </Field>
                ) : (
                  <Field label="Current estimate, at today's salary">
                    <div className="rounded-xl bg-white px-4 py-3 text-sm font-semibold shadow-sm" style={{ color: SECTION_COLORS.profile }}>
                      ~{Math.round(computeCapitalGainsTaxRate(resolveTaxCountry(profile), work.salary))}%
                    </div>
                  </Field>
                )}
              </div>
            )}
            {activeSection === "profile" && (
              <p className="text-xs text-stone-400 mt-2">
                "Average tax rate" is your <strong>average effective rate</strong> — the share of ordinary income
                (salary, pension, rent, cash/CD interest) actually paid in tax overall, not your top marginal
                bracket. In "Auto" mode it's recalculated every simulated year from your country's tax brackets and
                that year's actual income (so it naturally drops once you're retired and living off smaller
                withdrawals) — assuming a single filer with no dependents, slightly conservative where a judgment
                call is needed. Dividends and capital gains (selling an investment or a house) are both taxed
                differently from ordinary income in most countries, so they each get their own rate — see the Info
                page for exactly how each country's capital gains rate is worked out, and what "primary residence"
                sets get exempted. Switch any of the three to "Set my own number" any time to override.
              </p>
            )}
            {activeSection === "profile" && profile.multiCurrency && (
              <div className="mt-4 rounded-xl bg-white p-3 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-stone-600">Exchange rates</div>
                  <div className="text-[11px] text-stone-400">
                    {fxSource === "live" && "Live rates, fetched just now"}
                    {fxSource === "loading" && "Fetching live rates…"}
                    {fxSource === "fallback" && "Using approximate offline rates"}
                  </div>
                </div>
                <button
                  onClick={fetchFxRates}
                  className="text-xs font-semibold rounded-full px-3 py-1.5"
                  style={{ background: `${SECTION_COLORS.profile}1A`, color: SECTION_COLORS.profile }}
                >
                  Refresh
                </button>
              </div>
            )}
            {activeSection === "profile" && (
              <p className="text-xs text-stone-400 mt-3">
                Every investment, retirement account, and your cash can each be set to a different currency (on
                their own tabs) — everything gets converted to your base currency above for all totals and
                calculations.
              </p>
            )}

            {activeSection === "income" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Annual salary (gross)">
                  <NumberInput accent={SECTION_COLORS.income} value={work.salary} onChange={(v) => setWork({ ...work, salary: v })} />
                </Field>
                {profile.multiCurrency && (
                  <Field label="Salary currency">
                    <SelectInput
                      value={work.currency || currency}
                      onChange={(v) => setWork({ ...work, currency: v })}
                      options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
                    />
                  </Field>
                )}
                <Field label="Years still working">
                  <NumberInput
                    accent={SECTION_COLORS.income}
                    value={work.yearsWorking}
                    onChange={(v) => setWork({ ...work, yearsWorking: v })}
                  />
                </Field>
                <Field label="Salary growth">
                  <NumberInput
                    accent={SECTION_COLORS.income}
                    value={work.salaryGrowth}
                    suffix="%/yr"
                    onChange={(v) => setWork({ ...work, salaryGrowth: v })}
                  />
                </Field>
                <Field label="Monthly expenses (non including mortgages)">
                  <NumberInput
                    accent={SECTION_COLORS.income}
                    value={expensesState.monthly}
                    onChange={(v) => setExpensesState({ ...expensesState, monthly: v })}
                  />
                </Field>
                <Field label="Inflation">
                  <NumberInput
                    accent={SECTION_COLORS.income}
                    value={expensesState.inflation}
                    suffix="%/yr"
                    onChange={(v) => setExpensesState({ ...expensesState, inflation: v })}
                  />
                </Field>
              </div>
            )}

            {activeSection === "income" && (
              <div className="mt-4">
                <Field label="Does your spending decline as you age?">
                  <SelectInput
                    value={expensesState.spendingDecline?.enabled ? "yes" : "no"}
                    onChange={(v) =>
                      setExpensesState({ ...expensesState, spendingDecline: { enabled: v === "yes" } })
                    }
                    options={[
                      { value: "no", label: "No — same real spending every year" },
                      { value: "yes", label: "Yes — spending eases off through retirement" },
                    ]}
                  />
                </Field>
                {expensesState.spendingDecline?.enabled && (
                  <p className="text-xs text-stone-400 -mt-1 leading-relaxed">
                    Research-based: living expenses (not mortgage/rent) fall ~1%/yr in real terms for your first
                    10 years of retirement, ~2%/yr for the next 9, then level off — roughly a 25% total reduction
                    by ~19 years in, matching typical "go‑go / slow‑go / no‑go" retiree spending. See the Info
                    page for the research behind this.
                  </p>
                )}
              </div>
            )}

            {activeSection === "income" && (
              <p className="text-xs text-stone-400 mt-3 leading-relaxed">
                <strong>Years still working</strong> controls everything time-limited: once it runs out, salary
                stops, and so do all contributions (set per account on the Investments and Retirement tabs) and
                mortgage payments — e.g. set it to 5 and nothing is added to any account from year 6 onward.
                <br />
                <strong>Monthly expenses</strong> above does <strong>not</strong> include mortgage payments —
                those are set per property on the Investments tab and handled separately. Rental income there
                grows with inflation every year; mortgage payments never do.
              </p>
            )}

            {activeSection === "cash" && (
              <div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Cash on hand">
                    <NumberInput accent={SECTION_COLORS.cash} value={cash.amount} onChange={(v) => setCash({ ...cash, amount: v })} />
                  </Field>
                  {profile.multiCurrency && (
                    <Field label="Currency">
                      <SelectInput
                        value={cash.currency || currency}
                        onChange={(v) => setCash({ ...cash, currency: v })}
                        options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
                      />
                    </Field>
                  )}
                  <Field label="Interest rate">
                    <NumberInput
                      accent={SECTION_COLORS.cash}
                      value={cash.rate}
                      suffix="%/yr"
                      onChange={(v) => setCash({ ...cash, rate: v })}
                    />
                  </Field>
                </div>
                <p className="text-xs text-stone-400 -mt-1 mb-1">
                  Defaults to 0% — a regular checking or savings account pays little to nothing almost everywhere
                  today. If you actually have a better rate (a proper savings account, a term account, or — if
                  you're in France — a tax-free Livret A / LDDS, which pays a government-set rate on a capped
                  balance) just enter it here; that nuance isn't modeled separately, only the flat rate is.
                </p>

                <h3 className="text-xs font-semibold uppercase tracking-wide mt-6 mb-1" style={{ color: "#8A81A6" }}>
                  Where leftover income goes
                </h3>
                <p className="text-xs text-stone-400 mb-3">
                  Any surplus after expenses — salary, pension, rent, dividends — splits between cash and an
                  investment, based on how much cash you already hold.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Keep at least">
                    <NumberInput
                      accent={SECTION_COLORS.cash}
                      value={savingsRule.minCash}
                      onChange={(v) => setSavingsRule({ ...savingsRule, minCash: v })}
                    />
                  </Field>
                  <Field label="Keep at most">
                    <NumberInput
                      accent={SECTION_COLORS.cash}
                      value={savingsRule.maxCash}
                      onChange={(v) => setSavingsRule({ ...savingsRule, maxCash: v })}
                    />
                  </Field>
                  <Field label="% of surplus kept as cash">
                    <NumberInput
                      accent={SECTION_COLORS.cash}
                      value={savingsRule.cashPercent}
                      suffix="%"
                      onChange={(v) => setSavingsRule({ ...savingsRule, cashPercent: v })}
                    />
                  </Field>
                  <Field label="Rest goes into">
                    <SelectInput
                      value={effectiveSavingsRule.targetInvestmentId || ""}
                      onChange={(v) => setSavingsRule({ ...savingsRule, targetInvestmentId: v })}
                      options={
                        investments.filter((i) => i.type !== "house").length
                          ? investments.filter((i) => i.type !== "house").map((i) => ({ value: i.id, label: i.name || "Investment" }))
                          : [{ value: "", label: "No investments yet" }]
                      }
                    />
                  </Field>
                </div>
                <p className="text-xs text-stone-400 mt-2">
                  Below the minimum, everything is kept as cash first. Above the maximum, everything goes to the
                  investment instead. In between, it splits by the % above.
                </p>
              </div>
            )}

            {activeSection === "investments" && (
              <div>
                {investments.map((inv, idx) => {
                  const color = invColor(inv.id);
                  const equity = Math.max(0, inv.amount - (inv.mortgageBalance || 0));
                  const pctPaid = inv.amount > 0 ? Math.round((equity / inv.amount) * 100) : 0;
                  const mode = inv.mortgageInputMode || "rate";
                  return (
                    <div
                      key={inv.id}
                      className="rounded-xl bg-white p-3.5 mb-3 shadow-sm"
                      style={{ borderLeft: `4px solid ${color}` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                          Investment {idx + 1}
                        </span>
                        <button onClick={() => removeInvestment(inv.id)} className="text-stone-300 hover:text-rose-500">
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <Field label="Name">
                        <TextInput value={inv.name} onChange={(v) => updateInvestment(inv.id, { name: v })} />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Type">
                          <SelectInput
                            value={inv.type}
                            onChange={(v) => {
                              const rd = REGION_DEFAULTS[profile.region] || REGION_DEFAULTS.EU;
                              const patch = { type: v };
                              if (v === "cd" && inv.type !== "cd") {
                                patch.growthRate = rd.cdRate;
                                patch.cdLongRunRate = rd.cdRateLongRun;
                                patch.cdTenorYears = inv.cdTenorYears ?? 1;
                              }
                              if (v !== "cd" && inv.type === "cd") patch.growthRate = rd.marketReturn;
                              updateInvestment(inv.id, patch);
                            }}
                            options={[
                              { value: "market", label: "Market (growth)" },
                              { value: "dividend", label: "Dividend-producing" },
                              { value: "cd", label: "CD / term deposit (fixed rate)" },
                              { value: "house", label: "House / property" },
                            ]}
                          />
                        </Field>
                        <Field label="Region">
                          <SelectInput
                            value={inv.region}
                            onChange={(v) => updateInvestment(inv.id, { region: v })}
                            options={REGIONS.map((r) => ({ value: r, label: r }))}
                          />
                        </Field>
                        {profile.multiCurrency && (
                          <Field label="Currency">
                            <SelectInput
                              value={inv.currency || currency}
                              onChange={(v) => updateInvestment(inv.id, { currency: v })}
                              options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
                            />
                          </Field>
                        )}
                        <Field label={inv.type === "house" ? "Current market value" : "Current value"}>
                          <NumberInput accent={color} value={inv.amount} onChange={(v) => updateInvestment(inv.id, { amount: v })} />
                        </Field>
                        <Field label={inv.type === "dividend" ? "Price growth rate" : inv.type === "cd" ? "Fixed interest rate (today's rate)" : "Growth rate"}>
                          <NumberInput
                            accent={color}
                            value={inv.growthRate}
                            suffix="%/yr"
                            onChange={(v) => updateInvestment(inv.id, { growthRate: v })}
                          />
                        </Field>
                        {(() => {
                          const gr = inv.growthRate;
                          const hi = inv.type === "cd" ? 12 : inv.type === "house" ? 15 : 20;
                          const lo = inv.type === "cd" ? 0 : inv.type === "house" ? -10 : -15;
                          if (gr > hi) {
                            return (
                              <div className="col-span-2">
                                <Warn>
                                  {gr}%/yr is a very high {inv.type === "cd" ? "fixed rate" : inv.type === "house" ? "appreciation rate" : "growth rate"} to
                                  sustain long-term — double check this isn't a typo.
                                </Warn>
                              </div>
                            );
                          }
                          if (gr < lo) {
                            return (
                              <div className="col-span-2">
                                <Warn>{gr}%/yr is an unusually large sustained decline — double check this isn't a typo.</Warn>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        {inv.type === "cd" && (
                          <>
                            <Field label="Locked in for">
                              <NumberInput
                                accent={color}
                                value={inv.cdTenorYears ?? 1}
                                suffix="yrs"
                                onChange={(v) => updateInvestment(inv.id, { cdTenorYears: v })}
                              />
                            </Field>
                            <Field label="Long-run rate (once it converges)">
                              <NumberInput
                                accent={color}
                                value={inv.cdLongRunRate ?? Math.max(0, expensesState.inflation - 0.5)}
                                suffix="%/yr"
                                onChange={(v) => updateInvestment(inv.id, { cdLongRunRate: v })}
                              />
                            </Field>
                          </>
                        )}
                        {inv.type === "cd" && (
                          <p className="text-xs text-stone-400 col-span-2 -mt-1 mb-2">
                            Once the lock-in ends, the rate glides down (or up) to the long-run rate over about 5
                            years — it doesn't stay at today's rate forever. See the Info page for why.
                          </p>
                        )}
                        {inv.type === "dividend" && (
                          <Field label="Dividend yield">
                            <NumberInput
                              accent={color}
                              value={inv.dividendYield || 0}
                              suffix="%/yr"
                              onChange={(v) => updateInvestment(inv.id, { dividendYield: v })}
                            />
                          </Field>
                        )}
                        {inv.type === "dividend" && (inv.dividendYield || 0) > 15 && (
                          <div className="col-span-2">
                            <Warn>A {inv.dividendYield}% dividend yield is very high — sustained yields this large are rare. Double check this.</Warn>
                          </div>
                        )}
                        {inv.type !== "house" && (
                          <Field label="Cost basis (amount originally invested)">
                            <NumberInput
                              accent={color}
                              value={inv.costBasis ?? inv.amount}
                              onChange={(v) => updateInvestment(inv.id, { costBasis: v })}
                            />
                          </Field>
                        )}
                      </div>

                      {inv.type !== "house" && (
                        <p className="text-xs text-stone-400 -mt-1 mb-2">
                          Only the gain above this (current value minus cost basis) is taxed when sold.
                        </p>
                      )}

                      {inv.type !== "house" && (
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Ongoing contribution">
                            <NumberInput
                              accent={color}
                              value={inv.contribution || 0}
                              onChange={(v) => updateInvestment(inv.id, { contribution: v })}
                            />
                          </Field>
                          <Field label="Frequency">
                            <SelectInput
                              value={inv.contributionFrequency || "monthly"}
                              onChange={(v) => updateInvestment(inv.id, { contributionFrequency: v })}
                              options={[
                                { value: "monthly", label: "Per month" },
                                { value: "yearly", label: "Per year" },
                              ]}
                            />
                          </Field>
                        </div>
                      )}

                      {inv.type === "house" && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Usage">
                              <SelectInput
                                value={inv.usage || "primary"}
                                onChange={(v) => updateInvestment(inv.id, { usage: v })}
                                options={[
                                  { value: "primary", label: "Primary residence" },
                                  { value: "rental", label: "Rented out" },
                                ]}
                              />
                            </Field>
                            {inv.usage === "rental" && (
                              <Field label="Monthly rent (grows with inflation)">
                                <NumberInput accent={color} value={inv.rent || 0} onChange={(v) => updateInvestment(inv.id, { rent: v })} />
                              </Field>
                            )}
                          </div>

                          <Field label="Can this property be sold to cover expenses?">
                            <SelectInput
                              value={inv.sellable === false ? "no" : "yes"}
                              onChange={(v) => updateInvestment(inv.id, { sellable: v === "yes" })}
                              options={[
                                { value: "yes", label: "Yes — include in withdrawal order" },
                                { value: "no", label: "No — never sell (e.g. primary home)" },
                              ]}
                            />
                          </Field>

                          {inv.usage !== "rental" && inv.sellable !== false && (
                            <p className="text-xs -mt-1 mb-3 leading-relaxed" style={{ color: "#5A8A6B" }}>
                              🏡 {primaryResidenceExemptionNote(resolveTaxCountry(profile), currency)}
                            </p>
                          )}

                          <Field label="Mortgage balance remaining">
                            <NumberInput
                              accent={color}
                              value={inv.mortgageBalance || 0}
                              onChange={(v) => updateMortgage(inv, { mortgageBalance: v })}
                            />
                          </Field>
                          <p className="text-xs text-stone-400 -mt-1 mb-2">
                            ≈ {fmt(equity, currency)} equity so far ({pctPaid}% paid off).
                          </p>

                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Monthly mortgage payment (fixed, never inflated)">
                              <NumberInput
                                accent={color}
                                value={inv.mortgagePayment || 0}
                                onChange={(v) => updateMortgage(inv, { mortgagePayment: v })}
                              />
                            </Field>
                            <Field label="Rate type">
                              <SelectInput
                                value={inv.mortgageRateType || "fixed"}
                                onChange={(v) => updateInvestment(inv.id, { mortgageRateType: v })}
                                options={[
                                  { value: "fixed", label: "Fixed" },
                                  { value: "floating", label: "Floating" },
                                ]}
                              />
                            </Field>
                          </div>

                          {(() => {
                            const balance = inv.mortgageBalance || 0;
                            if (balance <= 0) return null;
                            const effRate = (inv.mortgageRateType || "fixed") === "floating" ? cash.rate : inv.mortgageRate || 0;
                            const annualInterest = balance * (effRate / 100);
                            const annualPayment = (inv.mortgagePayment || 0) * 12;
                            if (annualPayment >= annualInterest) return null;
                            return (
                              <Warn>
                                This payment doesn't cover the interest on the remaining balance — at this rate,
                                the balance would GROW by ≈ {fmt(annualInterest - annualPayment, currency)}/yr instead of
                                shrinking. Double check the payment or rate.
                              </Warn>
                            );
                          })()}

                          {(inv.mortgageRateType || "fixed") === "fixed" ? (
                            <>
                              <Field label="I know:">
                                <SelectInput
                                  value={mode}
                                  onChange={(v) => {
                                    if (v === "years") {
                                      const implied = solveMortgageYears(inv.mortgageBalance || 0, inv.mortgagePayment || 0, inv.mortgageRate || 0);
                                      updateInvestment(inv.id, {
                                        mortgageInputMode: v,
                                        mortgageYearsLeft: isFinite(implied) ? round2(implied) : inv.mortgageYearsLeft || 10,
                                      });
                                    } else {
                                      updateInvestment(inv.id, { mortgageInputMode: v });
                                    }
                                  }}
                                  options={[
                                    { value: "rate", label: "Interest rate" },
                                    { value: "years", label: "Years remaining" },
                                  ]}
                                />
                              </Field>
                              {mode === "rate" ? (
                                <>
                                  <Field label="Interest rate">
                                    <NumberInput
                                      accent={color}
                                      value={inv.mortgageRate || 0}
                                      suffix="%/yr"
                                      onChange={(v) => updateInvestment(inv.id, { mortgageRate: v })}
                                    />
                                  </Field>
                                  <p className="text-xs text-stone-400 mb-3">
                                    ≈ {formatYears(solveMortgageYears(inv.mortgageBalance || 0, inv.mortgagePayment || 0, inv.mortgageRate || 0))} remaining
                                    at this rate and payment.
                                  </p>
                                </>
                              ) : (
                                <>
                                  <Field label="Years remaining">
                                    <NumberInput
                                      accent={color}
                                      value={inv.mortgageYearsLeft || 0}
                                      suffix="yrs"
                                      onChange={(v) => updateMortgage(inv, { mortgageYearsLeft: v })}
                                    />
                                  </Field>
                                  <p className="text-xs text-stone-400 mb-3">≈ {(inv.mortgageRate || 0).toFixed(2)}% implied interest rate.</p>
                                </>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-stone-400 mb-3">
                              ⚠️ Floating rates aren't actually simulated as changing year to year yet — this is
                              locked in at today's Cash section interest rate ({cash.rate}%/yr) for the life of the
                              loan, same as a fixed rate. ≈{" "}
                              {formatYears(solveMortgageYears(inv.mortgageBalance || 0, inv.mortgagePayment || 0, cash.rate))} remaining at that rate.
                            </p>
                          )}

                          <button
                            onClick={() => setMortgageScheduleModalId(inv.id)}
                            className="w-full flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 mb-3 text-xs font-semibold border"
                            style={{ borderColor: `${color}55`, color }}
                          >
                            <Table2 size={13} /> See full payment schedule
                          </button>

                          <button
                            onClick={() => setExpandedAdvanced((prev) => ({ ...prev, [inv.id]: !prev[inv.id] }))}
                            className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 mb-2 text-xs font-semibold"
                            style={{ background: `${color}14`, color }}
                          >
                            <span>Advanced — purchase price, selling fee, plan after sale</span>
                            {expandedAdvanced[inv.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>

                          {expandedAdvanced[inv.id] && (
                            <>
                              <div className="grid grid-cols-2 gap-3">
                                <Field label="Purchase price (bought value)">
                                  <NumberInput
                                    accent={color}
                                    value={inv.purchasePrice ?? inv.amount}
                                    onChange={(v) => updateInvestment(inv.id, { purchasePrice: v })}
                                  />
                                </Field>
                                <Field label="Agency / selling fee">
                                  <NumberInput
                                    accent={color}
                                    value={inv.sellingFeePercent ?? 4}
                                    suffix="% of sale"
                                    onChange={(v) => updateInvestment(inv.id, { sellingFeePercent: v })}
                                  />
                                </Field>
                              </div>
                              <p className="text-xs text-stone-400 -mt-1 mb-2">
                                Only the gain above the purchase price is taxed when sold.
                              </p>

                              {inv.sellable !== false && (() => {
                                const effAction =
                                  inv.usage !== "rental" && (!inv.postSaleAction || inv.postSaleAction === "none")
                                    ? "rent"
                                    : inv.postSaleAction;
                                return (
                                  <>
                                    {inv.usage !== "rental" && (
                                      <Field label="After selling, what happens?">
                                        <SelectInput
                                          value={effAction}
                                          onChange={(v) => updateInvestment(inv.id, { postSaleAction: v })}
                                          options={[
                                            { value: "rebuy", label: "Buy a new home for a set amount" },
                                            { value: "resize", label: "Buy something worth a multiple of the sale price" },
                                            { value: "rent", label: "Rent afterward" },
                                          ]}
                                        />
                                      </Field>
                                    )}
                                    {inv.usage !== "rental" && effAction === "rebuy" && (
                                      <Field label="Value of the new home to re-buy">
                                        <NumberInput
                                          accent={color}
                                          value={inv.rebuyValue || 0}
                                          onChange={(v) => updateInvestment(inv.id, { rebuyValue: v })}
                                        />
                                      </Field>
                                    )}
                                    {inv.usage !== "rental" && effAction === "resize" && (
                                      <Field label="Resize factor (0.5 = half, 2 = double)">
                                        <NumberInput
                                          accent={color}
                                          value={inv.resizeFactor ?? 1}
                                          suffix="×"
                                          onChange={(v) => updateInvestment(inv.id, { resizeFactor: v })}
                                        />
                                      </Field>
                                    )}
                                    {inv.usage !== "rental" && effAction === "rent" && (
                                      <Field label="Monthly rent after the sale (grows with inflation)">
                                        <NumberInput
                                          accent={color}
                                          value={inv.postSaleRent || 0}
                                          onChange={(v) => updateInvestment(inv.id, { postSaleRent: v })}
                                        />
                                      </Field>
                                    )}
                                    {(inv.usage === "rental" || effAction === "rent") && (
                                      <>
                                        <Field label="What should happen to the money?">
                                          <SelectInput
                                            value={inv.reinvestAs || "cash"}
                                            onChange={(v) => updateInvestment(inv.id, { reinvestAs: v })}
                                            options={[
                                              { value: "cash", label: "Keep as cash" },
                                              { value: "cd", label: "Put it in a CD" },
                                              { value: "market", label: "Invest it in the market" },
                                            ]}
                                          />
                                        </Field>
                                        {(inv.reinvestAs === "cd" || inv.reinvestAs === "market") && (
                                          <Field label={inv.reinvestAs === "cd" ? "CD interest rate" : "Expected market return"}>
                                            <NumberInput
                                              accent={color}
                                              value={inv.reinvestRate || 0}
                                              suffix="%/yr"
                                              onChange={(v) => updateInvestment(inv.id, { reinvestRate: v })}
                                            />
                                          </Field>
                                        )}
                                      </>
                                    )}
                                    {inv.usage !== "rental" && (effAction === "rebuy" || effAction === "resize" || effAction === "rent") && (
                                      <p className="text-xs text-stone-400 -mt-1 mb-2">
                                        When this property is sold, 100% of its equity is liquidated that year (not just
                                        what's needed), and this plan kicks in immediately.
                                      </p>
                                    )}
                                  </>
                                );
                              })()}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={addInvestment}
                  className="w-full flex items-center justify-center gap-1.5 rounded-full text-sm font-semibold py-3"
                  style={{ background: `${SECTION_COLORS.investments}1A`, color: "#8A5A00" }}
                >
                  <Plus size={15} /> Add investment
                </button>
                <p className="text-xs text-stone-400 mt-3">
                  When funds are needed, holdings with the lowest growth rate are sold first so your best
                  performers keep compounding.
                </p>
              </div>
            )}

            {activeSection === "retirement" && (
              <div>
                <div className="rounded-xl bg-white p-3.5 mb-4 shadow-sm" style={{ borderLeft: `4px solid ${SECTION_COLORS.retirement}` }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-semibold" style={{ color: SECTION_COLORS.retirement }}>
                      State / employer pension
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-stone-500">
                      <input
                        type="checkbox"
                        checked={pension.enabled !== false}
                        onChange={(e) => setPension({ ...pension, enabled: e.target.checked })}
                      />
                      I have one
                    </label>
                  </div>
                  {pension.enabled !== false ? (
                    <>
                      <p className="text-xs text-stone-400 mb-3">
                        A recurring income that kicks in at a set age, as a percentage of your last working salary.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Starts at age">
                          <NumberInput
                            accent={SECTION_COLORS.retirement}
                            value={pension.startAge}
                            onChange={(v) => setPension({ ...pension, startAge: v })}
                          />
                        </Field>
                        <Field label="% of final salary">
                          <NumberInput
                            accent={SECTION_COLORS.retirement}
                            value={pension.percentOfSalary}
                            suffix="%"
                            onChange={(v) => setPension({ ...pension, percentOfSalary: v })}
                          />
                        </Field>
                      </div>
                      <Field label="Does it rise with inflation?">
                        <SelectInput
                          value={pension.indexed ? "yes" : "no"}
                          onChange={(v) => setPension({ ...pension, indexed: v === "yes" })}
                          options={[
                            { value: "yes", label: "Yes — indexed to inflation (most state pensions)" },
                            { value: "no", label: "No — fixed amount forever" },
                          ]}
                        />
                      </Field>
                      <Field label="Reduce it if I stop working early?">
                        <SelectInput
                          value={pension.proRata === false ? "no" : "yes"}
                          onChange={(v) => setPension({ ...pension, proRata: v === "yes" })}
                          options={[
                            { value: "yes", label: "Yes — scale by years contributed (realistic)" },
                            { value: "no", label: "No — always pay the full amount" },
                          ]}
                        />
                      </Field>
                      {pension.proRata !== false && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="I started working at">
                              <NumberInput
                                accent={SECTION_COLORS.retirement}
                                value={pension.careerStartAge ?? 25}
                                onChange={(v) => setPension({ ...pension, careerStartAge: v })}
                              />
                            </Field>
                            <Field label="Full pension needs work until">
                              <NumberInput
                                accent={SECTION_COLORS.retirement}
                                value={pension.fullPensionAge ?? 65}
                                onChange={(v) => setPension({ ...pension, fullPensionAge: v })}
                              />
                            </Field>
                          </div>
                          <div className="rounded-xl px-3 py-2.5 text-[11px] leading-relaxed mb-3" style={{ background: "#FFF8E7", color: "#8A5A00" }}>
                            ⚠️ <strong>Rough estimate.</strong> Most state pensions pay less if you contribute
                            fewer years. We assume a full pension needs {(pension.fullPensionAge ?? 65) - (pension.careerStartAge ?? 25)} years
                            of contributions (age {pension.careerStartAge ?? 25}–{pension.fullPensionAge ?? 65}), and scale
                            proportionally. On your current plan that's{" "}
                            <strong>
                              {Math.max(0, profile.currentAge - (pension.careerStartAge ?? 25)) + Math.max(0, work.yearsWorking)} years
                              contributed →{" "}
                              {Math.round(
                                Math.max(
                                  0,
                                  Math.min(
                                    1,
                                    (Math.max(0, profile.currentAge - (pension.careerStartAge ?? 25)) + Math.max(0, work.yearsWorking)) /
                                      Math.max(1, (pension.fullPensionAge ?? 65) - (pension.careerStartAge ?? 25))
                                  )
                                ) * 100
                              )}
                              % of the full pension
                            </strong>
                            . Real systems (UK 35 qualifying years, France's 43, US Social Security's top-35
                            average) all differ in the details — check your own before relying on this.
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-stone-400">No pension included in the simulation.</p>
                  )}
                </div>

                {retirement.map((r, idx) => {
                  const color = retColor(r.id);
                  return (
                    <div
                      key={r.id}
                      className="rounded-xl bg-white p-3.5 mb-3 shadow-sm"
                      style={{ borderLeft: `4px solid ${color}` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                          Account {idx + 1}
                        </span>
                        <button onClick={() => removeRetirement(r.id)} className="text-stone-300 hover:text-rose-500">
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <Field label="Name">
                        <TextInput value={r.name} onChange={(v) => updateRetirement(r.id, { name: v })} />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Current balance">
                          <NumberInput accent={color} value={r.amount} onChange={(v) => updateRetirement(r.id, { amount: v })} />
                        </Field>
                        {profile.multiCurrency && (
                          <Field label="Currency">
                            <SelectInput
                              value={r.currency || currency}
                              onChange={(v) => updateRetirement(r.id, { currency: v })}
                              options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
                            />
                          </Field>
                        )}
                        <Field label="Growth rate">
                          <NumberInput
                            accent={color}
                            value={r.growthRate}
                            suffix="%/yr"
                            onChange={(v) => updateRetirement(r.id, { growthRate: v })}
                          />
                        </Field>
                        <Field label="Minimum withdrawal age">
                          <NumberInput accent={color} value={r.minAge || 0} onChange={(v) => updateRetirement(r.id, { minAge: v })} />
                        </Field>
                        <Field label="Annual contribution">
                          <NumberInput
                            accent={color}
                            value={r.contribution || 0}
                            onChange={(v) => updateRetirement(r.id, { contribution: v })}
                          />
                        </Field>
                      </div>
                      <Field label="Tax treatment">
                        <SelectInput
                          value={r.taxTreatment || "pretax"}
                          onChange={(v) => updateRetirement(r.id, { taxTreatment: v })}
                          options={[
                            { value: "pretax", label: "Taxed when withdrawn (e.g. 401(k), traditional IRA)" },
                            { value: "posttax", label: "Already taxed — tax-free withdrawal (e.g. Roth)" },
                          ]}
                        />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Allow withdrawals before minimum age?">
                          <SelectInput
                            value={r.earlyAccessAllowed ? "yes" : "no"}
                            onChange={(v) => updateRetirement(r.id, { earlyAccessAllowed: v === "yes" })}
                            options={[
                              { value: "no", label: "No — locked until min. age" },
                              { value: "yes", label: "Yes — with a penalty" },
                            ]}
                          />
                        </Field>
                        {r.earlyAccessAllowed && (
                          <Field label="Early withdrawal penalty">
                            <NumberInput
                              accent={color}
                              value={r.earlyPenalty || 0}
                              suffix="%"
                              onChange={(v) => updateRetirement(r.id, { earlyPenalty: v })}
                            />
                          </Field>
                        )}
                      </div>
                    </div>
                  );
                })}
                <button
                  onClick={addRetirement}
                  className="w-full flex items-center justify-center gap-1.5 rounded-full text-sm font-semibold py-3"
                  style={{ background: `${SECTION_COLORS.retirement}1A`, color: "#1E4FA8" }}
                >
                  <Plus size={15} /> Add account
                </button>
              </div>
            )}

            {activeSection === "lumpsums" && (
              <div>
                <p className="text-xs text-stone-500 mb-3">
                  A one-time amount received (positive) or paid (negative) at a specific age — an inheritance, a
                  bonus, a wedding, a tax bill, moving costs, and so on.
                </p>
                {lumpSums.map((ls, idx) => {
                  const color = SECTION_COLORS.lumpsums;
                  const magnitude = Math.abs(ls.amount || 0);
                  const type = (ls.amount || 0) < 0 ? "pay" : "receive";
                  const outOfRange = Math.round(ls.age) < profile.currentAge || Math.round(ls.age) > profile.lifeExpectancy;
                  return (
                    <div key={ls.id} className="rounded-xl bg-white p-3.5 mb-3 shadow-sm" style={{ borderLeft: `4px solid ${color}` }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-stone-400">Lump sum {idx + 1}</span>
                        <button onClick={() => removeLumpSum(ls.id)} className="text-stone-300 hover:text-rose-500">
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <Field label="Name">
                        <TextInput value={ls.name} onChange={(v) => updateLumpSum(ls.id, { name: v })} />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="At age">
                          <NumberInput accent={color} value={ls.age} onChange={(v) => updateLumpSum(ls.id, { age: v })} />
                        </Field>
                        <Field label="Type">
                          <SelectInput
                            value={type}
                            onChange={(v) => updateLumpSum(ls.id, { amount: (v === "pay" ? -1 : 1) * magnitude })}
                            options={[
                              { value: "receive", label: "Receive" },
                              { value: "pay", label: "Pay" },
                            ]}
                          />
                        </Field>
                      </div>
                      <Field label="Amount">
                        <NumberInput
                          accent={color}
                          value={magnitude}
                          suffix={currency}
                          onChange={(v) => updateLumpSum(ls.id, { amount: (type === "pay" ? -1 : 1) * Math.abs(v) })}
                        />
                      </Field>
                      {outOfRange && (
                        <div className="rounded-lg px-2.5 py-2 text-[11px] font-medium" style={{ background: "#FFF1EC", color: "#B23A22" }}>
                          ⚠️ Age {Math.round(ls.age)} is outside your simulated range ({profile.currentAge}–
                          {profile.lifeExpectancy}), so this lump sum is being ignored.
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={addLumpSum}
                  className="w-full flex items-center justify-center gap-1.5 rounded-full text-sm font-semibold py-3"
                  style={{ background: `${SECTION_COLORS.lumpsums}1A`, color: "#0369A1" }}
                >
                  <Plus size={15} /> Add lump sum
                </button>
                <p className="text-xs text-stone-400 mt-3">Lump sums are added or subtracted at face value — not taxed or inflation-adjusted.</p>
              </div>
            )}

            {activeSection === "order" && (
              <div>
                <p className="text-xs text-stone-500 mb-3">
                  When expenses exceed income, funds are pulled in exactly this order — reorder any individual
                  investment, retirement account, or sellable property. Retirement accounts still respect their
                  own minimum age and early-access rules; a house marked "not sellable" never appears here.
                </p>
                {withdrawalOrder.map((entry, idx) => {
                  const { type, id } = parseOrderEntry(entry);
                  let label = "Cash";
                  let color = SECTION_COLORS.cash;
                  if (type === "investment") {
                    const inv = investments.find((i) => i.id === id);
                    label = inv ? inv.name || "Investment" : "(removed investment)";
                    color = inv ? invColor(id) : "#C7C2D9";
                  } else if (type === "retirement") {
                    const r = retirement.find((x) => x.id === id);
                    label = r ? r.name || "Retirement account" : "(removed account)";
                    color = r ? retColor(id) : "#C7C2D9";
                  } else if (type === "house") {
                    const inv = investments.find((i) => i.id === id);
                    label = inv ? `${inv.name || "Property"} (sell)` : "(removed property)";
                    color = inv ? invColor(id) : "#C7C2D9";
                  }
                  return (
                    <div
                      key={entry}
                      className="flex items-center justify-between rounded-xl bg-white px-3.5 py-3 mb-2 shadow-sm"
                      style={{ borderLeft: `4px solid ${color}` }}
                    >
                      <span className="text-sm font-medium flex items-center gap-2">
                        <span className="text-stone-400 text-xs">{idx + 1}.</span> {label}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveWithdrawal(idx, -1)}
                          className="text-stone-300 hover:text-[#FF5C93] disabled:opacity-30"
                          disabled={idx === 0}
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          onClick={() => moveWithdrawal(idx, 1)}
                          className="text-stone-300 hover:text-[#FF5C93] disabled:opacity-30"
                          disabled={idx === withdrawalOrder.length - 1}
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : tab === "results" ? (
        <div className="px-5 py-5">
          <div className="rounded-2xl bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2 className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Balance by bucket, per year
              </h2>
              <div className="shrink-0 flex rounded-full p-0.5" style={{ background: "#F2EFFB" }}>
                <button
                  onClick={() => setRealTermsView(false)}
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors"
                  style={!realTermsView ? { background: "white", color: "#4C8DFF", boxShadow: "0 1px 2px rgba(0,0,0,0.08)" } : { color: "#9B93B8" }}
                >
                  Future $
                </button>
                <button
                  onClick={() => setRealTermsView(true)}
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors"
                  style={realTermsView ? { background: "white", color: "#4C8DFF", boxShadow: "0 1px 2px rgba(0,0,0,0.08)" } : { color: "#9B93B8" }}
                >
                  Today's $
                </button>
              </div>
            </div>
            <p className="text-xs text-stone-400 mb-3">
              {realTermsView ? (
                <>
                  Showing <strong>today's money</strong> — every future year's numbers have inflation stripped back
                  out, so you can compare them directly to prices today. This is usually the more honest view of
                  whether you're actually getting ahead.
                </>
              ) : (
                <>
                  Showing <strong>future dollars</strong> — the actual numbers you'd see in your accounts each year,
                  growing partly because of inflation, not just real growth. Switch to "Today's $" to strip that
                  out.
                </>
              )}{" "}
              Tap any point on the chart to see what changed that year.
              {seriesKeys.includes("Debt") && " Mortgage debt is shown as a red band below zero, not just netted out of a property's equity."}
            </p>
            <ResponsiveContainer width="100%" height={340}>
              <AreaChart
                data={displayYears}
                margin={{ top: 5, right: 5, left: 0, bottom: 12 }}
                onClick={(state) => {
                  if (state && state.activeLabel != null) setSelectedAge(state.activeLabel);
                }}
                style={{ cursor: "pointer" }}
              >
                <defs>
                  {seriesKeys.map((key, idx) => (
                    <linearGradient key={key} id={`fill-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colorForSeries(key, idx)} stopOpacity={key === "Debt" ? 0.55 : 0.7} />
                      <stop offset="95%" stopColor={colorForSeries(key, idx)} stopOpacity={key === "Debt" ? 0.15 : 0.08} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEE9F7" />
                <XAxis
                  dataKey="age"
                  ticks={xTicks}
                  interval={0}
                  tick={{ fontSize: 11, fill: "#8A81A6" }}
                  label={{ value: "Age", position: "insideBottom", offset: -3, fontSize: 11, fill: "#8A81A6" }}
                />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: "#8A81A6" }} width={45} />
                <Tooltip content={(props) => <StackedChartTooltip {...props} currency={currency} />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 14 }} />
                <ReferenceLine y={0} stroke="#C9C2E0" strokeWidth={1} />
                {seriesKeys.map((key, idx) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={key === "Debt" ? "Debt (mortgage)" : key}
                    stackId="1"
                    stroke={colorForSeries(key, idx)}
                    strokeWidth={2}
                    strokeDasharray={key === "Debt" ? "4 3" : undefined}
                    fill={`url(#fill-${idx})`}
                  />
                ))}
                {ranOutAge && (
                  <ReferenceLine
                    x={ranOutAge}
                    stroke="#FF6B5B"
                    strokeDasharray="4 4"
                    label={{ value: "Funds depleted", fontSize: 10, fill: "#FF6B5B" }}
                  />
                )}
                {selectedAge != null && <ReferenceLine x={selectedAge} stroke="#4C8DFF" strokeWidth={2} />}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {selectedRecord && (selectedRecord._defaulted || selectedRecord._shortfall) && (
            <div className="rounded-2xl bg-white p-3 shadow-sm mt-4">
              {selectedRecord._defaulted && (
                <div className="rounded-lg px-2.5 py-2 text-[11px] font-medium mb-2" style={{ background: "#FFF1EC", color: "#B23A22" }}>
                  ⚠️ Not fully covered this year — any mortgaged property was force-sold to try to close the gap.
                </div>
              )}
              {selectedRecord._defaulted && investments.some((i) => i.type === "house" && i.usage === "primary" && i.sellable === false) && (
                <div className="rounded-lg px-2.5 py-2 text-[11px] leading-relaxed mb-2" style={{ background: "#FFF8E7", color: "#8A5A00" }}>
                  💡 Your primary home is marked "never sell," so it wasn't touched even though money ran out. If
                  that's a real constraint, this is an honest result — if not, try switching it to sellable on
                  the Investments tab to see whether it changes the outcome.
                </div>
              )}
              {selectedRecord._shortfall && (
                <>
                  <div className="text-xs font-semibold text-stone-600 mb-1.5">
                    Why {fmt(selectedRecord._shortfall.total, currency)} was needed — age {selectedAge}
                  </div>
                  <table className="w-full text-[11px] text-stone-500 border-collapse">
                    <tbody>
                      <tr className="border-b border-stone-100">
                        <td className="py-1">
                          Living expenses
                          {selectedRecord._shortfall.spendingDeclinePct > 0 && (
                            <span className="text-stone-400"> (−{selectedRecord._shortfall.spendingDeclinePct}% age-related)</span>
                          )}
                        </td>
                        <td className="py-1 text-right">{fmt(selectedRecord._shortfall.livingExpenses, currency)}</td>
                      </tr>
                      {selectedRecord._shortfall.mortgagePaymentDetail.map((m) => (
                        <tr key={m.name} className="border-b border-stone-100">
                          <td className="py-1">Mortgage — {m.name}</td>
                          <td className="py-1 text-right">{fmt(m.annual, currency)}</td>
                        </tr>
                      ))}
                      {selectedRecord._shortfall.postSaleRentExpense > 0 && (
                        <tr className="border-b border-stone-100">
                          <td className="py-1">Rent (after selling)</td>
                          <td className="py-1 text-right">{fmt(selectedRecord._shortfall.postSaleRentExpense, currency)}</td>
                        </tr>
                      )}
                      {selectedRecord._shortfall.salary > 0 && (
                        <tr className="border-b border-stone-100">
                          <td className="py-1">− Salary (after tax)</td>
                          <td className="py-1 text-right">−{fmt(selectedRecord._shortfall.salary, currency)}</td>
                        </tr>
                      )}
                      {selectedRecord._shortfall.pension > 0 && (
                        <tr className="border-b border-stone-100">
                          <td className="py-1">− Pension (after tax)</td>
                          <td className="py-1 text-right">−{fmt(selectedRecord._shortfall.pension, currency)}</td>
                        </tr>
                      )}
                      {selectedRecord._shortfall.rentIncome > 0 && (
                        <tr className="border-b border-stone-100">
                          <td className="py-1">− Rent (after tax)</td>
                          <td className="py-1 text-right">−{fmt(selectedRecord._shortfall.rentIncome, currency)}</td>
                        </tr>
                      )}
                      {selectedRecord._shortfall.dividendIncome > 0 && (
                        <tr className="border-b border-stone-100">
                          <td className="py-1">− Dividends (after tax)</td>
                          <td className="py-1 text-right">−{fmt(selectedRecord._shortfall.dividendIncome, currency)}</td>
                        </tr>
                      )}
                      {selectedRecord._shortfall.lumpSum !== 0 && (
                        <tr className="border-b border-stone-100">
                          <td className="py-1">{selectedRecord._shortfall.lumpSum > 0 ? "− Lump sum received" : "+ Lump sum paid out"}</td>
                          <td className="py-1 text-right">
                            {selectedRecord._shortfall.lumpSum > 0 ? "−" : "+"}
                            {fmt(Math.abs(selectedRecord._shortfall.lumpSum), currency)}
                          </td>
                        </tr>
                      )}
                      <tr className="font-semibold text-stone-700">
                        <td className="pt-1.5">= Shortfall to cover</td>
                        <td className="pt-1.5 text-right">{fmt(selectedRecord._shortfall.total, currency)}</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}

          {selectedRecord && (
            <div className="rounded-2xl bg-white p-3.5 shadow-sm mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Age {selectedAge}: year-over-year change
                </h3>
                <button onClick={() => setSelectedAge(null)} className="text-xs text-stone-400 hover:text-stone-600">
                  Close ✕
                </button>
              </div>
              {realTermsView && (
                <p className="text-[11px] text-stone-400 mb-2 -mt-1">
                  Balances above are in today's money; the itemized lines below stay in that year's actual (future
                  dollar) amounts, since they describe specific transactions.
                </p>
              )}
              {seriesKeys.map((key, idx) => {
                const color = colorForSeries(key, idx);
                const before = displayPrevRecord ? displayPrevRecord[key] || 0 : 0;
                const after = displaySelectedRecord[key] || 0;
                const delta = after - before;
                const detail = selectedRecord._explain ? selectedRecord._explain[key] : null;
                const lines =
                  key === "Debt"
                    ? ["Total mortgage balance remaining across all properties — shown negative since it's owed, not held."]
                    : buildExplainLines(detail, currency, key === "Cash" ? selectedRecord._lumpSumEvents : null);
                return (
                  <div key={key} className="py-2 border-b border-stone-100">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                        {key === "Debt" ? "Debt (mortgage)" : key}
                      </span>
                      <span className="text-xs font-semibold" style={{ color: delta >= 0 ? "#1B7A4C" : "#B23A22" }}>
                        {delta >= 0 ? "+" : ""}
                        {fmt(delta, currency)}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      {fmt(before, currency)} → {fmt(after, currency)}
                    </div>
                    {lines.map((line, i) => (
                      <div key={i} className="text-[10px] text-stone-400 mt-0.5 pl-3.5">
                        {line}
                      </div>
                    ))}
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-3">
                <span className="text-xs font-bold">Net worth</span>
                <span
                  className="text-xs font-bold"
                  style={{ color: displaySelectedRecord._total - (displayPrevRecord?._total || 0) >= 0 ? "#1B7A4C" : "#B23A22" }}
                >
                  {displaySelectedRecord._total - (displayPrevRecord?._total || 0) >= 0 ? "+" : ""}
                  {fmt(displaySelectedRecord._total - (displayPrevRecord?._total || 0), currency)}
                </span>
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5 text-right">
                {fmt(displayPrevRecord?._total || 0, currency)} → {fmt(displaySelectedRecord._total, currency)}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-2xl bg-white p-3.5 shadow-sm">
              <div className="text-xs text-stone-400">
                At life expectancy ({profile.lifeExpectancy}){realTermsView && <span className="block">in today's money</span>}
              </div>
              <div className="text-lg font-semibold" style={{ color: "#4C8DFF", fontFamily: "'Space Grotesk', sans-serif" }}>
                {finalYear ? fmt(finalYear._total * realFactorForAge(finalYear.age, profile.currentAge, expensesState.inflation, realTermsView), currency) : "-"}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-3.5 shadow-sm">
              <div className="text-xs text-stone-400">Years simulated</div>
              <div className="text-lg font-semibold" style={{ color: "#4C8DFF", fontFamily: "'Space Grotesk', sans-serif" }}>
                {years.length}
              </div>
            </div>
          </div>

          {ranOutAge ? (
            <div className="mt-4 rounded-2xl px-4 py-3.5 text-sm" style={{ background: "#FFF1EC", color: "#B23A22" }}>
              At the current assumptions, funds run out at age {ranOutAge} — {profile.lifeExpectancy - ranOutAge}{" "}
              years before your life expectancy.
            </div>
          ) : (
            <div className="mt-4 rounded-2xl px-4 py-3.5 text-sm" style={{ background: "#E9FBF2", color: "#1B7A4C" }}>
              🎉 Your money lasts through your full life expectancy at these assumptions.
            </div>
          )}

          <div className="mt-4 text-xs text-stone-400 leading-relaxed">
            Assumptions: withdrawals follow the exact order set on the Inputs tab — every individual investment,
            retirement account, and sellable property has its own place in that list, not just a category. A
            locked retirement account (below its minimum age, early access off) is skipped entirely until it
            unlocks, and a "taxed when withdrawn" account is grossed up so tax (and any early-withdrawal penalty)
            comes out of that account, not your other buckets. A pension, if enabled, pays out as taxed income
            from its start age based on your last working salary.
            <strong> Investment contributions, retirement contributions, and mortgage payments all stop the year
            "years still working" runs out.</strong> Net worth counts each house as equity (current value minus
            remaining mortgage balance); a house marked "not sellable" is never drawn down. When a sellable house
            with a post-sale plan (rebuy, resize, or rent) is tapped, 100% of its equity is liquidated that year —
            not just what's needed — and the plan takes effect immediately; a house with no plan is drawn down
            gradually instead. If you chose "rent" or "take the cash" and asked to reinvest the leftover in a CD
            or the market, that money keeps growing at the rate you set and stays available for future
            withdrawals — it just keeps the sold property's name and color on the chart, since it's the same
            underlying bucket repurposed rather than a brand-new one. Selling home equity is taxed only on the
            gain above its purchase price. Rental income and post-sale rent both grow with inflation every year;
            mortgage payments never do — a floating-rate mortgage's interest cost still follows your Cash
            section's rate. Monthly expenses exclude mortgage payments — and, if you've switched it on in Income
            & Expenses, they can also decline in real terms through retirement (see the Info page for the
            research). Cash interest is taxed every year it's
            earned. A market or dividend investment stays untaxed while it grows and is only taxed — on the gain
            above the cost basis you set, not the whole amount — when you actually sell some of it. The tax rate
            is a flat average, not marginal brackets. Lump sums hit as a single cash event in the year they
            occur, untaxed and not inflation-adjusted. Any bucket set to a different currency than your base
            currency (Profile tab) is converted using live exchange rates when available, or an approximate
            offline table if not — check the Profile tab to see which is active. Your "keep at least" cash
            minimum (Cash tab) is treated as an emergency reserve — it's never drawn down to cover a shortfall,
            only the cash above that floor is. If a year's costs still can't be covered and you own a mortgaged
            property, that property is force-sold that year — you can't stop paying a mortgage and keep the
            house. Sale proceeds (after the agency fee and tax on the gain) go toward the gap, and if it was your
            home, a rent cost replaces the old mortgage payment. Nothing is ever invented to fill a remaining
            gap; the year-by-year breakdown flags every forced sale explicitly. A pension can optionally rise
            with inflation (the default) or stay fixed in nominal terms forever. Growth is applied once per year,
            before that year's withdrawals.
          </div>
        </div>
      ) : tab === "whatif" ? (
        <div className="px-5 py-5">
          <div className="flex items-center gap-2 mb-1">
            <GitCompare size={16} color="#7C5CFC" />
            <h2 className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              What if…
            </h2>
          </div>
          <p className="text-xs text-stone-400 mb-4">
            Add as many changes as you like — each starts pre-filled with your current value; edit it to whatever
            you want to test. Nothing here is saved.
          </p>

          {whatIfChanges.map((change, idx) => {
            const lever = LEVERS.find((l) => l.id === change.leverId) || LEVERS[0];
            return (
              <div key={change.id} className="rounded-2xl bg-white p-3.5 shadow-sm mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-stone-400">Change {idx + 1}</span>
                  {whatIfChanges.length > 1 && (
                    <button onClick={() => removeWhatIfChange(change.id)} className="text-stone-300 hover:text-rose-500">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <Field label="What changes?">
                  <SelectInput
                    value={change.leverId}
                    onChange={(v) => updateWhatIfChange(change.id, { leverId: v })}
                    options={LEVERS.map((l) => ({ value: l.id, label: l.label }))}
                  />
                </Field>
                {change.leverId === "lumpsum" ? (
                  <>
                    <Field label="Name">
                      <TextInput value={change.name || ""} onChange={(v) => updateWhatIfChange(change.id, { name: v })} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="At age">
                        <NumberInput
                          accent="#7C5CFC"
                          value={change.age ?? profile.currentAge}
                          onChange={(v) => updateWhatIfChange(change.id, { age: v })}
                        />
                      </Field>
                      <Field label="Type">
                        <SelectInput
                          value={change.amountType || "receive"}
                          onChange={(v) => updateWhatIfChange(change.id, { amountType: v })}
                          options={[
                            { value: "receive", label: "Receive" },
                            { value: "pay", label: "Pay" },
                          ]}
                        />
                      </Field>
                    </div>
                    <Field label="Amount">
                      <NumberInput
                        accent="#7C5CFC"
                        value={change.amountMagnitude ?? 0}
                        suffix={currency}
                        onChange={(v) => updateWhatIfChange(change.id, { amountMagnitude: Math.abs(v) })}
                      />
                    </Field>
                    {(Math.round(change.age ?? profile.currentAge) < profile.currentAge ||
                      Math.round(change.age ?? profile.currentAge) > profile.lifeExpectancy) && (
                      <div className="rounded-lg px-2.5 py-2 text-[11px] font-medium" style={{ background: "#FFF1EC", color: "#B23A22" }}>
                        ⚠️ That age is outside your simulated range ({profile.currentAge}–{profile.lifeExpectancy}), so
                        this lump sum is being ignored.
                      </div>
                    )}
                  </>
                ) : change.leverId === "buyhouse" ? (
                  <>
                    <Field label="Name">
                      <TextInput value={change.name || ""} onChange={(v) => updateWhatIfChange(change.id, { name: v })} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Property value">
                        <NumberInput accent="#7C5CFC" value={change.value ?? 0} onChange={(v) => updateWhatIfChange(change.id, { value: v })} />
                      </Field>
                      <Field label="Cash deposit">
                        <NumberInput accent="#7C5CFC" value={change.deposit ?? 0} onChange={(v) => updateWhatIfChange(change.id, { deposit: v })} />
                      </Field>
                    </div>
                    <Field label="Deposit funded from">
                      <SelectInput
                        value={change.fundingSource || "cash"}
                        onChange={(v) => updateWhatIfChange(change.id, { fundingSource: v })}
                        options={[
                          { value: "cash", label: "Cash" },
                          ...convertedInvestments.filter((i) => i.type !== "house").map((i) => ({ value: i.id, label: i.name || "Investment" })),
                        ]}
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Mortgage rate">
                        <NumberInput
                          accent="#7C5CFC"
                          value={change.mortgageRate ?? 4.5}
                          suffix="%/yr"
                          onChange={(v) => updateWhatIfChange(change.id, { mortgageRate: v })}
                        />
                      </Field>
                      <Field label="Loan term">
                        <NumberInput
                          accent="#7C5CFC"
                          value={change.loanTermYears ?? 25}
                          suffix="yrs"
                          onChange={(v) => updateWhatIfChange(change.id, { loanTermYears: v })}
                        />
                      </Field>
                    </div>
                    <Field label="Monthly rent it earns">
                      <NumberInput accent="#7C5CFC" value={change.rent ?? 0} onChange={(v) => updateWhatIfChange(change.id, { rent: v })} />
                    </Field>
                    <p className="text-xs text-stone-400">
                      The monthly mortgage payment is calculated for you from the rate and loan term.
                    </p>
                  </>
                ) : change.leverId === "spendingDecline" ? (
                  <>
                    <Field label="Spending declines with age?">
                      <SelectInput
                        value={change.enabled ? "yes" : "no"}
                        onChange={(v) => updateWhatIfChange(change.id, { enabled: v === "yes" })}
                        options={[
                          { value: "no", label: "No — same real spending every year" },
                          { value: "yes", label: "Yes — spending eases off through retirement" },
                        ]}
                      />
                    </Field>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Your real plan currently has this {expensesState.spendingDecline?.enabled ? "on" : "off"}.
                      Living expenses fall ~1%/yr for the first 10 years of retirement, ~2%/yr for the next 9,
                      then level off — see the Info page for the research behind it.
                    </p>
                  </>
                ) : (
                  <>
                    <Field
                      label={
                        lever.id === "marketRate" || lever.id === "cdLongRunRate"
                          ? "New weighted-average rate"
                          : "New value (starts as your current setting)"
                      }
                    >
                      <NumberInput
                        accent="#7C5CFC"
                        value={change.value}
                        suffix={lever.unit(currency)}
                        onChange={(v) => updateWhatIfChange(change.id, { value: v })}
                      />
                    </Field>
                    {lever.id === "marketRate" && (
                      <div className="rounded-lg px-2.5 py-2 text-[11px] text-stone-500 leading-relaxed mb-2" style={{ background: "#F7F5FB" }}>
                        This blends every market/dividend investment and retirement account's own rate, weighted
                        by balance — cash and CDs have their own separate levers. Today's blend:{" "}
                        {[
                          ...convertedInvestments
                            .filter((i) => i.type !== "house" && i.type !== "cd")
                            .map((i) => ({ name: i.name || "Investment", rate: i.growthRate, amount: i.amount })),
                          ...convertedRetirement.map((r) => ({ name: r.name || "Retirement", rate: r.growthRate, amount: r.amount })),
                        ]
                          .filter((b) => b.amount > 0)
                          .map((b) => `${b.name} ${b.rate}%`)
                          .join(", ") || "no market accounts yet"}{" "}
                        → weighted avg {round2(weightedAvgMarketRate(baselineDraft))}%. Dragging the number here
                        shifts every one of those accounts by the same number of points, keeping their relative
                        spread.
                      </div>
                    )}
                    {lever.id === "cdLongRunRate" && (
                      <div className="rounded-lg px-2.5 py-2 text-[11px] text-stone-500 leading-relaxed mb-2" style={{ background: "#F7F5FB" }}>
                        This is the rate each CD glides toward once its lock-in ends — not today's entry rate.
                        Blended across your CDs, weighted by balance:{" "}
                        {convertedInvestments
                          .filter((i) => i.type === "cd" && i.amount > 0)
                          .map((i) => `${i.name || "CD"} ${round2(i.cdLongRunRate ?? Math.max(0, expensesState.inflation - 0.5))}%`)
                          .join(", ") || "no CDs yet"}{" "}
                        → weighted avg {round2(weightedAvgCDLongRun(baselineDraft))}%.
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          <button
            onClick={addWhatIfChange}
            className="w-full flex items-center justify-center gap-1.5 rounded-full text-sm font-semibold py-3 mb-4"
            style={{ background: "#7C5CFC1A", color: "#4B2E9E" }}
          >
            <Plus size={15} /> Add another change
          </button>

          <div className="rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-2 text-xs font-semibold text-white">
              <div className="px-3.5 py-2.5" style={{ background: "#4C8DFF" }}>
                Today
              </div>
              <div className="px-3.5 py-2.5" style={{ background: "#7C5CFC" }}>
                What if
              </div>
            </div>
            <div className="grid grid-cols-2 bg-white">
              <div className="px-3.5 py-3 border-r border-stone-100">
                <div className="text-xs text-stone-400">Financial independence</div>
                <div className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {fiAge != null ? `age ${Math.floor(fiAge)}` : "not reached"}
                </div>
              </div>
              <div className="px-3.5 py-3">
                <div className="text-xs text-stone-400">Financial independence</div>
                <div className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {altFiAge != null ? `age ${Math.floor(altFiAge)}` : "not reached"}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 bg-white border-t border-stone-100">
              <div className="px-3.5 py-3 border-r border-stone-100">
                <div className="text-xs text-stone-400">Time until freedom</div>
                <div className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {formatYMD(yearsToYMD(yearsToFI))}
                </div>
              </div>
              <div className="px-3.5 py-3">
                <div className="text-xs text-stone-400">Time until freedom</div>
                <div className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {formatYMD(yearsToYMD(altYearsToFI))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 bg-white border-t border-stone-100">
              <div className="px-3.5 py-3 border-r border-stone-100">
                <div className="text-xs text-stone-400">Money lasts to</div>
                <div className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  age {ranOutAge || profile.lifeExpectancy}
                </div>
              </div>
              <div className="px-3.5 py-3">
                <div className="text-xs text-stone-400">Money lasts to</div>
                <div className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  age {altRanOutAge || profile.lifeExpectancy}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 bg-white border-t border-stone-100">
              <div className="px-3.5 py-3 border-r border-stone-100">
                <div className="text-xs text-stone-400">At life expectancy</div>
                <div className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {finalYear ? fmt(finalYear._total, currency) : "-"}
                </div>
              </div>
              <div className="px-3.5 py-3">
                <div className="text-xs text-stone-400">At life expectancy</div>
                <div className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {altFinalYear ? fmt(altFinalYear._total, currency) : "-"}
                </div>
              </div>
            </div>
          </div>

          {ranOutAge || altRanOutAge ? (
            fiDeltaDays != null &&
            fiDeltaDays !== 0 && (
              <div
                className="mt-4 rounded-2xl px-4 py-3.5 text-sm font-semibold"
                style={fiDeltaDays > 0 ? { background: "#FFF1EC", color: "#B23A22" } : { background: "#E9FBF2", color: "#1B7A4C" }}
              >
                {fiDeltaDays > 0
                  ? `That scenario costs you ${formatYMD(daysToYMD(fiDeltaDays))} of freedom.`
                  : `That scenario buys you ${formatYMD(daysToYMD(Math.abs(fiDeltaDays)))} of freedom!`}
              </div>
            )
          ) : (
            finalYear &&
            altFinalYear &&
            Math.abs(altFinalYear._total - finalYear._total) > 1 && (
              <div
                className="mt-4 rounded-2xl px-4 py-3.5 text-sm font-semibold"
                style={
                  altFinalYear._total >= finalYear._total
                    ? { background: "#E9FBF2", color: "#1B7A4C" }
                    : { background: "#FFF1EC", color: "#B23A22" }
                }
              >
                Your money lasts either way — but you'd end up with{" "}
                {fmt(Math.abs(altFinalYear._total - finalYear._total), currency)}{" "}
                {altFinalYear._total >= finalYear._total ? "more" : "less"} by age {profile.lifeExpectancy}.
              </div>
            )
          )}

          <div className="rounded-2xl bg-white p-3.5 shadow-sm mt-4">
            <h2 className="text-sm font-semibold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Total net worth over time
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={comparisonData} margin={{ top: 5, right: 5, left: 0, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEE9F7" />
                <XAxis dataKey="age" tick={{ fontSize: 11, fill: "#8A81A6" }} label={{ value: "Age", position: "insideBottom", offset: -3, fontSize: 11, fill: "#8A81A6" }} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: "#8A81A6" }} width={45} />
                <Tooltip formatter={(v) => (v == null ? "—" : fmt(v, currency))} labelFormatter={(l) => `Age ${l}`} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 14 }} />
                <Line type="monotone" dataKey="Today" stroke="#4C8DFF" strokeWidth={2.5} dot={false} connectNulls />
                <Line type="monotone" dataKey="What if" stroke="#7C5CFC" strokeWidth={2.5} strokeDasharray="5 3" dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
