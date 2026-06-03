import React from "react";
import { Plus } from "lucide-react";

type Tab = "All" | "Registration" | "Attendance";



interface EventsProps {
  initialTab?: Tab;
}

const Events: React.FC<EventsProps> = () => {


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Events</h2>
          {/* <p className="text-sm text-gray-500 mt-1">Manage your events and track participation.</p> */}
        </div>
        <button className="flex items-center gap-2 rounded-[8px] bg-[#7877C6] px-4 py-2 text-sm font-medium text-white hover:bg-[#7877C6]/90 transition cursor-pointer">
          <Plus size={15} />
          New Event
        </button>
      </div>




    </div>
  );
};

export default Events;
