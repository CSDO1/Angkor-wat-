import * as THREE from 'three';
import { AngkorEnvironment } from '../environment/AngkorEnvironment.js';
import { Vegetation } from '../environment/Vegetation.js';
import { WaterSystem } from '../environment/Water.js';
import { Wildlife } from '../environment/Wildlife.js';
import { worldMaterial } from '../materials/WorldShading.js';

/**
 * Scene / level manager. Loads the Angkor Wat level once (environment chunks, collision, stairs,
 * water, vegetation, wildlife) and keeps it resident for the whole session. Vegetation streams in
 * asynchronously after the architecture so the title screen appears sooner.
 */
export class SceneManager {
  constructor(game) {
    this.game = game;
    this.loaded = false;
  }

  async load(progress) {
    const g = this.game;
    const env = new AngkorEnvironment(g.scene);
    await env.load((p) => progress(0.05 + p * 0.6, 'loading.env'));
    g.environment = env;
    g.levelData = env.level;
    g.collision.setGeometry(env.collisionGeometry);
    g.collision.setStairs(env.level.stairs);
    progress(0.7, 'loading.world');

    g.materials = {
      plinth: worldMaterial(new THREE.MeshStandardMaterial({ color: 0x7a6a52, roughness: 0.95 })),
    };
    g.water = new WaterSystem(g.scene, env.level);
    g.wildlife = new Wildlife(g.scene, g);

    // vegetation in the background — the game can start before it finishes
    g.vegetation = new Vegetation(g.scene, g.collision);
    this.vegetationReady = g.vegetation.load().then(() => {
      g.applySettings();
      progress(1, 'loading.veg');
    });
    await this.vegetationReady;   // (cheap: ~2 MB) wait so trunk colliders exist before play
    this.loaded = true;
    return this;
  }
}
