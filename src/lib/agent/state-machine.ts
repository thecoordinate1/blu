export enum AgentState {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  REASONING = 'REASONING',
  DB_READ = 'DB_READ',
  DB_WRITE = 'DB_WRITE',
  RESPONDING = 'RESPONDING',
  ESCALATING = 'ESCALATING',
  PAUSED = 'PAUSED',
}

export type StateTransition = {
  from: AgentState;
  to: AgentState;
  timestamp: Date;
  metadata?: Record<string, any>;
};

export class AgentOrchestrator {
  private currentState: AgentState = AgentState.IDLE;
  private history: StateTransition[] = [];

  constructor(private conversationId: string) {}

  public async transition(to: AgentState, metadata?: Record<string, any>): Promise<void> {
    const valid = this.validateTransition(this.currentState, to);
    if (!valid) {
      throw new Error(`Invalid transition from ${this.currentState} to ${to}`);
    }

    this.history.push({
      from: this.currentState,
      to,
      timestamp: new Date(),
      metadata,
    });

    this.currentState = to;
    console.log(`[Agent Machine] [${this.conversationId}] Transition: ${to}`);
    // Here we would sync with Redis if in production
  }

  private validateTransition(from: AgentState, to: AgentState): boolean {
    // Exhaustive state transition rules
    const transitions: Record<AgentState, AgentState[]> = {
      [AgentState.IDLE]: [AgentState.PARSING, AgentState.PAUSED],
      [AgentState.PARSING]: [AgentState.REASONING, AgentState.ESCALATING, AgentState.RESPONDING],
      [AgentState.REASONING]: [AgentState.DB_READ, AgentState.DB_WRITE, AgentState.RESPONDING, AgentState.ESCALATING],
      [AgentState.DB_READ]: [AgentState.REASONING, AgentState.RESPONDING],
      [AgentState.DB_WRITE]: [AgentState.REASONING, AgentState.RESPONDING],
      [AgentState.RESPONDING]: [AgentState.IDLE, AgentState.ESCALATING],
      [AgentState.ESCALATING]: [AgentState.IDLE],
      [AgentState.PAUSED]: [AgentState.IDLE],
    };

    return transitions[from].includes(to);
  }

  public getState(): AgentState {
    return this.currentState;
  }
}
