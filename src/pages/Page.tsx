import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import Markdown from 'react-markdown';

interface PageProps {
  siteContent: {
    contactUs: string;
    refundPolicy: string;
    privacyPolicy: string;
    termsOfService: string;
    faq: string;
  };
}

export const Page: React.FC<PageProps> = ({ siteContent }) => {
  const { pageId } = useParams<{ pageId: string }>();

  let title = '';
  let content = '';

  switch (pageId) {
    case 'contact':
      title = 'Contact Us';
      content = siteContent.contactUs;
      break;
    case 'refund':
      title = 'Refund Policy';
      content = siteContent.refundPolicy;
      break;
    case 'privacy':
      title = 'Privacy Policy';
      content = siteContent.privacyPolicy;
      break;
    case 'terms':
      title = 'Terms of Service';
      content = siteContent.termsOfService;
      break;
    case 'faq':
      title = 'FAQ';
      content = siteContent.faq;
      break;
    default:
      return <Navigate to="/" />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 min-h-[60vh]">
      <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-gray-100">
        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-8 pb-8 border-b border-gray-100">
          {title}
        </h1>
        <div className="prose prose-indigo max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
          {content ? <Markdown>{content}</Markdown> : 'Content coming soon...'}
        </div>
      </div>
    </div>
  );
};
