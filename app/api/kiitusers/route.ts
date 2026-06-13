import { NextRequest, NextResponse } from "next/server";

const KIIT_API = process.env.KIIT_API_URL || "http://172.22.0.1:4006";

// Groups we expose — mapped to their API endpoints
const GROUPS: Record<string, string> = {
  all     : "/admin/users",
  premium : "/kiitusers/getUser/premium",
  free    : "/kiitusers/getUser/nonpremium",
};

// Normalise a raw user object from any endpoint into a consistent shape
function normalise(u: Record<string, unknown>) {
  return {
    id          : (u.id   || u._id || "") as string,
    name        : (u.name || "")          as string,
    email       : (u.email || "")         as string,
    isPremium   : Boolean(u.isPremium),
    profileImage: (u.profileImage || null) as string | null,
  };
}

/**
 * GET /api/kiitusers?group=all|premium|free&limit=50&page=1&search=foo
 *
 * Proxies the KIITConnect backend and returns a normalised paginated list.
 * - "all"     → /admin/users (has real pagination + total)
 * - "premium" → /kiitusers/getUser/premium (returns full list in one shot)
 * - "free"    → /kiitusers/getUser/nonpremium (same)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const group  = (searchParams.get("group") || "all") as keyof typeof GROUPS;
  const limit  = Math.min(100, parseInt(searchParams.get("limit") || "50"));
  const page   = Math.max(1,   parseInt(searchParams.get("page")  || "1"));
  const search = searchParams.get("search")?.toLowerCase().trim() || "";

  const endpoint = GROUPS[group];
  if (!endpoint) return NextResponse.json({ error: "Invalid group" }, { status: 400 });

  try {
    if (group === "all") {
      // admin/users supports limit param
      const url = `${KIIT_API}/admin/users?limit=${limit}&skip=${(page - 1) * limit}`;
      const raw = await fetch(url, { cache: "no-store" }).then((r) => r.json());
      let users: ReturnType<typeof normalise>[] = (raw.users || []).map(normalise);
      if (search) {
        users = users.filter(
          (u) => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
        );
      }
      return NextResponse.json({
        users,
        total: raw.total || 0,
        page,
        pages: Math.ceil((raw.total || 0) / limit),
        group,
      });
    } else {
      // premium / free — full list, we paginate client-side
      const raw = await fetch(`${KIIT_API}${endpoint}`, { cache: "no-store" }).then((r) => r.json());
      // premium returns { length, user: [...] }, free returns array directly
      const allUsers: ReturnType<typeof normalise>[] = (
        Array.isArray(raw) ? raw : raw.user || []
      ).map(normalise);

      let filtered = allUsers;
      if (search) {
        filtered = allUsers.filter(
          (u) => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
        );
      }
      const total = filtered.length;
      const start = (page - 1) * limit;
      return NextResponse.json({
        users : filtered.slice(start, start + limit),
        total,
        page,
        pages : Math.ceil(total / limit),
        group,
      });
    }
  } catch (err) {
    console.error("[KIITUsers] fetch error:", err);
    return NextResponse.json({ error: "Failed to reach KIITConnect API" }, { status: 502 });
  }
}
