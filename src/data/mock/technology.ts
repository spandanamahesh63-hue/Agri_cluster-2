import type { Technology } from "../../types";

// Technologies adapted to small-farm economics: each is accessed as a shared
// cluster service rather than bought by one farmer. Costs are indicative.
export const technologies: Technology[] = [
  {
    id: "tech-soil",
    name: "Soil moisture sensors",
    category: "sensing",
    summary: "Low-cost probes that report soil moisture so irrigation follows the crop's need, not the calendar.",
    howItWorks: [
      "A probe is placed in the root zone of a representative field.",
      "It reports soil moisture several times a day.",
      "AgriCluster compares it with what your crop stage needs and the rain forecast.",
      "You receive a suggestion to irrigate, wait, or shorten irrigation.",
    ],
    access: "Cluster-owned probes, one shared across neighbouring fields with similar soil.",
    indicativeCost: "₹150 / month per farm",
  },
  {
    id: "tech-weather",
    name: "Cluster weather station",
    category: "monitoring",
    summary: "One station for the cluster gives local rainfall, humidity and temperature instead of district averages.",
    howItWorks: [
      "The station records rain, humidity, wind and temperature every 15 minutes.",
      "Readings are combined with the regional forecast.",
      "Disease-risk and irrigation suggestions use these local readings.",
    ],
    access: "Installed once for the whole cluster; every member benefits.",
    indicativeCost: "Included in cluster membership",
  },
  {
    id: "tech-drone",
    name: "Drone spraying & scouting",
    category: "application",
    summary: "Book a licensed operator to scout for crop stress or spray precisely, instead of owning a drone.",
    howItWorks: [
      "You request a visit for specific fields.",
      "The operator flies a planned route and captures images or sprays.",
      "Images are reviewed for stress patterns; spray volumes are recorded.",
    ],
    access: "Booked per visit from a cluster service provider.",
    indicativeCost: "From ₹800 / acre per visit",
  },
  {
    id: "tech-drip",
    name: "Smart irrigation controller",
    category: "irrigation",
    summary: "Adds scheduling to an existing drip system so irrigation can be delayed or shortened with one tap.",
    howItWorks: [
      "A controller is fitted to your pump and drip valves.",
      "Accepted AgriCluster suggestions can update the schedule.",
      "You can always override it manually.",
    ],
    access: "Installed per farm; installation crews shared across the cluster.",
    indicativeCost: "₹6,000–9,000 one-time (indicative)",
  },
  {
    id: "tech-solar",
    name: "Solar pumping",
    category: "energy",
    summary: "Run irrigation on daytime solar power to reduce dependence on limited grid hours.",
    howItWorks: [
      "Solar panels power the pump directly during the day.",
      "AgriCluster suggests moving irrigation into strong-sun hours when the crop allows it.",
      "Grid power remains available as backup.",
    ],
    access: "Individual or shared pumps; the cluster can help with scheme applications.",
    indicativeCost: "Depends on pump size and subsidy",
  },
  {
    id: "tech-sat",
    name: "Satellite crop monitoring",
    category: "monitoring",
    summary: "Regular satellite images show which fields are greening up or declining compared with neighbours.",
    howItWorks: [
      "Satellite images of the cluster are processed every few days.",
      "A vegetation index is calculated for each field.",
      "Fields that decline faster than similar ones are flagged for inspection.",
    ],
    access: "Subscribed once at cluster level.",
    indicativeCost: "Included in cluster membership",
  },
];
