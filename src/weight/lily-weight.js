import LilyWeight from "lilyweight";

const SKILL_ORDER = ["enchanting", "taming", "alchemy", "mining", "farming", "foraging", "combat", "fishing"];
const SLAYER_ORDER = ["zombie", "spider", "wolf", "enderman", "blaze"];

/**
 * converts a dungeon floor into a completion map
 * @param {{[key:string]:{stats:{tier_completions:number}}}} floors
 * @returns {{[key:string]:number}}
 */
function getTierCompletions(floors = {}) {
  return Object.fromEntries(Object.entries(floors).map(([key, value]) => [key, value.stats.tier_completions ?? 0]));
}

export function calculateLilyWeight(profile) {
  const skillLevels = SKILL_ORDER.map((key) => profile.levels[key].uncappedLevel);
  const skillXP = SKILL_ORDER.map((key) => profile.levels[key].xp);

  const cataCompletions = getTierCompletions(profile.dungeons?.catacombs?.floors ?? {});
  const masterCataCompletions = getTierCompletions(profile.dungeons?.master_catacombs?.floors ?? {});
  const cataXP = profile.dungeons?.catacombs?.level?.xp ?? 0;

  const slayerXP = SLAYER_ORDER.map((key) => profile.slayers?.[key]?.level?.xp ?? 0);

  return LilyWeight.getWeightRaw(skillLevels, skillXP, cataCompletions, masterCataCompletions, cataXP, slayerXP);
}
