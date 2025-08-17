import React from "react";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 text-foreground">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4">
        This Privacy Policy explains how MedBooks collects, uses, and protects your personal
        information when you use our website and services.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. Information We Collect</h2>
      <p className="mb-4">
        We may collect your name, email address, payment information, and browsing activity on our site.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. How We Use Your Information</h2>
      <p className="mb-4">
        We use your information to provide access to digital books, manage your subscription,
        process payments, and improve our services.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Data Protection</h2>
      <p className="mb-4">
        We take appropriate security measures to protect your personal information from unauthorized
        access, alteration, disclosure, or destruction.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Third-Party Services</h2>
      <p className="mb-4">
        We may use third-party providers (such as payment processors) who have their own privacy policies.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, contact us at{" "}
        <a href="mailto:jogindo@gmail.com" className="text-primary underline">
          jogindo@gmail.com
        </a>.
      </p>
    </div>
  );
};

export default PrivacyPolicy;
