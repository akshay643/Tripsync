"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { MapPin, Sun, Thermometer, Clock, Star } from "lucide-react";
import { staggerContainer, staggerItem } from "@/components/ui/motion";

// Curated by current month: June/July = Northern Hemisphere summer
// + Southern Hemisphere mid-winter highlights
const DESTINATIONS = [
  {
    id: 1, name: "Santorini", country: "Greece", category: "beach",
    why: "Peak Aegean summer — long golden sunsets, warm cobalt seas.",
    temp: "28°C", crowd: "High", tags: ["Beach", "Romance", "Sunsets"],
    color: "from-blue-400 to-indigo-600",
    photo: "santorini,greece,cyclades",
    rating: 4.9,
  },
  {
    id: 2, name: "Kyoto", country: "Japan", category: "culture",
    why: "Summer festivals, firefly seasons, and lush temple gardens.",
    temp: "31°C", crowd: "Medium", tags: ["Culture", "Temples", "Festivals"],
    color: "from-pink-400 to-rose-600",
    photo: "kyoto,japan,temple",
    rating: 4.8,
  },
  {
    id: 3, name: "Iceland", country: "Iceland", category: "nature",
    why: "Midnight sun season — 24 hrs of daylight, puffins, and waterfalls.",
    temp: "12°C", crowd: "Medium", tags: ["Midnight Sun", "Nature", "Adventure"],
    color: "from-cyan-400 to-teal-600",
    photo: "iceland,landscape,midnight+sun",
    rating: 4.9,
  },
  {
    id: 4, name: "Dubrovnik", country: "Croatia", category: "beach",
    why: "Old city walls at dusk + crystal Adriatic coves at peak season.",
    temp: "27°C", crowd: "High", tags: ["History", "Beach", "Sailing"],
    color: "from-orange-400 to-red-500",
    photo: "dubrovnik,croatia,adriatic",
    rating: 4.7,
  },
  {
    id: 5, name: "Patagonia", country: "Argentina", category: "nature",
    why: "Southern Hemisphere winter = low crowds + dramatic landscapes.",
    temp: "6°C", crowd: "Low", tags: ["Trekking", "Wildlife", "Off-season"],
    color: "from-slate-500 to-gray-700",
    photo: "patagonia,argentina,mountains",
    rating: 4.8,
  },
  {
    id: 6, name: "Bali", country: "Indonesia", category: "culture",
    why: "Dry season peak — rice terraces are green, temples uncrowded.",
    temp: "29°C", crowd: "Medium", tags: ["Temples", "Surf", "Wellness"],
    color: "from-emerald-400 to-green-600",
    photo: "bali,indonesia,rice+terrace",
    rating: 4.7,
  },
  {
    id: 7, name: "Amalfi Coast", country: "Italy", category: "beach",
    why: "Cliffside villages and turquoise bays at their most vibrant.",
    temp: "26°C", crowd: "High", tags: ["Coastal", "Food", "Views"],
    color: "from-yellow-400 to-orange-500",
    photo: "amalfi+coast,italy,mediterranean",
    rating: 4.8,
  },
  {
    id: 8, name: "Norwegian Fjords", country: "Norway", category: "nature",
    why: "Endless daylight, hike into fjords, no mosquitoes (yet).",
    temp: "18°C", crowd: "Low", tags: ["Fjords", "Hiking", "Midnight Sun"],
    color: "from-teal-400 to-cyan-600",
    photo: "norway,fjord,summer",
    rating: 4.9,
  },
  {
    id: 9, name: "Cape Town", country: "South Africa", category: "city",
    why: "Whale watching season begins, crisp air, Table Mountain clear.",
    temp: "14°C", crowd: "Low", tags: ["Wildlife", "Beach", "Wine"],
    color: "from-violet-400 to-purple-600",
    photo: "cape+town,south+africa,mountain",
    rating: 4.8,
  },
  {
    id: 10, name: "Tuscany", country: "Italy", category: "culture",
    why: "Sunflower fields in bloom, vineyard harvest begins end of summer.",
    temp: "29°C", crowd: "Medium", tags: ["Wine", "Rolling Hills", "History"],
    color: "from-amber-400 to-yellow-600",
    photo: "tuscany,italy,vineyard",
    rating: 4.7,
  },
];

const CATEGORIES = ["all", "beach", "nature", "culture", "city"] as const;
type Category = (typeof CATEGORIES)[number];

const CROWD_COLOR: Record<string, string> = {
  Low: "text-emerald-600 bg-emerald-50",
  Medium: "text-amber-600 bg-amber-50",
  High: "text-red-500 bg-red-50",
};

export default function ExplorePage() {
  const [active, setActive] = useState<Category>("all");

  const filtered = active === "all" ? DESTINATIONS : DESTINATIONS.filter((d) => d.category === active);

  return (
    <>
      <TopBar title="Explore" />
      <div className="bg-gray-50 min-h-screen pb-8">

        {/* Header */}
        <div className="bg-linear-to-br from-indigo-600 via-violet-600 to-purple-700 px-5 pt-3 pb-8 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5" />
          <p className="relative text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-1">June picks</p>
          <h2 className="relative text-white text-xl font-black leading-tight">Where to travel<br />this month</h2>
        </div>

        {/* Category filter */}
        <div className="px-4 -mt-4 mb-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 flex gap-1 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`flex-1 min-w-fit px-3 py-2 rounded-xl text-xs font-bold capitalize transition-colors whitespace-nowrap ${
                  active === cat ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Destination cards */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          key={active}
          className="px-4 space-y-3"
        >
          <AnimatePresence mode="wait">
            {filtered.map((dest) => {
              const photoUrl = `https://source.unsplash.com/featured/800x500/?${dest.photo}`;
              return (
                <motion.div
                  key={dest.id}
                  variants={staggerItem}
                  layout
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
                >
                  {/* Photo header */}
                  <div
                    className={`relative h-44 bg-linear-to-br ${dest.color}`}
                    style={{ backgroundImage: `url(${photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
                  >
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/10" />
                    <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                      {dest.tags.map((t) => (
                        <span key={t} className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      <span className="text-white text-[11px] font-bold">{dest.rating}</span>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <p className="text-white text-lg font-black">{dest.name}</p>
                      <p className="text-white/80 text-xs flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{dest.country}
                      </p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">{dest.why}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 bg-blue-50 text-blue-600 rounded-full px-2.5 py-1">
                        <Thermometer className="h-3 w-3" />
                        <span className="text-xs font-semibold">{dest.temp}</span>
                      </div>
                      <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${CROWD_COLOR[dest.crowd]}`}>
                        <Clock className="h-3 w-3" />
                        {dest.crowd} season
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 text-amber-600 rounded-full px-2.5 py-1">
                        <Sun className="h-3 w-3" />
                        <span className="text-xs font-semibold">Best now</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

      </div>
    </>
  );
}
