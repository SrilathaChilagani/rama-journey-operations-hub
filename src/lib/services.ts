import type { Tier } from "@/lib/care-rules";

export type ServiceSlug =
  | "after-hospital-stay"
  | "elderly-care"
  | "rehabilitation"
  | "equipment-and-supplies";

export type Service = {
  slug: ServiceSlug;
  n: string;
  name: string;
  short: string;
  tagline: string;
  intro: string;
  forWhom: string[];
  included: string[];
  staff: string;
  tiers: Tier[];
  supervision: string[];
  pricing: string;
  starts: string[];
  faqs: { q: string; a: string }[];
};

export const SERVICES: Service[] = [
  {
    slug: "after-hospital-stay",
    n: "01",
    name: "After a hospital stay",
    short:
      "Recovery at home after surgery, stroke, cardiac events, fractures or ICU — per shift or as a 7, 15 or 30-day recovery package.",
    tagline: "Discharge is not recovery. The first two weeks at home decide most of it.",
    intro:
      "Your parent is stable enough to leave, but not safe alone. We take over from the ward door: a nurse assesses at the bedside or at home, writes the plan with the discharge summary in hand, and a trained caregiver is there from day one — with therapy, the diet plan and the daily report to family lined up before they arrive.",
    forWhom: [
      "After surgery — knee, hip, cardiac, abdominal or oncological",
      "After a stroke or TIA, where the first weeks decide the outcome",
      "After a cardiac event or angioplasty, with monitored vitals",
      "After a fracture or fall, where transfers and falls prevention are the whole job",
      "ICU step-down, when the family is told to manage at home",
      "Discharge while the working children are abroad",
    ],
    included: [
      "A registered nurse assessment within 24 hours, at hospital or at home",
      "A written care plan built from the discharge summary: medicines, wound care, mobility goals, red-flag thresholds",
      "A caregiver on the agreed shift pattern — 12-hour, 24-hour or day-only",
      "Medicine reminders and administration strictly as prescribed",
      "Wound dressing, catheter, stoma and tracheostomy care by a qualified nurse",
      "Help with bathing, feeding, toileting and safe transfers",
      "Physiotherapy visits scheduled inside the plan",
      "A daily report to family on WhatsApp, wherever they are",
      "A named backup caregiver, introduced in week one",
      "Escalation by written rule: red-flag thresholds, and who is called first",
    ],
    staff: "A Senior Caregiver or Registered Nurse, at the tier the assessing nurse sets",
    tiers: ["T3", "T4"],
    supervision: [
      "First nurse visit within 48 hours of care starting, then every week at the skilled-support tier",
      "At the nursing tier, a nurse lead is responsible for the case, with a doctor on call",
      "Every visit is logged, and the plan is reviewed at day 7 and at the end of the package",
    ],
    pricing:
      "Priced per shift, or as a 7, 15 or 30-day recovery package. Your care manager quotes in writing after the nurse assessment — never on a sales call.",
    starts: [
      "Tell us the hospital, the ward and the expected discharge date",
      "A nurse assesses at the bedside or at home within 24 hours",
      "You approve the written care plan and the quote",
      "Your caregiver and backup are introduced before care begins",
      "Care starts on the discharge day, with the daily report switched on",
    ],
    faqs: [
      {
        q: "Can the caregiver start the same day we are discharged?",
        a: "Yes, when the assessment and the plan are signed the day before. That is why we ask for the expected discharge date as early as possible.",
      },
      {
        q: "What if my parent's condition changes after discharge?",
        a: "The assessing nurse re-tiers the care. If the need rises, the caregiver's training and the nurse visit cycle rise with it; if it falls, we step down so you are not paying for skill you no longer need.",
      },
      {
        q: "Do you take a patient straight from ICU?",
        a: "We accept ICU step-down once a nurse has assessed the equipment and the skill required. If the need is still intensive, we say so and help you arrange that instead of accepting a placement we cannot supervise safely.",
      },
    ],
  },
  {
    slug: "elderly-care",
    n: "02",
    name: "Elderly care",
    short:
      "Daily living support, companionship, medication reminders, dementia and palliative care, on a monthly plan.",
    tagline:
      "For the years after the hospital — when the worry is not one operation, but every ordinary day.",
    intro:
      "Most families do not call after an emergency. They call because Mum has stopped cooking, because Dad has fallen twice and will not mention it, because someone with dementia left the gas on. We build a monthly routine around the person: who comes, when, what they do, and who checks that it happened.",
    forWhom: [
      "Living alone after a spouse's death, or a child's move abroad",
      "Falls, unsteady walking, or the fear of falling",
      "Memory loss, dementia and wandering",
      "Long-term conditions — diabetes, Parkinson's, COPD, heart failure, kidney disease",
      "Bed-bound or chair-bound needs, where skin and pressure care matter",
      "Palliative and end-of-life care at home, with the family supported",
    ],
    included: [
      "A monthly care routine agreed with the family and with the person themselves",
      "Companionship — walks, conversation, a drive, sitting in the park",
      "Bathing, dressing, grooming and hygiene support",
      "Medicine reminders, and administration by a qualified caregiver or nurse",
      "Meal planning and cooking to the diet the nurse or doctor set",
      "Safe transfers, wheelchair and commode handling",
      "Pressure-area care and repositioning for those who cannot move themselves",
      "Dementia-friendly routines and wandering precautions",
      "Palliative comfort care with a nurse lead and a doctor on call",
      "A daily report to family, and a monthly review with the care manager",
    ],
    staff:
      "A Care Companion, Certified Caregiver or Senior Caregiver — the tier is set by the assessing nurse, not by the enquiry",
    tiers: ["T1", "T2", "T3"],
    supervision: [
      "Companion care: a nurse visit every month",
      "Personal care: a nurse visit every fortnight",
      "Skilled support: a nurse visit every week",
      "A fall, a bad night or a drop in appetite is reported the same day, not at the next visit",
    ],
    pricing:
      "Monthly plans, quoted in writing after the nurse assessment. The tier the nurse sets decides the caregiver's training and the visit cycle.",
    starts: [
      "Tell us about your parent, and what a good day looks like for them",
      "A nurse visits and assesses within 24 hours",
      "You approve the written care plan, routine and quote",
      "The caregiver and a named backup are introduced in week one",
      "Care runs on the monthly plan, reviewed with you",
    ],
    faqs: [
      {
        q: "Can the same caregiver come every day?",
        a: "Yes. Families ask for continuity and we build the roster around it, with a named backup trained on the same plan for the days that caregiver is off.",
      },
      {
        q: "What happens on the days the caregiver is off?",
        a: "The named backup, introduced in week one, covers them. Care never restarts with a stranger.",
      },
      {
        q: "My parent refuses help. Will you push them into it?",
        a: "No. The nurse assesses first and tells us honestly whether the person will accept care. Where they will not, we start with a short companion visit and build from there rather than forcing a routine they will reject.",
      },
    ],
  },
  {
    slug: "rehabilitation",
    n: "03",
    name: "Rehabilitation",
    short:
      "Physiotherapy, occupational and speech therapy by visiting therapists, in the comfort of home.",
    tagline: "The window for recovery is measured in weeks. We work inside it.",
    intro:
      "Therapy at home is not a weaker version of a clinic. A knee that will not bend at week three, a hand that will not grip, speech that has not come back after a stroke — these need repeatable, daily work with someone who knows the case. Our therapists visit and set the plan; the caregiver carries the exercises on between sessions, so the work happens every day rather than twice a week.",
    forWhom: [
      "Post-stroke recovery — movement, balance, swallowing and speech",
      "After a joint replacement, especially a knee that will not bend",
      "After a fracture or long bed rest, when strength has gone",
      "Parkinson's and other neurological conditions, to hold function",
      "Chest and breathing rehabilitation after a respiratory illness or surgery",
      "Amputee and wound-related mobility work",
    ],
    included: [
      "Physiotherapy: gait, strength, balance, range of motion and pain management",
      "Occupational therapy: relearning daily tasks, and adapting the home for safety",
      "Speech and language therapy: speech, and a swallowing assessment for safety",
      "A written therapy plan with weekly, measurable goals",
      "The caregiver carries the exercise routine between sessions and logs it",
      "A home safety check — grab bars, footwear, loose mats, bed height, lighting",
      "A weekly progress note to the family and to the referring doctor",
      "Equipment recommendations, supplied and fitted by us",
    ],
    staff:
      "A visiting physiotherapist, occupational therapist or speech therapist, with a caregiver or nurse covering the daily work between sessions",
    tiers: ["T2", "T3"],
    supervision: [
      "Therapy goals are reviewed weekly against the written plan",
      "A nurse supervises the caregiver's carry-over work and reports drift the same day",
      "If progress stalls for two weeks, the plan is rewritten with the doctor rather than quietly continued",
    ],
    pricing:
      "Charged per therapy session, or as part of a recovery package. Quoted in writing after the assessment.",
    starts: [
      "Tell us the diagnosis, and what you want them to be able to do again",
      "The nurse assesses and refers to the right therapist",
      "The therapist sets written goals with you",
      "The caregiver carries the routine between sessions, and it is logged",
      "Progress is reviewed weekly, with the family copied",
    ],
    faqs: [
      {
        q: "How often will the therapist come?",
        a: "The therapist sets the frequency in the plan — usually twice a week at first, then spaced out as the caregiver takes the routine on.",
      },
      {
        q: "Is a caregiver enough without a therapist?",
        a: "No, and we will not claim otherwise. A caregiver keeps the routine going and keeps them safe; the therapist decides what the routine is, and changes it when progress stalls.",
      },
      {
        q: "Do you work with the hospital's physiotherapist?",
        a: "Yes. We ask for the discharge plan and write our goals against it, so the work at home continues the ward's work instead of starting over.",
      },
    ],
  },
  {
    slug: "equipment-and-supplies",
    n: "04",
    name: "Equipment & supplies",
    short:
      "Hospital beds, air mattresses, wheelchairs, oxygen concentrators and monitors — to rent or buy.",
    tagline: "The right equipment, delivered, fitted and checked — not just dropped at the door.",
    intro:
      "A hospital bed in the wrong room, an air mattress left unweighted, an oxygen concentrator nobody knows how to run — equipment goes wrong quietly. We deliver, install, show the family how it works, and a nurse checks it is being used safely. When care ends, we come and collect it.",
    forWhom: [
      "A discharge that needs a hospital bed or air mattress waiting at home",
      "A fall or fracture that needs a wheelchair, walker or commode now",
      "Home oxygen, suction or nebulisation",
      "Vitals monitoring for a cardiac or respiratory patient",
      "A short stay where buying makes no sense",
      "A caregiver who needs the equipment to do the job safely",
    ],
    included: [
      "Hospital beds, manual and electric, with mattresses",
      "Air mattresses and pressure-relief systems for those who cannot move",
      "Wheelchairs, walkers, commodes, shower chairs and bedpan supports",
      "Oxygen concentrators, suction machines and nebulisers",
      "BP, SpO2, pulse and thermometer monitoring equipment",
      "Delivery, installation and a hands-on demonstration for the family",
      "Collection and handover when care ends",
      "A nurse safety check on how the equipment is being used",
    ],
    staff: "Our delivery and installation team, with a nurse safety check on the equipment in use",
    tiers: [],
    supervision: [
      "Equipment is checked at installation and again on the nurse's next visit",
      "Oxygen and suction equipment is supplied only where a nurse has confirmed the skill to run it",
      "Faulty equipment is replaced, not repaired at the family's cost",
    ],
    pricing:
      "Rent for as long as it is needed, or buy where it makes sense. The quote lists every item and the rental period — nothing added after delivery.",
    starts: [
      "Tell us the diagnosis, the room, and how long you expect to need it",
      "We check what the care plan actually requires, so you do not rent what you do not need",
      "The item is delivered and installed on the agreed day",
      "The family is shown how to use it, and a nurse checks its use",
      "We collect it when care ends",
    ],
    faqs: [
      {
        q: "Can I rent for just a few weeks?",
        a: "Yes. Most families rent for the length of a recovery package, and we collect when the nurse says the equipment is no longer needed.",
      },
      {
        q: "Will someone show us how to use it?",
        a: "Yes, at installation. The family is shown how to run it, and a nurse checks its use on the next visit.",
      },
      {
        q: "Do you supply equipment without a care package?",
        a: "Yes. Equipment can be rented or bought on its own. Where oxygen or suction is involved, a nurse confirms first that someone in the home can run it safely.",
      },
    ],
  },
];

export function serviceBySlug(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}
