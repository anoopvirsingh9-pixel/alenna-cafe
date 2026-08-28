import LegalLayout from "@/components/LegalLayout";

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>Alenna Cafe, 9/226 Great South Road, Takanini, Auckland 2112, collects only the information needed to prepare and confirm prepaid pickup orders.</p>
      <p>We store your name, email, phone number, order items, pickup time, payment reference, and optional kitchen notes. We do not store full card numbers. Card details are validated to take payment and only a card brand plus last four digits are kept with the payment record.</p>
      <p>Information is used to verify it is you, process payment, prepare food, send order updates, operate the Alenna Rewards programme, and improve service. We do not sell customer lists.</p>
      <p>Staff access the order dashboard with a protected access code. You may request a copy or deletion of your customer record by emailing or calling the cafe. We retain order records as required for accounting and GST.</p>
      <p>This policy is designed to align with the New Zealand Privacy Act 2020. Contact +64 9 299 2916 for privacy requests.</p>
    </LegalLayout>
  );
}
