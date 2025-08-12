import React from 'react';

export default function RefundPolicyPage() {
  return (
    <div className="antialiased">
      {/* Custom CSS for the page */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Google Fonts - Inter */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        /* Font Awesome for icons */
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');

        body {
            font-family: Inter, sans-serif;
            background-color: #0d1117;
            color: #e2e8f0;
            overflow-x: hidden;
        }
        .header-bg {
            background-image: url('image_ac51dc.jpg');
            background-size: cover;
            background-position: center;
            position: relative;
            overflow: hidden;
            background-attachment: fixed;
        }
        .header-bg::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.95) 100%);
            z-index: 1;
        }
        .header-content {
            position: relative;
            z-index: 3;
        }
        .glowing-lines-container {
            position: absolute;
            inset: 0;
            z-index: 2;
            pointer-events: none;
            overflow: hidden;
        }
        .glowing-line {
            position: absolute;
            width: 2px;
            height: 100%;
            background: linear-gradient(to bottom, transparent, #4f46e5, transparent);
            animation: glow-move 4s ease-in-out infinite;
        }
        .glowing-line:nth-child(1) { left: 10%; animation-delay: 0s; }
        .glowing-line:nth-child(2) { left: 30%; animation-delay: 1s; }
        .glowing-line:nth-child(3) { left: 70%; animation-delay: 2s; }
        .glowing-line:nth-child(4) { left: 90%; animation-delay: 3s; }
        @keyframes glow-move {
            0%, 100% { opacity: 0.3; transform: translateY(-20px); }
            50% { opacity: 1; transform: translateY(20px); }
        }
        .text-glow {
            text-shadow: 0 0 20px rgba(79, 70, 229, 0.6);
        }
        .content-card {
            background: linear-gradient(135deg, rgba(31, 41, 55, 0.9) 0%, rgba(17, 24, 39, 0.95) 100%);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(75, 85, 99, 0.3);
            border-radius: 1rem;
            padding: 3rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .content-card h2 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #ffffff;
            margin-bottom: 1.5rem;
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .content-card h3 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #e2e8f0;
            margin-top: 2rem;
            margin-bottom: 1rem;
            border-left: 4px solid #4f46e5;
            padding-left: 1rem;
        }
        .content-card p {
            line-height: 1.8;
            margin-bottom: 1.5rem;
            color: #d1d5db;
        }
        .content-card ul {
            margin-left: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .content-card li {
            margin-bottom: 0.75rem;
            color: #d1d5db;
            line-height: 1.7;
        }
        .highlight-box {
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
            border: 1px solid rgba(34, 197, 94, 0.3);
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin: 1.5rem 0;
        }
        .warning-box {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin: 1.5rem 0;
        }
        .last-updated {
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid rgba(75, 85, 99, 0.3);
            text-align: center;
            color: #9ca3af;
        }
        .last-updated a {
            color: #4f46e5;
            text-decoration: underline;
        }
        .last-updated a:hover {
            color: #6366f1;
        }
        .cta-footer {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        }
        .btn-primary {
            transition: all 0.3s ease;
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }
      `}} />

      {/* Hero Section */}
      <header className="header-bg py-20 text-center text-white rounded-b-xl shadow-lg">
          <div className="glowing-lines-container">
              <div className="glowing-line"></div>
              <div className="glowing-line"></div>
              <div className="glowing-line"></div>
              <div className="glowing-line"></div>
          </div>
          <div className="header-content container mx-auto px-4">
              <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight text-glow">
                  Refund <span className="text-indigo-400">Policy</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
                  Clear and transparent refund conditions for all our services.
              </p>
          </div>
      </header>

      {/* Content Section */}
      <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4 max-w-5xl">
              <div className="content-card">
                  <h2 className="text-center">Refund Policy</h2>
                  <p className="text-center text-gray-400 mb-8">Last Updated: January 25, 2025</p>

                  <div className="highlight-box">
                      <h3 className="text-green-400 mb-3"><i className="fas fa-check-circle mr-2"></i>Full Refund Guarantee</h3>
                      <p className="mb-0">We offer <strong>100% full refunds</strong> for orders that haven't started yet. No questions asked, no conditions applied.</p>
                  </div>

                  <h3>1. Pre-Service Refunds</h3>
                  <p>If your order has not yet been assigned to a booster or work has not commenced, you are entitled to a complete refund of all payments made. This includes:</p>
                  <ul>
                      <li>Orders placed but not yet accepted by our team</li>
                      <li>Orders in queue waiting for booster assignment</li>
                      <li>Orders where no progress has been made on your account</li>
                      <li>Cancellations requested within the first hour of order placement</li>
                  </ul>

                  <h3>2. Partial Service Refunds</h3>
                  <p>Once work has begun on your order, refunds are calculated based on the progress completed:</p>
                  <ul>
                      <li><strong>0-25% Progress:</strong> 75% refund available</li>
                      <li><strong>26-50% Progress:</strong> 50% refund available</li>
                      <li><strong>51-75% Progress:</strong> 25% refund available</li>
                      <li><strong>76-100% Progress:</strong> No refund available (service substantially completed)</li>
                  </ul>

                  <h3>3. Service Quality Issues</h3>
                  <p>If you experience quality issues with our service, we offer the following remedies:</p>
                  <ul>
                      <li><strong>Service Redo:</strong> We'll complete the service again at no additional cost</li>
                      <li><strong>Partial Refund:</strong> Based on the extent of the quality issue</li>
                      <li><strong>Account Recovery:</strong> If any issues arise with your account due to our service</li>
                      <li><strong>Compensation:</strong> Additional services or credits for significant inconveniences</li>
                  </ul>

                  <div className="warning-box">
                      <h3 className="text-red-400 mb-3"><i className="fas fa-exclamation-triangle mr-2"></i>Non-Refundable Situations</h3>
                      <p className="mb-2">Refunds are not available in the following circumstances:</p>
                      <ul className="mb-0">
                          <li>Services completed as requested and delivered successfully</li>
                          <li>Account bans or suspensions due to customer's prior violations</li>
                          <li>Customer-provided incorrect account information</li>
                          <li>Customer interference during service completion</li>
                          <li>Requests made more than 7 days after service completion</li>
                      </ul>
                  </div>

                  <h3>4. Refund Process</h3>
                  <p>To request a refund, please follow these steps:</p>
                  <ul>
                      <li><strong>Step 1:</strong> Contact our support team via <a href="https://discord.gg/s88WnxvG" target="_blank" className="text-blue-400 hover:text-blue-300 underline">Discord</a> or <a href="/contact" className="text-blue-400 hover:text-blue-300 underline">contact form</a></li>
                      <li><strong>Step 2:</strong> Provide your order ID and reason for refund request</li>
                      <li><strong>Step 3:</strong> Our team will review your request within 24 hours</li>
                      <li><strong>Step 4:</strong> If approved, refunds are processed within 3-5 business days</li>
                      <li><strong>Step 5:</strong> You'll receive confirmation once the refund is completed</li>
                  </ul>

                  <h3>5. Payment Method Refunds</h3>
                  <p>Refunds are processed back to the original payment method used:</p>
                  <ul>
                      <li><strong>Cryptocurrency:</strong> Refunded to the same wallet address (if possible)</li>
                      <li><strong>PayPal:</strong> 1-3 business days processing time</li>
                      <li><strong>Credit/Debit Cards:</strong> 3-7 business days processing time</li>
                      <li><strong>Bank Transfers:</strong> 5-10 business days processing time</li>
                  </ul>

                  <h3>6. Dispute Resolution</h3>
                  <p>If you disagree with our refund decision, you may:</p>
                  <ul>
                      <li>Request a review by our senior management team</li>
                      <li>Provide additional evidence or documentation</li>
                      <li>Escalate through our formal dispute resolution process</li>
                      <li>Seek mediation through appropriate consumer protection agencies</li>
                  </ul>

                  <h3>7. Emergency Refunds</h3>
                  <p>In exceptional circumstances (such as account security breaches or unauthorized access), we may process emergency refunds outside of normal procedures. These are handled on a case-by-case basis with priority support.</p>

                  <div className="highlight-box">
                      <h3 className="text-blue-400 mb-3"><i className="fas fa-info-circle mr-2"></i>Customer Satisfaction Guarantee</h3>
                      <p className="mb-0">Your satisfaction is our priority. If you're not completely satisfied with our service, we'll work with you to find a solution that meets your needs, whether that's a service redo, partial refund, or other appropriate remedy.</p>
                  </div>

                  <p className="last-updated">For any questions about our refund policy or to request a refund, please <a href="/contact">contact our support team</a>. We're here to help ensure your complete satisfaction with our services.</p>
              </div>
          </div>
      </section>

      {/* Call to Action Footer */}
      <section className="cta-footer text-white py-12 text-center rounded-t-xl mx-auto max-w-7xl mt-12 shadow-xl">
          <div className="container mx-auto px-4">
              <h2 className="text-4xl font-bold mb-4">Questions About Refunds?</h2>
              <p className="text-xl mb-8">Our support team is ready to help clarify any concerns you may have.</p>
              <a href="https://discord.gg/s88WnxvG" target="_blank" className="btn-primary inline-block bg-white text-indigo-700 hover:bg-gray-200 text-xl py-3 px-8">
                  Contact Support <i className="fas fa-headset ml-2"></i>
              </a>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-10 text-gray-400 text-sm">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                  <h3 className="text-lg font-bold text-white mb-4">Gearscore</h3>
                  <p>Your gateway to professional gaming boosting services. We aim to provide the best experience for gamers.</p>
              </div>
              <div>
                  <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
                  <ul>
                      <li className="mb-2"><a href="/" className="hover:text-white">Home</a></li>
                      <li className="mb-2"><a href="/games" className="hover:text-white">Games</a></li>
                      <li className="mb-2"><a href="/#services" className="hover:text-white">Services</a></li>
                      <li className="mb-2"><a href="/#about" className="hover:text-white">About Us</a></li>
                  </ul>
              </div>
              <div>
                  <h3 className="text-lg font-bold text-white mb-4">Support</h3>
                  <ul>
                      <li className="mb-2"><a href="/faq" className="hover:text-white">FAQ</a></li>
                      <li className="mb-2"><a href="/contact" className="hover:text-white">Contact Us</a></li>
                      <li className="mb-2"><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
                      <li className="mb-2"><a href="/refund-policy" className="hover:text-white">Refund Policy</a></li>
                      <li className="mb-2"><a href="/terms" className="hover:text-white">Terms of Service</a></li>
                  </ul>
              </div>
              <div>
                  <h3 className="text-lg font-bold text-white mb-4">Follow Us</h3>
                  <div className="flex space-x-4 text-2xl mb-4">
                      <a href="https://www.instagram.com/gearscoreboosting/" target="_blank" className="hover:text-white transition-colors duration-300"><i className="fab fa-instagram"></i></a>
                      <a href="https://discord.gg/s88WnxvG" target="_blank" className="hover:text-white transition-colors duration-300"><i className="fab fa-discord"></i></a>
                  </div>
                  <div className="mt-4">
                      <h4 className="text-md font-semibold text-white mb-2">Contact</h4>
                      <p className="text-gray-400">support@gear-score.com</p>
                  </div>
              </div>
          </div>
          <div className="text-center mt-10 border-t border-gray-700 pt-8">
              {/* Logo */}
              <div className="mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                      <i className="fas fa-cog text-white text-3xl"></i>
                      <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text text-2xl font-bold">Gearscore</span>
                  </div>
              </div>
              <p>&copy; 2025 Gearscore. All rights reserved.</p>
          </div>
      </footer>
    </div>
  );
}