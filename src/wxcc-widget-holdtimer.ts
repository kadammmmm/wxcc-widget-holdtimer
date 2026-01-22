import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Desktop } from '@wxcc-desktop/sdk';

export class WxccWidgetHoldTimer extends LitElement {
  @property({ type: Number }) notificationThreshold: number = 60; // seconds, configurable in layout.json

  @state() private isLoading: boolean = true;
  @state() private hasError: boolean = false;
  @state() private errorMessage: string = '';
  @state() private holdSeconds: number = 0;
  @state() private isOnHold: boolean = false;
  @state() private hasNotified: boolean = false;

  private holdTimerInterval?: ReturnType<typeof setInterval>;
  private currentContactId: string | null = null;

  static styles = css`
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

    .container {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0 16px;
      gap: 12px;
    }

    .loading, .error {
      font-size: 13px;
    }

    .loading { color: #94a3b8; }
    .error { color: #ef4444; }

    .timer {
      color: #f87171;
      font-weight: bold;
      font-size: 20px;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #10b981;
    }

    .status-dot.on-hold { background: #ef4444; }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.initialize();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.cleanup();
  }

  private initialize() {
    try {
      // Listen to hold and unhold events (confirmed in SDK docs)
      Desktop.agentContact.addEventListener('eAgentContactHeld', this.handleHoldEvent.bind(this));
      Desktop.agentContact.addEventListener('eAgentContactUnHeld', this.handleUnholdEvent.bind(this));

      // Also catch end/wrap-up to reset
      Desktop.agentContact.addEventListener('eAgentContactEnded', this.handleTaskEnd.bind(this));
      Desktop.agentContact.addEventListener('eAgentContactWrappedUp', this.handleTaskEnd.bind(this));

      // Optional light poll every 5s for state sync (in case events miss)
      setInterval(() => this.pollState(), 5000);

      this.isLoading = false;
    } catch (err) {
      this.handleError(err);
    }
  }

  private handleHoldEvent(msg: any) {
    console.log('Hold event received:', msg);
    if (msg?.contactId && msg.contactId !== this.currentContactId) {
      this.currentContactId = msg.contactId;
    }
    this.startHoldTimer();
  }

  private handleUnholdEvent(msg: any) {
    console.log('Unhold event received:', msg);
    this.stopHoldTimer();
  }

  private handleTaskEnd(msg: any) {
    console.log('Task end/wrapup event:', msg);
    this.resetHoldState();
  }

  private pollState() {
    // Minimal poll: check if we think we're on hold but no timer running, or vice versa
    // Expand later if needed by logging Desktop.agentContact or other modules
    console.log('Polling state - current hold status:', this.isOnHold);
    // If you have access to task list via other SDK modules, add here (e.g. Desktop.task.getTasks())
  }

  private startHoldTimer() {
    if (this.isOnHold) return;
    this.isOnHold = true;
    this.holdSeconds = 0;
    this.hasNotified = false;

    this.holdTimerInterval = setInterval(() => {
      this.holdSeconds++;
      this.requestUpdate();

      if (this.holdSeconds >= this.notificationThreshold && !this.hasNotified) {
        alert(`Hold duration exceeded ${this.formatTime(this.notificationThreshold)}! Please resume the call.`);
        this.hasNotified = true;
      }
    }, 1000);
  }

  private stopHoldTimer() {
    if (this.holdTimerInterval) {
      clearInterval(this.holdTimerInterval);
      this.holdTimerInterval = undefined;
    }
    this.isOnHold = false;
  }

  private resetHoldState() {
    this.stopHoldTimer();
    this.holdSeconds = 0;
    this.hasNotified = false;
    this.currentContactId = null;
    this.requestUpdate();
  }

  private cleanup() {
    Desktop.agentContact.removeEventListener('eAgentContactHeld', this.handleHoldEvent.bind(this));
    Desktop.agentContact.removeEventListener('eAgentContactUnHeld', this.handleUnholdEvent.bind(this));
    Desktop.agentContact.removeEventListener('eAgentContactEnded', this.handleTaskEnd.bind(this));
    Desktop.agentContact.removeEventListener('eAgentContactWrappedUp', this.handleTaskEnd.bind(this));
    this.resetHoldState();
  }

  private handleError(err: unknown) {
    console.error('Hold Timer Widget Error:', err);
    this.hasError = true;
    this.errorMessage = err instanceof Error ? err.message : 'Initialization failed';
    this.isLoading = false;
  }

  protected formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  render() {
    if (this.hasError) {
      return html`<div class="container"><div class="error">⚠️ ${this.errorMessage}</div></div>`;
    }

    if (this.isLoading) {
      return html`<div class="container"><div class="loading">Initializing hold timer...</div></div>`;
    }

    return html`
      <div class="container">
        <div class="status-dot ${this.isOnHold ? 'on-hold' : ''}"></div>
        ${this.isOnHold
          ? html`<div class="timer">${this.formatTime(this.holdSeconds)}</div>`
          : html`<div>No active hold</div>`
        }
        <div>Alert @ ${this.formatTime(this.notificationThreshold)}</div>
      </div>
    `;
  }
}

customElements.define('wxcc-widget-holdtimer', WxccWidgetHoldTimer);