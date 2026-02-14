import type { Payload, EventProperties } from "../types";

export type EventPriority = "high" | "normal" | "low";

export interface PriorityEvent<T extends EventProperties = EventProperties> extends Payload<T> {
  priority: EventPriority;
}

export class PriorityQueue<T extends EventProperties = EventProperties> {
  private high: PriorityEvent<T>[] = [];
  private normal: PriorityEvent<T>[] = [];
  private low: PriorityEvent<T>[] = [];

  push(event: Payload<T>, priority: EventPriority = "normal"): void {
    const priorityEvent: PriorityEvent<T> = { ...event, priority };
    this[priority].push(priorityEvent);
  }

  pop(): PriorityEvent<T> | undefined {
    if (this.high.length > 0) return this.high.shift();
    if (this.normal.length > 0) return this.normal.shift();
    return this.low.shift();
  }

  peek(): PriorityEvent<T> | undefined {
    if (this.high.length > 0) return this.high[0];
    if (this.normal.length > 0) return this.normal[0];
    return this.low[0];
  }

  size(): number {
    return this.high.length + this.normal.length + this.low.length;
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }

  clear(): void {
    this.high = [];
    this.normal = [];
    this.low = [];
  }

  getBatch(size: number): PriorityEvent<T>[] {
    const batch: PriorityEvent<T>[] = [];

    while (batch.length < size && !this.isEmpty()) {
      const event = this.pop();
      if (event) {
        batch.push(event);
      }
    }

    return batch;
  }

  getStats(): {
    high: number;
    normal: number;
    low: number;
    total: number;
  } {
    return {
      high: this.high.length,
      normal: this.normal.length,
      low: this.low.length,
      total: this.size(),
    };
  }
}

export function determineEventPriority(event: string): EventPriority {
  const highPriorityEvents = ["js_error", "promise_error", "session_start", "session_end"];
  const lowPriorityEvents = ["scroll", "page_view", "performance"];

  if (highPriorityEvents.includes(event)) {
    return "high";
  }

  if (lowPriorityEvents.includes(event)) {
    return "low";
  }

  return "normal";
}
