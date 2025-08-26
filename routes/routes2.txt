'use client';

import { useEffect, useState, useCallback } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { Bus, MapPin, Clock, RefreshCcw } from "lucide-react";

type Stop = { name: string; arrivalTimestamp: number };
type Route = { id: number; name: string; stops: string[] };
type TrafficLevel = 'light' | 'moderate' | 'heavy';

// ---------------------------------------------------------------------------
// Static routes (ordered stop lists)
// ---------------------------------------------------------------------------
const staticRoutes: Route[] = [
  {
    id: 1,
    name: 'QMC to Welcome Rotonda via E. Rodriguez Sr. Avenue',
    stops: [
      'Quezon Memorial Circle',
      'Kalayaan Avenue',
      'Tomas Morato',
      'St. Luke’s Medical Center',
      'Trinity University of Asia',
      'Welcome Rotonda',
    ],
  },
  {
    id: 2,
    name: 'QMC to Katipunan via CP Garcia',
    stops: [
      'Quezon Memorial Circle',
      'University Avenue (UP Diliman)',
      'CP Garcia Avenue',
      'UP Town Center',
      'Katipunan (LRT2 Station)',
    ],
  },
  {
    id: 3,
    name: 'QMC to Araneta‑Cubao via East Avenue',
    stops: [
      'Quezon Memorial Circle',
      'Philippine Heart Center',
      'East Avenue Medical Center',
      'Land Transportation Office (LTO)',
      'National Kidney Institute',
      'Araneta City / Cubao',
    ],
  },
  {
    id: 4,
    name: 'IBP Road to Litex',
    stops: [
      'Batasan Road (near Sandiganbayan)',
      'IBP Road',
      'Commonwealth Avenue',
      'Litex Market',
      'Payatas Road Junction',
    ],
  },
  {
    id: 5,
    name: 'Novaliches to QMC via Mindanao Avenue',
    stops: [
      'Novaliches Bayan (Proper)',
      'Tandang Sora Avenue',
      'Mindanao Avenue',
      'Visayas Avenue',
      'Quezon Memorial Circle',
    ],
  },
  {
    id: 6,
    name: 'QMC – Philcoa – UP – Katipunan Loop',
    stops: [
      'Quezon Memorial Circle',
      'Philcoa',
      'University of the Philippines (UP) Campus',
      'Katipunan Avenue',
      'Balara Area',
    ],
  },
];

// ---------------------------------------------------------------------------
// Segment‑level min‑max travel times (in minutes) by traffic condition
// ---------------------------------------------------------------------------
const travelTimeData: Record<string, Record<TrafficLevel, [number, number]>> = {
  // Route 1 – E. Rodriguez
  'Quezon Memorial Circle→Kalayaan Avenue': { light: [10, 15], moderate: [15, 25], heavy: [25, 40] },
  'Kalayaan Avenue→Tomas Morato': { light: [12, 18], moderate: [18, 30], heavy: [30, 45] },
  'Tomas Morato→St. Luke’s Medical Center': { light: [3, 4], moderate: [5, 6], heavy: [8, 12] },
  'St. Luke’s Medical Center→Trinity University of Asia': { light: [2, 3], moderate: [3, 5], heavy: [5, 8] },
  'Trinity University of Asia→Welcome Rotonda': { light: [3, 4], moderate: [5, 6], heavy: [8, 12] },
  // Route 2 – CP Garcia
  'Quezon Memorial Circle→University Avenue (UP Diliman)': { light: [4, 5], moderate: [6, 8], heavy: [9, 14] },
  'University Avenue (UP Diliman)→CP Garcia Avenue': { light: [3, 4], moderate: [5, 6], heavy: [8, 12] },
  'CP Garcia Avenue→UP Town Center': { light: [4, 5], moderate: [6, 8], heavy: [9, 14] },
  'UP Town Center→Katipunan (LRT2 Station)': { light: [3, 4], moderate: [5, 6], heavy: [8, 12] },
  // Route 3 – East Ave
  'Quezon Memorial Circle→Philippine Heart Center': { light: [3, 4], moderate: [4, 5], heavy: [6, 9] },
  'Philippine Heart Center→East Avenue Medical Center': { light: [2, 3], moderate: [3, 4], heavy: [5, 7] },
  'East Avenue Medical Center→Land Transportation Office (LTO)': { light: [2, 3], moderate: [3, 4], heavy: [5, 7] },
  'Land Transportation Office (LTO)→National Kidney Institute': { light: [2, 3], moderate: [3, 4], heavy: [5, 7] },
  'National Kidney Institute→Araneta City / Cubao': { light: [4, 5], moderate: [6, 8], heavy: [10, 15] },
  // Route 4 – IBP / Litex
  'Batasan Road (near Sandiganbayan)→IBP Road': { light: [3, 4], moderate: [4, 6], heavy: [7, 10] },
  'IBP Road→Commonwealth Avenue': { light: [4, 5], moderate: [6, 8], heavy: [10, 15] },
  'Commonwealth Avenue→Litex Market': { light: [4, 5], moderate: [6, 8], heavy: [9, 14] },
  'Litex Market→Payatas Road Junction': { light: [5, 6], moderate: [7, 9], heavy: [11, 17] },
  // Route 5 – Mindanao Ave
  'Novaliches Bayan (Proper)→Tandang Sora Avenue': { light: [6, 7], moderate: [9, 11], heavy: [14, 21] },
  'Tandang Sora Avenue→Mindanao Avenue': { light: [4, 5], moderate: [6, 8], heavy: [9, 14] },
  'Mindanao Avenue→Visayas Avenue': { light: [4, 5], moderate: [6, 8], heavy: [9, 14] },
  'Visayas Avenue→Quezon Memorial Circle': { light: [4, 5], moderate: [6, 8], heavy: [9, 14] },
  // Route 6 – QMC / Philcoa Loop
  'Quezon Memorial Circle→Philcoa': { light: [3, 4], moderate: [4, 6], heavy: [7, 10] },
  'Philcoa→University of the Philippines (UP) Campus': { light: [3, 4], moderate: [5, 6], heavy: [8, 12] },
  'University of the Philippines (UP) Campus→Katipunan Avenue': { light: [4, 5], moderate: [6, 8], heavy: [9, 14] },
  'Katipunan Avenue→Balara Area': { light: [4, 5], moderate: [6, 8], heavy: [10, 15] },
};

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------
const getTrafficLevel = (): TrafficLevel => {
  const hr = new Date().getHours();
  if ((hr >= 7 && hr <= 10) || (hr >= 17 && hr <= 20)) return 'heavy';
  if ((hr >= 6 && hr < 7) || (hr > 10 && hr <= 16)) return 'moderate';
  return 'light';
};

const getETA = (from: string, to: string, traffic: TrafficLevel): number => {
  const key = `${from}→${to}`;
  const segment = travelTimeData[key]?.[traffic];
  if (!segment) return traffic === 'light' ? 5 : traffic === 'moderate' ? 8 : 12;
  const [min, max] = segment;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getLightETA = (from: string, to: string) => getETA(from, to, 'light');
export const getModerateETA = (from: string, to: string) => getETA(from, to, 'moderate');
export const getHeavyETA = (from: string, to: string) => getETA(from, to, 'heavy');

const isOutsideOperatingHours = () => {
  const hr = new Date().getHours();
  return hr < 5 || hr >= 21; // buses run 5 AM‑9 PM
};

// ---------------------------------------------------------------------------
// React component
// ---------------------------------------------------------------------------
export default function RoutesPage() {
  const [arrivalTimes, setArrivalTimes] = useState<Record<number, Stop[]>>({});
  const [selectedRouteId, setSelectedRouteId] = useState<number>(1);
  const [isClosed, setIsClosed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshArrivalTimes = useCallback(() => {
    const closed = isOutsideOperatingHours();
    setIsClosed(closed);
    const traffic = getTrafficLevel();
    const now = Date.now();

    const updated = staticRoutes.reduce((acc, route) => {
      let elapsed = 0;
      const stops = route.stops.map((stop, idx, arr) => {
        if (!closed && idx > 0) {
          elapsed += getETA(arr[idx - 1], stop, traffic);
        }
        return { name: stop, arrivalTimestamp: closed ? 0 : now + elapsed * 60000 };
      });
      acc[route.id] = stops;
      return acc;
    }, {} as Record<number, Stop[]>);

    setArrivalTimes(updated);
  }, []);

  useEffect(() => {
    refreshArrivalTimes();
    const interval = setInterval(refreshArrivalTimes, 30000);
    return () => clearInterval(interval);
  }, [refreshArrivalTimes]);

  const selectedStops = arrivalTimes[selectedRouteId] || [];
  const formatTime = (ts: number) =>
    ts === 0 ? '--:--' : new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <>
      <Navbar />
      <main className="min-h-[85vh] bg-gradient-to-br from-blue-100 via-white to-blue-50 px-4 py-14">
        <div className="max-w-4xl mx-auto space-y-10 text-center">
          {/* Header */}
          <header>
            <h1 className="text-4xl md:text-5xl font-bold text-blue-900 flex justify-center items-center gap-3">
              <Bus className="w-9 h-9" />
              Libreng Sakay Route Tracker
            </h1>
            <p className="text-gray-800 text-base md:text-lg mt-3 font-medium">
              Get <span className="font-semibold text-blue-700">real‑time</span> bus arrival estimates
            </p>
          </header>

          {/* Route selector */}
          <div className="text-left w-full">
            <label className="block text-base font-semibold text-gray-800 mb-2">📍 Select a route:</label>
            <select
              className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 bg-white"
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(Number(e.target.value))}
            >
              {staticRoutes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh button */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (isRefreshing) return;
                setIsRefreshing(true);
                refreshArrivalTimes();
                setIsRefreshing(false);
              }}
              disabled={isRefreshing}
              className={`flex items-center gap-2 text-base font-semibold px-5 py-2 rounded-lg transition ${
                isRefreshing ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <RefreshCcw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {/* Route info */}
          <section className="bg-white shadow-xl border border-gray-200 rounded-2xl px-6 py-8 text-left space-y-6">
            <h2 className="text-xl md:text-2xl font-bold text-blue-800 flex items-center gap-2">
              🛣️ {staticRoutes.find((r) => r.id === selectedRouteId)?.name}
            </h2>

            {isClosed && (
              <div className="bg-red-100 text-red-800 font-semibold px-4 py-2 rounded-md text-sm md:text-base">
                🕘 Buses are not operating between 9:00 PM and 5:00 AM
              </div>
            )}

            {/* Stop list */}
            <ol className="space-y-5 relative border-l-4 border-blue-300 pl-6">
              {selectedStops.map((stop, i) => (
                <li key={i} className="relative">
                  <div className="flex justify-between items-center">
                    <div className="text-gray-900 text-base md:text-lg font-semibold flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-700" />
                      {stop.name}
                    </div>
                    <div
                      className={`text-sm md:text-base flex items-center gap-2 px-4 py-1 rounded-full font-medium ${
                        isClosed ? 'bg-gray-300 text-gray-600' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      {isClosed ? 'Closed' : formatTime(stop.arrivalTimestamp)}
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <p className="text-sm text-gray-500 text-right mt-4">
              {isClosed ? 'Live tracking resumes at 5:00 AM' : 'Auto‑refreshing every 30 seconds'}
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
