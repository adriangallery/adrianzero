/**
 * Sistema de verbos/acciones
 * 
 * Maneja los verbos disponibles (LOOK, USE, TALK, PICK, OPEN, CLOSE, WALK)
 */

export interface Verb {
  id: string;
  label: string;
  icon?: string;
  isMovement: boolean;
  priority: number;
  mobileQuickSlot: boolean;
}

export interface VerbRules {
  tapHotspotWhenWalkSelected: 'moveToAndInteract' | 'interactOnly';
  tapEmptyWhenVerbSelected: 'moveIfWalkableElsePan' | 'doNothing';
  inventoryUseMode: 'itemOnHotspot' | 'itemOnItem';
  interactionFallback: {
    onMissingVerbScript: Array<{ op: string; [key: string]: any }>;
  };
}

export class VerbSystem {
  private verbs: Map<string, Verb> = new Map();
  private defaultVerb: string = 'WALK';
  private rules: VerbRules;
  private selectedVerb: string;

  constructor(verbs: Verb[], rules: VerbRules) {
    this.rules = rules;
    this.selectedVerb = this.defaultVerb;

    // Registrar verbos
    verbs.forEach(verb => {
      this.verbs.set(verb.id, verb);
    });

    // Validar que el default verb existe
    if (!this.verbs.has(this.defaultVerb)) {
      console.warn(`⚠️ Default verb "${this.defaultVerb}" no existe`);
    }
  }

  /**
   * Obtener verbo por ID
   */
  getVerb(verbId: string): Verb | undefined {
    return this.verbs.get(verbId);
  }

  /**
   * Obtener verbo seleccionado
   */
  getSelectedVerb(): Verb | undefined {
    return this.getVerb(this.selectedVerb);
  }

  /**
   * Seleccionar verbo
   */
  selectVerb(verbId: string): boolean {
    if (!this.verbs.has(verbId)) {
      console.warn(`⚠️ Verbo desconocido: ${verbId}`);
      return false;
    }

    this.selectedVerb = verbId;
    return true;
  }

  /**
   * Resetear a verbo por defecto
   */
  resetToDefault(): void {
    this.selectedVerb = this.defaultVerb;
  }

  /**
   * Verificar si el verbo seleccionado es de movimiento
   */
  isMovementVerb(): boolean {
    const verb = this.getSelectedVerb();
    return verb?.isMovement || false;
  }

  /**
   * Obtener todos los verbos
   */
  getAllVerbs(): Verb[] {
    return Array.from(this.verbs.values()).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Obtener verbos para quick slots móviles
   */
  getMobileQuickSlotVerbs(): Verb[] {
    return this.getAllVerbs().filter(v => v.mobileQuickSlot);
  }

  /**
   * Obtener reglas
   */
  getRules(): VerbRules {
    return this.rules;
  }

  /**
   * Obtener script de fallback para verbo faltante
   */
  getFallbackScript(): Array<{ op: string; [key: string]: any }> {
    return this.rules.interactionFallback.onMissingVerbScript;
  }
}

