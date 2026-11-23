import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

export type Pin = { id: string; lat: number; lng: number; label: string };

export default function CareMap({ pins, centre, selected, onSelect }: { pins: Pin[]; centre: { lat: number; lng: number } | null; selected: string | null; onSelect: (id: string) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { scrollWheelZoom: true }).setView([17.425, 78.45], 11);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 18 }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    const m = map.current, g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    if (centre) L.circle([centre.lat, centre.lng], { radius: 2500, className: "rc-radius" }).addTo(g);
    pins.forEach((p, i) => {
      const on = p.id === selected;
      const icon = L.divIcon({ className: "", iconSize: [34, 34], iconAnchor: [17, 34],
        html: `<div class="rc-pin${on ? " rc-pin-on" : ""}"><span>${i + 1}</span></div>` });
      L.marker([p.lat, p.lng], { icon, title: p.label, zIndexOffset: on ? 1000 : 0 }).on("click", () => onSelect(p.id)).addTo(g);
    });
    if (centre) m.flyTo([centre.lat, centre.lng], 12, { duration: 0.6 });
  }, [pins, centre, selected, onSelect]);

  return <div ref={el} className="h-full w-full" />;
}
