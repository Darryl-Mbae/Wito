import AppChrome from "./AppChrome";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function MobileEventCard() {
  return (
    <div className="p-2">
      <div className="h-16 relative rounded-lg overflow-hidden">
        <img src="/images/imageurl.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <p className="text-[10px] font-semibold text-gray-900 mt-2">Leadership Summit</p>
      <p className="text-[9px] text-gray-500 mt-0.5">Jul 8 · 6:00 PM</p>
      <button className="mt-2 w-full rounded-md bg-[#7877C6] text-white text-[9px] font-semibold py-1.5">
        Create flyer
      </button>
    </div>
  );
}

export function CalendarMockup() {
  const events = [
    { day: 8, label: "Leadership Summit", color: "bg-[#7877C6]/12 text-[#7877C6] border-[#7877C6]" },
    { day: 15, label: "Community Mixer", color: "bg-emerald-50 text-emerald-700 border-emerald-400" },
    { day: 22, label: "Review tasks", color: "bg-amber-50 text-amber-700 border-amber-400", task: true },
  ];

  return (
    <AppChrome activeNav="Dashboard" className="aspect-[16/9]" mobilePreview={<MobileEventCard />}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">July 2026</p>
            <h3 className="text-sm font-semibold text-gray-900">Calendar</h3>
          </div>
          <div className="flex gap-1">
            <div className="h-6 w-6 rounded-lg bg-gray-50 border border-gray-100" />
            <div className="h-6 w-6 rounded-lg bg-gray-50 border border-gray-100" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[9px] font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, i) => {
            const day = i - 1;
            const ev = events.find((e) => e.day === day);
            const isToday = day === 6;
            return (
              <div
                key={i}
                className={`min-h-[52px] rounded-lg border p-1 ${
                  day < 1 || day > 31
                    ? "border-transparent"
                    : isToday
                      ? "border-[#7877C6]/30 bg-[#7877C6]/5"
                      : "border-gray-50"
                }`}
              >
                {day >= 1 && day <= 31 && (
                  <>
                    <span className={`text-[9px] font-medium ${isToday ? "text-[#7877C6]" : "text-gray-600"}`}>
                      {day}
                    </span>
                    {ev && (
                      <div className={`mt-0.5 truncate rounded px-1 py-0.5 text-[7px] font-medium border-l-2 ${ev.color}`}>
                        {ev.label}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppChrome>
  );
}

export function EventsMockup() {
  const events = [
    { name: "Leadership Summit", date: "Jul 8", loc: "Nairobi Serena", fee: "KES 500" },
    { name: "Community Mixer", date: "Jul 15", loc: "iHub Nairobi", fee: "Free" },
    { name: "Board Meeting", date: "Jul 22", loc: "Google Meet", virtual: true },
  ];

  return (
    <AppChrome activeNav="Events" className="aspect-[16/9]" mobilePreview={<MobileEventCard />}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Events</h3>
          <div className="rounded-lg bg-[#7877C6] px-2.5 py-1 text-[10px] font-semibold text-white">
            + New event
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {events.map((ev) => (
            <div key={ev.name} className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="aspect-[4/3] bg-linear-to-br from-[#7877C6]/20 to-[#a5a4e0]/30 relative">
                <img src="/images/imageurl.jpg" alt="" className="w-full h-full object-cover opacity-80" />
              </div>
              <div className="p-2.5">
                <p className="text-[11px] font-semibold text-gray-900 truncate">{ev.name}</p>
                <p className="text-[9px] text-gray-400 mt-0.5">{ev.date} · {ev.loc}</p>
                <span className="inline-block mt-1.5 rounded-md bg-gray-50 px-1.5 py-0.5 text-[8px] font-medium text-gray-600">
                  {ev.fee}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppChrome>
  );
}

export function DesignMockup() {
  return (
    <AppChrome activeNav="Design" className="aspect-[16/9]">
      <div className="p-4">
        <div className="flex gap-3 border-b border-gray-100 mb-4">
          {["Templates", "Flyers", "Integrations"].map((tab, i) => (
            <span
              key={tab}
              className={`pb-2 text-[10px] font-medium border-b-2 ${
                i === 0 ? "border-[#7877C6] text-[#7877C6]" : "border-transparent text-gray-400"
              }`}
            >
              {tab}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "IG Post", ratio: "aspect-square" },
            { label: "IG Story", ratio: "aspect-[9/16]" },
            { label: "Calendar A4", ratio: "aspect-[3/4]" },
          ].map((t) => (
            <div key={t.label} className="rounded-xl border border-gray-100 overflow-hidden">
              <div className={`${t.ratio} bg-linear-to-br from-[#7877C6]/15 to-[#5b5aa0]/20 flex items-center justify-center`}>
                <div className="text-center px-2">
                  <p className="text-[8px] font-bold text-[#7877C6] uppercase tracking-wider">You're invited</p>
                  <p className="text-[10px] font-bold text-gray-800 mt-1">Leadership Summit</p>
                  <p className="text-[7px] text-gray-500 mt-0.5">Jul 8 · 6:00 PM</p>
                </div>
              </div>
              <p className="text-[9px] font-medium text-gray-600 p-2">{t.label}</p>
            </div>
          ))}
        </div>
      </div>
    </AppChrome>
  );
}

export function TasksMockup() {
  const tasks = [
    { title: "Confirm venue booking", assignee: "Sarah", due: "Jul 5", done: true },
    { title: "Send director invites", assignee: "James", due: "Jul 7", done: false },
    { title: "Prepare registration form", assignee: "Amina", due: "Jul 10", done: false },
  ];

  return (
    <AppChrome activeNav="Tasks" className="aspect-[16/9]">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Tasks</h3>
          <div className="flex gap-2 text-[9px]">
            <span className="font-semibold text-[#7877C6] border-b border-[#7877C6] pb-0.5">To do</span>
            <span className="text-gray-400">Done</span>
          </div>
        </div>
        <div className="space-y-1.5">
          {tasks.map((t) => (
            <div key={t.title} className="flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2">
              <div className={`h-3.5 w-3.5 rounded-full border-2 shrink-0 ${
                t.done ? "bg-emerald-500 border-emerald-500" : "border-gray-300"
              }`} />
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] font-medium truncate ${t.done ? "text-gray-400 line-through" : "text-gray-800"}`}>
                  {t.title}
                </p>
                <p className="text-[8px] text-gray-400">{t.assignee} · Due {t.due}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppChrome>
  );
}

export function DirectorsMockup() {
  const directors = [
    { name: "James Ochieng", role: "Owner", status: "Active" },
    { name: "Sarah Wanjiku", role: "Director", status: "Active" },
    { name: "David Kimani", role: "Director", status: "Pending" },
  ];

  return (
    <AppChrome activeNav="Directors" className="aspect-[16/9]">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Directors</h3>
          <div className="rounded-lg border border-gray-200 px-2 py-1 text-[9px] font-medium text-gray-600">
            + Invite
          </div>
        </div>
        <div className="space-y-2">
          {directors.map((d) => (
            <div key={d.name} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-[#7877C6]/15 flex items-center justify-center text-[10px] font-bold text-[#7877C6]">
                  {d.name[0]}
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-900">{d.name}</p>
                  <p className="text-[8px] text-gray-400">{d.role}</p>
                </div>
              </div>
              <span className={`text-[8px] font-medium px-2 py-0.5 rounded-full ${
                d.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
              }`}>
                {d.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AppChrome>
  );
}

export function RegistrationMockup() {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-[#7877C6]/10 overflow-hidden max-w-sm mx-auto">
      <div className="h-28 relative">
        <img src="/images/imageurl.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-3 left-4">
          <p className="text-white text-sm font-bold">Leadership Summit</p>
          <p className="text-white/80 text-[10px]">Saturday, July 8 · 6:00 PM</p>
        </div>
      </div>
      <div className="p-4 space-y-2.5">
        <div className="h-7 rounded-lg bg-gray-50 border border-gray-100 px-3 flex items-center text-[10px] text-gray-400">
          Full name
        </div>
        <div className="h-7 rounded-lg bg-gray-50 border border-gray-100 px-3 flex items-center text-[10px] text-gray-400">
          Email address
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-7 rounded-lg bg-[#7877C6]/10 border border-[#7877C6]/30 flex items-center justify-center text-[9px] font-semibold text-[#7877C6]">
            Club member
          </div>
          <div className="flex-1 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-[9px] text-gray-500">
            Guest
          </div>
        </div>
        <div className="h-8 rounded-lg bg-[#7877C6] flex items-center justify-center text-[10px] font-semibold text-white">
          Register for event
        </div>
      </div>
    </div>
  );
}

export function AttendanceMockup() {
  const rows = [
    { name: "Sarah Wanjiku", attended: true },
    { name: "David Kimani", attended: true },
    { name: "Grace Muthoni", attended: false },
  ];

  return (
    <AppChrome activeNav="Events" className="aspect-[16/9]">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] text-gray-400">Leadership Summit</p>
            <h3 className="text-sm font-semibold text-gray-900">Registrations</h3>
          </div>
          <div className="rounded-lg border border-gray-200 px-2 py-1 text-[8px] font-medium text-gray-600">
            Export CSV
          </div>
        </div>
        <div className="mb-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full w-2/3 rounded-full bg-emerald-500" />
        </div>
        <p className="text-[9px] text-gray-400 mb-2">67% attendance rate</p>
        <div className="space-y-1.5">
          {rows.map((r) => (
            <div key={r.name} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
              <span className="text-[10px] font-medium text-gray-800">{r.name}</span>
              <div className={`h-4 w-8 rounded-full ${r.attended ? "bg-emerald-500" : "bg-gray-200"}`} />
            </div>
          ))}
        </div>
      </div>
    </AppChrome>
  );
}
