import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  AreaChart, Area, LineChart, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ReferenceArea
} from "recharts";
import {
  Plus, Trash2, ChevronUp, ChevronDown, ChevronLeft, Home, TrendingUp, Wallet, PiggyBank, User, Sparkles, Rocket, Timer, GitCompare, Info, X, Table2, ArrowLeftRight
} from "lucide-react";

// ---------- helpers ----------
const uid = () => Math.random().toString(36).slice(2, 9);
const REGION_CURRENCY = { US: "USD", EU: "EUR", UK: "GBP", Canada: "CAD", Other: "USD" };
// reverse lookup: which market region does a given currency imply? Used so a USD-priced
// investment gets US return assumptions even if the person lives in the Eurozone.
const CURRENCY_REGION = { USD: "US", EUR: "EU", GBP: "UK", CAD: "Canada" };
function regionForCurrency(ccy, fallbackRegion) {
  return CURRENCY_REGION[ccy] || fallbackRegion;
}
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

// Every other short UI label/button/option across the app — Field labels, dropdown
// options, etc. — is translated through this flat English-text-keyed dictionary instead
// of semantic keys, so wrapping a literal string is just tt("That string") with nothing
// else to wire up. Falls back to the original English text when no entry exists, so
// nothing breaks if a spot is missed. Deliberately does NOT cover: country/region/tax-
// country names (proper nouns, e.g. "France", "Germany" in the tax-country picker),
// the technical per-country tax-table descriptions, or the Info page's long-form
// explanations — those are excluded on purpose (see the Profile tab's language note).
const PHRASES = {
  "% of final salary": { fr: "% du dernier salaire", it: "% dell'ultimo stipendio" },
  "% of surplus kept as cash": { fr: "% du surplus gardé en liquidités", it: "% del surplus tenuto in liquidità" },
  "Add per month": { fr: "Ajout par mois", it: "Aggiunta al mese" },
  "Added per year": { fr: "Ajouté par an", it: "Aggiunto all'anno" },
  "After selling, what happens?": { fr: "Après la vente, que se passe-t-il ?", it: "Dopo la vendita, cosa succede?" },
  "Agency / selling fee": { fr: "Frais d'agence / de vente", it: "Commissione di agenzia / vendita" },
  "Allow withdrawals before minimum age?": { fr: "Autoriser les retraits avant l'âge minimum ?", it: "Consentire prelievi prima dell'età minima?" },
  "Already taxed — tax-free withdrawal": { fr: "Déjà imposé — retrait non imposable", it: "Già tassato — prelievo esentasse" },
  "Already taxed — tax-free withdrawal (e.g. Roth)": { fr: "Déjà imposé — retrait non imposable (ex. Roth)", it: "Già tassato — prelievo esentasse (es. Roth)" },
  "Amount": { fr: "Montant", it: "Importo" },
  "Amount today": { fr: "Montant aujourd'hui", it: "Importo attuale" },
  "Annual contribution": { fr: "Cotisation annuelle", it: "Contributo annuale" },
  "Annual salary (gross)": { fr: "Salaire annuel (brut)", it: "Stipendio annuo (lordo)" },
  "At age": { fr: "À l'âge de", it: "All'età di" },
  "Average tax rate": { fr: "Taux d'imposition moyen", it: "Aliquota fiscale media" },
  "Balance today": { fr: "Solde actuel", it: "Saldo attuale" },
  "Buy a new home for a set amount": { fr: "Acheter un nouveau logement pour un montant fixe", it: "Comprare una nuova casa per un importo fisso" },
  "Buy a smaller property": { fr: "Acheter un bien plus petit", it: "Comprare un immobile più piccolo" },
  "CD / term deposit (fixed rate)": { fr: "Dépôt à terme (taux fixe)", it: "Deposito vincolato (tasso fisso)" },
  "Can this property be sold to cover expenses?": { fr: "Ce bien peut-il être vendu pour couvrir des dépenses ?", it: "Questo immobile può essere venduto per coprire le spese?" },
  "Capital gains tax rate": { fr: "Taux d'imposition sur les plus-values", it: "Aliquota fiscale sulle plusvalenze" },
  "Cash": { fr: "Liquidités", it: "Liquidità" },
  "Cash deposit": { fr: "Apport en liquidités", it: "Deposito in contanti" },
  "Cash on hand": { fr: "Liquidités disponibles", it: "Liquidità disponibile" },
  "Cost basis (amount originally invested)": { fr: "Base de coût (montant investi à l'origine)", it: "Base di costo (importo investito inizialmente)" },
  "Could you sell this if you needed the money?": { fr: "Pourriez-vous vendre ce bien si vous aviez besoin d'argent ?", it: "Potresti vendere questo bene se avessi bisogno di denaro?" },
  "Currency": { fr: "Devise", it: "Valuta" },
  "Current age": { fr: "Âge actuel", it: "Età attuale" },
  "Current balance": { fr: "Solde actuel", it: "Saldo attuale" },
  "Current market value": { fr: "Valeur marchande actuelle", it: "Valore di mercato attuale" },
  "Current value": { fr: "Valeur actuelle", it: "Valore attuale" },
  "Deposit funded from": { fr: "Apport financé par", it: "Acconto finanziato da" },
  "Dividend tax rate": { fr: "Taux d'imposition des dividendes", it: "Aliquota fiscale sui dividendi" },
  "Dividend yield": { fr: "Rendement du dividende", it: "Rendimento da dividendo" },
  "Dividend-producing": { fr: "Générateur de dividendes", it: "Che genera dividendi" },
  "Do you hold money in more than one currency?": { fr: "Détenez-vous de l'argent dans plusieurs devises ?", it: "Hai denaro in più di una valuta?" },
  "Does it rise with inflation?": { fr: "Augmente-t-elle avec l'inflation ?", it: "Aumenta con l'inflazione?" },
  "Does your spending decline as you age?": { fr: "Vos dépenses diminuent-elles avec l'âge ?", it: "La tua spesa diminuisce con l'età?" },
  "Early withdrawal penalty": { fr: "Pénalité de retrait anticipé", it: "Penale per prelievo anticipato" },
  "Expected appreciation": { fr: "Appréciation attendue", it: "Apprezzamento atteso" },
  "Expected market return": { fr: "Rendement de marché attendu", it: "Rendimento di mercato atteso" },
  "Fixed": { fr: "Fixe", it: "Fisso" },
  "Fixed interest rate (today's rate)": { fr: "Taux d'intérêt fixe (taux actuel)", it: "Tasso di interesse fisso (tasso odierno)" },
  "Fixed number (no bracket table for this country yet)": { fr: "Nombre fixe (pas de barème pour ce pays pour l'instant)", it: "Numero fisso (nessuna tabella per questo paese per ora)" },
  "Floating": { fr: "Variable", it: "Variabile" },
  "Forecast": { fr: "Prévisions", it: "Previsioni" },
  "Frequency": { fr: "Fréquence", it: "Frequenza" },
  "Full pension needs work until": { fr: "Pension complète nécessite de travailler jusqu'à", it: "Pensione piena richiede di lavorare fino a" },
  "Growth rate": { fr: "Taux de croissance", it: "Tasso di crescita" },
  "Home": { fr: "Accueil", it: "Home" },
  "House / property": { fr: "Maison / bien immobilier", it: "Casa / immobile" },
  "I know:": { fr: "Je connais :", it: "Conosco:" },
  "I started working at": { fr: "J'ai commencé à travailler à", it: "Ho iniziato a lavorare a" },
  "If it's sold, what happens?": { fr: "Si vendu, que se passe-t-il ?", it: "Se venduto, cosa succede?" },
  "Inflation": { fr: "Inflation", it: "Inflazione" },
  "Interest rate": { fr: "Taux d'intérêt", it: "Tasso di interesse" },
  "Invest it in the market": { fr: "L'investir sur les marchés", it: "Investirlo sul mercato" },
  "Is mortgage interest tax-deductible against this rent?": { fr: "Les intérêts du prêt sont-ils déductibles de ce loyer ?", it: "Gli interessi del mutuo sono deducibili da questo affitto?" },
  "Keep as cash": { fr: "Garder en liquidités", it: "Tenerlo in liquidità" },
  "Keep at least": { fr: "Garder au moins", it: "Tenere almeno" },
  "Keep at most": { fr: "Garder au plus", it: "Tenere al massimo" },
  "Life expectancy": { fr: "Espérance de vie", it: "Aspettativa di vita" },
  "Loan term": { fr: "Durée du prêt", it: "Durata del prestito" },
  "Locked in for": { fr: "Bloqué pendant", it: "Bloccato per" },
  "Long-run rate (once it converges)": { fr: "Taux à long terme (une fois stabilisé)", it: "Tasso a lungo termine (una volta stabilizzato)" },
  "Main currency (results are shown in this)": { fr: "Devise principale (les résultats sont affichés dans celle-ci)", it: "Valuta principale (i risultati sono mostrati in questa)" },
  "Market (growth)": { fr: "Marché (croissance)", it: "Mercato (crescita)" },
  "Bond / fixed income": { fr: "Obligations / revenu fixe", it: "Obbligazioni / reddito fisso" },
  "Bond / fixed-income rate": { fr: "Taux obligations / revenu fixe", it: "Tasso obbligazioni / reddito fisso" },
  "Minimum withdrawal age": { fr: "Âge minimum de retrait", it: "Età minima di prelievo" },
  "Monthly expenses (non including mortgages)": { fr: "Dépenses mensuelles (hors prêts immobiliers)", it: "Spese mensili (esclusi i mutui)" },
  "Monthly mortgage payment (0 if none)": { fr: "Mensualité du prêt (0 si aucun)", it: "Rata mensile del mutuo (0 se nessuno)" },
  "Monthly mortgage payment (fixed, never inflated)": { fr: "Mensualité du prêt (fixe, jamais indexée)", it: "Rata mensile del mutuo (fissa, mai rivalutata)" },
  "Monthly rent (grows with inflation)": { fr: "Loyer mensuel (augmente avec l'inflation)", it: "Affitto mensile (cresce con l'inflazione)" },
  "Monthly rent after selling": { fr: "Loyer mensuel après la vente", it: "Affitto mensile dopo la vendita" },
  "Monthly rent after the sale (grows with inflation)": { fr: "Loyer mensuel après la vente (augmente avec l'inflation)", it: "Affitto mensile dopo la vendita (cresce con l'inflazione)" },
  "Monthly rent it earns": { fr: "Loyer mensuel perçu", it: "Affitto mensile percepito" },
  "Mortgage balance remaining": { fr: "Solde restant du prêt", it: "Saldo residuo del mutuo" },
  "Mortgage left (0 if none)": { fr: "Prêt restant (0 si aucun)", it: "Mutuo residuo (0 se nessuno)" },
  "Mortgage rate": { fr: "Taux du prêt", it: "Tasso del mutuo" },
  "Name": { fr: "Nom", it: "Nome" },
  "No investments yet": { fr: "Aucun investissement pour l'instant", it: "Nessun investimento ancora" },
  "No — always pay the full amount": { fr: "Non — toujours payer le montant total", it: "No — paga sempre l'importo pieno" },
  "No — everything is in one currency": { fr: "Non — tout est dans une seule devise", it: "No — tutto è in un'unica valuta" },
  "No — fixed amount forever": { fr: "Non — montant fixe pour toujours", it: "No — importo fisso per sempre" },
  "No — locked until min. age": { fr: "Non — bloqué jusqu'à l'âge minimum", it: "No — bloccato fino all'età minima" },
  "No — never sell (e.g. keep the family home)": { fr: "Non — ne jamais vendre (ex. garder la maison de famille)", it: "No — non vendere mai (es. tenere la casa di famiglia)" },
  "No — never sell (e.g. primary home)": { fr: "Non — ne jamais vendre (ex. résidence principale)", it: "No — non vendere mai (es. abitazione principale)" },
  "No — same real spending every year": { fr: "Non — mêmes dépenses réelles chaque année", it: "No — stessa spesa reale ogni anno" },
  "No — tax the full rent": { fr: "Non — imposer le loyer en totalité", it: "No — tassa l'affitto per intero" },
  "Ongoing contribution": { fr: "Cotisation continue", it: "Contributo continuativo" },
  "Pay": { fr: "Payer", it: "Pagare" },
  "Per month": { fr: "Par mois", it: "Al mese" },
  "Per year": { fr: "Par an", it: "All'anno" },
  "Price growth rate": { fr: "Taux de croissance du prix", it: "Tasso di crescita del prezzo" },
  "Primary home": { fr: "Résidence principale", it: "Abitazione principale" },
  "Primary residence": { fr: "Résidence principale", it: "Abitazione principale" },
  "Property value": { fr: "Valeur du bien", it: "Valore dell'immobile" },
  "Purchase price (bought value)": { fr: "Prix d'achat (valeur d'acquisition)", it: "Prezzo di acquisto (valore d'acquisto)" },
  "Put it in a CD": { fr: "Le placer dans un dépôt à terme", it: "Metterlo in un deposito vincolato" },
  "Rate type": { fr: "Type de taux", it: "Tipo di tasso" },
  "Receive": { fr: "Recevoir", it: "Ricevere" },
  "Reduce it if I stop working early?": { fr: "La réduire si j'arrête de travailler plus tôt ?", it: "Ridurla se smetto di lavorare prima?" },
  "Region": { fr: "Région", it: "Regione" },
  "Region you live in": { fr: "Région où vous vivez", it: "Regione in cui vivi" },
  "Rent afterward": { fr: "Louer ensuite", it: "Affittare in seguito" },
  "Rental property": { fr: "Bien locatif", it: "Immobile in affitto" },
  "Rented out": { fr: "Loué", it: "Affittato" },
  "Resize factor (0.5 = half, 2 = double)": { fr: "Facteur de redimensionnement (0,5 = moitié, 2 = double)", it: "Fattore di ridimensionamento (0,5 = metà, 2 = doppio)" },
  "Rest goes into": { fr: "Le reste va dans", it: "Il resto va in" },
  "Salary currency": { fr: "Devise du salaire", it: "Valuta dello stipendio" },
  "Salary growth": { fr: "Croissance du salaire", it: "Crescita dello stipendio" },
  "Set my own number": { fr: "Définir mon propre chiffre", it: "Imposta un mio valore" },
  "Spending declines with age?": { fr: "Les dépenses diminuent-elles avec l'âge ?", it: "La spesa diminuisce con l'età?" },
  "Starts at age": { fr: "Commence à l'âge de", it: "Inizia all'età di" },
  "Tax treatment": { fr: "Traitement fiscal", it: "Trattamento fiscale" },
  "Taxed when withdrawn": { fr: "Imposé au retrait", it: "Tassato al prelievo" },
  "Taxed when withdrawn (e.g. 401(k), traditional IRA)": { fr: "Imposé au retrait (ex. 401(k), IRA traditionnel)", it: "Tassato al prelievo (es. 401(k), IRA tradizionale)" },
  "This is my": { fr: "Ceci est mon/ma", it: "Questa è la mia" },
  "Type": { fr: "Type", it: "Tipo" },
  "Usage": { fr: "Usage", it: "Utilizzo" },
  "Value of the new home": { fr: "Valeur du nouveau logement", it: "Valore della nuova casa" },
  "Value of the new home to re-buy": { fr: "Valeur du nouveau logement à racheter", it: "Valore della nuova casa da riacquistare" },
  "Value today": { fr: "Valeur actuelle", it: "Valore attuale" },
  "What changes?": { fr: "Qu'est-ce qui change ?", it: "Cosa cambia?" },
  "What should happen to the money?": { fr: "Que doit-il advenir de l'argent ?", it: "Cosa dovrebbe succedere al denaro?" },
  "Years remaining": { fr: "Années restantes", it: "Anni rimanenti" },
  "Years still working": { fr: "Années restant à travailler", it: "Anni ancora da lavorare" },
  "Yes — deduct interest before tax": { fr: "Oui — déduire les intérêts avant impôt", it: "Sì — deduci gli interessi prima delle tasse" },
  "Yes — include in withdrawal order": { fr: "Oui — inclure dans l'ordre de retrait", it: "Sì — includi nell'ordine di prelievo" },
  "Yes — include it as a fallback": { fr: "Oui — l'inclure comme solution de repli", it: "Sì — includilo come soluzione di riserva" },
  "Yes — indexed to inflation": { fr: "Oui — indexée sur l'inflation", it: "Sì — indicizzata all'inflazione" },
  "Yes — indexed to inflation (most state pensions)": { fr: "Oui — indexée sur l'inflation (la plupart des pensions d'État)", it: "Sì — indicizzata all'inflazione (la maggior parte delle pensioni statali)" },
  "Yes — scale by years contributed (realistic)": { fr: "Oui — proportionnelle aux années cotisées (réaliste)", it: "Sì — proporzionale agli anni contribuiti (realistico)" },
  "Yes — show currency per account": { fr: "Oui — afficher la devise par compte", it: "Sì — mostra la valuta per conto" },
  "Yes — spending eases off through retirement": { fr: "Oui — les dépenses diminuent pendant la retraite", it: "Sì — la spesa diminuisce durante la pensione" },
  "Yes — with a penalty": { fr: "Oui — avec une pénalité", it: "Sì — con una penale" },
  "Your average tax rate": { fr: "Votre taux d'imposition moyen", it: "La tua aliquota fiscale media" },
  "Your capital gains tax rate": { fr: "Votre taux d'imposition sur les plus-values", it: "La tua aliquota fiscale sulle plusvalenze" },
  "Your dividend tax rate": { fr: "Votre taux d'imposition des dividendes", it: "La tua aliquota fiscale sui dividendi" },
  "Country (for tax purposes)": { fr: "Pays (à des fins fiscales)", it: "Paese (ai fini fiscali)" },
  "State (for tax purposes)": { fr: "État (à des fins fiscales)", it: "Stato (ai fini fiscali)" },
  "Add another change": { fr: "Ajouter un changement", it: "Aggiungi un cambiamento" },
  "Investment": { fr: "Investissement", it: "Investimento" },
  "Retirement": { fr: "Retraite", it: "Pensione" },
  "New weighted-average rate": { fr: "Nouveau taux moyen pondéré", it: "Nuovo tasso medio ponderato" },
  "New value (starts as your current setting)": { fr: "Nouvelle valeur (part de votre réglage actuel)", it: "Nuovo valore (parte dalla tua impostazione attuale)" },
  "Today": { fr: "Aujourd'hui", it: "Oggi" },
  "What if": { fr: "Et si", it: "E se" },
  "Time until freedom": { fr: "Temps avant la liberté", it: "Tempo all'indipendenza" },
  "Total net worth over time": { fr: "Patrimoine net total dans le temps", it: "Patrimonio netto totale nel tempo" },
  "more": { fr: "de plus", it: "in più" },
  "less": { fr: "de moins", it: "in meno" },
  "no market accounts yet": { fr: "aucun compte de marché pour l'instant", it: "nessun conto di mercato ancora" },
  "no CDs yet": { fr: "aucun dépôt à terme pour l'instant", it: "nessun deposito vincolato ancora" },
  "Mortgage": { fr: "Prêt", it: "Mutuo" },
  "Add another account": { fr: "Ajouter un autre compte", it: "Aggiungi un altro conto" },
  "Add another cash account": { fr: "Ajouter un autre compte de liquidités", it: "Aggiungi un altro conto di liquidità" },
  "Add another investment": { fr: "Ajouter un autre investissement", it: "Aggiungi un altro investimento" },
  "Add another property": { fr: "Ajouter un autre bien", it: "Aggiungi un altro immobile" },
  "CD interest rate": { fr: "Taux du dépôt à terme", it: "Tasso del deposito vincolato" },
  "Where leftover income goes": { fr: "Où va l'argent restant", it: "Dove va il reddito residuo" },
  "Does this have a mortgage?": { fr: "Y a-t-il un prêt immobilier ?", it: "C'è un mutuo su questo immobile?" },
  "No — owned outright": { fr: "Non — entièrement payé", it: "No — di piena proprietà" },
  "Yes — still paying it off": { fr: "Oui — encore en cours de remboursement", it: "Sì — lo sto ancora pagando" },
  "Investments": { fr: "Investissements", it: "Investimenti" },
  "Properties": { fr: "Biens immobiliers", it: "Immobili" },
  "Pension": { fr: "Retraite", it: "Pensione" },
  "Assets": { fr: "Actifs", it: "Attivi" },
  "Debt (mortgage)": { fr: "Dette (prêt immobilier)", it: "Debito (mutuo)" },
  "All categories": { fr: "Toutes les catégories", it: "Tutte le categorie" },
  "More options": { fr: "Plus d'options", it: "Altre opzioni" },
  "One-off amounts": { fr: "Montants ponctuels", it: "Importi una tantum" },
  "Show the maths": { fr: "Voir les formules", it: "Vedi le formule" },
  "Estimate": { fr: "Estimation", it: "Stima" },
  "income tax": { fr: "d'impôt sur le revenu", it: "di imposta sul reddito" },
  "Your average effective rate, not your top bracket. Full explanation on the Info page.": {
    fr: "Votre taux effectif moyen, pas votre tranche supérieure. Explication complète sur la page Infos.",
    it: "La tua aliquota media effettiva, non il tuo scaglione più alto. Spiegazione completa nella pagina Info.",
  },
  "Default": { fr: "Par défaut", it: "Predefinito" },
  "Enter my own": { fr: "Saisir ma valeur", it: "Inserisci il mio valore" },
  "Re-sort by rate (lowest first)": { fr: "Retrier par taux (le plus bas d'abord)", it: "Riordina per tasso (dal più basso)" },
  "Balances change as your plan runs, so this order can drift. Re-sorting draws down your lowest-rate accounts first, so higher-return money keeps growing longer, and always leaves your primary home last.": {
    fr: "Les soldes évoluent au fil du plan, donc cet ordre peut se décaler. Le retri puise d'abord dans les comptes au taux le plus bas, pour laisser l'argent le plus rentable continuer à croître, et laisse toujours votre résidence principale en dernier.",
    it: "I saldi cambiano nel corso del piano, quindi quest'ordine può disallinearsi. Il riordino attinge prima dai conti con il tasso più basso, così il denaro più redditizio continua a crescere più a lungo, e lascia sempre la tua abitazione principale per ultima.",
  },
  "show split": { fr: "voir le détail", it: "vedi dettaglio" },
  "then": { fr: "puis", it: "poi" },
  "Zoomed in": { fr: "Zoom actif", it: "Zoom attivo" },
  "Age": { fr: "Âge", it: "Età" },
  "Full range": { fr: "Vue complète", it: "Vista completa" },
  "Drag across the chart to zoom into a period": {
    fr: "Faites glisser sur le graphique pour zoomer sur une période",
    it: "Trascina sul grafico per ingrandire un periodo",
  },
  "Sell my primary residence?": { fr: "Vendre ma résidence principale ?", it: "Vendere la mia abitazione principale?" },
  "Sell my primary residence in this scenario?": {
    fr: "Vendre ma résidence principale dans ce scénario ?",
    it: "Vendere la mia abitazione principale in questo scenario?",
  },
  "No — never sell it": { fr: "Non — ne jamais la vendre", it: "No — non venderla mai" },
  "Yes — it's on the table if funds run short": {
    fr: "Oui — envisageable si les fonds viennent à manquer",
    it: "Sì — un'opzione se i fondi dovessero scarseggiare",
  },
  "This flips whether your primary home can ever be sold in this scenario — it doesn't schedule a sale at a set age, it just changes whether it's available as a last resort if the plan runs short.": {
    fr: "Ceci change si votre résidence principale peut être vendue dans ce scénario — cela ne planifie pas une vente à un âge donné, cela change seulement si elle est disponible en dernier recours si le plan manque de fonds.",
    it: "Questo cambia se la tua abitazione principale può essere venduta in questo scenario — non pianifica una vendita a un'età specifica, cambia solo se è disponibile come ultima risorsa se il piano rimane a corto di fondi.",
  },
  "Change withdrawal order": { fr: "Modifier l'ordre de retrait", it: "Modifica l'ordine di prelievo" },
  "A separate withdrawal order just for this scenario — reorder it to test how much it matters.": {
    fr: "Un ordre de retrait distinct rien que pour ce scénario — réorganisez-le pour voir à quel point cela compte.",
    it: "Un ordine di prelievo separato solo per questo scenario — riordinalo per vedere quanto conta.",
  },
  "Reset to today's order": { fr: "Revenir à l'ordre actuel", it: "Ripristina l'ordine attuale" },
  "income tax on what's left": { fr: "d'impôt sur le revenu sur ce qui reste", it: "di imposta sul reddito su ciò che resta" },
  "social charges": { fr: "de charges sociales", it: "di contributi sociali" },
};
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
    wizard_monthlyExpenses: "How much do you spend per month — not including any mortgage?",
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
    wizard_back_label: "Back",
    chart_header: "Balance by bucket, per year",
    toggle_future: "Future $",
    toggle_today: "Today's $",
    chart_bold_today: "today's money",
    chart_bold_future: "future dollars",
    chart_note_real: "— every future year's numbers have inflation stripped back out, so you can compare them directly to prices today. This is usually the more honest view of whether you're actually getting ahead.",
    chart_note_nominal: "— the actual numbers you'd see in your accounts each year, growing partly because of inflation, not just real growth. Switch to \"Today's $\" to strip that out.",
    chart_tap_hint: "Tap any point on the chart to see what changed that year.",
    chart_debt_note: "Mortgage debt is shown as a red band below zero, not just netted out of a property's equity.",
    chart_short_nominal: "What you'd actually see in your account each year.",
    chart_short_real: "What that's worth in today's prices.",
    details_label: "Details",
    mode_total: "Total",
    time_until_freedom: "Time until freedom",
    mode_assets_debt: "Assets vs debt",
    mode_full: "Breakdown",
    chart_total_note: "The thick green line is your net worth — everything you own, minus everything you owe.",
    whatif_title: "What if…",
    whatif_intro: "Add as many changes as you like — each starts pre-filled with your current value; edit it to whatever you want to test. Nothing here is saved.",
    whatif_change_label: "Change",
    whatif_lump_out_of_range: "That age is outside your simulated range ({min}\u2013{max}), so this lump sum is being ignored.",
    whatif_mortgage_note: "Your monthly payment is calculated automatically from the rate and loan term.",
    whatif_spending_decline_note: "Living expenses ease off through retirement instead of staying flat — see the Info page for the research behind it.",
    whatif_market_rate_note: "Blends every market/dividend investment and retirement account's rate, weighted by balance. Weighted average today: {rate}%.",
    whatif_bond_rate_note: "Blends every bond/fixed-income holding's rate, weighted by balance — kept separate from equities since they're a different risk/return asset class. Weighted average today: {rate}%.",
    whatif_cd_rate_note: "The rate each CD glides toward once its lock-in ends, weighted by balance. Weighted average: {rate}%.",
    wizard_note_region: "We've guessed this from your device — tap to confirm, or pick a different one if we got it wrong.",
    wizard_note_customRates: "If you'd rather not, we'll use deliberately cautious defaults for where you live — not the rosy historical average, but roughly a 25th-percentile decade (i.e. assuming markets do somewhat worse than usual). Your tax rate will also be worked out automatically from your country's tax brackets and your actual income each year, instead of one flat guessed number.",
    wizard_note_salary: "The full contractual amount — before income tax AND before any mandatory payroll deductions (social security, health insurance...) come out. We work those out automatically for where you live.",
    wizard_note_taxBracket: "We don't have exact tax brackets for your country yet, so this won't automatically adjust as your income changes each year the way it does for supported countries — it'll just stay fixed at whatever you enter. Edit it any time on the Profile tab.",
    get_started: "Get started →",
    skip_manual_entry: "Skip for now, I'll enter things myself",
    edit_label: "Edit",
    refresh_label: "Refresh",
    state_employer_pension: "State / employer pension",
    have_one_button: "I have one",
    living_expenses_label: "Living expenses",
    cost_basis_note: "Only the gain above the purchase price is taxed when sold.",
    celebration_dismiss: "Nice!",
    how_this_app_works: "How this app works",
    shortfall_why: "Why {amount} was needed — age {age}",
    shortfall_rent_after_selling: "Rent (after selling)",
    shortfall_salary: "− Salary (after tax)",
    shortfall_pension: "− Pension (after tax)",
    shortfall_rent_income: "− Rent (after tax)",
    shortfall_dividends: "− Dividends (after tax)",
    shortfall_lump_received: "− Lump sum received",
    shortfall_lump_paid: "+ Lump sum paid out",
    shortfall_total: "= Shortfall to cover",
    debt_mortgage_label: "Debt (mortgage)",
    debt_row_note: "Total mortgage balance remaining across all properties — shown negative since it's owed, not held.",
    real_terms_breakdown_note: "Balances above are in today's money; the itemized lines below stay in that year's actual (future dollar) amounts, since they describe specific transactions.",
    at_life_expectancy: "At life expectancy",
    in_todays_money: "in today's money",
    years_simulated: "Years simulated",
    year_over_year: "Age {age}: year-over-year change",
    close_label: "Close",
    net_worth_label: "Net worth",
    whatif_add_change: "Add a change",
    whatif_compare_to_baseline: "Compared to your baseline plan",
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
    wizard_back_label: "Retour",
    chart_header: "Solde par catégorie, par an",
    toggle_future: "$ futurs",
    toggle_today: "$ d'aujourd'hui",
    chart_bold_today: "l'argent d'aujourd'hui",
    chart_bold_future: "dollars futurs",
    chart_note_real: "— l'inflation a été retirée de chaque année future, pour pouvoir comparer directement aux prix d'aujourd'hui. C'est généralement la vue la plus honnête pour savoir si vous progressez réellement.",
    chart_note_nominal: "— les montants réels que vous verriez sur vos comptes chaque année, qui augmentent en partie à cause de l'inflation, pas seulement grâce à une croissance réelle. Passez à « $ d'aujourd'hui » pour retirer cet effet.",
    chart_tap_hint: "Touchez un point du graphique pour voir ce qui a changé cette année-là.",
    chart_debt_note: "La dette hypothécaire est affichée comme une bande rouge sous zéro, pas seulement déduite de la valeur nette d'un bien.",
    chart_short_nominal: "Ce que vous verriez réellement sur votre compte chaque année.",
    chart_short_real: "Ce que cela vaut aux prix d'aujourd'hui.",
    details_label: "Détails",
    mode_total: "Total",
    time_until_freedom: "Temps avant la liberté",
    mode_assets_debt: "Actifs vs dette",
    mode_full: "Détail",
    chart_total_note: "La ligne verte épaisse est votre patrimoine net — tout ce que vous possédez, moins tout ce que vous devez.",
    whatif_title: "Et si…",
    whatif_intro: "Ajoutez autant de changements que vous voulez — chacun démarre avec votre valeur actuelle ; modifiez-la pour tester ce que vous voulez. Rien n'est enregistré ici.",
    whatif_change_label: "Changement",
    whatif_lump_out_of_range: "Cet âge est hors de votre période simulée ({min}\u2013{max}), cette somme ponctuelle est donc ignorée.",
    whatif_mortgage_note: "Votre mensualité est calculée automatiquement à partir du taux et de la durée du prêt.",
    whatif_spending_decline_note: "Les dépenses diminuent progressivement pendant la retraite plutôt que de rester stables — voir la page Infos pour les recherches derrière cela.",
    whatif_market_rate_note: "Combine le taux de chaque investissement de marché/dividende et compte retraite, pondéré par le solde. Moyenne pondérée actuelle : {rate} %.",
    whatif_bond_rate_note: "Combine le taux de chaque placement obligataire, pondéré par le solde — gardé séparé des actions car c'est une classe d'actifs au profil risque/rendement différent. Moyenne pondérée actuelle : {rate} %.",
    whatif_cd_rate_note: "Le taux vers lequel chaque dépôt à terme converge une fois le blocage terminé, pondéré par le solde. Moyenne pondérée : {rate} %.",
    wizard_note_region: "Nous avons deviné ceci à partir de votre appareil — touchez pour confirmer, ou choisissez-en un autre si nous nous sommes trompés.",
    wizard_note_customRates: "Si vous préférez ne pas le faire, nous utiliserons des hypothèses volontairement prudentes pour votre région — pas la moyenne historique optimiste, mais plutôt une décennie autour du 25e centile (c'est-à-dire en supposant que les marchés fassent un peu moins bien que d'habitude). Votre taux d'imposition sera aussi calculé automatiquement à partir des tranches fiscales de votre pays et de vos revenus réels chaque année, plutôt qu'un chiffre fixe deviné.",
    wizard_note_salary: "Le montant contractuel complet — avant l'impôt sur le revenu ET avant toute déduction obligatoire sur salaire (sécurité sociale, assurance maladie...). Nous calculons cela automatiquement selon votre lieu de résidence.",
    wizard_note_taxBracket: "Nous n'avons pas encore de tranches fiscales exactes pour votre pays, donc cela ne s'ajustera pas automatiquement quand vos revenus changent chaque année comme pour les pays pris en charge — cela restera fixe à ce que vous saisissez. Modifiable à tout moment dans l'onglet Profil.",
    get_started: "Commencer →",
    skip_manual_entry: "Passer pour l'instant, je saisirai tout moi-même",
    edit_label: "Modifier",
    refresh_label: "Actualiser",
    state_employer_pension: "Pension d'État / d'employeur",
    have_one_button: "J'en ai une",
    living_expenses_label: "Dépenses courantes",
    cost_basis_note: "Seul le gain au-dessus du prix d'achat est imposé lors de la vente.",
    celebration_dismiss: "Super !",
    how_this_app_works: "Comment fonctionne cette appli",
    shortfall_why: "Pourquoi {amount} était nécessaire — à {age} ans",
    shortfall_rent_after_selling: "Loyer (après la vente)",
    shortfall_salary: "− Salaire (net d'impôt)",
    shortfall_pension: "− Pension (nette d'impôt)",
    shortfall_rent_income: "− Loyer (net d'impôt)",
    shortfall_dividends: "− Dividendes (nets d'impôt)",
    shortfall_lump_received: "− Somme ponctuelle reçue",
    shortfall_lump_paid: "+ Somme ponctuelle versée",
    shortfall_total: "= Découvert à couvrir",
    debt_mortgage_label: "Dette (prêt immobilier)",
    debt_row_note: "Solde total des prêts immobiliers sur tous les biens — affiché en négatif puisque c'est dû, pas détenu.",
    real_terms_breakdown_note: "Les soldes ci-dessus sont en argent d'aujourd'hui ; les lignes détaillées ci-dessous restent dans les montants réels de cette année-là (dollars futurs), car elles décrivent des opérations précises.",
    at_life_expectancy: "À l'espérance de vie",
    in_todays_money: "en argent d'aujourd'hui",
    years_simulated: "Années simulées",
    year_over_year: "Âge {age} : évolution sur l'année",
    close_label: "Fermer",
    net_worth_label: "Patrimoine net",
    whatif_add_change: "Ajouter un changement",
    whatif_compare_to_baseline: "Comparé à votre plan de référence",
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
    wizard_back_label: "Indietro",
    chart_header: "Saldo per categoria, per anno",
    toggle_future: "$ futuri",
    toggle_today: "$ di oggi",
    chart_bold_today: "il valore di oggi",
    chart_bold_future: "dollari futuri",
    chart_note_real: "— l'inflazione è stata rimossa da ogni anno futuro, così puoi confrontare direttamente con i prezzi di oggi. Di solito è la visione più onesta per capire se stai davvero migliorando.",
    chart_note_nominal: "— gli importi reali che vedresti sui tuoi conti ogni anno, che crescono in parte per l'inflazione, non solo per crescita reale. Passa a \"$ di oggi\" per rimuovere questo effetto.",
    chart_tap_hint: "Tocca un punto del grafico per vedere cosa è cambiato quell'anno.",
    chart_debt_note: "Il debito ipotecario è mostrato come una banda rossa sotto zero, non solo sottratto dal patrimonio di un immobile.",
    chart_short_nominal: "Quello che vedresti davvero sul tuo conto ogni anno.",
    chart_short_real: "Quanto vale ai prezzi di oggi.",
    details_label: "Dettagli",
    mode_total: "Totale",
    time_until_freedom: "Tempo all'indipendenza",
    mode_assets_debt: "Attivi vs debito",
    mode_full: "Dettaglio",
    chart_total_note: "La linea verde spessa è il tuo patrimonio netto — tutto ciò che possiedi, meno tutto ciò che devi.",
    whatif_title: "E se…",
    whatif_intro: "Aggiungi tutti i cambiamenti che vuoi — ognuno parte già impostato sul tuo valore attuale; modificalo per testare quello che vuoi. Niente qui viene salvato.",
    whatif_change_label: "Cambiamento",
    whatif_lump_out_of_range: "Questa età è fuori dal periodo simulato ({min}\u2013{max}), quindi questa somma una tantum viene ignorata.",
    whatif_mortgage_note: "La rata mensile viene calcolata automaticamente dal tasso e dalla durata del prestito.",
    whatif_spending_decline_note: "Le spese diminuiscono gradualmente durante la pensione invece di restare costanti — vedi la pagina Info per la ricerca alla base.",
    whatif_market_rate_note: "Combina il tasso di ogni investimento di mercato/dividendo e conto pensionistico, ponderato per saldo. Media ponderata attuale: {rate}%.",
    whatif_bond_rate_note: "Combina il tasso di ogni investimento obbligazionario, ponderato per saldo — tenuto separato dalle azioni perché è una classe di attivi con un profilo rischio/rendimento diverso. Media ponderata attuale: {rate}%.",
    whatif_cd_rate_note: "Il tasso verso cui converge ogni deposito vincolato una volta terminato il blocco, ponderato per saldo. Media ponderata: {rate}%.",
    wizard_note_region: "Lo abbiamo dedotto dal tuo dispositivo — tocca per confermare, o scegline un altro se abbiamo sbagliato.",
    wizard_note_customRates: "Se preferisci di no, useremo ipotesi volutamente prudenti per la tua zona — non la media storica ottimistica, ma un decennio intorno al 25° percentile (cioè assumendo che i mercati vadano un po' peggio del solito). Anche la tua aliquota fiscale sarà calcolata automaticamente dagli scaglioni del tuo paese e dal tuo reddito reale ogni anno, invece di un numero fisso indovinato.",
    wizard_note_salary: "L'importo contrattuale completo — prima delle imposte sul reddito E prima di qualsiasi trattenuta obbligatoria in busta paga (previdenza sociale, assicurazione sanitaria...). Li calcoliamo automaticamente in base a dove vivi.",
    wizard_note_taxBracket: "Non abbiamo ancora scaglioni fiscali esatti per il tuo paese, quindi questo non si adatterà automaticamente quando il tuo reddito cambia ogni anno come per i paesi supportati — resterà fisso a quanto inserisci. Modificabile in qualsiasi momento nella scheda Profilo.",
    get_started: "Inizia →",
    skip_manual_entry: "Salta per ora, inserirò tutto io stesso",
    edit_label: "Modifica",
    refresh_label: "Aggiorna",
    state_employer_pension: "Pensione statale / aziendale",
    have_one_button: "Ne ho una",
    living_expenses_label: "Spese correnti",
    cost_basis_note: "Solo il guadagno sopra il prezzo di acquisto viene tassato alla vendita.",
    celebration_dismiss: "Ottimo!",
    how_this_app_works: "Come funziona questa app",
    shortfall_why: "Perché servivano {amount} — età {age}",
    shortfall_rent_after_selling: "Affitto (dopo la vendita)",
    shortfall_salary: "− Stipendio (netto)",
    shortfall_pension: "− Pensione (netta)",
    shortfall_rent_income: "− Affitto (netto)",
    shortfall_dividends: "− Dividendi (netti)",
    shortfall_lump_received: "− Somma una tantum ricevuta",
    shortfall_lump_paid: "+ Somma una tantum versata",
    shortfall_total: "= Ammanco da coprire",
    debt_mortgage_label: "Debito (mutuo)",
    debt_row_note: "Saldo totale dei mutui su tutte le proprietà — mostrato negativo perché è dovuto, non posseduto.",
    real_terms_breakdown_note: "I saldi sopra sono in valore odierno; le righe dettagliate sotto restano negli importi reali di quell'anno (dollari futuri), perché descrivono transazioni specifiche.",
    at_life_expectancy: "All'aspettativa di vita",
    in_todays_money: "in valore odierno",
    years_simulated: "Anni simulati",
    year_over_year: "Età {age}: variazione anno su anno",
    close_label: "Chiudi",
    net_worth_label: "Patrimonio netto",
    whatif_add_change: "Aggiungi un cambiamento",
    whatif_compare_to_baseline: "Confrontato con il tuo piano di base",
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
// the Results-chart toggle needs the person's ACTUAL currency symbol, not a hardcoded
// "$" — someone using EUR or GBP was seeing "Future $" / "Today's $" regardless of
// what currency the rest of the app was already showing them
function trMoneyToggle(language, symbol, which) {
  if (language === "fr") return which === "future" ? `${symbol} futurs` : `${symbol} d'aujourd'hui`;
  if (language === "it") return which === "future" ? `${symbol} futuri` : `${symbol} di oggi`;
  return which === "future" ? `Future ${symbol}` : `Today's ${symbol}`;
}
// What-If comparison panel: "that scenario costs/buys you X of freedom"
function trScenarioDelta(language, formattedDuration, costs) {
  if (language === "fr") return costs ? `Ce scénario vous coûte ${formattedDuration} de liberté.` : `Ce scénario vous fait gagner ${formattedDuration} de liberté !`;
  if (language === "it") return costs ? `Questo scenario ti costa ${formattedDuration} di libertà.` : `Questo scenario ti fa guadagnare ${formattedDuration} di libertà!`;
  return costs ? `That scenario costs you ${formattedDuration} of freedom.` : `That scenario buys you ${formattedDuration} of freedom!`;
}
// "Your money lasts either way — but you'd end up with X more/less by age Y"
function trMoneyEitherWay(language, amount, moreWord, age) {
  if (language === "fr") return `Votre argent dure dans les deux cas — mais vous vous retrouveriez avec ${amount} ${moreWord} à ${age} ans.`;
  if (language === "it") return `I tuoi soldi durano comunque — ma ti ritroveresti con ${amount} ${moreWord} a ${age} anni.`;
  return `Your money lasts either way — but you'd end up with ${amount} ${moreWord} by age ${age}.`;
}
// the one-sentence, plain-language summary shown above the Results chart — the whole
// point is to convert the chart into a single actionable/understandable takeaway rather
// than making someone read a graph to know if their plan works
function trPlanSummary(language, kind, params) {
  if (kind === "runsOut") {
    const { age, yearsShort, target } = params;
    if (language === "fr")
      return `Votre argent s'épuise à ${age} ans — ${yearsShort} an${yearsShort === 1 ? "" : "s"} avant votre objectif de ${target} ans.`;
    if (language === "it")
      return `I tuoi soldi finiscono a ${age} anni — ${yearsShort} ann${yearsShort === 1 ? "o" : "i"} prima del tuo obiettivo di ${target} anni.`;
    return `Your money runs out at age ${age} — ${yearsShort} year${yearsShort === 1 ? "" : "s"} before your target of ${target}.`;
  }
  if (kind === "stopAt") {
    const { stopAge, target } = params;
    if (language === "fr") return `À ce rythme, vous pourriez arrêter de travailler à ${stopAge} ans et votre argent durerait jusqu'à ${target} ans.`;
    if (language === "it") return `A questo ritmo, potresti smettere di lavorare a ${stopAge} anni e i tuoi soldi durerebbero fino a ${target} anni.`;
    return `At this rate, you could stop working at ${stopAge} and your money would last to ${target}.`;
  }
  const { target } = params;
  if (language === "fr") return `Votre argent dure tout au long de votre plan, jusqu'à ${target} ans.`;
  if (language === "it") return `I tuoi soldi durano per tutto il tuo piano, fino a ${target} anni.`;
  return `Your money lasts through your plan, to age ${target}.`;
}
function trRemaining(language, y, m, d) {
  if (language === "fr") return `${y} an${y === 1 ? "" : "s"} ${m} mois ${d} jour${d === 1 ? "" : "s"} restants !!`;
  if (language === "it") return `${y} ann${y === 1 ? "o" : "i"} ${m} mes${m === 1 ? "e" : "i"} ${d} giorn${d === 1 ? "o" : "i"} rimanenti!!`;
  return `${y} year${y === 1 ? "" : "s"} ${m} month${m === 1 ? "" : "s"} ${d} day${d === 1 ? "" : "s"} remaining!!`;
}
// turns a day-count delta into a short "2 years 3 months" style phrase, for the
// "biggest lever" insight — deliberately coarser than trRemaining (drops days) since
// this is an approximate what-if nudge, not a precise countdown
function formatDurationShort(days) {
  const y = Math.floor(days / 365.25);
  const m = Math.round((days - y * 365.25) / 30.4375);
  const parts = [];
  if (y > 0) parts.push(`${y} year${y === 1 ? "" : "s"}`);
  if (m > 0 && y < 5) parts.push(`${m} month${m === 1 ? "" : "s"}`);
  return parts.length ? parts.join(" ") : "a few weeks";
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

// ---------------------------------------------------------------------------------
// Info page structure. Every topic has a stable `id` so other parts of the app can deep
// link straight to it (see openInfoTopic), and belongs to a `section` so the page reads
// as an organised reference rather than one long scroll. Titles are matched on the
// English title string, which is what the content arrays already key off.
const INFO_SECTIONS = [
  { id: "basics", label: "How the plan is calculated" },
  { id: "tax", label: "Tax" },
  { id: "property", label: "Property & mortgages" },
  { id: "money", label: "Cash, currency & inflation" },
  { id: "reference", label: "Reference tables" },
];
// maps an English topic title -> { id, section }
const INFO_TOPIC_META = {
  "The year-by-year simulation": { id: "simulation", section: "basics" },
  "Growth, every single year": { id: "growth", section: "basics" },
  "State pension if you retire early": { id: "pension", section: "basics" },
  "Where surplus (or a windfall) goes": { id: "surplus", section: "basics" },
  "Spending decline with age (optional)": { id: "spending-decline", section: "basics" },

  "Average tax rate — worked out automatically ('Auto' mode)": { id: "tax-rate", section: "tax" },
  "Your average tax rate — automatic, or your own number": { id: "tax-rate", section: "tax" },
  "Capital gains — its own rate, by country": { id: "capital-gains", section: "tax" },
  "Capital gains — why it's not the same as your income tax rate": { id: "capital-gains", section: "tax" },
  "Taxes on withdrawals": { id: "withdrawal-tax", section: "tax" },

  "Mortgages — locked amortization schedule": { id: "mortgages", section: "property" },
  "Mortgages — a locked payment schedule": { id: "mortgages", section: "property" },
  "Selling a house (always 100%, never partial)": { id: "selling-house", section: "property" },
  "Selling a house — and the primary-residence tax break": { id: "selling-house", section: "property" },

  "Currency conversion": { id: "currency", section: "money" },
  "Multiple currencies": { id: "currency", section: "money" },
};
// topics whose title is built dynamically fall back to this
function infoTopicMeta(title) {
  if (INFO_TOPIC_META[title]) return INFO_TOPIC_META[title];
  if (String(title).includes("Today's $")) return { id: "real-vs-nominal", section: "money" };
  return { id: String(title).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40), section: "basics" };
}

// The maths behind each topic, written as MATHS — not as code. Plain-language variable
// names, no internal identifiers, and a one-line explanation per formula. Shown in a
// small popup from the topic it belongs to, rather than as one wall of black text.
const MATH_BY_TOPIC = {
  simulation: [
    { expr: "leftover  =  income  −  spending", note: "Everything coming in that year, minus everything going out." },
    { expr: "if leftover < 0 :  sell assets to cover the gap", note: "Shortfalls are met by drawing from your accounts, in the order you set." },
  ],
  growth: [
    { expr: "next year  =  this year  ×  (1 + rate)  +  contributions", note: "Each pot compounds at its own rate, then that year's contributions are added." },
    { expr: "after n years  =  start  ×  (1 + rate)ⁿ", note: "Left untouched, that is simply compound growth." },
    { expr: "cautious rate  ≈  historical average  −  3", note: "Defaults sit roughly at a 25th-percentile decade rather than the long-run average." },
  ],
  pension: [
    { expr: "pension  =  final salary  ×  %  ×  ( years worked ÷ years for a full pension )", note: "Stopping early scales the pension down proportionally." },
    { expr: "indexed pension  =  pension  ×  (1 + inflation)^years since it started", note: "Only if you've marked it as inflation-linked." },
  ],
  surplus: [
    { expr: "if cash < floor :  all of it goes to cash", note: "Rebuild the emergency buffer first." },
    { expr: "if cash > ceiling :  all of it is invested", note: "Above the ceiling, extra cash is put to work." },
    { expr: "otherwise :  split by your chosen %", note: "In between, it divides according to the percentage you set." },
  ],
  "spending-decline": [
    { expr: "years 1–10 :  spending falls ≈ 1% a year", note: "Real living costs, excluding rent or mortgage." },
    { expr: "years 11–19 :  falls ≈ 2% a year", note: "The decline steepens through the middle of retirement." },
    { expr: "after that :  flat", note: "It levels off rather than falling forever." },
  ],
  "tax-rate": [
    { expr: "take-home  =  ( salary − social charges )  ×  (1 − income tax rate)", note: "Social charges come off first; income tax then applies to what's left. They are not added together." },
    { expr: "average rate  =  total tax owed  ÷  total income", note: "This is your effective rate across all bands — not the rate of your top band." },
    { expr: "tax owed  =  Σ over bands  ( income in that band × that band's rate )", note: "Each slice of income is taxed at its own band's rate." },
  ],
  "capital-gains": [
    { expr: "taxable gain  =  sale price  −  what you paid", note: "Only the growth is taxed, never the original amount." },
    { expr: "UK :  18% or 24%, by income band", note: "Capital gains has its own schedule, separate from income tax." },
    { expr: "Canada :  only ½ of the gain is taxable", note: "Which works out as half your ordinary rate." },
  ],
  "withdrawal-tax": [
    { expr: "amount to withdraw  =  what you need  ÷  (1 − tax rate)", note: "Grossed up so the tax comes out of the withdrawal itself and you still net what you needed." },
    { expr: "taxed fraction  =  ( value − what you paid )  ÷  value", note: "Selling part of an investment only taxes the gain portion of it." },
  ],
  mortgages: [
    { expr: "monthly payment  =  balance × i  ÷  ( 1 − (1 + i)⁻ⁿ )", note: "The standard annuity formula. i is the monthly rate, n the number of months." },
    { expr: "interest this month  =  balance  ×  monthly rate", note: "The rest of the payment reduces the balance." },
    { expr: "balance falls to zero at exactly month n", note: "The whole schedule is fixed up front, so the loan ends on time." },
  ],
  "selling-house": [
    { expr: "you receive  =  value  −  mortgage  −  fees  −  tax on the gain", note: "A property is always sold whole, never in part." },
    { expr: "taxable gain  =  ( sale price − what you paid )  −  exemption", note: "Most countries exempt some or all of the gain on your main home." },
  ],
  currency: [
    { expr: "converted  =  amount  ×  ( rate of its currency ÷ rate of yours )", note: "Everything is converted into your main currency before any totals are added up." },
  ],
  "real-vs-nominal": [
    { expr: "in today's money  =  future amount  ÷  (1 + inflation)^years ahead", note: "Strips inflation back out so a future figure can be compared with prices now." },
  ],
};

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
// the region-appropriate default growth rate for a given investment type — used
// whenever Type or Region changes, so the number shown always matches "what does this
// asset class typically do in this region" rather than carrying over a stale rate from
// whatever the investment used to be
function defaultGrowthRateForType(rd, type) {
  if (type === "cd") return rd.cdRate;
  if (type === "bond") return rd.bondReturn;
  if (type === "house") return rd.propertyReturn;
  return rd.marketReturn; // market, dividend
}

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
  US: {
    currency: "USD", inflation: 2.5, cashRate: 0, cdRate: 4.0, cdRateLongRun: 2.0,
    marketReturn: 7.0, historicalReturn: 10.0, index: "S&P 500",
    propertyReturn: 2.0, propertyHistoricalReturn: 4.0,
    bondReturn: 3.5, bondHistoricalReturn: 5.0, bondIndex: "Bloomberg US Aggregate Bond Index",
    label: "United States",
  },
  EU: {
    currency: "EUR", inflation: 2.1, cashRate: 0, cdRate: 2.5, cdRateLongRun: 1.6,
    marketReturn: 4.0, historicalReturn: 7.0, index: "Euro Stoxx 50",
    propertyReturn: 1.0, propertyHistoricalReturn: 3.0,
    bondReturn: 2.5, bondHistoricalReturn: 4.0, bondIndex: "Bloomberg Euro Aggregate Bond Index",
    label: "Eurozone",
  },
  UK: {
    currency: "GBP", inflation: 2.5, cashRate: 0, cdRate: 4.0, cdRateLongRun: 2.0,
    marketReturn: 3.5, historicalReturn: 6.5, index: "FTSE 100",
    propertyReturn: 1.5, propertyHistoricalReturn: 3.5,
    bondReturn: 3.5, bondHistoricalReturn: 5.0, bondIndex: "Bloomberg Sterling Aggregate Bond Index",
    label: "United Kingdom",
  },
  Canada: {
    currency: "CAD", inflation: 2.0, cashRate: 0, cdRate: 3.5, cdRateLongRun: 1.5,
    marketReturn: 5.0, historicalReturn: 8.0, index: "S&P/TSX",
    propertyReturn: 2.0, propertyHistoricalReturn: 4.5,
    bondReturn: 4.0, bondHistoricalReturn: 5.5, bondIndex: "FTSE Canada Universe Bond Index",
    label: "Canada",
  },
  Other: {
    currency: "USD", inflation: 2.5, cashRate: 0, cdRate: 2.5, cdRateLongRun: 1.6,
    marketReturn: 4.0, historicalReturn: 7.0, index: "global equities",
    propertyReturn: 1.5, propertyHistoricalReturn: 3.0,
    bondReturn: 3.0, bondHistoricalReturn: 4.5, bondIndex: "global aggregate bonds",
    label: "Somewhere else",
  },
};
// Bond defaults follow the exact same "cautious decade, not the rosy average" philosophy
// as equities above — one blended government + investment-grade corporate bond index per
// region, haircut from its historical average. The haircut is smaller than equities'
// (~1.5pt vs ~3pt) because bonds are meaningfully less volatile, so a "somewhat
// disappointing decade" isn't as far below the long-run mean. High-yield corporate bonds
// specifically are NOT modeled separately — they sit somewhere between this and equities
// in risk/return, so someone holding them is better served picking a rate between the two
// defaults (or their own number) than by us inventing a third, thinly-supported index.

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
    label: "France — barème progressif (single, 2025)",
    ordinary: [
      { upTo: 11497, rate: 0 },
      { upTo: 29315, rate: 11 },
      { upTo: 83823, rate: 30 },
      { upTo: 180294, rate: 41 },
      { upTo: Infinity, rate: 45 },
    ],
    // mandatory employee "cotisations salariales" (pension, unemployment, health,
    // CSG/CRDS) — this is what turns "salaire brut" into take-home pay, BEFORE income
    // tax is even applied. Only levied on salary, never on a pension, rental income, or
    // interest — so it's kept separate from the "ordinary" bracket above rather than
    // folded into it, or a retiree's pension would get taxed as if it were still salary.
    // ~23% is a representative single, non-cadre figure; real French payroll deductions
    // are somewhat banded and vary by sector, so this is a round approximation.
    // Banded, not flat: French cotisations salariales fall sharply above the PASS
    // (plafond annuel de la sécurité sociale, €47,100 in 2025). Vieillesse plafonnée
    // stops at 1 PASS and Agirc-Arrco retirement contributions stop at 8 PASS
    // (€376,800), above which essentially only CSG/CRDS (~9.7%) continues. A flat 23%
    // badly over-charged high earners — a €750k salary was losing ~23% to social
    // charges when the real effective figure is closer to 16%.
    salaryOnlyAddOn: [
      { upTo: 47100, rate: 23 }, // up to 1 PASS — full contributions
      { upTo: 376800, rate: 22 }, // 1–8 PASS — vieillesse plafonnée stops, Agirc-Arrco T2 higher
      { upTo: Infinity, rate: 10 }, // above 8 PASS — essentially CSG/CRDS only
    ],
    // "abattement de 10% pour frais professionnels" — a standard deduction applied to
    // salary before income tax is calculated, capped per person
    salaryDeductionPct: 10,
    salaryDeductionCap: 14171,
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
    // mandatory Sozialversicherung (pension ~9.3%, unemployment ~1.3%, health ~8.05%,
    // long-term care ~1.8-2.3%) — salary only, same reasoning as France above
    // Banded: German Sozialversicherung stops entirely above the Beitragsbemessungs-
    // grenzen — health/care at €66,150 and pension/unemployment at €96,600 (2025).
    salaryOnlyAddOn: [
      { upTo: 66150, rate: 20 }, // all four branches
      { upTo: 96600, rate: 10.6 }, // pension 9.3% + unemployment 1.3% only
      { upTo: Infinity, rate: 0 }, // above both ceilings — nothing further
    ],
    // Werbungskostenpauschbetrag — flat employee expenses allowance
    salaryDeductionPct: 0,
    salaryDeductionFlat: 1230,
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
    // INPS employee contribution, banded — a higher rate above the first threshold,
    // then capped entirely at the massimale for post-1996 entrants (~€120,607)
    salaryOnlyAddOn: [
      { upTo: 55008, rate: 9.19 },
      { upTo: 120607, rate: 10.19 },
      { upTo: Infinity, rate: 0 },
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
    // Seguridad Social employee contribution, capped at the base máxima
    // (~€4,909.50/month = ~€58,914/year in 2025) — nothing above it
    salaryOnlyAddOn: [
      { upTo: 58914, rate: 6.48 },
      { upTo: Infinity, rate: 0 },
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
    label: "UK income tax (single, 2025/26) + employee National Insurance",
    // pure income tax bands — NOT blended with National Insurance here, since NI only
    // applies to salary, never to a pension, rent, or interest (a retiree living off a
    // pension doesn't pay NI on it at all)
    ordinary: [
      { upTo: 12570, rate: 0 },
      { upTo: 50270, rate: 20 },
      { upTo: 125140, rate: 40 },
      { upTo: Infinity, rate: 45 },
    ],
    // National Insurance is properly banded (0% / 8% / 2%), so — unlike the flat
    // add-ons used for other countries — this is its own small bracket table, applied
    // only to salary
    salaryOnlyAddOn: [
      { upTo: 12570, rate: 0 },
      { upTo: 50270, rate: 8 },
      { upTo: Infinity, rate: 2 },
    ],
    // pure income-tax bands (identical to "ordinary" above, NI never applies to
    // dividends) — used only to work out which dividend band someone's income falls into
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
    // FICA (Social Security 6.2% + Medicare 1.45%) — salary only; the Social Security
    // portion actually caps at a wage threshold, ignored here for simplicity, so this
    // slightly overstates the add-on for very high earners
    salaryOnlyAddOn: [
      { upTo: 176100, rate: 7.65 }, // SS 6.2% + Medicare 1.45%, to the 2025 wage base
      { upTo: 200000, rate: 1.45 }, // SS capped out — Medicare only
      { upTo: Infinity, rate: 2.35 }, // + 0.9% additional Medicare surtax
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
    // FICA — salary only, see the note on US_NY above
    salaryOnlyAddOn: [
      { upTo: 176100, rate: 7.65 }, // SS 6.2% + Medicare 1.45%, to the 2025 wage base
      { upTo: 200000, rate: 1.45 }, // SS capped out — Medicare only
      { upTo: Infinity, rate: 2.35 }, // + 0.9% additional Medicare surtax
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
    // CPP + CPP2 + EI, all properly capped (2025): basic exemption $3,500; CPP 5.95%
    // to the YMPE $71,300; CPP2 4% from there to $81,200; EI 1.64% to $65,700.
    // Nothing at all above $81,200.
    salaryOnlyAddOn: [
      { upTo: 3500, rate: 0 }, // basic exemption
      { upTo: 65700, rate: 7.59 }, // CPP 5.95 + EI 1.64
      { upTo: 71300, rate: 5.95 }, // EI maxed out
      { upTo: 81200, rate: 4 }, // CPP2 band only
      { upTo: Infinity, rate: 0 },
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

// mandatory employee social-insurance contributions (NI, cotisations sociales,
// Sozialversicherung, FICA, CPP/EI...) — computed from SALARY ALONE, not blended with
// pension/rent/interest, since none of these systems tax a pension or rental income the
// way they tax a paycheck. Handles both a flat percentage (most countries, since a
// single round number is a reasonable approximation) and a proper bracket table (the
// UK, where National Insurance really is banded at 0/8/2%).
function computeSalaryAddOnRate(taxCountry, grossSalary) {
  const table = TAX_TABLES[taxCountry] || TAX_TABLES.GENERIC_OTHER;
  const addOn = table.salaryOnlyAddOn;
  if (!addOn) return 0;
  if (Array.isArray(addOn)) return effectiveRateFromBrackets(grossSalary, addOn);
  return addOn;
}

// The part of a gross salary that income tax is actually levied on.
//
// Income tax and social charges are NOT two rates you add together and apply to the
// gross — they stack SEQUENTIALLY. Mandatory social contributions come off first, then
// income tax is charged on what's left (less any standard employee-expenses allowance).
// Adding the rates instead materially over-taxes: a €750k French salary came out at
// ~65% total tax when the correct figure is ~54%.
function taxableSalaryPortion(taxCountry, grossSalary) {
  const table = TAX_TABLES[taxCountry] || TAX_TABLES.GENERIC_OTHER;
  const afterSocial = Math.max(0, grossSalary * (1 - computeSalaryAddOnRate(taxCountry, grossSalary) / 100));
  let deduction = 0;
  if (table.salaryDeductionPct) {
    deduction = afterSocial * (table.salaryDeductionPct / 100);
    if (table.salaryDeductionCap) deduction = Math.min(deduction, table.salaryDeductionCap);
  }
  if (table.salaryDeductionFlat) deduction = Math.max(deduction, table.salaryDeductionFlat);
  return { afterSocial, taxable: Math.max(0, afterSocial - deduction) };
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

// Earliest age a tax-advantaged retirement account can normally be drawn without a
// penalty — varies a lot by country, so a flat "60" was wrong nearly everywhere.
// Deliberately approximate: real rules have carve-outs (US rule of 55, UK protected
// pension ages, French carrière longue...) that aren't modeled. Editable per account.
const RETIREMENT_MIN_AGE = {
  FR: 62, // légal minimum, rising toward 64
  DE: 63, // earliest with deductions; 67 for full
  IT: 64, // "pensione anticipata" territory
  ES: 63, // early retirement floor
  UK: 55, // private pensions; rises to 57 in 2028
  US_NY: 59, // 59½ for IRA/401(k), rounded down
  US_OTHER: 59,
  CA: 60, // earliest CPP; RRSPs have no hard floor
  GENERIC_OTHER: 60,
};
function defaultRetirementMinAge(taxCountry) {
  return RETIREMENT_MIN_AGE[taxCountry] ?? 60;
}

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
  // money you needed but could not raise in any year — it doesn't vanish, it accrues
  // (arrears/borrowing). Without this, net worth kept RISING after the plan had failed,
  // because an unsellable home carried on appreciating with nothing drawn against it.
  let cumulativeUnfunded = 0;
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
    let taxableRentTotal = 0;
    const houseGrossRentById = {};
    const houseTaxableRentById = {};
    invBal.forEach((inv) => {
      if (inv.type === "house" && inv.usage === "rental") {
        const grossRent = (inv.currentRent || 0) * 12;
        houseGrossRentById[inv.id] = grossRent;
        grossRentTotal += grossRent;
        // Most countries let a landlord deduct mortgage INTEREST (not principal) from
        // rental income before tax — but the rules vary enough by country and rental
        // structure that this is opt-in per property rather than assumed. Off by default,
        // so nobody silently gets a tax break they don't actually qualify for.
        let deductibleInterest = 0;
        if (inv.mortgageInterestDeductible && (inv.mortgageBalance || 0) > 0.01) {
          const row = scheduleYearRow(mortgageSchedules[inv.id], inv.mortgageScheduleYear || 0);
          if (row) {
            deductibleInterest = row.interestPaid;
          } else {
            const rate = inv.mortgageRateType === "floating" ? cash.rate : inv.mortgageRate || 0;
            deductibleInterest = (inv.mortgageBalance || 0) * (rate / 100);
          }
        }
        const taxableRent = Math.max(0, grossRent - deductibleInterest);
        houseTaxableRentById[inv.id] = taxableRent;
        taxableRentTotal += taxableRent;
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
    // Income tax is levied on salary AFTER mandatory social contributions and the
    // standard employee-expenses allowance — not on the raw gross. Building the tax
    // base from the gross (and then also subtracting social charges as a separate rate)
    // double-counts and badly over-taxes high salaries.
    const taxCountry = resolveTaxCountry(profile);
    const taxCountrySupported = isTaxCountrySupported(taxCountry);
    const taxMode = taxCountrySupported ? profile.taxMode ?? "manual" : "manual"; // old saved profiles predate this field
    const salaryAddOnRateThisYear = taxMode === "manual" ? 0 : computeSalaryAddOnRate(taxCountry, grossSalary);
    const { afterSocial: salaryAfterSocial, taxable: taxableSalary } =
      taxMode === "manual" ? { afterSocial: grossSalary, taxable: grossSalary } : taxableSalaryPortion(taxCountry, grossSalary);
    const totalOrdinaryGrossIncome = taxableSalary + pensionGross + taxableRentTotal + cashInterestGross + cdGrossInterestTotal;

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

    // Social charges already came off in salaryAfterSocial; income tax is then applied
    // to that remainder — sequential, not two rates summed against the gross.
    const netSalary = salaryAfterSocial * (1 - taxRateThisYear / 100);
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
          const taxableRent = houseTaxableRentById[inv.id] ?? grossRent;
          netRentIncome = grossRent - taxableRent * (taxRateThisYear / 100);
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

    // ---- second tax pass: withdrawals are income too ----
    // The rates above were derived from salary/pension/rent/interest only. But a pretax
    // retirement withdrawal IS ordinary income, and a realized capital gain IS income for
    // the purpose of picking a gains band — and both were missing from that base. Without
    // this, a retiree living entirely off a pretax account looks like they have ~zero
    // income and pays ~zero tax on money that should land them in a real bracket.
    //
    // It's genuinely circular (the rate sets the withdrawal, the withdrawal sets the rate),
    // so this resolves it with one read-only measurement pass: walk the withdrawal order
    // using the provisional rates, tally what would be pulled from taxable sources, then
    // recompute the rates with that included. The refined rates are used for the
    // WITHDRAWAL decisions below; salary/pension/interest keep the base rate they were
    // already taxed at above. That residual inconsistency is deliberate and small — in the
    // years where withdrawals dominate, earned income is usually zero anyway.
    let withdrawalOrdinaryRate = taxRateThisYear;
    let withdrawalGainsRate = capitalGainsRateThisYear;
    if (netCashFlow < 0 && (taxMode === "auto" || capitalGainsTaxMode === "auto")) {
      let remaining = -netCashFlow;
      let estPretaxIncome = 0;
      let estRealizedGains = 0;
      for (const entry of withdrawalOrder) {
        if (remaining <= 0) break;
        const { type, id } = parseOrderEntry(entry);
        if (type === "cash") {
          const floor = savingsRule?.minCash || 0;
          remaining -= Math.min(Math.max(0, cashBal - floor), remaining);
        } else if (type === "investment") {
          const inv = invBal.find((i) => i.id === id && i.type !== "house");
          if (!inv || inv.amount <= 0) continue;
          const cb = inv.costBasis ?? inv.amount;
          const gf = inv.amount > 0 ? Math.max(0, (inv.amount - cb) / inv.amount) : 0;
          const tr = Math.min(gf * (capitalGainsRateThisYear / 100), 0.95);
          const take = Math.min(inv.amount, remaining / (1 - tr));
          estRealizedGains += take * gf;
          remaining -= take * (1 - tr);
        } else if (type === "retirement") {
          const r = retBal.find((x) => x.id === id);
          if (!r) continue;
          const belowMinAge = age < (r.minAge || 0);
          if (belowMinAge && !r.earlyAccessAllowed) continue;
          const penaltyRate = belowMinAge && r.earlyAccessAllowed ? (r.earlyPenalty || 0) / 100 : 0;
          const isPretax = r.taxTreatment === "pretax";
          const totalRate = Math.min((isPretax ? taxRateThisYear / 100 : 0) + penaltyRate, 0.95);
          const take = Math.min(r.amount, remaining / (1 - totalRate));
          if (isPretax) estPretaxIncome += take;
          remaining -= take * (1 - totalRate);
        } else if (type === "house") {
          const inv = invBal.find((i) => i.id === id);
          if (!inv || inv.sellable === false || inv._sold || inv.type !== "house") continue;
          const equity = Math.max(0, inv.amount - (inv.mortgageBalance || 0));
          if (equity <= 0) continue;
          const gain = Math.max(0, inv.amount - (inv.purchasePrice ?? inv.amount));
          const exempt = computeExemptPrimaryResidenceGain({
            taxCountry,
            isPrimary: inv.usage !== "rental",
            capitalGain: gain,
            saleValue: inv.amount,
            postSaleAction: inv.postSaleAction,
            rebuyValue: inv.rebuyValue,
          });
          estRealizedGains += Math.max(0, gain - exempt);
          remaining -= equity;
        }
      }
      const refinedOrdinaryBase = totalOrdinaryGrossIncome + estPretaxIncome;
      if (taxMode === "auto") withdrawalOrdinaryRate = computeOrdinaryTaxRate(taxCountry, refinedOrdinaryBase);
      if (capitalGainsTaxMode === "auto") {
        withdrawalGainsRate = computeCapitalGainsTaxRate(taxCountry, refinedOrdinaryBase + estRealizedGains);
      }
    }

    let cashWithdrawn = 0;
    let defaultedThisYear = false;
    let unfundedThisYear = 0;
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
          const taxRate = Math.min(gainFraction * (withdrawalGainsRate / 100), 0.95);
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
          const taxRate = r.taxTreatment === "pretax" ? withdrawalOrdinaryRate / 100 : 0;
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
            const tr = Math.min(gf * (withdrawalGainsRate / 100), 0.95);
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
          const gainTax = taxableGain * (withdrawalGainsRate / 100);
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
              // if no post-sale rent was ever set, fall back to a share of current living
              // costs rather than 0 — selling your home does not make housing free
              const fallbackRent = Math.round((monthlyExpenses || 0) * 0.35);
              const effectivePostSaleRent = inv.postSaleRent != null && inv.postSaleRent > 0 ? inv.postSaleRent : fallbackRent;
              extraRentExpenseAnnual = effectivePostSaleRent * 12;
              saleNote.newMonthlyRent = effectivePostSaleRent;
            }
            inv._sold = true;
            const applied = Math.min(Math.max(cashFromSale, 0), shortfall);
            shortfall -= applied;
            const leftover = cashFromSale - applied;
            if ((inv.reinvestAs === "cd" || inv.reinvestAs === "market") && leftover > 0) {
              // If no explicit reinvest rate was entered, fall back to the region's
              // default for that asset class rather than 0%/yr — someone who chose
              // "use the defaults" shouldn't silently get sale proceeds earning nothing.
              const rdReinvest = REGION_DEFAULTS[inv.region] || REGION_DEFAULTS.EU;
              const effectiveReinvestRate =
                inv.reinvestRate != null && inv.reinvestRate !== 0
                  ? inv.reinvestRate
                  : inv.reinvestAs === "cd"
                  ? rdReinvest.cdRate
                  : rdReinvest.marketReturn;
              inv.amount = leftover;
              inv.type = inv.reinvestAs === "cd" ? "cd" : "market";
              inv.growthRate = effectiveReinvestRate;
              if (inv.reinvestAs === "cd") {
                inv.cdTenorYears = inv.cdTenorYears ?? 1;
                inv.cdLongRunRate = inv.cdLongRunRate ?? rdReinvest.cdRateLongRun;
              }
              inv.mortgageBalance = 0;
              // these proceeds have already been taxed on sale — set the cost basis to the
              // amount reinvested so only FUTURE growth is taxable from here on
              inv.costBasis = leftover;
              saleNote.reinvestedAs = inv.reinvestAs;
              saleNote.reinvestedAmount = leftover;
              saleNote.reinvestRate = effectiveReinvestRate;
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
      unfundedThisYear = Math.max(0, shortfall);
    }

    // Fix 2: if we couldn't cover this year's costs, a mortgaged property must be sold —
    // you can't simply stop paying and keep the house. Proceeds cover what they can.
    if (defaultedThisYear) {
      const mortgagedCandidates = invBal.filter((i) => i.type === "house" && !i._sold && (i.mortgageBalance || 0) > 0.01);
      const mortgaged =
        mortgagedCandidates.find((i) => i.usage === "rental") || mortgagedCandidates[0];
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
        const gainTax = taxableGain * (withdrawalGainsRate / 100);
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
      // whatever still couldn't be raised this year accrues as a liability — see the
      // note on cumulativeUnfunded above
      cumulativeUnfunded += unfundedThisYear;
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
      // Houses are shown at GROSS value here, not equity — their mortgage is entirely
      // captured by the separate aggregate Debt band below. Subtracting it again here
      // would double-count it the moment the two bands are added together, which is
      // exactly the bug a "gross assets, minus a debt band" chart is meant to avoid:
      // a €500k house with a €200k mortgage used to show a €300k equity band AND a
      // −€200k Debt band, summing to €100k instead of the true €300k net worth.
      record[inv.displayName] = inv.type === "house" ? Math.max(inv.amount, 0) : Math.max(equityOf(inv), 0);
    });
    retBal.forEach((r) => (record[r.displayName] = Math.max(r.amount, 0)));
    // total outstanding mortgage debt across all properties, shown as its own NEGATIVE
    // band on the chart — a mortgaged house otherwise only shows as its (often small)
    // equity sliver, making six-figure debt invisible. Recharts stacks negative-valued
    // series below zero automatically when they share a stackId with positive ones.
    const totalMortgageDebt = invBal.reduce((s, inv) => s + (inv.type === "house" ? inv.mortgageBalance || 0 : 0), 0);
    record.Debt = -totalMortgageDebt;
    // per-property mortgage, keyed off the property's display name, so each loan can be
    // drawn as its own negative band in the Properties drill-down. Always set (even once
    // the mortgage hits 0), not just while a balance remains — leaving the key undefined
    // after payoff broke the area chart's stacking for that year instead of just shrinking
    // the band to nothing.
    invBal.forEach((inv) => {
      if (inv.type === "house") {
        record[`__debt__${inv.displayName}`] = -(inv.mortgageBalance || 0);
      }
    });
    record._grossAssets =
      Math.max(cashBal, 0) +
      invBal.reduce((s, i) => s + Math.max(i.amount, 0), 0) +
      retBal.reduce((s, r) => s + Math.max(r.amount, 0), 0);
    record._totalDebt = totalMortgageDebt;
    // Grouped category totals — what the "breakdown" chart shows by default, instead of
    // one band per individual account (unreadable once someone has more than three or
    // four). The per-account keys above are still there for drilling into one group.
    record._grpInvestments = invBal.reduce((s, i) => s + (i.type !== "house" ? Math.max(i.amount, 0) : 0), 0);
    record._grpProperties = invBal.reduce((s, i) => s + (i.type === "house" ? Math.max(i.amount, 0) : 0), 0);
    record._grpRetirement = retBal.reduce((s, r) => s + Math.max(r.amount, 0), 0);
    // Net worth = gross assets MINUS all mortgage debt. Deliberately NOT the sum of the
    // clamped per-bucket equity values used for the chart bands above: those floor at zero
    // so a stacked area chart can render them, which silently hid negative equity and
    // overstated net worth whenever a property was underwater. Defining it once here off
    // gross assets and gross debt also makes it reconcile exactly with what the chart
    // draws (positive bands, minus the red Debt band).
    record._unfunded = cumulativeUnfunded;
    record._total = record._grossAssets - totalMortgageDebt - cumulativeUnfunded;
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

// NOTE: rate/tax What-If levers (market, bond, CD, cash, and the three tax rates) and
// the one-time-lump-sum lever were removed to simplify the What-If list — see the
// weightedAvgMarketRate/weightedAvgBondRate/weightedAvgCDLongRun/taxLeverIncomeProxy
// helpers and the LEVERS entries they fed in an earlier version of this file if any of
// them need to come back.
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
    label: "Extra monthly savings",
    unit: (c) => `${c}/mo`,
    getCurrent: () => 0,
    apply: (d, v) => ({ ...d, expensesState: { ...d.expensesState, monthly: Math.max(0, d.expensesState.monthly - (v || 0)) } }),
  },
  { id: "buyhouse", label: "Buy a new investment property", special: "buyhouse" },
  { id: "spendingDecline", label: "Spending declines with age", special: "spendingDecline" },
  { id: "sellPrimaryHome", label: "Sell my primary residence?", special: "sellPrimaryHome" },
  { id: "reorderWithdrawal", label: "Change withdrawal order", special: "reorderWithdrawal" },
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
// a small, self-contained "show the exact math" disclosure, usable right where a
// number might be confusing — rather than only in the separate Info destination,
// which nobody finds mid-confusion. Collapsed by default; tapping it reveals the same
// monospace formula style used on the full Info page, just scoped to one specific
// calculation instead of the whole app.
function InlineMath({ label, math }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="-mt-1 mb-3">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "#7C5CFC" }}>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {label || "Show the exact math"}
      </button>
      {open && (
        <pre
          className="text-[10px] leading-relaxed rounded-lg p-2.5 mt-1.5 overflow-x-auto"
          style={{ background: "#231D3B", color: "#E9E4F7", fontFamily: "monospace", whiteSpace: "pre-wrap" }}
        >
          {math}
        </pre>
      )}
    </div>
  );
}
const inputCls =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-shadow";

function parseLocaleNumber(str) {
  return parseFloat(String(str).trim().replace(",", "."));
}

// A rate field that can flip between the app's suggested default and a number you type.
// Clearing a plain NumberInput left you stranded on 0 with no way back to the default —
// this keeps the default one tap away for every rate that has one. The stored value is
// always a real number, so the simulation reads it exactly as before; "default" simply
// means "currently equal to the suggested value".
// A compact "(i)" that reveals a short note on tap. Used to get long explanatory
// paragraphs out of the inputs — the full reasoning lives on the Info page.
function InfoTip({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="inline-flex items-center align-middle">
      <button
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ml-1"
        style={{ background: "#4C8DFF1A", color: "#4C8DFF" }}
        aria-label="More information"
      >
        i
      </button>
      {open && <span className="block text-[11px] text-stone-400 mt-1 leading-snug w-full">{text}</span>}
    </span>
  );
}

function RateInput({ value, defaultValue, onChange, suffix, accent = "#4C8DFF", defaultLabel = "Default", customLabel = "Enter my own" }) {
  const isAtDefault = value === defaultValue;
  const [mode, setMode] = useState(isAtDefault ? "default" : "custom");

  // if the default itself moves (e.g. the region changed) and we're tracking it,
  // follow it rather than silently freezing on the old number
  useEffect(() => {
    if (mode === "default" && value !== defaultValue) onChange(defaultValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

  return (
    <>
      <SelectInput
        value={mode}
        onChange={(m) => {
          setMode(m);
          if (m === "default") onChange(defaultValue);
        }}
        options={[
          { value: "default", label: `${defaultLabel} (${round2(defaultValue)}${suffix ? " " + suffix : ""})` },
          { value: "custom", label: customLabel },
        ]}
      />
      {mode === "custom" && (
        <div className="mt-2">
          <NumberInput value={value} onChange={onChange} suffix={suffix} accent={accent} />
        </div>
      )}
    </>
  );
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
function StackedChartTooltip({ active, payload, label, currency, netWorthLabel }) {
  if (!active || !payload || !payload.length) return null;
  // NOT a sum of the displayed bands — in "full" mode each account band is EQUITY
  // (value minus its own mortgage) while Debt is the GROSS mortgage total, so summing
  // the two double-counts debt. The payload's own data row already carries the correct
  // net worth (_total = gross assets − total debt), computed once in the simulation.
  const total = payload[0]?.payload?._total ?? payload.reduce((s, p) => s + (p.value || 0), 0);
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
        <span>{netWorthLabel || "Net worth"}</span>
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
      id: "salary",
      type: "number",
      question: "What's your annual salary, before tax?",
      suffix: `${salaryCcySymbol} / year`,
      note: "The full contractual amount — before income tax AND before any mandatory payroll deductions (social security, health insurance...) come out. We work those out automatically for where you live.",
    }
  );
  if (a.customRates) {
    steps.push({ id: "salaryGrowth", type: "number", question: "How much do you expect your salary to grow, per year?", suffix: "%/yr" });
  }
  steps.push({ id: "yearsWorking", type: "number", question: "How many more years do you plan to work?", suffix: "years" });
  steps.push({ id: "monthlyExpenses", type: "number", question: "How much do you spend per month — not including any mortgage?", suffix: `${mainCcySymbol} / month` });
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
  steps.push({ id: "cashList", type: "cashlist", question: "How much cash do you have in the bank (not invested)?" });
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
  currentAge: 40,
  multiCurrency: null,
  // onboarding always uses the regional defaults now — there's no "do you want to set
  // your own rates?" question. Every rate stays editable afterwards on the Inputs tabs.
  customRates: false,
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
  // cash is a LIST so someone holding, say, some EUR and some USD can enter both
  cashList: [{ id: "seed-cash", name: "Cash", amount: 5000, currency: "EUR" }],
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
      hasMortgage: false,
      mortgageBalance: 0,
      mortgagePayment: 0,
      mortgageInputMode: "rate",
      mortgageRate: 4.5,
      rent: 0,
      growthRate: REGION_DEFAULTS.EU.propertyReturn,
      currency: "EUR",
      sellable: false,
      postSaleAction: "rent",
      rebuyValue: 0,
      resizeFactor: 0.5,
      postSaleRent: 0,
      sellingFeePercent: 4,
    },
  ],
  hasRetirementAccount: null,
  retirementList: [
    { id: uid(), name: "Retirement account", balance: 20000, contribution: 0, growthRate: 6, taxTreatment: "pretax", currency: "EUR" },
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
    cashList: WIZARD_DEFAULTS.cashList.map((x) => ({ ...x, id: uid(), currency: rd.currency })),
    investmentsList: WIZARD_DEFAULTS.investmentsList.map((i) => ({ ...i, currency: rd.currency, growthRate: rd.marketReturn })),
    housesList: WIZARD_DEFAULTS.housesList.map((h) => ({ ...h, currency: rd.currency })),
    retirementList: WIZARD_DEFAULTS.retirementList.map((x) => ({
      ...x,
      currency: rd.currency,
      growthRate: rd.marketReturn,
      minAge: defaultRetirementMinAge(taxCountry || resolveTaxCountry({ region })),
    })),
  };
}

const defaultIndexFundId = uid();
const defaultHouseId = uid();
const defaultRetirementId = uid();
const defaultCashId = uid();

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
  cash: [{ id: defaultCashId, name: "Cash", amount: 20000, rate: 0, currency: "EUR" }],
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
      growthRate: REGION_DEFAULTS.EU.propertyReturn,
      usage: "primary",
      sellable: false,
      postSaleAction: "rent",
      purchasePrice: 400000,
      mortgageBalance: 0,
      mortgagePayment: 0,
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
      minAge: defaultRetirementMinAge("DE"),
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
  savingsRule: { cashPercent: 50, minCash: 4000 * 2, maxCash: 4000 * 12, targetInvestmentId: defaultIndexFundId },
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
  // whether the current onboarding question's explanatory note is expanded — collapsed
  // behind an (i) so the questions themselves stay short, and reset on every step change
  const [showStepNote, setShowStepNote] = useState(false);
  // collapse the note again whenever we move to a different question, so it doesn't
  // stay stuck open from a previous step
  useEffect(() => {
    setShowStepNote(false);
  }, [wizardStepIndex]);
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
  // tt(text): translates a literal English UI phrase via PHRASES — used for the many
  // Field labels and dropdown options across the Inputs tabs, where inventing a
  // semantic key for each one wasn't worth it. Same graceful fallback as tr().
  const tt = (text) => (language === "en" ? text : PHRASES[text]?.[language] ?? text);

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
  const [infoRatesRegion, setInfoRatesRegion] = useState("EU"); // Info page: region/country tables
  // which Info topics are expanded (all collapsed by default) and which section is open
  const [openInfoTopics, setOpenInfoTopics] = useState({});
  const [mathModalTopic, setMathModalTopic] = useState(null); // { id, title } or null
  const [openInfoSections, setOpenInfoSections] = useState({});
  // Deep link into the Info page from anywhere else in the app: opens the page, expands
  // the right section, and expands that one topic. e.g. openInfoTopic("capital-gains")
  const openInfoTopic = (topicId, sectionId) => {
    setShowMethodology(true);
    if (sectionId) setOpenInfoSections((p) => ({ ...p, [sectionId]: true }));
    setOpenInfoTopics((p) => ({ ...p, [topicId]: true }));
  };
  const [infoTaxCountry, setInfoTaxCountry] = useState("DE");
  const [expandedAdvanced, setExpandedAdvanced] = useState({}); // per house-card id: is the "Advanced" section open?
  // ITEM 17: input cards collapse to a one-line summary by default so a whole list fits
  // on screen without scrolling. Keyed by account id; absent = collapsed.
  const [expandedCards, setExpandedCards] = useState({});
  const toggleCard = (id) => setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  const [realTermsView, setRealTermsView] = useState(false); // Results chart: nominal (future $) vs today's money
  // Results chart detail level: "total" (one line, simplest), "assetsVsDebt" (gross
  // assets above zero, mortgage debt below — the pre-existing per-bucket colors and the
  // dashed debt line were confusing without a legend explaining them), or "full" (every
  // account broken out, the original view). Defaults to the simplest one.
  const [chartViewMode, setChartViewMode] = useState("total");
  const [chartDrilldown, setChartDrilldown] = useState(null); // null = show all four groups
  // Forecast chart pinch/drag zoom: { left, right } ages currently zoomed into, or null
  // for the full range. refAreaLeft/Right track an in-progress drag selection before it's
  // committed into chartZoom on release.
  const [chartZoom, setChartZoom] = useState(null);
  const [refAreaLeft, setRefAreaLeft] = useState(null);
  const [refAreaRight, setRefAreaRight] = useState(null);
  const justZoomedRef = useRef(false); // suppresses the tap-to-inspect-year side effect right after a drag-zoom
  // in breakdown mode the category bands already sum visually to the total, so the net
  // worth line drawn on top of them just flattens/obscures the split — off by default
  // there, but still toggleable from the legend. Always on in total mode, where it IS
  // the point.
  const [breakdownNetWorthVisible, setBreakdownNetWorthVisible] = useState(false);
  const [showWhatIfIntro, setShowWhatIfIntro] = useState(false); // What-If tab: explanation collapsed behind an (i)
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
    if (data.cash) {
      // migration: older saved data had a single cash object, not a list of accounts
      setCash(Array.isArray(data.cash) ? data.cash : [{ id: uid(), name: "Cash", ...data.cash }]);
    }
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

  // seed the first What-If row with the current baseline value once we know it.
  // Deliberately waits for onboarding to FINISH — seeding while the wizard is still open
  // captured the app defaults (4,000/mo spending, etc.) rather than the person's real
  // answers, and since the row then existed it was never re-seeded.
  useEffect(() => {
    if (loaded && !showOnboarding && whatIfChanges.length === 0) {
      const lever = LEVERS[0];
      const baseline = { profile, work, expensesState, cash, investments, retirement, withdrawalOrder, pension };
      setWhatIfChanges([{ id: uid(), leverId: lever.id, value: round2(lever.getCurrent(baseline)) }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, showOnboarding]);

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

  // Smallest-pot-first ordering, with the primary residence forced last. Used to seed the
  // order at onboarding AND available as an explicit "re-sort" action afterwards, since
  // balances move over time and a manually-reordered list should never be silently
  // rewritten underneath the person.
  const sortOrderBySize = (order, invList, retList) => {
    const valueOf = (entry) => {
      const { type, id } = parseOrderEntry(entry);
      if (type === "investment") {
        const inv = invList.find((i) => i.id === id);
        return inv ? inv.amount || 0 : 0;
      }
      if (type === "house") {
        const h = invList.find((i) => i.id === id);
        // rank a property on the equity it would actually release, not its headline value
        return h ? Math.max(0, (h.amount || 0) - (h.mortgageBalance || 0)) : 0;
      }
      if (type === "retirement") {
        const r = retList.find((x) => x.id === id);
        return r ? r.amount || 0 : 0;
      }
      return 0;
    };
    // A mortgaged rental is a leveraged investment even when its stated appreciation rate
    // looks low, as long as it's self-funding: the rent pays down the mortgage for you,
    // building equity your own cash never touched. This isolates that "free" slice —
    // of this year's mortgage payment, how much does the rent actually cover (capped at
    // the payment itself — surplus rent beyond that is ordinary income, not a property
    // return), and of THAT, what share goes to principal rather than interest (interest
    // is a pure cost, it builds nothing). That euro amount, as a fraction of the equity
    // you currently have tied up in the property, is the extra return leverage is quietly
    // handing you — on top of the plain appreciation rate every other account also has.
    const houseEffectiveRate = (h) => {
      const appreciation = typeof h.growthRate === "number" ? h.growthRate : 0;
      const V = h.amount || 0;
      const M = h.mortgageBalance || 0;
      const equityNow = V - M;
      const annualPayment = (h.mortgagePayment || 0) * 12;
      // no mortgage, underwater, not a rental, or no payment to fund — nothing to amplify,
      // just use the plain appreciation rate like any other account
      if (M <= 0.01 || equityNow <= 0.01 || h.usage !== "rental" || annualPayment <= 0) return appreciation;
      const rate = h.mortgageRateType === "floating" ? convertedCash.rate : h.mortgageRate || 0;
      const annualInterest = M * (rate / 100);
      const principalPaid = Math.max(0, Math.min(annualPayment - annualInterest, M));
      const principalFraction = principalPaid / annualPayment; // share of every payment euro that builds equity, not interest
      const annualRent = (h.rent || 0) * 12;
      const rentCovered = Math.min(annualRent, annualPayment); // rent only "counts" up to what the payment needs
      const rentFundedPrincipal = rentCovered * principalFraction; // equity gained this year that your own cash didn't pay for
      const leverageBonus = (rentFundedPrincipal / equityNow) * 100;
      return appreciation + leverageBonus;
    };
    // the account's growth/interest rate — the actual withdrawal priority key. Draining
    // the lowest-rate account first (regardless of its balance) leaves higher-rate money
    // compounding for longer. `growthRate` is the unified field for this across every
    // investment type, houses included (their appreciation rate) — except a mortgaged
    // rental, which uses the leverage-adjusted effective rate above instead.
    const rateOf = (entry) => {
      const { type, id } = parseOrderEntry(entry);
      if (type === "investment") {
        const inv = invList.find((i) => i.id === id);
        return inv && typeof inv.growthRate === "number" ? inv.growthRate : Infinity;
      }
      if (type === "house") {
        const h = invList.find((i) => i.id === id);
        return h ? houseEffectiveRate(h) : Infinity;
      }
      if (type === "retirement") {
        const r = retList.find((x) => x.id === id);
        return r && typeof r.growthRate === "number" ? r.growthRate : Infinity;
      }
      return -Infinity; // cash has no rate here — it's already pulled out and always sorted first
    };
    const isPrimaryHome = (entry) => {
      const { type, id } = parseOrderEntry(entry);
      if (type !== "house") return false;
      const h = invList.find((i) => i.id === id);
      return !!h && h.usage !== "rental";
    };
    // A retirement pot that can't legally be touched until minAge isn't a usable
    // fallback today, however small it is — so it ranks behind everything accessible.
    const isLockedRetirement = (entry) => {
      const { type, id } = parseOrderEntry(entry);
      if (type !== "retirement") return false;
      const r = retList.find((x) => x.id === id);
      if (!r) return false;
      if (r.earlyAccessAllowed) return false; // reachable, just with a penalty
      return (r.minAge || 0) > profile.currentAge;
    };
    // rank: accessible assets (0) -> locked retirement (1) -> primary home (2)
    const tier = (entry) => (isPrimaryHome(entry) ? 2 : isLockedRetirement(entry) ? 1 : 0);
    return [
      "cash",
      ...order
        .filter((e) => e !== "cash")
        .sort((x, y) => {
          const tx = tier(x), ty = tier(y);
          if (tx !== ty) return tx - ty;
          const rx = rateOf(x), ry = rateOf(y);
          if (rx !== ry) return rx - ry; // then lowest growth/interest rate first within a tier
          return valueOf(x) - valueOf(y); // tie-break: smallest balance first
        }),
    ];
  };
  const resortWithdrawalOrder = () => setWithdrawalOrder((prev) => sortOrderBySize(prev, investments, retirement));

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
    // 2 months' spending kept as an untouchable emergency floor; above 12 months'
    // spending, surplus is invested rather than left sitting in cash
    setSavingsRule((prev) => ({
      ...prev,
      minCash: Math.round((a.monthlyExpenses || 0) * 2),
      maxCash: Math.round((a.monthlyExpenses || 0) * 12),
    }));
    const cashAccounts = (a.cashList || []).length
      ? a.cashList.map((x) => ({
          id: x.id,
          name: x.name || "Cash",
          amount: x.amount || 0,
          rate: a.customRates ? a.cashRate ?? rd.cashRate : rd.cashRate,
          currency: x.currency || mainCcy,
        }))
      : [{ id: uid(), name: "Cash", amount: a.cash || 0, rate: rd.cashRate, currency: mainCcy }];
    setCash(cashAccounts);

    const newInvestments = [];
    const newOrder = ["cash"];

    if (a.hasInvestments) {
      a.investmentsList.forEach((item) => {
        const itemType = item.type || "market";
        const itemCurrency = a.multiCurrency ? item.currency || mainCcy : mainCcy;
        const itemRegion = regionForCurrency(itemCurrency, region);
        const itemRd = REGION_DEFAULTS[itemRegion] || rd;
        newInvestments.push({
          id: item.id,
          name: item.name || "Investment",
          type: itemType,
          // an investment priced in USD belongs to the US market, even for someone
          // living in the Eurozone — currency is the best signal we have for which
          // market's return assumptions should apply
          region: itemRegion,
          currency: itemCurrency,
          amount: item.amount || 0,
          growthRate: item.growthRate ?? defaultGrowthRateForType(itemRd, itemType),
          contribution: item.contribution || 0,
          contributionFrequency: "monthly",
          dividendYield: itemType === "dividend" ? item.dividendYield ?? 3 : undefined,
          cdLongRunRate: itemType === "cd" ? item.cdLongRunRate ?? itemRd.cdRateLongRun : undefined,
          cdTenorYears: itemType === "cd" ? item.cdTenorYears ?? 1 : undefined,
          costBasis: item.amount || 0,
        });
        newOrder.push(`investment:${item.id}`);
      });
    }
    if (a.ownsHome) {
      // Rentals are sold BEFORE the primary residence by default — the home you actually
      // live in should be the last thing tapped, not the first. Previously houses were
      // pushed in raw list order, and the wizard's default list puts "Primary home"
      // first, so the primary got sold ahead of rentals.
      const orderedHouses = [...a.housesList].sort((x, y) => {
        const xPrimary = (x.usage || "primary") !== "rental" ? 1 : 0;
        const yPrimary = (y.usage || "primary") !== "rental" ? 1 : 0;
        return xPrimary - yPrimary;
      });
      orderedHouses.forEach((item) => {
        const isPrimary = (item.usage || "primary") !== "rental";
        // A rental is always available as a fallback — only the primary home can be
        // marked "never sell". Its proceeds go through the normal surplus rule (cash up
        // to your ceiling, then invested), so there's no separate reinvest question.
        const sellable = isPrimary ? item.sellable !== false : true;
        const hasMortgage = !!item.hasMortgage && (item.mortgageBalance || 0) > 0;
        const mortgageRate = item.mortgageRate ?? 4.5;
        // derive the remaining term from the actual balance/payment/rate rather than
        // assuming a flat 20 years — a hardcoded number here would silently become the
        // authoritative input the moment someone switches to "I know: years" mode
        const impliedYears = hasMortgage ? solveMortgageYears(item.mortgageBalance || 0, item.mortgagePayment || 0, mortgageRate) : 0;
        newInvestments.push({
          id: item.id,
          name: item.name || (isPrimary ? "Primary Home" : "Property"),
          type: "house",
          region,
          currency: a.multiCurrency ? item.currency || mainCcy : mainCcy,
          amount: item.value || 0,
          growthRate: item.growthRate ?? rd.propertyReturn,
          usage: isPrimary ? "primary" : "rental",
          sellable,
          postSaleAction: sellable ? item.postSaleAction || "none" : "none",
          rebuyValue: item.rebuyValue || 0,
          resizeFactor: item.resizeFactor ?? 0.5,
          postSaleRent: item.postSaleRent ?? Math.round((a.monthlyExpenses || 0) * 0.35),
          sellingFeePercent: item.sellingFeePercent ?? 4,
          // default the cost basis to the CURRENT value (i.e. no built-in gain) rather
          // than inventing one. The old `value * 0.7` silently baked in a 30% capital
          // gain that got taxed on sale, with nothing telling the person it was there.
          purchasePrice: item.purchasePrice ?? item.value ?? 0,
          mortgageBalance: hasMortgage ? item.mortgageBalance || 0 : 0,
          mortgagePayment: hasMortgage ? item.mortgagePayment || 0 : 0,
          mortgageRateType: item.mortgageRateType || "fixed",
          mortgageInputMode: item.mortgageInputMode || "rate",
          mortgageRate,
          mortgageYearsLeft: item.mortgageYearsLeft ?? (isFinite(impliedYears) ? round2(impliedYears) : 20),
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
          minAge: item.minAge ?? defaultRetirementMinAge(resolvedTC),
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
    setWithdrawalOrder(sortOrderBySize(newOrder, newInvestments, newRetirement));
    setLumpSums([]);

    setShowOnboarding(false);
    setOnboardingStarted(false);
    setTab("results");
  };

  const currency = profile.currency || "EUR";

  // convert every money bucket into the base currency for simulation & totals —
  // the raw state (native currency, as typed) stays untouched for editing.
  // Cash is a LIST of accounts (like investments) so someone can hold cash in several
  // currencies — but the simulation engine still only understands one pooled cash
  // bucket, so this converts every account to the main currency and combines them into
  // a single { amount, rate, currency } object, exactly the shape runSimulation always
  // expected. The rate is a weighted average across accounts (by converted balance);
  // convertedCashAccounts (below) keeps the per-account breakdown for the Cash tab UI.
  const convertedCashAccounts = useMemo(
    () =>
      cash.map((c) => ({
        ...c,
        amount: convertCurrency(c.amount, c.currency || currency, currency, fxRates),
      })),
    [cash, currency, fxRates]
  );
  const convertedCash = useMemo(() => {
    const totalAmount = convertedCashAccounts.reduce((s, c) => s + (c.amount || 0), 0);
    const weightedRate = totalAmount > 0 ? convertedCashAccounts.reduce((s, c) => s + (c.amount || 0) * (c.rate || 0), 0) / totalAmount : 0;
    return { amount: totalAmount, rate: round2(weightedRate), currency };
  }, [convertedCashAccounts, currency]);
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

  // lump sums can be denominated in any currency, same as every other money bucket
  const convertedLumpSums = useMemo(
    () =>
      lumpSums.map((ls) => {
        const c = ls.currency || currency;
        if (c === currency) return ls;
        return { ...ls, amount: convertCurrency(ls.amount, c, currency, fxRates) };
      }),
    [lumpSums, currency, fxRates]
  );

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
        lumpSums: convertedLumpSums,
        savingsRule: effectiveSavingsRule,
      }),
    [profile, convertedWork, expensesState, convertedCash, convertedInvestments, convertedRetirement, withdrawalOrder, pension, convertedLumpSums, effectiveSavingsRule]
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
        lumpSums: convertedLumpSums,
        savingsRule: effectiveSavingsRule,
      }),
    [profile, convertedWork, expensesState, convertedCash, convertedInvestments, convertedRetirement, withdrawalOrder, pension, convertedLumpSums, effectiveSavingsRule]
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

  // "Biggest lever" insight: rather than just showing a countdown, tell the person
  // which single change would move their FI date the most — turning a number into an
  // action, which is what actually helps someone who isn't fluent in the math. Reuses
  // computeFI (already ~76 simulations under the hood) three more times with small,
  // concrete nudges on the three things most within someone's control: spend less,
  // save more, or (informational, not really "controllable") a better return — then
  // reports whichever single nudge moved the date the most.
  const leverInsight = useMemo(() => {
    if (daysUntilFI == null || profile.currentAge == null) return null;
    const base = {
      profile,
      work: convertedWork,
      expensesState,
      cash: convertedCash,
      investments: convertedInvestments,
      retirement: convertedRetirement,
      withdrawalOrder,
      pension,
      lumpSums: convertedLumpSums,
      savingsRule: effectiveSavingsRule,
    };
    const deltaDaysFor = (variantBundle) => {
      const { fiAge: altFi } = computeFI(variantBundle);
      if (altFi == null) return null;
      const altDays = Math.max(0, Math.round((altFi - profile.currentAge) * 365.25));
      return daysUntilFI - altDays; // positive = sooner
    };

    const scenarios = [];

    // 1) spend 10% less per month
    if (expensesState.monthly > 0) {
      const newMonthly = Math.round(expensesState.monthly * 0.9);
      const dDays = deltaDaysFor({ ...base, expensesState: { ...expensesState, monthly: newMonthly } });
      if (dDays != null) scenarios.push({ type: "spend", deltaDays: dDays, amount: expensesState.monthly - newMonthly });
    }

    // 2) save 10% more (scale every ongoing contribution up)
    const oldContrib =
      convertedInvestments.reduce((s, i) => s + (i.type !== "house" ? i.contribution || 0 : 0), 0) +
      convertedRetirement.reduce((s, r) => s + (r.contribution || 0), 0);
    if (oldContrib > 0) {
      const investmentsMore = convertedInvestments.map((i) => (i.type === "house" ? i : { ...i, contribution: (i.contribution || 0) * 1.1 }));
      const retirementMore = convertedRetirement.map((r) => ({ ...r, contribution: (r.contribution || 0) * 1.1 }));
      const dDays = deltaDaysFor({ ...base, investments: investmentsMore, retirement: retirementMore });
      if (dDays != null) scenarios.push({ type: "save", deltaDays: dDays, amount: Math.round(oldContrib * 0.1) });
    }

    // 3) returns 1 point higher per year — informational, not something anyone can just
    // decide, but useful context for how sensitive the plan is to market performance.
    // This used to go through a "market rate" What-If lever; that lever was removed to
    // simplify the What-If list, so the +1pt bump is applied directly here instead —
    // same market/dividend investments + retirement accounts, same exclusion of houses,
    // CDs and bonds (each their own asset class, not part of "the market").
    const bumpedForReturns = {
      ...base,
      investments: base.investments.map((i) =>
        i.type !== "house" && i.type !== "cd" && i.type !== "bond" ? { ...i, growthRate: i.growthRate + 1 } : i
      ),
      retirement: base.retirement.map((r) => ({ ...r, growthRate: r.growthRate + 1 })),
    };
    const returnsDDays = deltaDaysFor(bumpedForReturns);
    if (returnsDDays != null) scenarios.push({ type: "returns", deltaDays: returnsDDays });

    const positive = scenarios.filter((s) => s.deltaDays > 0).sort((a, b) => b.deltaDays - a.deltaDays);
    return positive[0] || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daysUntilFI, profile.currentAge, expensesState.monthly, convertedInvestments, convertedRetirement]);

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
      lumpSums: convertedLumpSums,
      savingsRule: effectiveSavingsRule,
    };
    whatIfChanges.forEach((change) => {
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
            growthRate: (REGION_DEFAULTS[profile.region] || REGION_DEFAULTS.EU).propertyReturn,
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
      if (change.leverId === "sellPrimaryHome") {
        const primary = draft.investments.find((i) => i.type === "house" && i.usage !== "rental");
        if (primary) {
          const wantSell = !!change.sell;
          const key = `house:${primary.id}`;
          draft = {
            ...draft,
            investments: draft.investments.map((i) => (i.id === primary.id ? { ...i, sellable: wantSell } : i)),
            withdrawalOrder: wantSell
              ? draft.withdrawalOrder.includes(key)
                ? draft.withdrawalOrder
                : [...draft.withdrawalOrder, key] // newly sellable — add it at the end, same "primary home always last" spot the real order keeps it in
              : draft.withdrawalOrder.filter((e) => e !== key),
          };
        }
        return;
      }
      if (change.leverId === "reorderWithdrawal") {
        // reconcile the stored custom order against THIS draft's actual accounts — the
        // same drop-orphans-append-missing rule the real withdrawal order keeps itself in
        // sync with, so a since-removed account or a house another what-if change just
        // added doesn't silently break the simulation
        const validKeys = new Set(["cash"]);
        draft.investments.forEach((i) => {
          if (i.type !== "house" || i.sellable !== false) validKeys.add(i.type === "house" ? `house:${i.id}` : `investment:${i.id}`);
        });
        draft.retirement.forEach((r) => validKeys.add(`retirement:${r.id}`));
        const cleaned = (change.order || []).filter((e) => validKeys.has(e));
        const present = new Set(cleaned);
        const missing = [...validKeys].filter((k) => !present.has(k));
        draft = { ...draft, withdrawalOrder: [...cleaned, ...missing] };
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
  // defaults to the OPPOSITE of whatever the main profile currently has it set to — the
  // whole point of this lever is "what if the other thing happened instead"
  const newSellPrimaryHomeRow = (id) => {
    const primary = investments.find((i) => i.type === "house" && i.usage !== "rental");
    const baselineSellable = primary ? primary.sellable !== false : false;
    return { id, leverId: "sellPrimaryHome", sell: !baselineSellable };
  };
  const newReorderWithdrawalRow = (id) => ({ id, leverId: "reorderWithdrawal", order: [...withdrawalOrder] });
  const addWhatIfChange = () => {
    const used = whatIfChanges.map((c) => c.leverId);
    const hasPrimaryHome = investments.some((i) => i.type === "house" && i.usage !== "rental");
    const next = LEVERS.find((l) => !used.includes(l.id) && (l.id !== "sellPrimaryHome" || hasPrimaryHome)) || LEVERS[0];
    if (next.special === "buyhouse") {
      setWhatIfChanges((prev) => [...prev, newBuyHouseRow(uid())]);
    } else if (next.special === "spendingDecline") {
      setWhatIfChanges((prev) => [...prev, newSpendingDeclineRow(uid())]);
    } else if (next.special === "sellPrimaryHome") {
      setWhatIfChanges((prev) => [...prev, newSellPrimaryHomeRow(uid())]);
    } else if (next.special === "reorderWithdrawal") {
      setWhatIfChanges((prev) => [...prev, newReorderWithdrawalRow(uid())]);
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
          if (lever && lever.special === "buyhouse") return newBuyHouseRow(c.id);
          if (lever && lever.special === "spendingDecline") return newSpendingDeclineRow(c.id);
          if (lever && lever.special === "sellPrimaryHome") return newSellPrimaryHomeRow(c.id);
          if (lever && lever.special === "reorderWithdrawal") return newReorderWithdrawalRow(c.id);
          if (lever) return { id: c.id, leverId: lever.id, value: round2(lever.getCurrent(baselineDraft)) };
        }
        return { ...c, ...patch };
      })
    );
  const moveWhatIfOrder = (changeId, order, idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[idx], next[target]] = [next[target], next[idx]];
    updateWhatIfChange(changeId, { order: next });
  };

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
  const hasMortgageDebt = seriesKeys.includes("Debt");

  // A deliberately light, high-contrast palette for the drill-down bands. The old
  // PALETTE cycled into dark/muddy values once there were more than a few accounts,
  // which is what made the full breakdown illegible — these are all bright and
  // clearly distinguishable from each other and from the green total line.
  const DRILLDOWN_COLORS = ["#4C8DFF", "#FFB443", "#28C7C7", "#B98CFF", "#FF5C93", "#7DD87D", "#FFA07A", "#6EC7F5"];
  // SVG gradient ids can't contain spaces or punctuation — an account called
  // "Primary Home" produced url(#fill-Primary Home), which silently fails to resolve
  // and renders the band BLACK. Strip everything that isn't alphanumeric.
  const gradId = (key) => `fill-${String(key).replace(/[^a-zA-Z0-9]/g, "_")}`;
  const colorForSeries = (key, idx) => (key === "Debt" ? "#FF6B5B" : DRILLDOWN_COLORS[idx % DRILLDOWN_COLORS.length]);

  // fixed, meaningful colors for the four top-level categories — consistent with the
  // section colors used on the Inputs tabs so the chart reads the same as the app
  const GROUP_SERIES = [
    { key: "Cash", name: tt("Cash"), color: "#3DDC97" },
    { key: "_grpInvestments", name: tt("Investments"), color: "#4C8DFF" },
    { key: "_grpProperties", name: tt("Properties"), color: "#FFB443" },
    { key: "_grpRetirement", name: tt("Pension"), color: "#B98CFF" },
  ];

  // which individual accounts sit inside each drill-down group
  const drilldownMembers = useMemo(() => {
    const inv = withDisplayNames(investments, "Investment");
    return {
      _grpInvestments: inv.filter((i) => i.type !== "house").map((i) => i.displayName),
      _grpProperties: inv.filter((i) => i.type === "house").map((i) => i.displayName),
      _grpRetirement: withDisplayNames(retirement, "Account").map((r) => r.displayName),
    };
  }, [investments, retirement]);

  // Two modes only. "total" = one net-worth line plus assets/debt context lines.
  // "breakdown" = the four category bands (or one group's accounts, when drilled in),
  // always with the net-worth total overlaid on top as a thicker green line.
  const chartStackedSeries = useMemo(() => {
    if (chartViewMode === "total") return [];
    if (chartDrilldown && drilldownMembers[chartDrilldown]?.length) {
      const members = drilldownMembers[chartDrilldown].map((name, idx) => ({
        key: name,
        name,
        color: DRILLDOWN_COLORS[idx % DRILLDOWN_COLORS.length],
      }));
      // drilling into Properties shows each property's VALUE — the mortgages owed
      // against them belong in the same picture, as a band below zero
      if (chartDrilldown === "_grpProperties") {
        // shades of red so several mortgages stay distinguishable from each other
        const DEBT_COLORS = ["#FF6B5B", "#E8503F", "#FF9A8C", "#C93B2B"];
        const debtBands = drilldownMembers._grpProperties
          .filter((name) => years.some((y) => (y[`__debt__${name}`] || 0) < 0))
          .map((name, idx) => ({
            key: `__debt__${name}`,
            name: `${name} — ${tt("Mortgage")}`,
            color: DEBT_COLORS[idx % DEBT_COLORS.length],
          }));
        return [...members, ...debtBands];
      }
      return members;
    }
    const groups = GROUP_SERIES.filter((g) => years.some((y) => (y[g.key] || 0) > 0));
    return hasMortgageDebt ? [...groups, { key: "Debt", name: tt("Debt (mortgage)"), color: "#FF6B5B" }] : groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartViewMode, chartDrilldown, drilldownMembers, years, hasMortgageDebt, language]);

  // ticks are derived from whatever range the chart is actually showing — the full plan,
  // or a zoomed-in sub-range — so a drag-zoom into a couple of years gets fine-grained,
  // readable ticks instead of the sparse ones sized for the whole 40-60 year plan
  const xTicks = useMemo(() => {
    const range = chartZoom
      ? years.filter((y) => y.age >= chartZoom.left && y.age <= chartZoom.right)
      : years;
    if (!range.length) return [];
    const first = range[0].age;
    const last = range[range.length - 1].age;
    const span = last - first;
    const step = span <= 10 ? 1 : Math.ceil(span / 8 / 5) * 5;
    const ticks = [];
    for (let a = first; a < last; a += step) ticks.push(a);
    ticks.push(last);
    return ticks;
  }, [years, chartZoom]);

  // Forecast chart drag-to-zoom: press (mouse or a finger) on an age, drag to another,
  // release to zoom into that span. Recharts feeds the same `activeLabel` (the age under
  // the pointer) to both mouse and touch handlers, so one set of handlers covers both —
  // wired to onMouseDown/Move/Up AND onTouchStart/Move/End below.
  const chartDragStart = (e) => {
    if (e && e.activeLabel != null) {
      setRefAreaLeft(e.activeLabel);
      setRefAreaRight(null);
    }
  };
  const chartDragMove = (e) => {
    if (refAreaLeft != null && e && e.activeLabel != null) setRefAreaRight(e.activeLabel);
  };
  const chartDragEnd = () => {
    if (refAreaLeft != null && refAreaRight != null && refAreaLeft !== refAreaRight) {
      justZoomedRef.current = true;
      setChartZoom({ left: Math.min(refAreaLeft, refAreaRight), right: Math.max(refAreaLeft, refAreaRight) });
    }
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };
  const resetChartZoom = () => setChartZoom(null);

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
    const rec = { age: profile.currentAge - 1, Cash: convertedCash.amount };
    withDisplayNames(convertedInvestments, "Investment").forEach((inv) => {
      // same convention as the main simulation loop: houses at gross value, with their
      // mortgage captured separately by Debt below — not double-subtracted here too
      rec[inv.displayName] = inv.type === "house" ? Math.max(inv.amount, 0) : equityOf(inv);
    });
    withDisplayNames(convertedRetirement, "Account").forEach((r) => {
      rec[r.displayName] = r.amount;
    });
    const totalDebtNow = convertedInvestments.reduce((s, i) => s + (i.type === "house" ? i.mortgageBalance || 0 : 0), 0);
    rec.Debt = -totalDebtNow;
    rec._total =
      convertedCash.amount +
      convertedInvestments.reduce((s, i) => s + Math.max(i.amount, 0), 0) +
      convertedRetirement.reduce((s, r) => s + r.amount, 0) -
      totalDebtNow;
    return rec;
  }, [profile.currentAge, convertedCash, convertedInvestments, convertedRetirement]);

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
  // the slice actually fed to the chart once someone's drag-zoomed into a sub-range —
  // ages are unique and already sorted, so a plain age-bounds filter is enough
  const zoomedDisplayYears = useMemo(
    () => (chartZoom ? displayYears.filter((y) => y.age >= chartZoom.left && y.age <= chartZoom.right) : displayYears),
    [displayYears, chartZoom]
  );
  // if the plan's own age range changes (a profile edit, a what-if, a fresh simulation)
  // and the current zoom window no longer makes sense against it, drop back to full view
  // rather than risk showing an empty or mismatched chart
  useEffect(() => {
    if (!chartZoom || !years.length) return;
    const first = years[0].age;
    const last = years[years.length - 1].age;
    if (chartZoom.left < first || chartZoom.right > last || chartZoom.left >= chartZoom.right) setChartZoom(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years]);
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

  // Keep the withdrawal order reconciled with the accounts that actually exist.
  // Individual add/remove/type-change handlers already patch the order, but nothing
  // guarded the paths that replace state wholesale — loading a saved profile, applyAll,
  // importing older data. That could leave entries pointing at deleted accounts, or
  // (worse, and silently) leave a real account out of the order entirely, so it would
  // never be drawn from at all. This drops orphans and appends anything missing.
  useEffect(() => {
    if (!loaded || showOnboarding) return;
    setWithdrawalOrder((prev) => {
      const validKeys = new Set(["cash"]);
      investments.forEach((i) => {
        if (isOrderable(i)) validKeys.add(orderKeyFor(i));
      });
      retirement.forEach((r) => validKeys.add(`retirement:${r.id}`));

      const cleaned = prev.filter((e) => validKeys.has(e));
      const present = new Set(cleaned);
      const missing = [...validKeys].filter((k) => !present.has(k));
      if (cleaned.length === prev.length && missing.length === 0) return prev; // no change
      // a newly-added account slots in by rate rather than always landing last, so the
      // list stays consistent with the lowest-rate-first rule the order was built on
      return sortOrderBySize([...cleaned, ...missing], investments, retirement);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investments, retirement, loaded, showOnboarding]);

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
    const rd = REGION_DEFAULTS[profile.region] || REGION_DEFAULTS.EU;
    setInvestments((prev) => [
      ...prev,
      {
        id: newId,
        name: "New Investment",
        type: "market",
        region: profile.region,
        currency: profile.currency,
        amount: 10000,
        growthRate: rd.marketReturn,
        contribution: 0,
        contributionFrequency: "monthly",
      },
    ]);
    setWithdrawalOrder((prev) => [...prev, `investment:${newId}`]);
  };

  // cash is a LIST of accounts, same pattern as investments — lets someone hold cash
  // in several currencies (a EUR checking account and a USD savings account, say)
  // instead of forcing everything into one bucket
  const updateCashAccount = (id, patch) => setCash((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const removeCashAccount = (id) => setCash((prev) => (prev.length > 1 ? prev.filter((c) => c.id !== id) : prev));
  const addCashAccount = () => {
    const rd = REGION_DEFAULTS[profile.region] || REGION_DEFAULTS.EU;
    setCash((prev) => [...prev, { id: uid(), name: "Cash", amount: 0, rate: rd.cashRate, currency: profile.currency }]);
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
          {tr("get_started", "Get started →")}
        </button>
        <button
          onClick={() => setShowOnboarding(false)}
          className="mt-4 text-xs underline decoration-dotted"
          style={{ color: "#C9BEEA" }}
        >
          {tr("skip_manual_entry", "Skip for now, I'll enter things myself")}
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
          <div className="flex items-center gap-3 mb-3">
            <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: "#EEE9F7" }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg, #4C8DFF, #7C5CFC)" }}
              />
            </div>
            <div className="shrink-0">
              <LanguageFlag language={language} onChange={setLanguagePersisted} />
            </div>
          </div>
          <div className="text-xs text-stone-400 mt-2">
            {trQuestionProgress(language, wizardStepIndex + 1, steps.length)}
          </div>
          {wizardStepIndex > 0 && (
            <div className="flex justify-center mt-3">
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold"
                style={{ background: "#EEE9F7", color: "#4C4370" }}
              >
                <ChevronLeft size={17} /> {tr("wizard_back_label", "Back")}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4">
          <div className="flex items-start gap-1.5 mb-2">
            <h2 className="text-xl font-semibold leading-snug" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {step.id === "taxCountry"
                ? tr(wizardAnswers.region === "EU" ? "wizard_taxCountry_eu" : "wizard_taxCountry_us", step.question)
                : tr(`wizard_${step.id}`, step.question)}
            </h2>
            {step.note && (
              <button
                onClick={() => setShowStepNote((v) => !v)}
                className="w-5 h-5 mt-1.5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{ background: "#4C8DFF1A", color: "#4C8DFF" }}
                aria-label="More information"
              >
                i
              </button>
            )}
          </div>
          {step.note && showStepNote && (
            <p className="text-xs text-stone-400 mb-5 leading-relaxed">{tr(`wizard_note_${step.id}`, step.note)}</p>
          )}
          {(!step.note || !showStepNote) && <div className="mb-3" />}

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
              {wizardAnswers.investmentsList.map((item, idx) => {
                const rd = REGION_DEFAULTS[wizardAnswers.region] || REGION_DEFAULTS.EU;
                const regionDefault = defaultGrowthRateForType(rd, item.type || "market");
                return (
                <div key={item.id} className="rounded-2xl bg-white p-3.5 mb-3 shadow-sm border border-stone-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-stone-400">Investment {idx + 1}</span>
                    {wizardAnswers.investmentsList.length > 1 && (
                      <button onClick={() => wizardRemoveItem("investmentsList", item.id)} className="text-stone-300 hover:text-rose-500">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <Field label={tt("Type")}>
                    <SelectInput
                      value={item.type || "market"}
                      onChange={(v) => {
                        const rd = REGION_DEFAULTS[wizardAnswers.region] || REGION_DEFAULTS.EU;
                        const oldDefault = defaultGrowthRateForType(rd, item.type || "market");
                        const patch = { type: v };
                        if (v === "cd" && item.type !== "cd") {
                          patch.growthRate = rd.cdRate;
                          patch.cdLongRunRate = rd.cdRateLongRun;
                          patch.cdTenorYears = item.cdTenorYears ?? 1;
                        } else if (item.growthRate == null || item.growthRate === oldDefault) {
                          patch.growthRate = defaultGrowthRateForType(rd, v);
                        }
                        wizardUpdateItem("investmentsList", item.id, patch);
                      }}
                      options={[
                        { value: "market", label: tt("Market (growth)") },
                        { value: "dividend", label: tt("Dividend-producing") },
                        { value: "bond", label: tt("Bond / fixed income") },
                        { value: "cd", label: tt("CD / term deposit (fixed rate)") },
                      ]}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={tt("Amount today")}>
                      <NumberInput accent="#4C8DFF" value={item.amount} onChange={(v) => wizardUpdateItem("investmentsList", item.id, { amount: v })} />
                    </Field>
                    <Field label={tt("Add per month")}>
                      <NumberInput accent="#4C8DFF" value={item.contribution} onChange={(v) => wizardUpdateItem("investmentsList", item.id, { contribution: v })} />
                    </Field>
                    {item.type === "dividend" && (
                      <Field label={tt("Dividend yield")}>
                        <NumberInput
                          accent="#4C8DFF"
                          value={item.dividendYield ?? 3}
                          suffix="%/yr"
                          onChange={(v) => wizardUpdateItem("investmentsList", item.id, { dividendYield: v })}
                        />
                      </Field>
                    )}
                    {wizardAnswers.customRates && (
                      <>
                        <Field label={tt("Growth rate")}>
                          <SelectInput
                            value={item.rateMode || "auto"}
                            onChange={(v) =>
                              wizardUpdateItem("investmentsList", item.id, {
                                rateMode: v,
                                growthRate: v === "auto" ? regionDefault : item.growthRate ?? regionDefault,
                              })
                            }
                            options={[
                              { value: "auto", label: `Use region default (${regionDefault}%)` },
                              { value: "manual", label: tt("Set my own number") },
                            ]}
                          />
                        </Field>
                        {(item.rateMode || "auto") === "manual" && (
                          <Field
                            label={
                              item.type === "cd"
                                ? tt("Fixed interest rate (today's rate)")
                                : `Expected growth rate (cautious default; ${rd.index} historical avg is ${rd.historicalReturn}%)`
                            }
                          >
                            <NumberInput
                              accent="#4C8DFF"
                              value={item.growthRate ?? 6}
                              suffix="%/yr"
                              onChange={(v) => wizardUpdateItem("investmentsList", item.id, { growthRate: v })}
                            />
                          </Field>
                        )}
                      </>
                    )}
                    {wizardAnswers.multiCurrency && (
                      <Field label={tt("Currency")}>
                        <SelectInput
                          value={item.currency || "EUR"}
                          onChange={(v) => {
                            const newRegion = regionForCurrency(v, wizardAnswers.region);
                            const newRd = REGION_DEFAULTS[newRegion] || REGION_DEFAULTS.EU;
                            const oldRegion = regionForCurrency(item.currency, wizardAnswers.region);
                            const oldRd = REGION_DEFAULTS[oldRegion] || REGION_DEFAULTS.EU;
                            const patch = { currency: v };
                            // only re-seed if the rate is still the old region's default —
                            // never overwrite a number typed in by hand
                            if (item.growthRate == null || item.growthRate === defaultGrowthRateForType(oldRd, item.type || "market")) {
                              patch.growthRate = defaultGrowthRateForType(newRd, item.type || "market");
                            }
                            wizardUpdateItem("investmentsList", item.id, patch);
                          }}
                          options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
                        />
                      </Field>
                    )}
                  </div>
                </div>
                );
              })}
              <button
                onClick={() => {
                  const rd = REGION_DEFAULTS[wizardAnswers.region] || REGION_DEFAULTS.EU;
                  wizardAddItem("investmentsList", {
                    name: `Investment ${(wizardAnswers.investmentsList || []).length + 1}`,
                    type: "market",
                    amount: 10000,
                    contribution: 200,
                    growthRate: rd.marketReturn,
                    currency: rd.currency,
                  });
                }}
                className="w-full rounded-full py-2.5 text-sm font-semibold mb-4"
                style={{ background: "#4C8DFF1A", color: "#1E4FA8" }}
              >
                + {tt("Add another investment")}
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
                    <Field label={tt("This is my")}>
                      <SelectInput
                        value={item.usage || "primary"}
                        onChange={(v) =>
                          wizardUpdateItem("housesList", item.id, {
                            usage: v,
                            // keep the auto-generated name in step with the usage, unless
                            // it has been renamed to something bespoke already
                            name:
                              !item.name || item.name === "Primary home" || item.name === "Rental property"
                                ? v === "rental"
                                  ? "Rental property"
                                  : "Primary home"
                                : item.name,
                          })
                        }
                        options={[
                          { value: "primary", label: tt("Primary home") },
                          { value: "rental", label: tt("Rental property") },
                        ]}
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={tt("Value today")}>
                        <NumberInput accent="#4C8DFF" value={item.value} onChange={(v) => wizardUpdateItem("housesList", item.id, { value: v })} />
                      </Field>
                      {isRental && (
                        <Field label={tt("Monthly rent it earns")}>
                          <NumberInput accent="#4C8DFF" value={item.rent || 0} onChange={(v) => wizardUpdateItem("housesList", item.id, { rent: v })} />
                        </Field>
                      )}
                    </div>
                    <Field label="Does this have a mortgage?">
                      <SelectInput
                        value={item.hasMortgage ? "yes" : "no"}
                        onChange={(v) =>
                          wizardUpdateItem(
                            "housesList",
                            item.id,
                            v === "yes"
                              ? {
                                  hasMortgage: true,
                                  // seed something plausible off the property value rather than
                                  // leaving every field at 0 with nothing to derive a term from
                                  mortgageBalance: item.mortgageBalance || Math.round((item.value || 0) * 0.4),
                                  mortgagePayment:
                                    item.mortgagePayment ||
                                    Math.round(computeMortgagePayment(Math.round((item.value || 0) * 0.4), item.mortgageRate ?? 4.5, 20)),
                                }
                              : { hasMortgage: false, mortgageBalance: 0, mortgagePayment: 0 }
                          )
                        }
                        options={[
                          { value: "no", label: "No — owned outright" },
                          { value: "yes", label: "Yes — still paying it off" },
                        ]}
                      />
                    </Field>
                    {item.hasMortgage && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label={tt("Mortgage left (0 if none)")}>
                            <NumberInput
                              accent="#4C8DFF"
                              value={item.mortgageBalance}
                              onChange={(v) => wizardUpdateMortgage(item, { mortgageBalance: v })}
                            />
                          </Field>
                          <Field label={tt("Monthly mortgage payment (0 if none)")}>
                            <NumberInput
                              accent="#4C8DFF"
                              value={item.mortgagePayment}
                              onChange={(v) => wizardUpdateMortgage(item, { mortgagePayment: v })}
                            />
                          </Field>
                        </div>
                        {(item.mortgageBalance || 0) > 0 && (
                          <>
                            <Field label={tt("I know:")}>
                              <SelectInput
                                value={mode}
                                onChange={(v) => {
                                  if (v === "years") {
                                    const implied = solveMortgageYears(item.mortgageBalance || 0, item.mortgagePayment || 0, item.mortgageRate || 0);
                                    wizardUpdateItem("housesList", item.id, {
                                      mortgageInputMode: v,
                                      mortgageYearsLeft: isFinite(implied) ? Math.round(implied * 10) / 10 : 20,
                                    });
                                  } else {
                                    wizardUpdateItem("housesList", item.id, { mortgageInputMode: v });
                                  }
                                }}
                                options={[
                                  { value: "rate", label: tt("Interest rate") },
                                  { value: "years", label: tt("Years remaining") },
                                ]}
                              />
                            </Field>
                            {mode === "rate" ? (
                              <Field label={tt("Interest rate")}>
                                <NumberInput
                                  accent="#4C8DFF"
                                  value={item.mortgageRate ?? 4.5}
                                  suffix="%/yr"
                                  onChange={(v) => wizardUpdateItem("housesList", item.id, { mortgageRate: v })}
                                />
                              </Field>
                            ) : (
                              <Field label={tt("Years remaining")}>
                                <NumberInput
                                  accent="#4C8DFF"
                                  value={
                                    item.mortgageYearsLeft ??
                                    (() => {
                                      const im = solveMortgageYears(item.mortgageBalance || 0, item.mortgagePayment || 0, item.mortgageRate ?? 4.5);
                                      return isFinite(im) ? Math.round(im * 10) / 10 : 20;
                                    })()
                                  }
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
                      </>
                    )}
                    <button
                      onClick={() => setExpandedAdvanced((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                      className="w-full flex items-center justify-between rounded-lg px-3 py-2 mb-2 text-xs font-semibold"
                      style={{ background: "#4C8DFF14", color: "#1E4FA8" }}
                    >
                      <span>{tt("More options")}</span>
                      {expandedAdvanced[item.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {expandedAdvanced[item.id] && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={tt("Expected appreciation")}>
                        <NumberInput
                          accent="#4C8DFF"
                          value={item.growthRate ?? (REGION_DEFAULTS[wizardAnswers.region] || REGION_DEFAULTS.EU).propertyReturn}
                          suffix="%/yr"
                          onChange={(v) => wizardUpdateItem("housesList", item.id, { growthRate: v })}
                        />
                      </Field>
                      {wizardAnswers.multiCurrency && (
                        <Field label={tt("Currency")}>
                          <SelectInput
                            value={item.currency || "EUR"}
                            onChange={(v) => wizardUpdateItem("housesList", item.id, { currency: v })}
                            options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
                          />
                        </Field>
                      )}
                    </div>
                    )}
                    {/* A rental is always available as a fallback and its proceeds are always
                        routed automatically (cash up to your cash ceiling, then invested) — so
                        neither question is asked. Only the primary home gets a real choice. */}
                    {item.usage !== "rental" && (
                      <Field label={tt("Could you sell this if you needed the money?")}>
                        <SelectInput
                          value={item.sellable === false ? "no" : "yes"}
                          onChange={(v) => wizardUpdateItem("housesList", item.id, { sellable: v === "yes" })}
                          options={[
                            { value: "yes", label: tt("Yes — include it as a fallback") },
                            { value: "no", label: tt("No — never sell (e.g. keep the family home)") },
                          ]}
                        />
                      </Field>
                    )}
                    {item.sellable !== false && (() => {
                      const effAction =
                        item.usage !== "rental" && (!item.postSaleAction || item.postSaleAction === "none")
                          ? "rent"
                          : item.postSaleAction;
                      return (
                        <>
                          {item.usage !== "rental" && (
                            <Field label={tt("If it's sold, what happens?")}>
                              <SelectInput
                                value={effAction}
                                onChange={(v) => wizardUpdateItem("housesList", item.id, { postSaleAction: v })}
                                options={[
                                  { value: "rebuy", label: tt("Buy a new home for a set amount") },
                                  { value: "resize", label: tt("Buy a smaller property") },
                                  { value: "rent", label: tt("Rent afterward") },
                                ]}
                              />
                            </Field>
                          )}
                          {wizardAnswers.customRates && (
                            <Field label={tt("Agency / selling fee")}>
                              <NumberInput
                                accent="#4C8DFF"
                                value={item.sellingFeePercent ?? 4}
                                suffix="% of sale"
                                onChange={(v) => wizardUpdateItem("housesList", item.id, { sellingFeePercent: v })}
                              />
                            </Field>
                          )}
                          {item.usage !== "rental" && effAction === "rebuy" && (
                            <Field label={tt("Value of the new home")}>
                              <NumberInput
                                accent="#4C8DFF"
                                value={item.rebuyValue || 0}
                                onChange={(v) => wizardUpdateItem("housesList", item.id, { rebuyValue: v })}
                              />
                            </Field>
                          )}
                          {item.usage !== "rental" && effAction === "resize" && (
                            <Field label={tt("Resize factor (0.5 = half, 2 = double)")}>
                              <NumberInput
                                accent="#4C8DFF"
                                value={item.resizeFactor ?? 0.5}
                                suffix="×"
                                onChange={(v) => wizardUpdateItem("housesList", item.id, { resizeFactor: v })}
                              />
                            </Field>
                          )}
                          {item.usage !== "rental" && effAction === "rent" && (
                            <Field label={tt("Monthly rent after selling")}>
                              <NumberInput
                                accent="#4C8DFF"
                                value={item.postSaleRent ?? Math.round((wizardAnswers.monthlyExpenses || 0) * 0.35)}
                                onChange={(v) => wizardUpdateItem("housesList", item.id, { postSaleRent: v })}
                              />
                            </Field>
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
                onClick={() => {
                  const rd = REGION_DEFAULTS[wizardAnswers.region] || REGION_DEFAULTS.EU;
                  wizardAddItem("housesList", {
                    name: `Rental property ${((wizardAnswers.housesList || []).filter((h) => h.usage === "rental").length + 1)}`,
                    usage: "rental",
                    value: 250000,
                    hasMortgage: false,
                    mortgageBalance: 0,
                    mortgagePayment: 0,
                    mortgageInputMode: "rate",
                    mortgageRate: 4.5,
                    rent: 1200,
                    growthRate: rd.propertyReturn,
                    currency: rd.currency,
                    sellable: true,
                    postSaleAction: "none",
                    rebuyValue: 0,
                    resizeFactor: 0.5,
                    postSaleRent: 0,
                    sellingFeePercent: 4,
                  });
                }}
                className="w-full rounded-full py-2.5 text-sm font-semibold mb-4"
                style={{ background: "#4C8DFF1A", color: "#1E4FA8" }}
              >
                + {tt("Add another property")}
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
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={tt("Balance today")}>
                      <NumberInput accent="#4C8DFF" value={item.balance} onChange={(v) => wizardUpdateItem("retirementList", item.id, { balance: v })} />
                    </Field>
                    <Field label={tt("Added per year")}>
                      <NumberInput accent="#4C8DFF" value={item.contribution} onChange={(v) => wizardUpdateItem("retirementList", item.id, { contribution: v })} />
                    </Field>
                    {wizardAnswers.customRates && (
                      <>
                        <Field label={tt("Growth rate")}>
                          <SelectInput
                            value={item.rateMode || "auto"}
                            onChange={(v) => {
                              const rd = REGION_DEFAULTS[wizardAnswers.region] || REGION_DEFAULTS.EU;
                              wizardUpdateItem("retirementList", item.id, {
                                rateMode: v,
                                growthRate: v === "auto" ? rd.marketReturn : item.growthRate ?? rd.marketReturn,
                              });
                            }}
                            options={[
                              {
                                value: "auto",
                                label: `Use region default (${(REGION_DEFAULTS[wizardAnswers.region] || REGION_DEFAULTS.EU).marketReturn}%)`,
                              },
                              { value: "manual", label: tt("Set my own number") },
                            ]}
                          />
                        </Field>
                        {(item.rateMode || "auto") === "manual" && (
                          <Field
                            label={`Expected growth rate (cautious default; ${(REGION_DEFAULTS[wizardAnswers.region] || REGION_DEFAULTS.EU).index} historical avg is ${(REGION_DEFAULTS[wizardAnswers.region] || REGION_DEFAULTS.EU).historicalReturn}%)`}
                          >
                            <NumberInput
                              accent="#4C8DFF"
                              value={item.growthRate ?? 6}
                              suffix="%/yr"
                              onChange={(v) => wizardUpdateItem("retirementList", item.id, { growthRate: v })}
                            />
                          </Field>
                        )}
                      </>
                    )}
                    <Field label={tt("Minimum withdrawal age")}>
                      <NumberInput
                        accent="#4C8DFF"
                        value={item.minAge ?? defaultRetirementMinAge(resolveTaxCountry({ region: wizardAnswers.region, taxCountry: wizardAnswers.taxCountry }))}
                        onChange={(v) => wizardUpdateItem("retirementList", item.id, { minAge: v })}
                      />
                    </Field>
                    {wizardAnswers.multiCurrency && (
                      <Field label={tt("Currency")}>
                        <SelectInput
                          value={item.currency || "EUR"}
                          onChange={(v) => wizardUpdateItem("retirementList", item.id, { currency: v })}
                          options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
                        />
                      </Field>
                    )}
                  </div>
                  <Field label={tt("Tax treatment")}>
                    <SelectInput
                      value={item.taxTreatment || "pretax"}
                      onChange={(v) => wizardUpdateItem("retirementList", item.id, { taxTreatment: v })}
                      options={[
                        { value: "pretax", label: tt("Taxed when withdrawn") },
                        { value: "posttax", label: tt("Already taxed — tax-free withdrawal") },
                      ]}
                    />
                  </Field>
                </div>
              ))}
              <button
                onClick={() =>
                  wizardAddItem("retirementList", {
                    name: `Retirement account ${(wizardAnswers.retirementList || []).length + 1}`,
                    balance: 10000,
                    contribution: 0,
                    growthRate: 6,
                    minAge: defaultRetirementMinAge(resolveTaxCountry({ region: wizardAnswers.region, taxCountry: wizardAnswers.taxCountry })),
                    taxTreatment: "pretax",
                    currency: "EUR",
                  })
                }
                className="w-full rounded-full py-2.5 text-sm font-semibold mb-4"
                style={{ background: "#4C8DFF1A", color: "#1E4FA8" }}
              >
                + {tt("Add another account")}
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
                <Field label={tt("Starts at age")}>
                  <NumberInput
                    accent="#4C8DFF"
                    value={wizardAnswers.pensionStartAge}
                    onChange={(v) => setWizardAnswers((a) => ({ ...a, pensionStartAge: v }))}
                  />
                </Field>
                <Field label={tt("% of final salary")}>
                  <NumberInput
                    accent="#4C8DFF"
                    value={wizardAnswers.pensionPercent}
                    suffix="%"
                    onChange={(v) => setWizardAnswers((a) => ({ ...a, pensionPercent: v }))}
                  />
                </Field>
              </div>
              <Field label={tt("Does it rise with inflation?")}>
                <SelectInput
                  value={wizardAnswers.pensionIndexed === false ? "no" : "yes"}
                  onChange={(v) => setWizardAnswers((a) => ({ ...a, pensionIndexed: v === "yes" }))}
                  options={[
                    { value: "yes", label: tt("Yes — indexed to inflation") },
                    { value: "no", label: tt("No — fixed amount forever") },
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
          ) : step.type === "cashlist" ? (
            <div className="text-left">
              {(wizardAnswers.cashList || []).map((item) => (
                <div key={item.id} className="rounded-2xl bg-white p-3.5 mb-3 shadow-sm border border-stone-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 mr-2 text-sm font-semibold text-stone-700">{item.name}</div>
                    {(wizardAnswers.cashList || []).length > 1 && (
                      <button onClick={() => wizardRemoveItem("cashList", item.id)} className="text-stone-300 hover:text-rose-500 shrink-0">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={tt("Amount")}>
                      <NumberInput accent="#3DDC97" value={item.amount} onChange={(v) => wizardUpdateItem("cashList", item.id, { amount: v })} />
                    </Field>
                    <Field label={tt("Currency")}>
                      <SelectInput
                        value={item.currency || "EUR"}
                        onChange={(v) => wizardUpdateItem("cashList", item.id, { currency: v })}
                        options={SUPPORTED_CURRENCIES.map((cc) => ({ value: cc, label: cc }))}
                      />
                    </Field>
                  </div>
                </div>
              ))}
              <button
                onClick={() => {
                  const rd = REGION_DEFAULTS[wizardAnswers.region] || REGION_DEFAULTS.EU;
                  wizardAddItem("cashList", {
                    name: `Cash ${(wizardAnswers.cashList || []).length + 1}`,
                    amount: 0,
                    currency: rd.currency,
                  });
                }}
                className="w-full rounded-full py-2.5 text-sm font-semibold mb-4"
                style={{ background: "#3DDC971A", color: "#1B7A4C" }}
              >
                + {tt("Add another cash account")}
              </button>
              <button
                onClick={goNext}
                className="w-full rounded-full py-3.5 font-semibold text-white"
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
                      {tr("edit_label", "Edit")}
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
                    <Row
                      label="Cash on hand"
                      value={(a.cashList || []).length
                        ? (a.cashList || []).map((x) => fmt(x.amount || 0, x.currency || cashCcy)).join(" + ")
                        : fmt(a.cash || 0, cashCcy)}
                      editId="cashList"
                    />
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
                          {tr("edit_label", "Edit")}
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
                  <Field label={tt("Currency")}>
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
              {tr("celebration_dismiss", "Nice!")}
            </button>
          </div>
        </div>
      )}

      {mortgageScheduleModalId &&
        (() => {
          const inv = investments.find((i) => i.id === mortgageScheduleModalId);
          if (!inv) return null;
          const rate = inv.mortgageRateType === "floating" ? convertedCash.rate : inv.mortgageRate || 0;
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

      {mathModalTopic && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center"
          style={{ background: "rgba(20,16,40,0.45)" }}
          onClick={() => setMathModalTopic(null)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white px-5 pt-5 pb-8 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {mathModalTopic.title}
              </h3>
              <button onClick={() => setMathModalTopic(null)} className="text-stone-400 shrink-0">
                <X size={18} />
              </button>
            </div>
            {(MATH_BY_TOPIC[mathModalTopic.id] || []).map((f, i) => (
              <div key={i} className="mb-4">
                <div
                  className="rounded-xl px-3.5 py-3 text-[13px] leading-relaxed"
                  style={{ background: "#F6F4FC", color: "#2E2748", fontFamily: "'Space Grotesk', ui-monospace, monospace" }}
                >
                  {f.expr}
                </div>
                {f.note && <p className="text-[11px] text-stone-500 leading-relaxed mt-1.5">{f.note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {showMethodology && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 text-white" style={{ background: heroGradient }}>
            <h2 className="text-lg font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {tr("how_this_app_works", "How this app works")}
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

            <p className="text-sm text-stone-500 leading-relaxed">
              No finance degree needed — here's what's actually happening behind every number, in plain English.
              Where a topic involves real maths, you'll find a "Show the maths" link inside it.
            </p>

            {(
              [
                  {
                    color: SECTION_COLORS.income,
                    title: "The year-by-year simulation",
                    body: "For every year from your current age to your life expectancy, the app adds up everything coming in — salary, state pension (reduced pro-rata if you stop working early — see below), rental income, dividends — and subtracts your expenses and any mortgage payments. If there's money left over, it's added to your cash savings. If there's a shortfall, it's covered automatically by pulling from your accounts, following the exact order you set on the \"Withdrawal order\" screen — your choice for whether cash, a specific fund, a retirement account, or a property gets tapped first, second, and so on.",
                  },
                  {
                    color: SECTION_COLORS.investments,
                    title: "Growth, every single year",
                    body: "Each bucket (cash, each investment, each retirement account, each property) grows by the yearly rate you set for it, compounding automatically. A \"CD / term deposit\" is a special case in two ways: like cash, its interest is taxed every year it's earned rather than when you sell, so there's no further tax when you cash it in — and its rate doesn't stay fixed forever. You earn the rate you set for as long as it's locked in (its \"tenor\"), then it glides gradually, over about 5 years, to a lower \"long-run\" rate rather than assuming today's rate lasts for decades. That's because CD rates track central bank policy, not a stable long-run average — so the long-run rate is anchored to inflation instead (roughly inflation minus 0.5%), which matches history better than either today's rate or a raw historical average would. Both the tenor and the long-run rate are editable. That growth is applied before that year's withdrawals — so money you need this year still earns a full year's return first. The default growth rate for equities is deliberately cautious: rather than the rosy historical average of your region's main index, it's set about 3 points lower — roughly what you'd get in a disappointing decade (statistically, a 25th-percentile 10-year stretch). So the US default is 7% rather than the historical 10%, and the UK 3.5% rather than 6.5%. \"Bond / fixed income\" is a separate investment type for government and investment-grade corporate bonds, with its own regional default (also a cautious decade, just haircut less than equities since bonds move around less) and its own What-If lever, so you can flex your bond and equity assumptions independently rather than one blended number standing in for both. High-yield corporate bonds aren't modeled as their own index — pick a rate between the bond and equity defaults, or your own number. If markets do average or better, you'll beat this plan rather than fall short of it. Every rate is editable.",
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
            ).reduce((acc, s) => {
              // group the flat topic list into the sections declared in INFO_SECTIONS
              const meta = infoTopicMeta(s.title);
              const bucket = acc.find((g) => g.id === meta.section);
              const entry = { ...s, topicId: meta.id };
              if (bucket) bucket.items.push(entry);
              else acc.push({ id: meta.section, items: [entry] });
              return acc;
            }, []).sort((a, b) => INFO_SECTIONS.findIndex((x) => x.id === a.id) - INFO_SECTIONS.findIndex((x) => x.id === b.id))
              .map((group) => {
                const sectionLabel = INFO_SECTIONS.find((x) => x.id === group.id)?.label || group.id;
                const sectionOpen = !!openInfoSections[group.id];
                return (
                  <div key={group.id} className="rounded-2xl bg-white shadow-sm overflow-hidden">
                    <button
                      onClick={() => setOpenInfoSections((p) => ({ ...p, [group.id]: !p[group.id] }))}
                      className="w-full flex items-center justify-between px-4 py-3 text-left"
                    >
                      <span className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {sectionLabel}
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-stone-400">{group.items.length}</span>
                        {sectionOpen ? <ChevronUp size={15} color="#8A81A6" /> : <ChevronDown size={15} color="#8A81A6" />}
                      </span>
                    </button>
                    {sectionOpen &&
                      group.items.map((s) => {
                        const topicOpen = !!openInfoTopics[s.topicId];
                        return (
                          <div key={s.topicId} className="border-t border-stone-100">
                            <button
                              onClick={() => setOpenInfoTopics((p) => ({ ...p, [s.topicId]: !p[s.topicId] }))}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-left"
                            >
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                              <span className="text-xs font-medium text-stone-700 flex-1">{s.title}</span>
                              {topicOpen ? <ChevronUp size={13} color="#B0A9C6" /> : <ChevronDown size={13} color="#B0A9C6" />}
                            </button>
                            {topicOpen && (
                              <div className="px-4 pb-3">
                                <p className="text-xs text-stone-500 leading-relaxed">{s.body}</p>
                                {MATH_BY_TOPIC[s.topicId] && (
                                  <button
                                    onClick={() => setMathModalTopic({ id: s.topicId, title: s.title })}
                                    className="mt-2 text-[11px] font-semibold"
                                    style={{ color: SECTION_COLORS.profile }}
                                  >
                                    {tt("Show the maths")} →
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                );
              })}

            <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenInfoSections((p) => ({ ...p, reference: !p.reference }))}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {INFO_SECTIONS.find((x) => x.id === "reference")?.label}
                </span>
                {openInfoSections.reference ? <ChevronUp size={15} color="#8A81A6" /> : <ChevronDown size={15} color="#8A81A6" />}
              </button>
              {openInfoSections.reference && (
              <div className="px-4 pb-4 border-t border-stone-100 pt-3">
              <p className="text-xs text-stone-500 leading-relaxed mb-2">
                Every default number in the app comes from one of these two tables. Pick a region to see its cash,
                CD, equity, and bond defaults; for the EU and the US, pick a country or state too, to see its
                income tax brackets.
              </p>
              <div className="pl-4.5">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {REGIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setInfoRatesRegion(r);
                        setInfoTaxCountry(r === "EU" ? "DE" : r === "US" ? "US_OTHER" : r === "Canada" ? "CA" : r === "UK" ? "UK" : "GENERIC_OTHER");
                      }}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold"
                      style={
                        infoRatesRegion === r
                          ? { background: "#3DDC971A", color: "#1B7A4C", border: "1px solid #3DDC97" }
                          : { background: "white", color: "#8A81A6", border: "1px solid #E7E5E4" }
                      }
                    >
                      {REGION_DEFAULTS[r]?.label || r}
                    </button>
                  ))}
                </div>

                {(() => {
                  const rd = REGION_DEFAULTS[infoRatesRegion] || REGION_DEFAULTS.EU;
                  return (
                    <div className="overflow-x-auto -mx-1 mb-4">
                      <table className="w-full text-[11px] border-collapse">
                        <thead>
                          <tr className="text-left text-stone-400 border-b border-stone-200">
                            <th className="py-1.5 px-1 font-medium">Asset class</th>
                            <th className="py-1.5 px-1 font-medium text-right">Default</th>
                            <th className="py-1.5 px-1 font-medium text-right">Historical avg</th>
                            <th className="py-1.5 px-1 font-medium">Reference index</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-stone-100">
                            <td className="py-1.5 px-1">Cash</td>
                            <td className="py-1.5 px-1 text-right">{rd.cashRate}%</td>
                            <td className="py-1.5 px-1 text-right">—</td>
                            <td className="py-1.5 px-1 text-stone-400">ordinary bank account</td>
                          </tr>
                          <tr className="border-b border-stone-100">
                            <td className="py-1.5 px-1">
                              CD / term deposit
                              <div className="text-stone-400">→ long-run</div>
                            </td>
                            <td className="py-1.5 px-1 text-right">
                              {rd.cdRate}%<div className="text-stone-400">→ {rd.cdRateLongRun}%</div>
                            </td>
                            <td className="py-1.5 px-1 text-right">—</td>
                            <td className="py-1.5 px-1 text-stone-400">central-bank policy rate</td>
                          </tr>
                          <tr className="border-b border-stone-100">
                            <td className="py-1.5 px-1">Equities</td>
                            <td className="py-1.5 px-1 text-right">{rd.marketReturn}%</td>
                            <td className="py-1.5 px-1 text-right">{rd.historicalReturn}%</td>
                            <td className="py-1.5 px-1 text-stone-400">{rd.index}</td>
                          </tr>
                          <tr className="border-b border-stone-100">
                            <td className="py-1.5 px-1">Bonds / fixed income</td>
                            <td className="py-1.5 px-1 text-right">{rd.bondReturn}%</td>
                            <td className="py-1.5 px-1 text-right">{rd.bondHistoricalReturn}%</td>
                            <td className="py-1.5 px-1 text-stone-400">{rd.bondIndex}</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-1">Inflation</td>
                            <td className="py-1.5 px-1 text-right">{rd.inflation}%</td>
                            <td className="py-1.5 px-1 text-right">—</td>
                            <td className="py-1.5 px-1 text-stone-400">long-run central-bank target/average</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {(infoRatesRegion === "EU" || infoRatesRegion === "US") && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(infoRatesRegion === "EU" ? EU_TAX_COUNTRY_OPTIONS : US_TAX_COUNTRY_OPTIONS).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setInfoTaxCountry(opt.value)}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold"
                        style={
                          infoTaxCountry === opt.value
                            ? { background: "#4C8DFF1A", color: "#1E4FA8", border: "1px solid #4C8DFF" }
                            : { background: "white", color: "#8A81A6", border: "1px solid #E7E5E4" }
                        }
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {(() => {
                  const supported = isTaxCountrySupported(infoTaxCountry);
                  const table = TAX_TABLES[infoTaxCountry];
                  if (!supported || !table) {
                    return (
                      <p className="text-xs text-stone-400 italic mb-2">
                        No real tax-bracket table for this one yet — the app falls back to a fixed number you set
                        yourself, averaged from France/Germany/Italy/Spain at your income as a starting point.
                      </p>
                    );
                  }
                  let lower = 0;
                  const rows = table.ordinary.map((b) => {
                    const row = { from: lower, to: b.upTo, rate: b.rate };
                    lower = b.upTo;
                    return row;
                  });
                  const rd = REGION_DEFAULTS[infoRatesRegion] || REGION_DEFAULTS.EU;
                  const symbol = currencySymbol(rd.currency);
                  return (
                    <>
                      <div className="overflow-x-auto -mx-1 mb-2">
                        <table className="w-full text-[11px] border-collapse">
                          <thead>
                            <tr className="text-left text-stone-400 border-b border-stone-200">
                              <th className="py-1.5 px-1 font-medium">Band ({symbol})</th>
                              <th className="py-1.5 px-1 font-medium text-right">Income tax</th>
                              {!!table.salaryOnlyAddOn && <th className="py-1.5 px-1 font-medium text-right">+ social</th>}
                              {!!table.salaryOnlyAddOn && <th className="py-1.5 px-1 font-medium text-right">On salary</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row, idx) => {
                              // the social-charge rate that applies to earnings INSIDE this band —
                              // sampled just below the band's top (or just above its floor for the
                              // open-ended top band), since social charges are themselves banded
                              const probe = row.to === Infinity ? row.from * 1.5 + 1000 : (row.from + row.to) / 2;
                              const socialMarginal = (() => {
                                const a = table.salaryOnlyAddOn;
                                if (!a) return 0;
                                if (!Array.isArray(a)) return a;
                                let lo = 0;
                                for (const b of a) {
                                  if (probe <= b.upTo) return b.rate;
                                  lo = b.upTo;
                                }
                                return a[a.length - 1].rate;
                              })();
                              // income tax is charged on what's LEFT after social charges, so the
                              // combined bite on a euro of salary in this band is not a simple sum
                              const combined = socialMarginal + (row.rate * (100 - socialMarginal)) / 100;
                              return (
                                <tr key={idx} className="border-b border-stone-100">
                                  <td className="py-1.5 px-1">
                                    {symbol}
                                    {Math.round(row.from).toLocaleString("en-US")} –{" "}
                                    {row.to === Infinity ? "up" : symbol + Math.round(row.to).toLocaleString("en-US")}
                                  </td>
                                  <td className="py-1.5 px-1 text-right">{row.rate}%</td>
                                  {!!table.salaryOnlyAddOn && <td className="py-1.5 px-1 text-right text-stone-400">{round2(socialMarginal)}%</td>}
                                  {!!table.salaryOnlyAddOn && (
                                    <td className="py-1.5 px-1 text-right font-semibold">{Math.round(combined)}%</td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-[11px] text-stone-400 leading-relaxed pl-0.5">
                        {table.salaryOnlyAddOn
                          ? `"On salary" is what a euro earned in that band actually loses: social charges come off first, then income tax is charged on what remains — so it's not a simple sum of the two columns. Social charges apply ONLY to a paycheck, never to a pension, rent, or interest, so a retiree pays just the income-tax column. `
                          : ""}
                        Dividends and capital gains are taxed separately from this table — see the sections above for
                        exactly how each works in this country. Single filer, no dependents, {table.label.includes("2025") ? "2025" : "current"} figures.
                      </p>
                    </>
                  );
                })()}
              </div>
              </div>
              )}
            </div>

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
            {cash.map((c) => (
              <div key={c.id} className="flex justify-between py-1">
                <span style={{ color: "#C9BEEA" }}>
                  {c.name || "Cash"} {c.currency && c.currency !== currency ? `(${c.currency})` : ""}
                </span>
                <span>{fmt(convertCurrency(c.amount, c.currency || currency, currency, fxRates), currency)}</span>
              </div>
            ))}
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
            <span className="absolute right-0 text-[11px]" style={{ color: "#B9ACDD" }}>
              {trAge(language, profile.lifeExpectancy)}
            </span>
          </div>
          {fiAge != null && fiPct != null && (
            // deliberately its own row below the age labels — sharing a row and just
            // shifting horizontally still let this collide with the current-age or
            // life-expectancy label whenever FI fell near either end of the bar. A
            // separate row makes an overlap impossible regardless of where FI lands.
            <div className="relative h-4">
              <span
                className="absolute top-0 text-[11px] font-semibold whitespace-nowrap"
                style={{
                  left: `${fiPct}%`,
                  transform: fiPct > 88 ? "translateX(-100%)" : fiPct < 12 ? "translateX(0)" : "translateX(-50%)",
                  color: "#FFC24B",
                }}
              >
                🎯 {trFreeAt(language, Math.floor(fiAge))}
              </span>
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-2 text-xs flex-wrap">
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

          {leverInsight && (
            <div className="mt-3 rounded-2xl p-3.5 flex items-start gap-2.5" style={{ background: "#FFF8E7" }}>
              <span className="text-lg leading-none">💡</span>
              <p className="text-xs leading-relaxed" style={{ color: "#8A5A00" }}>
                {leverInsight.type === "spend" && (
                  <>
                    Spending <strong>{fmt(leverInsight.amount, currency)}/mo less</strong> would get you there{" "}
                    <strong>{formatDurationShort(leverInsight.deltaDays)} sooner</strong>.
                  </>
                )}
                {leverInsight.type === "save" && (
                  <>
                    Saving <strong>{fmt(leverInsight.amount, currency)}/mo more</strong> would get you there{" "}
                    <strong>{formatDurationShort(leverInsight.deltaDays)} sooner</strong>.
                  </>
                )}
                {leverInsight.type === "returns" && (
                  <>
                    If your investments returned <strong>1%/yr more</strong>, you'd get there{" "}
                    <strong>{formatDurationShort(leverInsight.deltaDays)} sooner</strong> — though that's not
                    something you can just decide, unlike spending or saving.
                  </>
                )}
              </p>
            </div>
          )}

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
                <Field label={tt("Current age")}>
                  <NumberInput
                    accent={SECTION_COLORS.profile}
                    value={profile.currentAge}
                    onChange={(v) => setProfile({ ...profile, currentAge: v })}
                  />
                </Field>
                <Field label={tt("Life expectancy")}>
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
                <Field label={tt("Region you live in")}>
                  <SelectInput
                    value={profile.region}
                    onChange={(v) => {
                      const rd = REGION_DEFAULTS[v] || REGION_DEFAULTS.EU;
                      const newTaxCountry = v === "EU" ? "DE" : v === "US" ? "US_OTHER" : undefined;
                      setProfile({ ...profile, region: v, taxCountry: newTaxCountry, currency: rd.currency });
                      setExpensesState((e) => ({ ...e, inflation: rd.inflation }));
                      setCash((prev) => prev.map((c) => ({ ...c, rate: rd.cashRate, currency: profile.multiCurrency ? c.currency : rd.currency })));
                      setInvestments((prev) => prev.map((i) => (i.type === "house" ? i : { ...i, growthRate: rd.marketReturn })));
                      setRetirement((prev) => prev.map((r) => ({ ...r, growthRate: rd.marketReturn })));
                    }}
                    options={REGIONS.map((r) => ({ value: r, label: REGION_DEFAULTS[r]?.label || r }))}
                  />
                </Field>
                {(profile.region === "EU" || profile.region === "US") && (
                  <Field label={profile.region === "EU" ? tt("Country (for tax purposes)") : tt("State (for tax purposes)")}>
                    <SelectInput
                      value={profile.taxCountry || (profile.region === "EU" ? "DE" : "US_OTHER")}
                      onChange={(v) => setProfile({ ...profile, taxCountry: v })}
                      options={profile.region === "EU" ? EU_TAX_COUNTRY_OPTIONS : US_TAX_COUNTRY_OPTIONS}
                    />
                  </Field>
                )}
                <Field label={tt("Main currency (results are shown in this)")}>
                  <SelectInput
                    value={profile.currency || "EUR"}
                    onChange={(v) => setProfile({ ...profile, currency: v })}
                    options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
                  />
                </Field>
                <Field label={tt("Do you hold money in more than one currency?")}>
                  <SelectInput
                    value={profile.multiCurrency ? "yes" : "no"}
                    onChange={(v) => {
                      const multi = v === "yes";
                      setProfile({ ...profile, multiCurrency: multi });
                      if (!multi) {
                        setCash((prev) => prev.map((c) => ({ ...c, currency: profile.currency })));
                        setInvestments((prev) => prev.map((i) => ({ ...i, currency: profile.currency })));
                        setRetirement((prev) => prev.map((r) => ({ ...r, currency: profile.currency })));
                        setWork((w) => ({ ...w, currency: profile.currency }));
                      }
                    }}
                    options={[
                      { value: "no", label: tt("No — everything is in one currency") },
                      { value: "yes", label: tt("Yes — show currency per account") },
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
                <Field
                  label={
                    <>
                      {tt("Average tax rate")}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          openInfoTopic("tax-rate", "tax");
                        }}
                        className="w-4 h-4 rounded-full inline-flex items-center justify-center text-[10px] font-bold ml-1 align-middle"
                        style={{ background: "#4C8DFF1A", color: "#4C8DFF" }}
                        aria-label={tt("Your average effective rate, not your top bracket. Full explanation on the Info page.")}
                        title={tt("Your average effective rate, not your top bracket. Full explanation on the Info page.")}
                      >
                        i
                      </button>
                    </>
                  }
                >
                  <SelectInput
                    value={isTaxCountrySupported(resolveTaxCountry(profile)) ? profile.taxMode ?? "manual" : "manual"}
                    onChange={(v) => setProfile({ ...profile, taxMode: v })}
                    options={
                      isTaxCountrySupported(resolveTaxCountry(profile))
                        ? [
                            { value: "auto", label: `Auto — from ${TAX_TABLES[resolveTaxCountry(profile)]?.label || resolveTaxCountry(profile)}` },
                            { value: "manual", label: tt("Set my own number") },
                          ]
                        : [{ value: "manual", label: tt("Fixed number (no bracket table for this country yet)") }]
                    }
                  />
                </Field>
                {(profile.taxMode ?? "manual") === "manual" || !isTaxCountrySupported(resolveTaxCountry(profile)) ? (
                  <Field label={tt("Your average tax rate")}>
                    <NumberInput
                      accent={SECTION_COLORS.profile}
                      value={profile.taxBracket}
                      suffix="%"
                      onChange={(v) => setProfile({ ...profile, taxBracket: v })}
                    />
                  </Field>
                ) : (
                  (() => {
                    const tc = resolveTaxCountry(profile);
                    const sc = computeSalaryAddOnRate(tc, work.salary);
                    const { afterSocial, taxable } = taxableSalaryPortion(tc, work.salary);
                    const itRate = computeOrdinaryTaxRate(tc, taxable);
                    const net = afterSocial * (1 - itRate / 100);
                    const totalPct = work.salary > 0 ? 100 - (100 * net) / work.salary : 0;
                    return (
                      <Field
                        label={
                          <>
                            {tt("Estimate")}
                            <InfoTip
                              text={
                                sc > 0
                                  ? `${round2(sc)}% ${tt("social charges")}, ${tt("then")} ~${Math.round(itRate)}% ${tt("income tax on what's left")}.`
                                  : `~${Math.round(itRate)}% ${tt("income tax")}.`
                              }
                            />
                          </>
                        }
                      >
                        <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
                          <div className="text-sm font-semibold" style={{ color: SECTION_COLORS.profile }}>
                            ~{Math.round(totalPct)}%
                          </div>
                        </div>
                      </Field>
                    );
                  })()
                )}
                {(profile.taxMode ?? "manual") === "auto" && isTaxCountrySupported(resolveTaxCountry(profile)) && (
                  <div className="col-span-2">
                    <InlineMath
                      label="Show which brackets this comes from"
                      math={`${TAX_TABLES[resolveTaxCountry(profile)]?.label || resolveTaxCountry(profile)}\n\nIncome tax brackets:\n${(() => {
                        const brackets = TAX_TABLES[resolveTaxCountry(profile)]?.ordinary || [];
                        let lower = 0;
                        return brackets
                          .map((b) => {
                            const line = `  ${fmt(lower, currency)} – ${b.upTo === Infinity ? "up" : fmt(b.upTo, currency)}: ${b.rate}%`;
                            lower = b.upTo;
                            return line;
                          })
                          .join("\n");
                      })()}\n\n${(() => {
                        const addOn = computeSalaryAddOnRate(resolveTaxCountry(profile), work.salary);
                        if (!addOn) return "";
                        return `Plus mandatory salary-only contributions (pension,\nunemployment, health insurance...): ~${round2(addOn)}%\nThese apply ONLY to salary, never to a pension, rent,\nor interest — a pension isn't taxed as if it were still\na paycheck.\n\n`;
                      })()}Your ${Math.round(computeOrdinaryTaxRate(resolveTaxCountry(profile), work.salary) + computeSalaryAddOnRate(resolveTaxCountry(profile), work.salary))}% is the\nAVERAGE combined rate at your income, applied to salary —\nnot the top band's rate. It's recalculated every simulated\nyear from that year's actual income, so it's usually much\nlower once retired (and drops the salary-only part entirely).`}
                    />
                  </div>
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
                <Field label={tt("Dividend tax rate")}>
                  <SelectInput
                    value={isTaxCountrySupported(resolveTaxCountry(profile)) ? profile.dividendTaxMode ?? "manual" : "manual"}
                    onChange={(v) => setProfile({ ...profile, dividendTaxMode: v })}
                    options={
                      isTaxCountrySupported(resolveTaxCountry(profile))
                        ? [
                            { value: "auto", label: `Auto — from ${TAX_TABLES[resolveTaxCountry(profile)]?.label || resolveTaxCountry(profile)}` },
                            { value: "manual", label: tt("Set my own number") },
                          ]
                        : [{ value: "manual", label: tt("Fixed number (no bracket table for this country yet)") }]
                    }
                  />
                </Field>
                {(profile.dividendTaxMode ?? "manual") === "manual" || !isTaxCountrySupported(resolveTaxCountry(profile)) ? (
                  <Field label={tt("Your dividend tax rate")}>
                    <NumberInput
                      accent={SECTION_COLORS.profile}
                      value={profile.dividendTaxRate ?? profile.taxBracket}
                      suffix="%"
                      onChange={(v) => setProfile({ ...profile, dividendTaxRate: v })}
                    />
                  </Field>
                ) : (
                  <Field label={tt("Estimate")}>
                    <div className="rounded-xl bg-white px-4 py-3 text-sm font-semibold shadow-sm" style={{ color: SECTION_COLORS.profile }}>
                      ~{Math.round(computeDividendTaxRate(resolveTaxCountry(profile), work.salary))}%
                    </div>
                  </Field>
                )}
                <Field label={tt("Capital gains tax rate")}>
                  <SelectInput
                    value={isTaxCountrySupported(resolveTaxCountry(profile)) ? profile.capitalGainsTaxMode ?? "manual" : "manual"}
                    onChange={(v) => setProfile({ ...profile, capitalGainsTaxMode: v })}
                    options={
                      isTaxCountrySupported(resolveTaxCountry(profile))
                        ? [
                            { value: "auto", label: `Auto — from ${TAX_TABLES[resolveTaxCountry(profile)]?.label || resolveTaxCountry(profile)} rules` },
                            { value: "manual", label: tt("Set my own number") },
                          ]
                        : [{ value: "manual", label: tt("Fixed number (no bracket table for this country yet)") }]
                    }
                  />
                </Field>
                {(profile.capitalGainsTaxMode ?? "manual") === "manual" || !isTaxCountrySupported(resolveTaxCountry(profile)) ? (
                  <Field label={tt("Your capital gains tax rate")}>
                    <NumberInput
                      accent={SECTION_COLORS.profile}
                      value={profile.capitalGainsTaxRate ?? profile.taxBracket}
                      suffix="%"
                      onChange={(v) => setProfile({ ...profile, capitalGainsTaxRate: v })}
                    />
                  </Field>
                ) : (
                  <Field label={tt("Estimate")}>
                    <div className="rounded-xl bg-white px-4 py-3 text-sm font-semibold shadow-sm" style={{ color: SECTION_COLORS.profile }}>
                      ~{Math.round(computeCapitalGainsTaxRate(resolveTaxCountry(profile), work.salary))}%
                    </div>
                  </Field>
                )}
              </div>
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
                  {tr("refresh_label", "Refresh")}
                </button>
              </div>
            )}

            {activeSection === "income" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label={tt("Annual salary (gross)")}>
                  <NumberInput accent={SECTION_COLORS.income} value={work.salary} onChange={(v) => setWork({ ...work, salary: v })} />
                </Field>
                {profile.multiCurrency && (
                  <Field label={tt("Salary currency")}>
                    <SelectInput
                      value={work.currency || currency}
                      onChange={(v) => setWork({ ...work, currency: v })}
                      options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
                    />
                  </Field>
                )}
                <Field label={tt("Years still working")}>
                  <NumberInput
                    accent={SECTION_COLORS.income}
                    value={work.yearsWorking}
                    onChange={(v) => setWork({ ...work, yearsWorking: v })}
                  />
                </Field>
                <Field label={tt("Salary growth")}>
                  <RateInput
                            defaultLabel={tt("Default")}
                            customLabel={tt("Enter my own")}
                    accent={SECTION_COLORS.income}
                    value={work.salaryGrowth}
                    suffix="%/yr"
                    onChange={(v) => setWork({ ...work, salaryGrowth: v })}
                    defaultValue={2}
                  />
                </Field>
                <Field label={tt("Monthly expenses (non including mortgages)")}>
                  <NumberInput
                    accent={SECTION_COLORS.income}
                    value={expensesState.monthly}
                    onChange={(v) => setExpensesState({ ...expensesState, monthly: v })}
                  />
                </Field>
                <Field label={tt("Inflation")}>
                  <RateInput
                            defaultLabel={tt("Default")}
                            customLabel={tt("Enter my own")}
                    accent={SECTION_COLORS.income}
                    value={expensesState.inflation}
                    suffix="%/yr"
                    onChange={(v) => setExpensesState({ ...expensesState, inflation: v })}
                    defaultValue={(REGION_DEFAULTS[profile.region] || REGION_DEFAULTS.EU).inflation}
                  />
                </Field>
              </div>
            )}

            {activeSection === "income" && (
              <div className="mt-4">
                <Field label={tt("Does your spending decline as you age?")}>
                  <SelectInput
                    value={expensesState.spendingDecline?.enabled ? "yes" : "no"}
                    onChange={(v) =>
                      setExpensesState({ ...expensesState, spendingDecline: { enabled: v === "yes" } })
                    }
                    options={[
                      { value: "no", label: tt("No — same real spending every year") },
                      { value: "yes", label: tt("Yes — spending eases off through retirement") },
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
                {cash.map((c) => (
                  <div key={c.id} className="rounded-2xl bg-white p-3.5 shadow-sm mb-3">
                    <div className="flex items-center justify-between">
                      <button onClick={() => toggleCard(c.id)} className="flex items-center gap-1.5 flex-1 text-left min-w-0">
                        {expandedCards[c.id] ? <ChevronUp size={14} color={SECTION_COLORS.cash} /> : <ChevronDown size={14} color={SECTION_COLORS.cash} />}
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SECTION_COLORS.cash }} />
                        <span className="text-sm font-semibold text-stone-700 truncate">{c.name || "Cash"}</span>
                        <span className="text-xs text-stone-400 shrink-0 ml-auto mr-2">{fmt(c.amount, c.currency || currency)}</span>
                      </button>
                      {cash.length > 1 && (
                        <button onClick={() => removeCashAccount(c.id)} className="text-stone-300 hover:text-rose-500 shrink-0">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                    {expandedCards[c.id] && (
                    <>
                    <Field label={tt("Name")}>
                      <TextInput value={c.name} onChange={(v) => updateCashAccount(c.id, { name: v })} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={tt("Cash on hand")}>
                        <NumberInput accent={SECTION_COLORS.cash} value={c.amount} onChange={(v) => updateCashAccount(c.id, { amount: v })} />
                      </Field>
                      {profile.multiCurrency && (
                        <Field label={tt("Currency")}>
                          <SelectInput
                            value={c.currency || currency}
                            onChange={(v) => updateCashAccount(c.id, { currency: v })}
                            options={SUPPORTED_CURRENCIES.map((cc) => ({ value: cc, label: cc }))}
                          />
                        </Field>
                      )}
                      <Field label={tt("Interest rate")}>
                        <RateInput
                            defaultLabel={tt("Default")}
                            customLabel={tt("Enter my own")}
                          accent={SECTION_COLORS.cash}
                          value={c.rate}
                          defaultValue={(REGION_DEFAULTS[profile.region] || REGION_DEFAULTS.EU).cashRate}
                          suffix="%/yr"
                          onChange={(v) => updateCashAccount(c.id, { rate: v })}
                        />
                      </Field>
                    </div>
                    </>
                    )}
                  </div>
                ))}
                <button
                  onClick={addCashAccount}
                  className="w-full rounded-full py-2.5 text-sm font-semibold mb-4"
                  style={{ background: `${SECTION_COLORS.cash}1A`, color: SECTION_COLORS.cash }}
                >
                  + {tt("Add another cash account")}
                </button>
                <p className="text-xs text-stone-400 -mt-1 mb-1">
                  Defaults to 0% — a regular checking or savings account pays little to nothing almost everywhere
                  today. If you actually have a better rate (a proper savings account, a term account, or — if
                  you're in France — a tax-free Livret A / LDDS, which pays a government-set rate on a capped
                  balance) just enter it here; that nuance isn't modeled separately, only the flat rate is. If you
                  hold cash in more than one currency (say, some EUR and some USD), give each its own account above
                  — turn on "multiple currencies" in your Profile to set a currency per account.
                </p>

                <h3 className="text-xs font-semibold uppercase tracking-wide mt-6 mb-1" style={{ color: "#8A81A6" }}>
                  {tt("Where leftover income goes")}
                </h3>
                <p className="text-xs text-stone-400 mb-3">
                  Any surplus after expenses — salary, pension, rent, dividends — splits between cash and an
                  investment, based on how much cash you already hold.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={tt("Keep at least")}>
                    <NumberInput
                      accent={SECTION_COLORS.cash}
                      value={savingsRule.minCash}
                      onChange={(v) => setSavingsRule({ ...savingsRule, minCash: v })}
                    />
                  </Field>
                  <Field label={tt("Keep at most")}>
                    <NumberInput
                      accent={SECTION_COLORS.cash}
                      value={savingsRule.maxCash}
                      onChange={(v) => setSavingsRule({ ...savingsRule, maxCash: v })}
                    />
                  </Field>
                  <Field label={tt("% of surplus kept as cash")}>
                    <NumberInput
                      accent={SECTION_COLORS.cash}
                      value={savingsRule.cashPercent}
                      suffix="%"
                      onChange={(v) => setSavingsRule({ ...savingsRule, cashPercent: v })}
                    />
                  </Field>
                  <Field label={tt("Rest goes into")}>
                    <SelectInput
                      value={effectiveSavingsRule.targetInvestmentId || ""}
                      onChange={(v) => setSavingsRule({ ...savingsRule, targetInvestmentId: v })}
                      options={
                        investments.filter((i) => i.type !== "house").length
                          ? investments.filter((i) => i.type !== "house").map((i) => ({ value: i.id, label: i.name || "Investment" }))
                          : [{ value: "", label: tt("No investments yet") }]
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
            {activeSection === "cash" && (
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#8A81A6" }}>
                  {tt("One-off amounts")}
                </h3>
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
                      <div className="flex items-center justify-between">
                        <button onClick={() => toggleCard(ls.id)} className="flex items-center gap-1.5 flex-1 text-left min-w-0">
                          {expandedCards[ls.id] ? <ChevronUp size={14} color={color} /> : <ChevronDown size={14} color={color} />}
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                          <span className="text-sm font-semibold text-stone-700 truncate">{ls.name || `Lump sum ${idx + 1}`}</span>
                          <span className="text-xs text-stone-400 shrink-0 ml-auto mr-2">
                            {type === "pay" ? "−" : "+"}
                            {fmt(magnitude, currency)} @ {Math.round(ls.age)}
                          </span>
                        </button>
                        <button onClick={() => removeLumpSum(ls.id)} className="text-stone-300 hover:text-rose-500 shrink-0">
                          <Trash2 size={15} />
                        </button>
                      </div>
                      {expandedCards[ls.id] && (
                      <div className="mt-3">
                      <Field label={tt("Name")}>
                        <TextInput value={ls.name} onChange={(v) => updateLumpSum(ls.id, { name: v })} />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label={tt("At age")}>
                          <NumberInput accent={color} value={ls.age} onChange={(v) => updateLumpSum(ls.id, { age: v })} />
                        </Field>
                        <Field label={tt("Type")}>
                          <SelectInput
                            value={type}
                            onChange={(v) => updateLumpSum(ls.id, { amount: (v === "pay" ? -1 : 1) * magnitude })}
                            options={[
                              { value: "receive", label: tt("Receive") },
                              { value: "pay", label: tt("Pay") },
                            ]}
                          />
                        </Field>
                      </div>
                      {profile.multiCurrency && (
                        <Field label={tt("Currency")}>
                          <SelectInput
                            value={ls.currency || currency}
                            onChange={(v) => updateLumpSum(ls.id, { currency: v })}
                            options={SUPPORTED_CURRENCIES.map((cc) => ({ value: cc, label: cc }))}
                          />
                        </Field>
                      )}
                      <Field label={tt("Amount")}>
                        <NumberInput
                          accent={color}
                          value={magnitude}
                          suffix={ls.currency || currency}
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
                      <div className="flex items-center justify-between">
                        <button onClick={() => toggleCard(inv.id)} className="flex items-center gap-1.5 flex-1 text-left min-w-0">
                          {expandedCards[inv.id] ? <ChevronUp size={14} color={color} /> : <ChevronDown size={14} color={color} />}
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                          <span className="text-sm font-semibold text-stone-700 truncate">{inv.name || `Investment ${idx + 1}`}</span>
                          <span className="text-xs text-stone-400 shrink-0 ml-auto mr-2">
                            {fmt(inv.type === "house" ? Math.max(0, inv.amount - (inv.mortgageBalance || 0)) : inv.amount, inv.currency || currency)}
                          </span>
                        </button>
                        <button onClick={() => removeInvestment(inv.id)} className="text-stone-300 hover:text-rose-500 shrink-0">
                          <Trash2 size={15} />
                        </button>
                      </div>
                      {expandedCards[inv.id] && (
                      <div className="mt-3">
                      <Field label={tt("Name")}>
                        <TextInput value={inv.name} onChange={(v) => updateInvestment(inv.id, { name: v })} />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label={tt("Type")}>
                          <SelectInput
                            value={inv.type}
                            onChange={(v) => {
                              const rd = REGION_DEFAULTS[inv.region] || REGION_DEFAULTS.EU;
                              const oldDefault = defaultGrowthRateForType(rd, inv.type);
                              const patch = { type: v };
                              if (v === "cd" && inv.type !== "cd") {
                                patch.growthRate = rd.cdRate;
                                patch.cdLongRunRate = rd.cdRateLongRun;
                                patch.cdTenorYears = inv.cdTenorYears ?? 1;
                              } else if (v !== "house" && (inv.growthRate == null || inv.growthRate === oldDefault)) {
                                patch.growthRate = defaultGrowthRateForType(rd, v);
                              }
                              updateInvestment(inv.id, patch);
                            }}
                            options={[
                              { value: "market", label: tt("Market (growth)") },
                              { value: "dividend", label: tt("Dividend-producing") },
                              { value: "bond", label: tt("Bond / fixed income") },
                              { value: "cd", label: tt("CD / term deposit (fixed rate)") },
                              { value: "house", label: tt("House / property") },
                            ]}
                          />
                        </Field>
                        <Field label={inv.type === "house" ? tt("Current market value") : tt("Current value")}>
                          <NumberInput accent={color} value={inv.amount} onChange={(v) => updateInvestment(inv.id, { amount: v })} />
                        </Field>
                        <Field
                          label={
                            inv.type === "house"
                              ? tt("Expected appreciation")
                              : inv.type === "dividend"
                              ? tt("Price growth rate")
                              : inv.type === "cd"
                              ? tt("Fixed interest rate (today's rate)")
                              : tt("Growth rate")
                          }
                        >
                          <RateInput
                            defaultLabel={tt("Default")}
                            customLabel={tt("Enter my own")}
                            accent={color}
                            value={inv.growthRate}
                            defaultValue={defaultGrowthRateForType(REGION_DEFAULTS[inv.region] || REGION_DEFAULTS.EU, inv.type)}
                            suffix="%/yr"
                            onChange={(v) => updateInvestment(inv.id, { growthRate: v })}
                          />
                        </Field>
                        {(() => {
                          const gr = inv.growthRate;
                          const hi = inv.type === "cd" ? 12 : inv.type === "bond" ? 10 : inv.type === "house" ? 15 : 20;
                          const lo = inv.type === "cd" ? 0 : inv.type === "bond" ? -8 : inv.type === "house" ? -10 : -15;
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
                            <Field label={tt("Long-run rate (once it converges)")}>
                              <RateInput
                            defaultLabel={tt("Default")}
                            customLabel={tt("Enter my own")}
                                accent={color}
                                value={inv.cdLongRunRate ?? (REGION_DEFAULTS[inv.region] || REGION_DEFAULTS.EU).cdRateLongRun}
                                defaultValue={(REGION_DEFAULTS[inv.region] || REGION_DEFAULTS.EU).cdRateLongRun}
                                suffix="%/yr"
                                onChange={(v) => updateInvestment(inv.id, { cdLongRunRate: v })}
                              />
                            </Field>
                          </>
                        )}
                        {inv.type === "cd" && (
                          <div className="col-span-2">
                            <p className="text-xs text-stone-400 -mt-1 mb-1">
                              Once the lock-in ends, the rate glides down (or up) to the long-run rate over about 5
                              years — it doesn't stay at today's rate forever.
                            </p>
                            <InlineMath
                              label="Show the glide-path math"
                              math={`If yearIndex < lockInYears:\n  rate = today's entered rate (unchanged)\nElse:\n  t = min(1, (yearIndex − lockInYears + 1) / 5)\n  rate = todayRate + (longRunRate − todayRate) × t\n\nSo it moves in equal steps over 5 years after the lock-in\nends, then holds steady at the long-run rate. This one CD:\n  today's rate:    ${inv.growthRate}%/yr\n  long-run rate:   ${inv.cdLongRunRate ?? Math.max(0, expensesState.inflation - 0.5)}%/yr\n  locked in for:   ${inv.cdTenorYears ?? 1} yr${(inv.cdTenorYears ?? 1) === 1 ? "" : "s"}`}
                            />
                          </div>
                        )}
                        {inv.type === "dividend" && (
                          <Field label={tt("Dividend yield")}>
                            <RateInput
                            defaultLabel={tt("Default")}
                            customLabel={tt("Enter my own")}
                              accent={color}
                              value={inv.dividendYield ?? 3}
                              defaultValue={3}
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
                      </div>

                      {inv.type !== "house" && (
                        <div className="grid grid-cols-2 gap-3">
                          <Field label={tt("Ongoing contribution")}>
                            <NumberInput
                              accent={color}
                              value={inv.contribution || 0}
                              onChange={(v) => updateInvestment(inv.id, { contribution: v })}
                            />
                          </Field>
                          <Field label={tt("Frequency")}>
                            <SelectInput
                              value={inv.contributionFrequency || "monthly"}
                              onChange={(v) => updateInvestment(inv.id, { contributionFrequency: v })}
                              options={[
                                { value: "monthly", label: tt("Per month") },
                                { value: "yearly", label: tt("Per year") },
                              ]}
                            />
                          </Field>
                        </div>
                      )}

                      {inv.type !== "house" && (
                        <>
                          <button
                            onClick={() => setExpandedAdvanced((prev) => ({ ...prev, [inv.id]: !prev[inv.id] }))}
                            className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 mt-1 mb-2 text-xs font-semibold"
                            style={{ background: `${color}14`, color }}
                          >
                            <span>Advanced — region, currency, cost basis</span>
                            {expandedAdvanced[inv.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          {expandedAdvanced[inv.id] && (
                            <div className="grid grid-cols-2 gap-3">
                              <Field label={tt("Region")}>
                                <SelectInput
                                  value={inv.region}
                                  onChange={(v) => {
                                    const rd = REGION_DEFAULTS[v] || REGION_DEFAULTS.EU;
                                    // updates the growth-rate default to match the newly selected region —
                                    // same pattern as switching investment Type above. Only touches the
                                    // rate when it still matches the OLD region's default, so a rate someone
                                    // deliberately typed in themselves is never silently overwritten.
                                    const oldRd = REGION_DEFAULTS[inv.region] || REGION_DEFAULTS.EU;
                                    const oldDefault = defaultGrowthRateForType(oldRd, inv.type);
                                    const patch = { region: v };
                                    if (inv.type === "cd") {
                                      if (inv.growthRate === oldDefault) patch.growthRate = rd.cdRate;
                                      if ((inv.cdLongRunRate ?? oldRd.cdRateLongRun) === oldRd.cdRateLongRun) patch.cdLongRunRate = rd.cdRateLongRun;
                                    } else if (inv.growthRate === oldDefault) {
                                      patch.growthRate = defaultGrowthRateForType(rd, inv.type);
                                    }
                                    updateInvestment(inv.id, patch);
                                  }}
                                  options={REGIONS.map((r) => ({ value: r, label: REGION_DEFAULTS[r]?.label || r }))}
                                />
                              </Field>
                              {profile.multiCurrency && (
                                <Field label={tt("Currency")}>
                                  <SelectInput
                                    value={inv.currency || currency}
                                    onChange={(v) => updateInvestment(inv.id, { currency: v })}
                                    options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
                                  />
                                </Field>
                              )}
                              <Field label={tt("Cost basis (amount originally invested)")}>
                                <NumberInput
                                  accent={color}
                                  value={inv.costBasis ?? inv.amount}
                                  onChange={(v) => updateInvestment(inv.id, { costBasis: v })}
                                />
                              </Field>
                              <p className="text-xs text-stone-400 col-span-2 -mt-1 mb-2">
                                Only the gain above this (current value minus cost basis) is taxed when sold.
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {inv.type === "house" && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label={tt("Usage")}>
                              <SelectInput
                                value={inv.usage || "primary"}
                                onChange={(v) => updateInvestment(inv.id, { usage: v })}
                                options={[
                                  { value: "primary", label: tt("Primary residence") },
                                  { value: "rental", label: tt("Rented out") },
                                ]}
                              />
                            </Field>
                            {inv.usage === "rental" && (
                              <Field label={tt("Monthly rent (grows with inflation)")}>
                                <NumberInput accent={color} value={inv.rent || 0} onChange={(v) => updateInvestment(inv.id, { rent: v })} />
                              </Field>
                            )}
                          </div>

                          <Field label={tt("Can this property be sold to cover expenses?")}>
                            <SelectInput
                              value={inv.sellable === false ? "no" : "yes"}
                              onChange={(v) => updateInvestment(inv.id, { sellable: v === "yes" })}
                              options={[
                                { value: "yes", label: tt("Yes — include in withdrawal order") },
                                { value: "no", label: tt("No — never sell (e.g. primary home)") },
                              ]}
                            />
                          </Field>

                          {inv.usage !== "rental" && inv.sellable !== false && (
                            <p className="text-xs -mt-1 mb-3 leading-relaxed" style={{ color: "#5A8A6B" }}>
                              🏡 {primaryResidenceExemptionNote(resolveTaxCountry(profile), currency)}
                            </p>
                          )}

                          <Field label={tt("Does this have a mortgage?")}>
                            <SelectInput
                              value={(inv.mortgageBalance || 0) > 0 ? "yes" : "no"}
                              onChange={(v) =>
                                v === "yes"
                                  ? updateMortgage(inv, { mortgageBalance: Math.round((inv.amount || 0) * 0.4), mortgagePayment: inv.mortgagePayment || 0 })
                                  : updateMortgage(inv, { mortgageBalance: 0, mortgagePayment: 0 })
                              }
                              options={[
                                { value: "no", label: tt("No — owned outright") },
                                { value: "yes", label: tt("Yes — still paying it off") },
                              ]}
                            />
                          </Field>

                          {(inv.mortgageBalance || 0) > 0 && (
                            <>
                          <Field label={tt("Mortgage balance remaining")}>
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
                            <Field label={tt("Monthly mortgage payment (fixed, never inflated)")}>
                              <NumberInput
                                accent={color}
                                value={inv.mortgagePayment || 0}
                                onChange={(v) => updateMortgage(inv, { mortgagePayment: v })}
                              />
                            </Field>
                            <Field label={tt("Rate type")}>
                              <SelectInput
                                value={inv.mortgageRateType || "fixed"}
                                onChange={(v) => updateInvestment(inv.id, { mortgageRateType: v })}
                                options={[
                                  { value: "fixed", label: tt("Fixed") },
                                  { value: "floating", label: tt("Floating") },
                                ]}
                              />
                            </Field>
                          </div>

                          {(() => {
                            const balance = inv.mortgageBalance || 0;
                            if (balance <= 0) return null;
                            const effRate = (inv.mortgageRateType || "fixed") === "floating" ? convertedCash.rate : inv.mortgageRate || 0;
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
                              <Field label={tt("I know:")}>
                                <SelectInput
                                  value={mode}
                                  onChange={(v) => {
                                    if (v === "years") {
                                      const implied = solveMortgageYears(inv.mortgageBalance || 0, inv.mortgagePayment || 0, inv.mortgageRate || 0);
                                      updateInvestment(inv.id, {
                                        mortgageInputMode: v,
                                        mortgageYearsLeft: isFinite(implied) ? round2(implied) : 20,
                                      });
                                    } else {
                                      updateInvestment(inv.id, { mortgageInputMode: v });
                                    }
                                  }}
                                  options={[
                                    { value: "rate", label: tt("Interest rate") },
                                    { value: "years", label: tt("Years remaining") },
                                  ]}
                                />
                              </Field>
                              {mode === "rate" ? (
                                <>
                                  <Field label={tt("Interest rate")}>
                                    <RateInput
                            defaultLabel={tt("Default")}
                            customLabel={tt("Enter my own")}
                                      accent={color}
                                      value={inv.mortgageRate || 0}
                                      defaultValue={4.5}
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
                                  <Field label={tt("Years remaining")}>
                                    <NumberInput
                                      accent={color}
                                      value={
                                        inv.mortgageYearsLeft ??
                                        (() => {
                                          const im = solveMortgageYears(inv.mortgageBalance || 0, inv.mortgagePayment || 0, inv.mortgageRate || 0);
                                          return isFinite(im) ? Math.round(im * 10) / 10 : 0;
                                        })()
                                      }
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
                              locked in at today's Cash section interest rate ({convertedCash.rate}%/yr) for the life of the
                              loan, same as a fixed rate. ≈{" "}
                              {formatYears(solveMortgageYears(inv.mortgageBalance || 0, inv.mortgagePayment || 0, convertedCash.rate))} remaining at that rate.
                            </p>
                          )}

                          {inv.usage === "rental" && (
                            <>
                              <Field label={tt("Is mortgage interest tax-deductible against this rent?")}>
                                <SelectInput
                                  value={inv.mortgageInterestDeductible ? "yes" : "no"}
                                  onChange={(v) => updateInvestment(inv.id, { mortgageInterestDeductible: v === "yes" })}
                                  options={[
                                    { value: "no", label: tt("No — tax the full rent") },
                                    { value: "yes", label: tt("Yes — deduct interest before tax") },
                                  ]}
                                />
                              </Field>
                              <p className="text-xs text-stone-400 -mt-1 mb-3">
                                Many countries let landlords deduct mortgage <strong>interest</strong> (never
                                principal) from rental income before tax, but the rules vary by country and by how
                                the rental is held — so this is off unless you turn it on. Only the interest portion
                                of each year's payment is deducted, which shrinks as the loan is paid down.
                              </p>
                            </>
                          )}

                          <button
                            onClick={() => setMortgageScheduleModalId(inv.id)}
                            className="w-full flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 mb-3 text-xs font-semibold border"
                            style={{ borderColor: `${color}55`, color }}
                          >
                            <Table2 size={13} /> See full payment schedule
                          </button>
                            </>
                          )}

                          <button
                            onClick={() => setExpandedAdvanced((prev) => ({ ...prev, [inv.id]: !prev[inv.id] }))}
                            className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 mb-2 text-xs font-semibold"
                            style={{ background: `${color}14`, color }}
                          >
                            <span>Advanced — region, currency, purchase price, selling fee, plan after sale</span>
                            {expandedAdvanced[inv.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>

                          {expandedAdvanced[inv.id] && (
                            <>
                              <div className="grid grid-cols-2 gap-3">
                                <Field label={tt("Region")}>
                                  <SelectInput
                                    value={inv.region}
                                    onChange={(v) => updateInvestment(inv.id, { region: v })}
                                    options={REGIONS.map((r) => ({ value: r, label: REGION_DEFAULTS[r]?.label || r }))}
                                  />
                                </Field>
                                {profile.multiCurrency && (
                                  <Field label={tt("Currency")}>
                                    <SelectInput
                                      value={inv.currency || currency}
                                      onChange={(v) => updateInvestment(inv.id, { currency: v })}
                                      options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
                                    />
                                  </Field>
                                )}
                                <Field label={tt("Purchase price (bought value)")}>
                                  <NumberInput
                                    accent={color}
                                    value={inv.purchasePrice ?? inv.amount}
                                    onChange={(v) => updateInvestment(inv.id, { purchasePrice: v })}
                                  />
                                </Field>
                                <Field label={tt("Agency / selling fee")}>
                                  <RateInput
                            defaultLabel={tt("Default")}
                            customLabel={tt("Enter my own")}
                                    accent={color}
                                    value={inv.sellingFeePercent ?? 4}
                                    defaultValue={4}
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
                                      <Field label={tt("After selling, what happens?")}>
                                        <SelectInput
                                          value={effAction}
                                          onChange={(v) => updateInvestment(inv.id, { postSaleAction: v })}
                                          options={[
                                            { value: "rebuy", label: tt("Buy a new home for a set amount") },
                                            { value: "resize", label: tt("Buy a smaller property") },
                                            { value: "rent", label: tt("Rent afterward") },
                                          ]}
                                        />
                                      </Field>
                                    )}
                                    {inv.usage !== "rental" && effAction === "rebuy" && (
                                      <Field label={tt("Value of the new home to re-buy")}>
                                        <NumberInput
                                          accent={color}
                                          value={inv.rebuyValue || 0}
                                          onChange={(v) => updateInvestment(inv.id, { rebuyValue: v })}
                                        />
                                      </Field>
                                    )}
                                    {inv.usage !== "rental" && effAction === "resize" && (
                                      <Field label={tt("Resize factor (0.5 = half, 2 = double)")}>
                                        <NumberInput
                                          accent={color}
                                          value={inv.resizeFactor ?? 0.5}
                                          suffix="×"
                                          onChange={(v) => updateInvestment(inv.id, { resizeFactor: v })}
                                        />
                                      </Field>
                                    )}
                                    {inv.usage !== "rental" && effAction === "rent" && (
                                      <Field label={tt("Monthly rent after the sale (grows with inflation)")}>
                                        <NumberInput
                                          accent={color}
                                          value={inv.postSaleRent ?? Math.round(expensesState.monthly * 0.35)}
                                          onChange={(v) => updateInvestment(inv.id, { postSaleRent: v })}
                                        />
                                      </Field>
                                    )}
                                    {(inv.usage === "rental" || effAction === "rent") && (
                                      <>
                                        <Field label={tt("What should happen to the money?")}>
                                          <SelectInput
                                            value={inv.reinvestAs || "cash"}
                                            onChange={(v) => updateInvestment(inv.id, { reinvestAs: v })}
                                            options={[
                                              { value: "cash", label: tt("Keep as cash") },
                                              { value: "cd", label: tt("Put it in a CD") },
                                              { value: "market", label: tt("Invest it in the market") },
                                            ]}
                                          />
                                        </Field>
                                        {(inv.reinvestAs === "cd" || inv.reinvestAs === "market") && (
                                          <Field label={inv.reinvestAs === "cd" ? tt("CD interest rate") : tt("Expected market return")}>
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
                      {tr("state_employer_pension", "State / employer pension")}
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-stone-500">
                      <input
                        type="checkbox"
                        checked={pension.enabled !== false}
                        onChange={(e) => setPension({ ...pension, enabled: e.target.checked })}
                      />
                      {tr("have_one_button", "I have one")}
                    </label>
                  </div>
                  {pension.enabled !== false ? (
                    <>
                      <p className="text-xs text-stone-400 mb-3">
                        A recurring income that kicks in at a set age, as a percentage of your last working salary.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label={tt("Starts at age")}>
                          <NumberInput
                            accent={SECTION_COLORS.retirement}
                            value={pension.startAge}
                            onChange={(v) => setPension({ ...pension, startAge: v })}
                          />
                        </Field>
                        <Field label={tt("% of final salary")}>
                          <NumberInput
                            accent={SECTION_COLORS.retirement}
                            value={pension.percentOfSalary}
                            suffix="%"
                            onChange={(v) => setPension({ ...pension, percentOfSalary: v })}
                          />
                        </Field>
                      </div>
                      <Field label={tt("Does it rise with inflation?")}>
                        <SelectInput
                          value={pension.indexed ? "yes" : "no"}
                          onChange={(v) => setPension({ ...pension, indexed: v === "yes" })}
                          options={[
                            { value: "yes", label: tt("Yes — indexed to inflation (most state pensions)") },
                            { value: "no", label: tt("No — fixed amount forever") },
                          ]}
                        />
                      </Field>
                      <Field label={tt("Reduce it if I stop working early?")}>
                        <SelectInput
                          value={pension.proRata === false ? "no" : "yes"}
                          onChange={(v) => setPension({ ...pension, proRata: v === "yes" })}
                          options={[
                            { value: "yes", label: tt("Yes — scale by years contributed (realistic)") },
                            { value: "no", label: tt("No — always pay the full amount") },
                          ]}
                        />
                      </Field>
                      {pension.proRata !== false && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label={tt("I started working at")}>
                              <NumberInput
                                accent={SECTION_COLORS.retirement}
                                value={pension.careerStartAge ?? 25}
                                onChange={(v) => setPension({ ...pension, careerStartAge: v })}
                              />
                            </Field>
                            <Field label={tt("Full pension needs work until")}>
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
                      <div className="flex items-center justify-between">
                        <button onClick={() => toggleCard(r.id)} className="flex items-center gap-1.5 flex-1 text-left min-w-0">
                          {expandedCards[r.id] ? <ChevronUp size={14} color={color} /> : <ChevronDown size={14} color={color} />}
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                          <span className="text-sm font-semibold text-stone-700 truncate">{r.name || `Account ${idx + 1}`}</span>
                          <span className="text-xs text-stone-400 shrink-0 ml-auto mr-2">{fmt(r.amount, r.currency || currency)}</span>
                        </button>
                        <button onClick={() => removeRetirement(r.id)} className="text-stone-300 hover:text-rose-500 shrink-0">
                          <Trash2 size={15} />
                        </button>
                      </div>
                      {expandedCards[r.id] && (
                      <div className="mt-3">
                      <Field label={tt("Name")}>
                        <TextInput value={r.name} onChange={(v) => updateRetirement(r.id, { name: v })} />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label={tt("Current balance")}>
                          <NumberInput accent={color} value={r.amount} onChange={(v) => updateRetirement(r.id, { amount: v })} />
                        </Field>
                        <Field label={tt("Growth rate")}>
                          <RateInput
                            defaultLabel={tt("Default")}
                            customLabel={tt("Enter my own")}
                            accent={color}
                            value={r.growthRate}
                            defaultValue={(REGION_DEFAULTS[profile.region] || REGION_DEFAULTS.EU).marketReturn}
                            suffix="%/yr"
                            onChange={(v) => updateRetirement(r.id, { growthRate: v })}
                          />
                        </Field>
                        <Field label={tt("Annual contribution")}>
                          <NumberInput
                            accent={color}
                            value={r.contribution || 0}
                            onChange={(v) => updateRetirement(r.id, { contribution: v })}
                          />
                        </Field>
                      </div>
                      <Field label={tt("Tax treatment")}>
                        <SelectInput
                          value={r.taxTreatment || "pretax"}
                          onChange={(v) => updateRetirement(r.id, { taxTreatment: v })}
                          options={[
                            { value: "pretax", label: tt("Taxed when withdrawn (e.g. 401(k), traditional IRA)") },
                            { value: "posttax", label: tt("Already taxed — tax-free withdrawal (e.g. Roth)") },
                          ]}
                        />
                      </Field>

                      <button
                        onClick={() => setExpandedAdvanced((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
                        className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 mt-1 mb-2 text-xs font-semibold"
                        style={{ background: `${color}14`, color }}
                      >
                        <span>Advanced — currency, minimum age, early access</span>
                        {expandedAdvanced[r.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {expandedAdvanced[r.id] && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            {profile.multiCurrency && (
                              <Field label={tt("Currency")}>
                                <SelectInput
                                  value={r.currency || currency}
                                  onChange={(v) => updateRetirement(r.id, { currency: v })}
                                  options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
                                />
                              </Field>
                            )}
                            <Field label={tt("Minimum withdrawal age")}>
                              <NumberInput accent={color} value={r.minAge || 0} onChange={(v) => updateRetirement(r.id, { minAge: v })} />
                            </Field>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label={tt("Allow withdrawals before minimum age?")}>
                              <SelectInput
                                value={r.earlyAccessAllowed ? "yes" : "no"}
                                onChange={(v) => updateRetirement(r.id, { earlyAccessAllowed: v === "yes" })}
                                options={[
                                  { value: "no", label: tt("No — locked until min. age") },
                                  { value: "yes", label: tt("Yes — with a penalty") },
                                ]}
                              />
                            </Field>
                            {r.earlyAccessAllowed && (
                              <Field label={tt("Early withdrawal penalty")}>
                                <NumberInput
                                  accent={color}
                                  value={r.earlyPenalty || 0}
                                  suffix="%"
                                  onChange={(v) => updateRetirement(r.id, { earlyPenalty: v })}
                                />
                              </Field>
                            )}
                          </div>
                        </>
                      )}
                      </div>
                      )}
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


            {activeSection === "order" && (
              <div>
                <p className="text-xs text-stone-500 mb-3">
                  When expenses exceed income, funds are pulled in exactly this order — reorder any individual
                  investment, retirement account, or sellable property. Retirement accounts still respect their
                  own minimum age and early-access rules; a house marked "not sellable" never appears here.
                </p>
                <button
                  onClick={resortWithdrawalOrder}
                  className="w-full rounded-full py-2.5 text-sm font-semibold mb-3"
                  style={{ background: `${SECTION_COLORS.order}1A`, color: SECTION_COLORS.order }}
                >
                  {tt("Re-sort by rate (lowest first)")}
                </button>
                <p className="text-xs text-stone-400 mb-3">
                  {tt("Balances change as your plan runs, so this order can drift. Re-sorting draws down your lowest-rate accounts first, so higher-return money keeps growing longer, and always leaves your primary home last.")}
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
          {ranOutAge ? (
            <div className="rounded-2xl px-4 py-3.5 mb-3 text-sm font-semibold" style={{ background: "#FFF1EC", color: "#B23A22" }}>
              {trPlanSummary(language, "runsOut", {
                age: ranOutAge,
                yearsShort: Math.max(1, profile.lifeExpectancy - ranOutAge),
                target: profile.lifeExpectancy,
              })}
            </div>
          ) : (
            <div className="rounded-2xl px-4 py-3.5 mb-3 text-sm font-semibold" style={{ background: "#E9FBF2", color: "#1B7A4C" }}>
              🎉{" "}
              {fiAge != null
                ? trPlanSummary(language, "stopAt", { stopAge: Math.floor(fiAge), target: profile.lifeExpectancy })
                : trPlanSummary(language, "lasts", { target: profile.lifeExpectancy })}
            </div>
          )}
          <div className="rounded-2xl bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h2 className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {tr("chart_header")}
              </h2>
              <div className="shrink-0 flex rounded-full p-0.5" style={{ background: "#F2EFFB" }}>
                <button
                  onClick={() => setRealTermsView(false)}
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors"
                  style={!realTermsView ? { background: "white", color: "#4C8DFF", boxShadow: "0 1px 2px rgba(0,0,0,0.08)" } : { color: "#9B93B8" }}
                >
                  {trMoneyToggle(language, currencySymbol(currency), "future")}
                </button>
                <button
                  onClick={() => setRealTermsView(true)}
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors"
                  style={realTermsView ? { background: "white", color: "#4C8DFF", boxShadow: "0 1px 2px rgba(0,0,0,0.08)" } : { color: "#9B93B8" }}
                >
                  {trMoneyToggle(language, currencySymbol(currency), "today")}
                </button>
              </div>
            </div>
            <div className="flex rounded-full p-0.5 mb-2 w-full" style={{ background: "#F2EFFB" }}>
              {[
                { id: "total", label: tr("mode_total", "Total") },
                { id: "breakdown", label: tr("mode_full", "Breakdown") },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setChartViewMode(m.id)}
                  className="flex-1 rounded-full px-2 py-1.5 text-[11px] font-semibold transition-colors"
                  style={chartViewMode === m.id ? { background: "white", color: "#4C8DFF", boxShadow: "0 1px 2px rgba(0,0,0,0.08)" } : { color: "#9B93B8" }}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {chartViewMode === "breakdown" && (
              <div className="mb-2">
                <SelectInput
                  value={chartDrilldown || "all"}
                  onChange={(v) => setChartDrilldown(v === "all" ? null : v)}
                  options={[
                    { value: "all", label: tt("All categories") },
                    ...GROUP_SERIES.filter((g) => g.key !== "Cash" && (drilldownMembers[g.key] || []).length > 0).map((g) => ({
                      value: g.key,
                      label: `${g.name} — ${tt("show split")}`,
                    })),
                  ]}
                />
              </div>
            )}
            {chartZoom ? (
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-semibold" style={{ color: "#4C8DFF" }}>
                  {tt("Zoomed in")}: {tt("Age")} {chartZoom.left}–{chartZoom.right}
                </span>
                <button
                  onClick={resetChartZoom}
                  className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold"
                  style={{ background: "#EEE9F7", color: "#4C4370" }}
                >
                  <ArrowLeftRight size={13} /> {tt("Full range")}
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-stone-400 mb-2">{tt("Drag across the chart to zoom into a period")}</p>
            )}
            <div style={{ touchAction: refAreaLeft != null ? "none" : "pan-y" }}>
              <ResponsiveContainer width="100%" height={340}>
                <ComposedChart
                  data={zoomedDisplayYears}
                  stackOffset="sign"
                  margin={{ top: 5, right: 5, left: 0, bottom: 12 }}
                  onClick={(state) => {
                    if (justZoomedRef.current) {
                      justZoomedRef.current = false;
                      return;
                    }
                    if (state && state.activeLabel != null) setSelectedAge(state.activeLabel);
                  }}
                  onMouseDown={chartDragStart}
                  onMouseMove={chartDragMove}
                  onMouseUp={chartDragEnd}
                  onTouchStart={chartDragStart}
                  onTouchMove={chartDragMove}
                  onTouchEnd={chartDragEnd}
                  style={{ cursor: "pointer" }}
                >
                <defs>
                  {chartStackedSeries.map((s) => (
                    <linearGradient key={s.key} id={gradId(s.key)} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={s.color} stopOpacity={s.key === "Debt" ? 0.55 : 0.7} />
                      <stop offset="95%" stopColor={s.color} stopOpacity={s.key === "Debt" ? 0.15 : 0.08} />
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
                <Tooltip content={(props) => <StackedChartTooltip {...props} currency={currency} netWorthLabel={tr("net_worth_label", "Net worth")} />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 14, cursor: "pointer" }}
                  onClick={(e) => {
                    if (e && e.dataKey === "_total") setBreakdownNetWorthVisible((v) => !v);
                  }}
                />
                <ReferenceLine y={0} stroke="#C9C2E0" strokeWidth={1} />

                {/* breakdown mode: the stacked category (or drilled-in account) bands.
                    Debt bands get their OWN stackId, separate from the positive asset
                    bands: with stackOffset="sign", a series is bucketed into the positive
                    or negative accumulator per-point based on its own sign, and once a
                    mortgage hits exactly 0 that point reads as non-negative — so if it
                    shared a stack with the positive bands, its baseline would jump to the
                    top of the asset stack (the total) instead of sitting at the zero axis,
                    drawing a vertical spike right where the debt should just disappear.
                    Keeping debt in its own stack means a lone series always baselines at
                    0 regardless of sign, so a paid-off mortgage correctly shrinks to nothing. */}
                {chartStackedSeries.map((s) => {
                  const isDebtBand = s.key === "Debt" || s.key.startsWith("__debt__");
                  return (
                    <Area
                      key={s.key}
                      type="monotone"
                      dataKey={s.key}
                      name={s.name}
                      stackId={isDebtBand ? "debt" : "1"}
                      stroke={s.color}
                      strokeWidth={1.5}
                      fill={`url(#${gradId(s.key)})`}
                    />
                  );
                })}

                {/* total mode: assets and debt as context lines around the net-worth line */}
                {chartViewMode === "total" && (
                  <Line type="monotone" dataKey="_grossAssets" name={tt("Assets")} stroke="#4C8DFF" strokeWidth={1.5} dot={false} />
                )}
                {chartViewMode === "total" && hasMortgageDebt && (
                  <Line type="monotone" dataKey="Debt" name={tt("Debt (mortgage)")} stroke="#FF6B5B" strokeWidth={1.5} dot={false} />
                )}

                {/* net worth line — thicker and its own light blue so it reads as the
                    headline number rather than one series among many. Was the same green
                    family as the Cash band (#2FD07E vs #3DDC97), hard to tell apart at a
                    glance — this blue isn't used by any other series (Investments/Assets
                    is the darker #4C8DFF). Always shown in "total" mode, where it's the
                    whole point; off by default in "breakdown" mode, where it just
                    flattens/obscures the category split it's drawn on top of — but still
                    toggleable from the legend (the `hide` prop is what greys a legend
                    entry out and strikes it through, and what the Legend onClick below
                    flips on click). */}
                <Line
                  type="monotone"
                  dataKey="_total"
                  name={tr("net_worth_label", "Net worth")}
                  stroke="#38BDF8"
                  strokeWidth={3}
                  dot={false}
                  hide={chartViewMode === "breakdown" && !breakdownNetWorthVisible}
                />

                {ranOutAge && (
                  <ReferenceLine
                    x={ranOutAge}
                    stroke="#FF6B5B"
                    strokeDasharray="4 4"
                    label={{ value: "Funds depleted", fontSize: 10, fill: "#FF6B5B" }}
                  />
                )}
                {selectedAge != null && <ReferenceLine x={selectedAge} stroke="#4C8DFF" strokeWidth={2} />}
                {refAreaLeft != null && refAreaRight != null && (
                  <ReferenceArea x1={refAreaLeft} x2={refAreaRight} stroke="#4C8DFF" strokeOpacity={0.4} fill="#4C8DFF" fillOpacity={0.15} />
                )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
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
                    {tr("shortfall_why").replace("{amount}", fmt(selectedRecord._shortfall.total, currency)).replace("{age}", selectedAge)}
                  </div>
                  <table className="w-full text-[11px] text-stone-500 border-collapse">
                    <tbody>
                      <tr className="border-b border-stone-100">
                        <td className="py-1">
                          {tr("living_expenses_label", "Living expenses")}
                          {selectedRecord._shortfall.spendingDeclinePct > 0 && (
                            <span className="text-stone-400"> (−{selectedRecord._shortfall.spendingDeclinePct}% age-related)</span>
                          )}
                        </td>
                        <td className="py-1 text-right">{fmt(selectedRecord._shortfall.livingExpenses, currency)}</td>
                      </tr>
                      {selectedRecord._shortfall.mortgagePaymentDetail.map((m) => (
                        <tr key={m.name} className="border-b border-stone-100">
                          <td className="py-1">{tt("Mortgage")} — {m.name}</td>
                          <td className="py-1 text-right">{fmt(m.annual, currency)}</td>
                        </tr>
                      ))}
                      {selectedRecord._shortfall.postSaleRentExpense > 0 && (
                        <tr className="border-b border-stone-100">
                          <td className="py-1">{tr("shortfall_rent_after_selling", "Rent (after selling)")}</td>
                          <td className="py-1 text-right">{fmt(selectedRecord._shortfall.postSaleRentExpense, currency)}</td>
                        </tr>
                      )}
                      {selectedRecord._shortfall.salary > 0 && (
                        <tr className="border-b border-stone-100">
                          <td className="py-1">{tr("shortfall_salary", "− Salary (after tax)")}</td>
                          <td className="py-1 text-right">−{fmt(selectedRecord._shortfall.salary, currency)}</td>
                        </tr>
                      )}
                      {selectedRecord._shortfall.pension > 0 && (
                        <tr className="border-b border-stone-100">
                          <td className="py-1">{tr("shortfall_pension", "− Pension (after tax)")}</td>
                          <td className="py-1 text-right">−{fmt(selectedRecord._shortfall.pension, currency)}</td>
                        </tr>
                      )}
                      {selectedRecord._shortfall.rentIncome > 0 && (
                        <tr className="border-b border-stone-100">
                          <td className="py-1">{tr("shortfall_rent_income", "− Rent (after tax)")}</td>
                          <td className="py-1 text-right">−{fmt(selectedRecord._shortfall.rentIncome, currency)}</td>
                        </tr>
                      )}
                      {selectedRecord._shortfall.dividendIncome > 0 && (
                        <tr className="border-b border-stone-100">
                          <td className="py-1">{tr("shortfall_dividends", "− Dividends (after tax)")}</td>
                          <td className="py-1 text-right">−{fmt(selectedRecord._shortfall.dividendIncome, currency)}</td>
                        </tr>
                      )}
                      {selectedRecord._shortfall.lumpSum !== 0 && (
                        <tr className="border-b border-stone-100">
                          <td className="py-1">{selectedRecord._shortfall.lumpSum > 0 ? tr("shortfall_lump_received", "− Lump sum received") : tr("shortfall_lump_paid", "+ Lump sum paid out")}</td>
                          <td className="py-1 text-right">
                            {selectedRecord._shortfall.lumpSum > 0 ? "−" : "+"}
                            {fmt(Math.abs(selectedRecord._shortfall.lumpSum), currency)}
                          </td>
                        </tr>
                      )}
                      <tr className="font-semibold text-stone-700">
                        <td className="pt-1.5">{tr("shortfall_total", "= Shortfall to cover")}</td>
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
                  {tr("year_over_year").replace("{age}", selectedAge)}
                </h3>
                <button onClick={() => setSelectedAge(null)} className="text-xs text-stone-400 hover:text-stone-600">
                  {tr("close_label")} ✕
                </button>
              </div>
              {realTermsView && (
                <p className="text-[11px] text-stone-400 mb-2 -mt-1">{tr("real_terms_breakdown_note")}</p>
              )}
              {seriesKeys.map((key, idx) => {
                const color = colorForSeries(key, idx);
                const before = displayPrevRecord ? displayPrevRecord[key] || 0 : 0;
                const after = displaySelectedRecord[key] || 0;
                const delta = after - before;
                const detail = selectedRecord._explain ? selectedRecord._explain[key] : null;
                const lines =
                  key === "Debt"
                    ? [tr("debt_row_note")]
                    : buildExplainLines(detail, currency, key === "Cash" ? selectedRecord._lumpSumEvents : null);
                return (
                  <div key={key} className="py-2 border-b border-stone-100">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                        {key === "Debt" ? tr("debt_mortgage_label", "Debt (mortgage)") : key}
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
                <span className="text-xs font-bold">{tr("net_worth_label", "Net worth")}</span>
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
                {tr("at_life_expectancy", "At life expectancy")} ({profile.lifeExpectancy}){realTermsView && <span className="block">{tr("in_todays_money", "in today's money")}</span>}
              </div>
              <div className="text-lg font-semibold" style={{ color: "#4C8DFF", fontFamily: "'Space Grotesk', sans-serif" }}>
                {finalYear ? fmt(finalYear._total * realFactorForAge(finalYear.age, profile.currentAge, expensesState.inflation, realTermsView), currency) : "-"}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-3.5 shadow-sm">
              <div className="text-xs text-stone-400">{tr("years_simulated", "Years simulated")}</div>
              <div className="text-lg font-semibold" style={{ color: "#4C8DFF", fontFamily: "'Space Grotesk', sans-serif" }}>
                {years.length}
              </div>
            </div>
          </div>

        </div>
      ) : tab === "whatif" ? (
        <div className="px-5 py-5">
          <div className="flex items-center gap-1.5 mb-1">
            <GitCompare size={16} color="#7C5CFC" />
            <h2 className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {tr("whatif_title", "What if…")}
            </h2>
            <button
              onClick={() => setShowWhatIfIntro((v) => !v)}
              className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{ background: "#7C5CFC1A", color: "#7C5CFC" }}
              aria-label="What is this?"
            >
              i
            </button>
          </div>
          {showWhatIfIntro && <p className="text-xs text-stone-400 mb-3">{tr("whatif_intro")}</p>}
          {!showWhatIfIntro && <div className="mb-3" />}

          {whatIfChanges.map((change, idx) => {
            const lever = LEVERS.find((l) => l.id === change.leverId) || LEVERS[0];
            return (
              <div key={change.id} className="rounded-2xl bg-white p-3.5 shadow-sm mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-stone-400">
                    {tr("whatif_change_label", "Change")} {idx + 1}
                  </span>
                  {whatIfChanges.length > 1 && (
                    <button onClick={() => removeWhatIfChange(change.id)} className="text-stone-300 hover:text-rose-500">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <Field label={tt("What changes?")}>
                  <SelectInput
                    value={change.leverId}
                    onChange={(v) => updateWhatIfChange(change.id, { leverId: v })}
                    options={LEVERS.filter(
                      (l) => l.id !== "sellPrimaryHome" || investments.some((i) => i.type === "house" && i.usage !== "rental")
                    ).map((l) => ({ value: l.id, label: tt(l.label) }))}
                  />
                </Field>
                {change.leverId === "buyhouse" ? (
                  <>
                    <Field label={tt("Name")}>
                      <TextInput value={change.name || ""} onChange={(v) => updateWhatIfChange(change.id, { name: v })} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={tt("Property value")}>
                        <NumberInput accent="#7C5CFC" value={change.value ?? 0} onChange={(v) => updateWhatIfChange(change.id, { value: v })} />
                      </Field>
                      <Field label={tt("Cash deposit")}>
                        <NumberInput accent="#7C5CFC" value={change.deposit ?? 0} onChange={(v) => updateWhatIfChange(change.id, { deposit: v })} />
                      </Field>
                    </div>
                    <Field label={tt("Deposit funded from")}>
                      <SelectInput
                        value={change.fundingSource || "cash"}
                        onChange={(v) => updateWhatIfChange(change.id, { fundingSource: v })}
                        options={[
                          { value: "cash", label: tt("Cash") },
                          ...convertedInvestments.filter((i) => i.type !== "house").map((i) => ({ value: i.id, label: i.name || tt("Investment") })),
                        ]}
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={tt("Mortgage rate")}>
                        <NumberInput
                          accent="#7C5CFC"
                          value={change.mortgageRate ?? 4.5}
                          suffix="%/yr"
                          onChange={(v) => updateWhatIfChange(change.id, { mortgageRate: v })}
                        />
                      </Field>
                      <Field label={tt("Loan term")}>
                        <NumberInput
                          accent="#7C5CFC"
                          value={change.loanTermYears ?? 25}
                          suffix="yrs"
                          onChange={(v) => updateWhatIfChange(change.id, { loanTermYears: v })}
                        />
                      </Field>
                    </div>
                    <Field label={tt("Monthly rent it earns")}>
                      <NumberInput accent="#7C5CFC" value={change.rent ?? 0} onChange={(v) => updateWhatIfChange(change.id, { rent: v })} />
                    </Field>
                    <p className="text-xs text-stone-400">{tr("whatif_mortgage_note")}</p>
                  </>
                ) : change.leverId === "spendingDecline" ? (
                  <>
                    <Field label={tt("Spending declines with age?")}>
                      <SelectInput
                        value={change.enabled ? "yes" : "no"}
                        onChange={(v) => updateWhatIfChange(change.id, { enabled: v === "yes" })}
                        options={[
                          { value: "no", label: tt("No — same real spending every year") },
                          { value: "yes", label: tt("Yes — spending eases off through retirement") },
                        ]}
                      />
                    </Field>
                    <p className="text-xs text-stone-400 leading-relaxed">{tr("whatif_spending_decline_note")}</p>
                  </>
                ) : change.leverId === "sellPrimaryHome" ? (
                  <>
                    <Field label={tt("Sell my primary residence in this scenario?")}>
                      <SelectInput
                        value={change.sell ? "yes" : "no"}
                        onChange={(v) => updateWhatIfChange(change.id, { sell: v === "yes" })}
                        options={[
                          { value: "no", label: tt("No — never sell it") },
                          { value: "yes", label: tt("Yes — it's on the table if funds run short") },
                        ]}
                      />
                    </Field>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      {tt(
                        "This flips whether your primary home can ever be sold in this scenario — it doesn't schedule a sale at a set age, it just changes whether it's available as a last resort if the plan runs short."
                      )}
                    </p>
                  </>
                ) : change.leverId === "reorderWithdrawal" ? (
                  <>
                    <p className="text-xs text-stone-400 mb-3 leading-relaxed">
                      {tt("A separate withdrawal order just for this scenario — reorder it to test how much it matters.")}
                    </p>
                    <button
                      onClick={() => updateWhatIfChange(change.id, { order: [...withdrawalOrder] })}
                      className="w-full rounded-full py-2 text-xs font-semibold mb-3"
                      style={{ background: "#7C5CFC1A", color: "#4B2E9E" }}
                    >
                      {tt("Reset to today's order")}
                    </button>
                    {(change.order || []).map((entry, idx) => {
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
                      const order = change.order || [];
                      return (
                        <div
                          key={entry}
                          className="flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5 mb-2 shadow-sm"
                          style={{ borderLeft: `4px solid ${color}` }}
                        >
                          <span className="text-sm font-medium flex items-center gap-2">
                            <span className="text-stone-400 text-xs">{idx + 1}.</span> {label}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => moveWhatIfOrder(change.id, order, idx, -1)}
                              className="text-stone-300 hover:text-[#FF5C93] disabled:opacity-30"
                              disabled={idx === 0}
                            >
                              <ChevronUp size={16} />
                            </button>
                            <button
                              onClick={() => moveWhatIfOrder(change.id, order, idx, 1)}
                              className="text-stone-300 hover:text-[#FF5C93] disabled:opacity-30"
                              disabled={idx === order.length - 1}
                            >
                              <ChevronDown size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <>
                    <Field label={tt("New value (starts as your current setting)")}>
                      <NumberInput
                        accent="#7C5CFC"
                        value={change.value}
                        suffix={lever.unit(currency)}
                        onChange={(v) => updateWhatIfChange(change.id, { value: v })}
                      />
                    </Field>
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
            <Plus size={15} /> {tt("Add another change")}
          </button>

          <div className="rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-2 text-xs font-semibold text-white">
              <div className="px-3.5 py-2.5" style={{ background: "#4C8DFF" }}>
                {tt("Today")}
              </div>
              <div className="px-3.5 py-2.5" style={{ background: "#7C5CFC" }}>
                {tt("What if")}
              </div>
            </div>
            <div className="grid grid-cols-2 bg-white">
              <div className="px-3.5 py-3 border-r border-stone-100">
                <div className="text-xs text-stone-400">{tr("fi_label")}</div>
                <div className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {fiAge != null ? trAge(language, Math.floor(fiAge)) : tr("fi_not_reached")}
                </div>
              </div>
              <div className="px-3.5 py-3">
                <div className="text-xs text-stone-400">{tr("fi_label")}</div>
                <div className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {altFiAge != null ? trAge(language, Math.floor(altFiAge)) : tr("fi_not_reached")}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 bg-white border-t border-stone-100">
              <div className="px-3.5 py-3 border-r border-stone-100">
                <div className="text-xs text-stone-400">{tr("time_until_freedom", "Time until freedom")}</div>
                <div className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {formatYMD(yearsToYMD(yearsToFI))}
                </div>
              </div>
              <div className="px-3.5 py-3">
                <div className="text-xs text-stone-400">{tr("time_until_freedom", "Time until freedom")}</div>
                <div className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {formatYMD(yearsToYMD(altYearsToFI))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 bg-white border-t border-stone-100">
              <div className="px-3.5 py-3 border-r border-stone-100">
                <div className="text-xs text-stone-400">{tr("money_lasts_to")}</div>
                <div className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {trAge(language, ranOutAge || profile.lifeExpectancy)}
                </div>
              </div>
              <div className="px-3.5 py-3">
                <div className="text-xs text-stone-400">{tr("money_lasts_to")}</div>
                <div className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {trAge(language, altRanOutAge || profile.lifeExpectancy)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 bg-white border-t border-stone-100">
              <div className="px-3.5 py-3 border-r border-stone-100">
                <div className="text-xs text-stone-400">{tr("at_life_expectancy", "At life expectancy")}</div>
                <div className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {finalYear ? fmt(finalYear._total, currency) : "-"}
                </div>
              </div>
              <div className="px-3.5 py-3">
                <div className="text-xs text-stone-400">{tr("at_life_expectancy", "At life expectancy")}</div>
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
                {trScenarioDelta(language, formatYMD(daysToYMD(Math.abs(fiDeltaDays))), fiDeltaDays > 0)}
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
                {trMoneyEitherWay(
                  language,
                  fmt(Math.abs(altFinalYear._total - finalYear._total), currency),
                  tt(altFinalYear._total >= finalYear._total ? "more" : "less"),
                  profile.lifeExpectancy
                )}
              </div>
            )
          )}

          <div className="rounded-2xl bg-white p-3.5 shadow-sm mt-4">
            <h2 className="text-sm font-semibold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {tt("Total net worth over time")}
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={comparisonData} margin={{ top: 5, right: 5, left: 0, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEE9F7" />
                <XAxis dataKey="age" tick={{ fontSize: 11, fill: "#8A81A6" }} label={{ value: "Age", position: "insideBottom", offset: -3, fontSize: 11, fill: "#8A81A6" }} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: "#8A81A6" }} width={45} />
                <Tooltip formatter={(v) => (v == null ? "—" : fmt(v, currency))} labelFormatter={(l) => `${trAge(language, l)}`} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 14 }} />
                <Line type="monotone" dataKey="Today" name={tt("Today")} stroke="#4C8DFF" strokeWidth={2.5} dot={false} connectNulls />
                <Line type="monotone" dataKey="What if" name={tt("What if")} stroke="#7C5CFC" strokeWidth={2.5} strokeDasharray="5 3" dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
