export type EventType = 'page_view' | 'click';

export interface AnalyticsEvent {
  projectId: string;
  sessionId: string;
  type: EventType;
  page: {
    url: string;
    path: string;
  };
  timestamp: string;
  click?: {
    x: number;
    y: number;
    documentX?: number;
    documentY?: number;
    documentWidth?: number;
    documentHeight?: number;
    scrollX?: number;
    scrollY?: number;
    viewportX?: number;
    viewportY?: number;
    viewportWidth: number;
    viewportHeight: number;
  };
}

export interface SessionSummary {
  sessionId: string;
  projectId: string;
  eventCount: number;
  firstSeen: string;
  lastSeen: string;
}
