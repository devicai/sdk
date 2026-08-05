import type { DevicApiClient } from '../client.js';
import type { AgentDto, AgentThreadDto, FeedbackEntry, FeedbackSubmission } from '../types.js';
import { withScope, type Scope } from '../scope.js';

/** Agents and the runs (threads) they carry out. */
export class Agents {
  constructor(
    private readonly client: DevicApiClient,
    private readonly scope: Scope,
  ) {}

  list(opts?: {
    offset?: number;
    limit?: number;
    archived?: boolean;
    projectId?: string;
  }): Promise<unknown> {
    return this.client.listAgents(opts);
  }

  get(agentId: string): Promise<AgentDto> {
    return this.client.getAgent(agentId);
  }

  create(data: Record<string, unknown>): Promise<AgentDto> {
    return this.client.createAgent(data);
  }

  update(agentId: string, data: Record<string, unknown>): Promise<AgentDto> {
    return this.client.updateAgent(agentId, data);
  }

  delete(agentId: string): Promise<unknown> {
    return this.client.deleteAgent(agentId);
  }

  readonly runs = {
    /** Starts an agent on a task. The scope's tenant comes along. */
    start: (
      agentId: string,
      task:
        | string
        | { message: string; tags?: string[]; metadata?: Record<string, unknown> },
    ): Promise<unknown> => {
      const base: {
        message: string;
        tags?: string[];
        metadata?: Record<string, unknown>;
      } & Scope = typeof task === 'string' ? { message: task } : task;
      return this.client.createThread(agentId, withScope(this.scope, base));
    },

    list: (
      agentId: string,
      opts?: {
        offset?: number;
        limit?: number;
        state?: string;
        startDate?: string;
        endDate?: string;
        dateOrder?: string;
        tags?: string;
        omitContent?: boolean;
      },
    ): Promise<unknown> =>
      this.client.listThreads(agentId, withScope(this.scope, opts)),

    get: (threadId: string, withTasks = false): Promise<AgentThreadDto> =>
      this.client.getThread(threadId, withTasks),

    update: (threadId: string, data: Record<string, unknown>): Promise<unknown> =>
      this.client.updateThread(threadId, data),

    /** Answers a run waiting for a human decision. */
    approve: (threadId: string, message?: string): Promise<unknown> =>
      this.client.handleApproval(threadId, true, message),

    reject: (
      threadId: string,
      message?: string,
      opts?: { retry?: boolean },
    ): Promise<unknown> =>
      this.client.handleApproval(threadId, false, message, opts?.retry),

    /** Ends a run by hand, in the state given. */
    complete: (threadId: string, state: string): Promise<unknown> =>
      this.client.completeThread(threadId, state),

    pause: (threadId: string): Promise<unknown> =>
      this.client.pauseThread(threadId),

    resume: (threadId: string): Promise<unknown> =>
      this.client.resumeThread(threadId),

    evaluate: (threadId: string): Promise<unknown> =>
      this.client.evaluateThread(threadId),

    evaluation: (threadId: string): Promise<unknown> =>
      this.client.getThreadEvaluation(threadId),

    feedback: {
      submit: (
        threadId: string,
        data: FeedbackSubmission,
      ): Promise<FeedbackEntry> =>
        this.client.submitThreadFeedback(threadId, data),

      list: (threadId: string): Promise<FeedbackEntry[]> =>
        this.client.getThreadFeedback(threadId),
    },
  };

  /** What an agent has cost. Workspace figures — not a tenant's own. */
  readonly costs = {
    daily: (agentId: string, opts?: Record<string, unknown>): Promise<unknown> =>
      this.client.getDailyCosts(agentId, opts as never),

    monthly: (agentId: string, opts?: Record<string, unknown>): Promise<unknown> =>
      this.client.getMonthlyCosts(agentId, opts as never),

    summary: (agentId: string): Promise<unknown> =>
      this.client.getCostSummary(agentId),
  };
}
