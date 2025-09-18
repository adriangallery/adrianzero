// Roadmap Data - Organized by numbers for easy reordering
// Each item has a number for organizational purposes (not visible to users)
const roadmapData = [
  {
    id: 1,
    title: "ADRIANGALLERY: GENESIS (Free Drop)",
    subtitle: "Start",
    description: "The spark. 50 untouchables, free mint, pure lore. Day 1 believers get bragging rights forever.",
    status: "completed", // completed, in-progress, future
    category: "genesis"
  },
  {
    id: 2,
    title: "Utility NFTs – The Tax Reaper & Co.",
    subtitle: "Core Infrastructure",
    description: "Not just pictures. Some pieces siphon fees, share auction spoils, or unlock weird perks. Touch grass? No—touch yield.",
    status: "completed",
    category: "utility"
  },
  {
    id: 3,
    title: "$ADRIAN LP",
    subtitle: "Liquidity",
    description: "Liquidity online, chaos contained. The pond where degens and believers splash together.",
    status: "completed",
    category: "liquidity"
  },
  {
    id: 4,
    title: "AdrianAuctions",
    subtitle: "Marketplace",
    description: "English, Dutch, and Boosted™ formats. After the hammer: peer-to-peer madness so anyone can list, bid, and flip.",
    status: "completed",
    category: "marketplace"
  },
  {
    id: 5,
    title: "Artist Commissions: Akashi + Tomo",
    subtitle: "Curated Art",
    description: "Hand-picked killers. Curated drops that level up the gallery's soul (and your flex).",
    status: "completed",
    category: "art"
  },
  {
    id: 6,
    title: "AdrianPunks (1,000) – Mint with $ADRIAN",
    subtitle: "Collection Launch",
    description: "Pixelated mayhem. Your entry ticket to the toybox.",
    status: "completed",
    category: "collection"
  },
  {
    id: 7,
    title: "PunkQuest (Soft-Staking)",
    subtitle: "Staking System",
    description: "Park your punk, earn journeys, unlock goodies—no lockups, just vibes.",
    status: "completed",
    category: "staking"
  },
  {
    id: 8,
    title: "AdrianLAB (Modules, Renders, Contracts)",
    subtitle: "Development Platform",
    description: "The factory. ERCs, traits, packs, renders, admin panels—20+ modules stitched into one living machine.",
    status: "completed",
    category: "development"
  },
  {
    id: 9,
    title: "Toggled Adrians",
    subtitle: "Dynamic Traits",
    description: "One token, many looks. Flip traits on/off like a light switch; curate your identity in real time.",
    status: "completed",
    category: "traits"
  },
  {
    id: 10,
    title: "AdrianZERO (ERC721)",
    subtitle: "Living Collection",
    description: "The \"living\" collection. Story-driven, trait-reactive characters that evolve with the ecosystem.",
    status: "completed",
    category: "collection"
  },
  {
    id: 11,
    title: "USB for Collabs",
    subtitle: "Collaboration Tool",
    description: "A universal pass for partnered drops. Plug in allowlists, batch mints, and shared lore. Click—installed.",
    status: "completed",
    category: "collaboration"
  },
  {
    id: 12,
    title: "Floppy Discs & Action Packs",
    subtitle: "Loot System",
    description: "Loot you can actually use. Pop a floppy, crack a pack, roll new traits—risk, reward, repeat.",
    status: "completed",
    category: "loot"
  },
  {
    id: 13,
    title: "$ADRIAN IP",
    subtitle: "Open Brand",
    description: "Open, remixable, culture-first. Use the brand, build your thing, grow the pie.",
    status: "completed",
    category: "brand"
  },
  {
    id: 14,
    title: "ZERO OG TraitCard Claim",
    subtitle: "Early Access",
    description: "Early believers pull their OG cards. Batch claim, instant clout, on-chain receipts.",
    status: "in-progress",
    category: "claim"
  },
  {
    id: 15,
    title: "AdrianAdventure (Point-and-Click)",
    subtitle: "Gaming",
    description: "A cyber-retro story mode. Solve puzzles, find loot, gate rooms with NFTs—Monkey Island meets Web3.",
    status: "future",
    category: "gaming"
  },
  {
    id: 16,
    title: "Merch",
    subtitle: "Physical Products",
    description: "Wear the meme. From subtle flex to full degen uniform—IRL drip for URL heads.",
    status: "future",
    category: "merch"
  }
];

// Helper function to get items by status
function getItemsByStatus(status) {
  return roadmapData.filter(item => item.status === status);
}

// Helper function to get items by category
function getItemsByCategory(category) {
  return roadmapData.filter(item => item.category === category);
}

// Helper function to reorder items (for future use)
function reorderItems(newOrder) {
  // newOrder should be an array of item IDs in the desired order
  const reordered = [];
  newOrder.forEach(id => {
    const item = roadmapData.find(item => item.id === id);
    if (item) reordered.push(item);
  });
  return reordered;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { roadmapData, getItemsByStatus, getItemsByCategory, reorderItems };
}
