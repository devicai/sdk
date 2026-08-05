import type { DevicApiClient } from '../client.js';
import type {
  AssistantSpecialization,
  AsyncResponse,
  ChatHistory,
  ChatMessage,
  FeedbackEntry,
  FeedbackSubmission,
  ListConversationsResponse,
  ProcessMessageDto,
  RealtimeChatHistory,
  ToolCallResponse,
} from '../types.js';
import { withScope, type Scope } from '../scope.js';

/**
 * Assistants and the conversations held with them.
 *
 * Names read as what you are doing rather than as the HTTP call underneath:
 * `chat` instead of `sendMessage`, `conversations.list` instead of
 * `listConversations`. The client below keeps the older names, so the CLI —
 * which speaks that language in its own commands — is not forced to change
 * vocabulary to adopt this package.
 */
export class Assistants {
  constructor(
    private readonly client: DevicApiClient,
    private readonly scope: Scope,
  ) {}

  /** Every assistant in the workspace. `external` narrows to the publishable ones. */
  list(opts?: {
    external?: boolean;
    projectId?: string;
  }): Promise<AssistantSpecialization[]> {
    return this.client.getAssistants(opts?.external ?? false, opts?.projectId);
  }

  get(identifier: string): Promise<AssistantSpecialization> {
    return this.client.getAssistant(identifier);
  }

  create(data: Record<string, unknown>): Promise<AssistantSpecialization> {
    return this.client.createAssistant(data);
  }

  update(
    identifier: string,
    data: Record<string, unknown>,
  ): Promise<AssistantSpecialization> {
    return this.client.updateAssistant(identifier, data);
  }

  delete(identifier: string): Promise<unknown> {
    return this.client.deleteAssistant(identifier);
  }

  /**
   * Sends a message and waits for the reply.
   *
   * The scope's tenant is filled in here, which is the reason this wrapper
   * exists at all: a message that forgets its tenant is attributed to the
   * workspace, and no error is ever raised about it.
   */
  chat(
    assistantId: string,
    message: string | ProcessMessageDto,
    signal?: AbortSignal,
  ): Promise<ChatMessage[]> {
    return this.client.sendMessage(assistantId, this.dto(message), signal);
  }

  /** Starts the reply and returns immediately with the conversation id. */
  chatAsync(
    assistantId: string,
    message: string | ProcessMessageDto,
  ): Promise<AsyncResponse> {
    return this.client.sendMessageAsync(assistantId, this.dto(message));
  }

  /** Answers tool calls the assistant is waiting on. */
  respondToTools(
    assistantId: string,
    chatUid: string,
    responses: ToolCallResponse[],
  ): Promise<unknown> {
    return this.client.sendToolResponses(assistantId, chatUid, responses);
  }

  readonly conversations = {
    list: (
      assistantId: string,
      opts?: { offset?: number; limit?: number; omitContent?: boolean },
    ): Promise<ListConversationsResponse> =>
      this.client.listConversations(
        assistantId,
        withScope(this.scope, opts),
      ) as Promise<ListConversationsResponse>,

    get: (assistantId: string, chatUid: string): Promise<ChatHistory> =>
      this.client.getChatHistory(assistantId, chatUid),

    /** What the assistant is doing right now, mid-answer. */
    live: (
      assistantId: string,
      chatUid: string,
    ): Promise<RealtimeChatHistory> =>
      this.client.getRealtimeHistory(assistantId, chatUid),

    search: (
      filters: Record<string, unknown>,
      opts?: { offset?: number; limit?: number; omitContent?: boolean },
    ): Promise<unknown> =>
      // Spread rather than `withScope`: the filter bag is open-ended, and an
      // explicit filter must still win over the scope's default.
      this.client.searchChats({ ...this.scope, ...filters }, opts),

    stop: (
      assistantId: string,
      chatUid: string,
    ): Promise<{ chatUid: string; message: string }> =>
      this.client.stopChat(assistantId, chatUid),

    feedback: {
      submit: (
        assistantId: string,
        chatUid: string,
        data: FeedbackSubmission,
      ): Promise<FeedbackEntry> =>
        this.client.submitChatFeedback(assistantId, chatUid, data),

      list: (assistantId: string, chatUid: string): Promise<FeedbackEntry[]> =>
        this.client.getChatFeedback(assistantId, chatUid),
    },
  };

  /** A bare string is the common case; the full DTO stays available. */
  private dto(message: string | ProcessMessageDto): ProcessMessageDto {
    const base: ProcessMessageDto =
      typeof message === 'string' ? { message } : message;
    return withScope(this.scope, base);
  }
}
