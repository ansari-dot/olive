import React from 'react';

interface ShippingPolicyPageProps {
  onNavigateHome: () => void;
  onNavigateShop: () => void;
  onNavigateContact: () => void;
}

export const ShippingPolicyPage: React.FC<ShippingPolicyPageProps> = ({
  onNavigateHome,
  onNavigateShop,
  onNavigateContact,
}) => {
  const sections = [
    {
      label: 'Delivery & Coverage',
      title: 'Nationwide Dispatch Across Pakistan',
      body: 'Orders placed before 2:00 PM PKT Monday through Saturday are dispatched the same business day from our Chakwal Road hub in Islamabad via TCS Express. Delivery takes 1–2 business days to Islamabad, Rawalpindi, and Lahore, and 2–4 business days to Karachi, Peshawar, Multan, Faisalabad, and regional cities.',
    },
    {
      label: 'Shipping Rates',
      title: 'Free Shipping Over Rs. 1,200',
      body: 'Every order of Rs. 1,200 or more ships free anywhere in Pakistan. Orders under Rs. 1,200 carry a flat Rs. 200 nationwide courier fee. Cash on Delivery is available on all orders with zero hidden surcharges.',
    },
    {
      label: 'Bottle Protection & Returns',
      title: '7-Day Seal-Intact & Breakage Guarantee',
      body: 'All dark-glass bottles and ceramic jars ship in custom corrugated sleeves. If any parcel arrives damaged in transit or with a broken tamper seal, share a photo with care@zaitoonpakistan.pk within 48 hours for an immediate free replacement or full refund.',
    },
    {
      label: 'Cold-Press Purity',
      title: 'Verified Acidity & Batch Testing',
      body: 'Every Potohar and Swat olive oil harvest is extracted mechanically below 27°C without chemical solvents and tested for free fatty acidity (< 0.3%). Store bottles away from direct sunlight in a cool pantry.',
    },
  ];

  return (
    <main className="w-full bg-white py-10 sm:py-12 lg:py-14">
      <div className="max-w-[1220px] mx-auto px-6 sm:px-10 lg:px-14">
        <nav aria-label="Breadcrumb" className="mb-8 text-[12.5px] text-[#777777]">
          <button
            type="button"
            onClick={onNavigateHome}
            className="hover:text-[#181818] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span className="mx-1.5" aria-hidden="true">
            /
          </span>
          <span className="text-[#444444]">Shipping &amp; Purity Guarantee</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 mb-10 border-b border-[#EAEAEA]">
          <div>
            <p className="text-[11.5px] uppercase tracking-[0.12em] text-[#C46B3B] font-semibold mb-1.5">
              Orchard Promise
            </p>
            <h1 className="text-[30px] sm:text-[36px] font-normal text-[#181818] leading-tight">
              Shipping, Returns &amp; Purity Guarantee
            </h1>
          </div>
          <button
            type="button"
            onClick={onNavigateShop}
            className="self-start sm:self-auto border border-[#181818] bg-white hover:bg-[#181818] hover:text-white px-5 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#181818] transition-colors cursor-pointer shrink-0"
          >
            BROWSE SHOP
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          {sections.map((item) => (
            <section key={item.title} className="bg-[#FAF3F0] p-7 sm:p-8">
              <p className="text-[11px] uppercase tracking-[0.09em] text-[#C46B3B] font-semibold">
                {item.label}
              </p>
              <h2 className="mt-2 text-[20px] font-normal text-[#181818]">{item.title}</h2>
              <p className="mt-3 text-[13.5px] leading-[1.72] text-[#555555]">{item.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-[#EAEAEA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-[13.5px] text-[#555555]">
            Need help with an active TCS shipment or damaged bottle?
          </p>
          <button
            type="button"
            onClick={onNavigateContact}
            className="self-start sm:self-auto bg-[#0B0B0B] hover:bg-[#15472B] text-white text-[11.5px] font-semibold uppercase tracking-[0.09em] px-7 py-3 transition-colors cursor-pointer shrink-0"
          >
            CONTACT ORCHARD CARE
          </button>
        </div>
      </div>
    </main>
  );
};
