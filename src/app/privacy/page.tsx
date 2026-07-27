import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, Eye, Database, FileText, Mail } from 'lucide-react';
import { RabbitLogo } from '@/components/rabbit-logo';

export const metadata = {
  title: 'Privacy Policy | Blu_bot',
  description: 'Privacy Policy and data protection terms for Blu_bot WhatsApp AI Customer Assistant.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = '27 July 2026';

  return (
    <div className="min-h-screen bg-[#07080F] text-[#E2E8F0] selection:bg-[#4F6EF7]/30">
      {/* Top Header Bar */}
      <header className="border-b border-[#1E2340] bg-[#07080F]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <RabbitLogo className="w-8 h-8 text-[#4F6EF7]" />
            <span className="font-headline font-bold text-lg text-white tracking-tight">
              Blu<span className="text-[#4F6EF7]">_bot</span>
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-white transition-colors bg-[#0D0F1A] border border-[#1E2340] px-3 py-1.5 rounded-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to App
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        {/* Banner Section */}
        <div className="liquid-glass-panel p-8 sm:p-10 relative overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-[#4F6EF7]/10 blur-3xl rounded-full pointer-events-none" />
          <div className="flex items-center gap-2.5 text-[#22D3A0] text-xs font-mono font-semibold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            Data Protection & Meta Compliance
          </div>
          <h1 className="text-3xl sm:text-4xl font-headline font-bold text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#94A3B8] max-w-2xl leading-relaxed">
            Blu_bot is committed to protecting your privacy and ensuring full security when interacting with our AI platform and Meta WhatsApp Cloud API integrations.
          </p>
          <p className="text-xs font-mono text-[#64748B] pt-2 border-t border-[#1E2340]">
            Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Policy Content Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-[#CBD5E1]">
          {/* Section 1 */}
          <section className="liquid-glass-panel p-6 sm:p-8 space-y-3 border-[#1E2340]">
            <div className="flex items-center gap-2 text-white font-headline font-bold text-lg">
              <Eye className="w-5 h-5 text-[#4F6EF7]" />
              1. Information We Collect
            </div>
            <p>
              When you use Blu_bot or integrate your WhatsApp Business Account, we collect only the information necessary to provide automated AI messaging and customer support:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-[#94A3B8] pl-2">
              <li><strong className="text-white">Account Details:</strong> Business name, email address, notification phone number, and subscription tier.</li>
              <li><strong className="text-white">WhatsApp Integration Metadata:</strong> Meta Phone Number ID, WhatsApp Business Account ID (WABA ID), and system user tokens.</li>
              <li><strong className="text-white">Conversations & Messages:</strong> Messages sent between customers and your WhatsApp Business number to generate AI responses and populate your dashboard activity logs.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="liquid-glass-panel p-6 sm:p-8 space-y-3 border-[#1E2340]">
            <div className="flex items-center gap-2 text-white font-headline font-bold text-lg">
              <Database className="w-5 h-5 text-[#22D3A0]" />
              2. How We Use Your Information
            </div>
            <p>We process collected data strictly for the following purposes:</p>
            <ul className="list-disc list-inside space-y-1.5 text-[#94A3B8] pl-2">
              <li>Generating intelligent, automated AI replies for incoming customer inquiries on WhatsApp.</li>
              <li>Displaying real-time customer conversation logs and audit metrics on your Blu_bot dashboard.</li>
              <li>Notifying business owners of human escalation requests or order inquiries.</li>
              <li>Ensuring platform security, monitoring quota usage, and preventing spam or abuse.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="liquid-glass-panel p-6 sm:p-8 space-y-3 border-[#1E2340]">
            <div className="flex items-center gap-2 text-white font-headline font-bold text-lg">
              <Lock className="w-5 h-5 text-[#A78BFA]" />
              3. WhatsApp Cloud API & Meta Policy Compliance
            </div>
            <p>
              Blu_bot integrates directly with the official Meta WhatsApp Cloud API (`graph.facebook.com`). We adhere strictly to Meta Developer Data Policies:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-[#94A3B8] pl-2">
              <li>We <strong className="text-white">never sell</strong>, rent, or trade customer data or messaging contents to third parties.</li>
              <li>Access tokens and API credentials are stored securely with strict database access policies.</li>
              <li>Message data is used exclusively to facilitate customer communication for your business.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="liquid-glass-panel p-6 sm:p-8 space-y-3 border-[#1E2340]">
            <div className="flex items-center gap-2 text-white font-headline font-bold text-lg">
              <ShieldCheck className="w-5 h-5 text-[#38BDF8]" />
              4. Data Security & Storage
            </div>
            <p>
              All data transmitted to and from Blu_bot is encrypted in transit using industry-standard TLS/SSL encryption. Data stored in our database is secured with Row Level Security (RLS) policies ensuring each tenant can access only their authorized business assets.
            </p>
          </section>

          {/* Section 5 */}
          <section className="liquid-glass-panel p-6 sm:p-8 space-y-3 border-[#1E2340]">
            <div className="flex items-center gap-2 text-white font-headline font-bold text-lg">
              <FileText className="w-5 h-5 text-[#F5A623]" />
              5. User Rights & Data Deletion
            </div>
            <p>
              You maintain full control over your business data. You may disconnect your WhatsApp Cloud API integration or request complete deletion of your business records and conversation logs at any time by contacting support or disconnecting from your settings panel.
            </p>
          </section>

          {/* Section 6 */}
          <section className="liquid-glass-panel p-6 sm:p-8 space-y-3 border-[#1E2340]">
            <div className="flex items-center gap-2 text-white font-headline font-bold text-lg">
              <Mail className="w-5 h-5 text-[#4F6EF7]" />
              6. Contact Us
            </div>
            <p>
              If you have any questions, concerns, or data requests regarding this Privacy Policy, please reach out to our privacy compliance team:
            </p>
            <div className="bg-[#07080F] border border-[#1E2340] rounded-xl p-4 font-mono text-xs text-[#94A3B8] space-y-1">
              <p><strong className="text-white">Email:</strong> privacy@blubot.app</p>
              <p><strong className="text-white">Platform URL:</strong> https://blu-mauve-theta.vercel.app</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="text-center py-6 text-xs text-[#64748B] border-t border-[#1E2340] space-y-2">
          <p>© {new Date().getFullYear()} Blu_bot. All rights reserved.</p>
          <div className="flex justify-center gap-4 text-[#94A3B8]">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
