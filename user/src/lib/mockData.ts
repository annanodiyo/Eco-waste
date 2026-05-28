export type ChainStatus = "verified" | "signed" | "pending" | "archived";

export type ChainEvent = {
  id: string;
  stage: "manufacturer" | "distributor" | "retailer" | "consumer" | "collection" | "recycler";
  actor: string;
  location: string;
  blockNumber: number;
  txHash: string;
  timestamp: string;
  weightKg?: number;
  material?: string;
  status: ChainStatus;
};

export type Product = {
  id: string;
  name: string;
  material: string;
  weightKg: number;
  tokenReward: number;
  manufacturer: string;
  batchId: string;
  events: ChainEvent[];
};

const tx = (s: string) => `0x${s}`;

export const STAGES = [
  { key: "manufacturer", label: "Manufacturer" },
  { key: "distributor", label: "Distributor" },
  { key: "retailer", label: "Retailer" },
  { key: "consumer", label: "Consumer" },
  { key: "collection", label: "Collection Point" },
  { key: "recycler", label: "Recycler" },
] as const;

export const MATERIAL_FACTORS: Record<string, number> = {
  PET: 12,
  HDPE: 9,
  Aluminum: 18,
  Glass: 6,
  Paper: 4,
  Cardboard: 3,
};

export const PRODUCTS: Product[] = [
  {
    id: "XC-992-B",
    name: "Spring Water 500ml",
    material: "PET",
    weightKg: 0.024,
    tokenReward: 12.5,
    manufacturer: "Polymer Co.",
    batchId: "B-2041",
    events: [
      {
        id: "e1",
        stage: "manufacturer",
        actor: "Polymer Co.",
        location: "Rotterdam, NL",
        blockNumber: 842410,
        txHash: tx("9af31c2b48d1e0f72c4b8a90c3e2d1f44e7a"),
        timestamp: "2026-05-04T08:12:00Z",
        weightKg: 0.024,
        material: "PET",
        status: "verified",
      },
      {
        id: "e2",
        stage: "distributor",
        actor: "Global Freight",
        location: "Hamburg Hub",
        blockNumber: 842510,
        txHash: tx("a1c298b1f7e44c5d2f0a9d811bce4d3c7711"),
        timestamp: "2026-05-08T14:32:00Z",
        status: "signed",
      },
      {
        id: "e3",
        stage: "retailer",
        actor: "North Market",
        location: "Berlin Mitte",
        blockNumber: 842678,
        txHash: tx("3d44e91c8b18a4f6e9c021b7eaf08812dd55"),
        timestamp: "2026-05-12T09:48:00Z",
        status: "verified",
      },
      {
        id: "e4",
        stage: "consumer",
        actor: "Wallet 0xA1b2…F09e",
        location: "Kreuzberg, Berlin",
        blockNumber: 842810,
        txHash: tx("71c8aa4f10e2c93bb1f87e2a6d3941058e29"),
        timestamp: "2026-05-22T19:11:00Z",
        weightKg: 0.024,
        material: "PET",
        status: "verified",
      },
      {
        id: "e5",
        stage: "collection",
        actor: "Smart Bin #B-04",
        location: "Görlitzer Park",
        blockNumber: 842910,
        txHash: tx("ff20cc18d3a90bf17e6a4c83e10912af0e22"),
        timestamp: "2026-05-26T11:02:00Z",
        weightKg: 0.024,
        status: "verified",
      },
      {
        id: "e6",
        stage: "recycler",
        actor: "Loop Recyclers GmbH",
        location: "Leipzig Facility",
        blockNumber: 843001,
        txHash: tx(""),
        timestamp: "",
        status: "pending",
      },
    ],
  },
];

export const RECENT_TX = [
  { hash: "0x7a2c…4f1d", action: "Recycler Drop-off", value: "+45.0 ECO", status: "Confirmed" },
  { hash: "0xb1c9…9a22", action: "Provenance Scan", value: "0.0 ECO", status: "Confirmed" },
  { hash: "0x3d44…88e1", action: "Token Redemption", value: "-120.0 ECO", status: "Pending" },
  { hash: "0xe10a…22b6", action: "Drop-off PET 24g", value: "+12.5 ECO", status: "Confirmed" },
  { hash: "0x55f2…7d31", action: "Drop-off HDPE 60g", value: "+18.0 ECO", status: "Confirmed" },
];

export const VERIFICATION_QUEUE = [
  { id: "Q-1031", user: "0x71C8…8E29", material: "PET", est: "0.36 kg", time: "2m ago" },
  { id: "Q-1032", user: "0xB1c2…9a22", material: "Aluminum", est: "0.12 kg", time: "5m ago" },
  { id: "Q-1033", user: "0xA1b2…F09e", material: "Glass", est: "1.40 kg", time: "11m ago" },
  { id: "Q-1034", user: "0xC840…118e", material: "HDPE", est: "0.84 kg", time: "22m ago" },
];

export const INVENTORY = [
  { material: "PET", kg: 412, cap: 600 },
  { material: "HDPE", kg: 188, cap: 400 },
  { material: "Aluminum", kg: 96, cap: 200 },
  { material: "Glass", kg: 540, cap: 800 },
  { material: "Paper", kg: 220, cap: 500 },
];

export const PICKUPS = [
  { id: "PKP-220", ngo: "Loop Recyclers GmbH", window: "Today, 16:00", status: "Confirmed" },
  { id: "PKP-221", ngo: "ReNova NGO", window: "Tomorrow, 09:00", status: "Pending" },
  { id: "PKP-222", ngo: "Loop Recyclers GmbH", window: "Fri, 11:30", status: "Scheduled" },
];

export const BATCHES = [
  { id: "B-2041", material: "PET", kg: 412, source: "Görlitzer Park CP", status: "Processing", reward: 1840 },
  { id: "B-2042", material: "HDPE", kg: 188, source: "Mitte CP", status: "Confirmed", reward: 920 },
  { id: "B-2043", material: "Aluminum", kg: 96, source: "Prenzlauer CP", status: "Closed", reward: 1480 },
  { id: "B-2044", material: "Glass", kg: 540, source: "Görlitzer Park CP", status: "Awaiting Pickup", reward: 0 },
];

export const WEEKLY_THROUGHPUT = [
  { day: "Mon", kg: 220 },
  { day: "Tue", kg: 340 },
  { day: "Wed", kg: 280 },
  { day: "Thu", kg: 410 },
  { day: "Fri", kg: 380 },
  { day: "Sat", kg: 510 },
  { day: "Sun", kg: 290 },
];

export const MATERIAL_BREAKDOWN = [
  { material: "PET", kg: 412 },
  { material: "HDPE", kg: 188 },
  { material: "Alu", kg: 96 },
  { material: "Glass", kg: 540 },
  { material: "Paper", kg: 220 },
];

export const MANUFACTURER_BATCHES = [
  { id: "MFG-9821", product: "Spring Water 500ml", units: 24000, material: "PET", status: "In Circulation" },
  { id: "MFG-9822", product: "Yogurt Cup 200g", units: 12000, material: "HDPE", status: "Retail" },
  { id: "MFG-9823", product: "Energy Drink 330ml", units: 48000, material: "Aluminum", status: "Distribution" },
];
