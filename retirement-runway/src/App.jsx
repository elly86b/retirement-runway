import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Home, TrendingUp, Wallet, PiggyBank, User, Save, FolderOpen, Sparkles, Rocket, Timer, GitCompare
} from "lucide-react";

// ---------- helpers ----------
const uid = () => Math.random().toString(36).slice(2, 9);
const REGION_CURRENCY = { US: "USD", EU: "EUR", UK: "GBP", Canada: "CAD", Other: "USD" };
const fmt = (n, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(Math.round(n || 0));
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
    if (d.growthPct) lines.push(`Grew ${d.growthPct}% on ${g(d.startBalance)} = +${g(d.growthAmount)}`);
    if (d.surplusAdded > 0) lines.push(`+${g(d.surplusAdded)} net surplus (income minus expenses)`);
    if (d.withdrawn > 0) lines.push(`−${g(d.withdrawn)} withdrawn to cover a shortfall`);
    (lumpSumEvents || []).forEach((ls) => {
      lines.push(`${ls.amount >= 0 ? "+" : "−"}${g(Math.abs(ls.amount))} — ${ls.name || "lump sum"}`);
    });
  } else if (d.kind === "house") {
    if (d.sold) {
      lines.push(`🏠 Sold for ${g(d.saleValue)} (${g(d.saleEquity)} equity, ${Math.round(d.saleTaxRate * 100)}% tax on the gain)`);
      if (d.postSaleAction === "rebuy" || d.postSaleAction === "resize") {
        lines.push(`Bought a new home worth ${g(d.newHomeValue)}`);
      } else if (d.postSaleAction === "rent") {
        lines.push(`Now renting at ${g(d.newMonthlyRent)}/month (grows with inflation)`);
      }
    } else {
      if (d.growthPct) lines.push(`Value grew ${d.growthPct}% on ${g(d.startBalance)} = +${g(d.growthAmount)}`);
      if (d.rentIncome) lines.push(`+${g(d.rentIncome)} rent collected (flows to cash)`);
      if (d.mortgagePaymentAnnual) lines.push(`${g(d.principalPaid)} of mortgage paid off (${g(d.interestPaid)} was interest)`);
      if (d.withdrawn) lines.push(`−${g(d.withdrawn)} equity sold to cover a shortfall`);
    }
  } else if (d.kind === "retirement") {
    if (d.growthPct) lines.push(`Grew ${d.growthPct}% on ${g(d.startBalance)} = +${g(d.growthAmount)}`);
    if (d.contribAnnual > 0) lines.push(`+${g(d.contribAnnual)} contributed this year`);
    if (d.withdrawn) lines.push(`−${g(d.withdrawn)} withdrawn`);
  } else {
    if (d.growthPct) lines.push(`Grew ${d.growthPct}% on ${g(d.startBalance)} = +${g(d.growthAmount)}`);
    if (d.contribAnnual > 0) {
      const periods = Math.round(d.contribPeriods * 10) / 10;
      lines.push(`${g(d.contribPerPeriod)}/${d.contribFrequency} × ${periods} = +${g(d.contribAnnual)} contributed`);
    }
    if (d.dividendPaid > 0) lines.push(`Paid out ${g(d.dividendPaid)} in dividends (flows to cash)`);
    if (d.withdrawn) lines.push(`−${g(d.withdrawn)} sold to cover a shortfall`);
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

const SECTIONS = [
  { id: "profile", label: "Profile", icon: <User size={14} /> },
  { id: "income", label: "Income & expenses", icon: <TrendingUp size={14} /> },
  { id: "cash", label: "Cash", icon: <Wallet size={14} /> },
  { id: "investments", label: "Investments", icon: <TrendingUp size={14} /> },
  { id: "retirement", label: "Retirement", icon: <PiggyBank size={14} /> },
  { id: "lumpsums", label: "Lump sums", icon: <Sparkles size={14} /> },
];

const SESSION_KEY = "retirement-calc-session-v7";
const PROFILE_KEY = "retirement-calc-profile-v7";

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

// ---------- full retirement-runway simulation (drives the chart) ----------
function runSimulation({ profile, work, expensesState, cash, investments, retirement, withdrawalOrder, pension, lumpSums }) {
  const years = [];
  let cashBal = cash.amount;
  let invBal = withDisplayNames(investments, "Investment").map((i) => ({
    ...i,
    amount: i.amount,
    mortgageBalance: i.mortgageBalance || 0,
    currentRent: i.rent || 0,
  }));
  let retBal = withDisplayNames(retirement, "Account").map((r) => ({ ...r, amount: r.amount }));
  let salary = work.salary;
  let finalSalary = work.salary;
  let monthlyExpenses = expensesState.monthly;
  let extraRentExpenseAnnual = 0;
  let ranOutAge = null;

  for (let age = profile.currentAge; age <= profile.lifeExpectancy; age++) {
    const yearIndex = age - profile.currentAge;
    const workFraction = Math.max(0, Math.min(1, work.yearsWorking - yearIndex));
    const explain = {};

    const grossSalary = workFraction * salary;
    if (workFraction > 0) finalSalary = salary;
    const netSalary = grossSalary * (1 - profile.taxBracket / 100);

    const pensionEnabled = pension && pension.enabled !== false;
    const pensionGross = pensionEnabled && age >= (pension.startAge || 9999) ? ((pension.percentOfSalary || 0) / 100) * finalSalary : 0;
    const netPension = pensionGross * (1 - profile.taxBracket / 100);

    let extraIncome = 0;
    const houseIncomeDetail = {};
    invBal.forEach((inv) => {
      if (inv.type === "house") {
        const balance = inv.mortgageBalance || 0;
        const mortgageActive = balance > 0.01;
        const annualPayment = mortgageActive ? (inv.mortgagePayment || 0) * 12 : 0;
        let rentIncome = 0;
        if (inv.usage === "rental") {
          rentIncome = (inv.currentRent || 0) * 12;
          extraIncome += rentIncome - annualPayment;
        } else {
          extraIncome -= annualPayment;
        }
        houseIncomeDetail[inv.displayName] = { rentIncome, mortgagePaymentAnnual: annualPayment };
      } else if (inv.type === "dividend") {
        extraIncome += inv.amount * ((inv.dividendYield || 0) / 100);
      }
    });

    const annualExpenses = monthlyExpenses * 12 + extraRentExpenseAnnual;

    const cashStart = cashBal;
    cashBal *= 1 + cash.rate / 100;
    const cashGrowthAmount = cashBal - cashStart;

    invBal = invBal.map((inv) => {
      const startBalance = inv.amount;
      const grown = startBalance * (1 + inv.growthRate / 100);
      let contribAnnual = 0;
      let contribPerPeriod = 0;
      let contribFrequency = null;
      if (inv.type !== "house") {
        const freqMult = inv.contributionFrequency === "yearly" ? 1 : 12;
        contribPerPeriod = inv.contribution || 0;
        contribFrequency = inv.contributionFrequency === "yearly" ? "year" : "month";
        contribAnnual = workFraction * (contribPerPeriod * freqMult);
      }
      const dividendPaid = inv.type === "dividend" ? startBalance * ((inv.dividendYield || 0) / 100) : 0;
      explain[inv.displayName] = {
        kind: inv.type,
        startBalance,
        growthPct: inv.growthRate,
        growthAmount: grown - startBalance,
        contribPerPeriod,
        contribFrequency,
        contribPeriods: contribFrequency ? (contribFrequency === "month" ? 12 : 1) * workFraction : 0,
        contribAnnual,
        dividendPaid,
        withdrawn: 0,
      };
      return { ...inv, amount: grown + contribAnnual };
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

    if (netCashFlow >= 0) {
      cashBal += netCashFlow;
    } else {
      let shortfall = -netCashFlow;
      for (const entry of withdrawalOrder) {
        if (shortfall <= 0) break;
        const { type, id } = parseOrderEntry(entry);

        if (type === "cash") {
          const take = Math.min(cashBal, shortfall);
          cashBal -= take;
          cashWithdrawn += take;
          shortfall -= take;
        } else if (type === "investment") {
          const inv = invBal.find((i) => i.id === id && i.type !== "house");
          if (!inv) continue;
          const take = Math.min(inv.amount, shortfall);
          inv.amount -= take;
          if (explain[inv.displayName]) explain[inv.displayName].withdrawn += take;
          shortfall -= take;
        } else if (type === "retirement") {
          const r = retBal.find((x) => x.id === id);
          if (!r) continue;
          const minAge = r.minAge || 0;
          const belowMinAge = age < minAge;
          if (belowMinAge && !r.earlyAccessAllowed) continue;
          const penaltyRate = belowMinAge && r.earlyAccessAllowed ? (r.earlyPenalty || 0) / 100 : 0;
          const taxRate = r.taxTreatment === "pretax" ? profile.taxBracket / 100 : 0;
          const totalRate = Math.min(taxRate + penaltyRate, 0.95);
          const grossNeeded = shortfall / (1 - totalRate);
          const take = Math.min(r.amount, grossNeeded);
          const net = take * (1 - totalRate);
          r.amount -= take;
          if (explain[r.displayName]) explain[r.displayName].withdrawn += take;
          shortfall -= net;
        } else if (type === "house") {
          const inv = invBal.find((i) => i.id === id && i.type === "house");
          if (!inv || inv.sellable === false || inv._sold) continue;
          const equity = Math.max(0, inv.amount - (inv.mortgageBalance || 0));
          if (equity <= 0) continue;
          const gainFraction =
            inv.amount > 0 ? Math.max(0, (inv.amount - (inv.purchasePrice ?? inv.amount)) / inv.amount) : 0;
          const taxRate = Math.min(gainFraction * (profile.taxBracket / 100), 0.95);
          const hasPlan = inv.postSaleAction && inv.postSaleAction !== "none";

          if (hasPlan) {
            // moving house: sell 100% of equity this year, then either rebuy, resize, or start renting
            const saleValue = inv.amount;
            const netProceeds = equity * (1 - taxRate);
            let cashFromSale = netProceeds;
            let saleNote = {};
            if (inv.postSaleAction === "rebuy" || inv.postSaleAction === "resize") {
              const newValue = inv.postSaleAction === "resize" ? saleValue * (inv.resizeFactor || 1) : inv.rebuyValue || 0;
              cashFromSale -= newValue;
              inv.amount = newValue;
              inv.mortgageBalance = 0;
              inv.purchasePrice = newValue;
              inv.sellable = false;
              saleNote = { newHomeValue: newValue };
            } else if (inv.postSaleAction === "rent") {
              inv.amount = 0;
              inv.mortgageBalance = 0;
              extraRentExpenseAnnual = (inv.postSaleRent || 0) * 12;
              saleNote = { newMonthlyRent: inv.postSaleRent || 0 };
            }
            inv._sold = true;
            const applied = Math.min(Math.max(cashFromSale, 0), shortfall);
            shortfall -= applied;
            cashBal += cashFromSale - applied;
            if (explain[inv.displayName]) {
              explain[inv.displayName].sold = true;
              explain[inv.displayName].saleValue = saleValue;
              explain[inv.displayName].saleEquity = equity;
              explain[inv.displayName].saleTaxRate = taxRate;
              explain[inv.displayName].postSaleAction = inv.postSaleAction;
              Object.assign(explain[inv.displayName], saleNote);
            }
          } else {
            const grossNeeded = shortfall / (1 - taxRate);
            const take = Math.min(equity, grossNeeded);
            const net = take * (1 - taxRate);
            inv.amount -= take;
            if (explain[inv.displayName]) explain[inv.displayName].withdrawn += take;
            shortfall -= net;
          }
        }
      }
      if (shortfall > 0 && ranOutAge === null) ranOutAge = age;
    }

    explain["Cash"] = {
      kind: "cash",
      startBalance: cashStart,
      growthPct: cash.rate,
      growthAmount: cashGrowthAmount,
      surplusAdded: netCashFlow >= 0 ? netCashFlow : 0,
      withdrawn: cashWithdrawn,
      lumpSumAmount: lumpSumThisYear,
    };

    invBal = invBal.map((inv) => {
      if (inv.type !== "house") return inv;
      let nextBalance = inv.mortgageBalance || 0;
      let interestPaid = 0;
      let principalPaid = 0;
      if (nextBalance > 0.01) {
        const rate = inv.mortgageRateType === "floating" ? cash.rate : inv.mortgageRate || 0;
        const annualInterest = nextBalance * (rate / 100);
        const annualPayment = (inv.mortgagePayment || 0) * 12;
        const principal = annualPayment - annualInterest;
        interestPaid = annualInterest;
        principalPaid = Math.max(0, Math.min(principal, nextBalance));
        nextBalance = Math.max(0, nextBalance - principal);
      }
      const detail = houseIncomeDetail[inv.displayName] || {};
      if (explain[inv.displayName]) {
        explain[inv.displayName].rentIncome = detail.rentIncome || 0;
        explain[inv.displayName].mortgagePaymentAnnual = detail.mortgagePaymentAnnual || 0;
        explain[inv.displayName].interestPaid = interestPaid;
        explain[inv.displayName].principalPaid = principalPaid;
      }
      const nextRent = inv.usage === "rental" ? (inv.currentRent || 0) * (1 + expensesState.inflation / 100) : inv.currentRent;
      return { ...inv, mortgageBalance: nextBalance, currentRent: nextRent };
    });

    const record = { age, year: new Date().getFullYear() + yearIndex, Cash: Math.max(cashBal, 0) };
    invBal.forEach((inv) => {
      record[inv.displayName] = Math.max(equityOf(inv), 0);
    });
    retBal.forEach((r) => (record[r.displayName] = Math.max(r.amount, 0)));
    record._total =
      Math.max(cashBal, 0) +
      invBal.reduce((s, i) => s + Math.max(equityOf(i), 0), 0) +
      retBal.reduce((s, r) => s + Math.max(r.amount, 0), 0);
    record._explain = explain;
    record._lumpSumEvents = lumpSumEvents;
    years.push(record);

    salary *= 1 + work.salaryGrowth / 100;
    monthlyExpenses *= 1 + expensesState.inflation / 100;
    if (extraRentExpenseAnnual > 0) extraRentExpenseAnnual *= 1 + expensesState.inflation / 100;
  }

  return { years, ranOutAge };
}

// ---------- financial independence age (fractional, day-precise) ----------
function computeFI({ profile, work, expensesState, cash, investments, retirement, withdrawalOrder, pension, lumpSums }) {
  const base = { profile, expensesState, cash, investments, retirement, withdrawalOrder, pension, lumpSums };
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
    id: "growth",
    label: "Avg. growth rate (all accounts)",
    unit: () => "%/yr",
    getCurrent: weightedAvgGrowth,
    apply: (d, v) => {
      const delta = v - weightedAvgGrowth(d);
      return {
        ...d,
        cash: { ...d.cash, rate: d.cash.rate + delta },
        investments: d.investments.map((i) => ({ ...i, growthRate: i.growthRate + delta })),
        retirement: d.retirement.map((r) => ({ ...r, growthRate: r.growthRate + delta })),
      };
    },
  },
  {
    id: "taxrate",
    label: "Average tax rate",
    unit: () => "%",
    getCurrent: (d) => d.profile.taxBracket,
    apply: (d, v) => ({ ...d, profile: { ...d.profile, taxBracket: Math.max(0, v) } }),
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
  { id: "lumpsum", label: "One-time lump sum", special: "lumpsum" },
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
const inputCls =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-shadow";

function NumberInput({ value, onChange, suffix, accent = "#4C8DFF" }) {
  const [draft, setDraft] = useState(String(value ?? 0));

  useEffect(() => {
    if (parseFloat(draft) !== value) setDraft(String(value ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e) => {
    const v = e.target.value;
    if (v === "" || /^-?\d*\.?\d*$/.test(v)) {
      setDraft(v);
      const num = parseFloat(v);
      if (!isNaN(num)) onChange(num);
    }
  };

  const handleBlur = () => {
    if (draft === "" || draft === "-" || isNaN(parseFloat(draft))) {
      setDraft("0");
      onChange(0);
    } else {
      const num = parseFloat(draft);
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

const defaultIndexFundId = uid();
const defaultHouseId = uid();
const defaultRetirementId = uid();

const DEFAULTS = {
  profile: { currentAge: 35, lifeExpectancy: 90, region: "US", taxBracket: 24 },
  work: { salary: 90000, yearsWorking: 30, salaryGrowth: 2 },
  expensesState: { monthly: 4000, inflation: 2.5 },
  cash: { amount: 20000, rate: 2 },
  investments: [
    {
      id: defaultIndexFundId,
      name: "Index Fund",
      type: "market",
      region: "US",
      amount: 100000,
      growthRate: 6,
      contribution: 500,
      contributionFrequency: "monthly",
    },
    {
      id: defaultHouseId,
      name: "Primary Home",
      type: "house",
      region: "US",
      amount: 400000,
      growthRate: 3,
      usage: "primary",
      sellable: false,
      postSaleAction: "none",
      purchasePrice: 300000,
      mortgageBalance: 220000,
      mortgagePayment: 1800,
      mortgageRateType: "fixed",
      mortgageInputMode: "rate",
      mortgageRate: 4.5,
      rent: 0,
    },
  ],
  retirement: [
    {
      id: defaultRetirementId,
      name: "401(k)",
      amount: 150000,
      growthRate: 6,
      contribution: 12000,
      minAge: 59,
      taxTreatment: "pretax",
      earlyAccessAllowed: false,
      earlyPenalty: 10,
    },
  ],
  withdrawalOrder: ["cash", `investment:${defaultIndexFundId}`, `retirement:${defaultRetirementId}`],
  pension: { enabled: true, startAge: 67, percentOfSalary: 40 },
  lumpSums: [],
};

function freshDefaults() {
  return JSON.parse(JSON.stringify(DEFAULTS));
}

export default function RetirementCalculator() {
  const [tab, setTab] = useState("home");
  const [activeSection, setActiveSection] = useState("profile");
  const [loaded, setLoaded] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [showChoice, setShowChoice] = useState(false);
  const [toast, setToast] = useState("");
  const [gamifiedToast, setGamifiedToast] = useState(null);

  const [profile, setProfile] = useState(DEFAULTS.profile);
  const [work, setWork] = useState(DEFAULTS.work);
  const [expensesState, setExpensesState] = useState(DEFAULTS.expensesState);
  const [cash, setCash] = useState(DEFAULTS.cash);
  const [investments, setInvestments] = useState(DEFAULTS.investments);
  const [retirement, setRetirement] = useState(DEFAULTS.retirement);
  const [withdrawalOrder, setWithdrawalOrder] = useState(DEFAULTS.withdrawalOrder);
  const [pension, setPension] = useState(DEFAULTS.pension);
  const [lumpSums, setLumpSums] = useState(DEFAULTS.lumpSums);
  const [whatIfChanges, setWhatIfChanges] = useState([]);
  const [selectedAge, setSelectedAge] = useState(null);
  const [showNetWorthBreakdown, setShowNetWorthBreakdown] = useState(false);

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
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  useEffect(() => {
    (async () => {
      let profileData = null;
      try {
        const p = await window.storage.get(PROFILE_KEY, false);
        if (p && p.value) profileData = JSON.parse(p.value);
      } catch (e) {}
      setHasProfile(!!profileData);

      let sessionData = null;
      try {
        const s = await window.storage.get(SESSION_KEY, false);
        if (s && s.value) sessionData = JSON.parse(s.value);
      } catch (e) {}

      if (sessionData) {
        applyAll(sessionData);
        setLoaded(true);
      } else if (profileData) {
        setShowChoice(true);
        setLoaded(true);
      } else {
        setLoaded(true);
      }
    })();
  }, []);

  // seed the first What-If row with the current baseline value once we know it
  useEffect(() => {
    if (loaded && !showChoice && whatIfChanges.length === 0) {
      const lever = LEVERS[0];
      const baseline = { profile, work, expensesState, cash, investments, retirement, withdrawalOrder, pension };
      setWhatIfChanges([{ id: uid(), leverId: lever.id, value: round2(lever.getCurrent(baseline)) }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, showChoice]);

  const saveTimer = useRef(null);
  useEffect(() => {
    if (!loaded || showChoice) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      window.storage.set(SESSION_KEY, JSON.stringify(collectAll()), false).catch(() => {});
    }, 400);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, work, expensesState, cash, investments, retirement, withdrawalOrder, pension, lumpSums, loaded, showChoice]);

  const chooseLoadProfile = async () => {
    try {
      const p = await window.storage.get(PROFILE_KEY, false);
      if (p && p.value) applyAll(JSON.parse(p.value));
    } catch (e) {}
    setShowChoice(false);
  };
  const chooseFresh = () => {
    applyAll(freshDefaults());
    setShowChoice(false);
  };

  const saveAsProfile = async () => {
    try {
      await window.storage.set(PROFILE_KEY, JSON.stringify(collectAll()), false);
      setHasProfile(true);
      showToast("✨ Saved to your profile");
    } catch (e) {
      showToast("Couldn't save — try again");
    }
  };
  const loadProfile = async () => {
    try {
      const p = await window.storage.get(PROFILE_KEY, false);
      if (p && p.value) {
        applyAll(JSON.parse(p.value));
        showToast("Profile loaded");
      }
    } catch (e) {
      showToast("No saved profile found");
    }
  };
  const startFresh = () => {
    applyAll(freshDefaults());
    showToast("Started fresh — your saved profile is untouched");
  };

  const currency = REGION_CURRENCY[profile.region] || "USD";

  const { years, ranOutAge } = useMemo(
    () => runSimulation({ profile, work, expensesState, cash, investments, retirement, withdrawalOrder, pension, lumpSums }),
    [profile, work, expensesState, cash, investments, retirement, withdrawalOrder, pension, lumpSums]
  );

  const { fiAge } = useMemo(
    () => computeFI({ profile, work, expensesState, cash, investments, retirement, withdrawalOrder, pension, lumpSums }),
    [profile, work, expensesState, cash, investments, retirement, withdrawalOrder, pension, lumpSums]
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
    let draft = { profile, work, expensesState, cash, investments, retirement, withdrawalOrder, pension, lumpSums };
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
      const lever = LEVERS.find((l) => l.id === change.leverId);
      if (lever) draft = lever.apply(draft, change.value ?? lever.getCurrent(draft));
    });
    return draft;
  }, [profile, work, expensesState, cash, investments, retirement, withdrawalOrder, pension, lumpSums, whatIfChanges]);

  const { fiAge: altFiAge } = useMemo(() => computeFI(whatIfInputs), [whatIfInputs]);
  const { years: altYears, ranOutAge: altRanOutAge } = useMemo(() => runSimulation(whatIfInputs), [whatIfInputs]);

  const altYearsToFI = altFiAge != null ? altFiAge - profile.currentAge : null;
  const altDaysUntilFI = altYearsToFI != null ? Math.max(0, Math.round(altYearsToFI * 365.25)) : null;
  const fiDeltaDays = daysUntilFI != null && altDaysUntilFI != null ? altDaysUntilFI - daysUntilFI : null;
  const altFinalYear = altYears[altYears.length - 1];

  const baselineDraft = { profile, work, expensesState, cash, investments, retirement, withdrawalOrder, pension, lumpSums };
  const newLumpSumRow = (id) => ({
    id,
    leverId: "lumpsum",
    name: "Lump sum",
    age: profile.currentAge + 5,
    amountType: "receive",
    amountMagnitude: 10000,
  });
  const addWhatIfChange = () => {
    const used = whatIfChanges.map((c) => c.leverId);
    const next = LEVERS.find((l) => !used.includes(l.id)) || LEVERS[0];
    if (next.special === "lumpsum") {
      setWhatIfChanges((prev) => [...prev, newLumpSumRow(uid())]);
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
          if (lever) return { id: c.id, leverId: lever.id, value: round2(lever.getCurrent(baselineDraft)) };
        }
        return { ...c, ...patch };
      })
    );

  const investedWealth =
    cash.amount +
    investments.filter((i) => i.type !== "house").reduce((s, i) => s + i.amount, 0) +
    retirement.reduce((s, r) => s + r.amount, 0);
  const annualSpending = expensesState.monthly * 12;

  const realReturn = useMemo(() => {
    const nominal = weightedAvgGrowth(baselineDraft);
    return nominal - expensesState.inflation;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cash, investments, retirement, expensesState.inflation]);

  const monthlySavings = useMemo(() => {
    let total = 0;
    investments
      .filter((i) => i.type !== "house")
      .forEach((i) => {
        const freqMult = i.contributionFrequency === "yearly" ? 1 : 12;
        total += (i.contribution || 0) * freqMult;
      });
    retirement.forEach((r) => (total += r.contribution || 0));
    return total / 12;
  }, [investments, retirement]);

  // ---- gamified "you just bought yourself N days of freedom" toasts ----
  const gamifyTimer = useRef(null);
  const fiSnapshot = useRef(null);
  const nwSnapshot = useRef(null);
  const firstComputeDone = useRef(false);
  useEffect(() => {
    if (!loaded || showChoice) return;
    if (gamifyTimer.current) clearTimeout(gamifyTimer.current);
    gamifyTimer.current = setTimeout(() => {
      const currentNW = cash.amount + investments.reduce((s, i) => s + equityOf(i), 0) + retirement.reduce((s, r) => s + r.amount, 0);
      if (!firstComputeDone.current) {
        firstComputeDone.current = true;
        fiSnapshot.current = daysUntilFI;
        nwSnapshot.current = currentNW;
        return;
      }
      const prevDays = fiSnapshot.current;
      const deltaDays = prevDays != null && daysUntilFI != null ? prevDays - daysUntilFI : 0;
      const deltaNW = currentNW - (nwSnapshot.current || 0);
      if (Math.abs(deltaDays) >= 1) {
        const msg = freedomMessage(deltaDays, deltaNW, currency);
        if (msg) {
          setGamifiedToast(msg);
          setTimeout(() => setGamifiedToast(null), 3400);
        }
      }
      fiSnapshot.current = daysUntilFI;
      nwSnapshot.current = currentNW;
    }, 900);
    return () => clearTimeout(gamifyTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daysUntilFI, cash, investments, retirement, loaded, showChoice, currency]);

  const seriesKeys = useMemo(() => {
    const invNames = withDisplayNames(investments, "Investment").map((i) => i.displayName);
    const retNames = withDisplayNames(retirement, "Account").map((r) => r.displayName);
    return ["Cash", ...invNames, ...retNames];
  }, [investments, retirement]);

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

  const currentNetWorth =
    cash.amount + investments.reduce((s, i) => s + equityOf(i), 0) + retirement.reduce((s, r) => s + r.amount, 0);
  const finalYear = years[years.length - 1];

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
        contribution: 6000,
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

  if (showChoice) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center text-white"
        style={{ background: heroGradient, fontFamily: "'Inter', sans-serif" }}
      >
        {fontLink}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.12)" }}>
          <Rocket size={26} color="#FFC24B" />
        </div>
        <h1 className="text-2xl font-semibold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Welcome back
        </h1>
        <p className="text-sm mb-8 max-w-xs" style={{ color: "#D8CFF0" }}>
          You have a saved profile. Pick up where you left off, or explore fresh assumptions — your saved profile
          stays put either way.
        </p>
        <button
          onClick={chooseLoadProfile}
          className="w-full max-w-xs font-medium rounded-full py-3 mb-3"
          style={{ background: "#FFC24B", color: "#1B1435" }}
        >
          Use my saved profile
        </button>
        <button
          onClick={chooseFresh}
          className="w-full max-w-xs font-medium rounded-full py-3 border"
          style={{ borderColor: "rgba(255,255,255,0.3)", color: "white" }}
        >
          Start with new assumptions
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#FAF9FE", color: "#231D3B", fontFamily: "'Inter', sans-serif" }}>
      {fontLink}
      <style>{`
        @keyframes riseIn { from { opacity: 0; transform: translateY(8px);} to { opacity: 1; transform: translateY(0);} }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 16px);} to { opacity: 1; transform: translate(-50%, 0);} }
        .rise-in { animation: riseIn 0.5s ease-out; }
        .slide-up-toast { animation: slideUp 0.3s ease-out; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* gamified toast: sits high above the bottom of the screen and never blocks clicks underneath it */}
      {gamifiedToast && (
        <div
          className="fixed bottom-24 left-1/2 z-50 slide-up-toast"
          style={{ transform: "translateX(-50%)", pointerEvents: "none" }}
        >
          <div
            className="rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg whitespace-nowrap"
            style={{
              background: gamifiedToast.positive
                ? "linear-gradient(90deg, #3DDC97, #28C7C7)"
                : "linear-gradient(90deg, #FF6B5B, #E5555A)",
            }}
          >
            {gamifiedToast.text}
          </div>
        </div>
      )}

      {/* hero header */}
      <div className="px-5 pt-8 pb-6 text-white rise-in" style={{ background: heroGradient }}>
        <h1 className="text-[26px] font-semibold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Retirement Runway
        </h1>
        <p className="text-sm mt-1" style={{ color: "#C9BEEA" }}>
          See how long your money lasts
        </p>

        <div className="mt-5 flex items-end gap-6">
          <button onClick={() => setShowNetWorthBreakdown((v) => !v)} className="text-left">
            <div className="text-xs flex items-center gap-1" style={{ color: "#B9ACDD" }}>
              Net worth today {showNetWorthBreakdown ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </div>
            <div className="text-3xl font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {fmt(currentNetWorth, currency)}
            </div>
          </button>
          <div>
            <div className="text-xs" style={{ color: "#B9ACDD" }}>
              {ranOutAge ? "Funds run out" : "Money lasts to"}
            </div>
            <div className="text-xl font-semibold" style={{ color: ranOutAge ? "#FFB443" : "#3DDC97" }}>
              age {ranOutAge || profile.lifeExpectancy}
            </div>
          </div>
        </div>

        {showNetWorthBreakdown && (
          <div className="mt-3 rounded-xl p-3 text-xs" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="flex justify-between py-1">
              <span style={{ color: "#C9BEEA" }}>Cash</span>
              <span>{fmt(cash.amount, currency)}</span>
            </div>
            {investments
              .filter((i) => i.type !== "house")
              .map((inv) => (
                <div key={inv.id} className="flex justify-between py-1">
                  <span style={{ color: "#C9BEEA" }}>{inv.name || "Investment"}</span>
                  <span>{fmt(inv.amount, currency)}</span>
                </div>
              ))}
            {investments
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
            {retirement.map((r) => (
              <div key={r.id} className="flex justify-between py-1">
                <span style={{ color: "#C9BEEA" }}>{r.name || "Retirement account"}</span>
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
          <div className="flex justify-between text-[11px] mt-1.5" style={{ color: "#B9ACDD" }}>
            <span>age {profile.currentAge}</span>
            <span>age {profile.lifeExpectancy}</span>
          </div>
        </div>

        <div className="mt-5 flex gap-2 text-xs flex-wrap">
          <button
            onClick={saveAsProfile}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 font-medium"
            style={{ background: "rgba(255,255,255,0.14)", color: "white" }}
          >
            <Save size={12} /> Save as profile
          </button>
          {hasProfile && (
            <button
              onClick={loadProfile}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 font-medium"
              style={{ background: "rgba(255,255,255,0.14)", color: "white" }}
            >
              <FolderOpen size={12} /> Load profile
            </button>
          )}
          <button
            onClick={startFresh}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 font-medium"
            style={{ background: "rgba(255,255,255,0.14)", color: "white" }}
          >
            <Sparkles size={12} /> Start fresh
          </button>
        </div>
        {toast && <div className="mt-2 text-xs" style={{ color: "#FFC24B" }}>{toast}</div>}
      </div>

      {/* top tab bar: Home / Inputs / Results / What If */}
      <div className="sticky top-0 z-10 bg-white border-b border-stone-200 flex px-1 pt-2">
        {[
          { id: "home", label: "Home" },
          { id: "inputs", label: "Inputs" },
          { id: "results", label: "Results" },
          { id: "whatif", label: "What If" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2.5 text-[13px] font-semibold rounded-t-lg mx-0.5"
            style={
              tab === t.id
                ? { color: "#231D3B", borderBottom: "3px solid #4C8DFF" }
                : { color: "#A79FC0", borderBottom: "3px solid transparent" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "home" && (
        <div className="px-5 py-6">
          <div className="rounded-3xl p-6 text-center text-white" style={{ background: heroGradient }}>
            <div className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-widest mb-3" style={{ color: "#C9BEEA" }}>
              <Timer size={13} /> Work Clock
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
              until Financial Freedom
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <SummaryStat label="Current invested wealth" value={fmt(investedWealth, currency)} color="#4C8DFF" />
            <SummaryStat label="Annual spending" value={fmt(annualSpending, currency)} color="#FF6B5B" />
            <SummaryStat label="Expected real return" value={`${realReturn.toFixed(1)}%`} color="#3DDC97" />
            <SummaryStat label="Monthly savings" value={fmt(monthlySavings, currency)} color="#7C5CFC" />
          </div>

          <div className="mt-4 rounded-2xl p-4" style={{ background: "linear-gradient(120deg, #E9FBF2, #EAF3FF)" }}>
            <div className="text-xs text-stone-500">Financial independence</div>
            <div className="text-2xl font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#1B7A4C" }}>
              {fiAge != null ? `age ${Math.floor(fiAge)}` : "Not yet reached"}
            </div>
            <div className="text-sm font-semibold mt-1" style={{ color: "#1B7A4C" }}>
              {fiAge != null
                ? `${fiY} year${fiY === 1 ? "" : "s"} ${fiM} month${fiM === 1 ? "" : "s"} ${fiD} day${fiD === 1 ? "" : "s"} remaining!!`
                : "Add more savings or contributions to see a date"}
            </div>
          </div>

          <button
            onClick={() => setTab("inputs")}
            className="w-full mt-5 rounded-full py-3.5 font-semibold text-white"
            style={{ background: "linear-gradient(90deg, #4C8DFF, #7C5CFC)" }}
          >
            See my full plan →
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
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="px-5 pt-3">
            <button
              onClick={() => setActiveSection(activeSection === "order" ? "profile" : "order")}
              className="w-full flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold border transition-colors"
              style={
                activeSection === "order"
                  ? { background: SECTION_COLORS.order, color: "white", borderColor: SECTION_COLORS.order }
                  : { background: "white", color: SECTION_COLORS.order, borderColor: `${SECTION_COLORS.order}55` }
              }
            >
              <span className="flex items-center gap-1.5">
                <Home size={14} /> Withdrawal & sale order
              </span>
              {activeSection === "order" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
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
                <Field label="Region you live in">
                  <SelectInput
                    value={profile.region}
                    onChange={(v) => setProfile({ ...profile, region: v })}
                    options={REGIONS.map((r) => ({ value: r, label: r }))}
                  />
                </Field>
                <Field label="Expected average tax rate (Average)">
                  <NumberInput
                    accent={SECTION_COLORS.profile}
                    value={profile.taxBracket}
                    suffix="%"
                    onChange={(v) => setProfile({ ...profile, taxBracket: v })}
                  />
                </Field>
              </div>
            )}
            {activeSection === "profile" && (
              <p className="text-xs text-stone-400 mt-2">
                This is your <strong>average effective tax rate</strong> — the share of income and withdrawals
                actually paid in tax overall — not your top marginal bracket.
              </p>
            )}

            {activeSection === "income" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Annual salary (gross)">
                  <NumberInput accent={SECTION_COLORS.income} value={work.salary} onChange={(v) => setWork({ ...work, salary: v })} />
                </Field>
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
              <p className="text-xs text-stone-400 mt-3 leading-relaxed">
                <strong>Years still working</strong> controls everything time-limited: once it runs out, salary
                stops, and so do all contributions below (to investments, retirement accounts, and mortgage
                payments) — e.g. set it to 5 and nothing is added to any account from year 6 onward.
                <br />
                <strong>Monthly expenses</strong> above does <strong>not</strong> include mortgage payments —
                those are set per property on the Investments tab and handled separately. Rental income there
                grows with inflation every year; mortgage payments never do.
              </p>
            )}

            {activeSection === "income" && (investments.some((i) => i.type !== "house") || retirement.length > 0) && (
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#8A81A6" }}>
                  Contributions
                </h3>
                <p className="text-xs text-stone-400 mb-3">
                  These stop automatically the moment "years still working" above runs out — no contributions
                  are added in any year after you stop working.
                </p>
                {investments
                  .filter((inv) => inv.type !== "house")
                  .map((inv) => {
                    const color = invColor(inv.id);
                    return (
                      <div key={inv.id} className="rounded-xl bg-white p-3 mb-2 shadow-sm" style={{ borderLeft: `4px solid ${color}` }}>
                        <div className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                          {inv.name || "Investment"}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Contribution">
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
                      </div>
                    );
                  })}
                {retirement.map((r) => {
                  const color = retColor(r.id);
                  return (
                    <div key={r.id} className="rounded-xl bg-white p-3 mb-2 shadow-sm" style={{ borderLeft: `4px solid ${color}` }}>
                      <div className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                        {r.name || "Retirement account"}
                      </div>
                      <Field label="Annual contribution">
                        <NumberInput accent={color} value={r.contribution || 0} onChange={(v) => updateRetirement(r.id, { contribution: v })} />
                      </Field>
                    </div>
                  );
                })}
              </div>
            )}

            {activeSection === "cash" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cash on hand">
                  <NumberInput accent={SECTION_COLORS.cash} value={cash.amount} onChange={(v) => setCash({ ...cash, amount: v })} />
                </Field>
                <Field label="Interest rate">
                  <NumberInput
                    accent={SECTION_COLORS.cash}
                    value={cash.rate}
                    suffix="%/yr"
                    onChange={(v) => setCash({ ...cash, rate: v })}
                  />
                </Field>
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
                            onChange={(v) => updateInvestment(inv.id, { type: v })}
                            options={[
                              { value: "market", label: "Market (growth)" },
                              { value: "dividend", label: "Dividend-producing" },
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
                        <Field label={inv.type === "house" ? "Current market value" : "Current value"}>
                          <NumberInput accent={color} value={inv.amount} onChange={(v) => updateInvestment(inv.id, { amount: v })} />
                        </Field>
                        <Field label={inv.type === "dividend" ? "Price growth rate" : "Growth rate"}>
                          <NumberInput
                            accent={color}
                            value={inv.growthRate}
                            suffix="%/yr"
                            onChange={(v) => updateInvestment(inv.id, { growthRate: v })}
                          />
                        </Field>
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
                      </div>

                      {inv.type !== "house" && (
                        <button
                          onClick={() => setActiveSection("income")}
                          className="text-xs font-medium underline decoration-dotted mt-1"
                          style={{ color }}
                        >
                          Contribution set in Income & expenses →
                        </button>
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

                          {inv.sellable !== false && (
                            <>
                              <Field label="After selling, what happens?">
                                <SelectInput
                                  value={inv.postSaleAction || "none"}
                                  onChange={(v) => updateInvestment(inv.id, { postSaleAction: v })}
                                  options={[
                                    { value: "none", label: "Nothing — just take the cash" },
                                    { value: "rebuy", label: "Buy a new home for a set amount" },
                                    { value: "resize", label: "Buy something worth a multiple of the sale price" },
                                    { value: "rent", label: "Rent afterward" },
                                  ]}
                                />
                              </Field>
                              {inv.postSaleAction === "rebuy" && (
                                <Field label="Value of the new home to re-buy">
                                  <NumberInput
                                    accent={color}
                                    value={inv.rebuyValue || 0}
                                    onChange={(v) => updateInvestment(inv.id, { rebuyValue: v })}
                                  />
                                </Field>
                              )}
                              {inv.postSaleAction === "resize" && (
                                <Field label="Resize factor (0.5 = half, 2 = double)">
                                  <NumberInput
                                    accent={color}
                                    value={inv.resizeFactor ?? 1}
                                    suffix="×"
                                    onChange={(v) => updateInvestment(inv.id, { resizeFactor: v })}
                                  />
                                </Field>
                              )}
                              {inv.postSaleAction === "rent" && (
                                <Field label="Monthly rent after the sale (grows with inflation)">
                                  <NumberInput
                                    accent={color}
                                    value={inv.postSaleRent || 0}
                                    onChange={(v) => updateInvestment(inv.id, { postSaleRent: v })}
                                  />
                                </Field>
                              )}
                              {(inv.postSaleAction === "rebuy" || inv.postSaleAction === "resize" || inv.postSaleAction === "rent") && (
                                <p className="text-xs text-stone-400 -mt-1 mb-2">
                                  When this property is sold, 100% of its equity is liquidated that year (not just
                                  what's needed), and this plan kicks in immediately.
                                </p>
                              )}
                            </>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Purchase price (bought value)">
                              <NumberInput
                                accent={color}
                                value={inv.purchasePrice ?? inv.amount}
                                onChange={(v) => updateInvestment(inv.id, { purchasePrice: v })}
                              />
                            </Field>
                            <Field label="Mortgage balance remaining">
                              <NumberInput
                                accent={color}
                                value={inv.mortgageBalance || 0}
                                onChange={(v) => updateMortgage(inv, { mortgageBalance: v })}
                              />
                            </Field>
                          </div>
                          <p className="text-xs text-stone-400 -mt-1 mb-2">
                            ≈ {fmt(equity, currency)} equity so far ({pctPaid}% paid off). Only the gain above the
                            purchase price is taxed when sold.
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
                              Floating — follows your Cash section's interest rate assumption each year. At today's
                              rate, ≈ {formatYears(solveMortgageYears(inv.mortgageBalance || 0, inv.mortgagePayment || 0, cash.rate))} remaining.
                            </p>
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
                      </div>
                      <button
                        onClick={() => setActiveSection("income")}
                        className="text-xs font-medium underline decoration-dotted mb-3 inline-block"
                        style={{ color }}
                      >
                        Contribution set in Income & expenses →
                      </button>
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
            <h2 className="text-sm font-semibold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Balance by bucket, per year
            </h2>
            <p className="text-xs text-stone-400 mb-3">Tap any point on the chart to see what changed that year.</p>
            <ResponsiveContainer width="100%" height={340}>
              <AreaChart
                data={years}
                margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
                onClick={(state) => {
                  if (state && state.activeLabel != null) setSelectedAge(state.activeLabel);
                }}
                style={{ cursor: "pointer" }}
              >
                <defs>
                  {seriesKeys.map((key, idx) => (
                    <linearGradient key={key} id={`fill-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PALETTE[idx % PALETTE.length]} stopOpacity={0.7} />
                      <stop offset="95%" stopColor={PALETTE[idx % PALETTE.length]} stopOpacity={0.08} />
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
                <Tooltip formatter={(v) => fmt(v, currency)} labelFormatter={(l) => `Age ${l}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {seriesKeys.map((key, idx) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stackId="1"
                    stroke={PALETTE[idx % PALETTE.length]}
                    strokeWidth={2}
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
              {seriesKeys.map((key, idx) => {
                const color = PALETTE[idx % PALETTE.length];
                const before = prevRecord ? prevRecord[key] || 0 : 0;
                const after = selectedRecord[key] || 0;
                const delta = after - before;
                const detail = selectedRecord._explain ? selectedRecord._explain[key] : null;
                const lines = buildExplainLines(detail, currency, key === "Cash" ? selectedRecord._lumpSumEvents : null);
                return (
                  <div key={key} className="py-2 border-b border-stone-100">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                        {key}
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
                <span className="text-xs font-bold">Total</span>
                <span className="text-xs font-bold" style={{ color: selectedRecord._total - (prevRecord?._total || 0) >= 0 ? "#1B7A4C" : "#B23A22" }}>
                  {selectedRecord._total - (prevRecord?._total || 0) >= 0 ? "+" : ""}
                  {fmt(selectedRecord._total - (prevRecord?._total || 0), currency)}
                </span>
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5 text-right">
                {fmt(prevRecord?._total || 0, currency)} → {fmt(selectedRecord._total, currency)}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-2xl bg-white p-3.5 shadow-sm">
              <div className="text-xs text-stone-400">At life expectancy ({profile.lifeExpectancy})</div>
              <div className="text-lg font-semibold" style={{ color: "#4C8DFF", fontFamily: "'Space Grotesk', sans-serif" }}>
                {finalYear ? fmt(finalYear._total, currency) : "-"}
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
            gradually instead. Selling home equity is taxed only on the gain above its purchase price. Rental
            income and post-sale rent both grow with inflation every year; mortgage payments never do — a
            floating-rate mortgage's interest cost still follows your Cash section's rate. Monthly expenses
            exclude mortgage payments. The tax rate is a flat average, not marginal brackets. Lump sums hit as a
            single cash event in the year they occur, untaxed and not inflation-adjusted. Growth is applied once
            per year, before that year's withdrawals.
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
                  </>
                ) : (
                  <Field label="New value (starts as your current setting)">
                    <NumberInput
                      accent="#7C5CFC"
                      value={change.value}
                      suffix={lever.unit(currency)}
                      onChange={(v) => updateWhatIfChange(change.id, { value: v })}
                    />
                  </Field>
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

          {fiDeltaDays != null && fiDeltaDays !== 0 && (
            <div
              className="mt-4 rounded-2xl px-4 py-3.5 text-sm font-semibold"
              style={
                fiDeltaDays > 0
                  ? { background: "#FFF1EC", color: "#B23A22" }
                  : { background: "#E9FBF2", color: "#1B7A4C" }
              }
            >
              {fiDeltaDays > 0
                ? `That scenario costs you ${formatYMD(daysToYMD(fiDeltaDays))} of freedom.`
                : `That scenario buys you ${formatYMD(daysToYMD(Math.abs(fiDeltaDays)))} of freedom!`}
            </div>
          )}

          <div className="rounded-2xl bg-white p-3.5 shadow-sm mt-4">
            <h2 className="text-sm font-semibold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Total net worth over time
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={comparisonData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEE9F7" />
                <XAxis dataKey="age" tick={{ fontSize: 11, fill: "#8A81A6" }} label={{ value: "Age", position: "insideBottom", offset: -3, fontSize: 11, fill: "#8A81A6" }} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: "#8A81A6" }} width={45} />
                <Tooltip formatter={(v) => (v == null ? "—" : fmt(v, currency))} labelFormatter={(l) => `Age ${l}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
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
