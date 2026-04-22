import { Link } from 'react-router-dom'

const DOCS = {
  privacy: {
    title: 'Privacy policy',
    paragraphs: [
      'carpharmacy respects your privacy. This page describes how we collect, use, and protect personal information when you use our website and services.',
      'We may collect information you provide (such as name, email, and phone) when you register, contact us, or place orders. We use this information to fulfil requests, improve our services, and communicate with you where appropriate.',
      'We do not sell your personal data. We may share information with service providers who assist our operations, subject to confidentiality obligations, or when required by law.',
      'You may contact us to access, correct, or delete certain personal information, subject to applicable law.',
    ],
  },
  terms: {
    title: 'Terms of use',
    paragraphs: [
      'By accessing or using the carpharmacy website and services, you agree to these terms. If you do not agree, please do not use the site.',
      'Content on this site is for general information. Product availability, pricing, and specifications may change without notice. We strive for accuracy but do not warrant that all information is complete or error-free.',
      'You agree to use the site lawfully and not to misuse our systems, interfere with other users, or attempt unauthorized access.',
      'We may update these terms from time to time. Continued use after changes constitutes acceptance of the revised terms.',
    ],
  },
  returns: {
    title: 'Returns',
    paragraphs: [
      'We want you to be satisfied with your purchase. Eligible items may be returned in accordance with the return window and conditions stated at the time of order.',
      'Items should be unused, in original packaging where applicable, and accompanied by proof of purchase. Certain categories (e.g. electrical items once installed) may be excluded or subject to restocking fees as disclosed at checkout.',
      'To initiate a return, contact our support team with your order details. Approved returns will be processed per our refund policy.',
    ],
  },
  warranty: {
    title: 'Warranty',
    paragraphs: [
      'Warranty coverage depends on the product and manufacturer. OEM and branded parts may carry manufacturer warranties as described on the product page or included documentation.',
      'carpharmacy will assist with warranty claims for eligible products sold through our platform, in line with supplier and manufacturer policies.',
      'Warranty typically covers defects in materials or workmanship under normal use. It does not cover misuse, accident, improper installation, or normal wear unless stated otherwise.',
      'For warranty questions, contact us with your order number and a description of the issue.',
    ],
  },
}

export function PolicyDocumentPage({ kind }) {
  const doc = DOCS[kind]
  if (!doc) return null

  return (
    <div className="min-h-svh bg-slate px-4 pb-20 pt-[calc(var(--nav-h)+1.5rem)] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="font-sans text-sm font-semibold text-accent transition-colors hover:text-fog"
        >
          ← Back to home
        </Link>
        <h1 className="mt-8 font-display text-3xl font-black uppercase tracking-tight text-fog sm:text-4xl">
          {doc.title}
        </h1>
        <div className="mt-10 space-y-6 font-sans text-base leading-relaxed text-mist">
          {doc.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
