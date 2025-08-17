// src/pages/TermsOfService.tsx
import React from "react";

const TermsOfService: React.FC = () => {
  return (
    <main className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
        <p>
          By accessing and using MedBooks, you agree to comply with and be bound
          by these Terms of Service.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">2. Use of the Service</h2>
        <p>
          You agree to use the service for lawful purposes and not to violate any
          applicable laws or regulations.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">3. Intellectual Property</h2>
        <p>
          All content available on MedBooks is the intellectual property of Dr.
          Ogindo and/or licensed parties. You may not reproduce, distribute, or
          create derivative works without permission.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">4. User Accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account
          credentials and for all activities under your account.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">5. Termination</h2>
        <p>
          We reserve the right to suspend or terminate your access to MedBooks for
          violations of these terms.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">6. Disclaimer of Warranties</h2>
        <p>
          The service is provided "as is" without warranties of any kind.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">7. Limitation of Liability</h2>
        <p>
          MedBooks and its affiliates shall not be liable for any damages arising
          from use of the service.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">8. Changes to Terms</h2>
        <p>
          We may update these Terms of Service at any time. Continued use indicates
          acceptance of changes.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
        <p>
          If you have questions about these terms, please contact us at{" "}
          <a href="mailto:jogindo@gmail.com" className="text-primary underline">
            jogindo@gmail.com
          </a>
          .
        </p>
      </section>
    </main>
  );
};

export default TermsOfService;
