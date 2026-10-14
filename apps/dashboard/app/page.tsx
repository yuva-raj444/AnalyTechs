'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  ChevronRight,
  Command,
  Globe2,
  MousePointer2,
  PanelLeft,
  RefreshCw,
  Users,
  Wifi,
} from 'lucide-react';
import { getJSON } from '../lib/api';
import type h337Type from 'heatmap.js';

type Session = {
  sessionId: string;
  eventCount: number;
  firstSeen: string;
  lastSeen: string;
};

type Event = {
  id: string;
  sessionId: string;
  type: 'page_view' | 'click';
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
};

type Heat = {
  x: number;
  y: number;
  documentX?: number;
  documentY?: number;
  documentWidth: number;
  documentHeight: number;
  viewportWidth?: number;
  viewportHeight?: number;
  scrollX?: number;
  scrollY?: number;
  timestamp: string;
};

const project =
  process.env.NEXT_PUBLIC_PROJECT_ID || 'demo-project';

function timeAgo(value: string) {
  const d = Date.now() - new Date(value).getTime();
  const s = Math.max(0, Math.floor(d / 1000));

  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;

  return `${Math.floor(s / 86400)}d`;
}

function shortId(id: string) {
  return id.slice(0, 13) + '…';
}

export default function Dashboard() {
  const [view, setView] =
    useState<'sessions' | 'heatmap'>('sessions');

  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<string>();
  const [events, setEvents] = useState<Event[]>([]);

  const [heat, setHeat] = useState<Heat[]>([]);
  const [pages, setPages] = useState<string[]>([]);
  const [page, setPage] = useState('');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);

    try {
      const s = await getJSON<Session[]>(
        `/v1/sessions?projectId=${encodeURIComponent(
          project
        )}&limit=100`
      );

      setSessions(s);

      if (!selected && s[0]) {
        setSelected(s[0].sessionId);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();

    getJSON<{ url: string; clicks: number }[]>(
      `/v1/pages?projectId=${encodeURIComponent(
        project
      )}&limit=100`
    ).then((r) => {
      const urls = r.map((x) => x.url);

      setPages(urls);

      if (urls[0]) {
        setPage(urls[0]);
      }
    });
  }, []);

  useEffect(() => {
    if (!selected) return;

    getJSON<Event[]>(
      `/v1/sessions/${encodeURIComponent(
        selected
      )}/events?projectId=${encodeURIComponent(project)}`
    ).then(setEvents);
  }, [selected]);

  useEffect(() => {
    if (view !== 'heatmap' || !page) return;

    getJSON<Heat[]>(
      `/v1/heatmap?projectId=${encodeURIComponent(
        project
      )}&url=${encodeURIComponent(page)}`
    ).then(setHeat);
  }, [view, page]);

  useEffect(() => {
    if (
      view === 'heatmap' &&
      !page &&
      pages[0]
    ) {
      setPage(pages[0]);
    }
  }, [view, pages, page]);

  const total = sessions.reduce(
    (a, s) => a + s.eventCount,
    0
  );

  const active = sessions.filter(
    (s) =>
      Date.now() -
        new Date(s.lastSeen).getTime() <
      300000
  ).length;

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-[236px] shrink-0 border-r border-[#e4e4df] bg-[#fbfbf9] p-4 flex-col">
        <div className="flex items-center gap-2 px-2 py-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#173c31] text-white grid place-items-center text-sm font-semibold">
            C
          </div>

          <div>
            <div className="font-semibold tracking-tight">
              Causal
            </div>

            <div className="text-[11px] text-[#8a8c86]">
              ANALYTICS
            </div>
          </div>
        </div>

        <div className="text-[10px] uppercase tracking-[.16em] text-[#9a9b95] px-2 mb-2">
          Workspace
        </div>

        <Nav
          active={view === 'sessions'}
          icon={<Users size={16} />}
          label="Sessions"
          onClick={() => setView('sessions')}
        />

        <Nav
          active={view === 'heatmap'}
          icon={<MousePointer2 size={16} />}
          label="Heatmaps"
          onClick={() => setView('heatmap')}
        />

        <div className="mt-auto panel p-3 bg-white">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-[#4b9b77]" />
            Collector online
          </div>

          <div className="text-[11px] subtle mt-1">
            Events are arriving normally
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="h-16 border-b border-[#e4e4df] bg-white/90 backdrop-blur flex items-center justify-between px-5 lg:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <PanelLeft
              className="md:hidden"
              size={18}
            />

            <div className="text-sm font-medium">
              Demo project
            </div>

            <span className="text-[#c4c5bf]">/</span>

            <div className="text-sm subtle">
              {view === 'sessions'
                ? 'Sessions'
                : 'Heatmaps'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="h-9 px-3 border border-[#deded8] rounded-lg text-xs flex items-center gap-2 hover:bg-[#f7f7f5]"
            >
              <RefreshCw
                size={14}
                className={
                  refreshing ? 'animate-spin' : ''
                }
              />
              Refresh
            </button>

            <div className="h-9 w-9 rounded-lg border border-[#deded8] grid place-items-center">
              <Command size={15} />
            </div>
          </div>
        </header>

        <div className="p-5 lg:p-8 max-w-[1400px] mx-auto">
          <div className="mb-7">
            <div className="text-[11px] uppercase tracking-[.18em] subtle mb-2">
              User behavior
            </div>

            <h1 className="text-2xl lg:text-[28px] font-semibold tracking-[-.025em]">
              {view === 'sessions'
                ? 'Sessions'
                : 'Click heatmaps'}
            </h1>

            <p className="subtle text-sm mt-1">
              {view === 'sessions'
                ? 'Understand how visitors move through your product.'
                : 'See where visitors interact with each page.'}
            </p>
          </div>

          {view === 'sessions' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <Metric
                  icon={<Users size={16} />}
                  label="Sessions"
                  value={sessions.length.toLocaleString()}
                  hint="Recorded sessions"
                />

                <Metric
                  icon={<Activity size={16} />}
                  label="Events"
                  value={total.toLocaleString()}
                  hint="Page views + clicks"
                />

                <Metric
                  icon={<Wifi size={16} />}
                  label="Active now"
                  value={active.toLocaleString()}
                  hint="Last 5 minutes"
                />
              </div>

              <div className="grid xl:grid-cols-[minmax(0,1fr)_400px] gap-5">
                <section className="panel overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#e4e4df] flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">
                        Recent sessions
                      </div>

                      <div className="text-xs subtle mt-0.5">
                        Most recently active visitors
                      </div>
                    </div>

                    <div className="text-xs subtle">
                      {sessions.length} shown
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#fafaf8] text-[10px] uppercase tracking-[.12em] subtle">
                        <tr>
                          <th className="px-5 py-3 font-medium">
                            Session
                          </th>

                          <th className="px-5 py-3 font-medium">
                            Events
                          </th>

                          <th className="px-5 py-3 font-medium">
                            First seen
                          </th>

                          <th className="px-5 py-3 font-medium">
                            Last active
                          </th>

                          <th />
                        </tr>
                      </thead>

                      <tbody>
                        {loading ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-5 py-12 text-center subtle text-sm"
                            >
                              Loading sessions…
                            </td>
                          </tr>
                        ) : (
                          sessions.map((s) => (
                            <tr
                              key={s.sessionId}
                              onClick={() =>
                                setSelected(
                                  s.sessionId
                                )
                              }
                              className={`border-t border-[#eeeeea] cursor-pointer hover:bg-[#fafaf8] ${
                                selected ===
                                s.sessionId
                                  ? 'bg-[#f4f8f5]'
                                  : ''
                              }`}
                            >
                              <td className="px-5 py-4">
                                <div className="mono text-xs">
                                  {shortId(
                                    s.sessionId
                                  )}
                                </div>

                                <div className="text-[11px] subtle mt-1">
                                  Anonymous visitor
                                </div>
                              </td>

                              <td className="px-5 py-4 text-sm font-medium">
                                {s.eventCount}
                              </td>

                              <td className="px-5 py-4 text-xs subtle">
                                {new Date(
                                  s.firstSeen
                                ).toLocaleString()}
                              </td>

                              <td className="px-5 py-4 text-xs">
                                <span className="inline-flex items-center gap-1.5">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      Date.now() -
                                        new Date(
                                          s.lastSeen
                                        ).getTime() <
                                      300000
                                        ? 'bg-[#4b9b77]'
                                        : 'bg-[#bbbdb7]'
                                    }`}
                                  />

                                  {timeAgo(
                                    s.lastSeen
                                  )}{' '}
                                  ago
                                </span>
                              </td>

                              <td className="pr-4">
                                <ChevronRight
                                  size={16}
                                  className="subtle"
                                />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <Journey
                  events={events}
                  selected={selected}
                />
              </div>
            </>
          ) : (
            <Heatmap
              page={page}
              setPage={setPage}
              pages={pages}
              heat={heat}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function Nav({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 text-left ${
        active
          ? 'bg-[#e7eee9] text-[#174a39] font-medium'
          : 'text-[#6d7069] hover:bg-[#f0f0ec]'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Metric({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="panel p-4">
      <div className="flex justify-between">
        <div className="w-8 h-8 rounded-lg bg-[#f1f2ee] grid place-items-center">
          {icon}
        </div>

        <ArrowUpRight
          size={15}
          className="subtle"
        />
      </div>

      <div className="text-[11px] subtle mt-4">
        {label}
      </div>

      <div className="text-2xl font-semibold mt-1 tracking-tight">
        {value}
      </div>

      <div className="text-[11px] subtle mt-1">
        {hint}
      </div>
    </div>
  );
}

function Journey({
  events,
  selected,
}: {
  events: Event[];
  selected?: string;
}) {
  return (
    <section className="panel overflow-hidden h-fit xl:sticky xl:top-[88px]">
      <div className="px-5 py-4 border-b border-[#e4e4df]">
        <div className="font-medium text-sm">
          User journey
        </div>

        <div className="text-xs subtle mt-0.5">
          {selected
            ? shortId(selected)
            : 'Select a session'}
        </div>
      </div>

      <div className="p-5">
        {!selected || !events.length ? (
          <div className="py-12 text-center text-sm subtle">
            Select a session to inspect its events.
          </div>
        ) : (
          <div className="space-y-5">
            {events.map((e, i) => (
              <div
                key={e.id}
                className="relative pl-7"
              >
                {i < events.length - 1 && (
                  <div className="absolute left-[7px] top-5 bottom-[-22px] w-px bg-[#dedfd9]" />
                )}

                <div
                  className={`absolute left-0 top-1 w-[15px] h-[15px] rounded-full border-2 ${
                    e.type === 'click'
                      ? 'border-[#1d5c48] bg-[#e6f0eb]'
                      : 'border-[#9a9c96] bg-white'
                  }`}
                />

                <div className="flex justify-between gap-2">
                  <div className="text-xs font-medium uppercase tracking-[.08em]">
                    {e.type.replace('_', ' ')}
                  </div>

                  <div className="text-[10px] subtle">
                    {new Date(
                      e.timestamp
                    ).toLocaleTimeString()}
                  </div>
                </div>

                <div className="text-sm mt-1 break-all">
                  {e.page.path || e.page.url}
                </div>

                {e.click && (
                  <div className="mt-2 inline-flex gap-2 items-center text-[11px] subtle bg-[#f6f6f3] rounded-md px-2 py-1">
                    <MousePointer2 size={12} />
                    x {Math.round(e.click.x)} · y{' '}
                    {Math.round(e.click.y)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* REAL HEATMAP                                                                */
/* -------------------------------------------------------------------------- */
function Heatmap({
  page,
  setPage,
  pages,
  heat,
}: {
  page: string;
  setPage: (x: string) => void;
  pages: string[];
  heat: Heat[];
}) {
  const heatmapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const instanceRef =
    useRef<ReturnType<typeof h337Type.create> | null>(null);

  const [heatmapReady, setHeatmapReady] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [availableWidth, setAvailableWidth] = useState(1100);

  /*
   * Use the real page dimensions captured by the tracker.
   * For events captured before the new tracker existed,
   * the API falls back to viewport dimensions.
   */
  const pageDimensions = useMemo(() => {
    if (!heat.length) {
      return { width: 1440, height: 900 };
    }

    const widths = heat
      .map((item) => item.documentWidth)
      .filter((value) => Number.isFinite(value) && value > 0);

    const heights = heat
      .map((item) => item.documentHeight)
      .filter((value) => Number.isFinite(value) && value > 0);

    const width = widths.length
      ? Math.max(320, Math.round(Math.max(...widths)))
      : 1440;

    const height = heights.length
      ? Math.max(600, Math.round(Math.max(...heights)))
      : 900;

    return { width, height };
  }, [heat]);

  /*
   * Fit the captured page into the dashboard while keeping
   * the source coordinate system unchanged.
   */
  const scale = useMemo(() => {
    return Math.min(1, availableWidth / pageDimensions.width);
  }, [availableWidth, pageDimensions.width]);

  const displayWidth = Math.round(pageDimensions.width * scale);
  const displayHeight = Math.round(pageDimensions.height * scale);

  /*
   * Convert each click from its original page coordinate
   * system into the captured page coordinate system.
   * This is the important part: scroll is already included
   * in documentX/documentY, so scrolling no longer moves the
   * heatmap away from the element that was clicked.
   */
  const pagePoints = useMemo(() => {
    return heat
      .map((item) => {
        const sourceWidth =
          item.documentWidth || item.viewportWidth || pageDimensions.width;

        const sourceHeight =
          item.documentHeight || item.viewportHeight || pageDimensions.height;

        const rawX =
          item.documentWidth && item.documentX !== undefined
            ? item.documentX
            : item.x;

        const rawY =
          item.documentHeight && item.documentY !== undefined
            ? item.documentY
            : item.y;

        if (
          !Number.isFinite(rawX) ||
          !Number.isFinite(rawY) ||
          !sourceWidth ||
          !sourceHeight
        ) {
          return null;
        }

        /*
         * Normalize against the dimensions that existed when
         * that particular click happened. This handles responsive
         * visitors with different viewport/page sizes as well.
         */
        const nx = Math.min(
          1,
          Math.max(0, rawX / sourceWidth)
        );

        const ny = Math.min(
          1,
          Math.max(0, rawY / sourceHeight)
        );

        return {
          x: Math.round(nx * pageDimensions.width),
          y: Math.round(ny * pageDimensions.height),
          value: 1,
        };
      })
      .filter(
        (
          point
        ): point is { x: number; y: number; value: number } =>
          point !== null
      );
  }, [heat, pageDimensions]);

  /*
   * Keep the heatmap stage responsive without changing its
   * internal page coordinate system.
   */
  useEffect(() => {
    const element = stageRef.current?.parentElement;
    if (!element) return;

    const update = () => {
      setAvailableWidth(Math.max(320, element.clientWidth));
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  /*
   * Recreate heatmap.js when the source page dimensions change.
   */
  useEffect(() => {
    let cancelled = false;

    async function initializeHeatmap() {
      if (!heatmapRef.current) return;

      const module = await import('heatmap.js');

      if (cancelled || !heatmapRef.current) return;

      const container = heatmapRef.current;
      container.innerHTML = '';

      const instance = module.default.create({
        container,
        radius: 65,
        maxOpacity: 0.85,
        minOpacity: 0.05,
        blur: 0.82,
        gradient: {
          '0.00': 'rgba(0, 0, 255, 0)',
          '0.20': '#21c55d',
          '0.40': '#84cc16',
          '0.55': '#fde047',
          '0.70': '#facc15',
          '0.82': '#f97316',
          '0.92': '#ef4444',
          '1.00': '#dc2626',
        },
      });

      instanceRef.current = instance;
      setHeatmapReady(true);

      renderHeatmap(
        instance,
        container,
        pagePoints,
        pageDimensions.width,
        pageDimensions.height
      );
    }

    setHeatmapReady(false);
    initializeHeatmap();

    return () => {
      cancelled = true;
      instanceRef.current = null;

      if (heatmapRef.current) {
        heatmapRef.current.innerHTML = '';
      }
    };
  }, [page, pageDimensions.width, pageDimensions.height]);

  /* Render new points after the instance is ready. */
  useEffect(() => {
    if (!heatmapReady) return;

    const instance = instanceRef.current;
    const container = heatmapRef.current;

    if (!instance || !container) return;

    renderHeatmap(
      instance,
      container,
      pagePoints,
      pageDimensions.width,
      pageDimensions.height
    );
  }, [
    pagePoints,
    heatmapReady,
    pageDimensions.width,
    pageDimensions.height,
    iframeLoaded,
  ]);

  return (
    <div className="space-y-5">
      <section className="panel p-4 flex flex-col sm:flex-row gap-3 sm:items-end">
        <label className="block flex-1">
          <div className="text-[11px] uppercase tracking-[.12em] subtle mb-2">
            Page URL
          </div>

          <select
            value={page}
            onChange={(e) => setPage(e.target.value)}
            className="w-full h-10 border border-[#dcdcd6] rounded-lg px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-[#d9e8e1]"
          >
            {pages.length ? (
              pages.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))
            ) : (
              <option>No tracked pages yet</option>
            )}
          </select>
        </label>

        <div className="h-10 px-3 border border-[#e0e0da] rounded-lg flex items-center gap-2 text-xs subtle">
          <MousePointer2 size={14} />
          {heat.length} {heat.length === 1 ? 'click' : 'clicks'}
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e4e4df] flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">Interaction heatmap</div>
            <div className="text-xs subtle mt-0.5">
              Document-position clicks mapped to the tracked page
            </div>
          </div>

          <Globe2 size={17} className="subtle" />
        </div>

        <div className="p-5">
          <div className="relative mx-auto max-w-[1100px]">
            <div
              className="relative overflow-auto max-h-[75vh] rounded-xl border border-[#d8d9d3] bg-[#f7f7f5] shadow-sm"
              style={{
                width: '100%',
              }}
            >
              <div
                className="relative"
                style={{
                  width: `${displayWidth}px`,
                  height: `${displayHeight}px`,
                }}
              >
                <div
                  ref={stageRef}
                  className="absolute left-0 top-0 origin-top-left"
                  style={{
                    width: `${pageDimensions.width}px`,
                    height: `${pageDimensions.height}px`,
                    transform: `scale(${scale})`,
                  }}
                >
                  {page ? (
                    <iframe
                      key={`${page}-${pageDimensions.width}-${pageDimensions.height}`}
                      src={page}
                      title="Tracked website"
                      className="absolute left-0 top-0 border-0 bg-white"
                      style={{
                        width: `${pageDimensions.width}px`,
                        height: `${pageDimensions.height}px`,
                      }}
                      onLoad={() => setIframeLoaded(true)}
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-sm subtle bg-white">
                      No tracked page selected.
                    </div>
                  )}

                  <div
                    ref={heatmapRef}
                    className="absolute left-0 top-0 z-20 pointer-events-none"
                    style={{
                      width: `${pageDimensions.width}px`,
                      height: `${pageDimensions.height}px`,
                    }}
                  />

                  <div className="absolute top-3 left-3 z-30 px-2.5 py-1.5 rounded-md bg-black/75 text-white text-[10px] font-medium backdrop-blur-sm">
                    LIVE HEATMAP
                  </div>

                  <div className="absolute top-3 right-3 z-30 px-2.5 py-1.5 rounded-md bg-white/90 text-[#343631] text-[10px] font-medium backdrop-blur-sm border border-black/5">
                    {heat.length} {heat.length === 1 ? 'click' : 'clicks'}
                  </div>

                  {!heat.length && (
                    <div className="absolute inset-0 z-40 pointer-events-none grid place-items-center">
                      <div className="bg-white/90 backdrop-blur-sm border border-[#dedfd9] rounded-xl px-5 py-4 shadow-sm text-center">
                        <div className="text-sm font-medium">
                          No clicks recorded
                        </div>
                        <div className="text-xs subtle mt-1">
                          Interact with this page to generate heatmap data.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] subtle">
              <span>
                Page size: {pageDimensions.width.toLocaleString()} ×{' '}
                {pageDimensions.height.toLocaleString()} px
              </span>
              <span>
                Scroll inside the preview to inspect the full page
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-[10px] subtle">Less interaction</span>

              <div
                className="h-2.5 w-52 rounded-full"
                style={{
                  background:
                    'linear-gradient(90deg,#21c55d 0%,#84cc16 25%,#fde047 45%,#facc15 60%,#f97316 78%,#ef4444 90%,#dc2626 100%)',
                }}
              />

              <span className="text-[10px] subtle">More interaction</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function renderHeatmap(
  instance: ReturnType<typeof h337Type.create>,
  container: HTMLDivElement,
  points: { x: number; y: number; value: number }[],
  width: number,
  height: number
) {
  if (!width || !height) return;

  if (!points.length) {
instance.setData({
  min: 0,
  max: 1,
  data: [],
});   
 return;
  }

  /* Group nearby clicks in the ORIGINAL page coordinate system. */
  const buckets = new Map<
    string,
    { x: number; y: number; value: number }
  >();

  const bucketSize = 35;

  for (const point of points) {
    const x = Math.max(0, Math.min(width, point.x));
    const y = Math.max(0, Math.min(height, point.y));

    const bucketX = Math.floor(x / bucketSize);
    const bucketY = Math.floor(y / bucketSize);
    const key = `${bucketX}:${bucketY}`;

    const existing = buckets.get(key);

    if (existing) {
      existing.value += 1;
    } else {
      buckets.set(key, { x, y, value: 1 });
    }
  }

  const data = Array.from(buckets.values());
  const max = Math.max(1, ...data.map((point) => point.value));

 instance.setData({
  min: 0,
  max: Math.max(2, max),
  data,
});
}
