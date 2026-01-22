import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';

/**
 * ============================================================================
 * WXCC Widget Template
 * ============================================================================
 * 
 * A starter template for building Webex Contact Center Agent Desktop widgets.
 * 
 * INSTRUCTIONS:
 * 1. Rename this file to match your widget (e.g., my-cool-widget.ts)
 * 2. Rename the class (e.g., MyCoolWidget)
 * 3. Update customElements.define() at the bottom
 * 4. Update vite.config.ts entry point
 * 5. Start building!
 * 
 * WHAT'S INCLUDED:
 * - Basic LitElement structure with TypeScript
 * - Token/orgId properties (automatically passed by Agent Desktop)
 * - Example GraphQL query patterns that work with Webex CC Search API
 * - Data refresh timer setup
 * - Error handling patterns
 * - Responsive styling for 64px header
 * 
 * ============================================================================
 */
export class WxccWidgetTemplate extends LitElement {
  
  // ==========================================================================
  // PROPERTIES - These are passed in via HTML attributes
  // ==========================================================================
  
  // Automatically provided by Agent Desktop
  @property() token?: string;           // Bearer token for API calls
  @property() orgId?: string;           // Organization ID
  @property() agentId?: string;         // Current agent's ID
  @property() teamId?: string;          // Current agent's team ID
  
  // Custom configuration - add your own!
  @property({ type: Number }) refreshInterval: number = 30000;  // 30 seconds
  @property({ type: Boolean }) demoMode: boolean = false;       // For testing without API
  
  // ==========================================================================
  // STATE - Internal reactive state
  // ==========================================================================
  
  @state() private isLoading: boolean = true;
  @state() private hasError: boolean = false;
  @state() private errorMessage: string = '';
  @state() private data: any = null;
  @state() private lastUpdated: Date = new Date();
  
  // Timers
  private _refreshTimer?: ReturnType<typeof setInterval>;

  // ==========================================================================
  // STYLES
  // ==========================================================================
  
  static styles = css`
    /* 
     * :host is the custom element itself
     * Default setup for 64px Agent Desktop header
     */
    :host {
      display: block;
      width: 100%;
      height: 48px;
      background: #0f1419;
      border-radius: 6px;
      overflow: visible;
      position: relative;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    }

    /* Main container */
    .container {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0 16px;
      gap: 12px;
    }

    /* Loading state */
    .loading {
      color: #94a3b8;
      font-size: 13px;
    }

    /* Error state */
    .error {
      color: #ef4444;
      font-size: 13px;
    }

    /* Success/data display */
    .content {
      color: #f1f5f9;
      font-size: 13px;
    }

    /* Example: Status indicator dot */
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
    }

    .status-dot.warning { background: #f59e0b; }
    .status-dot.critical { background: #ef4444; }

    /* Example: Metric display */
    .metric {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
    }

    .metric-value {
      font-weight: 600;
      color: #f1f5f9;
    }

    .metric-label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
    }

    /* 
     * FLOATING PANEL STYLES
     * Use position:fixed to escape parent overflow:hidden
     */
    .floating-panel {
      position: fixed;
      min-width: 280px;
      background: linear-gradient(165deg, #1a1f2e 0%, #0f1419 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      z-index: 10000;
      padding: 16px;
    }

    /* Backdrop for closing panel on outside click */
    .backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999;
      background: transparent;
    }
  `;

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================
  
  connectedCallback() {
    super.connectedCallback();
    this.initialize();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.cleanup();
  }

  private async initialize() {
    try {
      this.isLoading = true;
      this.hasError = false;

      if (!this.demoMode) {
        // Initial data fetch
        await this.fetchData();
        
        // Set up refresh timer
        this._refreshTimer = setInterval(() => this.fetchData(), this.refreshInterval);
      } else {
        // Demo mode - use mock data
        this.data = this.getMockData();
        this.isLoading = false;
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private cleanup() {
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer);
    }
  }

  // ==========================================================================
  // API METHODS
  // ==========================================================================

  /**
   * Main data fetching method - customize this for your widget
   */
  private async fetchData() {
    try {
      // Example: Fetch queue statistics
      const result = await this.searchApi(this.buildQuery());
      
      if (result.error || result.errors) {
        throw new Error(result.error?.message?.[0]?.description || 'API Error');
      }

      this.data = result.data;
      this.lastUpdated = new Date();
      this.isLoading = false;
      this.hasError = false;
      
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Generic Search API caller
   * Handles auth headers and JSON parsing
   */
  private async searchApi(query: { query: string }): Promise<any> {
    const response = await fetch('https://api.wxcc-us1.cisco.com/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(query)
    });
    
    return response.json();
  }

  /**
   * Build your GraphQL query here
   * 
   * IMPORTANT LESSONS LEARNED:
   * 1. Use inline values, NOT GraphQL variables for aggregations
   * 2. Don't quote enum values (count, min, max, average, sum)
   * 3. The parameter is "aggregations" (plural) not "aggregation"
   */
  private buildQuery(): { query: string } {
    const now = Date.now();
    const from = now - 86400000; // 24 hours ago

    // EXAMPLE: Query for parked tasks with aggregations
    return {
      query: `{
        task(
          from: ${from}
          to: ${now}
          filter: {
            and: [
              { isActive: { equals: true } }
              { status: { equals: "parked" } }
            ]
          }
          aggregations: [
            { field: "id", type: count, name: "totalContacts" }
            { field: "createdTime", type: min, name: "oldestContact" }
          ]
        ) {
          tasks {
            lastQueue { id name }
            aggregation { name value }
          }
        }
      }`
    };
  }

  // ==========================================================================
  // QUERY EXAMPLES - Copy/paste these as needed
  // ==========================================================================

  /*
   * EXAMPLE: Get all tasks (no aggregation)
   * 
   * private buildTaskListQuery(): { query: string } {
   *   const now = Date.now();
   *   const from = now - 86400000;
   *   
   *   return {
   *     query: `{
   *       task(
   *         from: ${from}
   *         to: ${now}
   *         filter: {
   *           and: [
   *             { isActive: { equals: true } }
   *           ]
   *         }
   *       ) {
   *         tasks {
   *           id
   *           status
   *           channelType
   *           origin
   *           createdTime
   *           lastQueue { id name }
   *           owner { id name }
   *         }
   *       }
   *     }`
   *   };
   * }
   */

  /*
   * EXAMPLE: Get agent sessions
   * 
   * private buildAgentSessionQuery(): { query: string } {
   *   const now = Date.now();
   *   const from = now - 86400000;
   *   
   *   return {
   *     query: `{
   *       agentSession(
   *         from: ${from}
   *         to: ${now}
   *         filter: {
   *           isActive: { equals: true }
   *         }
   *       ) {
   *         agentSessions {
   *           agentId
   *           state
   *           teamId
   *           channelId
   *         }
   *       }
   *     }`
   *   };
   * }
   */

  /*
   * EXAMPLE: Aggregation types available
   * 
   * - count    : Count of records
   * - sum      : Sum of numeric field
   * - min      : Minimum value
   * - max      : Maximum value  
   * - average  : Average value
   * 
   * aggregations: [
   *   { field: "id", type: count, name: "total" }
   *   { field: "connectedDuration", type: average, name: "avgTalkTime" }
   *   { field: "holdDuration", type: max, name: "maxHold" }
   *   { field: "totalDuration", type: sum, name: "totalHandleTime" }
   * ]
   */

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private handleError(error: unknown) {
    console.error('Widget error:', error);
    this.hasError = true;
    this.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    this.isLoading = false;
  }

  private getMockData(): any {
    // Return mock data for demo/testing
    return {
      task: {
        tasks: [
          { 
            lastQueue: { id: '1', name: 'Sales Queue' },
            aggregation: [
              { name: 'totalContacts', value: 5 },
              { name: 'oldestContact', value: Date.now() - 180000 }
            ]
          },
          { 
            lastQueue: { id: '2', name: 'Support Queue' },
            aggregation: [
              { name: 'totalContacts', value: 3 },
              { name: 'oldestContact', value: Date.now() - 60000 }
            ]
          }
        ]
      }
    };
  }

  /**
   * Format seconds to MM:SS display
   */
  protected formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format seconds to human readable (e.g., "2m 30s" or "1h 15m")
   */
  protected formatDuration(seconds: number): string {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================
  
  render() {
    // Error state
    if (this.hasError) {
      return html`
        <div class="container">
          <div class="error">⚠️ ${this.errorMessage || 'Error loading data'}</div>
        </div>
      `;
    }

    // Loading state
    if (this.isLoading) {
      return html`
        <div class="container">
          <div class="loading">Loading...</div>
        </div>
      `;
    }

    // Success state - customize this for your widget!
    return html`
      <div class="container">
        <div class="status-dot"></div>
        <div class="content">
          Widget loaded successfully! Customize the render() method.
        </div>
        <div class="metric">
          <span class="metric-value">${this.lastUpdated.toLocaleTimeString()}</span>
          <span class="metric-label">Updated</span>
        </div>
      </div>
    `;
  }
}

// ==========================================================================
// REGISTER THE CUSTOM ELEMENT
// Change 'wxcc-widget-template' to your widget name (must have a hyphen)
// ==========================================================================
customElements.define('wxcc-widget-template', WxccWidgetTemplate);
