import { stats_symbols as symbols } from "./stats.js";
import { formatNumber } from "../helper.js";

function round(num, decimals = 0) {
  return Math.round(Math.pow(10, decimals) * num) / Math.pow(10, decimals);
}

function floor(num, decimals = 0) {
  return Math.floor(Math.pow(10, decimals) * num) / Math.pow(10, decimals);
}

const upgrade_types = {
  mithril_powder: {
    name: "Mithril Powder",
    color: "2",
  },
  gemstone_powder: {
    name: "Gemstone Powder",
    color: "d",
  },
  token_of_the_mountain: {
    name: "Token of the Mountain",
    color: "5",
  },
  free: {
    name: "FREE",
    color: "a",
  },
};

const hotm_rewards = {
  rewards: {
    token_of_the_mountain: {
      formatted: "§5Token of the Mountain",
      qtyColor: "5",
    },
    access_to_forge: {
      formatted: "§eAccess to the Forge",
      qtyColor: "e",
    },
    new_forgeable_items: {
      formatted: "§eNew Forgeable Items",
      qtyColor: "e",
    },
    forge_slot: {
      formatted: "§aForge Slot",
      qtyColor: "a",
    },
    access_crystal_hollows: {
      formatted: "§dAccess to the §5Crystal Hollows",
      qtyColor: "d",
    },
    emissary_braum_crystal_hollows: {
      formatted: "§eEmissary Braum §f- §bCrystal Hollows",
      qtyColor: "e",
    },
  },
  tiers: {
    1: {
      token_of_the_mountain: 1,
    },
    2: {
      token_of_the_mountain: 2,
      access_to_forge: 0,
      new_forgeable_items: 0,
    },
    3: {
      token_of_the_mountain: 2,
      forge_slot: 1,
      new_forgeable_items: 0,
      access_crystal_hollows: 0,
      emissary_braum_crystal_hollows: 0,
    },
    4: {
      token_of_the_mountain: 2,
      forge_slot: 1,
      new_forgeable_items: 0,
    },
    5: {
      token_of_the_mountain: 2,
      new_forgeable_items: 0,
    },
    6: {
      token_of_the_mountain: 2,
      new_forgeable_items: 0,
    },
    7: {
      token_of_the_mountain: 2,
      new_forgeable_items: 0,
    },
  },
};

class HotM {
  constructor(tier, level) {
    this.tier = tier;
    this.level = level.level;
    this.progress = level.progress;
    this.levelWithProgress = level.levelWithProgress;
    this.xp = level.xp;
    this.xpCurrent = level.xpCurrent;
    this.xpForNext = level.xpForNext;
  }

  get lore() {
    const output = [];

    // name
    output.push(this.displayName, "");

    // main
    if (this.status === "unlocked") {
      output.push(
        "§7You have unlocked this tier. All perks and abilities on this tier are available for unlocking with §5Token of the Mountain§7.",
        ""
      );
    } else {
      output.push(
        "§7Progress through your Heart of the Mountain by gaining §5HotM Exp§7, which is earned through completing §aCommissions§7.",
        "",
        "Commissions are tasks given by the §e§lKing§r§7 in the §bRoyal Palace§7. Complete them to earn bountiful rewards!",
        ""
      );
    }

    // progress
    if (this.status === "next") {
      const progress = round(this.progress * 100);
      const greenBars = Math.ceil(progress / 5);
      const whiteBars = 20 - greenBars;
      output.push(
        `§7Progress: §e${progress}%`,
        `${"§2-".repeat(greenBars)}${"§f-".repeat(
          whiteBars
        )} §e${this.xpCurrent.toLocaleString()} §6/ §e${this.xpForNext.toLocaleString()}`,
        ""
      );
    }

    // rewards
    output.push("§7Rewards");
    for (const [reward, qty] of Object.entries(hotm_rewards.tiers[this.tier])) {
      const quantity = qty > 0 ? `§${hotm_rewards.rewards[reward].qtyColor}${qty} ` : "";
      const name = hotm_rewards.rewards[reward].formatted;
      output.push(`§8+ ${quantity}${name}`);
    }
    output.push("");

    // status
    output.push(this.status === "unlocked" ? "§aUNLOCKED" : "§cLOCKED");

    return output;
  }

  get displayName() {
    const color = this.status === "unlocked" ? "a" : this.status === "next" ? "e" : "c";
    return `§${color}Tier ${this.tier}`;
  }

  get status() {
    if (this.tier <= this.level) {
      return "unlocked";
    }

    if (this.tier === Math.ceil(this.levelWithProgress)) {
      return "next";
    }

    return "locked";
  }
}

class Node {
  constructor(data) {
    this.nodeType = "normal";
    this.level = data.level;
    this.enabled = data.enabled;
    this.nodes = data.nodes;
    this.hotmTier = data.hotmLevelData.level;
    this.potmLevel = data.nodes.special_0;
    this.selectedPickaxeAbility = data.selectedPickaxeAbility;
  }

  get lore() {
    let output = [];

    // Name
    output.push(this.displayName);

    // Level
    if (this.max_level > 1) {
      if (this.maxed) {
        output.push(`§7Level ${Math.max(1, this.level)}`);
      } else {
        output.push(`§7Level ${Math.max(1, this.level)}§8/${this.max_level}`);
      }
    }
    output.push("");

    // Perk
    output.push(...this.perk(Math.max(1, this.level)));

    // Upgradeable
    if (this.level > 0 && this.level < this.max_level) {
      // header
      output.push("", "§a=====[ §a§lUPGRADE §a] =====");

      // upgrade perk
      output.push(`§7Level ${this.level + 1}§8/${this.max_level}`, "", ...this.perk(this.level + 1));

      // upgrade cost
      output.push(
        "",
        "§7Cost",
        `§${upgrade_types[this.upgrade_type].color}${this.upgradeCost} ${upgrade_types[this.upgrade_type].name}`
      );
    }

    // Maxed perk
    if (this.maxed && this.type !== "pickaxe_ability") {
      output.push("", "§aUNLOCKED");
    }

    // Unlock cost
    if (this.level === 0) {
      output.push("", "§7Cost");
      for (const [upgradeId, upgradeQty] of Object.entries(this.unlockCost)) {
        output.push(
          `§${upgrade_types[upgradeId].color}${upgradeQty > 0 ? `${upgradeQty} ` : ""}${upgrade_types[upgradeId].name}`
        );
      }
    }

    // Requirements
    if (this.level === 0) {
      if (this.requires.length > 0 && !this.requires.some((x) => Object.keys(this.nodes).includes(x))) {
        const reqs = this.requires.map((x) => hotm.names[x]);
        const reqsFriendly = reqs.length > 1 ? reqs.slice(0, -1).join(", ") + " or " + reqs.slice(-1) : reqs[0];
        output.push("", `§cRequires ${reqsFriendly}.`);
      }

      if (this.requiredHotmTier > this.hotmTier) {
        output.push("", `§cRequires HotM Tier ${this.requiredHotmTier}.`);
      }
    }

    // Status
    if (this.level > 0 && this.type !== "pickaxe_ability") {
      output.push("", this.enabled ? "§aENABLED" : "§cDISABLED");
    }

    // Selected Pickaxe Ability
    if (this.level > 0 && this.type === "pickaxe_ability") {
      if (this.selectedPickaxeAbility === this.id) {
        output.push("", "§aSELECTED");
      } else {
        output.push("", "§eClick to select!");
      }
    }

    return output.map((x) => "§r" + x);
  }

  get pickaxeAbilityLevel() {
    // Blue Omelette gives +1 level, impossible to account for in here
    let level = 1;

    if (this.potmLevel >= 1) {
      level += 1;
    }

    return level;
  }

  get requiredHotmTier() {
    return Math.abs(Math.ceil(this.position / 7) - 7) + 1;
  }

  get unlockCost() {
    return {
      token_of_the_mountain: 1,
    };
  }

  get displayName() {
    const nameColor = this.level === 0 ? "c" : this.level === this.max_level ? "a" : "e";
    return `§${nameColor}§l${this.name}`;
  }

  get maxed() {
    return this.level === this.max_level;
  }

  get upgradeCost() {
    return -1;
  }

  perk(level) {
    return ["Missing perk description."];
  }
}

class MiningSpeed2 extends Node {
  constructor(data) {
    super(data);
    this.id = "mining_speed_2";
    this.name = hotm.names[this.id];
    this.position = 2;
    this.max_level = 50;
    this.upgrade_type = "gemstone_powder";
    this.requires = ["lonesome_miner"];
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.2));
  }

  perk(level) {
    const val = level * 40;
    return [`§7Grants §a+${val} §6${symbols.mining_speed} Mining Speed§7.`];
  }
}

class PowderBuff extends Node {
  constructor(data) {
    super(data);
    this.id = "powder_buff";
    this.name = hotm.names[this.id];
    this.position = 4;
    this.max_level = 50;
    this.upgrade_type = "gemstone_powder";
    this.requires = ["mole"];
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.2));
  }

  perk(level) {
    const val = level * 1;
    return [`§7Gain §a${val}% §7more Mithril Powder and Gemstone Powder.`];
  }
}

class MiningFortune2 extends Node {
  constructor(data) {
    super(data);
    this.id = "mining_fortune_2";
    this.name = hotm.names[this.id];
    this.position = 6;
    this.max_level = 50;
    this.upgrade_type = "gemstone_powder";
    this.requires = ["great_explorer"];
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.2));
  }

  perk(level) {
    const val = level * 5;
    return [`§7Grants §a+${val} §6${symbols.mining_fortune} Mining Fortune§7.`];
  }
}

class VeinSeeker extends Node {
  constructor(data) {
    super(data);
    this.id = "vein_seeker";
    this.name = hotm.names[this.id];
    this.position = 8;
    this.max_level = 1;
    this.upgrade_type = null;
    this.requires = ["lonesome_miner"];
    this.type = "pickaxe_ability";
  }

  get upgradeCost() {
    return 0;
  }

  perk(level) {
    const spread = [2, 3, 4][this.pickaxeAbilityLevel - 1];
    const duration = [12, 14, 16][this.pickaxeAbilityLevel - 1];
    const cooldown = [60, 60, 60][this.pickaxeAbilityLevel - 1];
    return [
      "§6Pickaxe Ability: Vein Seeker",
      `§7Points in the direction of the nearest vein and grants §a+${spread} §6Mining Spread §7for §a${duration}s§7.`,
      `§8Cooldown: §a${cooldown}s`,
      "",
      "§8Pickaxe Abilities apply to all of your pickaxes. You can select a Pickaxe Ability from your Heart of the Mountain.",
      "",
      "§8Upgrade your Pickaxe Abilities by unlocking §cPeak of the Mountain §8in this menu!",
    ];
  }
}

class LonesomeMiner extends Node {
  constructor(data) {
    super(data);
    this.id = "lonesome_miner";
    this.name = hotm.names[this.id];
    this.position = 9;
    this.max_level = 45;
    this.upgrade_type = "gemstone_powder";
    this.requires = ["goblin_killer", "professional"];
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.07));
  }

  perk(level) {
    const val = round(5 + (level - 1) * 0.5);
    return [
      `§7Increases §c${symbols.strength} Strength, §9${symbols.crit_chance} Crit Chance, §9${symbols.crit_damage} Crit Damage, §a${symbols.defense} Defense, and §c${symbols.health} Health §7statistics gain by §a${val}% §7while in the Crystal Hollows.`,
    ];
  }
}

class Professional extends Node {
  constructor(data) {
    super(data);
    this.id = "professional";
    this.name = hotm.names[this.id];
    this.position = 10;
    this.max_level = 140;
    this.upgrade_type = "gemstone_powder";
    this.requires = ["mole", "lonesome_miner"];
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 2.3));
  }

  perk(level) {
    const val = 50 + level * 5;
    return [`§7Gain §a+${val}§7 §6${symbols.mining_speed} Mining Speed§7 when mining Gemstones.`];
  }
}

class Mole extends Node {
  constructor(data) {
    super(data);
    this.id = "mole";
    this.name = hotm.names[this.id];
    this.position = 11;
    this.max_level = 190;
    this.upgrade_type = "gemstone_powder";
    this.requires = ["efficient_miner", "professional", "fortunate"];
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 2.2));
  }

  perk(level) {
    const chance = 50 + (level - 1) * 5;
    let blocks = 1 + floor(chance / 100);
    let percent = chance - floor(chance / 100) * 100;
    if (percent === 0) {
      blocks -= 1;
      percent = 100;
    }

    switch (blocks) {
      case 1:
        blocks = "1";
        break;
      case 2:
        blocks = "a 2nd";
        break;
      case 3:
        blocks = "a 3rd";
        break;
      default:
        blocks = `a ${blocks}th`;
        break;
    }

    return [
      `§7When mining hard stone, you have a §a${percent}%§7 chance to mine §a${blocks}§7 adjacent hard stone block.`,
    ];
  }
}

class Fortunate extends Node {
  constructor(data) {
    super(data);
    this.id = "fortunate";
    this.name = hotm.names[this.id];
    this.position = 12;
    this.max_level = 20;
    this.upgrade_type = "mithril_powder";
    this.requires = ["mole", "great_explorer"];
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.05));
  }

  perk(level) {
    const val = level * 5;
    return [`§7Grants §a+${val}§7 §6${symbols.mining_fortune} Mining Fortune§7 when mining Gemstone.`];
  }
}

class GreatExplorer extends Node {
  constructor(data) {
    super(data);
    this.id = "great_explorer";
    this.name = hotm.names[this.id];
    this.position = 13;
    this.max_level = 20;
    this.upgrade_type = "gemstone_powder";
    this.requires = ["star_powder", "fortunate"];
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 4));
  }

  perk(level) {
    const val = 20 + (level - 1) * 4;
    return [`§7Grants §a+${val}%§7 §7chance to find treasure.`];
  }
}

class ManiacMiner extends Node {
  constructor(data) {
    super(data);
    this.id = "maniac_miner";
    this.name = hotm.names[this.id];
    this.position = 14;
    this.max_level = 1;
    this.upgrade_type = null;
    this.requires = ["great_explorer"];
    this.type = "pickaxe_ability";
  }

  get upgradeCost() {
    return 0;
  }

  perk(level) {
    const speed = [1, 1, 1][this.pickaxeAbilityLevel - 1];
    const duration = [10, 15, 20][this.pickaxeAbilityLevel - 1];
    const cooldown = [60, 59, 59][this.pickaxeAbilityLevel - 1];
    return [
      "§6Pickaxe Ability: Maniac Miner",
      `§7Spends all your Mana and grants §a+${speed} §6${symbols.mining_speed} Mining Speed §7for every 10 Mana spent, for §a${duration}s§7.`,
      `§8Cooldown: §a${cooldown}s`,
      "",
      "§8Pickaxe Abilities apply to all of your pickaxes. You can select a Pickaxe Ability from your Heart of the Mountain.",
      "",
      "§8Upgrade your Pickaxe Abilities by unlocking §cPeak of the Mountain §8in this menu!",
    ];
  }
}

class GoblinKiller extends Node {
  constructor(data) {
    super(data);
    this.id = "goblin_killer";
    this.name = hotm.names[this.id];
    this.position = 16;
    this.max_level = 1;
    this.upgrade_type = null;
    this.requires = ["mining_madness", "lonesome_miner"];
  }

  get upgradeCost() {
    return 0;
  }

  perk(level) {
    return [
      `§7Killing a §6Golden Goblin §7gives §2200 §7extra §2Mithril Powder§7, while killing other Goblins gives some based on their wits.`,
    ];
  }
}

class PeakOfTheMountain extends Node {
  constructor(data) {
    super(data);
    this.id = "special_0";
    this.name = hotm.names[this.id];
    this.position = 18;
    this.max_level = 5;
    this.upgrade_type = "mithril_powder";
    this.requires = ["efficient_miner"];
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(25000 * nextLevel);
  }

  perk(level) {
    const output = [];

    if (level >= 1) {
      output.push("§8+§c1 Pickaxe Ability Level", "§8+§51 Token of the Mountain");
    }
    if (level >= 2) {
      output.push("§8+§a1 Forge Slot");
    }
    if (level >= 3) {
      output.push("§8+§a1 Commission Slot");
    }
    if (level >= 4) {
      output.push("§8+§21 Mithril Powder §7when mining §fMithril");
    }
    if (level >= 5) {
      output.push("§8+§51 Token of the Mountain");
    }

    return output;
  }

  get unlockCost() {
    return {
      free: 0,
    };
  }
}

class StarPowder extends Node {
  constructor(data) {
    super(data);
    this.id = "star_powder";
    this.name = hotm.names[this.id];
    this.position = 20;
    this.max_level = 1;
    this.upgrade_type = null;
    this.requires = ["front_loaded", "great_explorer"];
  }

  get upgradeCost() {
    return 0;
  }

  perk(level) {
    return [`§7Mining Mithril Ore near §5Fallen Crystals §7gives §a+3 §7extra Mithril Powder.`];
  }
}

class SkyMall extends Node {
  constructor(data) {
    super(data);
    this.id = "daily_effect";
    this.name = hotm.names[this.id];
    this.position = 22;
    this.max_level = 1;
    this.upgrade_type = null;
    this.requires = ["mining_madness"];
  }

  get upgradeCost() {
    return 0;
  }

  perk(level) {
    return [
      "§7Every SkyBlock day, you receive a random buff in the §2Dwarven Mines§7.",
      "",
      "§7Possible Buffs",
      `§8 ■ §7Gain §a+100 §6${symbols.mining_speed} Mining Speed.`,
      `§8 ■ §7Gain §a+50 §6${symbols.mining_fortune} Mining Fortune.`,
      "§8 ■ §7Gain §a+15% §7chance to gain extra Powder while mining.",
      "§8 ■ §7Reduce Pickaxe Ability cooldown by §a20%",
      "§8 ■ §7§a10x §7chance to find Goblins while mining.",
      "§8 ■ §7Gain §a5x §9Titanium §7drops.",
    ];
  }
}

class MiningMadness extends Node {
  constructor(data) {
    super(data);
    this.id = "mining_madness";
    this.name = hotm.names[this.id];
    this.position = 23;
    this.max_level = 1;
    this.upgrade_type = null;
    this.requires = ["random_event", "mining_experience", "goblin_killer"];
  }

  get upgradeCost() {
    return 0;
  }

  perk(level) {
    return [
      `§7Grants §a+50 §6${symbols.mining_speed} Mining Speed §7and §6${symbols.mining_fortune} Mining Fortune§7.`,
    ];
  }
}

class SeasonedMineman extends Node {
  constructor(data) {
    super(data);
    this.id = "mining_experience";
    this.name = hotm.names[this.id];
    this.position = 24;
    this.max_level = 100;
    this.upgrade_type = "mithril_powder";
    this.requires = ["efficient_miner", "mining_madness"];
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 2.3));
  }

  perk(level) {
    const val = round(5 + level * 0.1, 1);
    return [`§7Increases your Mining experience gain by §a${val}%§7.`];
  }
}

class EfficientMiner extends Node {
  constructor(data) {
    super(data);
    this.id = "efficient_miner";
    this.name = hotm.names[this.id];
    this.position = 25;
    this.max_level = 100;
    this.upgrade_type = "mithril_powder";
    this.requires = ["daily_powder", "mining_experience", "experience_orbs"];
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 2.6));
  }

  perk(level) {
    const val1 = round(10 + level * 0.4, 1);
    const val2 = floor(level * 0.1);
    return [`§7When mining ores, you have a §a${val1}%§7 chance to mine §a${val2} §7adjacent ores.`];
  }
}

class Orbiter extends Node {
  constructor(data) {
    super(data);
    this.id = "experience_orbs";
    this.name = hotm.names[this.id];
    this.position = 26;
    this.max_level = 80;
    this.upgrade_type = "mithril_powder";
    this.requires = ["efficient_miner", "front_loaded"];
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(70 * nextLevel);
  }

  perk(level) {
    const val = round(0.2 + level * 0.01, 2);
    return [`§7When mining ores, you have a §a${val}%§7 chance to get a random amount of experience orbs.`];
  }
}

class FrontLoaded extends Node {
  constructor(data) {
    super(data);
    this.id = "front_loaded";
    this.name = hotm.names[this.id];
    this.position = 27;
    this.max_level = 1;
    this.upgrade_type = null;
    this.requires = ["fallen_star_bonus", "experience_orbs", "star_powder"];
  }

  get upgradeCost() {
    return 0;
  }

  perk(level) {
    return [
      `§7Grants §a+100 §6${symbols.mining_speed} Mining Speed §7and §6${symbols.mining_fortune} Mining Fortune §7for the first §e2,500 §7ores you mine in a day.`,
    ];
  }
}

class PrecisionMining extends Node {
  constructor(data) {
    super(data);
    this.id = "precision_mining";
    this.name = hotm.names[this.id];
    this.position = 28;
    this.max_level = 1;
    this.upgrade_type = null;
    this.requires = ["front_loaded"];
  }

  get upgradeCost() {
    return 0;
  }

  perk(level) {
    return [
      `§7When mining ore, a particle target appears on the block that increases your §6${symbols.mining_speed} Mining Speed §7by §a30% §7when aiming at it.`,
    ];
  }
}

class LuckOfTheCave extends Node {
  constructor(data) {
    super(data);
    this.id = "random_event";
    this.name = hotm.names[this.id];
    this.position = 30;
    this.max_level = 45;
    this.upgrade_type = "mithril_powder";
    this.requires = ["mining_speed_boost", "mining_madness"];
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.07));
  }

  perk(level) {
    const val = 5 + level * 1;
    return [`§7Increases the chance for you to trigger rare occurrences in §2Dwarven Mines §7by §a${val}%§7.`];
  }
}

class DailyPowder extends Node {
  constructor(data) {
    super(data);
    this.id = "daily_powder";
    this.name = hotm.names[this.id];
    this.position = 32;
    this.max_level = 100;
    this.upgrade_type = "mithril_powder";
    this.requires = ["mining_fortune"];
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(182 + 18 * nextLevel);
  }

  perk(level) {
    const val = 400 + (level - 1) * 36;
    return [`§7Gain §a${val} Powder §7from the first ore you mine every day. Works for all Powder types.`];
  }
}

class Crystallized extends Node {
  constructor(data) {
    super(data);
    this.id = "fallen_star_bonus";
    this.name = hotm.names[this.id];
    this.position = 34;
    this.max_level = 30;
    this.upgrade_type = "mithril_powder";
    this.requires = ["pickaxe_toss", "front_loaded"];
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.4));
  }

  perk(level) {
    const val = 20 + (level - 1) * 6;
    return [
      `§7Grants §a+${val} §6${symbols.mining_speed} Mining Speed §7and a §a${val}% §7chance to deal §a+1 §7extra damage near §5Fallen Stars§7.`,
    ];
  }
}

class MiningSpeedBoost extends Node {
  constructor(data) {
    super(data);
    this.id = "mining_speed_boost";
    this.name = hotm.names[this.id];
    this.position = 37;
    this.max_level = 1;
    this.upgrade_type = null;
    this.requires = ["titanium_insanium", "random_event"];
    this.type = "pickaxe_ability";
  }

  get upgradeCost() {
    return 0;
  }

  perk(level) {
    const effect = [200, 300, 400][this.pickaxeAbilityLevel - 1];
    const duration = [15, 20, 25][this.pickaxeAbilityLevel - 1];
    const cooldown = [120, 120, 120][this.pickaxeAbilityLevel - 1];
    return [
      "§6Pickaxe Ability: Mining Speed Boost",
      `§7Grants §a+${effect}% §6${symbols.mining_speed} Mining Speed §7for §a${duration}s§7.`,
      `§8Cooldown: §a${cooldown}s`,
      "",
      "§8Pickaxe Abilities apply to all of your pickaxes. You can select a Pickaxe Ability from your Heart of the Mountain.",
      "",
      "§8Upgrade your Pickaxe Abilities by unlocking §cPeak of the Mountain §8in this menu!",
    ];
  }
}

class TitaniumInsanium extends Node {
  constructor(data) {
    super(data);
    this.id = "titanium_insanium";
    this.name = hotm.names[this.id];
    this.position = 38;
    this.max_level = 50;
    this.upgrade_type = "mithril_powder";
    this.requires = ["mining_fortune", "mining_speed_boost"];
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.1));
  }

  perk(level) {
    const val = round(2 + level * 0.1, 1);
    return [`§7When mining Mithril Ore, you have a §a${val}%§7 chance to convert the block into Titanium Ore.`];
  }
}

class MiningFortune extends Node {
  constructor(data) {
    super(data);
    this.id = "mining_fortune";
    this.name = hotm.names[this.id];
    this.position = 39;
    this.max_level = 50;
    this.upgrade_type = "mithril_powder";
    this.requires = ["mining_speed"];
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.05));
  }

  perk(level) {
    const val = level * 5;
    return [`§7Grants §a+${val} §6${symbols.mining_fortune} Mining Fortune§7.`];
  }
}

class QuickForge extends Node {
  constructor(data) {
    super(data);
    this.id = "forge_time";
    this.name = hotm.names[this.id];
    this.position = 40;
    this.max_level = 20;
    this.upgrade_type = "mithril_powder";
    this.requires = ["mining_fortune", "pickaxe_toss"];
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 4));
  }

  perk(level) {
    const val = round(10 + 0.5 * level, 1);
    return [`§7Decreases the time it takes to forge by §a${val}%§7.`];
  }
}

class Pickobulus extends Node {
  constructor(data) {
    super(data);
    this.id = "pickaxe_toss";
    this.name = hotm.names[this.id];
    this.position = 41;
    this.max_level = 1;
    this.upgrade_type = null;
    this.requires = ["forge_time", "fallen_star_bonus"];
    this.type = "pickaxe_ability";
  }

  get upgradeCost() {
    return 0;
  }

  perk(level) {
    const radius = [2, 2, 3][this.pickaxeAbilityLevel - 1];
    const cooldown = [120, 120, 120][this.pickaxeAbilityLevel - 1];
    return [
      "§6Pickaxe Ability: Pickobulus",
      `§7Throw your pickaxe to create an explosion on impact, mining all ores within a §a${radius}§7 block radius.`,
      `§8Cooldown: §a${cooldown}s`,
      "",
      "§8Pickaxe Abilities apply to all of your pickaxes. You can select a Pickaxe Ability from your Heart of the Mountain.",
      "",
      "§8Upgrade your Pickaxe Abilities by unlocking §cPeak of the Mountain §8in this menu!",
    ];
  }
}

class MiningSpeed extends Node {
  constructor(data) {
    super(data);
    this.id = "mining_speed";
    this.name = hotm.names[this.id];
    this.position = 46;
    this.max_level = 50;
    this.upgrade_type = "mithril_powder";
    this.requires = [];
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3));
  }

  perk(level) {
    const val = level * 20;
    return [`§7Grants §a+${val} §6${symbols.mining_speed} Mining Speed§7.`];
  }
}

export const hotm = {
  hotm: HotM,
  tiers: Object.keys(hotm_rewards.tiers).length,
  tree_size: {
    columns: 7,
    rows: 7,
  },
  names: {
    mining_speed_2: "Mining Speed II",
    powder_buff: "Powder Buff",
    mining_fortune_2: "Mining Fortune II",
    vein_seeker: "Vein Seeker",
    lonesome_miner: "Lonesome Miner",
    professional: "Professional",
    mole: "Mole",
    fortunate: "Fortunate",
    great_explorer: "Great Explorer",
    maniac_miner: "Maniac Miner",
    goblin_killer: "Goblin Killer",
    special_0: "Peak of the Mountain",
    star_powder: "Star Powder",
    daily_effect: "Sky Mall",
    mining_madness: "Mining Madness",
    mining_experience: "Seasoned Mineman",
    efficient_miner: "Efficient Miner",
    experience_orbs: "Orbiter",
    front_loaded: "Front Loaded",
    precision_mining: "Precision Mining",
    random_event: "Luck of the Cave",
    daily_powder: "Daily Powder",
    fallen_star_bonus: "Crystallized",
    mining_speed_boost: "Mining Speed Boost",
    titanium_insanium: "Titanium Insanium",
    mining_fortune: "Mining Fortune",
    forge_time: "Quick Forge",
    pickaxe_toss: "Pickobulus",
    mining_speed: "Mining Speed",
  },
  nodes: {
    mining_speed_2: MiningSpeed2,
    powder_buff: PowderBuff,
    mining_fortune_2: MiningFortune2,
    vein_seeker: VeinSeeker,
    lonesome_miner: LonesomeMiner,
    professional: Professional,
    mole: Mole,
    fortunate: Fortunate,
    great_explorer: GreatExplorer,
    maniac_miner: ManiacMiner,
    goblin_killer: GoblinKiller,
    special_0: PeakOfTheMountain,
    star_powder: StarPowder,
    daily_effect: SkyMall,
    mining_madness: MiningMadness,
    mining_experience: SeasonedMineman,
    efficient_miner: EfficientMiner,
    experience_orbs: Orbiter,
    front_loaded: FrontLoaded,
    precision_mining: PrecisionMining,
    random_event: LuckOfTheCave,
    daily_powder: DailyPowder,
    fallen_star_bonus: Crystallized,
    mining_speed_boost: MiningSpeedBoost,
    titanium_insanium: TitaniumInsanium,
    mining_fortune: MiningFortune,
    forge_time: QuickForge,
    pickaxe_toss: Pickobulus,
    mining_speed: MiningSpeed,
  },
};
