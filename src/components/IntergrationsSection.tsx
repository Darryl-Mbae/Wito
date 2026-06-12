import React from "react";
import { CheckCircle2 } from "lucide-react";
import { PremiumFeature } from "./PremiumFeature";

export type Integration = {
    id: string;
    name: string;
    description: string;
    connected: boolean;
    alwaysOn?: boolean;
    image: string;
    docsUrl?: string;
};

type Props = {
    integrations: Integration[];
    onToggle: (id: string) => void;
    plan?: string;
};

const IntegrationCard: React.FC<{ integration: Integration; onToggle: () => void; plan?: string }> = ({
    integration,
    onToggle,
    plan = "free",
}) => {
    const isPremium = plan !== "free";
    const needsPremium = !integration.alwaysOn;

    return (
        <PremiumFeature
            isPremium={!isPremium && needsPremium}
            description={`Connecting to ${integration.name} requires a Premium plan.`}
            className="w-full"
        >
            <div className={`relative bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-start gap-4 pb-5 transition-all ease-in-out duration-250 ${needsPremium && !isPremium ? "opacity-75 grayscale-[0.3]" : "hover:mt-2"}`}>
                <div className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                    <img
                        src={integration.image}
                        alt={integration.name}
                        className="h-8 w-8 object-contain"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-semibold text-gray-900">{integration.name}</p>
                    </div>
                    <p className="text-[11px] text-gray-900 leading-relaxed">{integration.description}</p>
                </div>
                <div className="absolute top-3 right-3 ">
                    {integration.alwaysOn ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-600 shrink-0">
                            <CheckCircle2 size={11} />
                            Active
                        </div>
                    ) : (
                        <button
                            onClick={onToggle}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer
                            ${integration.connected
                                    ? "border-[#7877C6] text-[#7877C6] bg-[#7877C6]/5 hover:bg-[#7877C6]/10"
                                    : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
                                }`}
                        >
                            {integration.connected ? (
                                <><CheckCircle2 size={11} className="text-[#7877C6]" /> Connected</>
                            ) : "Connect"}
                        </button>
                    )}
                </div>

            </div>
        </PremiumFeature>
    );
};

const IntegrationsSection: React.FC<Props> = ({ integrations, onToggle, plan = "free" }) => {
    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {integrations.map((integration) => (
                    <IntegrationCard
                        key={integration.id}
                        integration={integration}
                        onToggle={() => onToggle(integration.id)}
                        plan={plan}
                    />
                ))}
            </div>
        </div>
    );
};

export default IntegrationsSection;