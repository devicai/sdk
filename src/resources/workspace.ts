import type { DevicApiClient } from '../client.js';

/**
 * The parts of the platform an operator configures, as opposed to the parts an
 * end user talks to: tool servers, projects, documents, skills, triggers and
 * the workspace-wide integrations.
 *
 * Every method delegates straight through, and takes the client's own
 * parameters via `Parameters<…>` rather than restating them. Restating 60
 * signatures is 60 chances to drift from the thing being wrapped — and a
 * wrapper whose types have drifted is worse than no wrapper, because it
 * compiles.
 *
 * A tenant does not appear here: none of these are a tenant's to configure.
 */

type Args<M extends keyof DevicApiClient> = DevicApiClient[M] extends (
  ...args: infer P
) => unknown
  ? P
  : never;
type Result<M extends keyof DevicApiClient> = DevicApiClient[M] extends (
  ...args: never[]
) => infer R
  ? R
  : never;

export class ToolServers {
  constructor(private readonly c: DevicApiClient) {}

  list = (...a: Args<'listToolServers'>): Result<'listToolServers'> =>
    this.c.listToolServers(...a);
  get = (...a: Args<'getToolServer'>): Result<'getToolServer'> =>
    this.c.getToolServer(...a);
  create = (...a: Args<'createToolServer'>): Result<'createToolServer'> =>
    this.c.createToolServer(...a);
  update = (...a: Args<'updateToolServer'>): Result<'updateToolServer'> =>
    this.c.updateToolServer(...a);
  delete = (...a: Args<'deleteToolServer'>): Result<'deleteToolServer'> =>
    this.c.deleteToolServer(...a);
  clone = (...a: Args<'cloneToolServer'>): Result<'cloneToolServer'> =>
    this.c.cloneToolServer(...a);

  /** The MCP definition behind a server. */
  definition = (
    ...a: Args<'getToolServerDefinition'>
  ): Result<'getToolServerDefinition'> => this.c.getToolServerDefinition(...a);
  updateDefinition = (
    ...a: Args<'updateToolServerDefinition'>
  ): Result<'updateToolServerDefinition'> =>
    this.c.updateToolServerDefinition(...a);

  readonly tools = {
    list: (...a: Args<'listTools'>): Result<'listTools'> =>
      this.c.listTools(...a),
    get: (...a: Args<'getTool'>): Result<'getTool'> => this.c.getTool(...a),
    add: (...a: Args<'addTool'>): Result<'addTool'> => this.c.addTool(...a),
    update: (...a: Args<'updateTool'>): Result<'updateTool'> =>
      this.c.updateTool(...a),
    delete: (...a: Args<'deleteTool'>): Result<'deleteTool'> =>
      this.c.deleteTool(...a),
    /** Runs a tool once, without an assistant in the middle. */
    test: (...a: Args<'testTool'>): Result<'testTool'> => this.c.testTool(...a),
  };
}

export class Projects {
  constructor(private readonly c: DevicApiClient) {}

  list = (...a: Args<'listProjects'>): Result<'listProjects'> =>
    this.c.listProjects(...a);
  get = (...a: Args<'getProject'>): Result<'getProject'> =>
    this.c.getProject(...a);
  create = (...a: Args<'createProject'>): Result<'createProject'> =>
    this.c.createProject(...a);
  update = (...a: Args<'updateProject'>): Result<'updateProject'> =>
    this.c.updateProject(...a);
  archive = (...a: Args<'archiveProject'>): Result<'archiveProject'> =>
    this.c.archiveProject(...a);

  runs = (...a: Args<'getProjectThreads'>): Result<'getProjectThreads'> =>
    this.c.getProjectThreads(...a);
  conversations = (
    ...a: Args<'getProjectConversations'>
  ): Result<'getProjectConversations'> => this.c.getProjectConversations(...a);
  stats = (...a: Args<'getProjectStats'>): Result<'getProjectStats'> =>
    this.c.getProjectStats(...a);

  readonly costs = {
    daily: (
      ...a: Args<'getProjectDailyCosts'>
    ): Result<'getProjectDailyCosts'> => this.c.getProjectDailyCosts(...a),
    monthly: (
      ...a: Args<'getProjectMonthlyCosts'>
    ): Result<'getProjectMonthlyCosts'> => this.c.getProjectMonthlyCosts(...a),
  };
}

export class Documents {
  constructor(private readonly c: DevicApiClient) {}

  list = (...a: Args<'listDocuments'>): Result<'listDocuments'> =>
    this.c.listDocuments(...a);
  get = (...a: Args<'getDocument'>): Result<'getDocument'> =>
    this.c.getDocument(...a);
  createMarkdown = (
    ...a: Args<'createMarkdownDocument'>
  ): Result<'createMarkdownDocument'> => this.c.createMarkdownDocument(...a);
  update = (...a: Args<'updateDocument'>): Result<'updateDocument'> =>
    this.c.updateDocument(...a);
  delete = (...a: Args<'deleteDocument'>): Result<'deleteDocument'> =>
    this.c.deleteDocument(...a);

  /** Where a document is used, and by whom. */
  usage = (...a: Args<'getDocumentUsage'>): Result<'getDocumentUsage'> =>
    this.c.getDocumentUsage(...a);
  subdocuments = (
    ...a: Args<'getDocumentSubdocuments'>
  ): Result<'getDocumentSubdocuments'> => this.c.getDocumentSubdocuments(...a);

  /** Attaching a document is what makes an assistant able to read it. */
  attach = (...a: Args<'attachDocument'>): Result<'attachDocument'> =>
    this.c.attachDocument(...a);
  detach = (...a: Args<'detachDocument'>): Result<'detachDocument'> =>
    this.c.detachDocument(...a);

  readonly versions = {
    list: (
      ...a: Args<'listDocumentVersions'>
    ): Result<'listDocumentVersions'> => this.c.listDocumentVersions(...a),
    get: (...a: Args<'getDocumentVersion'>): Result<'getDocumentVersion'> =>
      this.c.getDocumentVersion(...a),
    revert: (...a: Args<'revertDocument'>): Result<'revertDocument'> =>
      this.c.revertDocument(...a),
  };

  readonly folders = {
    list: (
      ...a: Args<'listDocumentFolders'>
    ): Result<'listDocumentFolders'> => this.c.listDocumentFolders(...a),
    create: (
      ...a: Args<'createDocumentFolder'>
    ): Result<'createDocumentFolder'> => this.c.createDocumentFolder(...a),
    update: (
      ...a: Args<'updateDocumentFolder'>
    ): Result<'updateDocumentFolder'> => this.c.updateDocumentFolder(...a),
    delete: (
      ...a: Args<'deleteDocumentFolder'>
    ): Result<'deleteDocumentFolder'> => this.c.deleteDocumentFolder(...a),
  };
}

export class Skills {
  constructor(private readonly c: DevicApiClient) {}

  list = (...a: Args<'listSkills'>): Result<'listSkills'> =>
    this.c.listSkills(...a);
  tags = (...a: Args<'listSkillTags'>): Result<'listSkillTags'> =>
    this.c.listSkillTags(...a);
  tree = (...a: Args<'getSkillTree'>): Result<'getSkillTree'> =>
    this.c.getSkillTree(...a);
  scaffold = (...a: Args<'scaffoldSkill'>): Result<'scaffoldSkill'> =>
    this.c.scaffoldSkill(...a);
  install = (...a: Args<'installSkill'>): Result<'installSkill'> =>
    this.c.installSkill(...a);
  uninstall = (...a: Args<'uninstallSkill'>): Result<'uninstallSkill'> =>
    this.c.uninstallSkill(...a);
}

/**
 * The app catalogue and the accounts the WORKSPACE connects — shared by
 * everyone in it. What an end user connects for themselves lives under
 * `devic.auth(tenant).integrations`, and the two never mix.
 */
export class Integrations {
  constructor(private readonly c: DevicApiClient) {}

  list = (...a: Args<'listIntegrations'>): Result<'listIntegrations'> =>
    this.c.listIntegrations(...a);
  get = (...a: Args<'getIntegration'>): Result<'getIntegration'> =>
    this.c.getIntegration(...a);
  connected = (
    ...a: Args<'listConnectedIntegrations'>
  ): Result<'listConnectedIntegrations'> =>
    this.c.listConnectedIntegrations(...a);

  /** Begins the OAuth dance; returns the URL to send a browser to. */
  connect = (...a: Args<'connectIntegration'>): Result<'connectIntegration'> =>
    this.c.connectIntegration(...a);
  connectionStatus = (
    ...a: Args<'integrationConnectionStatus'>
  ): Result<'integrationConnectionStatus'> =>
    this.c.integrationConnectionStatus(...a);

  /** Turns a connected account into a tool server assistants can use. */
  createServer = (
    ...a: Args<'createIntegrationServer'>
  ): Result<'createIntegrationServer'> => this.c.createIntegrationServer(...a);

  readonly tools = {
    list: (
      ...a: Args<'listIntegrationTools'>
    ): Result<'listIntegrationTools'> => this.c.listIntegrationTools(...a),
    update: (
      ...a: Args<'updateIntegrationTools'>
    ): Result<'updateIntegrationTools'> => this.c.updateIntegrationTools(...a),
  };

  readonly eventTypes = {
    list: (
      ...a: Args<'listIntegrationTriggers'>
    ): Result<'listIntegrationTriggers'> => this.c.listIntegrationTriggers(...a),
    get: (
      ...a: Args<'getIntegrationTrigger'>
    ): Result<'getIntegrationTrigger'> => this.c.getIntegrationTrigger(...a),
  };
}

/** Subscriptions that start an assistant or an agent from an app event. */
export class Triggers {
  constructor(private readonly c: DevicApiClient) {}

  list = (...a: Args<'listTriggers'>): Result<'listTriggers'> =>
    this.c.listTriggers(...a);
  get = (...a: Args<'getTrigger'>): Result<'getTrigger'> =>
    this.c.getTrigger(...a);
  create = (...a: Args<'createTrigger'>): Result<'createTrigger'> =>
    this.c.createTrigger(...a);
  update = (...a: Args<'updateTrigger'>): Result<'updateTrigger'> =>
    this.c.updateTrigger(...a);
  delete = (...a: Args<'deleteTrigger'>): Result<'deleteTrigger'> =>
    this.c.deleteTrigger(...a);

  /** What a trigger has actually fired on. */
  events = (...a: Args<'listTriggerEvents'>): Result<'listTriggerEvents'> =>
    this.c.listTriggerEvents(...a);
}
