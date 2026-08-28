import LegalLayout from "@/components/LegalLayout";

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service">
      <p>Online ordering from Alenna Cafe Takanini is for prepaid pickup only. We do not deliver. Placing an order means you agree to pay before the kitchen starts, collect at the chosen slot, and check allergen information before ordering.</p>
      <p>Prices are in New Zealand dollars and include GST. Menu items, modifiers and availability can change during the day. If an item sells out after you pay, we will contact you and offer a swap or refund.</p>
      <p>Pickup slots are capacity-limited. If you arrive late, food may be held for a reasonable time but quality can change. The cafe may pause online ordering when the kitchen is at capacity.</p>
      <p>Verification codes confirm your phone or email. Do not share codes. Promotional codes and loyalty points cannot be exchanged for cash.</p>
      <p>These terms sit alongside the Consumer Guarantees Act 1993. Nothing here limits rights you cannot contract out of.</p>
    </LegalLayout>
  );
}
