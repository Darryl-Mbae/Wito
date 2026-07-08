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
            title: "Attendance & Check-in",
            desc: "Track registrations, attendance, and engagement in real time.",
            icon: ChartNoAxesColumn,
        },
    ];

    return (
        <section className="w-full border-y border-border-light min-h-screen">
            <div className="border-l border-r border-border-light min-h-screen flex flex-col">

                {/* Features */}
                <div className="w-full border-b border-border-light">
                    <div className="w-[90%] lg:w-[80%] mx-auto border-l border-r border-border-light grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
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
                <div className="flex-1 w-[90%] lg:w-[80%] mx-auto border-l border-r border-border-light">
                    <div className="text-center mx-auto items-center">
                        <h2 className="text-[16px] font-bold text-gray-900 mb-2 mt-20">
                            Not afraid of a little code?
                        </h2>

                        <p className="w-[40%] mx-auto text-sm text-gray-600 mb-8">
                            While everyone else is dragging, dropping, and publishing flyers in
                            minutes, developers can unlock an extra layer of customization with
                            HTML, CSS, and JavaScript templates.
                        </p>
                    </div>
                    <div className="w-[90%] mx-auto pb-20">
                        <div className="w-full gird grid grid-cols-[39.5%_29.5%_29%] gap-[1%] h-[300px]">
                            <div className="w-full h-full bg-red-500 rounded-xl">

                            </div>
                            <div className="w-full h-full bg-amber-600 rounded-xl">

                            </div>
                            <div className="w-full h-full bg-red-500 rounded-xl">

                            </div>
                        </div>
                        <div className="w-full gird grid grid-cols-[31.6%_44.6%_21.8%] gap-[1%] h-[300px] mt-4">
                            <div className="w-full h-full rounded-xl bg-red-500">
                            </div>
                            <div className="w-full h-full bg-amber-600 rounded-xl">

                            </div>
                            <div className="w-full h-full bg-red-500 rounded-xl">
                                <img src={""} alt="" className="w-full h-full" />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}