import * as THREE from "three";



const TEXTURE_OVERRIDES = {
  grass_block: {
    top: "grass_block_top",
    side: "grass_block_side",
    bottom: "dirt",
  },
  dirt: { all: "dirt" },
  stone: { all: "stone" },
  cobblestone: { all: "cobblestone" },
  oak_planks: { all: "oak_planks" },
  spruce_planks: { all: "spruce_planks" },
  birch_planks: { all: "birch_planks" },
  jungle_planks: { all: "jungle_planks" },
  acacia_planks: { all: "acacia_planks" },
  dark_oak_planks: { all: "dark_oak_planks" },
  oak_log: { top: "oak_log_top", side: "oak_log", bottom: "oak_log_top" },
  spruce_log: {
    top: "spruce_log_top",
    side: "spruce_log",
    bottom: "spruce_log_top",
  },
  birch_log: {
    top: "birch_log_top",
    side: "birch_log",
    bottom: "birch_log_top",
  },
  jungle_log: {
    top: "jungle_log_top",
    side: "jungle_log",
    bottom: "jungle_log_top",
  },
  acacia_log: {
    top: "acacia_log_top",
    side: "acacia_log",
    bottom: "acacia_log_top",
  },
  dark_oak_log: {
    top: "dark_oak_log_top",
    side: "dark_oak_log",
    bottom: "dark_oak_log_top",
  },
  sand: { all: "sand" },
  red_sand: { all: "red_sand" },
  gravel: { all: "gravel" },
  iron_ore: { all: "iron_ore" },
  gold_ore: { all: "gold_ore" },
  coal_ore: { all: "coal_ore" },
  diamond_ore: { all: "diamond_ore" },
  emerald_ore: { all: "emerald_ore" },
  lapis_ore: { all: "lapis_ore" },
  redstone_ore: { all: "redstone_ore" },
  iron_block: { all: "iron_block" },
  gold_block: { all: "gold_block" },
  diamond_block: { all: "diamond_block" },
  emerald_block: { all: "emerald_block" },
  lapis_block: { all: "lapis_block" },
  redstone_block: { all: "redstone_block" },
  oak_leaves: { all: "oak_leaves" },
  spruce_leaves: { all: "spruce_leaves" },
  birch_leaves: { all: "birch_leaves" },
  jungle_leaves: { all: "jungle_leaves" },
  acacia_leaves: { all: "acacia_leaves" },
  dark_oak_leaves: { all: "dark_oak_leaves" },
  bedrock: { all: "bedrock" },
  obsidian: { all: "obsidian" },
  netherrack: { all: "netherrack" },
  soul_sand: { all: "soul_sand" },
  glowstone: { all: "glowstone" },
  sandstone: {
    top: "sandstone_top",
    side: "sandstone",
    bottom: "sandstone_bottom",
  },
  snow_block: { all: "snow" },
  snow: { all: "snow" },
  ice: { all: "ice" },
  clay: { all: "clay" },
  glass: { all: "glass" },
  bricks: { all: "bricks" },
  bookshelf: { top: "oak_planks", side: "bookshelf", bottom: "oak_planks" },
  mossy_cobblestone: { all: "mossy_cobblestone" },
  crafting_table: {
    top: "crafting_table_top",
    side: "crafting_table_side",
    bottom: "oak_planks",
  },
  furnace: {
    top: "furnace_top",
    side: "furnace_side",
    bottom: "furnace_top",
    front: "furnace_front",
  },
  tnt: { top: "tnt_top", side: "tnt_side", bottom: "tnt_bottom" },
  melon: { top: "melon_top", side: "melon_side", bottom: "melon_top" },
  pumpkin: { top: "pumpkin_top", side: "pumpkin_side", bottom: "pumpkin_top" },
  deepslate: {
    top: "deepslate_top",
    side: "deepslate",
    bottom: "deepslate_top",
  },
  copper_ore: { all: "copper_ore" },
  deepslate_iron_ore: { all: "deepslate_iron_ore" },
  deepslate_gold_ore: { all: "deepslate_gold_ore" },
  deepslate_diamond_ore: { all: "deepslate_diamond_ore" },
  deepslate_coal_ore: { all: "deepslate_coal_ore" },
  deepslate_copper_ore: { all: "deepslate_copper_ore" },
  deepslate_emerald_ore: { all: "deepslate_emerald_ore" },
  deepslate_lapis_ore: { all: "deepslate_lapis_ore" },
  deepslate_redstone_ore: { all: "deepslate_redstone_ore" },
  andesite: { all: "andesite" },
  diorite: { all: "diorite" },
  granite: { all: "granite" },
  smooth_stone: { all: "smooth_stone" },
  stone_bricks: { all: "stone_bricks" },
  mossy_stone_bricks: { all: "mossy_stone_bricks" },
  cracked_stone_bricks: { all: "cracked_stone_bricks" },
  cobbled_deepslate: { all: "cobbled_deepslate" },
  water: { all: "water_still" },
  lava: { all: "lava_still" },
};


const SKIP_BLOCKS = new Set([
  "air",
  "cave_air",
  "void_air",
  "barrier",
  "tall_grass",
  "short_grass",
  "grass",
  "fern",
  "large_fern",
  "dandelion",
  "poppy",
  "blue_orchid",
  "allium",
  "azure_bluet",
  "red_tulip",
  "orange_tulip",
  "white_tulip",
  "pink_tulip",
  "oxeye_daisy",
  "cornflower",
  "lily_of_the_valley",
  "wither_rose",
  "sunflower",
  "lilac",
  "rose_bush",
  "peony",
  "torch",
  "wall_torch",
  "soul_torch",
  "soul_wall_torch",
  "redstone_torch",
  "redstone_wall_torch",
  "rail",
  "powered_rail",
  "detector_rail",
  "activator_rail",
  "lever",
  "stone_button",
  "oak_button",
  "sign",
  "oak_sign",
  "oak_wall_sign",
  "ladder",
  "vine",
  "wheat",
  "carrots",
  "potatoes",
  "beetroots",
  "sugar_cane",
  "bamboo",
  "cactus",
  "dead_bush",
  "seagrass",
  "tall_seagrass",
  "kelp",
  "fire",
  "soul_fire",
  "redstone_wire",
]);

export class TextureAtlas {
  constructor() {
    this.atlasCanvas = null;
    this.atlasTexture = null;
    this.uvMap = {}; 
    this.textureSize = 16; 
    this.atlasSize = 0;
    this.ready = false;
    this.loadedTextures = new Map(); 
  }

  async loadTextures() {
    
    const textureNames = new Set();

    for (const mapping of Object.values(TEXTURE_OVERRIDES)) {
      if (mapping.all) {
        textureNames.add(mapping.all);
      } else {
        if (mapping.top) textureNames.add(mapping.top);
        if (mapping.side) textureNames.add(mapping.side);
        if (mapping.bottom) textureNames.add(mapping.bottom);
        if (mapping.front) textureNames.add(mapping.front);
      }
    }

    
    const loadPromises = [];
    for (const name of textureNames) {
      loadPromises.push(this.loadSingleTexture(name));
    }

    await Promise.allSettled(loadPromises);

    
    this.buildAtlas();
    this.ready = true;
    return this;
  }

  async loadSingleTexture(name) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.loadedTextures.set(name, img);
        resolve(img);
      };
      img.onerror = () => {
        
        reject(new Error(`Failed to load texture: ${name}`));
      };
      img.src = `/textures/block/${name}.png`;
    });
  }

  buildAtlas() {
    const textureCount = this.loadedTextures.size;
    if (textureCount === 0) {
      console.warn("No textures loaded!");
      return;
    }

    
    const gridSize = Math.ceil(Math.sqrt(textureCount));
    this.atlasSize = gridSize * this.textureSize;

    
    this.atlasCanvas = document.createElement("canvas");
    this.atlasCanvas.width = this.atlasSize;
    this.atlasCanvas.height = this.atlasSize;
    const ctx = this.atlasCanvas.getContext("2d");

    
    let index = 0;
    const texturePositions = new Map();

    for (const [name, img] of this.loadedTextures) {
      const col = index % gridSize;
      const row = Math.floor(index / gridSize);
      const x = col * this.textureSize;
      const y = row * this.textureSize;

      ctx.drawImage(
        img,
        0,
        0,
        this.textureSize,
        this.textureSize,
        x,
        y,
        this.textureSize,
        this.textureSize,
      );

      texturePositions.set(name, {
        u: x / this.atlasSize,
        v: 1 - (y + this.textureSize) / this.atlasSize, 
        w: this.textureSize / this.atlasSize,
        h: this.textureSize / this.atlasSize,
      });

      index++;
    }

    
    for (const [blockName, mapping] of Object.entries(TEXTURE_OVERRIDES)) {
      if (mapping.all) {
        const uv = texturePositions.get(mapping.all);
        if (uv) {
          this.uvMap[blockName] = { top: uv, side: uv, bottom: uv };
        }
      } else {
        const top = texturePositions.get(mapping.top);
        const side = texturePositions.get(mapping.side);
        const bottom = texturePositions.get(mapping.bottom);
        if (top || side || bottom) {
          this.uvMap[blockName] = {
            top: top || side,
            side: side || top,
            bottom: bottom || top,
          };
        }
      }
    }

    
    this.atlasTexture = new THREE.CanvasTexture(this.atlasCanvas);
    this.atlasTexture.magFilter = THREE.NearestFilter;
    this.atlasTexture.minFilter = THREE.NearestFilter;
    this.atlasTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.atlasTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.atlasTexture.colorSpace = THREE.SRGBColorSpace;

    console.log(
      `Texture atlas built: ${gridSize}x${gridSize} grid, ${textureCount} textures, ${this.atlasSize}x${this.atlasSize}px`,
    );
  }

  getUV(blockName) {
    if (!blockName) return null;
    if (this.uvMap[blockName]) return this.uvMap[blockName];

    
    let baseName = blockName
      .replace("_stairs", "")
      .replace("_slab", "")
      .replace("_wall", "")
      .replace("_fence_gate", "")
      .replace("_fence", "")
      .replace("_door", "")
      .replace("_trapdoor", "")
      .replace("_pressure_plate", "")
      .replace("_button", "");

    if (baseName !== blockName) {
      const woods = [
        "oak",
        "spruce",
        "birch",
        "jungle",
        "acacia",
        "dark_oak",
        "crimson",
        "warped",
        "mangrove",
        "cherry",
      ];
      if (woods.includes(baseName)) {
        if (blockName.includes("door") && !blockName.includes("trapdoor")) {
          baseName = `${baseName}_door_top`;
        } else if (blockName.includes("trapdoor")) {
          baseName = `${baseName}_trapdoor`;
        } else {
          baseName = `${baseName}_planks`;
        }
      }
      
      if (baseName === "stone_brick") baseName = "stone_bricks";
      if (baseName === "nether_brick") baseName = "nether_bricks";
      if (baseName === "quartz") baseName = "quartz_block_side";
      if (baseName === "purpur") baseName = "purpur_block";
      if (baseName === "sandstone") baseName = "sandstone_top"; 

      if (this.uvMap[baseName]) {
        return this.uvMap[baseName];
      }
    }

    return null;
  }

  
  async resolveUnknownBlock(blockName) {
    if (this.uvMap[blockName]) return this.uvMap[blockName];

    
    try {
      await this.loadSingleTexture(blockName);
      this.buildAtlas();
      TEXTURE_OVERRIDES[blockName] = { all: blockName };
      this.buildAtlas();
      return this.uvMap[blockName];
    } catch {
      
      const variations = [
        `${blockName}_top`,
        `${blockName}_front`,
        `${blockName}_side`,
      ];
      for (const v of variations) {
        try {
          await this.loadSingleTexture(v);
          this.buildAtlas();
          TEXTURE_OVERRIDES[blockName] = { all: v };
          this.buildAtlas();
          return this.uvMap[blockName];
        } catch (e) {}
      }
      return null;
    }
  }
}

export function isSkipBlock(name) {
  return SKIP_BLOCKS.has(name);
}

export function isTransparent(name) {
  if (!name) return true;
  const lower = name.toLowerCase();
  return (
    SKIP_BLOCKS.has(name) ||
    lower.includes("glass") ||
    lower.includes("leaves") ||
    lower.includes("water") ||
    lower.includes("ice") ||
    lower.includes("door") ||
    lower.includes("fence") ||
    lower.includes("slab") ||
    lower.includes("stairs")
  );
}
