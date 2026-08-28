"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Check,
  Coffee,
  DollarSign,
  LogOut,
  PauseCircle,
  PlayCircle,
  Plus,
  RotateCw,
  Search,
  Settings,
  Shield,
  Trash2,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import Logo from "@/components/Logo";
import type { OrderItem } from "@/db/schema";
import { defaultSettings } from "@/lib/menu-data";
import { clearStaffToken, readStaffToken, staffFetch, writeStaffToken } from "@/lib/staff-session";

type StoreSettings = typeof defaultSettings;

type Order = {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupTime: string;
  pickupDate: string;
  items: OrderItem[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  promoCode: string | null;
  status: string;
  paymentStatus: string;
  paymentRef: string | null;
  refundedCents: number;
  notes: string | null;
  createdAt: string;
};

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  points: number;
  totalSpentCents: number;
  orderCount: number;
};

type Promo = { id: number; code: string; type: string; value: number; minCents: number; uses: number; active: boolean; description: string | null };
type MenuRow = { id: string; name: string; description: string; price: number; category: string; image: string; soldOut: boolean; available: boolean; tags: string[] };
type Note = { id: number; type: string; destination: string; subject: string; message: string; createdAt: string };

type Tab = "orders" | "menu" | "reports" | "customers" | "promos" | "settings" | "inbox";

export default function AdminPage() {
  const unlockedRef = useRef(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [menu, setMenu] = useState<MenuRow[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [selected, setSelected] = useState<Order | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "breakfast", description: "" });
  const [newPromo, setNewPromo] = useState({ code: "", type: "percent", value: "10", min: "20", description: "" });
  const [saveMsg, setSaveMsg] = useState("");

  const unlock = (token?: string) => {
    if (token) writeStaffToken(token);
    unlockedRef.current = true;
    setError("");
    setPin("");
    setAuthed(true);
  };

  const lock = async () => {
    unlockedRef.current = false;
    clearStaffToken();
    setAuthed(false);
    setPin("");
    await staffFetch("/api/admin/login", { method: "DELETE" }).catch(() => undefined);
  };

  const load = async () => {
    if (!unlockedRef.current && !readStaffToken()) return;
    const [dash, menuRes] = await Promise.all([
      staffFetch("/api/admin/data"),
      staffFetch("/api/menu"),
    ]);
    if (!dash.ok) return;
    const data = await dash.json();
    const menuData = await menuRes.json().catch(() => ({ items: [] }));
    setOrders(data.orders || []);
    setCustomers(data.customers || []);
    setPromos(data.promos || []);
    setNotes(data.notifications || []);
    setSettings(data.settings || null);
    setMenu(menuData.items || []);
    setSelected((prev) => (prev ? data.orders.find((o: Order) => o.id === prev.id) || prev : null));
  };

  useEffect(() => {
    const existing = readStaffToken();
    if (existing) {
      unlock(existing);
      return;
    }
    setAuthed(false);
  }, []);

  useEffect(() => {
    if (!authed) return;
    load();
    const timer = setInterval(load, 8000);
    return () => clearInterval(timer);
  }, [authed]);

  const submitPin = async (value = pin) => {
    if (value.length < 4) return;
    const res = await staffFetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: value }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setShake(true);
      setError("Wrong access code");
      setPin("");
      setTimeout(() => setShake(false), 400);
      return;
    }
    unlock(typeof data.token === "string" ? data.token : "local-unlocked");
  };

  const press = (digit: string) => {
    const next = (pin + digit).slice(0, 4);
    setPin(next);
    if (next.length === 4) submitPin(next);
  };

  const updateStatus = async (id: number, status: string) => {
    await staffFetch("/api/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  };

  const refund = async (id: number) => {
    if (!confirm("Refund this prepaid order in full?")) return;
    await staffFetch("/api/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "refund" }),
    });
    load();
  };

  const saveSettings = async (next: StoreSettings) => {
    setSettings(next);
    const res = await staffFetch("/api/admin/data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: next }),
    });
    if (res.ok) {
      setSaveMsg("Settings saved successfully! ✓");
      setTimeout(() => setSaveMsg(""), 3000);
    } else {
      setSaveMsg("Failed to save settings.");
    }
  };

  const saveMenuItem = async (item: MenuRow) => {
    await staffFetch("/api/menu", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    load();
  };

  const addMenuItem = async () => {
    if (!newItem.name || !newItem.price) return;
    await staffFetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem),
    });
    setNewItem({ name: "", price: "", category: "breakfast", description: "" });
    load();
  };

  const addPromo = async () => {
    await staffFetch("/api/admin/data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promo: newPromo }),
    });
    setNewPromo({ code: "", type: "percent", value: "10", min: "20", description: "" });
    load();
  };

  const filtered = orders.filter((order) => {
    const hay = `${order.customerName} ${order.customerPhone} ${order.id}`.toLowerCase();
    return (filter === "all" || order.status === filter) && hay.includes(search.toLowerCase());
  });

  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.status !== "Cancelled");
    const revenue = paid.reduce((sum, o) => sum + (o.totalCents - o.refundedCents), 0) / 100;
    const active = orders.filter((o) => ["Confirmed", "Preparing", "Ready for Pickup"].includes(o.status)).length;
    const itemMap = new Map<string, number>();
    paid.forEach((order) => order.items.forEach((item) => itemMap.set(item.name, (itemMap.get(item.name) || 0) + item.quantity)));
    const popular = [...itemMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const aov = paid.length ? revenue / paid.length : 0;
    return { revenue, active, completed: orders.filter((o) => o.status === "Completed").length, popular, aov, count: paid.length };
  }, [orders]);

  if (authed === null) {
    return <div className="flex min-h-screen items-center justify-center bg-teal-deep text-brand">Loading staff gate…</div>;
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-teal-deep px-4">
        <div className={`w-full max-w-sm rounded-3xl bg-[#234040] p-8 text-center text-white shadow-2xl ${shake ? "animate-pin-shake" : ""}`}>
          <div className="mb-6 flex justify-center"><Logo size={96} /></div>
          <div className="mb-2 flex items-center justify-center gap-2 text-brand">
            <Shield className="h-4 w-4" /> Staff access
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Alenna Kitchen</h1>
          <p className="mt-2 text-sm text-white/60">Enter the 4-digit staff code to open the live order board.</p>
          <div className="my-6 flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`pin-dot ${pin.length > i ? "filled" : ""}`} />
            ))}
          </div>
          {error && <p className="mb-4 text-sm text-red-300">{error}</p>}
          <div className="grid grid-cols-3 gap-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "OK"].map((key) => (
              <button
                key={key}
                onClick={() => {
                  if (key === "C") setPin("");
                  else if (key === "OK") submitPin();
                  else press(key);
                }}
                className="rounded-2xl bg-white/10 py-4 text-xl font-semibold hover:bg-brand hover:text-teal-deep"
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Coffee }[] = [
    { id: "orders", label: "Orders", icon: Coffee },
    { id: "menu", label: "Menu", icon: UtensilsCrossed },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "customers", label: "Customers", icon: Users },
    { id: "promos", label: "Promos", icon: DollarSign },
    { id: "inbox", label: "Messages", icon: Search },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-teal-deep text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <Logo size={48} />
            <div>
              <p className="text-lg font-bold">Alenna Cafe · Staff</p>
              <p className="text-xs tracking-widest text-brand uppercase">Takanini kitchen dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {settings && (
              <button
                onClick={() => saveSettings({ ...settings, orderingEnabled: !settings.orderingEnabled })}
                className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${settings.orderingEnabled ? "bg-green-500/20 text-green-200" : "bg-red-500/20 text-red-200"}`}
              >
                {settings.orderingEnabled ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
                {settings.orderingEnabled ? "Ordering live" : "Ordering paused"}
              </button>
            )}
            <button onClick={load} className="rounded-xl bg-white/10 p-2"><RotateCw className="h-4 w-4" /></button>
            <a href="/" className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold">Website</a>
            <a
              href="/api/download"
              download="alenna-cafe.zip"
              className="rounded-xl bg-brand px-3 py-2 text-xs font-bold text-teal-deep inline-flex items-center gap-1.5"
            >
              Download full site
            </a>
            <button
              onClick={lock}
              className="rounded-xl bg-brand px-3 py-2 text-xs font-bold text-teal-deep"
            >
              <LogOut className="mr-1 inline h-3 w-3" /> Lock
            </button>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-4">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm whitespace-nowrap ${tab === item.id ? "bg-brand text-teal-deep" : "bg-white/10"}`}
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Active queue" value={String(stats.active)} />
          <Stat label="Completed" value={String(stats.completed)} />
          <Stat label="Prepaid revenue" value={`$${stats.revenue.toFixed(2)}`} />
          <Stat label="Avg order" value={`$${stats.aov.toFixed(2)}`} />
        </div>

        {tab === "orders" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-3">
              <div className="flex flex-wrap gap-2">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, #ID" className="flex-1 rounded-xl border bg-white px-4 py-2 text-sm" />
                {["all", "Confirmed", "Preparing", "Ready for Pickup", "Completed", "Cancelled"].map((status) => (
                  <button key={status} onClick={() => setFilter(status)} className={`rounded-xl px-3 py-2 text-xs font-bold ${filter === status ? "bg-teal text-brand" : "bg-white"}`}>
                    {status}
                  </button>
                ))}
              </div>
              {filtered.map((order) => (
                <button key={order.id} onClick={() => setSelected(order)} className={`w-full rounded-2xl border p-4 text-left ${selected?.id === order.id ? "border-teal bg-brand/10" : "border-transparent bg-white"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-teal">#{order.id} · {order.customerName}</p>
                      <p className="text-xs text-warm-gray">Pickup {order.pickupDate} {order.pickupTime} · {order.paymentStatus}</p>
                      <p className="mt-1 line-clamp-1 text-xs">{order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}</p>
                    </div>
                    <span className="rounded-full bg-cream px-2 py-1 text-[10px] font-bold uppercase">{order.status}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              {!selected ? (
                <p className="py-16 text-center text-sm text-warm-gray">Select an order to cook, refund or complete it.</p>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-teal">Order #{selected.id}</h3>
                  <p className="text-sm">{selected.customerName}</p>
                  <a className="block text-sm text-teal underline" href={`tel:${selected.customerPhone}`}>{selected.customerPhone}</a>
                  <p className="text-xs text-warm-gray">{selected.customerEmail}</p>
                  <p className="text-xs">Ref {selected.paymentRef} · Paid ${(selected.totalCents / 100).toFixed(2)}</p>
                  {selected.notes && <p className="rounded-xl bg-amber-50 p-3 text-xs">Kitchen: {selected.notes}</p>}
                  {selected.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}{item.modifiers?.length ? ` (${item.modifiers.map((m) => m.option).join(", ")})` : ""}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="space-y-2 pt-2">
                    <button onClick={() => updateStatus(selected.id, "Preparing")} className="w-full rounded-xl bg-teal/10 py-3 text-sm font-bold text-teal">Start preparing</button>
                    <button onClick={() => updateStatus(selected.id, "Ready for Pickup")} className="w-full rounded-xl bg-yellow-400 py-3 text-sm font-bold">Ready for pickup</button>
                    <button onClick={() => updateStatus(selected.id, "Completed")} className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white"><Check className="mr-1 inline h-4 w-4" /> Collected</button>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => updateStatus(selected.id, "Cancelled")} className="rounded-xl border border-red-200 py-2 text-xs text-red-600">Cancel</button>
                      <button onClick={() => refund(selected.id)} className="rounded-xl border py-2 text-xs">Full refund</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "menu" && (
          <div className="space-y-4">
            <div className="grid gap-3 rounded-2xl bg-white p-4 md:grid-cols-5">
              <input className="rounded-xl border px-3 py-2 text-sm" placeholder="New item name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
              <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Price" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} />
              <select className="rounded-xl border px-3 py-2 text-sm" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}>
                <option value="breakfast">Breakfast</option>
                <option value="sweet">Sweet</option>
                <option value="lunch">Lunch</option>
                <option value="drinks">Drinks</option>
              </select>
              <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Description" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
              <button onClick={addMenuItem} className="rounded-xl bg-teal text-sm font-bold text-brand"><Plus className="mr-1 inline h-4 w-4" /> Add item</button>
            </div>
            {menu.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4">
                <img src={item.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
                <div className="min-w-[180px] flex-1">
                  <input className="w-full font-semibold" value={item.name} onChange={(e) => setMenu((rows) => rows.map((row) => (row.id === item.id ? { ...row, name: e.target.value } : row)))} />
                  <p className="text-xs text-warm-gray">{item.category}</p>
                </div>
                <input className="w-20 rounded-lg border px-2 py-1 text-sm" value={item.price} onChange={(e) => setMenu((rows) => rows.map((row) => (row.id === item.id ? { ...row, price: Number(e.target.value) } : row)))} />
                <label className="text-xs"><input type="checkbox" checked={item.soldOut} onChange={(e) => setMenu((rows) => rows.map((row) => (row.id === item.id ? { ...row, soldOut: e.target.checked } : row)))} /> Sold out</label>
                <button onClick={() => saveMenuItem(item)} className="rounded-lg bg-teal px-3 py-2 text-xs font-bold text-brand">Save</button>
                <button
                  onClick={async () => {
                    await staffFetch(`/api/menu?id=${item.id}`, {
                      method: "DELETE",
                    });
                    load();
                  }}
                  className="rounded-lg p-2 text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "reports" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-6">
              <h3 className="mb-4 font-bold text-teal">Best sellers</h3>
              {stats.popular.map(([name, qty]) => (
                <div key={name} className="mb-2 flex justify-between text-sm">
                  <span>{name}</span>
                  <span className="font-bold">{qty} sold</span>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-white p-6 text-sm leading-7">
              <h3 className="mb-4 font-bold text-teal">Trading snapshot</h3>
              <p>Prepaid orders: {stats.count}</p>
              <p>Revenue after refunds: ${stats.revenue.toFixed(2)}</p>
              <p>Average order value: ${stats.aov.toFixed(2)}</p>
              <p>GST is included in listed prices.</p>
              <p>Export tip: copy these figures into Xero/MYOB at close.</p>
            </div>
          </div>
        )}

        {tab === "customers" && (
          <div className="overflow-x-auto rounded-2xl bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream text-xs uppercase"><tr><th className="p-3">Customer</th><th>Phone</th><th>Orders</th><th>Spend</th><th>Points</th></tr></thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-3"><strong>{c.name}</strong><br /><span className="text-xs text-warm-gray">{c.email}</span></td>
                    <td>{c.phone}</td>
                    <td>{c.orderCount}</td>
                    <td>${(c.totalSpentCents / 100).toFixed(2)}</td>
                    <td>{c.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "promos" && (
          <div className="space-y-4">
            <div className="grid gap-3 rounded-2xl bg-white p-4 md:grid-cols-5">
              <input className="rounded-xl border px-3 py-2 text-sm" placeholder="CODE" value={newPromo.code} onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value })} />
              <select className="rounded-xl border px-3 py-2 text-sm" value={newPromo.type} onChange={(e) => setNewPromo({ ...newPromo, type: e.target.value })}>
                <option value="percent">Percent</option>
                <option value="fixed">Fixed cents</option>
              </select>
              <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Value" value={newPromo.value} onChange={(e) => setNewPromo({ ...newPromo, value: e.target.value })} />
              <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Min spend $" value={newPromo.min} onChange={(e) => setNewPromo({ ...newPromo, min: e.target.value })} />
              <button onClick={addPromo} className="rounded-xl bg-teal font-bold text-brand">Create</button>
            </div>
            {promos.map((promo) => (
              <div key={promo.id} className="rounded-2xl bg-white p-4 text-sm">
                <strong>{promo.code}</strong> · {promo.type === "percent" ? `${promo.value}%` : `$${(promo.value / 100).toFixed(2)}`} off · used {promo.uses} times · {promo.description}
              </div>
            ))}
          </div>
        )}

        {tab === "inbox" && (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="rounded-2xl bg-white p-4">
                <p className="text-xs tracking-wide text-warm-gray uppercase">{note.type} · {note.destination}</p>
                <p className="font-semibold text-teal">{note.subject}</p>
                <p className="text-sm text-warm-gray">{note.message}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "settings" && settings && (
          <div className="max-w-xl space-y-4 rounded-3xl bg-white p-6">
            <label className="block text-sm font-semibold">Max orders per pickup slot
              <input type="number" className="mt-1 w-full rounded-xl border px-3 py-2" value={settings.maxOrdersPerSlot} onChange={(e) => setSettings({ ...settings, maxOrdersPerSlot: Number(e.target.value) })} />
            </label>
            <label className="block text-sm font-semibold">Minimum notice (minutes)
              <input type="number" className="mt-1 w-full rounded-xl border px-3 py-2" value={settings.minNoticeMinutes} onChange={(e) => setSettings({ ...settings, minNoticeMinutes: Number(e.target.value) })} />
            </label>
            <label className="block text-sm font-semibold">Slot length (minutes)
              <input type="number" className="mt-1 w-full rounded-xl border px-3 py-2" value={settings.slotMinutes} onChange={(e) => setSettings({ ...settings, slotMinutes: Number(e.target.value) })} />
            </label>
            <div className="flex items-center gap-4">
              <button onClick={() => saveSettings(settings)} className="rounded-xl bg-teal px-5 py-3 font-bold text-brand">Save settings</button>
              {saveMsg && <span className="text-sm font-semibold text-green-600 animate-pulse">{saveMsg}</span>}
            </div>
            <p className="text-xs text-warm-gray">Staff code is 4400. Change ADMIN_PIN in production hosting before handing this to the cafe.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-xs font-bold tracking-wider text-warm-gray uppercase">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-teal">{value}</p>
    </div>
  );
}
