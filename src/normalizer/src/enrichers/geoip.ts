import type { GeoLocation } from "@cse/shared";

export interface GeoIpEnricher {
  lookup(ip: string): Promise<GeoLocation | undefined>;
}

interface IpRange {
  start: number;
  end: number;
  location: GeoLocation;
}

const KNOWN_RANGES: IpRange[] = [
  {
    start: ipToNumber("190.0.0.0"),
    end: ipToNumber("190.255.255.255"),
    location: { country: "AR", city: "Buenos Aires" },
  },
  {
    start: ipToNumber("181.0.0.0"),
    end: ipToNumber("181.255.255.255"),
    location: { country: "AR", city: "Buenos Aires" },
  },
  {
    start: ipToNumber("8.0.0.0"),
    end: ipToNumber("8.255.255.255"),
    location: { country: "US", city: "Los Angeles" },
  },
  {
    start: ipToNumber("52.0.0.0"),
    end: ipToNumber("52.255.255.255"),
    location: { country: "US", city: "Seattle" },
  },
  {
    start: ipToNumber("104.0.0.0"),
    end: ipToNumber("104.255.255.255"),
    location: { country: "US", city: "San Francisco" },
  },
  {
    start: ipToNumber("185.0.0.0"),
    end: ipToNumber("185.255.255.255"),
    location: { country: "NL", city: "Amsterdam" },
  },
  {
    start: ipToNumber("91.0.0.0"),
    end: ipToNumber("91.255.255.255"),
    location: { country: "RU", city: "Moscow" },
  },
  {
    start: ipToNumber("31.0.0.0"),
    end: ipToNumber("31.255.255.255"),
    location: { country: "RU", city: "Saint Petersburg" },
  },
  {
    start: ipToNumber("103.0.0.0"),
    end: ipToNumber("103.255.255.255"),
    location: { country: "CN", city: "Beijing" },
  },
  {
    start: ipToNumber("202.0.0.0"),
    end: ipToNumber("202.255.255.255"),
    location: { country: "JP", city: "Tokyo" },
  },
];

function ipToNumber(ip: string): number {
  const parts = ip.split(".").map(Number);
  const p0 = parts[0] ?? 0;
  const p1 = parts[1] ?? 0;
  const p2 = parts[2] ?? 0;
  const p3 = parts[3] ?? 0;
  return ((p0 << 24) | (p1 << 16) | (p2 << 8) | p3) >>> 0;
}

function isPrivateIp(ip: string): boolean {
  const num = ipToNumber(ip);
  const ranges = [
    { start: ipToNumber("10.0.0.0"), end: ipToNumber("10.255.255.255") },
    { start: ipToNumber("172.16.0.0"), end: ipToNumber("172.31.255.255") },
    { start: ipToNumber("192.168.0.0"), end: ipToNumber("192.168.255.255") },
    { start: ipToNumber("127.0.0.0"), end: ipToNumber("127.255.255.255") },
  ];
  return ranges.some((r) => num >= r.start && num <= r.end);
}

export class MockGeoIpEnricher implements GeoIpEnricher {
  lookup(ip: string): Promise<GeoLocation | undefined> {
    if (!ip || isPrivateIp(ip)) {
      return Promise.resolve(undefined);
    }

    const num = ipToNumber(ip);
    const match = KNOWN_RANGES.find((r) => num >= r.start && num <= r.end);

    return Promise.resolve(match?.location);
  }
}
