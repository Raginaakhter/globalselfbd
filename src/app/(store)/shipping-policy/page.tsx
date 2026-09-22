import type { Metadata } from "next";
import { fetchSite } from "@/lib/site-fetch";
import LegalPageLayout, { type LegalSection } from "@/components/legal/LegalPageLayout";
import ContactDetailsBlock from "@/components/legal/ContactDetailsBlock";
import { formatPrice } from "@/lib/shop";
import type { SiteSettings } from "@/lib/site-types";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy | Global Shelf BD",
  description: "Delivery charges, timelines and what to expect when your Global Shelf BD order ships.",
};

const LAST_UPDATED = "September 22, 2026";

function QuickFacts({ settings }: { settings: SiteSettings }) {
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden mb-2">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
            <th className="px-4 py-3">Delivery Location</th>
            <th className="px-4 py-3">Charge</th>
            <th className="px-4 py-3">Estimated Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          <tr>
            <td className="px-4 py-3 font-semibold text-navy-800">Inside Dhaka</td>
            <td className="px-4 py-3">{formatPrice(settings.shippingInsideDhaka)}</td>
            <td className="px-4 py-3">1–3 working days</td>
          </tr>
          <tr>
            <td className="px-4 py-3 font-semibold text-navy-800">Outside Dhaka</td>
            <td className="px-4 py-3">{formatPrice(settings.shippingOutsideDhaka)}</td>
            <td className="px-4 py-3">3–5 working days</td>
          </tr>
        </tbody>
      </table>
      <p className="px-4 py-3 text-xs text-slate-500 bg-slate-50/60 border-t border-slate-100">
        Free delivery on orders over {formatPrice(settings.freeShippingThreshold)}. Charges shown are current as of the date above and may change —
        the exact delivery fee for your order is always shown at checkout before you confirm.
      </p>
    </div>
  );
}

function buildSections(): LegalSection[] {
  return [
    {
      title: "1. Order Processing",
      body: (
        <>
          <p>Once an order is placed through our website, our team may contact the customer to confirm the order and delivery details where necessary.</p>
          <p>Orders are generally processed after successful order confirmation and/or payment verification.</p>
          <p>Our standard processing time is: <strong>1–2 business days</strong>.</p>
          <p>Orders placed on weekends, public holidays, or during special promotional periods may require additional processing time.</p>
        </>
      ),
    },
    {
      title: "2. Delivery Time",
      body: (
        <>
          <p>Estimated delivery time within Bangladesh:</p>
          <ul>
            <li>Inside Dhaka: 1–3 business days</li>
            <li>Outside Dhaka: 3–5 business days</li>
            <li>Remote or hard-to-reach areas: Additional time may be required.</li>
          </ul>
          <p>These are estimated delivery times and are not guaranteed delivery deadlines. Delivery may take longer during:</p>
          <ul>
            <li>Public holidays</li>
            <li>Government restrictions</li>
            <li>Natural disasters</li>
            <li>Severe weather</li>
            <li>National or regional disruptions</li>
            <li>Promotional campaigns</li>
            <li>Unexpected courier delays</li>
            <li>Product restocking</li>
            <li>Customs or import clearance</li>
            <li>Other circumstances beyond our reasonable control</li>
          </ul>
        </>
      ),
    },
    {
      title: "3. Imported Products",
      body: (
        <>
          <p>
            Some products sold through Global Shelf BD may be imported from countries such as Australia, the United Kingdom, United Arab Emirates,
            India, USA, Europe, Japan, Korea, and other markets.
          </p>
          <p>For imported products, delivery timelines may depend on:</p>
          <ul>
            <li>International shipping</li>
            <li>Customs clearance</li>
            <li>Regulatory approvals</li>
            <li>Port operations</li>
            <li>Import documentation</li>
            <li>Product availability</li>
            <li>Government requirements</li>
          </ul>
          <p>
            Where an imported product is marked as Pre-Order, Coming Soon, or otherwise identified as awaiting import, the estimated delivery
            timeline will be communicated separately.
          </p>
        </>
      ),
    },
    {
      title: "4. Delivery Charges",
      body: (
        <>
          <p>Delivery charges will be displayed or communicated to the customer before order confirmation, where applicable. Delivery charges may vary depending on:</p>
          <ul>
            <li>Delivery location</li>
            <li>Product size and weight</li>
            <li>Number of products</li>
            <li>Delivery method</li>
            <li>Special handling requirements</li>
          </ul>
          <p>Any applicable delivery charge will be added to the customer&apos;s order total.</p>
        </>
      ),
    },
    {
      title: "5. Delivery Areas",
      body: (
        <>
          <p>We currently aim to deliver across Bangladesh through our available delivery partners.</p>
          <p>Delivery availability may vary depending on the customer&apos;s location and the service coverage of our delivery partners.</p>
          <p>For locations where standard delivery is unavailable, we may contact the customer to discuss an alternative delivery arrangement.</p>
        </>
      ),
    },
    {
      title: "6. Address Accuracy",
      body: (
        <>
          <p>Customers are responsible for providing accurate and complete delivery information, including:</p>
          <ul>
            <li>Full name</li>
            <li>Mobile number</li>
            <li>House/Flat number</li>
            <li>Road/Street</li>
            <li>Area</li>
            <li>District</li>
            <li>Delivery instructions, where necessary</li>
          </ul>
          <p>
            Global Shelf BD will not be responsible for delays or failed delivery caused by incorrect, incomplete, or inaccurate information provided
            by the customer.
          </p>
          <p>If an order has already been dispatched, changing the delivery address may not be possible.</p>
        </>
      ),
    },
    {
      title: "7. Delivery Attempts",
      body: (
        <>
          <p>Our delivery partner may make reasonable attempts to deliver the order.</p>
          <p>
            If the customer is unavailable at the provided address or cannot be contacted, additional delivery attempts may result in additional
            charges or cancellation of the order.
          </p>
          <p>Where applicable, customers may be contacted by our delivery partner to arrange delivery.</p>
        </>
      ),
    },
    {
      title: "8. Receiving Your Order",
      body: (
        <>
          <p>Customers are encouraged to inspect the package at the time of delivery. Where possible, please check:</p>
          <ul>
            <li>Product name</li>
            <li>Quantity</li>
            <li>Packaging condition</li>
            <li>Seal condition</li>
            <li>Visible damage</li>
            <li>Expiry date, where applicable</li>
          </ul>
          <p>If the package appears seriously damaged or tampered with, please inform the delivery personnel and contact Global Shelf BD as soon as possible.</p>
        </>
      ),
    },
    {
      title: "9. Damaged or Incorrect Products",
      body: (
        <>
          <p>If you receive a product that is damaged, defective, incorrect, incomplete, or expired, please contact us within the time period specified in our Refund / Return Policy.</p>
          <p>For details, please refer to our <a href="/refund-policy">Refund / Return Policy</a>.</p>
        </>
      ),
    },
    {
      title: "10. Food, Baby & Personal Care Products",
      body: (
        <p>
          For food, baby products, cosmetics, personal care, and other sensitive products, customers should inspect the product immediately after
          delivery. Once a product has been opened, consumed, used, or its original seal has been broken, return eligibility may be affected except
          where the product is defective, damaged, incorrect, or otherwise covered by applicable consumer rights or our return policy.
        </p>
      ),
    },
    {
      title: "11. Cash on Delivery",
      body: (
        <>
          <p>Where Cash on Delivery (COD) is available, the customer must pay the full order amount to the delivery personnel at the time of delivery. COD availability may depend on:</p>
          <ul>
            <li>Location</li>
            <li>Product</li>
            <li>Order value</li>
            <li>Customer history</li>
            <li>Delivery partner</li>
            <li>Other operational conditions</li>
          </ul>
        </>
      ),
    },
    {
      title: "12. Online Payments",
      body: (
        <>
          <p>Where online payment is available, customers may use the payment methods displayed on our website.</p>
          <p>Payment processing may be handled by third-party payment service providers.</p>
          <p>
            Global Shelf BD does not store complete card or banking credentials unless specifically required and legally permitted for the operation
            of the relevant payment service.
          </p>
        </>
      ),
    },
    {
      title: "13. Failed Delivery",
      body: (
        <>
          <p>An order may be considered a failed delivery if:</p>
          <ul>
            <li>The customer cannot be contacted.</li>
            <li>The delivery address is incorrect.</li>
            <li>The customer refuses to accept the order without an eligible reason.</li>
            <li>The customer repeatedly remains unavailable.</li>
            <li>The delivery location is outside our service coverage.</li>
            <li>Other circumstances prevent successful delivery.</li>
          </ul>
          <p>Additional delivery charges may apply for re-delivery where the failed delivery resulted from customer-provided information or customer unavailability.</p>
        </>
      ),
    },
    {
      title: "14. Order Cancellation Before Dispatch",
      body: (
        <>
          <p>Customers may request cancellation before an order is dispatched. Once an order has been dispatched, cancellation may no longer be possible.</p>
          <p>Any applicable refund will be handled according to our <a href="/refund-policy">Refund / Return Policy</a> and the payment method used.</p>
        </>
      ),
    },
    {
      title: "15. Delays Beyond Our Control",
      body: (
        <p>
          Global Shelf BD will make reasonable efforts to deliver orders within the estimated time. However, we cannot be held responsible for delays
          caused by circumstances beyond our reasonable control, including customs clearance, government restrictions, natural disasters,
          transportation disruptions, strikes, courier disruptions, or other unforeseen events.
        </p>
      ),
    },
    {
      title: "16. International Shipping",
      body: (
        <>
          <p>At present, our primary online retail focus is Bangladesh.</p>
          <p>
            If international delivery becomes available, specific shipping charges, customs duties, taxes, import restrictions, and delivery terms
            will be communicated separately. Unless otherwise stated, the customer may be responsible for any destination-country duties, taxes, or
            regulatory charges associated with international delivery.
          </p>
        </>
      ),
    },
  ];
}

export default async function ShippingPolicyPage() {
  const { settings } = await fetchSite();
  const sections = buildSections();

  return (
    <LegalPageLayout
      title="Shipping & Delivery Policy"
      lastUpdated={LAST_UPDATED}
      intro={
        <>
          <p>
            At Global Shelf BD, we aim to make your shopping experience simple, reliable, and convenient. We carefully pack and dispatch our
            products through trusted delivery partners to ensure that your order reaches you safely.
          </p>
          <p>
            As an importer, retailer, and online shopping platform, we may offer products that are sourced locally as well as imported from
            different countries. Delivery timelines may therefore vary depending on product availability, location, customs procedures, and other
            circumstances.
          </p>
          <QuickFacts settings={settings} />
        </>
      }
      sections={sections}
      footer={<ContactDetailsBlock settings={settings} />}
    />
  );
}
