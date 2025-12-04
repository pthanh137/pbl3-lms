import { FaFacebookF, FaLinkedinIn, FaTwitter, FaYoutube, FaInstagram, FaTiktok } from 'react-icons/fa';

/**
 * Footer Component
 * 
 * Coursera-inspired footer with multiple sections:
 * - Top footer: 4 columns (Skills, Certificates, Industries, Career Resources)
 * - Second footer: 3 columns (Coursera, Community, More)
 * - Social media icons
 * - Copyright
 */
const Footer = () => {
  return (
    <footer className="bg-[#f7f8fa] border-t border-gray-200">
      {/* Top Footer - 4 Columns */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1 - Skills */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4 text-sm">Skills</h3>
            <ul className="space-y-3">
              <li>
                <a href="/browse?category=ai" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Artificial Intelligence (AI)
                </a>
              </li>
              <li>
                <a href="/browse?category=cybersecurity" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Cybersecurity
                </a>
              </li>
              <li>
                <a href="/browse?category=data-analytics" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Data Analytics
                </a>
              </li>
              <li>
                <a href="/browse?category=digital-marketing" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Digital Marketing
                </a>
              </li>
              <li>
                <a href="/browse?category=english" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  English Speaking
                </a>
              </li>
              <li>
                <a href="/browse?category=genai" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Generative AI (GenAI)
                </a>
              </li>
              <li>
                <a href="/browse?category=excel" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Microsoft Excel
                </a>
              </li>
              <li>
                <a href="/browse?category=powerbi" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Microsoft Power BI
                </a>
              </li>
              <li>
                <a href="/browse?category=project-management" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Project Management
                </a>
              </li>
              <li>
                <a href="/browse?category=python" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Python
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2 - Certificates & Programs */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4 text-sm">Certificates & Programs</h3>
            <ul className="space-y-3">
              <li>
                <a href="/browse?certificate=google-cybersecurity" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Google Cybersecurity Certificate
                </a>
              </li>
              <li>
                <a href="/browse?certificate=google-data-analytics" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Google Data Analytics Certificate
                </a>
              </li>
              <li>
                <a href="/browse?certificate=google-it-support" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Google IT Support Certificate
                </a>
              </li>
              <li>
                <a href="/browse?certificate=google-project-management" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Google Project Management Certificate
                </a>
              </li>
              <li>
                <a href="/browse?certificate=google-ux-design" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Google UX Design Certificate
                </a>
              </li>
              <li>
                <a href="/browse?certificate=ibm-data-analyst" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  IBM Data Analyst Certificate
                </a>
              </li>
              <li>
                <a href="/browse?certificate=ibm-data-science" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  IBM Data Science Certificate
                </a>
              </li>
              <li>
                <a href="/browse?certificate=machine-learning" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Machine Learning Certificate
                </a>
              </li>
              <li>
                <a href="/browse?certificate=microsoft-powerbi" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Microsoft Power BI Analyst Certificate
                </a>
              </li>
              <li>
                <a href="/browse?certificate=ui-ux-design" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  UI/UX Design Certificate
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3 - Industries & Careers */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4 text-sm">Industries & Careers</h3>
            <ul className="space-y-3">
              <li>
                <a href="/browse?industry=business" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Business
                </a>
              </li>
              <li>
                <a href="/browse?industry=computer-science" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Computer Science
                </a>
              </li>
              <li>
                <a href="/browse?industry=data-science" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Data Science
                </a>
              </li>
              <li>
                <a href="/browse?industry=education" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Education & Teaching
                </a>
              </li>
              <li>
                <a href="/browse?industry=engineering" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Engineering
                </a>
              </li>
              <li>
                <a href="/browse?industry=finance" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Finance
                </a>
              </li>
              <li>
                <a href="/browse?industry=healthcare" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Healthcare
                </a>
              </li>
              <li>
                <a href="/browse?industry=hr" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Human Resources (HR)
                </a>
              </li>
              <li>
                <a href="/browse?industry=it" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Information Technology (IT)
                </a>
              </li>
              <li>
                <a href="/browse?industry=marketing" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Marketing
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4 - Career Resources */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4 text-sm">Career Resources</h3>
            <ul className="space-y-3">
              <li>
                <a href="/resources/career-aptitude-test" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Career Aptitude Test
                </a>
              </li>
              <li>
                <a href="/resources/interview-strengths-weaknesses" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Strengths & Weaknesses for Interviews
                </a>
              </li>
              <li>
                <a href="/resources/high-income-skills" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  High-Income Skills to Learn
                </a>
              </li>
              <li>
                <a href="/resources/cryptocurrency" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  How Cryptocurrency Works
                </a>
              </li>
              <li>
                <a href="/resources/google-sheets" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Duplicate Highlight in Google Sheets
                </a>
              </li>
              <li>
                <a href="/resources/learn-ai" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  How to Learn Artificial Intelligence
                </a>
              </li>
              <li>
                <a href="/resources/cybersecurity-certifications" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Popular Cybersecurity Certifications
                </a>
              </li>
              <li>
                <a href="/resources/pmp-certification" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Preparing for PMP Certification
                </a>
              </li>
              <li>
                <a href="/resources/job-signs" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  Signs You'll Get the Job
                </a>
              </li>
              <li>
                <a href="/resources/what-is-ai" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                  What Is Artificial Intelligence?
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Second Footer Section - 3 Columns */}
      <div className="border-t border-gray-300 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Column 1 - Coursera */}
            <div>
              <h3 className="font-bold text-slate-900 mb-4 text-sm">Coursera</h3>
              <ul className="space-y-3">
                <li>
                  <a href="/about" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="/what-we-offer" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    What We Offer
                  </a>
                </li>
                <li>
                  <a href="/leadership" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Leadership
                  </a>
                </li>
                <li>
                  <a href="/careers" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="/catalog" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Catalog
                  </a>
                </li>
                <li>
                  <a href="/coursera-plus" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Coursera Plus
                  </a>
                </li>
                <li>
                  <a href="/professional-certificates" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Professional Certificates
                  </a>
                </li>
                <li>
                  <a href="/degrees" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Degrees
                  </a>
                </li>
                <li>
                  <a href="/enterprise" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    For Enterprise
                  </a>
                </li>
                <li>
                  <a href="/government" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    For Government
                  </a>
                </li>
                <li>
                  <a href="/campus" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    For Campus
                  </a>
                </li>
                <li>
                  <a href="/become-partner" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Become a Partner
                  </a>
                </li>
                <li>
                  <a href="/social-impact" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Social Impact
                  </a>
                </li>
                <li>
                  <a href="/free-courses" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Free Courses
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 2 - Community */}
            <div>
              <h3 className="font-bold text-slate-900 mb-4 text-sm">Community</h3>
              <ul className="space-y-3">
                <li>
                  <a href="/community/learners" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Learners
                  </a>
                </li>
                <li>
                  <a href="/community/partners" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Partners
                  </a>
                </li>
                <li>
                  <a href="/community/beta-testers" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Beta Testers
                  </a>
                </li>
                <li>
                  <a href="/blog" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="/podcast" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    The LMS Podcast
                  </a>
                </li>
                <li>
                  <a href="/tech-blog" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Tech Blog
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3 - More */}
            <div>
              <h3 className="font-bold text-slate-900 mb-4 text-sm">More</h3>
              <ul className="space-y-3">
                <li>
                  <a href="/press" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Press
                  </a>
                </li>
                <li>
                  <a href="/investors" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Investors
                  </a>
                </li>
                <li>
                  <a href="/terms" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="/help" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Help
                  </a>
                </li>
                <li>
                  <a href="/accessibility" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Accessibility
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="/articles" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Articles
                  </a>
                </li>
                <li>
                  <a href="/affiliates" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Affiliates
                  </a>
                </li>
                <li>
                  <a href="/cookie-preferences" className="text-slate-600 hover:text-[#0056d2] text-sm transition-colors">
                    Cookie Preferences
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Social Media Icons & Copyright */}
      <div className="border-t border-gray-300 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Copyright */}
            <div className="text-center md:text-left">
              <p className="text-slate-600 text-sm">
                © 2025 LMS Inc. All rights reserved.
              </p>
            </div>

            {/* Social Media Icons */}
            <div className="flex items-center gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-900 hover:text-[#0056d2] transition-colors"
                aria-label="Facebook"
              >
                <FaFacebookF size={24} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-900 hover:text-[#0056d2] transition-colors"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn size={24} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-900 hover:text-[#0056d2] transition-colors"
                aria-label="Twitter"
              >
                <FaTwitter size={24} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-900 hover:text-[#0056d2] transition-colors"
                aria-label="YouTube"
              >
                <FaYoutube size={24} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-900 hover:text-[#0056d2] transition-colors"
                aria-label="Instagram"
              >
                <FaInstagram size={24} />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-900 hover:text-[#0056d2] transition-colors"
                aria-label="TikTok"
              >
                <FaTiktok size={24} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

