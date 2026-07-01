import { SERVICE_ROUTE_PREFIX } from './constants';
import {
  PullRecordsResponse,
  PullRecordsResponseSchema,
  PushRecordsRequest,
  PushRecordsRequestSchema,
  PushRecordsResponse,
  PushRecordsResponseSchema,
} from './records';
import {
  ProvisionDeploymentRequest,
  ProvisionDeploymentRequestSchema,
  ProvisionDeploymentResponse,
  ProvisionDeploymentResponseSchema,
} from './schemas';
import { buildServiceAuthHeaders } from './service-token';

/**
 * Minimal HTTP port so this package needs no HTTP dependency of its own
 * (works on Node 16 without global `fetch`). Pass your existing axios instance
 * — its `.request(config)` already matches this shape.
 */
export interface HttpClient {
  request<T = unknown>(config: {
    method: 'GET' | 'POST' | 'DELETE' | 'PATCH';
    url: string;
    headers?: Record<string, string>;
    data?: unknown;
  }): Promise<{ data: T }>;
}

export interface ServiceClientOptions {
  /** Base URL of the target service (e.g. a product's `serviceUrl`). */
  baseUrl: string;
  /** Shared HUB_SERVICE_SECRET. */
  secret: string;
  /** This caller's slug (e.g. "hub"). */
  issuer: string;
  /** Target service slug (e.g. the product slug). */
  audience: string;
  /** Your HTTP adapter (e.g. an axios instance). */
  http: HttpClient;
}

/**
 * Typed client for the hub -> product provisioning contract. Signs every call
 * and validates the response, so a caller cannot send or accept an off-contract
 * payload.
 */
export class ServiceClient {
  constructor(private readonly opts: ServiceClientOptions) {}

  private headers(): Record<string, string> {
    return {
      ...buildServiceAuthHeaders({
        secret: this.opts.secret,
        issuer: this.opts.issuer,
        audience: this.opts.audience,
      }),
      'content-type': 'application/json',
    };
  }

  private url(path: string): string {
    const base = this.opts.baseUrl.replace(/\/+$/, '');
    return `${base}/${SERVICE_ROUTE_PREFIX}/${path.replace(/^\/+/, '')}`;
  }

  /** Provision a tenant + first admin in the target product. */
  async provisionDeployment(
    payload: ProvisionDeploymentRequest,
  ): Promise<ProvisionDeploymentResponse> {
    const body = ProvisionDeploymentRequestSchema.parse(payload);
    const res = await this.opts.http.request<unknown>({
      method: 'POST',
      url: this.url('deployments'),
      headers: this.headers(),
      data: body,
    });
    return ProvisionDeploymentResponseSchema.parse(res.data);
  }

  /** Fetch the current status/health of a deployment. */
  async getDeployment(
    deploymentId: string,
  ): Promise<ProvisionDeploymentResponse> {
    const res = await this.opts.http.request<unknown>({
      method: 'GET',
      url: this.url(`deployments/${encodeURIComponent(deploymentId)}`),
      headers: this.headers(),
    });
    return ProvisionDeploymentResponseSchema.parse(res.data);
  }

  /** Tear down the tenant for a deployment. */
  async teardownDeployment(deploymentId: string): Promise<void> {
    await this.opts.http.request({
      method: 'DELETE',
      url: this.url(`deployments/${encodeURIComponent(deploymentId)}`),
      headers: this.headers(),
    });
  }

  /**
   * Push a batch of canonical records to the hub (producer -> hub). The hub
   * validates each record against the data type's effective schema and stores
   * the valid ones; invalid records come back in `rejected`.
   */
  async pushRecords(
    payload: PushRecordsRequest,
  ): Promise<PushRecordsResponse> {
    const body = PushRecordsRequestSchema.parse(payload);
    const res = await this.opts.http.request<unknown>({
      method: 'POST',
      url: this.url('records'),
      headers: this.headers(),
      data: body,
    });
    return PushRecordsResponseSchema.parse(res.data);
  }

  /**
   * Pull the records for a client + data type from the hub (consumer -> hub).
   * Pass `since` (ISO-8601) for an incremental pull of changes only.
   */
  async pullRecords(query: {
    dataType: string;
    clientId: string;
    since?: string;
  }): Promise<PullRecordsResponse> {
    const params = new URLSearchParams({
      dataType: query.dataType,
      client: query.clientId,
    });
    if (query.since) {
      params.set('since', query.since);
    }
    const res = await this.opts.http.request<unknown>({
      method: 'GET',
      url: `${this.url('records')}?${params.toString()}`,
      headers: this.headers(),
    });
    return PullRecordsResponseSchema.parse(res.data);
  }
}
