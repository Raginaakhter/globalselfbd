import React from "react";
import { Layout, Server, ShoppingBag, CreditCard, Rocket } from "lucide-react";

export default function ProgressOverview() {
  const milestones = [
    {
      title: "UI & Frontend Experience",
      percent: 95,
      icon: Layout,
      color: "from-cyan-500 to-blue-500",
      description: "Responsive Next.js & Tailwind Interface",
    },
    {
      title: "Core Backend Systems",
      percent: 88,
      icon: Server,
      color: "from-blue-500 to-indigo-500",
      description: "Node.js REST & GraphQL Microservices",
    },
    {
      title: "Product Shelf & Catalog",
      percent: 75,
      icon: ShoppingBag,
      color: "from-indigo-500 to-purple-500",
      description: "Global Inventory & SKU Mapping",
    },
    {
      title: "Payment & Logistics Integration",
      percent: 82,
      icon: CreditCard,
      color: "from-purple-500 to-emerald-500",
      description: "bKash, Nagad, Visa & Local Express Shipping",
    },
  ];

  return (
    <section className="w-full max-w-4xl mx-auto my-12 px-4">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-cyan-400">
          <Rocket className="w-3.5 h-3.5" />
          Roadmap Progress
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mt-3">
          Behind the Scenes Development
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
          We are working around the clock to build a seamless global shopping experience for Bangladesh.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {milestones.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <div
              key={idx}
              className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/60 text-cyan-400">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    <p className="text-xs text-slate-400">{item.description}</p>
                  </div>
                </div>
                <span className="text-sm font-extrabold font-mono text-cyan-300">
                  {item.percent}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-1000 ease-out`}
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
