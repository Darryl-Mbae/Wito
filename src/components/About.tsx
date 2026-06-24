import {
    CalendarCheck,
    Library,
    Star,
    ChartNoAxesColumn
} from "lucide-react";

export default function About() {
    const items = [
        {
            title: "Flyer Generation",
            desc: "Create event flyers instantly from ready-made templates.",
            icon: Star,
        },
        {
            title: "Event Management",
            desc: "Plan events, assign tasks, and manage registrations in one place.",
            icon: CalendarCheck,
        },
        {
            title: "All-in-One Workspace",
            desc: "Bring planning, communication, and task management into a single hub.",
            icon: Library,
        },
        {
            title: "Insights & Analytics",
            desc: "Track registrations, attendance, and engagement in real time.",
            icon: ChartNoAxesColumn,
        },
    ];

    return (
        <section className="w-full border-y border-border-light min-h-screen">
            <div className="w-[90%] lg:w-[80%] mx-auto border-l border-r border-border-light min-h-screen flex flex-col">

                {/* Features */}
                <div className="border-b border-border-light">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                        {items.map((item, index) => {
                            const Icon = item.icon;

                            return (
                                <div
                                    key={index}
                                    className={`
                                        p-8
                                        border-border-light
                                        ${index !== items.length - 1
                                            ? "lg:border-r"
                                            : ""
                                        }
                                        border-b lg:border-b-0
                                    `}
                                >
                                    <Icon
                                        size={22}
                                        className="mb-6 text-primary"
                                    />

                                    <h3 className="text-[16px] font-semibold mb-3 ">
                                        {item.title}
                                    </h3>

                                    <p className="text-sm leading-relaxed text-neutral-600">
                                        {item.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-8">
                    Content
                </div>

            </div>
        </section>
    );
}