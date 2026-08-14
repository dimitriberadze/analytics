/**
 * Offer analytics showcase — standalone, mock data.
 *
 * Mirrors the real ads-manager offer-details page
 * (/ka/adsmanager-new/details/ads_manager/9981): offer header + info + tabs, and under the
 * Analytics tab the summary card with the learning / CTR-over-time charts (each drilling into
 * its own detail page) plus the audience drill-down section.
 *
 * Ports of the app components (campaign-section-analytics-new-view, campaign-learning-chart,
 * campaign-ctr-time-chart, the two *-details views and
 * analytics-chart-wrapper): extends LitElement instead of DashElement, i18n keys -> the STRINGS
 * map, and the ads-manager/impressions/* API calls -> the local mockApi. Highcharts config and
 * styles are copied from the originals.
 *
 * Strings were captured from the live app; English is a translation. Highcharts + dayjs are
 * globals from index.html.
 */

import {LitElement, html, css, nothing} from "lit";
import "@bog-design-system/bd-font";
import "@bog-design-system/bd-numbers-card";
import "@bog-design-system/bd-tooltip";
import "@bog-design-system/bd-datepicker";
import "@bog-design-system/bd-filter-chips";
import "@bog-design-system/bd-icon";
import "@bog-design-system/bd-icon-button";
import "@bog-design-system/bd-standard-button";
import "@bog-design-system/bd-table";
import "@bog-design-system/bd-pagination";
import "@bog-design-system/bd-breadcrumbs-v2";
import "@bog-design-system/bd-list-item";
import "@bog-design-system/bd-messages";
import "@bog-design-system/bd-tabs";
import "@bog-design-system/bd-system-badge";
import "@bog-design-system/bd-assist-chips";
import "@bog-design-system/bd-select";
import "@bog-design-system/bd-text-field";

const Highcharts = window.Highcharts;
const dayjs = window.dayjs;

/* ------------------------------------------------------------------ *
 *  Constants (ported from the app)
 * ------------------------------------------------------------------ */

const MEDIA_CHECKPOINTS = {xSmall: 599, mSmall: 767, small: 1023, medium: 1231, large: 1365};

const COLORS = [
    "#ff600a",
    "#7938ea",
    "#06a74c",
    "#ffbd23",
    "#e22820",
    "#2c4160",
    "#ccff33",
    "#43291f",
    "#f72585",
    "#e0e8fc",
];

const light = {
    chart: {backgroundColor: "#fcfcfc"},
    title: {
        style: {
            fontFamily: "BOG",
            fontWeight: "700",
            fontSize: "16px",
            lineHeight: "20px",
            color: "rgba(1, 1, 1, 0.68)",
        },
    },
    subtitle: {
        style: {
            fontFamily: "BOG",
            fontWeight: "500",
            fontSize: "12px",
            lineHeight: "20px",
            color: "rgba(0, 0, 0, 0.3)",
        },
    },
    xAxis: {
        labels: {
            style: {
                fontFamily: "BOG",
                fontWeight: "500",
                fontSize: "10px",
                lineHeight: "16px",
                color: "rgba(0, 0, 0, 0.9)",
            },
        },
    },
    yAxis: {
        gridLineColor: "#cccccc",
        labels: {
            style: {
                fontFamily: "BOG",
                fontWeight: "500",
                fontSize: "10px",
                lineHeight: "16px",
                color: "rgba(0, 0, 0, 0.9)",
            },
        },
        title: {
            style: {
                fontFamily: "BOG",
                fontWeight: "500",
                fontSize: "10px",
                lineHeight: "16px",
                textOutline: 0,
                color: "#6c7075",
            },
        },
    },
    legend: {
        itemStyle: {
            fontFamily: "BOG",
            fontWeight: "500",
            fontSize: "12px",
            lineHeight: "20px",
            color: "rgba(0, 0, 0, 0.9)",
            cursor: "default",
        },
        itemHoverStyle: {color: "#FF6C1D"},
    },
    tooltip: {backgroundColor: "rgba(0, 0, 0, 0.07)", borderColor: "rgba(0, 0, 0, 0.07)", borderRadius: 12},
    plotOptions: {column: {maxPointWidth: 50}, bar: {maxPointWidth: 50}},
};

// The offer the real page (id 9981) shows: SOLO offer, 16–25 Jun 2026.
const OFFER = {start: "2026/06/16", end: "2026/06/25", days: 10};

/* ------------------------------------------------------------------ *
 *  i18n — real components use this.localize(key). Standalone => literal
 *  strings captured from the live app (ka) plus an English translation.
 *  {var1}/{var2}/{var3} are substituted by t().
 * ------------------------------------------------------------------ */

const STRINGS = {
    ka: {
        analyticsTitle: "ანალიტიკა",
        detailsBtn: "დეტალურად",
        reportBtn: "მონაცემების გადმოწერა",
        allOffers: "ყველა შეთავაზება",
        offerName: "SOLO შეთავაზება",

        tabAnalytics: "შეთავაზების ანალიტიკა",
        tabTransactions: "ტრანზაქციები",
        tabDetails: "შეთავაზების დეტალები",
        tabPlaceholder: "ეს ჩანართი დემო ვერსიაში არ არის ხელმისაწვდომი.",

        statusCompleted: "დასრულებული",
        actionDuplicate: "დუბლირება",
        actionExport: "ხარჯების გადმოწერა",
        actionView: "ნახვა offers.bog.ge-ზე",
        infoOffer: "შეთავაზება",
        offerText: "50%-იანი ქეშბექი",
        infoPeriod: "პერიოდი",
        offerPeriod: "19 ივნ 2026 - 25 ივნ 2026",
        infoAddresses: "მისამართები",
        addressesText: "თბილისი ბარამბო, კაზრეთი ბარამბო, საბადურის 20/7, საბადურის 20/7",
        viewAll: "(ყველას ნახვა)",
        numRevenue: "ჯამური შემოსავალი",
        numBenefit: "შეღავათი მომხმარებლებისთვის",
        numVat: "დღგ",
        numCost: "გადახდილი ხარჯი",

        roasText: "შემოსავლის კოეფიციენტი (ROAS)",
        roasTip: "შეთავაზებაზე დახარჯულ ყოველ ლარზე მიღებული შემოსავალი. რაც უფრო მაღალია, მით უფრო მომგებიანია.",
        crText: "კონვერსია",
        crTip: "მომხმარებლების პროცენტული მაჩვენებელი, რომლებმაც ნახვის შემდეგ ისარგებლეს შეთავაზებით. მაღალი მაჩვენებელი მიუთითებს შეთავაზების ეფექტურობაზე.",
        ctrText: "ნახვის მაჩვენებელი (CTR)",
        ctrTip: "შეთავაზების ნახვების პროცენტული მაჩვენებელი, რომელიც დეტალების გახსნით დასრულდა. აჩვენებს, რამდენად აინტერესებთ მომხმარებლებს თქვენი შეთავაზება.",
        uctrText: "უნიკალური გახსნის მაჩვენებელი",
        uctrTip:
            "მომხმარებლების %, რომლებმაც გახსნეს შეთავაზების დეტალები. არ ითვლება ერთი მომხმარებლის მიერ რამდენჯერმე გახსნა.",
        freqText: "ნახვების სიხშირე",
        freqTip:
            "საშუალოდ რამდენჯერ ნახა თითოეულმა მომხმარებელმა თქვენი შეთავაზება. გეხმარებათ გაიგოთ, რამდენად ხშირად/იშვიათად უჩვენებთ შეთავაზებას",

        learningTitle: "შეთავაზების შეფასება",
        learningSubtitle:
            "დაწყებიდან 3 დღეში ნახავთ, რამდენად კარგად მუშაობს თქვენი შეთავაზება სხვა კომპანიების მსგავს შეთავაზებებთან შედარებით",
        learnActual: "რეალური ნახვები",
        learnExpected: "მოსალოდნელი ნახვები",
        learnAxis: "ნახვების რაოდენობა",
        learnColExpected: "მოსალოდნელი ნახვა",
        learnColActual: "რეალური ნახვები",

        ctrTitle: "ნახვის მაჩვენებელი (CTR) დროში",
        ctrSubtitle: "რამდენმა ადამიანმა გახსნა დეტალები მას შემდეგ, რაც ნახა თქვენი შეთავაზება",
        ctrLegendViews: "ნახვის რაოდენობა",
        ctrAggViews: "ნახვა",
        ctrClick: "კლიკი",
        ctrCtr: "CTR %",
        ctrAxisValues: "Values",

        drilldownTitle: "დრილდაუნ",
        drilldownSubtitle: "ავტომატური შეფასება აჩვენებს თქვენი შეთავაზების ეფექტიანობას",
        ddMetricViews: "ნახვა",
        ddMetricClicks: "კლიკი",
        ddInterests: "ინტერესები",
        ddIncome: "შემოსავლის მიხედვით",
        ddGender: "სქესი",
        ddRegion: "რეგიონი",
        ddAge: "ასაკი",

        txAnalyticsTitle: "ტრანზაქციების ანალიტიკა",
        periodAll: "სულ",
        periodDay: "ბოლო დღე",
        periodWeek: "ბოლო კვირა",
        periodMonth: "ბოლო თვე",
        realizationTitle: "რეალიზაცია",
        realizationDesc: "რა რაოდენობის პროდუქტი გაიყიდა შეთავაზების დახმარებით",
        usageTitle: "შეთავაზებით სარგებლობა",
        usageDesc: "რამდენმა ადამიანმა ნახა, გახსნა დეტალები, გაიაქტიურა და ისარგებლა შეთავაზებით მონიშნულ პერიოდში",
        usageViews: "ნახვა",
        usageClicks: "კლიკი",
        usagePurchases: "ყიდვა",
        chOnline: "ონლაინ",
        chPos: "ფიზიკური პოსი",
        chOther: "სხვა",
        chSms: "სმს",
        txListTitle: "ტრანზაქციები",
        txDownload: "ტრანზაქციების გადმოწერა",
        fltChannel: "გადახდის არხი",
        fltPeriod: "პერიოდი",
        fltApply: "გაფილტვრა",
        fltClear: "გასუფთავება",
        colRrn: "RRN",
        colAuthDate: "ავტორიზაციის თარიღი",
        colMethod: "გადახდის მეთოდი",
        colCard: "ბარათის ტიპი",
        colFee: "შეთავაზების ხარჯი",
        colAmount: "თანხა",

        odSummaryTitle: "შეჯამება",
        odSummarySub: "ძირითადი ინფორმაცია შეთავაზების შესახებ",
        odPackage: "არჩეული პაკეტი:",
        odPackageValue: "პრემიუმი",
        odOffer: "შეთავაზება",
        odCondition: "შეთავაზების პირობა",
        odViewAll: "ყველას ნახვა",
        odFeePerPayment: "საკომისიო თითო გადახდაზე",
        odFeeVat: "საკომისიოს დღგ",
        odFeeTotal: "ჯამური საკომისიო",
        odConditions: "პირობები",
        odConditionsLink: "პირობების გადმოწერა",
        odPeriodValue: "2026 წლის 19 ივნისიდან 2026 წლის 25 ივნისამდე",
        odAddressesFull: "თბილისი ბარამბო, კაზრეთი ბარამბო, საბადურის 20/7, საბადურის 20/7, Guess My Address(GE)",
        odVisualTitle: "შეთავაზების ვიზუალი",
        odVisualSub: "შეთავაზება ამ ფორმით გამოჩნდება საქართველოს ბანკის ციფრულ არხებში",
        odAudienceTitle: "სამიზნე აუდიტორია",
        odAudienceSub: "შეთავაზება გაეშვება ქვემოთ მოცემულ აუდიტორიაზე",
        odAudTotal: "სულ",
        odAudTotalTip: "მომხმარებლების რაოდენობა, რომლებიც შერჩეულ სეგმენტში მოხვდნენ",
        odAudEstimate: "სავარაუდო რაოდენობა",
        odAudEstimateTip: "უნიკალური მომხმარებლების სავარაუდო რაოდენობა, რომლებსაც შეიძლება მივწვდეთ",
        odTextsTitle: "შეთავაზების ტექსტები",
        odTextsSub: "ამ ტექსტებს გამოვიყენებთ მომხმარებლებთან კომუნიკაციისთვის",
        odUrl: "პროდუქტის, ვებგვერდის, ან სოციალური ქსელის URL მისამართი",
        odUrlValue: "avoe.ge",
        odContact: "ბიზნესის საკონტაქტო ნომერი",
        odMainMsg: "შეთავაზების მთავარი მესიჯი",
        odShortDesc: "შეთავაზების მოკლე აღწერა",
        odInGeorgian: "ქართულად",
        odInEnglish: "ინგლისურად",
        odShortDescValue:
            "19 ივნისიდან 21 ივნისის ჩათვლით, დემიკო-ში, elene123-სა და მაგნიტ-ში SOLO ბარათით გადახდისას მიიღეთ 50% ქეშბექი. ქეშბექის მისაღებად გადაიხადეთ SOLO ბარათით საქართველოს ბანკის ტერმინალზე.",

        day: "დღეები",
        week: "კვირა",
        month: "თვეები",
        colDate: "თარიღი",

        // Learning info panel — ON_TRACK captured from the live app; the other two are drafts.
        ipTitleOn: "კარგი შედეგებია, თუმცა გაუმჯობესება შესაძლებელია",
        ipSubOn:
            "თქვენს შეთავაზებას დაწყებიდან {var1} დღეში {var2} ნახვა აქვს. მსგავსი შეთავაზებები ამ პერიოდში საშუალოდ {var3} ნახვას აგროვებს. შეთავაზება მეტ მომხმარებელს მიაღწევს, თუმცა მათი ინტერესი ჯერ დაბალია.",
        ipTitleBelow: "შედეგები მოლოდინს ჩამორჩება",
        ipSubBelow:
            "თქვენს შეთავაზებას დაწყებიდან {var1} დღეში {var2} ნახვა აქვს, მოსალოდნელი {var3}-ის ნაცვლად. განიხილეთ სამიზნეობის ან ბიუჯეტის ცვლილება.",
        ipTitleExceeds: "შესანიშნავი შედეგებია",
        ipSubExceeds:
            "თქვენს შეთავაზებას დაწყებიდან {var1} დღეში {var2} ნახვა აქვს, მოსალოდნელი {var3}-ის ზემოთ. შეთავაზება ძალიან კარგად მუშაობს.",

        emptyTitle: "მონაცემები არ არის",
        emptyDesc: "არჩეული პერიოდისთვის მონაცემები არ მოიძებნა.",
        errorTitle: "დაფიქსირდა შეცდომა",
        errorDesc: "დიაგრამის ჩატვირთვა ვერ მოხერხდა. სცადეთ თავიდან.",
    },
    en: {
        analyticsTitle: "Analytics",
        detailsBtn: "Details",
        reportBtn: "Download data",
        allOffers: "All offers",
        offerName: "SOLO offer",

        tabAnalytics: "Offer analytics",
        tabTransactions: "Transactions",
        tabDetails: "Offer details",
        tabPlaceholder: "This tab isn't available in the demo.",

        statusCompleted: "Completed",
        actionDuplicate: "Duplicate",
        actionExport: "Export costs",
        actionView: "View on offers.bog.ge",
        infoOffer: "Offer",
        offerText: "50% cashback",
        infoPeriod: "Period",
        offerPeriod: "19 Jun 2026 - 25 Jun 2026",
        infoAddresses: "Addresses",
        addressesText: "Tbilisi Barambo, Kazreti Barambo, Sabaduris 20/7, Sabaduris 20/7",
        viewAll: "(view all)",
        numRevenue: "Total revenue",
        numBenefit: "Customer benefit",
        numVat: "VAT",
        numCost: "Paid cost",

        roasText: "Return on ad spend (ROAS)",
        roasTip: "Revenue earned per GEL spent on the offer. The higher it is, the more profitable.",
        crText: "Conversion",
        crTip: "Share of users who used the offer after viewing it. A higher rate indicates a more effective offer.",
        ctrText: "View rate (CTR)",
        ctrTip: "Share of offer views that ended in opening the details. Shows how interested customers are in your offer.",
        uctrText: "Unique open rate",
        uctrTip: "Share of users who opened the offer details. Repeated opens by the same user are not counted.",
        freqText: "View frequency",
        freqTip:
            "On average, how many times each user saw your offer. Helps you understand how often/rarely the offer is shown.",

        learningTitle: "Offer assessment",
        learningSubtitle:
            "Within 3 days of launch you can see how well your offer performs against similar offers from other companies.",
        learnActual: "Actual views",
        learnExpected: "Expected views",
        learnAxis: "Number of views",
        learnColExpected: "Expected views",
        learnColActual: "Actual views",

        ctrTitle: "View rate (CTR) over time",
        ctrSubtitle: "How many people opened the details after seeing your offer.",
        ctrLegendViews: "Number of views",
        ctrAggViews: "Views",
        ctrClick: "Clicks",
        ctrCtr: "CTR %",
        ctrAxisValues: "Values",

        drilldownTitle: "Drilldown",
        drilldownSubtitle: "Automated assessment showing your offer's effectiveness.",
        ddMetricViews: "Views",
        ddMetricClicks: "Clicks",
        ddInterests: "Interests",
        ddIncome: "By income",
        ddGender: "Gender",
        ddRegion: "Region",
        ddAge: "Age",

        txAnalyticsTitle: "Transactions analytics",
        periodAll: "All",
        periodDay: "Last day",
        periodWeek: "Last week",
        periodMonth: "Last month",
        realizationTitle: "Realization",
        realizationDesc: "How many products were sold with the help of the offer",
        usageTitle: "Offer engagement",
        usageDesc: "How many people saw, opened details, activated and used the offer in the selected period",
        usageViews: "Views",
        usageClicks: "Clicks",
        usagePurchases: "Purchases",
        chOnline: "Online",
        chPos: "Physical POS",
        chOther: "Other",
        chSms: "SMS",
        txListTitle: "Transactions",
        txDownload: "Download transactions",
        fltChannel: "Payment channel",
        fltPeriod: "Period",
        fltApply: "Filter",
        fltClear: "Clear",
        colRrn: "RRN",
        colAuthDate: "Authorization date",
        colMethod: "Payment method",
        colCard: "Card type",
        colFee: "Offer cost",
        colAmount: "Amount",

        odSummaryTitle: "Summary",
        odSummarySub: "Key information about the offer",
        odPackage: "Selected package:",
        odPackageValue: "Premium",
        odOffer: "Offer",
        odCondition: "Offer condition",
        odViewAll: "View all",
        odFeePerPayment: "Commission per payment",
        odFeeVat: "Commission VAT",
        odFeeTotal: "Total commission",
        odConditions: "Conditions",
        odConditionsLink: "Download conditions",
        odPeriodValue: "From June 19, 2026 to June 25, 2026",
        odAddressesFull: "Tbilisi Barambo, Kazreti Barambo, Sabaduris 20/7, Sabaduris 20/7, Guess My Address(GE)",
        odVisualTitle: "Offer visual",
        odVisualSub: "The offer will appear in this form across Bank of Georgia digital channels",
        odAudienceTitle: "Target audience",
        odAudienceSub: "The offer will run to the audience below",
        odAudTotal: "Total",
        odAudTotalTip: "The number of users who fell into the selected segment",
        odAudEstimate: "Estimated number",
        odAudEstimateTip: "Estimated number of unique users we may reach",
        odTextsTitle: "Offer texts",
        odTextsSub: "We'll use these texts to communicate with customers",
        odUrl: "Product, website, or social network URL",
        odUrlValue: "avoe.ge",
        odContact: "Business contact number",
        odMainMsg: "Offer main message",
        odShortDesc: "Offer short description",
        odInGeorgian: "In Georgian",
        odInEnglish: "In English",
        odShortDescValue:
            "From June 19 to June 21, get 50% cashback when you pay with your SOLO card at Demiko, elene123, and Magnit. To receive cashback, pay with your SOLO card at a Bank of Georgia terminal.",

        day: "Days",
        week: "Weeks",
        month: "Months",
        colDate: "Date",

        ipTitleOn: "Good results, though there is room to improve",
        ipSubOn:
            "Your offer has {var2} views in the first {var1} days. Similar offers gather {var3} views on average in this period. The offer will reach more users, but their interest is still low.",
        ipTitleBelow: "Below expectations",
        ipSubBelow:
            "Your offer has {var2} views in the first {var1} days, instead of the expected {var3}. Consider revisiting targeting or budget.",
        ipTitleExceeds: "Excellent results",
        ipSubExceeds:
            "Your offer has {var2} views in the first {var1} days, above the expected {var3}. The offer is performing very well.",

        emptyTitle: "No data",
        emptyDesc: "There is no data to display for the selected period.",
        errorTitle: "Something went wrong",
        errorDesc: "We could not load this chart. Please try again.",
    },
};

function makeT(lang) {
    const dict = STRINGS[lang] || STRINGS.en;
    return (key, vars) => {
        let str = dict[key] ?? key;
        if (vars) for (const [k, v] of Object.entries(vars)) str = str.replaceAll(`{${k}}`, v);
        return str;
    };
}

const periodTypesFor = (t) => [
    {label: t("day"), value: "DAY"},
    {label: t("week"), value: "WEEK"},
    {label: t("month"), value: "MONTH"},
];

/* ------------------------------------------------------------------ *
 *  Utils (ported from utils.js / helpers.js)
 * ------------------------------------------------------------------ */

const isMSmallResolution = () => window.matchMedia(`(max-width: ${MEDIA_CHECKPOINTS.mSmall}px)`).matches;
const isXSmallResolution = () => window.matchMedia(`(max-width: ${MEDIA_CHECKPOINTS.xSmall}px)`).matches;
const getCssVariableColor = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "#000";
const formatDate = (date, format = "MMMM", locale = "en") => (date ? dayjs(date).locale(locale).format(format) : "");
const formatNumber = (value) => (Number.isFinite(value) && value > 1000 ? value.toLocaleString("en-US") : value);

// helpers.js getUniquePeriods (verbatim)
function getUniquePeriods(data, locale = "en", periodType) {
    if (!data?.length) return [];
    dayjs.locale(locale);
    const uniquePeriods = Array.from(new Set(data.map((item) => item.date.join(" ")))).filter(Boolean);
    return uniquePeriods.map((period) => {
        const dates = period.split(" ");
        if (periodType === "DAY") return dayjs(dates[0], "YYYY/MM/DD").format("DD MMM/YYYY");
        if (periodType === "WEEK") {
            const start = dayjs(dates[0], "YYYY/MM/DD");
            const end = dayjs(dates[1], "YYYY/MM/DD");
            return `${start.format("DD/MMM")} - ${end.format("DD/MMM")}`;
        }
        if (periodType === "MONTH") return dayjs(dates[0], "YYYY/MM").format("MMM/YYYY");
        return period;
    });
}

/* ------------------------------------------------------------------ *
 *  Mock API — replaces apiCall for the impressions endpoints.
 *  Data is deterministic (smooth sine curves over the offer period).
 * ------------------------------------------------------------------ */

const SCENARIO_FACTOR = {BELOW_EXPECTATIONS: 0.72, ON_TRACK: 1.24, EXCEEDS_EXPECTATIONS: 1.6};

// Aggregation granularity from the selected range: <7d -> days, <30d -> weeks, <365d -> months, else quarters.
function autoPeriodType(start, end) {
    const days = dayjs(end).diff(dayjs(start), "day") + 1;
    if (days < 7) return "DAY";
    if (days < 30) return "WEEK";
    if (days < 365) return "MONTH";
    return "QUARTER";
}

function rangeDays(start, end) {
    const out = [];
    let d = dayjs(start);
    const e = dayjs(end);
    let guard = 0;
    while (!d.isAfter(e, "day") && guard++ < 4000) {
        out.push(d);
        d = d.add(1, "day");
    }
    return out;
}

// Buckets over [start,end] for a granularity: each carries a getUniquePeriods `date` + the days to aggregate.
function bucketsForRange(start, end, periodType) {
    const days = rangeDays(start, end);
    if (periodType === "DAY") {
        return days.map((d) => ({date: [d.format("YYYY/MM/DD")], days: [d]}));
    }
    if (periodType === "WEEK") {
        const out = [];
        for (let i = 0; i < days.length; i += 7) {
            const chunk = days.slice(i, i + 7);
            out.push({
                date: [chunk[0].format("YYYY/MM/DD"), chunk[chunk.length - 1].format("YYYY/MM/DD")],
                days: chunk,
            });
        }
        return out;
    }
    const monthMap = new Map();
    days.forEach((d) => {
        const key = d.format("YYYY/MM");
        if (!monthMap.has(key)) monthMap.set(key, []);
        monthMap.get(key).push(d);
    });
    const months = Array.from(monthMap.entries());
    if (periodType === "MONTH") {
        return months.map(([key, ds]) => ({date: [key], days: ds}));
    }
    const out = [];
    for (let i = 0; i < months.length; i += 3) {
        const chunk = months.slice(i, i + 3);
        out.push({date: chunk.map(([k]) => k), days: chunk.flatMap(([, ds]) => ds)});
    }
    return out;
}

// Deterministic daily series (keyed by day offset from OFFER.start) so aggregation stays consistent across granularities.
function dayIndex(d) {
    return d.diff(dayjs(OFFER.start), "day");
}

function dailyLearning(idx, factor) {
    // Monotonically increasing daily trend so the assessment chart always climbs over time.
    const base = 400 + idx * 55;
    return {
        predicted: Math.max(60, Math.round(base)),
        views: Math.max(0, Math.round(base * factor)),
    };
}

function dailyCtr(idx) {
    // Realistic consumer-offer traffic shape:
    //  - a launch ramp that grows fast then plateaus (delivery warming up),
    //  - mild weekly seasonality (weekends run a bit hotter),
    //  - CTR that starts fresh (~6.3%) and tapers toward ~4.3% as the audience saturates
    //    (ad fatigue), keeping the blended rate near the 5% CTR KPI.
    const ramp = 2600 * (1 - Math.exp(-(idx + 1) / 4));
    const weekly = 1 + 0.18 * Math.sin((idx / 7) * 2 * Math.PI);
    const views = Math.max(0, Math.round(ramp * weekly));
    const ctr = 0.043 + 0.02 * Math.exp(-idx / 9);
    const clicks = Math.max(0, Math.round(views * ctr));
    return {views, clicks};
}

function buildLearning({startDate, endDate, periodType, scenario = "ON_TRACK"}) {
    const start = startDate || OFFER.start;
    const end = endDate || OFFER.end;
    const pt = periodType || autoPeriodType(start, end);
    const factor = SCENARIO_FACTOR[scenario] ?? 1.24;
    const data = bucketsForRange(start, end, pt).map((b) => {
        let views = 0;
        let predictedViews = 0;
        b.days.forEach((d) => {
            const daily = dailyLearning(dayIndex(d), factor);
            views += daily.views;
            predictedViews += daily.predicted;
        });
        return {date: b.date, views, predictedViews};
    });
    // Guarantee each plotted bucket is strictly higher than the previous one, even when a
    // trailing bucket spans fewer days than earlier ones (e.g. a partial final week/month).
    let prevViews = 0;
    let prevPredicted = 0;
    data.forEach((d) => {
        if (d.views <= prevViews) d.views = prevViews + Math.round((prevViews || 100) * 0.08) + 1;
        if (d.predictedViews <= prevPredicted)
            d.predictedViews = prevPredicted + Math.round((prevPredicted || 100) * 0.08) + 1;
        prevViews = d.views;
        prevPredicted = d.predictedViews;
    });
    return {
        data,
        periodType: pt,
        offerDayNumber: dayjs(end).diff(dayjs(start), "day") + 1,
        offerPerformance: scenario,
        totalViews: data.reduce((s, d) => s + d.views, 0),
        totalPredictedViews: data.reduce((s, d) => s + d.predictedViews, 0),
    };
}

function buildCtrTime({startDate, endDate, periodType}) {
    const start = startDate || OFFER.start;
    const end = endDate || OFFER.end;
    const pt = periodType || autoPeriodType(start, end);
    const data = bucketsForRange(start, end, pt).map((b) => {
        let views = 0;
        let clicks = 0;
        b.days.forEach((d) => {
            const c = dailyCtr(dayIndex(d));
            views += c.views;
            clicks += c.clicks;
        });
        return {date: b.date, views, clicks, ctrPercentage: views ? Math.round((clicks / views) * 1000) / 10 : 0};
    });
    const totalViews = data.reduce((s, d) => s + d.views, 0);
    const totalClicks = data.reduce((s, d) => s + d.clicks, 0);
    return {
        data,
        periodType: pt,
        totalViews,
        totalClicks,
        totalCtrPercentage: totalViews ? Math.round((totalClicks / totalViews) * 1000) / 10 : 0,
    };
}

const mockApi = {
    execute({url, params = {}}) {
        return new Promise((resolve) => setTimeout(() => resolve({json: route(url, params)}), 250));
    },
};

// Deterministic transaction rows spanning ~1 month back from the offer end, mixed channels/cards.
const TX_CHANNELS = ["online", "pos", "other"];
const TX_ROWS = Array.from({length: 32}, (_, i) => ({
    rrn: String(100000000000 + i * 95763137).slice(0, 12),
    authDate: dayjs(OFFER.end, "YYYY/MM/DD").subtract(i, "day").format("YYYY/MM/DD"),
    channel: TX_CHANNELS[i % 3],
    cardGroup: i % 3 === 0 ? "Mastercard" : "VISA",
    fee: (2 + ((i * 3) % 18)).toFixed(2),
    amount: (35 + ((i * 61) % 420)).toFixed(2),
}));

// Charts period select (სულ / last day / week / month) scales the aggregate figures.
function periodScale(periodId) {
    switch (Number(periodId)) {
        case 1:
            return 0.08;
        case 7:
            return 0.35;
        case 30:
            return 0.85;
        default:
            return 1;
    }
}

function route(url, params) {
    const empty = params.empty;
    if (url.includes("impressions/summary")) {
        return empty
            ? {noData: true}
            : {result: {returnOnAdSpend: 0, conversionRate: 7, ctr: 5, uniqueCtr: 5.44, frequency: 1.14}};
    }
    if (url.includes("impressions/views-prediction")) {
        if (empty) return {noData: true};
        const range = {startDate: params.startDate, endDate: params.endDate, scenario: params.scenario};
        // Table (pageSize present) is always daily; the chart auto-derives granularity from the range (or uses the chip).
        if (params.pageSize != null) return paginate(buildLearning({...range, periodType: "DAY"}), params);
        return buildLearning({...range, periodType: params.periodType});
    }
    if (url.includes("impressions/ctr-time")) {
        if (empty) return {noData: true};
        const range = {startDate: params.startDate, endDate: params.endDate};
        if (params.pageSize != null) return paginate(buildCtrTime({...range, periodType: "DAY"}), params);
        return buildCtrTime({...range, periodType: params.periodType});
    }
    if (url.includes("offer/realization")) {
        if (empty) return {result: []};
        const s = periodScale(params.periodId);
        return {
            result: [
                {channelId: 1, amount: Math.round(40 * s)},
                {channelId: 2, amount: Math.round(120 * s)},
                {channelId: 13, amount: Math.round(240 * s)},
            ],
        };
    }
    if (url.includes("impressions/engagement/chart")) {
        if (empty) return {result: {views: 0, clicks: 0, purchases: 0}};
        const s = periodScale(params.periodId);
        return {result: {views: Math.round(21450 * s), clicks: Math.round(4230 * s), purchases: Math.round(462 * s)}};
    }
    if (url.includes("offer/transactions")) {
        if (empty) return {result: {transactionDetails: [], totalElements: 0}};
        let rows = TX_ROWS;
        if (params.channel) rows = rows.filter((r) => r.channel === params.channel);
        if (params.rrn) rows = rows.filter((r) => r.rrn.includes(params.rrn));
        if (params.startDate) rows = rows.filter((r) => !dayjs(r.authDate).isBefore(dayjs(params.startDate), "day"));
        if (params.endDate) rows = rows.filter((r) => !dayjs(r.authDate).isAfter(dayjs(params.endDate), "day"));
        const size = params.size || 10;
        const start = ((params.page || 1) - 1) * size;
        return {result: {transactionDetails: rows.slice(start, start + size), totalElements: rows.length}};
    }
    return {noData: true};
}

function paginate(full, {pageSize = 10, pageNumber = 0}) {
    const start = pageNumber * pageSize;
    return {...full, data: full.data.slice(start, start + pageSize), totalCount: full.data.length};
}

/* ------------------------------------------------------------------ *
 *  Shared chart styles (trimmed from shared-analytics-chart-styles.js)
 * ------------------------------------------------------------------ */

const sharedChartStyles = css`
    :host {
        position: relative;
        display: block;
    }
    .divider {
        width: 1px;
        align-self: stretch;
        background-color: var(--color-invert-component-tr-70);
        margin: 0 var(--space-32);
    }
    .left {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-4);
    }
    .aggregate-wrapper {
        display: flex;
        justify-content: space-between;
        padding-bottom: var(--space-24);
    }
    .period-types {
        display: flex;
        gap: var(--space-8);
        align-items: center;
        margin-left: auto;
    }
    .details-filter {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .header-left {
        display: flex;
        padding: var(--space-12) var(--space-16);
        background-color: var(--layer-02);
        border-radius: var(--border-radius-8);
    }
    .aggregation-title {
        color: var(--text-secondary);
    }
    .legend {
        display: flex;
        gap: var(--space-12);
        flex-direction: column;
        padding: var(--space-24) 0;
    }
    .legend-item {
        display: flex;
        width: fit-content;
        align-items: center;
        color: var(--text-secondary);
        gap: var(--space-8);
    }
    .legend-point {
        width: var(--space-8);
        height: var(--space-8);
        border-radius: 50%;
        flex: none;
    }
    @media (max-width: ${MEDIA_CHECKPOINTS.small}px) {
        .aggregate-wrapper {
            flex-direction: column;
            gap: var(--space-16);
        }
    }
`;

/* ================================================================== *
 *  <showcase-empty>  — empty / error message
 * ================================================================== */

class ShowcaseEmpty extends LitElement {
    static properties = {messageType: {type: String}, t: {attribute: false}};
    static styles = css`
        :host {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 350px;
            padding: var(--space-32) 0;
            box-sizing: border-box;
        }
        .message {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--space-6);
            text-align: center;
        }
        .subtitle {
            color: var(--color-invert-component-tr-40);
            max-width: 320px;
        }
    `;
    render() {
        const t = this.t || makeT("en");
        const isError = this.messageType === "ERROR";
        return html`<div class="message">
            <bd-font type="title">${isError ? t("errorTitle") : t("emptyTitle")}</bd-font>
            <bd-font class="subtitle" type="body2">${isError ? t("errorDesc") : t("emptyDesc")}</bd-font>
        </div>`;
    }
}
customElements.define("showcase-empty", ShowcaseEmpty);

/* ================================================================== *
 *  <showcase-chart-wrapper>  — port of analytics-chart-wrapper (card)
 * ================================================================== */

class ShowcaseChartWrapper extends LitElement {
    static properties = {
        showHeader: {type: Boolean, attribute: "show-header"},
        headerTitle: {type: String, attribute: "header-title"},
        headerContent: {type: String, attribute: "header-content"},
        headerButton: {type: String, attribute: "header-button"},
        headerButtonHash: {type: String, attribute: "header-button-hash"},
    };
    static styles = css`
        :host {
            --chart-padding: var(--space-24);
            display: block;
            border-radius: var(--border-radius-12);
            background-color: var(--layer-01);
            border: 1px solid var(--border-03);
        }
        ::slotted([slot="chart"]) {
            flex: 1;
        }
        .chart-wrapper {
            display: flex;
            flex-direction: column;
            height: 100%;
        }
        .chart-header {
            display: flex;
            flex-direction: column;
            padding: var(--space-16) var(--space-24);
            box-sizing: border-box;
            min-height: 92px;
            gap: var(--space-4);
        }
        .subtitle-wrapper {
            display: flex;
            gap: var(--space-24);
            align-items: flex-start;
        }
        .description {
            flex: 1;
            min-width: 0;
            color: var(--color-invert-component-tr-40);
        }
        .header-button {
            margin-left: auto;
            white-space: nowrap;
        }
        .divider {
            display: block;
            height: 1px;
            background-color: var(--color-invert-component-tr-70);
        }
        .chart {
            padding: var(--chart-padding);
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
        }
    `;
    render() {
        return html`<div class="chart-wrapper">
            ${this.showHeader
                ? html`<header class="chart-header">
                          <bd-font class="header-subtitle" type="subtitle">${this.headerTitle}</bd-font>
                          <div class="subtitle-wrapper">
                              ${!isXSmallResolution()
                                  ? html`<bd-font class="description" type="small-text">${this.headerContent}</bd-font>`
                                  : nothing}
                              ${this.headerButtonHash
                                  ? html`<bd-standard-button class="header-button" type="text-low" @click="${this._go}"
                                        >${this.headerButton}</bd-standard-button
                                    >`
                                  : nothing}
                          </div>
                      </header>
                      <div class="divider"></div>`
                : nothing}
            <section class="chart"><slot name="chart"></slot></section>
        </div>`;
    }
    _go() {
        window.location.hash = this.headerButtonHash;
    }
}
customElements.define("showcase-chart-wrapper", ShowcaseChartWrapper);

/* ================================================================== *
 *  <showcase-learning-chart>  — port of campaign-learning-chart
 * ================================================================== */

const VIEWS = {SUCCESS: "SUCCESS", EMPTY: "EMPTY", ERROR: "ERROR"};
const OFFER_PERFORMANCES = ["BELOW_EXPECTATIONS", "ON_TRACK", "EXCEEDS_EXPECTATIONS"];

class ShowcaseLearningChart extends LitElement {
    static properties = {
        lang: {type: String},
        scenario: {type: String},
        emptyState: {type: Boolean},
        loading: {type: Boolean, reflect: true},
        view: {type: String},
        periodType: {type: String},
        filterData: {type: Object},
        isDetailsPage: {type: Boolean},
        chartData: {type: Object},
        aggregateData: {type: Object},
        _offerPerformance: {type: String},
        _offerDayNumber: {type: Number},
    };

    static styles = [
        sharedChartStyles,
        css`
            #chart {
                width: 100%;
                height: 350px;
            }
            .chart-layout {
                display: flex;
                flex-direction: column;
                gap: var(--space-16);
                width: 100%;
            }
            .info-panel {
                width: 100%;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                gap: var(--space-8);
                padding: var(--space-24);
                background-color: var(--decorative-warm-gray-layer-00);
            }
            .info-panel--details {
                border-radius: var(--border-radius-12);
            }
            .info-panel--on_track {
                background-color: var(--decorative-warm-gray-layer-00);
            }
            .info-panel--exceeds_expectations {
                background-color: var(--status-success-alpha-01);
            }
            .info-panel--below_expectations {
                background-color: var(--status-warning-01);
            }
            .info-panel-text {
                color: var(--text-primary);
            }
        `,
    ];

    constructor() {
        super();
        this.lang = "ka";
        this.scenario = "ON_TRACK";
        this.emptyState = false;
        this.loading = true;
        this.view = "";
        this.periodType = "DAY";
        this.filterData = {};
        this.chartData = {};
        this.aggregateData = {views: 0, predictedViews: 0};
        this._offerPerformance = "ON_TRACK";
        this._offerDayNumber = 0;
    }

    get t() {
        return makeT(this.lang);
    }

    updated(changed) {
        if (["filterData", "periodType", "scenario", "emptyState", "lang"].some((k) => changed.has(k))) {
            this._fetchChartData();
        }
    }

    render() {
        if (this.view === VIEWS.ERROR || this.view === VIEWS.EMPTY) {
            return html`<showcase-empty .messageType=${this.view} .t=${this.t}></showcase-empty>`;
        }
        return html`
            ${this.loading
                ? html`<div id="chart"></div>`
                : html`
                      ${this.chartHeaderPart}
                      <div class="chart-layout">
                          ${!this._offerPerformance || !this._offerDayNumber ? nothing : this.infoPanel}
                          <div class="chart-card"><div id="chart"></div></div>
                      </div>
                  `}
        `;
    }

    get chartHeaderPart() {
        if (!this.isDetailsPage) return nothing;
        const t = this.t;
        return html`<div class="aggregate-wrapper">
            <div class="details-filter">
                <div class="header-left">
                    <div class="left">
                        <bd-font class="aggregation-title" type="small-text">${t("learnActual")}</bd-font>
                        <bd-font type="title">${formatNumber(this.aggregateData.views)}</bd-font>
                    </div>
                    <div class="divider"></div>
                    <div class="left">
                        <bd-font class="aggregation-title" type="small-text">${t("learnExpected")}</bd-font>
                        <bd-font type="title">${formatNumber(this.aggregateData.predictedViews)}</bd-font>
                    </div>
                </div>
            </div>
            <div class="period-types">${this._periodTypePart()}</div>
        </div>`;
    }

    get infoPanel() {
        const t = this.t;
        const perf = this._offerPerformance;
        if (!OFFER_PERFORMANCES.includes(perf)) return nothing;
        const map = {
            BELOW_EXPECTATIONS: ["ipTitleBelow", "ipSubBelow"],
            ON_TRACK: ["ipTitleOn", "ipSubOn"],
            EXCEEDS_EXPECTATIONS: ["ipTitleExceeds", "ipSubExceeds"],
        };
        const [titleKey, subKey] = map[perf];
        const vars = {
            var1: formatNumber(this._offerDayNumber),
            var2: formatNumber(this.aggregateData.views),
            var3: formatNumber(this.aggregateData.predictedViews),
        };
        return html`<aside
            class="info-panel info-panel--${perf.toLowerCase()}${this.isDetailsPage ? " info-panel--details" : ""}"
        >
            <bd-font class="info-panel-title" type="subtitle">${t(titleKey)}</bd-font>
            <bd-font class="info-panel-text" type="body2">${t(subKey, vars)}</bd-font>
        </aside>`;
    }

    _periodTypePart() {
        return periodTypesFor(this.t).map(
            (pt) =>
                html`<bd-filter-chips
                    text="${pt.label}"
                    ?selected="${pt.value === this.periodType}"
                    @on-chips-click="${() => (this.periodType = pt.value)}"
                ></bd-filter-chips>`,
        );
    }

    _modifyChartData(input) {
        const t = this.t;
        const views = input.data.map((i) => i.views);
        const predictedViews = input.data.map((i) => i.predictedViews);
        const isEmpty = (arr) => !arr || arr.every((n) => n === 0);
        return [
            {
                name: t("learnActual"),
                type: "column",
                color: !isEmpty(views) ? "var(--decorative-green-layer-01)" : getCssVariableColor("--text-disabled"),
                data: views,
            },
            {
                name: t("learnExpected"),
                type: "spline",
                dashStyle: "Dot",
                color: getCssVariableColor("--decorative-cool-gray-layer-02"),
                lineWidth: 2,
                marker: {enabled: false},
                data: predictedViews,
            },
        ];
    }

    async _fetchChartData() {
        this.loading = true;
        try {
            const data = await mockApi.execute({
                url: "ads-manager/impressions/views-prediction",
                params: {
                    scenario: this.scenario,
                    empty: this.emptyState,
                    startDate: this.filterData?.startDate
                        ? dayjs(this.filterData.startDate).format("YYYY-MM-DD")
                        : undefined,
                    endDate: this.filterData?.endDate ? dayjs(this.filterData.endDate).format("YYYY-MM-DD") : undefined,
                    ...(this.isDetailsPage && {periodType: this.periodType}),
                },
            });
            if (this.chart && Object.keys(this.chart).length) this.chart.destroy();
            if (data.json?.noData) {
                this.view = VIEWS.EMPTY;
                return;
            }
            this.chartData.periods = getUniquePeriods(data.json.data, this.lang, data.json.periodType);
            this._offerDayNumber = data.json.offerDayNumber;
            this._offerPerformance = data.json.offerPerformance;
            this.chartData.series = this._modifyChartData(data.json);
            this.aggregateData = {views: data.json.totalViews, predictedViews: data.json.totalPredictedViews};
            this.view = VIEWS.SUCCESS;
            this._initChart();
        } catch (e) {
            console.error(e);
            this.view = VIEWS.ERROR;
        }
    }

    _initChart() {
        this.loading = false;
        Highcharts.setOptions(light);
        Highcharts.Legend.prototype.setItemEvents = function () {};
        const formatValue = formatNumber;
        const t = this.t;
        const tooltipTitles = {column: t("learnActual"), spline: t("learnExpected")};
        requestAnimationFrame(() => {
            const container = this.shadowRoot.getElementById("chart");
            if (!container) return;
            this.chart = Highcharts.chart(container, {
                chart: {backgroundColor: "rgba(255, 255, 255, 0)"},
                title: {text: null},
                credits: {enabled: false},
                xAxis: [{categories: this.chartData.periods, crosshair: false}],
                yAxis: [{labels: {format: "{value}"}, title: {text: t("learnAxis")}, lineWidth: 0}],
                tooltip: {
                    shared: true,
                    useHTML: true,
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    borderColor: "transparent",
                    borderRadius: 8,
                    style: {color: "#FFFFFF"},
                    formatter() {
                        const header = `<div style="margin-bottom: 4px; font-weight: 600;">${this.x}</div>`;
                        const rows = this.points
                            .map((point) => {
                                const title = tooltipTitles[point.series.type] ?? point.series.name;
                                return `<div style="display: flex; align-items: center; gap: 6px;"><span style="color: ${point.color};">●</span><span>${title}:</span><b>${formatValue(point.y)}</b></div>`;
                            })
                            .join("");
                        return header + rows;
                    },
                },
                legend: {align: "right", verticalAlign: "bottom"},
                series: this.chartData.series,
                colors: COLORS,
            });
        });
    }
}
customElements.define("showcase-learning-chart", ShowcaseLearningChart);

/* ================================================================== *
 *  <showcase-ctr-time-chart>  — port of campaign-ctr-time-chart
 * ================================================================== */

const CTR_SERIES_COLORS = {
    views: "var(--decorative-green-layer-01)",
    clicks: "var(--decorative-purple-layer-01)",
    ctr: "var(--decorative-orange-layer-02)",
};

class ShowcaseCtrTimeChart extends LitElement {
    static properties = {
        lang: {type: String},
        emptyState: {type: Boolean},
        loading: {type: Boolean, reflect: true},
        view: {type: String},
        periodType: {type: String},
        filterData: {type: Object},
        isDetailsPage: {type: Boolean},
        chartData: {type: Object},
        aggregateData: {type: Object},
    };

    static styles = [
        sharedChartStyles,
        css`
            #chart {
                width: 100%;
                height: 350px;
            }
            .chart-layout {
                display: flex;
                flex-direction: column;
                gap: var(--space-16);
                width: 100%;
            }
        `,
    ];

    constructor() {
        super();
        this.lang = "ka";
        this.emptyState = false;
        this.loading = true;
        this.view = "";
        this.periodType = "DAY";
        this.filterData = {};
        this.chartData = {};
        this.aggregateData = {views: 0, clicks: 0, ctr: 0};
    }

    get t() {
        return makeT(this.lang);
    }

    updated(changed) {
        if (["filterData", "periodType", "emptyState", "lang"].some((k) => changed.has(k))) {
            this._fetchChartData();
        }
    }

    render() {
        if (this.view === VIEWS.ERROR || this.view === VIEWS.EMPTY) {
            return html`<showcase-empty .messageType=${this.view} .t=${this.t}></showcase-empty>`;
        }
        return html`
            ${this.loading
                ? html`<div id="chart"></div>`
                : html`${this.chartHeaderPart}
                      <div class="chart-layout">
                          <div class="chart-card"><div id="chart"></div></div>
                      </div>`}
        `;
    }

    get chartHeaderPart() {
        if (!this.isDetailsPage) return nothing;
        const t = this.t;
        return html`<div class="aggregate-wrapper">
            <div class="details-filter">
                <div class="header-left">
                    <div class="left">
                        <bd-font class="aggregation-title" type="small-text">${t("ctrAggViews")}</bd-font>
                        <bd-font type="title">${formatNumber(this.aggregateData.views)}</bd-font>
                    </div>
                    <div class="divider"></div>
                    <div class="left">
                        <bd-font class="aggregation-title" type="small-text">${t("ctrClick")}</bd-font>
                        <bd-font type="title">${formatNumber(this.aggregateData.clicks)}</bd-font>
                    </div>
                    <div class="divider"></div>
                    <div class="left">
                        <bd-font class="aggregation-title" type="small-text">${t("ctrCtr")}</bd-font>
                        <bd-font type="title">${this.aggregateData.ctr}%</bd-font>
                    </div>
                </div>
            </div>
            <div class="period-types">${this._periodTypePart()}</div>
        </div>`;
    }

    _periodTypePart() {
        return periodTypesFor(this.t).map(
            (pt) =>
                html`<bd-filter-chips
                    text="${pt.label}"
                    ?selected="${pt.value === this.periodType}"
                    @on-chips-click="${() => (this.periodType = pt.value)}"
                ></bd-filter-chips>`,
        );
    }

    _modifyChartData(input) {
        const t = this.t;
        return [
            {
                name: t("ctrLegendViews"),
                type: "column",
                color: CTR_SERIES_COLORS.views,
                data: input.data.map((i) => i.views),
                yAxis: 0,
            },
            {
                name: t("ctrClick"),
                type: "column",
                color: CTR_SERIES_COLORS.clicks,
                data: input.data.map((i) => i.clicks),
                yAxis: 0,
            },
            {
                name: t("ctrCtr"),
                type: "spline",
                color: CTR_SERIES_COLORS.ctr,
                lineWidth: 1,
                marker: {enabled: false},
                data: input.data.map((i) => i.ctrPercentage),
                yAxis: 1,
                tooltip: {valueSuffix: "%"},
            },
        ];
    }

    async _fetchChartData() {
        this.loading = true;
        try {
            const data = await mockApi.execute({
                url: "ads-manager/impressions/ctr-time",
                params: {
                    empty: this.emptyState,
                    startDate: this.filterData?.startDate
                        ? dayjs(this.filterData.startDate).format("YYYY-MM-DD")
                        : undefined,
                    endDate: this.filterData?.endDate ? dayjs(this.filterData.endDate).format("YYYY-MM-DD") : undefined,
                    ...(this.isDetailsPage && {periodType: this.periodType}),
                },
            });
            if (this.chart && Object.keys(this.chart).length) this.chart.destroy();
            if (data.json?.noData) {
                this.view = VIEWS.EMPTY;
                return;
            }
            this.chartData = {
                periods: getUniquePeriods(data.json.data, this.lang, data.json.periodType),
                series: this._modifyChartData(data.json),
            };
            this.aggregateData = {
                views: data.json.totalViews,
                clicks: data.json.totalClicks,
                ctr: data.json.totalCtrPercentage,
            };
            this.view = VIEWS.SUCCESS;
            this._initChart();
        } catch (e) {
            console.error(e);
            this.view = VIEWS.ERROR;
        }
    }

    _initChart() {
        this.loading = false;
        Highcharts.setOptions(light);
        Highcharts.Legend.prototype.setItemEvents = function () {};
        const formatValue = formatNumber;
        const t = this.t;
        requestAnimationFrame(() => {
            const container = this.shadowRoot.getElementById("chart");
            if (!container) return;
            this.chart = Highcharts.chart(container, {
                chart: {backgroundColor: "rgba(255, 255, 255, 0)"},
                title: {text: null},
                credits: {enabled: false},
                xAxis: [{categories: this.chartData.periods, crosshair: false}],
                yAxis: [
                    {labels: {format: "{value}"}, lineWidth: 0},
                    {
                        min: 0,
                        opposite: true,
                        labels: {format: "{value}%"},
                        title: {text: t("ctrCtr")},
                        gridLineWidth: 0,
                        lineWidth: 0,
                    },
                ],
                tooltip: {
                    shared: true,
                    useHTML: true,
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    borderColor: "transparent",
                    borderRadius: 8,
                    style: {color: "#FFFFFF"},
                    formatter() {
                        const header = `<div style="margin-bottom: 4px; font-weight: 600;">${this.x}</div>`;
                        const rows = this.points
                            .map((point) => {
                                const value = point.series.type === "spline" ? `${point.y}%` : formatValue(point.y);
                                return `<div style="display: flex; align-items: center; gap: 6px;"><span style="color: ${point.color};">●</span><span>${point.series.name}:</span><b>${value}</b></div>`;
                            })
                            .join("");
                        return header + rows;
                    },
                },
                legend: {align: "right", verticalAlign: "bottom"},
                series: this.chartData.series,
                colors: COLORS,
            });
        });
    }
}
customElements.define("showcase-ctr-time-chart", ShowcaseCtrTimeChart);

/* ================================================================== *
 *  Drill-down section  — audience breakdown (interests / income /
 *  gender / region / age). Replaces the users-by-device chart.
 * ================================================================== */

// Mock audience breakdown. Bar metrics carry ka/en labels; the donuts carry
// their own segment colors. `value`/`y` are the "views" figures — the header
// toggle scales the bar figures to "clicks".
const DRILLDOWN = {
    interests: [
        {ka: "PLUS/MR ქულების აქტიური მომხმარებელი", en: "Active PLUS/MR points user", value: 383},
        {ka: "შეთავაზებებით მოსარგებელი", en: "Offer user", value: 948},
        {ka: "გურმანი", en: "Gourmet", value: 1654},
        {ka: "ავტომობილის მფლობელი", en: "Car owner", value: 1493},
        {ka: "შოპინგის მოყვარული", en: "Shopping enthusiast", value: 878},
        {ka: "კულტურის მოყვარული", en: "Culture enthusiast", value: 1204},
        {ka: "სპორტის გულშემატკივარი", en: "Sports fan", value: 1222},
        {ka: "ვიდეო თამაშების მოყვარული", en: "Video game enthusiast", value: 407},
        {ka: "ცხოველების მოყვარული", en: "Animal lover", value: 1359},
        {ka: "ჯანსაღი ცხოვრების მიმდევარი", en: "Healthy lifestyle follower", value: 806},
        {ka: "მოგზაური", en: "Traveler", value: 1504},
        {ka: "ფოტოგრაფი", en: "Photographer", value: 718},
        {ka: "გართობის მოყვარული", en: "Entertainment enthusiast", value: 1237},
        {ka: "განათლებაზე ორიენტირებული", en: "Education-oriented", value: 552},
        {ka: "მეოჯახე", en: "Family person", value: 1084},
        {ka: "არ აქვს გამოკვეთილი ინტერესი", en: "No distinct interest", value: 1564},
    ],
    region: [
        {ka: "თბილისი", en: "Tbilisi", value: 908},
        {ka: "აფხაზეთი", en: "Abkhazia", value: 1024},
        {ka: "სამეგრელო-ზემო სვანეთი", en: "Samegrelo-Zemo Svaneti", value: 1667},
        {ka: "გურია", en: "Guria", value: 590},
        {ka: "იმერეთი", en: "Imereti", value: 1477},
        {ka: "აჭარა", en: "Adjara", value: 1807},
        {ka: "სამცხე-ჯავახეთი", en: "Samtskhe-Javakheti", value: 1427},
        {ka: "შიდა ქართლი", en: "Shida Kartli", value: 1885},
        {ka: "ქვემო ქართლი", en: "Kvemo Kartli", value: 1703},
        {ka: "მცხეთა-მთიანეთი", en: "Mtskheta-Mtianeti", value: 999},
        {ka: "კახეთი", en: "Kakheti", value: 1503},
        {ka: "რაჭა-ლეჩხუმი", en: "Racha-Lechkhumi", value: 450},
        {ka: "NA", en: "NA", value: 1573},
    ],
    age: [
        {ka: "6-18", en: "6-18", value: 3108},
        {ka: "18-25", en: "18-25", value: 3282},
        {ka: "25-35", en: "25-35", value: 1795},
        {ka: "35-45", en: "35-45", value: 1388},
        {ka: "45-55", en: "45-55", value: 1420},
        {ka: "55+", en: "55+", value: 3719},
        {ka: "NA", en: "NA", value: 2301},
    ],
    // `y` is the slice proportion; `amount` is the static count shown on hover.
    income: [
        {label: "0-1000", y: 18, amount: 3060, color: "#06a74c"},
        {label: "1000-3000", y: 16, amount: 2720, color: "#7938ea"},
        {label: "3000-5000", y: 30, amount: 5100, color: "#ffbd23"},
        {label: "5000+", y: 14, amount: 2380, color: "#ff600a"},
        {label: "NA", y: 22, amount: 3740, color: "#3fa9f5"},
    ],
    gender: [
        {ka: "მამაკაცი", en: "Male", y: 68, amount: 11560, color: "#f5c84c"},
        {ka: "ქალი", en: "Female", y: 32, amount: 5440, color: "#06a74c"},
    ],
};

/* ---- Donut used inside the drill-down cards ---- */

class ShowcaseDrilldownDonut extends LitElement {
    static properties = {data: {type: Array}};

    static styles = [
        sharedChartStyles,
        css`
            .donut-card {
                display: flex;
                align-items: center;
                gap: var(--space-24);
                justify-content: flex-start;
            }
            #donut {
                width: 150px;
                height: 150px;
                flex: none;
            }
            .legend {
                padding: 0;
                gap: var(--space-8);
            }
            .legend-text {
                color: var(--text-secondary);
            }
        `,
    ];

    constructor() {
        super();
        this.data = [];
        this._sig = "";
    }

    updated(changed) {
        if (changed.has("data")) {
            const sig = JSON.stringify(this.data);
            if (sig !== this._sig) {
                this._sig = sig;
                this._initChart();
            }
        }
    }

    render() {
        return html`<div class="donut-card">
            <div id="donut"></div>
            <div class="legend">
                ${this.data.map(
                    (d) =>
                        html`<div class="legend-item">
                            <span class="legend-point" style="background-color: ${d.color};"></span>
                            <bd-font class="legend-text" type="small-text">${d.name}</bd-font>
                        </div>`,
                )}
            </div>
        </div>`;
    }

    _initChart() {
        if (!this.data.length) return;
        Highcharts.setOptions(light);
        requestAnimationFrame(() => {
            const container = this.shadowRoot.getElementById("donut");
            if (!container) return;
            if (this.chart && Object.keys(this.chart).length) this.chart.destroy();
            this.chart = Highcharts.chart(container, {
                chart: {type: "pie", backgroundColor: "rgba(255, 255, 255, 0)", spacing: [0, 0, 0, 0]},
                title: {text: null},
                subtitle: {text: null},
                credits: {enabled: false},
                tooltip: {
                    useHTML: true,
                    pointFormat: "<b>{point.amount}</b>",
                    backgroundColor: "#000000C7",
                    borderRadius: 4,
                    style: {color: "#fff"},
                },
                legend: {enabled: false},
                plotOptions: {
                    series: {
                        borderRadius: 8,
                        borderWidth: 5,
                        borderColor: getCssVariableColor("--layer-01"),
                        dataLabels: {enabled: false},
                    },
                },
                series: [{colorByPoint: true, innerSize: "68%", size: "100%", data: this.data}],
                colors: COLORS,
            });
        });
    }
}
customElements.define("showcase-drilldown-donut", ShowcaseDrilldownDonut);

/* ---- Drill-down section: header + toggle + breakdown grid ---- */

class ShowcaseDrilldownSection extends LitElement {
    static properties = {
        lang: {type: String},
        emptyState: {type: Boolean},
        metric: {type: String},
    };

    static styles = css`
        :host {
            display: block;
        }
        .dd-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: var(--space-16);
            padding-bottom: var(--space-24);
            flex-wrap: wrap;
        }
        .dd-titles {
            display: flex;
            flex-direction: column;
            gap: var(--space-4);
        }
        .dd-sub {
            color: var(--text-secondary);
        }
        .dd-toggle {
            display: flex;
            gap: var(--space-4);
            padding: var(--space-4);
            background-color: var(--layer-02);
            border-radius: var(--border-radius-12);
            flex: none;
        }
        .dd-seg {
            border: none;
            background: transparent;
            cursor: pointer;
            font-family: "BOG";
            font-size: 13px;
            font-weight: 600;
            color: var(--text-secondary);
            padding: var(--space-8) var(--space-16);
            border-radius: var(--border-radius-8);
            transition: background-color 0.15s ease, color 0.15s ease;
        }
        .dd-seg.active {
            background-color: var(--layer-01);
            color: var(--text-primary);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
        }
        .dd-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: var(--space-24);
            align-items: start;
        }
        .dd-col {
            display: flex;
            flex-direction: column;
            gap: var(--space-24);
        }
        .metric-card {
            border: 1px solid var(--border-03);
            border-radius: var(--border-radius-12);
            background-color: var(--layer-01);
            padding: var(--space-16) var(--space-24) var(--space-24);
            box-sizing: border-box;
        }
        .metric-title {
            display: block;
            color: var(--text-primary);
            margin-bottom: var(--space-24);
        }
        .bars {
            display: flex;
            flex-direction: column;
            gap: var(--space-16);
        }
        .bar-row {
            display: grid;
            grid-template-columns: 92px 1fr auto;
            align-items: center;
            gap: var(--space-12);
        }
        .bar-label {
            color: var(--text-secondary);
            line-height: 1.3;
        }
        .bar-track {
            height: 8px;
            border-radius: 999px;
            background-color: rgba(0, 0, 0, 0.06);
            overflow: hidden;
        }
        .bar-fill {
            display: block;
            height: 100%;
            min-width: 6px;
            border-radius: 999px;
            background-color: #f5c84c;
        }
        .bar-value {
            color: var(--text-primary);
            font-weight: 600;
            text-align: right;
        }
        @media (max-width: ${MEDIA_CHECKPOINTS.medium}px) {
            .dd-grid {
                grid-template-columns: 1fr 1fr;
            }
        }
        @media (max-width: ${MEDIA_CHECKPOINTS.xSmall}px) {
            .dd-grid {
                grid-template-columns: 1fr;
            }
        }
    `;

    constructor() {
        super();
        this.lang = "ka";
        this.emptyState = false;
        this.metric = "views";
    }

    get t() {
        return makeT(this.lang);
    }

    render() {
        const t = this.t;
        return html`
            <div class="dd-header">
                <div class="dd-titles">
                    <bd-font type="overline1">${t("drilldownTitle")}</bd-font>
                    <bd-font class="dd-sub" type="small-text">${t("drilldownSubtitle")}</bd-font>
                </div>
                <div class="dd-toggle">
                    <button
                        class="dd-seg ${this.metric === "views" ? "active" : ""}"
                        @click="${() => (this.metric = "views")}"
                    >
                        ${t("ddMetricViews")}
                    </button>
                    <button
                        class="dd-seg ${this.metric === "clicks" ? "active" : ""}"
                        @click="${() => (this.metric = "clicks")}"
                    >
                        ${t("ddMetricClicks")}
                    </button>
                </div>
            </div>
            ${this.emptyState
                ? html`<showcase-empty .messageType=${VIEWS.EMPTY} .t=${t}></showcase-empty>`
                : html`<div class="dd-grid">
                      <div class="dd-col">${this._barCard(t("ddInterests"), DRILLDOWN.interests)}</div>
                      <div class="dd-col">
                          ${this._donutCard(t("ddIncome"), this._incomeData())}
                          ${this._donutCard(t("ddGender"), this._genderData())}
                      </div>
                      <div class="dd-col">
                          ${this._barCard(t("ddRegion"), DRILLDOWN.region)}
                          ${this._barCard(t("ddAge"), DRILLDOWN.age)}
                      </div>
                  </div>`}
        `;
    }

    _metricValue(base, i) {
        if (this.metric !== "clicks") return base;
        const ratio = 0.13 + (i % 5) * 0.02;
        return Math.max(1, Math.round(base * ratio));
    }

    _barCard(title, items) {
        const values = items.map((it, i) => this._metricValue(it.value, i));
        const max = Math.max(...values, 1);
        return html`<div class="metric-card">
            <bd-font class="metric-title" type="overline1">${title}</bd-font>
            <div class="bars">
                ${items.map((it, i) => {
                    const value = values[i];
                    const pct = Math.max(4, Math.round((value / max) * 100));
                    return html`<div class="bar-row">
                        <bd-font class="bar-label" type="small-text">${this.lang === "ka" ? it.ka : it.en}</bd-font>
                        <div class="bar-track"><span class="bar-fill" style="width: ${pct}%;"></span></div>
                        <bd-font class="bar-value" type="button-text">${value}</bd-font>
                    </div>`;
                })}
            </div>
        </div>`;
    }

    _donutCard(title, data) {
        return html`<div class="metric-card">
            <bd-font class="metric-title" type="overline1">${title}</bd-font>
            <showcase-drilldown-donut .data=${data}></showcase-drilldown-donut>
        </div>`;
    }

    _incomeData() {
        return DRILLDOWN.income.map((d) => ({name: d.label, y: d.y, amount: d.amount, color: d.color}));
    }

    _genderData() {
        return DRILLDOWN.gender.map((d) => ({
            name: this.lang === "ka" ? d.ka : d.en,
            y: d.y,
            amount: d.amount,
            color: d.color,
        }));
    }
}
customElements.define("showcase-drilldown-section", ShowcaseDrilldownSection);

/* ================================================================== *
 *  <showcase-realization-chart>  — port of campaign-details-realization-chart
 * ================================================================== */

const REALIZATION_MAP = {
    "1": {key: "chOther", color: "#ffca28"},
    "2": {key: "chSms", color: "#9c92ff"},
    "13": {key: "chOnline", color: "#38b970"},
};

class ShowcaseRealizationChart extends LitElement {
    static properties = {
        lang: {type: String},
        emptyState: {type: Boolean},
        periodId: {type: Number},
        loading: {type: Boolean, reflect: true},
        view: {type: String},
        chartData: {type: Array},
        sum: {type: Number},
    };

    static styles = [
        sharedChartStyles,
        css`
            .chart-card {
                display: flex;
                align-items: center;
                gap: var(--space-32);
                justify-content: center;
            }
            #realization {
                width: 280px;
                height: 280px;
            }
            .legend-text {
                color: var(--text-secondary);
            }
            .custom-label {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: var(--space-4);
            }
            .custom-text {
                color: var(--text-secondary);
                font-family: "BOG";
                font-size: 12px;
            }
            .custom-sum {
                color: var(--text-primary);
                font-family: "BOG";
                font-weight: 600;
                font-size: 16px;
            }
        `,
    ];

    constructor() {
        super();
        this.lang = "ka";
        this.emptyState = false;
        this.periodId = -1;
        this.loading = true;
        this.view = "";
        this.chartData = [];
        this.sum = 0;
    }

    get t() {
        return makeT(this.lang);
    }

    updated(changed) {
        if (["emptyState", "lang", "periodId"].some((k) => changed.has(k))) this._fetch();
    }

    render() {
        if (this.view === VIEWS.ERROR || this.view === VIEWS.EMPTY) {
            return html`<showcase-empty .messageType=${this.view} .t=${this.t}></showcase-empty>`;
        }
        return html`
            ${this.loading
                ? html`<div id="realization"></div>`
                : html`<div class="chart-card">
                      <div id="realization"></div>
                      <div class="legend">
                          ${this.chartData.map(
                              (d) =>
                                  html`<div class="legend-item">
                                      <span class="legend-point" style="background-color: ${d.color};"></span>
                                      <bd-font class="legend-text" type="small-text">${d.name}</bd-font>
                                  </div>`,
                          )}
                      </div>
                  </div>`}
        `;
    }

    async _fetch() {
        this.loading = true;
        try {
            const data = await mockApi.execute({
                url: "ads-manager/offer/realization",
                params: {empty: this.emptyState, periodId: this.periodId},
            });
            if (this.chart && Object.keys(this.chart).length) this.chart.destroy();
            const result = data.json?.result || [];
            this.sum = result.reduce((acc, item) => acc + item.amount, 0);
            if (!this.sum) {
                this.view = VIEWS.EMPTY;
                return;
            }
            this.chartData = result.map((item) => ({
                name: this.t(REALIZATION_MAP[item.channelId]?.key || "chOther"),
                y: item.amount,
                color: REALIZATION_MAP[item.channelId]?.color || COLORS[0],
            }));
            this.view = VIEWS.SUCCESS;
            this._initChart();
        } catch (e) {
            console.error(e);
            this.view = VIEWS.ERROR;
        }
    }

    _initChart() {
        this.loading = false;
        Highcharts.setOptions(light);
        Highcharts.Legend.prototype.setItemEvents = function () {};
        const sum = this.sum;
        const title = this.t("realizationTitle");
        requestAnimationFrame(() => {
            const container = this.shadowRoot.getElementById("realization");
            if (!container) return;
            this.chart = Highcharts.chart(container, {
                chart: {
                    type: "pie",
                    backgroundColor: "rgba(255, 255, 255, 0)",
                    custom: {},
                    events: {
                        render() {
                            const chart = this;
                            let label = chart.options.chart.custom.label;
                            if (!label) {
                                label = chart.options.chart.custom.label = chart.renderer
                                    .label(
                                        `<div class="custom-label"><span class="custom-text">${title}</span><span class="custom-sum">${sum}</span></div>`,
                                        0,
                                        0,
                                        "rect",
                                        null,
                                        null,
                                        true,
                                    )
                                    .add();
                            }
                            label.attr({
                                x: (chart.plotWidth - label.width) / 2,
                                y: (chart.plotHeight - label.height) / 2,
                            });
                        },
                    },
                },
                title: {text: null},
                subtitle: {text: null},
                tooltip: {
                    useHTML: true,
                    pointFormat: "<b>{point.y}</b>",
                    backgroundColor: "#000000C7",
                    borderRadius: 4,
                    style: {color: "#fff"},
                },
                legend: {enabled: false},
                plotOptions: {
                    series: {borderRadius: 10, borderWidth: 5, borderColor: "#fcfcfc", dataLabels: {enabled: false}},
                },
                series: [{colorByPoint: true, innerSize: "65%", size: "100%", data: this.chartData}],
                credits: {enabled: false},
                colors: COLORS,
            });
        });
    }
}
customElements.define("showcase-realization-chart", ShowcaseRealizationChart);

/* ================================================================== *
 *  <showcase-offer-usage-chart>  — port of campaign-details-offer-usage-chart
 * ================================================================== */

const USAGE_MAP = {
    views: {key: "usageViews", color: "#38b970"},
    clicks: {key: "usageClicks", color: "#9c92ff"},
    purchases: {key: "usagePurchases", color: "#ffca28"},
};

class ShowcaseOfferUsageChart extends LitElement {
    static properties = {
        lang: {type: String},
        emptyState: {type: Boolean},
        periodId: {type: Number},
        loading: {type: Boolean, reflect: true},
        view: {type: String},
        chartData: {type: Array},
    };

    static styles = [
        sharedChartStyles,
        css`
            #usage {
                width: 100%;
                height: 280px;
            }
        `,
    ];

    constructor() {
        super();
        this.lang = "ka";
        this.emptyState = false;
        this.periodId = -1;
        this.loading = true;
        this.view = "";
        this.chartData = [];
    }

    get t() {
        return makeT(this.lang);
    }

    updated(changed) {
        if (["emptyState", "lang", "periodId"].some((k) => changed.has(k))) this._fetch();
    }

    render() {
        if (this.view === VIEWS.ERROR || this.view === VIEWS.EMPTY) {
            return html`<showcase-empty .messageType=${this.view} .t=${this.t}></showcase-empty>`;
        }
        return html`<div id="usage"></div>`;
    }

    async _fetch() {
        this.loading = true;
        try {
            const res = await mockApi.execute({
                url: "ads-manager/impressions/engagement/chart",
                params: {empty: this.emptyState, periodId: this.periodId},
            });
            if (this.chart && Object.keys(this.chart).length) this.chart.destroy();
            const result = res.json?.result || {};
            if (Object.values(result).every((v) => !v)) {
                this.view = VIEWS.EMPTY;
                return;
            }
            this.chartData = Object.entries(result)
                .filter(([key]) => USAGE_MAP[key])
                .map(([key, value]) => ({
                    name: this.t(USAGE_MAP[key].key),
                    color: USAGE_MAP[key].color,
                    data: [value],
                }));
            this.view = VIEWS.SUCCESS;
            this._initChart();
        } catch (e) {
            console.error(e);
            this.view = VIEWS.ERROR;
        }
    }

    _initChart() {
        this.loading = false;
        Highcharts.setOptions(light);
        Highcharts.Legend.prototype.setItemEvents = function () {};
        requestAnimationFrame(() => {
            const container = this.shadowRoot.getElementById("usage");
            if (!container) return;
            this.chart = Highcharts.chart(container, {
                chart: {type: "column", backgroundColor: "rgba(255, 255, 255, 0)"},
                title: {text: null},
                subtitle: {text: null},
                xAxis: {type: "category", labels: {enabled: false}},
                yAxis: {min: 0, title: {text: null}},
                tooltip: {
                    useHTML: true,
                    headerFormat: "",
                    pointFormat: "<b>{point.y}</b>",
                    backgroundColor: "#000000C7",
                    borderRadius: 4,
                    style: {color: "#fff"},
                },
                plotOptions: {
                    column: {maxPointWidth: 80, groupPadding: 0.02, dataLabels: {enabled: false}},
                    series: {states: {hover: {enabled: false}}},
                },
                legend: {align: "right", verticalAlign: "bottom", symbolHeight: 8, symbolWidth: 8},
                series: this.chartData,
                credits: {enabled: false},
                colors: COLORS,
            });
        });
    }
}
customElements.define("showcase-offer-usage-chart", ShowcaseOfferUsageChart);

/* ================================================================== *
 *  <showcase-transactions-section>  — port of campaign-details-transactions-section
 * ================================================================== */

class ShowcaseTransactionsSection extends LitElement {
    static properties = {
        lang: {type: String},
        emptyState: {type: Boolean},
        periodId: {type: Number},
        channel: {type: String},
        rrn: {type: String},
        startDate: {attribute: false},
        endDate: {attribute: false},
        filters: {type: Object},
        page: {type: Number},
        txData: {type: Object},
        loading: {type: Boolean},
    };

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            gap: var(--space-32);
        }
        .charts-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: var(--space-4);
            padding: var(--space-12) 0;
            border-bottom: 1px solid var(--color-invert-component-tr-70);
            margin-bottom: var(--space-24);
        }
        .period-filter {
            max-width: 200px;
        }
        .charts-content {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            grid-gap: var(--space-24);
        }
        .chart {
            grid-column: span 6;
        }
        .transactions {
            background-color: var(--color-invert-background-solid-10);
            border-radius: var(--border-radius-32);
            display: flex;
            flex-direction: column;
        }
        .tx-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--space-12) var(--space-24);
            border-bottom: 1px solid var(--border-03);
        }
        .tx-filter {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: var(--space-12);
            align-items: end;
            padding: var(--space-16) var(--space-24);
            border-bottom: 1px solid var(--color-invert-component-tr-70);
        }
        .flt-actions {
            display: flex;
            align-items: center;
            gap: var(--space-8);
            justify-content: flex-end;
        }
        .tx-table {
            width: 100%;
            --cell-min-height: var(--space-48);
            --table-template-columns: repeat(6, 1fr);
            --shadow-raised: none;
        }
        .row {
            --cell-bg-color: transparent;
        }
        .amount {
            justify-content: flex-end;
        }
        .tx-pagination {
            display: flex;
            justify-content: flex-end;
            padding: var(--space-12) var(--space-24);
        }
        .tx-empty {
            padding: var(--space-32);
            text-align: center;
            color: var(--text-secondary);
        }
        @media (max-width: ${MEDIA_CHECKPOINTS.large}px) {
            .chart {
                grid-column: span 12;
            }
            .tx-table {
                --table-template-columns: repeat(4, 1fr);
            }
        }
        @media (max-width: ${MEDIA_CHECKPOINTS.mSmall}px) {
            .tx-filter {
                grid-template-columns: 1fr 1fr;
            }
            .flt-actions {
                grid-column: 1 / -1;
            }
        }
    `;

    constructor() {
        super();
        this.lang = "ka";
        this.emptyState = false;
        this.periodId = -1;
        this.channel = "";
        this.rrn = "";
        this.startDate = null;
        this.endDate = null;
        this.filters = {};
        this.page = 1;
        this.pageSize = 10;
        this.txData = {};
        this.loading = true;
    }

    get t() {
        return makeT(this.lang);
    }

    get _hasFilters() {
        return Object.values(this.filters).some((v) => v);
    }

    updated(changed) {
        if (["emptyState", "lang", "page", "filters"].some((k) => changed.has(k))) this._fetchTx();
    }

    async _fetchTx() {
        this.loading = true;
        try {
            const data = await mockApi.execute({
                url: "ads-manager/offer/transactions",
                params: {empty: this.emptyState, page: this.page, size: this.pageSize, ...this.filters},
            });
            this.txData = data.json?.result || {};
        } finally {
            this.loading = false;
        }
    }

    _applyFilters() {
        this.filters = {
            channel: this.channel || undefined,
            rrn: this.rrn || undefined,
            startDate: this.startDate ? dayjs(this.startDate).format("YYYY-MM-DD") : undefined,
            endDate: this.endDate ? dayjs(this.endDate).format("YYYY-MM-DD") : undefined,
        };
        this.page = 1;
    }

    _clearFilters() {
        this.channel = "";
        this.rrn = "";
        this.startDate = null;
        this.endDate = null;
        this.filters = {};
        this.page = 1;
        const dp = this.shadowRoot.querySelector(".flt-period");
        if (dp) {
            dp.fromDate = null;
            dp.toDate = null;
        }
        const rrnEl = this.shadowRoot.querySelector(".flt-rrn");
        if (rrnEl) rrnEl.value = "";
        const channelEl = this.shadowRoot.querySelector(".flt-channel");
        if (channelEl) channelEl.value = "";
    }

    render() {
        const t = this.t;
        return html`
            <section class="charts">
                <div class="charts-header">
                    <bd-font type="overline1">${t("txAnalyticsTitle")}</bd-font>
                    <bd-select
                        class="period-filter"
                        mode="inline"
                        .value="${String(this.periodId)}"
                        @value-change="${(e) => (this.periodId = Number(e.detail.value))}"
                    >
                        <bd-select-item slot="item" label="${t("periodAll")}" value="-1"></bd-select-item>
                        <bd-select-item slot="item" label="${t("periodDay")}" value="1"></bd-select-item>
                        <bd-select-item slot="item" label="${t("periodWeek")}" value="7"></bd-select-item>
                        <bd-select-item slot="item" label="${t("periodMonth")}" value="30"></bd-select-item>
                    </bd-select>
                </div>
                <div class="charts-content">
                    <showcase-chart-wrapper
                        class="chart"
                        show-header
                        header-title="${t("realizationTitle")}"
                        header-content="${t("realizationDesc")}"
                    >
                        <showcase-realization-chart
                            slot="chart"
                            .lang="${this.lang}"
                            .emptyState="${this.emptyState}"
                            .periodId="${this.periodId}"
                        ></showcase-realization-chart>
                    </showcase-chart-wrapper>
                    <showcase-chart-wrapper
                        class="chart"
                        show-header
                        header-title="${t("usageTitle")}"
                        header-content="${t("usageDesc")}"
                    >
                        <showcase-offer-usage-chart
                            slot="chart"
                            .lang="${this.lang}"
                            .emptyState="${this.emptyState}"
                            .periodId="${this.periodId}"
                        ></showcase-offer-usage-chart>
                    </showcase-chart-wrapper>
                </div>
            </section>

            <section class="transactions">
                <div class="tx-header">
                    <bd-font type="overline1">${t("txListTitle")}</bd-font>
                    <bd-standard-button
                        size="small"
                        type="text-primary"
                        prefix-icon="bd:download"
                        ?disabled="${!this._rows.length}"
                        >${t("txDownload")}</bd-standard-button
                    >
                </div>
                <div class="tx-filter">
                    <bd-select
                        class="flt-field flt-channel"
                        label="${t("fltChannel")}"
                        @value-change="${({detail}) => (this.channel = detail.value)}"
                    >
                        <bd-select-item slot="item" label="${t("chPos")}" value="pos"></bd-select-item>
                        <bd-select-item slot="item" label="${t("chOnline")}" value="online"></bd-select-item>
                        <bd-select-item slot="item" label="${t("chOther")}" value="other"></bd-select-item>
                    </bd-select>
                    <bd-datepicker
                        class="flt-field flt-period"
                        type="range"
                        left
                        format="numbers"
                        label="${t("fltPeriod")}"
                        @from-date-changed="${({detail}) => (this.startDate = detail.value)}"
                        @to-date-changed="${({detail}) => (this.endDate = detail.value)}"
                    ></bd-datepicker>
                    <bd-text-field
                        class="flt-field flt-rrn"
                        label="RRN"
                        @value-changed="${({detail}) => (this.rrn = detail.value)}"
                    ></bd-text-field>
                    <div class="flt-actions">
                        ${this._hasFilters
                            ? html`<bd-standard-button type="text-low" size="small" @click="${this._clearFilters}"
                                  >${t("fltClear")}</bd-standard-button
                              >`
                            : nothing}
                        <bd-standard-button size="small" type="primary" @click="${this._applyFilters}"
                            >${t("fltApply")}</bd-standard-button
                        >
                    </div>
                </div>

                <bd-table mode="basic" class="tx-table">
                    <bd-table-row class="row" header>
                        <bd-table-cell><bd-font type="overline2">${t("colRrn")}</bd-font></bd-table-cell>
                        <bd-table-cell><bd-font type="overline2">${t("colAuthDate")}</bd-font></bd-table-cell>
                        <bd-table-cell><bd-font type="overline2">${t("colMethod")}</bd-font></bd-table-cell>
                        <bd-table-cell><bd-font type="overline2">${t("colCard")}</bd-font></bd-table-cell>
                        <bd-table-cell class="amount"><bd-font type="overline2">${t("colFee")}</bd-font></bd-table-cell>
                        <bd-table-cell class="amount"
                            ><bd-font type="overline2">${t("colAmount")}</bd-font></bd-table-cell
                        >
                    </bd-table-row>
                    ${this._rows.map(
                        (r) =>
                            html`<bd-table-row class="row">
                                <bd-table-cell><bd-font type="button-text">${r.rrn}</bd-font></bd-table-cell>
                                <bd-table-cell
                                    ><bd-font type="button-text"
                                        >${formatDate(r.authDate, "D MMM, YYYY", this.lang)}</bd-font
                                    ></bd-table-cell
                                >
                                <bd-table-cell
                                    ><bd-font type="button-text"
                                        >${t(r.channel === "online" ? "chOnline" : "chPos")}</bd-font
                                    ></bd-table-cell
                                >
                                <bd-table-cell><bd-font type="button-text">${r.cardGroup}</bd-font></bd-table-cell>
                                <bd-table-cell class="amount"
                                    ><bd-font type="number">${r.fee} ₾</bd-font></bd-table-cell
                                >
                                <bd-table-cell class="amount"
                                    ><bd-font type="number">${r.amount} ₾</bd-font></bd-table-cell
                                >
                            </bd-table-row>`,
                    )}
                </bd-table>
                ${this.txData.noData || (!this.loading && !this._rows.length)
                    ? html`<div class="tx-empty"><bd-font type="body2">${t("emptyDesc")}</bd-font></div>`
                    : nothing}
                ${this.txData.totalElements > this.pageSize
                    ? html`<bd-pagination
                          class="tx-pagination"
                          hide-page-input
                          total-count=${this.txData.totalElements}
                          page-size=${this.pageSize}
                          page=${this.page}
                          neighbours="1"
                          @page-change=${this._changePage}
                      ></bd-pagination>`
                    : nothing}
            </section>
        `;
    }

    get _rows() {
        return this.txData.transactionDetails || [];
    }

    _changePage(e) {
        this.page = e.detail.page;
    }
}
customElements.define("showcase-transactions-section", ShowcaseTransactionsSection);

/* ================================================================== *
 *  <showcase-offer-details-section>  — port of campaign-details-offer-details-section
 * ================================================================== */

class ShowcaseOfferDetailsSection extends LitElement {
    static properties = {lang: {type: String}};

    static styles = css`
        :host {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: var(--space-24);
            width: 100%;
        }
        .col {
            grid-column: span 6;
            display: flex;
            flex-direction: column;
            gap: var(--space-32);
        }
        .section-header {
            display: flex;
            flex-direction: column;
            gap: var(--space-4);
            margin-bottom: var(--space-8);
        }
        .section-title {
            color: var(--text-primary);
        }
        .section-sub {
            color: var(--text-secondary);
        }
        .rows {
            display: flex;
            flex-direction: column;
        }
        .row {
            display: flex;
            flex-direction: column;
            gap: var(--space-4);
            padding: var(--space-12) 0;
            border-bottom: 1px solid var(--color-invert-component-tr-70);
        }
        .row:last-child {
            border-bottom: none;
        }
        .row-inline {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
        }
        .row-label {
            color: var(--text-secondary);
        }
        .value-link {
            display: flex;
            align-items: baseline;
            gap: var(--space-8);
            flex-wrap: wrap;
        }
        .period-box {
            align-self: flex-start;
            background-color: var(--layer-02);
            border-radius: var(--border-radius-12);
            padding: var(--space-12) var(--space-16);
        }
        .visual-image {
            width: 100%;
            max-width: 320px;
            height: 200px;
            border-radius: var(--border-radius-16);
            background: linear-gradient(135deg, #ff7a3d 0%, #f72585 100%);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .visual-image bd-font {
            color: #fff;
        }
        .audience-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--space-16);
        }
        .stat-box {
            border: 1px solid var(--color-invert-component-tr-70);
            border-radius: var(--border-radius-16);
            padding: var(--space-16);
            display: flex;
            flex-direction: column;
            gap: var(--space-8);
        }
        .stat-label {
            display: flex;
            align-items: center;
            gap: var(--space-4);
            color: var(--text-secondary);
        }
        .desc-block {
            display: flex;
            flex-direction: column;
            gap: var(--space-4);
            margin-top: var(--space-8);
        }
        @media (max-width: ${MEDIA_CHECKPOINTS.large}px) {
            :host {
                display: block;
            }
            .col {
                margin-bottom: var(--space-24);
            }
            .col:last-child {
                margin-bottom: 0;
            }
        }
        @media (max-width: ${MEDIA_CHECKPOINTS.mSmall}px) {
            .audience-stats {
                grid-template-columns: 1fr;
            }
        }
    `;

    constructor() {
        super();
        this.lang = "ka";
    }

    get t() {
        return makeT(this.lang);
    }

    render() {
        const t = this.t;
        return html`
            <div class="col">
                <section>
                    <div class="section-header">
                        <bd-font class="section-title" type="overline1">${t("odSummaryTitle")}</bd-font>
                        <bd-font class="section-sub" type="small-text">${t("odSummarySub")}</bd-font>
                    </div>
                    <div class="rows">
                        <div class="row row-inline">
                            <bd-font class="row-label" type="small-text">${t("odPackage")}</bd-font>
                            <bd-system-badge
                                type="success"
                                text="${t("odPackageValue")}"
                                small
                                ?hidePrefixIcon="${true}"
                            ></bd-system-badge>
                        </div>
                        ${this._row(t("odOffer"), "SOLO")} ${this._row(t("odCondition"), t("offerText"))}
                        <div class="row">
                            <bd-font class="row-label" type="small-text">${t("infoAddresses")}</bd-font>
                            <div class="value-link">
                                <bd-font type="button-text">${t("odAddressesFull")}</bd-font>
                                <bd-standard-button type="text-low" size="small">${t("odViewAll")}</bd-standard-button>
                            </div>
                        </div>
                        ${this._row(t("odFeePerPayment"), "50.00 %")} ${this._row(t("odFeeVat"), "9.00 %")}
                        ${this._row(t("odFeeTotal"), "59.00 %")}
                        <div class="row">
                            <bd-font class="row-label" type="small-text">${t("odConditions")}</bd-font>
                            <bd-standard-button type="text-primary" size="small" prefix-icon="bd:download"
                                >${t("odConditionsLink")}</bd-standard-button
                            >
                        </div>
                        <div class="row">
                            <bd-font class="row-label" type="small-text">${t("infoPeriod")}</bd-font>
                            <div class="period-box"><bd-font type="button-text">${t("odPeriodValue")}</bd-font></div>
                        </div>
                    </div>
                </section>

                <section>
                    <div class="section-header">
                        <bd-font class="section-title" type="overline1">${t("odVisualTitle")}</bd-font>
                        <bd-font class="section-sub" type="small-text">${t("odVisualSub")}</bd-font>
                    </div>
                    <div class="visual-image"><bd-font type="h2">50%</bd-font></div>
                </section>
            </div>

            <div class="col">
                <section>
                    <div class="section-header">
                        <bd-font class="section-title" type="overline1">${t("odAudienceTitle")}</bd-font>
                        <bd-font class="section-sub" type="small-text">${t("odAudienceSub")}</bd-font>
                    </div>
                    <div class="audience-stats">
                        ${this._stat(t("odAudTotal"), t("odAudTotalTip"), "45,000")}
                        ${this._stat(t("odAudEstimate"), t("odAudEstimateTip"), "38,000")}
                    </div>
                </section>

                <section>
                    <div class="section-header">
                        <bd-font class="section-title" type="overline1">${t("odTextsTitle")}</bd-font>
                        <bd-font class="section-sub" type="small-text">${t("odTextsSub")}</bd-font>
                    </div>
                    <div class="rows">
                        ${this._row(t("odUrl"), t("odUrlValue"))} ${this._row(t("odContact"), "-")}
                        ${this._row(t("odMainMsg"), "-")}
                        <div class="row">
                            <bd-font class="row-label" type="small-text">${t("odShortDesc")}</bd-font>
                            <div class="desc-block">
                                <bd-font class="row-label" type="xsmall-text">${t("odInGeorgian")}</bd-font>
                                <bd-font type="body2">${t("odShortDescValue")}</bd-font>
                            </div>
                            <div class="desc-block">
                                <bd-font class="row-label" type="xsmall-text">${t("odInEnglish")}</bd-font>
                                <bd-font type="body2">-</bd-font>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        `;
    }

    _row(label, value) {
        return html`<div class="row">
            <bd-font class="row-label" type="small-text">${label}</bd-font>
            <bd-font type="button-text">${value}</bd-font>
        </div>`;
    }

    _stat(label, tip, value) {
        return html`<div class="stat-box">
            <div class="stat-label">
                <bd-font type="small-text">${label}</bd-font>
                <bd-tooltip>
                    <bd-icon icon="bg:info"></bd-icon>
                    <bd-font type="small-text" slot="text">${tip}</bd-font>
                </bd-tooltip>
            </div>
            <bd-font type="h4">${value}</bd-font>
        </div>`;
    }
}
customElements.define("showcase-offer-details-section", ShowcaseOfferDetailsSection);

/* ================================================================== *
 *  <showcase-analytics-section>  — port of campaign-section-analytics-new-view
 * ================================================================== */

class ShowcaseAnalyticsSection extends LitElement {
    static properties = {
        lang: {type: String},
        scenario: {type: String},
        emptyState: {type: Boolean},
        sumInfoData: {type: Object},
        campaignFilterData: {type: Object},
    };

    static styles = css`
        :host {
            display: block;
        }
        .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-12);
            padding: 0 0 var(--space-24);
            flex-wrap: wrap;
        }
        .card-header bd-datepicker {
            flex: none;
            width: 260px;
            max-width: 100%;
        }
        .info-cards {
            display: flex;
            align-items: center;
            justify-content: space-around;
            border-radius: var(--border-radius-32);
            border: 1px solid var(--border-03);
        }
        .numbers-card {
            flex: 1 0 0;
        }
        .card-divider {
            width: 1px;
            height: 48px;
            background-color: var(--color-invert-component-tr-70);
        }
        .card-divider:last-child {
            display: none;
        }
        .offer-analytics-charts-wrapper {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            grid-gap: var(--space-24);
            padding-top: var(--space-24);
        }
        .learning-chart-wrapper {
            --chart-padding: 0 0 var(--space-24) 0;
        }
        showcase-chart-wrapper {
            grid-column: span 6;
        }
        .drilldown-section {
            grid-column: 1 / -1;
        }
        @media (max-width: ${MEDIA_CHECKPOINTS.small}px) {
            .offer-analytics-charts-wrapper {
                display: flex;
                flex-direction: column;
                gap: var(--space-24);
            }
            .info-cards {
                flex-direction: column;
                align-items: stretch;
            }
            .card-header bd-datepicker {
                width: 100%;
            }
        }
    `;

    constructor() {
        super();
        this.lang = "ka";
        this.scenario = "ON_TRACK";
        this.emptyState = false;
        this.sumInfoData = {};
        this.campaignFilterData = {
            startDate: dayjs(OFFER.start, "YYYY/MM/DD").toDate(),
            endDate: dayjs(OFFER.end, "YYYY/MM/DD").toDate(),
        };
    }

    get t() {
        return makeT(this.lang);
    }

    firstUpdated() {
        this._loadSummary();
    }

    updated(changed) {
        if (changed.has("emptyState") || changed.has("lang")) this._loadSummary();
    }

    async _loadSummary() {
        const data = await mockApi.execute({url: "ads-manager/impressions/summary", params: {empty: this.emptyState}});
        this.sumInfoData = data.json?.result || {};
    }

    render() {
        const t = this.t;
        return html`
            <div class="card-header">
                <bd-font type="overline1">${t("analyticsTitle")}</bd-font>
                <bd-datepicker
                    type="range"
                    left
                    orientation="bottomLeft"
                    mode="inline"
                    format="numbers"
                    .fromDate="${this.campaignFilterData.startDate}"
                    .toDate="${this.campaignFilterData.endDate}"
                    .maxDate="${dayjs(OFFER.end, "YYYY/MM/DD").toDate()}"
                    .minDate="${dayjs(OFFER.start, "YYYY/MM/DD").subtract(1, "year").toDate()}"
                    @from-date-changed="${({detail}) => this._changeDate(detail.value, "startDate")}"
                    @to-date-changed="${({detail}) => this._changeDate(detail.value, "endDate")}"
                ></bd-datepicker>
            </div>
            ${this._sumInfoPart()}
            <div class="offer-analytics-charts-wrapper">
                <showcase-chart-wrapper
                    class="learning-chart-wrapper"
                    show-header
                    header-title="${t("learningTitle")}"
                    header-content="${t("learningSubtitle")}"
                    header-button="${t("detailsBtn")}"
                    header-button-hash="#/learning"
                >
                    <showcase-learning-chart
                        slot="chart"
                        .lang="${this.lang}"
                        .scenario="${this.scenario}"
                        .emptyState="${this.emptyState}"
                        .filterData="${this.campaignFilterData}"
                    ></showcase-learning-chart>
                </showcase-chart-wrapper>

                <showcase-chart-wrapper
                    show-header
                    header-title="${t("ctrTitle")}"
                    header-content="${t("ctrSubtitle")}"
                    header-button="${t("detailsBtn")}"
                    header-button-hash="#/ctr-time"
                >
                    <showcase-ctr-time-chart
                        slot="chart"
                        .lang="${this.lang}"
                        .emptyState="${this.emptyState}"
                        .filterData="${this.campaignFilterData}"
                    ></showcase-ctr-time-chart>
                </showcase-chart-wrapper>

                <showcase-drilldown-section
                    class="drilldown-section"
                    .lang="${this.lang}"
                    .emptyState="${this.emptyState}"
                ></showcase-drilldown-section>
            </div>
        `;
    }

    _sumInfoPart() {
        const t = this.t;
        const cards = [
            {key: "returnOnAdSpend", text: "roasText", tip: "roasTip", pct: false},
            {key: "conversionRate", text: "crText", tip: "crTip", pct: true},
            {key: "ctr", text: "ctrText", tip: "ctrTip", pct: true},
            {key: "uniqueCtr", text: "uctrText", tip: "uctrTip", pct: true},
            {key: "frequency", text: "freqText", tip: "freqTip", pct: false},
        ];
        return html`<div class="info-cards">
            ${cards.map((c) => {
                const value = this.sumInfoData?.[c.key];
                return html`
                    <bd-numbers-card
                        class="numbers-card"
                        type="ghost"
                        size="large"
                        tooltip-align="bottom"
                        text-only=""
                        text="${t(c.text)}"
                        tooltip-text="${t(c.tip)}"
                        tooltip-text-type="button-text"
                        with-tooltip
                    >
                        <bd-font type="number" slot="content"
                            ><span>${value == null ? "—" : c.pct ? `${value}%` : value}</span></bd-font
                        >
                    </bd-numbers-card>
                    <div class="card-divider"></div>
                `;
            })}
        </div>`;
    }

    _changeDate(date, key) {
        if (!date || date === "Invalid Date") return;
        const newDate = dayjs(date);
        if (newDate.isSame(dayjs(this.campaignFilterData[key]), "day")) return;
        this.campaignFilterData = {...this.campaignFilterData, [key]: newDate.toDate()};
    }
}
customElements.define("showcase-analytics-section", ShowcaseAnalyticsSection);

/* ================================================================== *
 *  <showcase-offer-details>  — offer header + info + tabs chrome
 * ================================================================== */

class ShowcaseOfferDetails extends LitElement {
    static properties = {
        lang: {type: String},
        scenario: {type: String},
        emptyState: {type: Boolean},
        selectedTab: {type: String},
    };

    static styles = css`
        :host {
            display: block;
        }
        .card {
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
            background-color: var(--layer-01);
            border: 1px solid var(--color-invert-component-tr-70);
            border-radius: var(--border-radius-32);
            padding: var(--space-32) var(--space-48) var(--space-48);
            margin-bottom: var(--space-24);
        }
        .tabs-card {
            padding: 0;
            overflow: clip;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: var(--space-24);
        }
        .header-text {
            display: flex;
            gap: var(--space-8);
            align-items: center;
        }
        .texts {
            display: flex;
            gap: var(--space-8);
            align-items: center;
        }
        .back-icon {
            cursor: pointer;
            --icon-color: var(--icon-secondary);
        }
        .status-badge {
            flex: none;
        }
        .header-actions {
            display: flex;
            align-items: center;
            gap: var(--space-12);
        }
        .chips {
            flex: none;
        }
        .offer-summary {
            display: flex;
            gap: var(--space-24);
            margin-top: var(--space-16);
        }
        .offer-image {
            width: 204px;
            height: 128px;
            flex: none;
            border-radius: var(--space-12);
            background: linear-gradient(135deg, #ff7a3d 0%, #f72585 100%);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .offer-image bd-font {
            color: #fff;
        }
        .offer-rows {
            display: flex;
            flex: 1;
            flex-direction: column;
            justify-content: center;
        }
        .offer-addresses {
            --horizontal-padding: var(--space-24);
            --vertical-padding: var(--space-16);
            border: 1px solid var(--color-invert-component-tr-70);
            border-radius: var(--space-12);
            box-sizing: border-box;
            margin-top: var(--space-24);
        }
        .addresses-title {
            display: flex;
            align-items: center;
            gap: var(--space-4);
            min-width: 0;
        }
        .offer-numbers {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: var(--space-12);
            margin-top: var(--space-16);
        }
        .numbers-card {
            min-width: 0;
        }
        .controller-items {
            display: flex;
            align-items: center;
        }
        .tabs {
            white-space: nowrap;
            width: 100%;
            --height: 56px;
        }
        .tab-panel {
            padding: var(--space-32) var(--space-48) var(--space-48);
            box-sizing: border-box;
        }
        .placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            color: var(--text-secondary);
            padding: var(--space-24);
        }
        @media (max-width: ${MEDIA_CHECKPOINTS.mSmall}px) {
            .card,
            .tab-panel {
                padding: var(--space-24) var(--space-16);
            }
            .header {
                flex-direction: column;
                align-items: flex-start;
                gap: var(--space-12);
            }
            .offer-summary {
                flex-direction: column;
            }
            .offer-image {
                width: 100%;
            }
            .offer-numbers {
                grid-template-columns: 1fr 1fr;
            }
        }
    `;

    constructor() {
        super();
        this.lang = "ka";
        this.scenario = "ON_TRACK";
        this.emptyState = false;
        this.selectedTab = "analytics";
    }

    get t() {
        return makeT(this.lang);
    }

    render() {
        const t = this.t;
        return html`
            <div class="card">
                <div class="header">
                    <div class="header-text">
                        <div class="texts">
                            <bd-icon-button
                                class="back-icon"
                                type="secondary-grey"
                                icon="bd:chevron_left"
                                size="small"
                            ></bd-icon-button>
                            <bd-font class="title" type="title">${t("offerName")}</bd-font>
                        </div>
                        <bd-system-badge
                            class="status-badge"
                            type="info"
                            text="${t("statusCompleted")}"
                            small
                            ?hidePrefixIcon="${true}"
                        ></bd-system-badge>
                    </div>
                    <div class="header-actions">
                        <bd-assist-chips
                            class="chips"
                            icon="bd:copy_outline"
                            text="${t("actionDuplicate")}"
                        ></bd-assist-chips>
                        <bd-assist-chips class="chips" icon="bd:download" text="${t("actionExport")}"></bd-assist-chips>
                        <bd-assist-chips class="chips" icon="bd:external" text="${t("actionView")}"></bd-assist-chips>
                    </div>
                </div>

                <div class="offer-summary">
                    <div class="offer-image"><bd-font type="h2">50%</bd-font></div>
                    <div class="offer-rows">
                        <bd-list-item-v2
                            static
                            type="rounded"
                            .subtitle="${t("infoOffer")}"
                            .title="${t("offerText")}"
                        ></bd-list-item-v2>
                        <bd-list-item-v2
                            static
                            type="rounded"
                            .subtitle="${t("infoPeriod")}"
                            .title="${t("offerPeriod")}"
                        ></bd-list-item-v2>
                    </div>
                </div>

                <bd-list-item-v2 class="offer-addresses" static type="rounded" .subtitle="${t("infoAddresses")}">
                    <span class="addresses-title" slot="title">
                        <bd-font type="list-title-semiBold">${t("addressesText")}</bd-font>
                        <bd-standard-button type="text-low" size="small">${t("viewAll")}</bd-standard-button>
                    </span>
                </bd-list-item-v2>

                <div class="offer-numbers">
                    ${[t("numRevenue"), t("numBenefit"), t("numVat"), t("numCost")].map(
                        (label) =>
                            html`<bd-numbers-card
                                class="numbers-card"
                                type="gray"
                                size="large"
                                text-only
                                text="${label}"
                            >
                                <bd-font type="number" slot="content">-</bd-font>
                            </bd-numbers-card>`,
                    )}
                </div>
            </div>

            <div class="card tabs-card">
                <div class="controller-items">
                    <bd-tabs
                        class="tabs"
                        type="standard"
                        size="fixed"
                        theme="light"
                        align="left"
                        selected="${this.selectedTab}"
                        selected-attribute="selected"
                        attr-for-selected="name"
                    >
                        <bd-tab
                            slot="tab"
                            name="analytics"
                            align="center"
                            icon="bd:chart_outline"
                            @click="${() => (this.selectedTab = "analytics")}"
                            >${t("tabAnalytics")}</bd-tab
                        >
                        <bd-tab
                            slot="tab"
                            name="transactions"
                            align="center"
                            icon="bg:card_transfers"
                            icon-type="outline"
                            @click="${() => (this.selectedTab = "transactions")}"
                            >${t("tabTransactions")}</bd-tab
                        >
                        <bd-tab
                            slot="tab"
                            name="details"
                            align="center"
                            icon="bg:info"
                            icon-type="outline"
                            @click="${() => (this.selectedTab = "details")}"
                            >${t("tabDetails")}</bd-tab
                        >
                    </bd-tabs>
                </div>
                <div class="tab-panel">${this._tabContent()}</div>
            </div>
        `;
    }

    _tabContent() {
        if (this.selectedTab === "transactions") {
            return html`<showcase-transactions-section
                .lang="${this.lang}"
                .emptyState="${this.emptyState}"
            ></showcase-transactions-section>`;
        }
        if (this.selectedTab === "details") {
            return html`<showcase-offer-details-section .lang="${this.lang}"></showcase-offer-details-section>`;
        }
        return html`<showcase-analytics-section
            .lang="${this.lang}"
            .scenario="${this.scenario}"
            .emptyState="${this.emptyState}"
        ></showcase-analytics-section>`;
    }
}
customElements.define("showcase-offer-details", ShowcaseOfferDetails);

/* ================================================================== *
 *  Details drill-down pages — shared base + the two views
 * ================================================================== */

const sharedDetailsStyles = css`
    :host {
        display: block;
        width: 100%;
    }
    .details-info {
        width: 100%;
        display: flex;
        flex-direction: column;
        border-radius: var(--border-radius-32);
        background-color: var(--layer-01);
        border: 1px solid var(--border-03);
    }
    .info-header {
        padding: var(--space-16) var(--space-24);
        border-bottom: 1px solid var(--color-invert-component-tr-70);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--space-12);
    }
    .breadcrumbs-back {
        display: flex;
        align-items: center;
        gap: var(--space-12);
    }
    .back-icon {
        cursor: pointer;
    }
    .info-content {
        display: flex;
        flex-direction: column;
        padding: var(--space-24);
        gap: var(--space-24);
    }
    .breadcrumbs-wrapper {
        padding-bottom: var(--space-24);
    }
    .table-wrapper {
        border-radius: var(--border-radius-32);
        border: 1px solid var(--border-03);
    }
    .table-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-16) var(--space-24);
        border-bottom: 1px solid var(--color-invert-component-tr-70);
    }
    .details-table {
        --shadow-raised: 0;
    }
    .secondary-title {
        color: var(--color-invert-component-tr-40);
    }
    .cell {
        pointer-events: none;
    }
    .last-cell {
        justify-content: end;
    }
    .row {
        --cell-bg-color: transparent;
    }
    .pagination {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding: var(--space-12) var(--space-24);
    }
    .above {
        color: var(--decorative-green-layer-02);
    }
    .below {
        color: var(--text-error);
    }
`;

class DetailsBase extends LitElement {
    static properties = {
        lang: {type: String},
        scenario: {type: String},
        emptyState: {type: Boolean},
        pageSize: {type: Number},
        pageNumber: {type: Number},
        loading: {type: Boolean},
        tableData: {type: Object},
        campaignFilterData: {type: Object},
    };

    constructor() {
        super();
        this.lang = "ka";
        this.scenario = "ON_TRACK";
        this.emptyState = false;
        this.pageSize = 10;
        this.pageNumber = 0;
        this.loading = true;
        this.tableData = {};
        this.campaignFilterData = {
            startDate: dayjs(OFFER.start, "YYYY/MM/DD").toDate(),
            endDate: dayjs(OFFER.end, "YYYY/MM/DD").toDate(),
        };
    }

    get t() {
        return makeT(this.lang);
    }

    updated(changed) {
        if (["emptyState", "scenario", "lang", "pageNumber"].some((k) => changed.has(k))) this._fetchTableData();
    }

    _back() {
        window.location.hash = "#/";
    }

    get _breadcrumbsOptions() {
        const t = this.t;
        return [
            {label: t("allOffers"), href: "#/"},
            {label: t("offerName"), href: "#/"},
            {label: this._title, href: "#"},
        ];
    }

    _changePage(e) {
        this.pageNumber = e.detail.page - 1;
    }

    _showPagination() {
        return !this.tableData.noData && this.tableData?.totalCount > (this.tableData.data?.length || 0);
    }

    _datePicker() {
        return html`<bd-datepicker
            type="range"
            left
            orientation="bottomLeft"
            mode="inline"
            format="numbers"
            .fromDate="${this.campaignFilterData.startDate}"
            .toDate="${this.campaignFilterData.endDate}"
            .maxDate="${dayjs(OFFER.end, "YYYY/MM/DD").toDate()}"
            .minDate="${dayjs(OFFER.start, "YYYY/MM/DD").subtract(2, "month").toDate()}"
        ></bd-datepicker>`;
    }

    _header() {
        return html`<header class="info-header">
            <div class="breadcrumbs-back">
                <bd-icon-button
                    class="back-icon"
                    type="secondary-grey"
                    icon="bd:chevron_left"
                    size="small"
                    @click="${this._back}"
                ></bd-icon-button>
                <bd-font class="back-text" type="overline1">${this._title}</bd-font>
            </div>
            ${this._datePicker()}
        </header>`;
    }

    _renderPage(chart, tableTitle) {
        const t = this.t;
        return html`
            <div class="breadcrumbs-wrapper">
                <bd-breadcrumbs-v2 .options="${this._breadcrumbsOptions}"></bd-breadcrumbs-v2>
            </div>
            <div class="details-info">
                ${this._header()}
                <main class="info-content">
                    <showcase-chart-wrapper>${chart}</showcase-chart-wrapper>
                    <div class="table-wrapper">
                        <div class="table-header">
                            <bd-font class="header-title" type="overline1">${tableTitle}</bd-font>
                            <bd-standard-button
                                size="small"
                                type="text-primary"
                                prefix-icon="bd:download"
                                ?disabled="${this.tableData.noData}"
                                >${t("reportBtn")}</bd-standard-button
                            >
                        </div>
                        ${this._tablePart()}
                        ${!this.loading && this._showPagination()
                            ? html`<bd-pagination
                                  class="pagination"
                                  hide-page-input
                                  total-count=${this.tableData.totalCount}
                                  page-size=${this.pageSize}
                                  page=${this.pageNumber + 1}
                                  neighbours="1"
                                  @page-change=${this._changePage}
                              ></bd-pagination>`
                            : nothing}
                    </div>
                </main>
            </div>
        `;
    }
}

/* ---- Learning details ---- */

class ShowcaseLearningDetails extends DetailsBase {
    static styles = sharedDetailsStyles;

    get _title() {
        return this.t("learningTitle");
    }

    get _tableRowTitles() {
        const t = this.t;
        return [
            {key: "date", label: t("colDate")},
            {key: "predictedViews", label: t("learnColExpected")},
            {key: "views", label: t("learnColActual")},
        ];
    }

    async _fetchTableData() {
        this.loading = true;
        try {
            const data = await mockApi.execute({
                url: "ads-manager/impressions/views-prediction",
                params: {
                    scenario: this.scenario,
                    empty: this.emptyState,
                    startDate: dayjs(this.campaignFilterData?.startDate).format("YYYY-MM-DD"),
                    endDate: dayjs(this.campaignFilterData?.endDate).format("YYYY-MM-DD"),
                    pageSize: this.pageSize,
                    pageNumber: this.pageNumber,
                },
            });
            this.tableData = this._compareValues(data?.json);
        } finally {
            this.loading = false;
        }
    }

    _compareValues(data) {
        if (!data?.data) return data;
        return {
            ...data,
            data: data.data.map((item) => ({
                ...item,
                status:
                    item.views > item.predictedViews ? "above" : item.views < item.predictedViews ? "below" : "equal",
            })),
        };
    }

    render() {
        return this._renderPage(
            html`<showcase-learning-chart
                slot="chart"
                isDetailsPage
                .lang="${this.lang}"
                .scenario="${this.scenario}"
                .emptyState="${this.emptyState}"
                .filterData="${this.campaignFilterData}"
            ></showcase-learning-chart>`,
            this.t("learningTitle"),
        );
    }

    _tablePart() {
        if (this.loading) return html`<div style="padding: var(--space-24)"><bd-font type="body2">…</bd-font></div>`;
        if (this.tableData.noData) return html`<showcase-empty messageType="EMPTY" .t=${this.t}></showcase-empty>`;
        const titles = this._tableRowTitles;
        return html`<bd-table class="details-table" mode="basic" style="--cell-template-columns: repeat(3, 1fr);">
            <bd-table-row class="row" header>
                ${titles.map(
                    (item, i) =>
                        html`<bd-table-cell class="secondary-title cell ${i === titles.length - 1 ? "last-cell" : ""}">
                            <bd-font type="overline2"><span>${item.label}</span></bd-font>
                        </bd-table-cell>`,
                )}
            </bd-table-row>
            ${this.tableData.data.map(
                (item) =>
                    html`<bd-table-row class="row">
                        <bd-table-cell class="cell">
                            <bd-font type="button-text"
                                ><span>${formatDate(item.date[0], "DD MMM/YYYY", this.lang)}</span></bd-font
                            >
                        </bd-table-cell>
                        <bd-table-cell class="cell"
                            ><bd-font type="button-text"><span>${item.predictedViews}</span></bd-font></bd-table-cell
                        >
                        <bd-table-cell class="cell last-cell ${item.status}"
                            ><bd-font type="button-text"><span>${item.views}</span></bd-font></bd-table-cell
                        >
                    </bd-table-row>`,
            )}
        </bd-table>`;
    }
}
customElements.define("showcase-learning-details", ShowcaseLearningDetails);

/* ---- CTR-time details ---- */

class ShowcaseCtrDetails extends DetailsBase {
    static styles = sharedDetailsStyles;

    get _title() {
        return this.t("ctrTitle");
    }

    get _tableRowTitles() {
        const t = this.t;
        return [
            {key: "date", label: t("colDate")},
            {key: "views", label: t("ctrAggViews")},
            {key: "clicks", label: t("ctrClick")},
            {key: "ctr", label: t("ctrCtr")},
        ];
    }

    async _fetchTableData() {
        this.loading = true;
        try {
            const data = await mockApi.execute({
                url: "ads-manager/impressions/ctr-time",
                params: {
                    empty: this.emptyState,
                    startDate: dayjs(this.campaignFilterData?.startDate).format("YYYY-MM-DD"),
                    endDate: dayjs(this.campaignFilterData?.endDate).format("YYYY-MM-DD"),
                    pageSize: this.pageSize,
                    pageNumber: this.pageNumber,
                },
            });
            this.tableData = data?.json || {};
        } finally {
            this.loading = false;
        }
    }

    render() {
        return this._renderPage(
            html`<showcase-ctr-time-chart
                slot="chart"
                isDetailsPage
                .lang="${this.lang}"
                .emptyState="${this.emptyState}"
                .filterData="${this.campaignFilterData}"
            ></showcase-ctr-time-chart>`,
            this.t("ctrTitle"),
        );
    }

    _tablePart() {
        if (this.loading) return html`<div style="padding: var(--space-24)"><bd-font type="body2">…</bd-font></div>`;
        if (this.tableData.noData) return html`<showcase-empty messageType="EMPTY" .t=${this.t}></showcase-empty>`;
        const titles = this._tableRowTitles;
        return html`<bd-table class="details-table" mode="basic" style="--cell-template-columns: repeat(4, 1fr);">
            <bd-table-row class="row" header>
                ${titles.map(
                    (item, i) =>
                        html`<bd-table-cell class="secondary-title cell ${i === titles.length - 1 ? "last-cell" : ""}">
                            <bd-font type="overline2"><span>${item.label}</span></bd-font>
                        </bd-table-cell>`,
                )}
            </bd-table-row>
            ${this.tableData.data.map(
                (item) =>
                    html`<bd-table-row class="row">
                        <bd-table-cell class="cell">
                            <bd-font type="button-text"
                                ><span>${formatDate(item.date[0], "DD MMM/YYYY", this.lang)}</span></bd-font
                            >
                        </bd-table-cell>
                        <bd-table-cell class="cell"
                            ><bd-font type="button-text"><span>${item.views}</span></bd-font></bd-table-cell
                        >
                        <bd-table-cell class="cell"
                            ><bd-font type="button-text"><span>${item.clicks}</span></bd-font></bd-table-cell
                        >
                        <bd-table-cell class="cell last-cell"
                            ><bd-font type="button-text"><span>${item.ctrPercentage}%</span></bd-font></bd-table-cell
                        >
                    </bd-table-row>`,
            )}
        </bd-table>`;
    }
}
customElements.define("showcase-ctr-details", ShowcaseCtrDetails);

/* ================================================================== *
 *  <analytics-showcase-root>  — compact toolbar + hash router
 * ================================================================== */

class AnalyticsShowcaseRoot extends LitElement {
    static properties = {
        route: {type: String},
        lang: {type: String},
        scenario: {type: String},
        emptyState: {type: Boolean},
    };

    static styles = css`
        :host {
            display: block;
        }
        .toolbar {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: var(--space-12) var(--space-24);
            padding: var(--space-8) var(--space-16);
            margin-bottom: var(--space-24);
            background-color: var(--layer-01);
            border: 1px dashed var(--border-01);
            border-radius: var(--border-radius-12);
            font-size: 12px;
        }
        .toolbar-group {
            display: flex;
            align-items: center;
            gap: var(--space-8);
        }
        .toolbar-label {
            color: var(--text-secondary);
        }
        .spacer {
            flex: 1;
        }
        .badge {
            color: var(--text-secondary);
        }
    `;

    constructor() {
        super();
        this.route = this._currentRoute();
        this.lang = "ka";
        this.scenario = "ON_TRACK";
        this.emptyState = false;
        this._onHashChange = () => (this.route = this._currentRoute());
    }

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener("hashchange", this._onHashChange);
    }

    disconnectedCallback() {
        window.removeEventListener("hashchange", this._onHashChange);
        super.disconnectedCallback();
    }

    _currentRoute() {
        const h = window.location.hash.replace(/^#\//, "");
        return h === "learning" || h === "ctr-time" ? h : "offer";
    }

    render() {
        return html`${this._toolbar()} ${this._view()}`;
    }

    _toolbar() {
        const t = makeT(this.lang);
        const chip = (label, active, onClick) =>
            html`<bd-filter-chips
                text="${label}"
                ?selected="${active}"
                @on-chips-click="${onClick}"
            ></bd-filter-chips>`;
        return html`<div class="toolbar">
            <div class="toolbar-group">
                <bd-font class="toolbar-label" type="small-text">ენა</bd-font>
                ${chip("ქართული", this.lang === "ka", () => (this.lang = "ka"))}
                ${chip("English", this.lang === "en", () => (this.lang = "en"))}
            </div>
            <div class="toolbar-group">
                <bd-font class="toolbar-label" type="small-text">${t("learningTitle")}</bd-font>
                ${chip(
                    t("ipTitleBelow"),
                    this.scenario === "BELOW_EXPECTATIONS",
                    () => (this.scenario = "BELOW_EXPECTATIONS"),
                )}
                ${chip(t("ipTitleOn"), this.scenario === "ON_TRACK", () => (this.scenario = "ON_TRACK"))}
                ${chip(
                    t("ipTitleExceeds"),
                    this.scenario === "EXCEEDS_EXPECTATIONS",
                    () => (this.scenario = "EXCEEDS_EXPECTATIONS"),
                )}
            </div>
            <div class="toolbar-group">
                <bd-font class="toolbar-label" type="small-text">მონაცემები</bd-font>
                ${chip(t("analyticsTitle"), !this.emptyState, () => (this.emptyState = false))}
                ${chip(t("emptyTitle"), this.emptyState, () => (this.emptyState = true))}
            </div>
            <div class="spacer"></div>
            <bd-font class="badge" type="small-text">Mock showcase · design system live from CDN</bd-font>
        </div>`;
    }

    _view() {
        if (this.route === "learning") {
            return html`<showcase-learning-details
                .lang="${this.lang}"
                .scenario="${this.scenario}"
                .emptyState="${this.emptyState}"
            ></showcase-learning-details>`;
        }
        if (this.route === "ctr-time") {
            return html`<showcase-ctr-details
                .lang="${this.lang}"
                .emptyState="${this.emptyState}"
            ></showcase-ctr-details>`;
        }
        return html`<showcase-offer-details
            .lang="${this.lang}"
            .scenario="${this.scenario}"
            .emptyState="${this.emptyState}"
        ></showcase-offer-details>`;
    }
}
customElements.define("analytics-showcase-root", AnalyticsShowcaseRoot);

