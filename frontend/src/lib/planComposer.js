// Turns a partial profile into 3–5 actionable “plan cards” with deep-links.

export function composePlan(p) {
  const cards = [];
  const uni = p.university ?? "your campus";

  // 1) Housing
  if (!p.focus || ["Housing", "Everything"].includes(p.focus)) {
    const filters = {
      university: p.university,
      budgetMin: p.budget_range?.min ?? 400,
      budgetMax: p.budget_range?.max ?? 1200,
      need: p.housing_need ?? "Off-campus",
    };
    cards.push({
      id: "housing",
      title: "Housing matches are ready",
      body: `Listings near ${uni}, tailored to your budget and timing.`,
      cta: { label: "See listings", to: "/marketplace", state: { filters } },
      tag: "Housing",
    });
  }

  // 2) Roommate
  if (p.roommate_interest || p.focus === "Roommate" || p.focus === "Everything") {
    cards.push({
      id: "roommate",
      title: "Find a compatible roommate",
      body: "2-minute quiz considers sleep/study habits and lifestyle preferences.",
      cta: { label: "Start roommate quiz", to: "/roommate", state: { mode: "quiz" } },
      tag: "Roommate",
    });
  }

  // 3) Essentials pack
  if (p.focus === "Essentials" || p.focus === "Everything" || (p.essentials && p.essentials.length)) {
    const wants = p.essentials?.length ? p.essentials : ["SIM", "Bedding", "Bank"];
    cards.push({
      id: "essentials",
      title: "Your Essentials Pack",
      body: `Prebuilt for ${wants.join(" • ")} so Day 1 is easy.`,
      cta: { label: "Open my pack", to: "/marketplace", state: { tags: wants } },
      tag: "Essentials",
    });
  }

  // 4) Community
  if (p.focus === "Community" || p.focus === "Everything") {
    cards.push({
      id: "community",
      title: "Meet your people",
      body: "Clubs and events matched to your interests and program.",
      cta: { label: "Explore community", to: "/community", state: { interests: p.interests } },
      tag: "Community",
    });
  }

  // 5) Arrival checklist (if date present)
  if (p.arrival_date) {
    const d = new Date(p.arrival_date);
    cards.push({
      id: "arrival",
      title: "Arrival checklist",
      body: `Landing ${d.toLocaleDateString()}? Here’s a 7-day pre-arrival plan + airport transit.`,
      cta: { label: "View checklist", to: "/blogs", state: { topic: "arrival-checklist", university: p.university } },
      tag: "Checklist",
    });
  }

  return cards;
}
